import { Request, Response } from 'express';
import mongoose from 'mongoose';
import TrainingAssignment, { IContentProgress } from '../models/TrainingAssignment';
import TrainingContent, { ITrainingContent } from '../models/TrainingContent';
import Training from '../models/Training';
import Exam from '../models/Exam';
import Certificate from '../models/Certificate';
import { User } from '../models/User';
import { Tenant } from '../models/Tenant';
import { createNotification } from '../services/notificationService';
import { v4 as uuidv4 } from 'uuid';

// Get all training assignments for the current user
export const getMyAssignments = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const tenantId = (req as any).user.tenantId;
    const { status } = req.query;

    const filter: any = { tenantId, userId };
    if (status) {
      filter.status = status;
    }

    const assignments = await TrainingAssignment.find(filter)
      .populate('trainingId', 'title description category trainingType priority duration')
      .populate('assignedBy', 'firstName lastName')
      .sort({ dueDate: 1 });

    res.json({ success: true, data: assignments });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get a specific assignment with full details
export const getAssignmentDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;
    const tenantId = (req as any).user.tenantId;

    const assignment = await TrainingAssignment.findOne({ _id: id, tenantId, userId })
      .populate('trainingId')
      .populate('assignedBy', 'firstName lastName email');

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    // Get training content
    const content = await TrainingContent.find({ trainingId: assignment.trainingId })
      .sort({ order: 1 });

    // Get exam if exists
    const exam = await Exam.findOne({ trainingId: assignment.trainingId, isActive: true })
      .select('-questions.correctAnswers');

    res.json({
      success: true,
      data: {
        assignment,
        content,
        exam: exam ? { id: exam._id, title: exam.title, passingScore: exam.passingScore, timeLimit: exam.timeLimit } : null,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Assign training to users
export const assignTraining = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user.tenantId;
    const assignedBy = (req as any).user.id;
    const { trainingId, userIds, dueDate, roleFilter } = req.body;

    // Get training details
    const training = await Training.findOne({ _id: trainingId, tenantId });
    if (!training) {
      return res.status(404).json({ success: false, message: 'Training not found' });
    }

    // Get tenant info for email
    const tenant = await Tenant.findById(tenantId);
    const assigner = await User.findById(assignedBy);

    let targetUsers: string[] = [];

    // If role filter is provided, get all users with those roles
    if (roleFilter && roleFilter.length > 0) {
      const usersWithRoles = await User.find({
        tenantId,
        role: { $in: roleFilter },
        isActive: true,
      });
      targetUsers = usersWithRoles.map(u => (u._id as mongoose.Types.ObjectId).toString());
    } else if (userIds && userIds.length > 0) {
      targetUsers = userIds;
    } else {
      return res.status(400).json({ success: false, message: 'Please specify users or roles to assign' });
    }

    const assignments = [];
    const errors = [];

    for (const userId of targetUsers) {
      // Check if assignment already exists
      const existing = await TrainingAssignment.findOne({
        tenantId,
        trainingId,
        userId,
      });

      if (existing) {
        errors.push({ userId, message: 'Already assigned' });
        continue;
      }

      // Get training content for progress tracking
      const content = await TrainingContent.find({ trainingId });

      const assignment = await TrainingAssignment.create({
        tenantId,
        trainingId,
        userId,
        assignedBy,
        dueDate: dueDate || training.dueDate,
        status: 'assigned',
        contentProgress: content.map(c => ({
          contentId: c._id,
          completed: false,
        })),
      });

      assignments.push(assignment);

      // Get user info for notification
      const user = await User.findById(userId);
      if (user) {
        // Create notification
        await createNotification({
          tenantId: new mongoose.Types.ObjectId(tenantId),
          userId: new mongoose.Types.ObjectId(userId),
          type: 'training_assigned',
          title: 'New Training Assigned',
          message: `You have been assigned to "${training.title}"`,
          link: `/training/my-trainings/${assignment._id}`,
          relatedId: assignment._id as mongoose.Types.ObjectId,
          relatedType: 'TrainingAssignment',
          sendEmailNotification: true,
          emailData: {
            userName: `${user.firstName} ${user.lastName}`,
            trainingTitle: training.title,
            dueDate: new Date(dueDate || training.dueDate).toLocaleDateString(),
            assignedBy: `${assigner?.firstName} ${assigner?.lastName}`,
            pharmacyName: tenant?.name || 'QMS Pharmacy',
          },
        });
      }
    }

    // Update training with assigned users
    await Training.findByIdAndUpdate(trainingId, {
      $addToSet: { assignedTo: { $each: targetUsers.map(id => new mongoose.Types.ObjectId(id)) } },
    });

    res.json({
      success: true,
      data: {
        assigned: assignments.length,
        errors,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// User: Start training
export const startTraining = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;
    const tenantId = (req as any).user.tenantId;

    const assignment = await TrainingAssignment.findOneAndUpdate(
      { _id: id, tenantId, userId, status: 'assigned' },
      { status: 'in_progress', startedAt: new Date() },
      { new: true }
    );

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found or already started' });
    }

    res.json({ success: true, data: assignment });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// User: Mark content as completed
export const completeContent = async (req: Request, res: Response) => {
  try {
    const { id, contentId } = req.params;
    const userId = (req as any).user.id;
    const tenantId = (req as any).user.tenantId;
    const { timeSpent } = req.body;

    const assignment = await TrainingAssignment.findOne({ _id: id, tenantId, userId });
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    // Update content progress
    const contentIndex = assignment.contentProgress.findIndex(
      cp => cp.contentId.toString() === contentId
    );

    if (contentIndex === -1) {
      return res.status(404).json({ success: false, message: 'Content not found in assignment' });
    }

    assignment.contentProgress[contentIndex].completed = true;
    assignment.contentProgress[contentIndex].completedAt = new Date();
    if (timeSpent) {
      assignment.contentProgress[contentIndex].timeSpent = timeSpent;
      assignment.totalTimeSpent += timeSpent;
    }

    // Check if all content is completed
    const allContentCompleted = assignment.contentProgress.every(cp => cp.completed);
    if (allContentCompleted) {
      assignment.contentCompletedAt = new Date();

      // Check if exam is required
      const training = await Training.findById(assignment.trainingId);
      const exam = await Exam.findOne({ trainingId: assignment.trainingId, isActive: true });

      if (training?.assessmentRequired && exam) {
        assignment.status = 'exam_pending';

        // Notify user about exam
        const user = await User.findById(userId);
        const tenant = await Tenant.findById(tenantId);

        await createNotification({
          tenantId: new mongoose.Types.ObjectId(tenantId),
          userId: new mongoose.Types.ObjectId(userId),
          type: 'exam_available',
          title: 'Exam Available',
          message: `You can now take the exam for "${training.title}"`,
          link: `/training/my-trainings/${id}/exam`,
          relatedId: assignment._id as mongoose.Types.ObjectId,
          relatedType: 'TrainingAssignment',
          sendEmailNotification: true,
          emailData: {
            userName: `${user?.firstName} ${user?.lastName}`,
            trainingTitle: training.title,
            examTitle: exam.title,
            passingScore: exam.passingScore,
            timeLimit: exam.timeLimit,
            pharmacyName: tenant?.name || 'QMS Pharmacy',
          },
        });
      } else {
        // No exam required, mark as completed
        assignment.status = 'completed';
        assignment.completedAt = new Date();

        // Update training completedBy
        await Training.findByIdAndUpdate(assignment.trainingId, {
          $addToSet: { completedBy: new mongoose.Types.ObjectId(userId) },
        });

        // Issue certificate for non-exam training
        const user = await User.findById(userId);
        const tenant = await Tenant.findById(tenantId);

        if (training && user) {
          const certificateNumber = `CERT-${new Date().getFullYear()}-${uuidv4().substring(0, 8).toUpperCase()}`;
          const verificationCode = uuidv4();

          const certificate = await Certificate.create({
            certificateNumber,
            tenantId,
            trainingId: assignment.trainingId,
            trainingAssignmentId: assignment._id,
            userId,
            trainingTitle: training.title,
            userName: `${user.firstName} ${user.lastName}`,
            issueDate: new Date(),
            expiryDate: training.isRecurring ? training.nextDueDate : undefined,
            completionDate: new Date(),
            isValid: true,
            verificationCode,
          });

          assignment.certificateId = certificate._id as mongoose.Types.ObjectId;
          assignment.certificateIssuedAt = new Date();

          // Notify user about certificate
          await createNotification({
            tenantId: new mongoose.Types.ObjectId(tenantId),
            userId: new mongoose.Types.ObjectId(userId),
            type: 'certificate_issued',
            title: 'Certificate Issued',
            message: `Congratulations! Your certificate for "${training.title}" has been issued.`,
            link: `/training/certificates/${certificate._id}`,
            relatedId: certificate._id as mongoose.Types.ObjectId,
            relatedType: 'Certificate',
            sendEmailNotification: true,
            emailData: {
              userName: `${user.firstName} ${user.lastName}`,
              trainingTitle: training.title,
              certificateNumber,
              issueDate: new Date().toLocaleDateString(),
              pharmacyName: tenant?.name || 'QMS Pharmacy',
            },
          });
        }
      }
    }

    await assignment.save();

    res.json({ success: true, data: assignment });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Get all assignments (for management)
export const getAllAssignments = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user.tenantId;
    const { trainingId, status, userId } = req.query;

    const filter: any = { tenantId };
    if (trainingId) filter.trainingId = trainingId;
    if (status) filter.status = status;
    if (userId) filter.userId = userId;

    const assignments = await TrainingAssignment.find(filter)
      .populate('trainingId', 'title trainingNumber category')
      .populate('userId', 'firstName lastName email role department')
      .populate('assignedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: assignments });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get assignment statistics
export const getAssignmentStats = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user.tenantId;

    const stats = await TrainingAssignment.aggregate([
      { $match: { tenantId: new mongoose.Types.ObjectId(tenantId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const statusCounts = stats.reduce((acc: any, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});

    // Get overdue count
    const overdueCount = await TrainingAssignment.countDocuments({
      tenantId,
      dueDate: { $lt: new Date() },
      status: { $nin: ['completed', 'overdue'] },
    });

    res.json({
      success: true,
      data: {
        ...statusCounts,
        overdue: overdueCount,
        total: Object.values(statusCounts).reduce((a: number, b: any) => a + b, 0),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Reset a user's training assignment
export const resetAssignment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = (req as any).user.tenantId;
    const adminUserId = (req as any).user.id;

    const assignment = await TrainingAssignment.findOne({ _id: id, tenantId });
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    // Get training content to reset progress tracking
    const content = await TrainingContent.find({ trainingId: assignment.trainingId });

    // Store previous status for logging
    const previousStatus = assignment.status;

    // Reset the assignment to initial state
    assignment.status = 'assigned';
    assignment.startedAt = undefined;
    assignment.contentCompletedAt = undefined;
    assignment.completedAt = undefined;
    assignment.certificateId = undefined;
    assignment.certificateIssuedAt = undefined;
    assignment.examAttempts = 0;
    assignment.lastExamScore = undefined;
    assignment.totalTimeSpent = 0;
    assignment.contentProgress = content.map((c: any) => ({
      contentId: c._id,
      completed: false,
    })) as IContentProgress[];

    await assignment.save();

    // Remove user from training completedBy array
    await Training.findByIdAndUpdate(assignment.trainingId, {
      $pull: { completedBy: assignment.userId },
    });

    // Get user info for notification
    const user = await User.findById(assignment.userId);
    const training = await Training.findById(assignment.trainingId);
    const admin = await User.findById(adminUserId);

    if (user && training) {
      // Notify user that their training has been reset
      await createNotification({
        tenantId: new mongoose.Types.ObjectId(tenantId),
        userId: assignment.userId,
        type: 'training_assigned',
        title: 'Training Reset',
        message: `Your training "${training.title}" has been reset by ${admin?.firstName} ${admin?.lastName}. Please complete the training again.`,
        link: `/training/my-trainings/${assignment._id}`,
        relatedId: assignment._id as mongoose.Types.ObjectId,
        relatedType: 'TrainingAssignment',
      });
    }

    // Populate the response
    const populatedAssignment = await TrainingAssignment.findById(assignment._id)
      .populate('trainingId', 'title trainingNumber category')
      .populate('userId', 'firstName lastName email role department')
      .populate('assignedBy', 'firstName lastName');

    res.json({
      success: true,
      data: populatedAssignment,
      message: `Training assignment reset successfully. Previous status: ${previousStatus}`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Issue certificate for a completed assignment (for retroactive certificate issuance)
export const issueCertificate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = (req as any).user.tenantId;

    const assignment = await TrainingAssignment.findOne({ _id: id, tenantId });
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    if (assignment.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Assignment is not completed yet' });
    }

    if (assignment.certificateId) {
      return res.status(400).json({ success: false, message: 'Certificate already issued for this assignment' });
    }

    const training = await Training.findById(assignment.trainingId);
    const user = await User.findById(assignment.userId);
    const tenant = await Tenant.findById(tenantId);

    if (!training || !user) {
      return res.status(404).json({ success: false, message: 'Training or user not found' });
    }

    const certificateNumber = `CERT-${new Date().getFullYear()}-${uuidv4().substring(0, 8).toUpperCase()}`;
    const verificationCode = uuidv4();

    const certificate = await Certificate.create({
      certificateNumber,
      tenantId,
      trainingId: assignment.trainingId,
      trainingAssignmentId: assignment._id,
      userId: assignment.userId,
      trainingTitle: training.title,
      userName: `${user.firstName} ${user.lastName}`,
      issueDate: new Date(),
      expiryDate: training.isRecurring ? training.nextDueDate : undefined,
      completionDate: assignment.completedAt || new Date(),
      isValid: true,
      verificationCode,
    });

    assignment.certificateId = certificate._id as mongoose.Types.ObjectId;
    assignment.certificateIssuedAt = new Date();
    await assignment.save();

    // Notify user about certificate
    await createNotification({
      tenantId: new mongoose.Types.ObjectId(tenantId),
      userId: assignment.userId,
      type: 'certificate_issued',
      title: 'Certificate Issued',
      message: `Your certificate for "${training.title}" has been issued.`,
      link: `/training/certificates/${certificate._id}`,
      relatedId: certificate._id as mongoose.Types.ObjectId,
      relatedType: 'Certificate',
      sendEmailNotification: true,
      emailData: {
        userName: `${user.firstName} ${user.lastName}`,
        trainingTitle: training.title,
        certificateNumber,
        issueDate: new Date().toLocaleDateString(),
        pharmacyName: tenant?.name || 'QMS Pharmacy',
      },
    });

    res.json({
      success: true,
      data: { assignment, certificate },
      message: 'Certificate issued successfully',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
