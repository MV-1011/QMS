import mongoose, { Document, Schema } from 'mongoose';

export interface IChangeControl extends Document {
  tenantId: mongoose.Types.ObjectId;
  changeNumber: string;
  title: string;
  description: string;
  changeType: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'initiated' | 'assessment' | 'approval_pending' | 'approved' | 'implementation' | 'verification' | 'completed' | 'rejected' | 'cancelled';
  requestorId: mongoose.Types.ObjectId;
  approverId?: mongoose.Types.ObjectId;
  implementationDate?: Date;
  completionDate?: Date;
  impactAssessment?: string;
  riskLevel?: string;
  affectedSystems?: string[];
  approvalComments?: string;
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const changeControlSchema = new Schema<IChangeControl>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
    },
    changeNumber: {
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
    changeType: {
      type: String,
      required: true,
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: ['initiated', 'assessment', 'approval_pending', 'approved', 'implementation', 'verification', 'completed', 'rejected', 'cancelled'],
      default: 'initiated',
    },
    requestorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    approverId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    implementationDate: {
      type: Date,
    },
    completionDate: {
      type: Date,
    },
    impactAssessment: {
      type: String,
    },
    riskLevel: {
      type: String,
    },
    affectedSystems: [{
      type: String,
    }],
    approvalComments: {
      type: String,
    },
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
changeControlSchema.index({ tenantId: 1 });
changeControlSchema.index({ changeNumber: 1 }, { unique: true });
changeControlSchema.index({ status: 1 });
changeControlSchema.index({ priority: 1 });
changeControlSchema.index({ createdAt: -1 });

export const ChangeControl = mongoose.model<IChangeControl>('ChangeControl', changeControlSchema);
