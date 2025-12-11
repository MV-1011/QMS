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

const capaSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  capaNumber: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  type: { type: String, enum: ['Corrective', 'Preventive', 'Both'], required: true },
  source: { type: String, required: true },
  sourceId: { type: mongoose.Schema.Types.ObjectId },
  sourceReference: String,
  status: {
    type: String,
    enum: ['open', 'investigation', 'action_plan', 'implementation', 'effectiveness_check', 'completed', 'cancelled'],
    default: 'open'
  },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
  rootCause: String,
  correctiveAction: String,
  preventiveAction: String,
  actionPlan: String,
  effectivenessCheck: String,
  effectivenessResult: String,
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  dueDate: Date,
  implementationDate: Date,
  completionDate: Date,
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  verificationDate: Date,
  verificationComments: String,
  attachments: [String],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

const Tenant = mongoose.model('Tenant', tenantSchema);
const User = mongoose.model('User', userSchema);
const CAPA = mongoose.model('CAPA', capaSchema);

// Demo CAPA data
const demoCapas = [
  {
    capaNumber: 'CAPA-2025-001',
    title: 'Implement Enhanced Temperature Monitoring System',
    description: 'Following deviation DEV-2025-001 (temperature excursion), implement enhanced monitoring to prevent future occurrences.',
    type: 'Both',
    source: 'Deviation',
    sourceReference: 'DEV-2025-001',
    status: 'implementation',
    priority: 'High',
    rootCause: 'Existing temperature monitoring relied on single refrigeration unit with no backup system. Compressor failure led to 2-hour temperature excursion.',
    correctiveAction: 'Install redundant refrigeration system with automatic switchover capability. Replace failed compressor in primary unit.',
    preventiveAction: 'Implement IoT-enabled temperature sensors with cloud monitoring and SMS alerts. Establish preventive maintenance schedule for refrigeration equipment every 3 months instead of current 6 months.',
    actionPlan: '1. Source and install backup refrigeration unit (2 weeks)\n2. Install IoT temperature monitoring system (1 week)\n3. Configure alert thresholds and notification system\n4. Train staff on new monitoring procedures\n5. Update SOPs for temperature monitoring',
    dueDate: new Date('2025-11-15'),
    implementationDate: new Date('2025-10-25'),
  },
  {
    capaNumber: 'CAPA-2025-002',
    title: 'Barcode Scanning Implementation for Labeling Verification',
    description: 'Critical labeling error (DEV-2025-002) requires systematic approach to prevent label selection errors.',
    type: 'Both',
    source: 'Deviation',
    sourceReference: 'DEV-2025-002',
    status: 'action_plan',
    priority: 'Critical',
    rootCause: 'Manual label template selection prone to human error, especially with look-alike drug names and similar concentration templates stored alphabetically.',
    correctiveAction: 'Immediate retraining of all compounding staff on labeling procedures. Implement mandatory verbal verification for controlled substances.',
    preventiveAction: 'Deploy barcode scanning system for label template selection. Reorganize label template storage by drug class instead of alphabetical. Add visual concentration indicators to all templates using color coding.',
    actionPlan: '1. Research and procure barcode scanning system\n2. Create barcode library for all label templates\n3. Redesign label template database with drug class categorization\n4. Implement color coding: Red=high concentration, Yellow=medium, Green=low\n5. Train all staff on new system\n6. Update SOP-LABEL-001',
    dueDate: new Date('2025-12-01'),
  },
  {
    capaNumber: 'CAPA-2025-003',
    title: 'Electronic Documentation Reminder System',
    description: 'Delayed documentation completion (DEV-2025-003) indicates need for automated tracking.',
    type: 'Preventive',
    source: 'Deviation',
    sourceReference: 'DEV-2025-003',
    status: 'completed',
    priority: 'Medium',
    rootCause: 'No systematic reminder for pending documentation tasks. Pharmacists rely on memory, which fails during high workload periods.',
    correctiveAction: 'Not applicable - documentation was completed, just delayed.',
    preventiveAction: 'Implement electronic reminder system in pharmacy management software. Daily checklist automatically generated for pending documentation. Email reminders sent at 18 hours after compounding.',
    actionPlan: 'Configured pharmacy management system to generate automated reminders. Created daily checklist dashboard. Established escalation to supervisor if documentation pending >20 hours.',
    effectivenessCheck: 'Monitor documentation completion times for 90 days post-implementation. Target: 100% of batch records signed within 24 hours.',
    effectivenessResult: '90-day monitoring completed. 98.5% of records signed within 24 hours. System effective.',
    dueDate: new Date('2025-10-20'),
    implementationDate: new Date('2025-10-18'),
    completionDate: new Date('2025-10-22'),
  },
  {
    capaNumber: 'CAPA-2025-004',
    title: 'Enhanced Aseptic Technique Training Program',
    description: 'Cleanroom contamination event (DEV-2025-004) requires improved training and competency assessment.',
    type: 'Both',
    source: 'Deviation',
    sourceReference: 'DEV-2025-004',
    status: 'effectiveness_check',
    priority: 'High',
    rootCause: 'New technician training program lacked hands-on evaluation of hand hygiene technique. Verbal instruction only, no practical verification.',
    correctiveAction: 'New technician received remedial training with hands-on evaluation. Successfully passed competency assessment.',
    preventiveAction: 'Redesign training program to include mandatory hands-on evaluation with fluorescent dye testing for hand hygiene. Implement quarterly competency assessments for all cleanroom personnel. Add monthly environmental monitoring review sessions.',
    actionPlan: 'Updated training SOP with hands-on requirements. Procured fluorescent hand hygiene training system. Scheduled quarterly competency testing. All cleanroom staff retrained on new procedures.',
    effectivenessCheck: 'Monitor cleanroom viable particle counts for 6 months. Track training completion and competency scores. Zero contamination events expected.',
    implementationDate: new Date('2025-10-20'),
    dueDate: new Date('2025-11-30'),
  },
  {
    capaNumber: 'CAPA-2025-005',
    title: 'Controlled Substance Inventory Management System Upgrade',
    description: 'Inventory discrepancy (DEV-2025-005) requires enhanced tracking and reconciliation procedures.',
    type: 'Both',
    source: 'Deviation',
    sourceReference: 'DEV-2025-005',
    status: 'investigation',
    priority: 'Critical',
    rootCause: 'Investigation in progress. Preliminary findings suggest possible data entry error in perpetual inventory vs. physical count.',
    correctiveAction: 'Vault secured, all dispensing reviewed. DEA notified per regulations.',
    preventiveAction: 'Pending completion of investigation. Proposed actions include: automated inventory system with barcode scanning, daily reconciliation instead of weekly, dual verification for all controlled substance transactions.',
    actionPlan: 'Complete root cause investigation. Based on findings, implement enhanced tracking system.',
    dueDate: new Date('2025-11-10'),
  },
  {
    capaNumber: 'CAPA-2024-045',
    title: 'Automated Equipment Calibration Tracking System',
    description: 'Equipment used past calibration due date (DEV-2024-112) requires fail-safe tracking.',
    type: 'Preventive',
    source: 'Deviation',
    sourceReference: 'DEV-2024-112',
    status: 'completed',
    priority: 'High',
    rootCause: 'Manual tracking system for equipment calibration dependent on email reminders which can be overlooked during high workload.',
    correctiveAction: 'Emergency certification completed - equipment within specifications. Products released after quality review.',
    preventiveAction: 'Implemented automated equipment tracking system with database of all equipment calibration schedules. System generates escalating reminders at 30, 14, and 7 days before due date. Equipment use automatically locked out in system when calibration overdue.',
    actionPlan: 'Software system procured and configured. All equipment entered into database. Integration with facility access system completed. Staff trained.',
    effectivenessCheck: '100% on-time calibration for 6 months. No equipment used past due date.',
    effectivenessResult: '6-month tracking completed. 100% compliance achieved. Zero overdue calibrations. System highly effective.',
    implementationDate: new Date('2024-10-15'),
    completionDate: new Date('2024-11-30'),
    dueDate: new Date('2024-11-01'),
  },
  {
    capaNumber: 'CAPA-2025-006',
    title: 'Look-Alike/Sound-Alike (LASA) Drug Safety Program',
    description: 'Wrong drug dispensed (DEV-2025-006) requires comprehensive LASA risk mitigation.',
    type: 'Both',
    source: 'Deviation',
    sourceReference: 'DEV-2025-006',
    status: 'implementation',
    priority: 'Critical',
    rootCause: 'Similar drug names (Metformin/Metoprolol) combined with inadequate separation and workload pressure led to selection error.',
    correctiveAction: 'Immediate physical separation of Metformin and Metoprolol stock. Enhanced visual cues with tall-man lettering on storage bins. Mandatory timeout before verification when wait times exceed 30 minutes.',
    preventiveAction: 'Implement comprehensive LASA drug program: barcode scanning for all prescriptions, computer system LASA warnings, separate storage areas for LASA drugs, staffing adjustments to reduce workload pressure, quarterly LASA drug list review.',
    actionPlan: '1. Conduct pharmacy-wide LASA risk assessment\n2. Create prioritized list of high-risk LASA pairs\n3. Implement barcode verification system\n4. Redesign storage layout for physical separation\n5. Update computer system with LASA alerts\n6. Increase staffing during peak hours',
    dueDate: new Date('2025-12-15'),
    implementationDate: new Date('2025-11-01'),
  },
  {
    capaNumber: 'CAPA-2025-007',
    title: 'Water System Preventive Maintenance Enhancement',
    description: 'Water system TOC out of spec (DEV-2025-007) due to missed UV lamp replacement.',
    type: 'Preventive',
    source: 'Deviation',
    sourceReference: 'DEV-2025-007',
    status: 'completed',
    priority: 'Medium',
    rootCause: 'UV lamp replacement scheduled in preventive maintenance program but warning indicator overlooked. No automatic shutoff when lamp reaches end of life.',
    correctiveAction: 'UV lamps replaced, system sanitized and returned to service after testing.',
    preventiveAction: 'Installed hour-meter with automatic shutoff at manufacturer-recommended lamp life limit. Added UV lamp replacement to critical equipment PM schedule with automatic work order generation 30 days before due date.',
    actionPlan: 'Hour meters installed on all UV units. PM software configured for automatic scheduling. Backup UV lamps added to inventory.',
    effectivenessCheck: 'Monitor water system TOC results for 12 months. Track PM completion rates. Zero missed PM activities expected.',
    effectivenessResult: 'All water system parameters within specifications for 3 months post-implementation. PM completion at 100%. Effective.',
    implementationDate: new Date('2025-10-15'),
    completionDate: new Date('2025-10-18'),
    dueDate: new Date('2025-10-20'),
  },
  {
    capaNumber: 'CAPA-2025-008',
    title: 'Expiration Date Management System',
    description: 'Expired ingredient used in compounding (DEV-2025-008) requires automated expiration tracking.',
    type: 'Both',
    source: 'Deviation',
    sourceReference: 'DEV-2025-008',
    status: 'action_plan',
    priority: 'High',
    rootCause: 'Monthly expiration checks conducted, but no alert system for ingredients approaching expiration. Staff manually remove expired items, process prone to human error.',
    correctiveAction: 'All units quarantined and patients notified. No adverse events reported. Expired ingredient removed from stock.',
    preventiveAction: 'Implement automated expiration date tracking in inventory system. Alerts generated 60 days before expiration. Automatic inventory lockout for items within 14 days of expiration. Weekly automated report of approaching expirations.',
    actionPlan: '1. Inventory system upgrade to support expiration tracking\n2. Barcode all inventory with expiration dates\n3. Configure alert thresholds\n4. Train staff on new system\n5. Establish process for early notification to suppliers for potential returns',
    dueDate: new Date('2025-11-25'),
  },
  {
    capaNumber: 'CAPA-2024-038',
    title: 'Training Management System Implementation',
    description: 'Incomplete training documentation (DEV-2024-095) revealed gaps in training verification.',
    type: 'Preventive',
    source: 'Deviation',
    sourceReference: 'DEV-2024-095',
    status: 'completed',
    priority: 'High',
    rootCause: 'Paper-based training system with no verification step to ensure all required training completed before allowing independent work.',
    correctiveAction: 'Comprehensive competency assessment completed retrospectively. Technician met all requirements.',
    preventiveAction: 'Implemented electronic training management system with mandatory sign-offs. System access to sensitive areas (cleanroom, controlled substances) locked until all required training documented. Monthly audit of training compliance.',
    actionPlan: 'Software system procured and configured. All training records migrated to electronic system. Access control integration completed. SOPs updated.',
    effectivenessCheck: '100% training documentation compliance. Zero instances of staff working without documented training.',
    effectivenessResult: '6-month audit completed. 100% compliance achieved. All training properly documented before task performance. Highly effective.',
    implementationDate: new Date('2024-09-15'),
    completionDate: new Date('2024-10-30'),
    dueDate: new Date('2024-10-15'),
  },
  {
    capaNumber: 'CAPA-2025-009',
    title: 'Supplier Qualification System Enhancement',
    description: 'Unapproved supplier use (DEV-2025-009) requires system controls to prevent unauthorized purchases.',
    type: 'Preventive',
    source: 'Deviation',
    sourceReference: 'DEV-2025-009',
    status: 'implementation',
    priority: 'Critical',
    rootCause: 'Purchasing staff unaware of approved supplier list requirements. No system control to prevent purchases from unapproved suppliers.',
    correctiveAction: 'Material returned to supplier. Purchasing agent trained on supplier qualification requirements. All pending orders reviewed.',
    preventiveAction: 'Update purchasing system to allow orders only from pre-approved suppliers in master database. Require quality approval workflow for any new supplier additions. Implement monthly purchasing compliance audit. Training for all purchasing staff on supplier qualification process.',
    actionPlan: 'Purchasing system reconfigured with approved supplier whitelist. Quality approval workflow established. Training completed for purchasing team. Monthly audit reports automated.',
    dueDate: new Date('2025-11-20'),
    implementationDate: new Date('2025-10-28'),
  },
  {
    capaNumber: 'CAPA-2025-010',
    title: 'Emergency Generator and Backup Power System Upgrade',
    description: 'Power outage with generator failure (DEV-2025-010) requires enhanced backup systems.',
    type: 'Both',
    source: 'Deviation',
    sourceReference: 'DEV-2025-010',
    status: 'open',
    priority: 'Critical',
    rootCause: 'Investigation ongoing. Transfer switch failure prevented automatic generator engagement. Switch had passed test 6 months prior.',
    correctiveAction: 'All refrigerated products quarantined pending stability evaluation. Generator transfer switch repair in progress.',
    preventiveAction: 'Pending investigation completion. Proposed actions: replace transfer switch, increase testing frequency to monthly, install battery backup UPS for critical refrigeration units, establish agreement with backup cold storage facility.',
    actionPlan: 'Root cause investigation to be completed. Action plan to be developed based on findings.',
    dueDate: new Date('2025-11-30'),
  },
  {
    capaNumber: 'CAPA-2025-011',
    title: 'Process Validation for Sterile Compounding',
    description: 'Proactive CAPA from annual quality review - enhance sterile compounding validation program.',
    type: 'Preventive',
    source: 'Annual Quality Review',
    sourceReference: 'AQR-2025',
    status: 'action_plan',
    priority: 'Medium',
    rootCause: 'Not deviation-driven. Quality improvement initiative to enhance process validation.',
    preventiveAction: 'Implement enhanced process validation program for sterile compounding. Increase media fill testing frequency. Add process capability studies for high-volume compounds. Implement statistical process control for environmental monitoring.',
    actionPlan: '1. Conduct gap analysis of current validation program vs. best practices\n2. Develop enhanced validation protocol\n3. Perform additional media fills for all compounding personnel\n4. Implement SPC charts for environmental monitoring\n5. Establish ongoing process performance monitoring',
    dueDate: new Date('2026-01-31'),
  },
];

