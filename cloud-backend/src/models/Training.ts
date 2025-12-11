import mongoose, { Schema, Document } from 'mongoose';

export interface ICertificateTemplate {
  templateUrl?: string;
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  logoUrl?: string;
  signatureUrl?: string;
  signerName?: string;
  signerTitle?: string;
  customText?: string;
}

export interface ITraining extends Document {
  trainingNumber: string;
  tenantId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  trainingType: 'Initial' | 'Refresher' | 'Annual' | 'Ad-hoc' | 'Certification';
  category: 'SOP' | 'GMP' | 'Safety' | 'Compliance' | 'Technical' | 'Soft Skills' | 'Other';
  status: 'draft' | 'published' | 'scheduled' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';
  priority: 'Low' | 'Medium' | 'High' | 'Mandatory';

  // Schedule
  scheduledDate: Date;
  completionDate?: Date;
  dueDate: Date;
  duration?: number; // in minutes

  // Trainer info
  trainer?: string;
  trainerType?: 'Internal' | 'External';
  externalOrganization?: string;

  // Target audience
  targetRoles?: string[]; // roles that should receive this training
  assignedTo: mongoose.Types.ObjectId[];
  completedBy?: mongoose.Types.ObjectId[];

  // Content
  documentReferences?: string[];
  materials?: string[];
  assessmentRequired: boolean;
  passingScore?: number;

  // Certificate
  certificateEnabled: boolean;
  certificateTemplate?: ICertificateTemplate;
  certificateValidityMonths?: number; // how long certificate is valid

  // Results
  attendanceCount?: number;
  passedCount?: number;
  averageScore?: number;

  // Recurrence
  isRecurring: boolean;
  recurrenceInterval?: 'Monthly' | 'Quarterly' | 'Semi-Annual' | 'Annual';
  nextDueDate?: Date;

  // Metadata
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TrainingSchema: Schema = new Schema(
  {
    trainingNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    trainingType: {
      type: String,
      enum: ['Initial', 'Refresher', 'Annual', 'Ad-hoc', 'Certification'],
      required: true,
    },
    category: {
      type: String,
      enum: ['SOP', 'GMP', 'Safety', 'Compliance', 'Technical', 'Soft Skills', 'Other'],
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'scheduled', 'in_progress', 'completed', 'overdue', 'cancelled'],
      default: 'draft',
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Mandatory'],
      default: 'Medium',
    },
    scheduledDate: {
      type: Date,
      required: true,
    },
    completionDate: {
      type: Date,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    duration: {
      type: Number,
    },
    trainer: {
      type: String,
    },
    trainerType: {
      type: String,
      enum: ['Internal', 'External'],
    },
    externalOrganization: {
      type: String,
    },
    targetRoles: [{
      type: String,
      enum: ['admin', 'qa_manager', 'pharmacist', 'technician', 'trainee'],
    }],
    assignedTo: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    completedBy: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    documentReferences: [{
      type: String,
    }],
    materials: [{
      type: String,
    }],
    assessmentRequired: {
      type: Boolean,
      default: false,
    },
    passingScore: {
      type: Number,
    },
    certificateEnabled: {
      type: Boolean,
      default: true,
    },
    certificateTemplate: {
      templateUrl: String,
      backgroundColor: { type: String, default: '#ffffff' },
      textColor: { type: String, default: '#1a1a2e' },
      borderColor: { type: String, default: '#0066cc' },
      logoUrl: String,
      signatureUrl: String,
      signerName: String,
      signerTitle: String,
      customText: String,
    },
    certificateValidityMonths: {
      type: Number,
      default: 12,
    },
    attendanceCount: {
      type: Number,
      default: 0,
    },
    passedCount: {
      type: Number,
      default: 0,
    },
    averageScore: {
      type: Number,
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurrenceInterval: {
      type: String,
      enum: ['Monthly', 'Quarterly', 'Semi-Annual', 'Annual'],
    },
    nextDueDate: {
      type: Date,
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

// Indexes for performance
TrainingSchema.index({ tenantId: 1, trainingNumber: 1 });
TrainingSchema.index({ tenantId: 1, status: 1 });
TrainingSchema.index({ tenantId: 1, category: 1 });
TrainingSchema.index({ tenantId: 1, dueDate: 1 });

export default mongoose.model<ITraining>('Training', TrainingSchema);
