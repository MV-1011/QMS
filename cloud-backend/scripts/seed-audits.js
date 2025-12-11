const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const AuditSchema = new mongoose.Schema({
  auditNumber: String,
  tenantId: mongoose.Schema.Types.ObjectId,
  title: String,
  description: String,
  auditType: String,
  scope: String,
  standard: String,
  status: String,
  priority: String,
  scheduledDate: Date,
  startDate: Date,
  endDate: Date,
  completionDate: Date,
  leadAuditor: mongoose.Schema.Types.ObjectId,
  auditTeam: [mongoose.Schema.Types.ObjectId],
  auditee: String,
  externalOrganization: String,
  auditorName: String,
  findingsCount: {
    critical: Number,
    major: Number,
    minor: Number,
    observation: Number,
  },
  reportFile: String,
  executiveSummary: String,
  followUpRequired: Boolean,
  followUpDate: Date,
  capaGenerated: Boolean,
  capaReferences: [String],
  createdBy: mongoose.Schema.Types.ObjectId,
}, { timestamps: true });

const Audit = mongoose.model('Audit', AuditSchema);

const TenantSchema = new mongoose.Schema({
  name: String,
  settings: Object,
});
const Tenant = mongoose.model('Tenant', TenantSchema);

const UserSchema = new mongoose.Schema({
  email: String,
  firstName: String,
  lastName: String,
});
const User = mongoose.model('User', UserSchema);