async function seedCapas() {
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

    // Delete existing CAPAs for this tenant
    console.log('🧹 Removing existing CAPAs...');
    await CAPA.deleteMany({ tenantId: tenant._id });

    // Create demo CAPAs
    console.log('🔧 Creating demo CAPAs...\n');

    for (const capaData of demoCapas) {
      let assignedTo, verifiedBy, createdBy, updatedBy;

      // Assign users based on status
      switch (capaData.status) {
        case 'open':
        case 'investigation':
          assignedTo = qmUser._id;
          createdBy = qmUser._id;
          updatedBy = qmUser._id;
          break;
        case 'action_plan':
        case 'implementation':
          assignedTo = qmUser._id;
          createdBy = qmUser._id;
          updatedBy = qmUser._id;
          break;
        case 'effectiveness_check':
          assignedTo = qmUser._id;
          verifiedBy = adminUser._id;
          createdBy = qmUser._id;
          updatedBy = adminUser._id;
          capaData.verificationDate = new Date();
          break;
        case 'completed':
          assignedTo = qmUser._id;
          verifiedBy = adminUser._id;
          createdBy = qmUser._id;
          updatedBy = adminUser._id;
          capaData.verificationDate = capaData.completionDate;
          capaData.verificationComments = 'All corrective and preventive actions verified as effective. CAPA closed.';
          break;
        default:
          assignedTo = qmUser._id;
          createdBy = qmUser._id;
          updatedBy = qmUser._id;
      }

      const capa = await CAPA.create({
        tenantId: tenant._id,
        ...capaData,
        assignedTo,
        verifiedBy: verifiedBy || undefined,
        createdBy,
        updatedBy,
      });

      const statusIcon = {
        open: '🆕',
        investigation: '🔍',
        action_plan: '📋',
        implementation: '🔧',
        effectiveness_check: '✅',
        completed: '✔️',
        cancelled: '🚫',
      }[capaData.status] || '📋';

      const priorityIcon = {
        Low: '🟢',
        Medium: '🟡',
        High: '🟠',
        Critical: '🔴',
      }[capaData.priority] || '⚪';

      const typeIcon = {
        Corrective: '🔧',
        Preventive: '🛡️',
        Both: '🔧🛡️',
      }[capaData.type] || '📋';

      console.log(`${statusIcon} ${priorityIcon} ${typeIcon} ${capa.capaNumber}: ${capa.title}`);
      console.log(`   Type: ${capa.type} | Priority: ${capa.priority} | Status: ${capa.status} | Source: ${capa.source}`);
    }

    console.log('\n✅ Demo CAPAs seeded successfully!\n');
    console.log('📊 Summary:');
    console.log('━'.repeat(70));

    const stats = await CAPA.aggregate([
      { $match: { tenantId: tenant._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    console.log('\n📈 By Status:');
    stats.forEach(stat => {
      const icon = {
        open: '🆕',
        investigation: '🔍',
        action_plan: '📋',
        implementation: '🔧',
        effectiveness_check: '✅',
        completed: '✔️',
        cancelled: '🚫',
      }[stat._id] || '📋';
      console.log(`   ${icon} ${stat._id}: ${stat.count}`);
    });

    const priorityStats = await CAPA.aggregate([
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

    const typeStats = await CAPA.aggregate([
      { $match: { tenantId: tenant._id } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]);

    console.log('\n📁 By Type:');
    typeStats.forEach(stat => {
      const icon = {
        Corrective: '🔧',
        Preventive: '🛡️',
        Both: '🔧🛡️',
      }[stat._id] || '📋';
      console.log(`   ${icon} ${stat._id}: ${stat.count}`);
    });

    const sourceStats = await CAPA.aggregate([
      { $match: { tenantId: tenant._id } },
      { $group: { _id: '$source', count: { $sum: 1 } } },
    ]);

    console.log('\n📂 By Source:');
    sourceStats.forEach(stat => {
      console.log(`   ${stat._id}: ${stat.count}`);
    });

    console.log('\n' + '━'.repeat(70));
    console.log('🎉 You can now login and view these CAPAs!\n');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('📦 MongoDB connection closed');
  }
}

seedCapas();
