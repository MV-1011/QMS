const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/Qms_Pharm';

// Training schema
const trainingSchema = new mongoose.Schema({
  trainingNumber: { type: String, required: true, unique: true },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  trainingType: { type: String, enum: ['Initial', 'Refresher', 'Annual', 'Ad-hoc', 'Certification'], required: true },
  category: { type: String, enum: ['SOP', 'GMP', 'Safety', 'Compliance', 'Technical', 'Soft Skills', 'Other'], required: true },
  status: { type: String, enum: ['scheduled', 'in_progress', 'completed', 'overdue', 'cancelled'], default: 'scheduled' },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Mandatory'], default: 'Medium' },
  scheduledDate: { type: Date, required: true },
  completionDate: { type: Date },
  dueDate: { type: Date, required: true },
  duration: { type: Number },
  trainer: { type: String },
  trainerType: { type: String, enum: ['Internal', 'External'] },
  externalOrganization: { type: String },
  assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  completedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  documentReferences: [{ type: String }],
  materials: [{ type: String }],
  assessmentRequired: { type: Boolean, default: false },
  passingScore: { type: Number },
  attendanceCount: { type: Number, default: 0 },
  passedCount: { type: Number, default: 0 },
  averageScore: { type: Number },
  isRecurring: { type: Boolean, default: false },
  recurrenceInterval: { type: String, enum: ['Monthly', 'Quarterly', 'Semi-Annual', 'Annual'] },
  nextDueDate: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

// User schema for lookup
const userSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  email: { type: String, required: true },
  passwordHash: String,
  firstName: String,
  lastName: String,
  role: String,
  isActive: Boolean,
});

const Training = mongoose.model('Training', trainingSchema);
const User = mongoose.model('User', userSchema);

