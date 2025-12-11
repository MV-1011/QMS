import mongoose, { Document, Schema } from 'mongoose';

export interface IDeviation extends Document {
  tenantId: mongoose.Types.ObjectId;
  deviationNumber: string;
  title: string;
  description: string;
  severity: 'Minor' | 'Major' | 'Critical';
  category: string;
  status: 'open' | 'investigation' | 'capa_required' | 'capa_in_progress' | 'pending_closure' | 'closed' | 'rejected';
  occurrenceDate: Date;
  detectedBy: mongoose.Types.ObjectId;
  assignedTo?: mongoose.Types.ObjectId;
  productAffected?: string;
  batchNumber?: string;
  immediateAction?: string;
  rootCause?: string;
  investigation?: string;
  correctiveAction?: string;
  preventiveAction?: string;
  capaId?: mongoose.Types.ObjectId;
  closureDate?: Date;
  verifiedBy?: mongoose.Types.ObjectId;
  verificationComments?: string;
  attachments?: string[];
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const deviationSchema = new Schema<IDeviation>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
    },
    deviationNumber: {
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
    severity: {
      type: String,
      enum: ['Minor', 'Major', 'Critical'],
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['open', 'investigation', 'capa_required', 'capa_in_progress', 'pending_closure', 'closed', 'rejected'],
      default: 'open',
    },
    occurrenceDate: {
      type: Date,
      required: true,
    },
    detectedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    productAffected: {
      type: String,
    },
    batchNumber: {
      type: String,
    },
    immediateAction: {
      type: String,
    },
    rootCause: {
      type: String,
    },
    investigation: {
      type: String,
    },
    correctiveAction: {
      type: String,
    },
    preventiveAction: {
      type: String,
    },
    capaId: {
      type: Schema.Types.ObjectId,
      ref: 'CAPA',
    },
    closureDate: {
      type: Date,
    },
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
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
deviationSchema.index({ tenantId: 1 });
deviationSchema.index({ deviationNumber: 1 }, { unique: true });
deviationSchema.index({ status: 1 });
deviationSchema.index({ severity: 1 });
deviationSchema.index({ occurrenceDate: -1 });
deviationSchema.index({ category: 1 });

export const Deviation = mongoose.model<IDeviation>('Deviation', deviationSchema);
