import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  tenantId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: 'training_assigned' | 'training_reminder' | 'training_overdue' | 'exam_available' | 'certificate_issued' | 'general';
  title: string;
  message: string;
  link?: string;
  relatedId?: mongoose.Types.ObjectId;
  relatedType?: 'Training' | 'TrainingAssignment' | 'Exam' | 'Certificate';
  isRead: boolean;
  readAt?: Date;
  emailSent: boolean;
  emailSentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema: Schema = new Schema(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['training_assigned', 'training_reminder', 'training_overdue', 'exam_available', 'certificate_issued', 'general'],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    link: {
      type: String,
    },
    relatedId: {
      type: Schema.Types.ObjectId,
    },
    relatedType: {
      type: String,
      enum: ['Training', 'TrainingAssignment', 'Exam', 'Certificate'],
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
    emailSent: {
      type: Boolean,
      default: false,
    },
    emailSentAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
NotificationSchema.index({ tenantId: 1, userId: 1, isRead: 1 });
NotificationSchema.index({ createdAt: -1 });

export default mongoose.model<INotification>('Notification', NotificationSchema);