async function seedTrainings() {
  try {
    console.log('📦 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get ABC Pharmacy tenant and users
    const adminUser = await User.findOne({ email: 'admin@abcpharmacy.com' });
    const qmUser = await User.findOne({ email: 'qm@abcpharmacy.com' });
    const regularUser = await User.findOne({ email: 'user@abcpharmacy.com' });

    if (!adminUser) {
      console.error('❌ Admin user not found. Please run seed-mongo.js first.');
      process.exit(1);
    }

    const tenantId = adminUser.tenantId;

    // Clear existing trainings for this tenant
    console.log('🧹 Clearing existing trainings...');
    await Training.deleteMany({ tenantId });

    // Create trainings
    console.log('📚 Creating trainings...');
    const trainings = [
      {
        trainingNumber: 'TRN-2025-001',
        tenantId,
        title: 'GMP Fundamentals for Pharmacy Personnel',
        description: 'Comprehensive training covering Good Manufacturing Practice principles, documentation requirements, and quality standards essential for all pharmacy staff. Topics include contamination control, proper documentation, and regulatory compliance.',
        trainingType: 'Initial',
        category: 'GMP',
        status: 'completed',
        priority: 'Mandatory',
        scheduledDate: new Date('2025-01-15'),
        completionDate: new Date('2025-01-15'),
        dueDate: new Date('2025-01-31'),
        duration: 240, // 4 hours
        trainer: 'Dr. Sarah Johnson',
        trainerType: 'Internal',
        assignedTo: [adminUser._id, qmUser._id, regularUser._id],
        completedBy: [adminUser._id, qmUser._id, regularUser._id],
        assessmentRequired: true,
        passingScore: 80,
        attendanceCount: 3,
        passedCount: 3,
        averageScore: 92,
        isRecurring: true,
        recurrenceInterval: 'Annual',
        nextDueDate: new Date('2026-01-15'),
        createdBy: adminUser._id,
      },
      {
        trainingNumber: 'TRN-2025-002',
        tenantId,
        title: 'USP <797> Sterile Compounding',
        description: 'Training on United States Pharmacopeia Chapter 797 requirements for sterile compounding. Covers aseptic technique, cleanroom behavior, garbing procedures, and beyond-use dating.',
        trainingType: 'Certification',
        category: 'Compliance',
        status: 'completed',
        priority: 'Mandatory',
        scheduledDate: new Date('2025-02-01'),
        completionDate: new Date('2025-02-01'),
        dueDate: new Date('2025-02-15'),
        duration: 480, // 8 hours
        trainer: 'PharmaCert Training Institute',
        trainerType: 'External',
        externalOrganization: 'PharmaCert Training Institute',
        assignedTo: [qmUser._id, regularUser._id],
        completedBy: [qmUser._id, regularUser._id],
        documentReferences: ['SOP-STERILE-001', 'PROTOCOL-STERILE-001'],
        assessmentRequired: true,
        passingScore: 85,
        attendanceCount: 2,
        passedCount: 2,
        averageScore: 88,
        isRecurring: true,
        recurrenceInterval: 'Annual',
        nextDueDate: new Date('2026-02-01'),
        createdBy: adminUser._id,
      },
      {
        trainingNumber: 'TRN-2025-003',
        tenantId,
        title: 'Controlled Substance Handling and Documentation',
        description: 'DEA compliance training covering proper handling, storage, documentation, and disposal of controlled substances. Includes perpetual inventory management and reporting requirements.',
        trainingType: 'Annual',
        category: 'Compliance',
        status: 'in_progress',
        priority: 'Mandatory',
        scheduledDate: new Date('2025-03-01'),
        dueDate: new Date('2025-03-31'),
        duration: 180, // 3 hours
        trainer: 'Compliance Solutions LLC',
        trainerType: 'External',
        externalOrganization: 'Compliance Solutions LLC',
        assignedTo: [adminUser._id, qmUser._id, regularUser._id],
        completedBy: [adminUser._id],
        documentReferences: ['SOP-CONTROLLED-001', 'POLICY-DEA-001'],
        assessmentRequired: true,
        passingScore: 90,
        attendanceCount: 1,
        passedCount: 1,
        averageScore: 95,
        isRecurring: true,
        recurrenceInterval: 'Annual',
        createdBy: adminUser._id,
      },
      {
        trainingNumber: 'TRN-2025-004',
        tenantId,
        title: 'Equipment Cleaning and Sanitization Procedures',
        description: 'Hands-on training for proper cleaning and sanitization of pharmacy equipment. Covers cleaning agents, techniques, documentation, and verification methods.',
        trainingType: 'Refresher',
        category: 'SOP',
        status: 'scheduled',
        priority: 'High',
        scheduledDate: new Date('2025-04-15'),
        dueDate: new Date('2025-04-30'),
        duration: 120, // 2 hours
        trainer: 'Quality Manager',
        trainerType: 'Internal',
        assignedTo: [qmUser._id, regularUser._id],
        documentReferences: ['SOP-CLEANING-001', 'FORM-CLEANING-LOG'],
        assessmentRequired: false,
        isRecurring: true,
        recurrenceInterval: 'Quarterly',
        createdBy: qmUser._id,
      },
      {
        trainingNumber: 'TRN-2025-005',
        tenantId,
        title: 'Medication Error Prevention and Reporting',
        description: 'Training on medication error types, prevention strategies, and proper incident reporting procedures. Emphasizes non-punitive reporting culture and continuous improvement.',
        trainingType: 'Annual',
        category: 'Safety',
        status: 'scheduled',
        priority: 'Mandatory',
        scheduledDate: new Date('2025-05-01'),
        dueDate: new Date('2025-05-15'),
        duration: 90, // 1.5 hours
        trainer: 'Dr. Michael Chen',
        trainerType: 'Internal',
        assignedTo: [adminUser._id, qmUser._id, regularUser._id],
        documentReferences: ['POLICY-ERROR-PREVENTION', 'FORM-INCIDENT-REPORT'],
        assessmentRequired: true,
        passingScore: 80,
        isRecurring: true,
        recurrenceInterval: 'Annual',
        createdBy: adminUser._id,
      },
    ];

    await Training.insertMany(trainings);

    console.log(`\n✅ Successfully seeded ${trainings.length} trainings!\n`);
    console.log('📋 Training Records:');
    console.log('━'.repeat(60));
    trainings.forEach(t => {
      console.log(`  ${t.trainingNumber}: ${t.title}`);
      console.log(`    Status: ${t.status} | Category: ${t.category} | Priority: ${t.priority}`);
    });
    console.log('━'.repeat(60));

  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n📦 MongoDB connection closed');
  }
}

seedTrainings();
