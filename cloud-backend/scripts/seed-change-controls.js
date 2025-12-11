const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/Qms_Pharm';

// Define schemas
const tenantSchema = new mongoose.Schema({
  name: String,
  subdomain: String,
  isActive: Boolean,
  settings: Object,
}, { timestamps: true });

const userSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant' },
  email: String,
  passwordHash: String,
  firstName: String,
  lastName: String,
  role: String,
  isActive: Boolean,
}, { timestamps: true });

const changeControlSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  changeNumber: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  changeType: { type: String, required: true },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
  status: {
    type: String,
    enum: ['initiated', 'assessment', 'approval_pending', 'approved', 'implementation', 'verification', 'completed', 'rejected', 'cancelled'],
    default: 'initiated'
  },
  requestorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  approverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  implementationDate: Date,
  completionDate: Date,
  impactAssessment: String,
  riskLevel: String,
  affectedSystems: [String],
  approvalComments: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

const Tenant = mongoose.model('Tenant', tenantSchema);
const User = mongoose.model('User', userSchema);
const ChangeControl = mongoose.model('ChangeControl', changeControlSchema);

// Demo change control data
const demoChangeControls = [
  {
    changeNumber: 'CC-2025-001',
    title: 'Upgrade Temperature Monitoring System',
    description: 'Replace existing analog temperature monitors with digital IoT-enabled sensors for real-time monitoring and automated alerts. This will improve compliance and reduce manual logging errors.',
    changeType: 'Equipment Upgrade',
    priority: 'High',
    status: 'implementation',
    impactAssessment: 'High impact on storage operations. Requires validation after installation. Minimal disruption expected as installation will be done during off-hours.',
    riskLevel: 'Medium',
    affectedSystems: ['Cold Storage', 'Temperature Monitoring', 'Alarm System', 'Data Logging'],
    implementationDate: new Date('2025-11-15'),
    approvalComments: 'Approved with condition to complete IQ/OQ validation within 2 weeks of installation.',
  },
  {
    changeNumber: 'CC-2025-002',
    title: 'Update Controlled Substance Handling SOP',
    description: 'Revise SOP-CS-001 to align with new DEA regulations effective January 2025. Updates include enhanced security measures and modified documentation requirements.',
    changeType: 'Document Change',
    priority: 'Critical',
    status: 'approved',
    impactAssessment: 'Critical compliance requirement. All staff handling controlled substances must be retrained. Failure to implement could result in regulatory violations.',
    riskLevel: 'High',
    affectedSystems: ['Controlled Substance Management', 'Staff Training', 'Security Protocols'],
    implementationDate: new Date('2025-11-01'),
    approvalComments: 'Fast-track approval due to regulatory deadline. Training must be completed before implementation.',
  },
  {
    changeNumber: 'CC-2025-003',
    title: 'Implement Electronic Batch Record System',
    description: 'Transition from paper-based batch records to electronic batch record (EBR) system for compounding operations. This will improve accuracy, traceability, and efficiency.',
    changeType: 'Process Change',
    priority: 'Medium',
    status: 'assessment',
    impactAssessment: 'Major process change affecting all compounding operations. Requires extensive validation, staff training, and parallel run period. Expected efficiency gains of 30% once implemented.',
    riskLevel: 'High',
    affectedSystems: ['Compounding Operations', 'Quality Control', 'Document Management', 'Training Records'],
    approvalComments: null,
  },
  {
    changeNumber: 'CC-2025-004',
    title: 'Replace HEPA Filters in Cleanroom',
    description: 'Scheduled replacement of HEPA filters in ISO Class 5 cleanroom as part of preventive maintenance program. Filters are approaching 2-year service life.',
    changeType: 'Maintenance',
    priority: 'High',
    status: 'approval_pending',
    impactAssessment: 'Routine maintenance activity. Cleanroom will be out of service for 8 hours during replacement. Compounding schedule adjusted accordingly.',
    riskLevel: 'Low',
    affectedSystems: ['Cleanroom HVAC', 'Sterile Compounding'],
    implementationDate: new Date('2025-10-28'),
    approvalComments: null,
  },
  {
    changeNumber: 'CC-2025-005',
    title: 'Add New Supplier for API Materials',
    description: 'Qualify and add PharmaChem Industries as approved supplier for common API materials to ensure supply chain redundancy and competitive pricing.',
    changeType: 'Supplier Change',
    priority: 'Medium',
    status: 'initiated',
    impactAssessment: 'Medium impact. Requires supplier qualification audit, quality agreement, and initial material testing. Will provide supply chain resilience.',
    riskLevel: 'Medium',
    affectedSystems: ['Procurement', 'Supplier Management', 'Quality Control'],
    approvalComments: null,
  },
  {
    changeNumber: 'CC-2025-006',
    title: 'Update Cleaning Validation Protocol',
    description: 'Revise cleaning validation protocol to include new analytical method with improved sensitivity for residue detection.',
    changeType: 'Protocol Change',
    priority: 'Medium',
    status: 'completed',
    impactAssessment: 'Improves cleaning validation sensitivity by 50%. Requires revalidation of 3 key pieces of equipment.',
    riskLevel: 'Low',
    affectedSystems: ['Cleaning Validation', 'Analytical Methods', 'Equipment Qualification'],
    implementationDate: new Date('2025-09-15'),
    completionDate: new Date('2025-10-10'),
    approvalComments: 'Excellent improvement to our validation program. Revalidation completed successfully.',
  },
  {
    changeNumber: 'CC-2024-015',
    title: 'Relocate Controlled Substance Storage',
    description: 'Move controlled substances to new secure vault with enhanced security features including biometric access control and 24/7 video surveillance.',
    changeType: 'Facility Change',
    priority: 'High',
    status: 'verification',
    impactAssessment: 'Significant security improvement. Requires DEA notification and inspection. All inventory must be verified during transfer.',
    riskLevel: 'Medium',
    affectedSystems: ['Controlled Substance Storage', 'Security Systems', 'Access Control'],
    implementationDate: new Date('2025-10-15'),
    approvalComments: 'Approved pending DEA notification and final security system validation.',
  },
  {
    changeNumber: 'CC-2024-012',
    title: 'Change Pharmacy Management Software',
    description: 'Upgrade from PharmaSys v2.0 to PharmaSys v3.5 to gain new features including enhanced drug interaction checking and integrated inventory management.',
    changeType: 'System Upgrade',
    priority: 'Medium',
    status: 'rejected',
    impactAssessment: 'Requires extensive data migration and staff retraining. Cost-benefit analysis shows ROI will take 3+ years.',
    riskLevel: 'High',
    affectedSystems: ['Pharmacy Management System', 'Inventory', 'Prescription Processing'],
    approvalComments: 'Rejected due to high cost and long ROI period. Revisit in 12 months when budget allows.',
  },
  {
    changeNumber: 'CC-2025-007',
    title: 'Implement Beyond-Use Dating Calculator',
    description: 'Deploy automated software tool to calculate beyond-use dates for compounded sterile preparations per USP <797> requirements.',
    changeType: 'Technology Implementation',
    priority: 'Low',
    status: 'initiated',
    impactAssessment: 'Low risk enhancement. Improves accuracy and reduces calculation errors. Minimal training required.',
    riskLevel: 'Low',
    affectedSystems: ['Compounding Operations', 'Labeling System'],
    approvalComments: null,
  },
  {
    changeNumber: 'CC-2024-008',
    title: 'Emergency Chiller Replacement',
    description: 'Replace failed refrigeration chiller unit serving cold storage area. Original unit beyond repair after 15 years of service.',
    changeType: 'Emergency Repair',
    priority: 'Critical',
    status: 'completed',
    impactAssessment: 'Critical equipment failure. Products moved to backup refrigeration. Replacement completed within 48 hours to minimize impact.',
    riskLevel: 'Critical',
    affectedSystems: ['Refrigeration System', 'Cold Storage', 'Temperature Control'],
    implementationDate: new Date('2024-09-20'),
    completionDate: new Date('2024-09-22'),
    approvalComments: 'Emergency change approved via phone. Excellent response time from facilities team.',
  },
];

