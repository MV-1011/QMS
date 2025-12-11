import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Exam from '../models/Exam';
import ExamAttempt from '../models/ExamAttempt';
import TrainingAssignment from '../models/TrainingAssignment';
import Training from '../models/Training';
import Certificate from '../models/Certificate';
import { User } from '../models/User';
import { Tenant } from '../models/Tenant';
import { createNotification } from '../services/notificationService';
import { v4 as uuidv4 } from 'uuid';

// Admin: Create exam for a training
export const createExam = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user.tenantId;
    const createdBy = (req as any).user.id;
    const {
      trainingId,
      title,
      description,
      instructions,
      questions,
      passingScore,
      timeLimit,
      maxAttempts,
      shuffleQuestions,
      shuffleOptions,
      showResults,
      showCorrectAnswers,
    } = req.body;

    // Verify training exists
    const training = await Training.findOne({ _id: trainingId, tenantId });
    if (!training) {
      return res.status(404).json({ success: false, message: 'Training not found' });
    }

    // Calculate total points
    const totalPoints = questions.reduce((sum: number, q: any) => sum + (q.points || 1), 0);

    const exam = await Exam.create({
      tenantId,
      trainingId,
      title,
      description,
      instructions,
      questions,
      totalPoints,
      passingScore: passingScore || 80,
      timeLimit,
      maxAttempts: maxAttempts || 3,
      shuffleQuestions: shuffleQuestions || false,
      shuffleOptions: shuffleOptions || false,
      showResults: showResults !== false,
      showCorrectAnswers: showCorrectAnswers || false,
      isActive: true,
      createdBy,
    });

    // Update training to require assessment
    await Training.findByIdAndUpdate(trainingId, { assessmentRequired: true, passingScore: passingScore || 80 });

    res.status(201).json({ success: true, data: exam });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Get exam details (with answers)
export const getExamAdmin = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = (req as any).user.tenantId;

    const exam = await Exam.findOne({ _id: id, tenantId })
      .populate('trainingId', 'title trainingNumber')
      .populate('createdBy', 'firstName lastName');

    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    res.json({ success: true, data: exam });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// User: Get exam for taking (without answers)
