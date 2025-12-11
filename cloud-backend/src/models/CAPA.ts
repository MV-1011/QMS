import mongoose, { Document, Schema } from 'mongoose';

export interface ICAPA extends Document {
  tenantId: mongoose.Types.ObjectId;
  capaNumber: string;
  title: string;
  description: string;
  type: 'Corrective' | 'Preventive' | 'Both';
  source: string; // deviation, audit, complaint, inspection, etc.
  sourceId?: mongoose.Types.ObjectId;
  sourceReference?: string;
  status: 'open' | 'investigation' | 'action_plan' | 'implementation' | 'effectiveness_check' | 'completed' | 'cancelled';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  rootCause?: string;
  correctiveAction?: string;
  preventiveAction?: string;
  actionPlan?: string;
  effectivenessCheck?: string;
  effectivenessResult?: string;
  assignedTo?: mongoose.Types.ObjectId;
  dueDate?: Date;
  implementationDate?: Date;
  completionDate?: Date;
  verifiedBy?: mongoose.Types.ObjectId;
  verificationDate?: Date;
  verificationComments?: string;
  attachments?: string[];
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const capaSchema = new Schema<ICAPA>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
    },
    capaNumber: {
      type: String,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['Corrective', 'Preventive', 'Both'],
      required: true,
    },
    source: {
      type: String,
      required: true,
    },
    sourceId: {
      type: Schema.Types.ObjectId,
    },
    sourceReference: {
      type: String,
    },
    status: {
      type: String,
      enum: ['open', 'investigation', 'action_plan', 'implementation', 'effectiveness_check', 'completed', 'cancelled'],
      default: 'open',
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
    },
    rootCause: {
      type: String,
    },
    correctiveAction: {
      type: String,
    },
    preventiveAction: {
      type: String,
    },
    actionPlan: {
      type: String,
    },
    effectivenessCheck: {
      type: String,
    },
    effectivenessResult: {
      type: String,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    dueDate: {
      type: Date,
    },
    implementationDate: {
      type: Date,
    },
    completionDate: {
      type: Date,
    },
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    verificationDate: {
      type: Date,
    },
    verificationComments: {
      type: String,
    },
    attachments: [{
      type: String,
    }],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
capaSchema.index({ tenantId: 1 });
capaSchema.index({ capaNumber: 1 }, { unique: true });
capaSchema.index({ status: 1 });
capaSchema.index({ priority: 1 });
capaSchema.index({ dueDate: 1 });
capaSchema.index({ source: 1 });

export const CAPA = mongoose.model<ICAPA>('CAPA', capaSchema);
