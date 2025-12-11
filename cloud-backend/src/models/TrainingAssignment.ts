import mongoose, { Schema, Document } from 'mongoose';

export interface IContentProgress {
  contentId: mongoose.Types.ObjectId;
  completed: boolean;
  completedAt?: Date;
  timeSpent?: number; // in seconds
}

export interface ITrainingAssignment extends Document {
  tenantId: mongoose.Types.ObjectId;
  trainingId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  assignedBy: mongoose.Types.ObjectId;
  assignedAt: Date;
  dueDate: Date;
  status: 'assigned' | 'in_progress' | 'content_completed' | 'exam_pending' | 'exam_failed' | 'completed' | 'overdue';

  // Content progress
  contentProgress: IContentProgress[];
  contentCompletedAt?: Date;

  // Exam results
  examAttempts: number;
  lastExamScore?: number;
  bestExamScore?: number;
  examPassedAt?: Date;

  // Certificate
  certificateId?: mongoose.Types.ObjectId;
  certificateIssuedAt?: Date;

  // Time tracking
  totalTimeSpent: number; // in seconds
  startedAt?: Date;
  completedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const ContentProgressSchema: Schema = new Schema({
  contentId: {
    type: Schema.Types.ObjectId,
    ref: 'TrainingContent',
    required: true,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  completedAt: {
    type: Date,
  },
  timeSpent: {
    type: Number,
    default: 0,
  },
}, { _id: false });

const TrainingAssignmentSchema: Schema = new Schema(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    trainingId: {
      type: Schema.Types.ObjectId,
      ref: 'Training',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['assigned', 'in_progress', 'content_completed', 'exam_pending', 'exam_failed', 'completed', 'overdue'],
      default: 'assigned',
    },
    contentProgress: [ContentProgressSchema],
    contentCompletedAt: {
      type: Date,
    },
    examAttempts: {
      type: Number,
      default: 0,
    },
    lastExamScore: {
      type: Number,
    },
    bestExamScore: {
      type: Number,
    },
    examPassedAt: {
      type: Date,
    },
    certificateId: {
      type: Schema.Types.ObjectId,
      ref: 'Certificate',
    },
    certificateIssuedAt: {
      type: Date,
    },
    totalTimeSpent: {
      type: Number,
      default: 0,
    },
    startedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
TrainingAssignmentSchema.index({ tenantId: 1, trainingId: 1, userId: 1 }, { unique: true });
TrainingAssignmentSchema.index({ userId: 1, status: 1 });
TrainingAssignmentSchema.index({ dueDate: 1, status: 1 });

export default mongoose.model<ITrainingAssignment>('TrainingAssignment', TrainingAssignmentSchema);
