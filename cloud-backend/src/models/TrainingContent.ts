import mongoose, { Schema, Document } from 'mongoose';

export interface ITrainingContent extends Document {
  tenantId: mongoose.Types.ObjectId;
  trainingId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  contentType: 'video' | 'pdf' | 'ppt' | 'document' | 'link' | 'scorm';
  contentUrl: string;
  slides?: string[]; // Array of slide image URLs for PPT content
  slideCount?: number; // Number of slides in PPT
  fileName?: string;
  fileSize?: number;
  duration?: number; // in minutes for video
  order: number;
  isRequired: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TrainingContentSchema: Schema = new Schema(
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
    contentType: {
      type: String,
      enum: ['video', 'pdf', 'ppt', 'document', 'link', 'scorm'],
      required: true,
    },
    contentUrl: {
      type: String,
      required: true,
    },
    slides: {
      type: [String],
      default: undefined,
    },
    slideCount: {
      type: Number,
    },
    fileName: {
      type: String,
    },
    fileSize: {
      type: Number,
    },
    duration: {
      type: Number,
    },
    order: {
      type: Number,
      default: 0,
    },
    isRequired: {
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

// Indexes
TrainingContentSchema.index({ trainingId: 1, order: 1 });

export default mongoose.model<ITrainingContent>('TrainingContent', TrainingContentSchema);