async function seedAudits() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📦 Connected to MongoDB');

    // Get ABC Pharmacy tenant
    const tenant = await Tenant.findOne({ name: 'ABC Pharmacy' });
    if (!tenant) {
      console.log('❌ Tenant not found. Please run seed-mongo.js first.');
      process.exit(1);
    }

    // Get users
    const admin = await User.findOne({ email: 'admin@abcpharmacy.com' });
    const qaManager = await User.findOne({ email: 'qa.manager@abcpharmacy.com' });
    const qcAnalyst = await User.findOne({ email: 'qc.analyst@abcpharmacy.com' });

    // Clear existing audits
    await Audit.deleteMany({ tenantId: tenant._id });
    console.log('🗑️  Cleared existing audits');

    const audits = [
      {
        auditNumber: 'AUD-2025-001',
        tenantId: tenant._id,
        title: 'Annual GMP Compliance Audit',
        description: 'Comprehensive annual audit of all GMP-critical areas including manufacturing, quality control, warehousing, and documentation systems.',
        auditType: 'Internal',
        scope: 'All manufacturing areas, QC laboratory, warehouse, and quality systems',
        standard: 'FDA 21 CFR Part 211',
        status: 'completed',
        priority: 'High',
        scheduledDate: new Date('2025-01-15'),
        startDate: new Date('2025-01-15'),
        endDate: new Date('2025-01-17'),
        completionDate: new Date('2025-01-24'),
        leadAuditor: qaManager?._id,
        auditTeam: [admin?._id, qcAnalyst?._id],
        auditee: 'Manufacturing & Quality Control',
        findingsCount: {
          critical: 0,
          major: 2,
          minor: 5,
          observation: 8,
        },
        executiveSummary: 'Overall GMP compliance is satisfactory. Two major findings related to cleanroom monitoring documentation and validation of computerized systems. All findings have been addressed through CAPA.',
        followUpRequired: true,
        followUpDate: new Date('2025-02-24'),
        capaGenerated: true,
        capaReferences: ['CAPA-2025-001', 'CAPA-2025-002'],
        createdBy: qaManager?._id,
      },
      {
        auditNumber: 'AUD-2025-002',
        tenantId: tenant._id,
        title: 'FDA Pre-Approval Inspection',
        description: 'FDA inspection for new drug application approval covering manufacturing facility, processes, and quality systems.',
        auditType: 'Regulatory',
        scope: 'Tablet manufacturing line, analytical laboratory, quality systems',
        standard: 'FDA 21 CFR Part 211',
        status: 'report_review',
        priority: 'Critical',
        scheduledDate: new Date('2025-02-10'),
        startDate: new Date('2025-02-10'),
        endDate: new Date('2025-02-14'),
        externalOrganization: 'FDA',
        auditorName: 'Dr. Michael Chen',
        auditee: 'Manufacturing & Quality Assurance',
        findingsCount: {
          critical: 0,
          major: 1,
          minor: 3,
          observation: 6,
        },
        executiveSummary: 'Inspection conducted for NDA 123456. One major observation regarding CAPA effectiveness evaluation. Minor findings related to SOP version control and training records.',
        followUpRequired: true,
        followUpDate: new Date('2025-03-14'),
        capaGenerated: true,
        capaReferences: ['CAPA-2025-005'],
        createdBy: admin?._id,
      },
      {
        auditNumber: 'AUD-2025-003',
        tenantId: tenant._id,
        title: 'Supplier Audit - Active Pharmaceutical Ingredient Manufacturer',
        description: 'On-site audit of key API supplier to assess GMP compliance, quality systems, and supply chain reliability.',
        auditType: 'Supplier',
        scope: 'API manufacturing, quality control, quality assurance, warehouse',
        standard: 'ICH Q7',
        status: 'completed',
        priority: 'High',
        scheduledDate: new Date('2025-01-20'),
        startDate: new Date('2025-01-20'),
        endDate: new Date('2025-01-22'),
        completionDate: new Date('2025-01-29'),
        leadAuditor: qaManager?._id,
        auditTeam: [qcAnalyst?._id],
        auditee: 'PharmaChem Industries Ltd.',
        findingsCount: {
          critical: 0,
          major: 1,
          minor: 4,
          observation: 7,
        },
        executiveSummary: 'Supplier demonstrates good GMP compliance overall. One major finding related to environmental monitoring in production areas. Supplier has provided acceptable CAPA plan.',
        followUpRequired: true,
        followUpDate: new Date('2025-04-22'),
        capaGenerated: false,
        createdBy: qaManager?._id,
      },
      {
        auditNumber: 'AUD-2025-004',
        tenantId: tenant._id,
        title: 'Quality Control Laboratory Audit',
        description: 'Focused audit of QC laboratory operations, testing procedures, equipment qualification, and data integrity.',
        auditType: 'Internal',
        scope: 'QC Laboratory - HPLC, dissolution, microbiology, wet chemistry',
        standard: 'FDA 21 CFR Part 211.160',
        status: 'in_progress',
        priority: 'High',
        scheduledDate: new Date('2025-02-25'),
        startDate: new Date('2025-02-25'),
        leadAuditor: qaManager?._id,
        auditTeam: [admin?._id],
        auditee: 'Quality Control Laboratory',
        findingsCount: {
          critical: 0,
          major: 0,
          minor: 2,
          observation: 3,
        },
        followUpRequired: false,
        createdBy: qaManager?._id,
      },
      {
        auditNumber: 'AUD-2025-005',
        tenantId: tenant._id,
        title: 'ISO 9001:2015 Surveillance Audit',
        description: 'Annual surveillance audit by certification body to verify continued compliance with ISO 9001:2015 requirements.',
        auditType: 'External',
        scope: 'Quality management system - all departments',
        standard: 'ISO 9001:2015',
        status: 'planned',
        priority: 'Medium',
        scheduledDate: new Date('2025-03-15'),
        externalOrganization: 'BSI Group',
        auditorName: 'Sarah Williams',
        auditee: 'All Departments',
        followUpRequired: false,
        createdBy: admin?._id,
      },
      {
        auditNumber: 'AUD-2025-006',
        tenantId: tenant._id,
        title: 'Warehouse and Distribution Audit',
        description: 'Audit of warehouse operations, storage conditions, inventory management, and distribution controls.',
        auditType: 'Internal',
        scope: 'Warehouse, cold storage, shipping & receiving',
        standard: 'WHO Good Storage Practices',
        status: 'completed',
        priority: 'Medium',
        scheduledDate: new Date('2025-01-10'),
        startDate: new Date('2025-01-10'),
        endDate: new Date('2025-01-10'),
        completionDate: new Date('2025-01-17'),
        leadAuditor: qcAnalyst?._id,
        auditTeam: [qaManager?._id],
        auditee: 'Warehouse & Logistics',
        findingsCount: {
          critical: 0,
          major: 0,
          minor: 3,
          observation: 5,
        },
        executiveSummary: 'Warehouse operations are well controlled. Minor findings related to temperature mapping frequency and FIFO compliance in certain areas.',
        followUpRequired: true,
        followUpDate: new Date('2025-02-17'),
        capaGenerated: false,
        createdBy: qcAnalyst?._id,
      },
      {
        auditNumber: 'AUD-2025-007',
        tenantId: tenant._id,
        title: 'EU GMP Inspection Preparation Audit',
        description: 'Mock inspection in preparation for upcoming EMA inspection. Comprehensive review of all GMP critical systems.',
        auditType: 'Self-Inspection',
        scope: 'All GMP areas and systems',
        standard: 'EU GMP Guidelines',
        status: 'report_draft',
        priority: 'Critical',
        scheduledDate: new Date('2025-02-18'),
        startDate: new Date('2025-02-18'),
        endDate: new Date('2025-02-20'),
        leadAuditor: qaManager?._id,
        auditTeam: [admin?._id, qcAnalyst?._id],
        auditee: 'Manufacturing & Quality Systems',
        findingsCount: {
          critical: 1,
          major: 3,
          minor: 8,
          observation: 12,
        },
        executiveSummary: 'Mock inspection identified areas requiring immediate attention before regulatory inspection. Critical finding related to API starting material qualification documentation.',
        followUpRequired: true,
        followUpDate: new Date('2025-03-05'),
        capaGenerated: true,
        capaReferences: ['CAPA-2025-007', 'CAPA-2025-008', 'CAPA-2025-009'],
        createdBy: qaManager?._id,
      },
      {
        auditNumber: 'AUD-2025-008',
        tenantId: tenant._id,
        title: 'Cleaning Validation and Hygiene Audit',
        description: 'Focused audit of cleaning procedures, validation protocols, and hygiene practices across manufacturing areas.',
        auditType: 'Internal',
        scope: 'Manufacturing cleanrooms, equipment cleaning, personnel hygiene',
        standard: 'FDA 21 CFR Part 211.67',
        status: 'planned',
        priority: 'High',
        scheduledDate: new Date('2025-03-05'),
        leadAuditor: qaManager?._id,
        auditee: 'Manufacturing & Facilities',
        followUpRequired: false,
        createdBy: qaManager?._id,
      },
      {
        auditNumber: 'AUD-2025-009',
        tenantId: tenant._id,
        title: 'Computerized Systems Validation Audit',
        description: 'Assessment of computerized systems compliance with 21 CFR Part 11, including LIMS, MES, and document management systems.',
        auditType: 'Internal',
        scope: 'LIMS, MES, EDMS, ERP quality modules',
        standard: 'FDA 21 CFR Part 11',
        status: 'planned',
        priority: 'High',
        scheduledDate: new Date('2025-03-20'),
        leadAuditor: admin?._id,
        auditTeam: [qaManager?._id],
        auditee: 'IT & Quality Systems',
        followUpRequired: false,
        createdBy: admin?._id,
      },
      {
        auditNumber: 'AUD-2025-010',
        tenantId: tenant._id,
        title: 'Training and Competency Assessment Audit',
        description: 'Review of training programs, competency assessments, and training record management across all departments.',
        auditType: 'Internal',
        scope: 'HR training programs, GMP training, qualification records',
        standard: 'FDA 21 CFR Part 211.25',
        status: 'planned',
        priority: 'Medium',
        scheduledDate: new Date('2025-04-01'),
        leadAuditor: qcAnalyst?._id,
        auditee: 'Human Resources & All Departments',
        followUpRequired: false,
        createdBy: qcAnalyst?._id,
      },
      {
        auditNumber: 'AUD-2025-011',
        tenantId: tenant._id,
        title: 'Contract Laboratory Audit',
        description: 'Audit of contract testing laboratory used for stability studies and method validation.',
        auditType: 'Supplier',
        scope: 'Analytical testing, stability storage, quality systems',
        standard: 'ISO/IEC 17025',
        status: 'completed',
        priority: 'Medium',
        scheduledDate: new Date('2025-01-25'),
        startDate: new Date('2025-01-25'),
        endDate: new Date('2025-01-26'),
        completionDate: new Date('2025-02-02'),
        leadAuditor: qcAnalyst?._id,
        auditTeam: [qaManager?._id],
        auditee: 'AnalyTech Laboratories Inc.',
        findingsCount: {
          critical: 0,
          major: 0,
          minor: 2,
          observation: 4,
        },
        executiveSummary: 'Contract laboratory demonstrates good analytical capabilities and quality systems. Minor findings related to calibration scheduling and data backup procedures.',
        followUpRequired: true,
        followUpDate: new Date('2025-04-26'),
        capaGenerated: false,
        createdBy: qcAnalyst?._id,
      },
      {
        auditNumber: 'AUD-2025-012',
        tenantId: tenant._id,
        title: 'Deviation and CAPA System Effectiveness Audit',
        description: 'Review of deviation management and CAPA system effectiveness, including root cause analysis quality and corrective action timeliness.',
        auditType: 'Internal',
        scope: 'Deviation records, CAPA records, trending analysis',
        standard: 'ICH Q10',
        status: 'in_progress',
        priority: 'High',
        scheduledDate: new Date('2025-02-28'),
        startDate: new Date('2025-02-28'),
        leadAuditor: qaManager?._id,
        auditTeam: [admin?._id],
        auditee: 'Quality Assurance',
        findingsCount: {
          critical: 0,
          major: 1,
          minor: 3,
          observation: 5,
        },
        followUpRequired: true,
        createdBy: qaManager?._id,
      },
    ];

    await Audit.insertMany(audits);
    console.log(`✅ Seeded ${audits.length} audits`);

    await mongoose.connection.close();
    console.log('👋 Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding audits:', error);
    process.exit(1);
  }
}

seedAudits();
