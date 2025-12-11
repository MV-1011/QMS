import mongoose, { Document, Schema } from 'mongoose';

export interface ITenant extends Document {
  name: string;
  subdomain: string;
  isActive: boolean;
  settings: {
    branding?: {
      logo?: string;
      primaryColor?: string;
      secondaryColor?: string;
    };
    features?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const tenantSchema = new Schema<ITenant>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    subdomain: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    settings: {
      branding: {
        logo: String,
        primaryColor: String,
        secondaryColor: String,
      },
      features: [String],
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
tenantSchema.index({ subdomain: 1 });
tenantSchema.index({ isActive: 1 });

export const Tenant = mongoose.model<ITenant>('Tenant', tenantSchema);