async function seedChangeControls() {
  try {
    console.log('📦 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get the first tenant (ABC Pharmacy)
    const tenant = await Tenant.findOne({ subdomain: 'abcpharmacy' });
    if (!tenant) {
      console.error('❌ Tenant "ABC Pharmacy" not found. Please run seed-mongo.js first.');
      process.exit(1);
    }

    // Get users
    const adminUser = await User.findOne({ email: 'admin@abcpharmacy.com' });
    const qmUser = await User.findOne({ email: 'qm@abcpharmacy.com' });
    const regularUser = await User.findOne({ email: 'user@abcpharmacy.com' });

    if (!adminUser || !qmUser || !regularUser) {
      console.error('❌ Users not found. Please run seed-mongo.js first.');
      process.exit(1);
    }

    // Delete existing change controls for this tenant
    console.log('🧹 Removing existing change controls...');
    await ChangeControl.deleteMany({ tenantId: tenant._id });

    // Create demo change controls
    console.log('📋 Creating demo change controls...\n');

    for (const ccData of demoChangeControls) {
      let requestorId, approverId, createdBy, updatedBy;

      // Assign users based on status
      switch (ccData.status) {
        case 'initiated':
          requestorId = regularUser._id;
          createdBy = regularUser._id;
          updatedBy = regularUser._id;
          break;
        case 'assessment':
          requestorId = regularUser._id;
          createdBy = regularUser._id;
          updatedBy = qmUser._id;
          break;
        case 'approval_pending':
        case 'approved':
        case 'implementation':
        case 'verification':
        case 'completed':
          requestorId = qmUser._id;
          approverId = adminUser._id;
          createdBy = qmUser._id;
          updatedBy = adminUser._id;
          break;
        case 'rejected':
          requestorId = regularUser._id;
          approverId = adminUser._id;
          createdBy = regularUser._id;
          updatedBy = adminUser._id;
          break;
        default:
          requestorId = regularUser._id;
          createdBy = regularUser._id;
          updatedBy = regularUser._id;
      }

      const changeControl = await ChangeControl.create({
        tenantId: tenant._id,
        ...ccData,
        requestorId,
        approverId: approverId || undefined,
        createdBy,
        updatedBy,
      });

      const statusIcon = {
        initiated: '🆕',
        assessment: '🔍',
        approval_pending: '⏳',
        approved: '✅',
        implementation: '🔧',
        verification: '🧪',
        completed: '✔️',
        rejected: '❌',
        cancelled: '🚫',
      }[ccData.status] || '📋';

      const priorityIcon = {
        Low: '🟢',
        Medium: '🟡',
        High: '🟠',
        Critical: '🔴',
      }[ccData.priority] || '⚪';

      console.log(`${statusIcon} ${priorityIcon} ${changeControl.changeNumber}: ${changeControl.title}`);
      console.log(`   Type: ${changeControl.changeType} | Priority: ${changeControl.priority} | Status: ${changeControl.status}`);
    }

    console.log('\n✅ Demo change controls seeded successfully!\n');
    console.log('📊 Summary:');
    console.log('━'.repeat(70));

    const stats = await ChangeControl.aggregate([
      { $match: { tenantId: tenant._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    console.log('\n📈 By Status:');
    stats.forEach(stat => {
      const icon = {
        initiated: '🆕',
        assessment: '🔍',
        approval_pending: '⏳',
        approved: '✅',
        implementation: '🔧',
        verification: '🧪',
        completed: '✔️',
        rejected: '❌',
        cancelled: '🚫',
      }[stat._id] || '📋';
      console.log(`   ${icon} ${stat._id}: ${stat.count}`);
    });

    const priorityStats = await ChangeControl.aggregate([
      { $match: { tenantId: tenant._id } },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]);

    console.log('\n🎯 By Priority:');
    priorityStats.forEach(stat => {
      const icon = {
        Low: '🟢',
        Medium: '🟡',
        High: '🟠',
        Critical: '🔴',
      }[stat._id] || '⚪';
      console.log(`   ${icon} ${stat._id}: ${stat.count}`);
    });

    const typeStats = await ChangeControl.aggregate([
      { $match: { tenantId: tenant._id } },
      { $group: { _id: '$changeType', count: { $sum: 1 } } },
    ]);

    console.log('\n📁 By Type:');
    typeStats.forEach(stat => {
      console.log(`   ${stat._id}: ${stat.count}`);
    });

    console.log('\n' + '━'.repeat(70));
    console.log('🎉 You can now login and view these change controls!\n');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('📦 MongoDB connection closed');
  }
}

seedChangeControls();
