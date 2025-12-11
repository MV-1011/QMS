import mongoose, { Schema, Document } from 'mongoose';

export interface IAudit extends Document {
  auditNumber: string;
  tenantId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  auditType: 'Internal' | 'External' | 'Regulatory' | 'Supplier' | 'Self-Inspection';
  scope: string;
  standard?: string; // e.g., "ISO 9001", "FDA 21 CFR Part 211", "EU GMP"
  status: 'planned' | 'in_progress' | 'report_draft' | 'report_review' | 'completed' | 'closed';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';

  // Scheduling
  scheduledDate: Date;
  startDate?: Date;
  endDate?: Date;
  completionDate?: Date;

  // Team
  leadAuditor?: mongoose.Types.ObjectId;
  auditTeam?: mongoose.Types.ObjectId[];
  auditee?: string; // Department or area being audited

  // External audit specific
  externalOrganization?: string;
  auditorName?: string;

  // Findings
  findingsCount?: {
    critical: number;
    major: number;
    minor: number;
    observation: number;
  };

  // Report
  reportFile?: string;
  executiveSummary?: string;

  // Follow-up
  followUpRequired: boolean;
  followUpDate?: Date;
  capaGenerated?: boolean;
  capaReferences?: string[];

  // Metadata
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AuditSchema: Schema = new Schema(
  {
    auditNumber: {
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
    auditType: {
      type: String,
      enum: ['Internal', 'External', 'Regulatory', 'Supplier', 'Self-Inspection'],
      required: true,
    },
    scope: {
      type: String,
      required: true,
    },
    standard: {
      type: String,
    },
    status: {
      type: String,
      enum: ['planned', 'in_progress', 'report_draft', 'report_review', 'completed', 'closed'],
      default: 'planned',
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
    },
    scheduledDate: {
      type: Date,
      required: true,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    completionDate: {
      type: Date,
    },
    leadAuditor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    auditTeam: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    auditee: {
      type: String,
    },
    externalOrganization: {
      type: String,
    },
    auditorName: {
      type: String,
    },
    findingsCount: {
      critical: { type: Number, default: 0 },
      major: { type: Number, default: 0 },
      minor: { type: Number, default: 0 },
      observation: { type: Number, default: 0 },
    },
    reportFile: {
      type: String,
    },
    executiveSummary: {
      type: String,
    },
    followUpRequired: {
      type: Boolean,
      default: false,
    },
    followUpDate: {
      type: Date,
    },
    capaGenerated: {
      type: Boolean,
      default: false,
    },
    capaReferences: [{
      type: String,
    }],
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
AuditSchema.index({ tenantId: 1, auditNumber: 1 });
AuditSchema.index({ tenantId: 1, status: 1 });
AuditSchema.index({ tenantId: 1, auditType: 1 });
AuditSchema.index({ tenantId: 1, scheduledDate: 1 });

export default mongoose.model<IAudit>('Audit', AuditSchema);
