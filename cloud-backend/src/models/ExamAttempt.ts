import mongoose, { Schema, Document } from 'mongoose';

export interface IAnswerRecord {
  questionId: mongoose.Types.ObjectId;
  selectedAnswers: number[];
  isCorrect: boolean;
  pointsEarned: number;
}

export interface IExamAttempt extends Document {
  tenantId: mongoose.Types.ObjectId;
  examId: mongoose.Types.ObjectId;
  trainingAssignmentId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  attemptNumber: number;
  answers: IAnswerRecord[];
  score: number; // percentage
  pointsEarned: number;
  totalPoints: number;
  passed: boolean;
  startedAt: Date;
  completedAt?: Date;
  timeSpent?: number; // in seconds
  status: 'in_progress' | 'completed' | 'timed_out' | 'abandoned';
  createdAt: Date;
  updatedAt: Date;
}

const AnswerRecordSchema: Schema = new Schema({
  questionId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  selectedAnswers: [{
    type: Number,
  }],
  isCorrect: {
    type: Boolean,
    default: false,
  },
  pointsEarned: {
    type: Number,
    default: 0,
  },
}, { _id: false });

const ExamAttemptSchema: Schema = new Schema(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    examId: {
      type: Schema.Types.ObjectId,
      ref: 'Exam',
      required: true,
      index: true,
    },
    trainingAssignmentId: {
      type: Schema.Types.ObjectId,
      ref: 'TrainingAssignment',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    attemptNumber: {
      type: Number,
      required: true,
    },
    answers: [AnswerRecordSchema],
    score: {
      type: Number,
      default: 0,
    },
    pointsEarned: {
      type: Number,
      default: 0,
    },
    totalPoints: {
      type: Number,
      required: true,
    },
    passed: {
      type: Boolean,
      default: false,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
    timeSpent: {
      type: Number,
    },
    status: {
      type: String,
      enum: ['in_progress', 'completed', 'timed_out', 'abandoned'],
      default: 'in_progress',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
ExamAttemptSchema.index({ examId: 1, userId: 1, attemptNumber: 1 });
ExamAttemptSchema.index({ trainingAssignmentId: 1 });

export default mongoose.model<IExamAttempt>('ExamAttempt', ExamAttemptSchema);