export const getExamForUser = async (req: Request, res: Response) => {
  try {
    const { assignmentId } = req.params;
    const userId = (req as any).user.id;
    const tenantId = (req as any).user.tenantId;

    // Verify assignment
    const assignment = await TrainingAssignment.findOne({
      _id: assignmentId,
      tenantId,
      userId,
      status: { $in: ['exam_pending', 'exam_failed'] },
    });

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found or not ready for exam' });
    }

    const exam = await Exam.findOne({ trainingId: assignment.trainingId, isActive: true });
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    // Check attempt limit
    if (assignment.examAttempts >= exam.maxAttempts) {
      return res.status(400).json({ success: false, message: 'Maximum attempts reached' });
    }

    // Prepare exam for user (remove correct answers)
    let questions = exam.questions.map(q => ({
      _id: q._id,
      questionText: q.questionText,
      questionType: q.questionType,
      options: exam.shuffleOptions ? shuffleArray([...q.options]) : q.options,
      points: q.points,
    }));

    if (exam.shuffleQuestions) {
      questions = shuffleArray(questions);
    }

    res.json({
      success: true,
      data: {
        examId: exam._id,
        title: exam.title,
        description: exam.description,
        instructions: exam.instructions,
        questions,
        totalPoints: exam.totalPoints,
        passingScore: exam.passingScore,
        timeLimit: exam.timeLimit,
        attemptNumber: assignment.examAttempts + 1,
        maxAttempts: exam.maxAttempts,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// User: Start exam attempt
export const startExamAttempt = async (req: Request, res: Response) => {
  try {
    const { assignmentId } = req.params;
    const userId = (req as any).user.id;
    const tenantId = (req as any).user.tenantId;

    const assignment = await TrainingAssignment.findOne({
      _id: assignmentId,
      tenantId,
      userId,
      status: { $in: ['exam_pending', 'exam_failed'] },
    });

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found or not ready for exam' });
    }

    const exam = await Exam.findOne({ trainingId: assignment.trainingId, isActive: true });
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    if (assignment.examAttempts >= exam.maxAttempts) {
      return res.status(400).json({ success: false, message: 'Maximum attempts reached' });
    }

    // Check for existing in-progress attempt
    const existingAttempt = await ExamAttempt.findOne({
      trainingAssignmentId: assignmentId,
      userId,
      status: 'in_progress',
    });

    if (existingAttempt) {
      return res.json({ success: true, data: existingAttempt });
    }

    // Create new attempt
    const attempt = await ExamAttempt.create({
      tenantId,
      examId: exam._id,
      trainingAssignmentId: assignmentId,
      userId,
      attemptNumber: assignment.examAttempts + 1,
      answers: [],
      totalPoints: exam.totalPoints,
      startedAt: new Date(),
      status: 'in_progress',
    });

    res.status(201).json({ success: true, data: attempt });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// User: Submit exam
export const submitExam = async (req: Request, res: Response) => {
  try {
    const { attemptId } = req.params;
    const userId = (req as any).user.id;
    const tenantId = (req as any).user.tenantId;
    const { answers } = req.body;

    const attempt = await ExamAttempt.findOne({
      _id: attemptId,
      tenantId,
      userId,
      status: 'in_progress',
    });

    if (!attempt) {
      return res.status(404).json({ success: false, message: 'Attempt not found or already completed' });
    }

    const exam = await Exam.findById(attempt.examId);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    // Grade the exam
    let pointsEarned = 0;
    const gradedAnswers = answers.map((answer: any) => {
      const question = exam.questions.find(q => q._id?.toString() === answer.questionId);
      if (!question) return { ...answer, isCorrect: false, pointsEarned: 0 };

      const isCorrect = arraysEqual(
        answer.selectedAnswers.sort(),
        question.correctAnswers.sort()
      );

      const points = isCorrect ? question.points : 0;
      pointsEarned += points;

      return {
        questionId: answer.questionId,
        selectedAnswers: answer.selectedAnswers,
        isCorrect,
        pointsEarned: points,
      };
    });

    const score = Math.round((pointsEarned / exam.totalPoints) * 100);
    const passed = score >= exam.passingScore;

    // Update attempt
    attempt.answers = gradedAnswers;
    attempt.pointsEarned = pointsEarned;
    attempt.score = score;
    attempt.passed = passed;
    attempt.completedAt = new Date();
    attempt.timeSpent = Math.floor((Date.now() - attempt.startedAt.getTime()) / 1000);
    attempt.status = 'completed';
    await attempt.save();

    // Update assignment
    const assignment = await TrainingAssignment.findById(attempt.trainingAssignmentId);
    if (assignment) {
      assignment.examAttempts += 1;
      assignment.lastExamScore = score;
      assignment.bestExamScore = Math.max(score, assignment.bestExamScore || 0);

      if (passed) {
        assignment.examPassedAt = new Date();
        assignment.status = 'completed';
        assignment.completedAt = new Date();

        // Update training completedBy
        await Training.findByIdAndUpdate(assignment.trainingId, {
          $addToSet: { completedBy: new mongoose.Types.ObjectId(userId) },
          $inc: { passedCount: 1, attendanceCount: 1 },
        });

        // Issue certificate
        const training = await Training.findById(assignment.trainingId);
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
            examScore: score,
            completionDate: new Date(),
            isValid: true,
            verificationCode,
          });

          assignment.certificateId = certificate._id as mongoose.Types.ObjectId;
          assignment.certificateIssuedAt = new Date();

          // Notify user
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
              expiryDate: training.isRecurring && training.nextDueDate
                ? training.nextDueDate.toLocaleDateString()
                : undefined,
              pharmacyName: tenant?.name || 'QMS Pharmacy',
            },
          });
        }
      } else {
        assignment.status = 'exam_failed';
      }

      await assignment.save();
    }

    // Prepare response
    const responseData: any = {
      score,
      passed,
      pointsEarned,
      totalPoints: exam.totalPoints,
      attemptNumber: attempt.attemptNumber,
    };

    if (exam.showResults) {
      responseData.answers = gradedAnswers.map((a: any) => ({
        questionId: a.questionId,
        isCorrect: a.isCorrect,
        pointsEarned: a.pointsEarned,
      }));
    }

    if (exam.showCorrectAnswers && passed) {
      responseData.correctAnswers = exam.questions.map(q => ({
        questionId: q._id,
        correctAnswers: q.correctAnswers,
        explanation: q.explanation,
      }));
    }

    res.json({ success: true, data: responseData });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Update exam
export const updateExam = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = (req as any).user.tenantId;

    const exam = await Exam.findOneAndUpdate(
      { _id: id, tenantId },
      { ...req.body, totalPoints: req.body.questions?.reduce((sum: number, q: any) => sum + (q.points || 1), 0) },
      { new: true }
    );

    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    res.json({ success: true, data: exam });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Get exam results for a training
export const getExamResults = async (req: Request, res: Response) => {
  try {
    const { trainingId } = req.params;
    const tenantId = (req as any).user.tenantId;

    const exam = await Exam.findOne({ trainingId, tenantId });
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    const attempts = await ExamAttempt.find({ examId: exam._id, status: 'completed' })
      .populate('userId', 'firstName lastName email')
      .sort({ completedAt: -1 });

    // Calculate statistics
    const scores = attempts.map(a => a.score);
    const stats = {
      totalAttempts: attempts.length,
      passedCount: attempts.filter(a => a.passed).length,
      failedCount: attempts.filter(a => !a.passed).length,
      averageScore: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
      highestScore: scores.length ? Math.max(...scores) : 0,
      lowestScore: scores.length ? Math.min(...scores) : 0,
    };

    res.json({
      success: true,
      data: {
        stats,
        attempts,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper functions
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function arraysEqual(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((val, idx) => val === b[idx]);
}
