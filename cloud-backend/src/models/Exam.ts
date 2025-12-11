import mongoose, { Schema, Document } from 'mongoose';

export interface IExamQuestion {
  _id?: mongoose.Types.ObjectId;
  questionText: string;
  questionType: 'multiple_choice' | 'true_false' | 'multiple_select';
  options: string[];
  correctAnswers: number[]; // indices of correct answers
  points: number;
  explanation?: string;
}

export interface IExam extends Document {
  tenantId: mongoose.Types.ObjectId;
  trainingId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  instructions?: string;
  questions: IExamQuestion[];
  totalPoints: number;
  passingScore: number; // percentage
  timeLimit?: number; // in minutes
  maxAttempts: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showResults: boolean;
  showCorrectAnswers: boolean;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ExamQuestionSchema: Schema = new Schema({
  questionText: {
    type: String,
    required: true,
  },
  questionType: {
    type: String,
    enum: ['multiple_choice', 'true_false', 'multiple_select'],
    default: 'multiple_choice',
  },
  options: [{
    type: String,
    required: true,
  }],
  correctAnswers: [{
    type: Number,
    required: true,
  }],
  points: {
    type: Number,
    default: 1,
  },
  explanation: {
    type: String,
  },
});

const ExamSchema: Schema = new Schema(
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
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    instructions: {
      type: String,
    },
    questions: [ExamQuestionSchema],
    totalPoints: {
      type: Number,
      required: true,
    },
    passingScore: {
      type: Number,
      required: true,
      default: 80,
    },
    timeLimit: {
      type: Number,
    },
    maxAttempts: {
      type: Number,
      default: 3,
    },
    shuffleQuestions: {
      type: Boolean,
      default: false,
    },
    shuffleOptions: {
      type: Boolean,
      default: false,
    },
    showResults: {
      type: Boolean,
      default: true,
    },
    showCorrectAnswers: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index
ExamSchema.index({ trainingId: 1, isActive: 1 });

export default mongoose.model<IExam>('Exam', ExamSchema);
