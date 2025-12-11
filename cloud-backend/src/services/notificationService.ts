import mongoose from 'mongoose';
import Notification from '../models/Notification';
import { User } from '../models/User';
import { Tenant } from '../models/Tenant';
import { sendEmail, emailTemplates } from './emailService';
import { logger } from '../utils/logger';

interface CreateNotificationParams {
  tenantId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: 'training_assigned' | 'training_reminder' | 'training_overdue' | 'exam_available' | 'certificate_issued' | 'general';
  title: string;
  message: string;
  link?: string;
  relatedId?: mongoose.Types.ObjectId;
  relatedType?: 'Training' | 'TrainingAssignment' | 'Exam' | 'Certificate';
  sendEmailNotification?: boolean;
  emailData?: any;
}

export const createNotification = async (params: CreateNotificationParams) => {
  try {
    const notification = await Notification.create({
      tenantId: params.tenantId,
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      link: params.link,
      relatedId: params.relatedId,
      relatedType: params.relatedType,
    });

    // Send email notification if requested
    if (params.sendEmailNotification && params.emailData) {
      const user = await User.findById(params.userId);
      if (user && user.emailNotifications) {
        let emailSent = false;

        switch (params.type) {
          case 'training_assigned':
            const assignedTemplate = emailTemplates.trainingAssigned(params.emailData);
            emailSent = await sendEmail({
              to: user.email,
              subject: assignedTemplate.subject,
              html: assignedTemplate.html,
              text: assignedTemplate.text,
            });
            break;

          case 'training_reminder':
            const reminderTemplate = emailTemplates.trainingReminder(params.emailData);
            emailSent = await sendEmail({
              to: user.email,
              subject: reminderTemplate.subject,
              html: reminderTemplate.html,
              text: reminderTemplate.text,
            });
            break;

          case 'exam_available':
            const examTemplate = emailTemplates.examAvailable(params.emailData);
            emailSent = await sendEmail({
              to: user.email,
              subject: examTemplate.subject,
              html: examTemplate.html,
              text: examTemplate.text,
            });
            break;

          case 'certificate_issued':
            const certTemplate = emailTemplates.certificateIssued(params.emailData);
            emailSent = await sendEmail({
              to: user.email,
              subject: certTemplate.subject,
              html: certTemplate.html,
              text: certTemplate.text,
            });
            break;
        }

        if (emailSent) {
          notification.emailSent = true;
          notification.emailSentAt = new Date();
          await notification.save();
        }
      }
    }

    return notification;
  } catch (error) {
    logger.error('Failed to create notification:', error);
    throw error;
  }
};

export const getUnreadNotifications = async (userId: mongoose.Types.ObjectId, tenantId: mongoose.Types.ObjectId) => {
  return Notification.find({
    userId,
    tenantId,
    isRead: false,
  }).sort({ createdAt: -1 });
};

export const getAllNotifications = async (
  userId: mongoose.Types.ObjectId,
  tenantId: mongoose.Types.ObjectId,
  page: number = 1,
  limit: number = 20
) => {
  const skip = (page - 1) * limit;

  const [notifications, total] = await Promise.all([
    Notification.find({ userId, tenantId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Notification.countDocuments({ userId, tenantId }),
  ]);

  return {
    notifications,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
};

export const markAsRead = async (notificationId: mongoose.Types.ObjectId, userId: mongoose.Types.ObjectId) => {
  return Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { isRead: true, readAt: new Date() },
    { new: true }
  );
};

export const markAllAsRead = async (userId: mongoose.Types.ObjectId, tenantId: mongoose.Types.ObjectId) => {
  return Notification.updateMany(
    { userId, tenantId, isRead: false },
    { isRead: true, readAt: new Date() }
  );
};

export const getUnreadCount = async (userId: mongoose.Types.ObjectId, tenantId: mongoose.Types.ObjectId) => {
  return Notification.countDocuments({ userId, tenantId, isRead: false });
};

export default {
  createNotification,
  getUnreadNotifications,
  getAllNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
};
