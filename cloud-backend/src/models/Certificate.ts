import mongoose, { Schema, Document } from 'mongoose';

export interface ICertificate extends Document {
  certificateNumber: string;
  tenantId: mongoose.Types.ObjectId;
  trainingId: mongoose.Types.ObjectId;
  trainingAssignmentId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  trainingTitle: string;
  userName: string;
  issueDate: Date;
  expiryDate?: Date;
  examScore?: number;
  completionDate: Date;
  isValid: boolean;
  revokedAt?: Date;
  revokedBy?: mongoose.Types.ObjectId;
  revokeReason?: string;
  verificationCode: string;
  downloadCount: number;
  lastDownloadedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CertificateSchema: Schema = new Schema(
  {
    certificateNumber: {
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
    trainingId: {
      type: Schema.Types.ObjectId,
      ref: 'Training',
      required: true,
    },
    trainingAssignmentId: {
      type: Schema.Types.ObjectId,
      ref: 'TrainingAssignment',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    trainingTitle: {
      type: String,
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    issueDate: {
      type: Date,
      default: Date.now,
    },
    expiryDate: {
      type: Date,
    },
    examScore: {
      type: Number,
    },
    completionDate: {
      type: Date,
      required: true,
    },
    isValid: {
      type: Boolean,
      default: true,
    },
    revokedAt: {
      type: Date,
    },
    revokedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    revokeReason: {
      type: String,
    },
    verificationCode: {
      type: String,
      required: true,
      unique: true,
    },
    downloadCount: {
      type: Number,
      default: 0,
    },
    lastDownloadedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
CertificateSchema.index({ tenantId: 1, userId: 1 });
CertificateSchema.index({ verificationCode: 1 });

export default mongoose.model<ICertificate>('Certificate', CertificateSchema);
