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

const deviationSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  deviationNumber: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  severity: { type: String, enum: ['Minor', 'Major', 'Critical'], required: true },
  category: { type: String, required: true },
  status: {
    type: String,
    enum: ['open', 'investigation', 'capa_required', 'capa_in_progress', 'pending_closure', 'closed', 'rejected'],
    default: 'open'
  },
  occurrenceDate: { type: Date, required: true },
  detectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  productAffected: String,
  batchNumber: String,
  immediateAction: String,
  rootCause: String,
  investigation: String,
  correctiveAction: String,
  preventiveAction: String,
  capaId: { type: mongoose.Schema.Types.ObjectId, ref: 'CAPA' },
  closureDate: Date,
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  verificationComments: String,
  attachments: [String],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

const Tenant = mongoose.model('Tenant', tenantSchema);
const User = mongoose.model('User', userSchema);
const Deviation = mongoose.model('Deviation', deviationSchema);

// Demo deviations data
const demoDeviations = [
  {
    deviationNumber: 'DEV-2025-001',
    title: 'Temperature Excursion in Cold Storage Area',
    description: 'Temperature in refrigerated storage area exceeded acceptable range (2-8°C) and reached 12°C for approximately 2 hours. Alert system was triggered at 08:45 AM. Maintenance was immediately notified.',
    severity: 'Major',
    category: 'Environmental',
    status: 'investigation',
    occurrenceDate: new Date('2025-10-18'),
    productAffected: 'Insulin vials, Vaccines',
    batchNumber: 'Multiple batches',
    immediateAction: 'Products were immediately moved to backup refrigeration unit. Temperature logger data downloaded for review. Affected products quarantined pending quality review.',
    investigation: 'Investigation revealed that the refrigeration unit compressor failed due to worn bearings. Unit was last serviced 6 months ago per preventive maintenance schedule. No prior indication of malfunction.',
    rootCause: 'Premature compressor failure due to manufacturing defect in bearings.',
  },
  {
    deviationNumber: 'DEV-2025-002',
    title: 'Incorrect Labeling on Compounded Product',
    description: 'Patient-specific compound (morphine sulfate 5mg/ml oral solution) was labeled with incorrect concentration (10mg/ml). Error discovered during pharmacist final check before dispensing.',
    severity: 'Critical',
    category: 'Labeling',
    status: 'capa_required',
    occurrenceDate: new Date('2025-10-17'),
    productAffected: 'Morphine Sulfate Oral Solution',
    batchNumber: 'N/A - Patient specific',
    immediateAction: 'Product was immediately destroyed. Second pharmacist conducted 100% check of all compounds prepared that day. No additional errors found. Patient was not affected as error caught before dispensing.',
    investigation: 'Technician used pre-printed label template for 10mg/ml concentration instead of selecting correct 5mg/ml template from system. Verbal confirmation of concentration was not performed as required by SOP.',
    rootCause: 'Human error - technician fatigue and failure to follow verbal verification SOP. Label templates stored alphabetically, leading to selection error.',
    correctiveAction: 'Technician received immediate retraining on labeling procedures. Mandatory verbal confirmation now required for all controlled substances.',
    preventiveAction: 'Implement barcode scanning for label template selection. Redesign template storage to separate by drug class. Add visual concentration indicator to templates.',
  },
  {
    deviationNumber: 'DEV-2025-003',
    title: 'Documentation Not Completed Within Required Timeframe',
    description: 'Batch compounding record for sterile preparations was not completed and signed within the required 24-hour timeframe. Record was completed 36 hours after compounding.',
    severity: 'Minor',
    category: 'Documentation',
    status: 'closed',
    occurrenceDate: new Date('2025-10-10'),
    productAffected: 'Batch 2025-C-4523 TPN solutions',
    batchNumber: 'BATCH-2025-C-4523',
    immediateAction: 'Pharmacist-in-charge immediately reviewed and signed the record. All preparation steps were documented contemporaneously, only final sign-off was delayed.',
    investigation: 'Responsible pharmacist was called away for emergency prescription verification and forgot to complete sign-off upon return. No reminder system in place.',
    rootCause: 'Lack of electronic reminder system for pending documentation tasks.',
    correctiveAction: 'Record was completed and signed. Affected batch was quarantined pending quality review. Quality review determined all critical parameters were met.',
    preventiveAction: 'Implemented daily checklist for pending documentation. Added electronic reminder in pharmacy management system.',
    closureDate: new Date('2025-10-15'),
  },
  {
    deviationNumber: 'DEV-2025-004',
    title: 'Cleanroom Viable Particle Count Exceeded Action Limit',
    description: 'Weekly microbial monitoring of ISO Class 5 cleanroom showed colony count of 5 CFU (action limit: 3 CFU) on one settle plate. Other locations were within acceptable limits.',
    severity: 'Major',
    category: 'Environmental',
    status: 'capa_in_progress',
    occurrenceDate: new Date('2025-10-15'),
    productAffected: 'All sterile products compounded on 10/15',
    batchNumber: 'Multiple batches',
    immediateAction: 'Cleanroom immediately shut down. All products prepared that day quarantined. Deep cleaning and disinfection performed. Repeat sampling conducted.',
    investigation: 'Colonies identified as Staphylococcus epidermidis. Review of gowning records showed new technician may have had incomplete hand sanitization. Settle plate was located near gowning area.',
    rootCause: 'Inadequate hand hygiene technique by new staff member. Gap in training verification.',
    correctiveAction: 'New technician received remedial aseptic technique training. Gowning procedure observation completed successfully. Additional settle plate added near gowning area for ongoing monitoring.',
    preventiveAction: 'Updated training program to include hands-on evaluation of hand hygiene. Implement quarterly competency assessments.',
  },
  {
    deviationNumber: 'DEV-2025-005',
    title: 'Controlled Substance Count Discrepancy',
    description: 'Physical inventory count of Hydrocodone 10mg tablets showed 48 tablets in vault, but perpetual inventory indicated 50 tablets should be present. Discrepancy of 2 tablets.',
    severity: 'Critical',
    category: 'Inventory',
    status: 'investigation',
    occurrenceDate: new Date('2025-10-19'),
    productAffected: 'Hydrocodone 10mg tablets',
    batchNumber: 'LOT-HC-89234',
    immediateAction: 'Vault secured. All dispensing activities suspended pending investigation. Second count performed by Pharmacist-in-Charge - discrepancy confirmed. DEA notification initiated per policy.',
    investigation: 'Review of dispensing records for past 30 days in progress. All prescriptions being reconciled against perpetual inventory entries. Security camera footage being reviewed.',
  },
  {
    deviationNumber: 'DEV-2024-112',
    title: 'Equipment Not Calibrated Within Due Date',
    description: 'Class II biological safety cabinet (BSC) was used for sterile compounding 3 days after annual certification due date. Oversight in tracking system prevented timely notification.',
    severity: 'Major',
    category: 'Equipment',
    status: 'closed',
    occurrenceDate: new Date('2024-09-15'),
    productAffected: 'Sterile compounds prepared 09/15-09/17',
    batchNumber: 'Multiple batches',
    immediateAction: 'BSC use immediately suspended. All products prepared during affected period quarantined. Emergency certification performed within 24 hours.',
    investigation: 'Calibration reminder email was sent but not acted upon due to high workload. BSC certification completed successfully - all parameters within specifications.',
    rootCause: 'Manual tracking system for equipment calibration prone to human error. Heavy workload led to oversight.',
    correctiveAction: 'Emergency certification performed - BSC passed all tests. Products released after quality review.',
    preventiveAction: 'Implemented automated equipment tracking system with escalating reminders. Equipment use now locked out in system when calibration overdue.',
    closureDate: new Date('2024-10-05'),
  },
  {
    deviationNumber: 'DEV-2025-006',
    title: 'Wrong Drug Dispensed - Caught During Patient Counseling',
    description: 'Prescription for Metformin 500mg was filled with Metoprolol 50mg. Error caught by pharmacist during patient counseling when discussing diabetes management and patient mentioned blood pressure.',
    severity: 'Critical',
    category: 'Dispensing Error',
    status: 'capa_required',
    occurrenceDate: new Date('2025-10-16'),
    productAffected: 'N/A - Error caught before patient took medication',
    immediateAction: 'Incorrect medication retrieved from patient immediately. Correct medication dispensed with profuse apologies. Store manager and district pharmacist notified. Incident report filed with state board.',
    investigation: 'Look-alike drug names (METformin vs METOprolol). Technician was distracted during filling. Pharmacist verification was rushed due to long wait times. Patient counseling prevented serious adverse event.',
    rootCause: 'Similar drug names, inadequate separation of look-alike products, and workload pressure led to error. Verification step was rushed.',
    correctiveAction: 'Immediate separation of Metformin and Metoprolol stock. Enhanced visual cues added (tall-man lettering on bins). Mandatory stress timeout before verification when wait times exceed 30 minutes.',
    preventiveAction: 'Implement barcode scanning for all prescription verification. Add "look-alike/sound-alike" visual warnings in computer system. Reduce workload pressure through staffing adjustments.',
  },
  {
    deviationNumber: 'DEV-2025-007',
    title: 'Water System Total Organic Carbon (TOC) Out of Specification',
    description: 'Purified water system TOC test result was 520 ppb, exceeding the action limit of 500 ppb. System used for equipment cleaning and non-sterile compounding.',
    severity: 'Minor',
    category: 'Water System',
    status: 'pending_closure',
    occurrenceDate: new Date('2025-10-12'),
    immediateAction: 'Water system use suspended. Backup water source activated. Resin beds regenerated and system flushed. Repeat testing initiated.',
    investigation: 'TOC spike caused by overdue UV lamp replacement. Lamp was at 95% of manufacturer-recommended operational hours. Warning indicator had been overlooked.',
    rootCause: 'Preventive maintenance for UV lamp replacement was not performed on schedule.',
    correctiveAction: 'UV lamps replaced. System sanitized and flushed. Three consecutive TOC tests all <250 ppb. System returned to service.',
    preventiveAction: 'Added UV lamp replacement to critical equipment PM schedule with automatic work order generation. Installed hour-meter with auto-shutoff at lamp life limit.',
  },
  {
    deviationNumber: 'DEV-2025-008',
    title: 'Expired Ingredient Used in Non-Sterile Compounding',
    description: 'Flavoring agent with expiration date of 09/30/2025 was used in compound prepared on 10/02/2025. Error discovered during batch record review.',
    severity: 'Major',
    category: 'Compounding',
    status: 'investigation',
    occurrenceDate: new Date('2025-10-02'),
    productAffected: 'Pediatric Amoxicillin Suspension',
    batchNumber: 'BATCH-PED-AMX-1002',
    immediateAction: 'All units of affected batch immediately quarantined (8 units total). Patient notification initiated. No adverse events reported. Expired ingredient removed from inventory.',
    investigation: 'Monthly expiration date check was completed 09/28, but this ingredient was not flagged as it had 2 days remaining. Ingredient was not removed before expiration. No alert system for imminent expiration.',
  },
  {
    deviationNumber: 'DEV-2024-095',
    title: 'Incomplete Training Documentation',
    description: 'New pharmacy technician was performing sterile compounding activities, but training records showed aseptic technique competency assessment was not documented. Employee claimed training was completed verbally.',
    severity: 'Major',
    category: 'Training',
    status: 'closed',
    occurrenceDate: new Date('2024-08-22'),
    productAffected: 'Sterile compounds prepared by technician from hire date to discovery (15 days)',
    immediateAction: 'Technician removed from sterile compounding duties immediately. All products prepared during period quarantined pending review. Formal competency assessment scheduled.',
    investigation: 'Trainer provided verbal instruction and observation but did not complete required competency assessment form. Training checklist was not used.',
    rootCause: 'Training documentation process not followed. No verification step in onboarding workflow to ensure all training records complete before allowing independent work.',
    correctiveAction: 'Comprehensive competency assessment completed - technician passed all requirements. Products released after quality review.',
    preventiveAction: 'Implemented electronic training management system with mandatory sign-offs. System access now locked until all required training documented. Monthly audit of training records.',
    closureDate: new Date('2024-09-10'),
  },
  {
    deviationNumber: 'DEV-2025-009',
    title: 'Pharmacy Received Product from Non-Approved Supplier',
    description: 'Order for API (active pharmaceutical ingredient) was received from secondary supplier not on approved supplier list. Purchasing agent used alternate supplier due to primary supplier stockout without obtaining quality approval.',
    severity: 'Critical',
    category: 'Supply Chain',
    status: 'capa_required',
    occurrenceDate: new Date('2025-10-14'),
    productAffected: 'Raw material - not yet used in compounding',
    immediateAction: 'All material from unapproved supplier quarantined immediately. COA (Certificate of Analysis) obtained but not accepted. Material will be returned to supplier. No patient impact as material not used.',
    investigation: 'Purchasing agent unaware of approved supplier list requirements. Pressure to maintain inventory levels led to unauthorized substitution. Quality approval process was bypassed.',
    rootCause: 'Lack of training for purchasing staff on approved supplier requirements. No system control to prevent purchases from unapproved suppliers.',
    correctiveAction: 'Material returned to supplier. Purchasing agent received training on supplier qualification and approval process. All pending orders reviewed for compliance.',
    preventiveAction: 'Update purchasing system to allow orders only from pre-approved suppliers. Require quality approval for any new supplier additions. Monthly review of purchasing compliance.',
  },
  {
    deviationNumber: 'DEV-2025-010',
    title: 'Power Outage Affected Refrigerated Storage',
    description: 'Unexpected power outage lasted 4 hours. Emergency generator did not automatically engage for refrigeration units. Temperature in refrigerators rose to 15°C before power restored.',
    severity: 'Major',
    category: 'Facility',
    status: 'investigation',
    occurrenceDate: new Date('2025-10-20'),
    productAffected: 'All refrigerated medications',
    batchNumber: 'Multiple products',
    immediateAction: 'All refrigerated products quarantined pending temperature stability evaluation. Manufacturers contacted for guidance. Generator failure reported for emergency repair. Continuous temperature monitoring increased.',
    investigation: 'Generator transfer switch failed to activate automatically. Maintenance records show switch was tested 6 months ago and passed. Root cause of switch failure under investigation with equipment vendor.',
  },
];

