import mongoose, { Document as MongooseDocument, Schema } from 'mongoose';

export interface IDocument extends MongooseDocument {
  tenantId: mongoose.Types.ObjectId;
  title: string;
  documentType: 'SOP' | 'Policy' | 'Form' | 'Protocol' | 'Record' | 'Other';
  content?: string;
  version: string;
  status: 'draft' | 'review' | 'approved' | 'archived';
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  effectiveDate?: Date;
  reviewDate?: Date;
  tags?: string[];
  attachments?: {
    fileName: string;
    fileUrl: string;
    fileSize: number;
    uploadedAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const documentSchema = new Schema<IDocument>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    documentType: {
      type: String,
      enum: ['SOP', 'Policy', 'Form', 'Protocol', 'Record', 'Other'],
      required: true,
    },
    content: {
      type: String,
    },
    version: {
      type: String,
      required: true,
      default: '1.0',
    },
    status: {
      type: String,
      enum: ['draft', 'review', 'approved', 'archived'],
      default: 'draft',
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
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: {
      type: Date,
    },
    effectiveDate: {
      type: Date,
    },
    reviewDate: {
      type: Date,
    },
    tags: [String],
    attachments: [
      {
        fileName: String,
        fileUrl: String,
        fileSize: Number,
        uploadedAt: Date,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
documentSchema.index({ tenantId: 1 });
documentSchema.index({ tenantId: 1, status: 1 });
documentSchema.index({ tenantId: 1, documentType: 1 });
documentSchema.index({ createdAt: -1 });
documentSchema.index({ tags: 1 });

export const Document = mongoose.model<IDocument>('Document', documentSchema);