async function seedDeviations() {
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

    // Delete existing deviations for this tenant
    console.log('🧹 Removing existing deviations...');
    await Deviation.deleteMany({ tenantId: tenant._id });

    // Create demo deviations
    console.log('⚠️  Creating demo deviations...\n');

    for (const devData of demoDeviations) {
      let detectedBy, assignedTo, verifiedBy, createdBy, updatedBy;

      // Assign users based on status
      switch (devData.status) {
        case 'open':
        case 'investigation':
          detectedBy = regularUser._id;
          assignedTo = qmUser._id;
          createdBy = regularUser._id;
          updatedBy = qmUser._id;
          break;
        case 'capa_required':
        case 'capa_in_progress':
        case 'pending_closure':
          detectedBy = regularUser._id;
          assignedTo = qmUser._id;
          verifiedBy = adminUser._id;
          createdBy = regularUser._id;
          updatedBy = adminUser._id;
          break;
        case 'closed':
          detectedBy = regularUser._id;
          assignedTo = qmUser._id;
          verifiedBy = adminUser._id;
          createdBy = regularUser._id;
          updatedBy = adminUser._id;
          devData.verificationComments = 'All corrective and preventive actions verified as effective. Deviation closed.';
          break;
        default:
          detectedBy = regularUser._id;
          createdBy = regularUser._id;
          updatedBy = regularUser._id;
      }

      const deviation = await Deviation.create({
        tenantId: tenant._id,
        ...devData,
        detectedBy,
        assignedTo: assignedTo || undefined,
        verifiedBy: verifiedBy || undefined,
        createdBy,
        updatedBy,
      });

      const statusIcon = {
        open: '🆕',
        investigation: '🔍',
        capa_required: '⚠️',
        capa_in_progress: '🔧',
        pending_closure: '⏳',
        closed: '✅',
        rejected: '❌',
      }[devData.status] || '📋';

      const severityIcon = {
        Minor: '🟡',
        Major: '🟠',
        Critical: '🔴',
      }[devData.severity] || '⚪';

      console.log(`${statusIcon} ${severityIcon} ${deviation.deviationNumber}: ${deviation.title}`);
      console.log(`   Category: ${deviation.category} | Severity: ${deviation.severity} | Status: ${deviation.status}`);
    }

    console.log('\n✅ Demo deviations seeded successfully!\n');
    console.log('📊 Summary:');
    console.log('━'.repeat(70));

    const stats = await Deviation.aggregate([
      { $match: { tenantId: tenant._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    console.log('\n📈 By Status:');
    stats.forEach(stat => {
      const icon = {
        open: '🆕',
        investigation: '🔍',
        capa_required: '⚠️',
        capa_in_progress: '🔧',
        pending_closure: '⏳',
        closed: '✅',
        rejected: '❌',
      }[stat._id] || '📋';
      console.log(`   ${icon} ${stat._id}: ${stat.count}`);
    });

    const severityStats = await Deviation.aggregate([
      { $match: { tenantId: tenant._id } },
      { $group: { _id: '$severity', count: { $sum: 1 } } },
    ]);

    console.log('\n🎯 By Severity:');
    severityStats.forEach(stat => {
      const icon = {
        Minor: '🟡',
        Major: '🟠',
        Critical: '🔴',
      }[stat._id] || '⚪';
      console.log(`   ${icon} ${stat._id}: ${stat.count}`);
    });

    const categoryStats = await Deviation.aggregate([
      { $match: { tenantId: tenant._id } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);

    console.log('\n📁 By Category:');
    categoryStats.forEach(stat => {
      console.log(`   ${stat._id}: ${stat.count}`);
    });

    console.log('\n' + '━'.repeat(70));
    console.log('🎉 You can now login and view these deviations!\n');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('📦 MongoDB connection closed');
  }
}

seedDeviations();
