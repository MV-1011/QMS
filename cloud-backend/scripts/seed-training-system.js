const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/Qms_Pharm';

// Define schemas
const trainingSchema = new mongoose.Schema({
  trainingNumber: String,
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant' },
  title: String,
  description: String,
  trainingType: String,
  category: String,
  status: String,
  priority: String,
  scheduledDate: Date,
  completionDate: Date,
  dueDate: Date,
  duration: Number,
  trainer: String,
  trainerType: String,
  externalOrganization: String,
  assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  completedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  documentReferences: [String],
  materials: [String],
  assessmentRequired: Boolean,
  passingScore: Number,
  attendanceCount: Number,
  passedCount: Number,
  averageScore: Number,
  isRecurring: Boolean,
  recurrenceInterval: String,
  nextDueDate: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

const trainingContentSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant' },
  trainingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Training' },
  title: String,
  description: String,
  contentType: String,
  contentUrl: String,
  fileName: String,
  fileSize: Number,
  duration: Number,
  order: Number,
  isRequired: Boolean,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

const examSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant' },
  trainingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Training' },
  title: String,
  description: String,
  instructions: String,
  questions: [{
    questionText: String,
    questionType: String,
    options: [String],
    correctAnswers: [Number],
    points: Number,
    explanation: String,
  }],
  totalPoints: Number,
  passingScore: Number,
  timeLimit: Number,
  maxAttempts: Number,
  shuffleQuestions: Boolean,
  shuffleOptions: Boolean,
  showResults: Boolean,
  showCorrectAnswers: Boolean,
  isActive: Boolean,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

const trainingAssignmentSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant' },
  trainingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Training' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedAt: Date,
  dueDate: Date,
  status: String,
  contentProgress: [{
    contentId: { type: mongoose.Schema.Types.ObjectId },
    completed: Boolean,
    completedAt: Date,
    timeSpent: Number,
  }],
  contentCompletedAt: Date,
  examAttempts: Number,
  lastExamScore: Number,
  bestExamScore: Number,
  examPassedAt: Date,
  certificateId: { type: mongoose.Schema.Types.ObjectId },
  certificateIssuedAt: Date,
  totalTimeSpent: Number,
  startedAt: Date,
  completedAt: Date,
}, { timestamps: true });

const notificationSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: String,
  title: String,
  message: String,
  link: String,
  relatedId: { type: mongoose.Schema.Types.ObjectId },
  relatedType: String,
  isRead: Boolean,
  readAt: Date,
  emailSent: Boolean,
  emailSentAt: Date,
}, { timestamps: true });

const userSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant' },
  email: String,
  firstName: String,
  lastName: String,
  role: String,
});

const Training = mongoose.model('Training', trainingSchema);
const TrainingContent = mongoose.model('TrainingContent', trainingContentSchema);
const Exam = mongoose.model('Exam', examSchema);
const TrainingAssignment = mongoose.model('TrainingAssignment', trainingAssignmentSchema);
const Notification = mongoose.model('Notification', notificationSchema);
const User = mongoose.model('User', userSchema);

async function seedTrainingSystem() {
  try {
    console.log('📦 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get users
    const adminUser = await User.findOne({ email: 'admin@abcpharmacy.com' });
    const qaManager = await User.findOne({ email: 'qa.manager@abcpharmacy.com' });
    const pharmacist = await User.findOne({ email: 'pharmacist@abcpharmacy.com' });
    const technician = await User.findOne({ email: 'technician@abcpharmacy.com' });
    const trainee = await User.findOne({ email: 'trainee@abcpharmacy.com' });

    if (!adminUser) {
      console.error('❌ Users not found. Please run seed-users.js first.');
      process.exit(1);
    }

    const tenantId = adminUser.tenantId;

    // Clear existing data (clear ALL trainings to avoid duplicate key errors)
    console.log('🧹 Clearing existing training system data...');
    await Training.deleteMany({});  // Clear all trainings globally to avoid duplicate key
    await TrainingContent.deleteMany({});
    await Exam.deleteMany({});
    await TrainingAssignment.deleteMany({});
    await Notification.deleteMany({});

    // Create trainings with content and exams
    console.log('📚 Creating trainings...');

    // Training 1: GMP Fundamentals
    const training1 = await Training.create({
      trainingNumber: 'TRN-2025-001',
      tenantId,
      title: 'GMP Fundamentals for Pharmacy Personnel',
      description: 'Comprehensive training covering Good Manufacturing Practice principles, documentation requirements, and quality standards essential for all pharmacy staff.',
      trainingType: 'Initial',
      category: 'GMP',
      status: 'scheduled',
      priority: 'Mandatory',
      scheduledDate: new Date('2025-01-15'),
      dueDate: new Date('2025-01-31'),
      duration: 240,
      trainer: 'Dr. Sarah Johnson',
      trainerType: 'Internal',
      assignedTo: [],
      completedBy: [],
      documentReferences: ['SOP-GMP-001', 'POLICY-QUALITY-001'],
      assessmentRequired: true,
      passingScore: 80,
      isRecurring: true,
      recurrenceInterval: 'Annual',
      nextDueDate: new Date('2026-01-15'),
      createdBy: adminUser._id,
    });

    // Training 1 Content
    const content1_1 = await TrainingContent.create({
      tenantId,
      trainingId: training1._id,
      title: 'Introduction to GMP',
      description: 'Overview of Good Manufacturing Practice and its importance in pharmacy',
      contentType: 'video',
      contentUrl: '/training-content/gmp-intro.mp4',
      fileName: 'gmp-intro.mp4',
      duration: 30,
      order: 1,
      isRequired: true,
      createdBy: adminUser._id,
    });

    const content1_2 = await TrainingContent.create({
      tenantId,
      trainingId: training1._id,
      title: 'Documentation Requirements',
      description: 'GMP documentation standards and best practices',
      contentType: 'pdf',
      contentUrl: '/training-content/gmp-documentation.pdf',
      fileName: 'gmp-documentation.pdf',
      fileSize: 2500000,
      order: 2,
      isRequired: true,
      createdBy: adminUser._id,
    });

    const content1_3 = await TrainingContent.create({
      tenantId,
      trainingId: training1._id,
      title: 'Quality Control Procedures',
      description: 'Detailed quality control procedures and checklists',
      contentType: 'ppt',
      contentUrl: '/training-content/quality-control.pptx',
      fileName: 'quality-control.pptx',
      fileSize: 5000000,
      order: 3,
      isRequired: true,
      createdBy: adminUser._id,
    });

    // Training 1 Exam
    await Exam.create({
      tenantId,
      trainingId: training1._id,
      title: 'GMP Fundamentals Assessment',
      description: 'Assessment to verify understanding of GMP principles',
      instructions: 'Answer all questions. You need 80% to pass. Time limit is 30 minutes.',
      questions: [
        {
          questionText: 'What does GMP stand for?',
          questionType: 'multiple_choice',
          options: [
            'Good Manufacturing Practice',
            'General Manufacturing Process',
            'Global Manufacturing Protocol',
            'Guided Manufacturing Procedure'
          ],
          correctAnswers: [0],
          points: 10,
          explanation: 'GMP stands for Good Manufacturing Practice, which is a system for ensuring products are consistently produced according to quality standards.',
        },
        {
          questionText: 'Which of the following are key principles of GMP?',
          questionType: 'multiple_select',
          options: [
            'Documentation of all processes',
            'Proper training of personnel',
            'Minimizing costs at all times',
            'Preventing contamination'
          ],
          correctAnswers: [0, 1, 3],
          points: 15,
          explanation: 'GMP key principles include documentation, training, and contamination prevention. Cost minimization is not a GMP principle.',
        },
        {
          questionText: 'All pharmacy personnel must complete GMP training before working with products.',
          questionType: 'true_false',
          options: ['True', 'False'],
          correctAnswers: [0],
          points: 10,
          explanation: 'True - GMP requires all personnel to be properly trained before working with pharmaceutical products.',
        },
        {
          questionText: 'What is the primary purpose of batch records?',
          questionType: 'multiple_choice',
          options: [
            'To track employee hours',
            'To provide traceability and documentation of production',
            'To calculate product costs',
            'To schedule deliveries'
          ],
          correctAnswers: [1],
          points: 10,
          explanation: 'Batch records provide complete traceability and documentation of the manufacturing process.',
        },
        {
          questionText: 'Environmental monitoring is required in pharmacy compounding areas.',
          questionType: 'true_false',
          options: ['True', 'False'],
          correctAnswers: [0],
          points: 10,
          explanation: 'True - Regular environmental monitoring ensures the compounding environment meets required standards.',
        },
      ],
      totalPoints: 55,
      passingScore: 80,
      timeLimit: 30,
      maxAttempts: 3,
      shuffleQuestions: true,
      shuffleOptions: false,
      showResults: true,
      showCorrectAnswers: true,
      isActive: true,
      createdBy: adminUser._id,
    });

    // Training 2: Controlled Substance Handling
    const training2 = await Training.create({
      trainingNumber: 'TRN-2025-002',
      tenantId,
      title: 'Controlled Substance Handling and Documentation',
      description: 'DEA compliance training covering proper handling, storage, documentation, and disposal of controlled substances.',
      trainingType: 'Annual',
      category: 'Compliance',
      status: 'scheduled',
      priority: 'Mandatory',
      scheduledDate: new Date('2025-02-01'),
      dueDate: new Date('2025-02-28'),
      duration: 180,
      trainer: 'Compliance Solutions LLC',
      trainerType: 'External',
      externalOrganization: 'Compliance Solutions LLC',
      assignedTo: [],
      completedBy: [],
      documentReferences: ['SOP-CONTROLLED-001', 'POLICY-DEA-001'],
      assessmentRequired: true,
      passingScore: 90,
      isRecurring: true,
      recurrenceInterval: 'Annual',
      createdBy: adminUser._id,
    });

    // Training 2 Content
    await TrainingContent.create({
      tenantId,
      trainingId: training2._id,
      title: 'DEA Regulations Overview',
      description: 'Understanding DEA schedules and regulations',
      contentType: 'video',
      contentUrl: '/training-content/dea-regulations.mp4',
      fileName: 'dea-regulations.mp4',
      duration: 45,
      order: 1,
      isRequired: true,
      createdBy: adminUser._id,
    });

    await TrainingContent.create({
      tenantId,
      trainingId: training2._id,
      title: 'Inventory Management Procedures',
      description: 'Perpetual inventory and reconciliation requirements',
      contentType: 'pdf',
      contentUrl: '/training-content/inventory-procedures.pdf',
      fileName: 'inventory-procedures.pdf',
      order: 2,
      isRequired: true,
      createdBy: adminUser._id,
    });

    // Training 2 Exam
    await Exam.create({
      tenantId,
      trainingId: training2._id,
      title: 'Controlled Substance Compliance Test',
      description: 'Test your knowledge of controlled substance handling requirements',
      instructions: 'This is a mandatory assessment. You must score 90% or higher to pass.',
      questions: [
        {
          questionText: 'Schedule II controlled substances require which type of prescription?',
          questionType: 'multiple_choice',
          options: [
            'Verbal prescription',
            'Written or electronic prescription only',
            'Any type of prescription',
            'No prescription required'
          ],
          correctAnswers: [1],
          points: 20,
          explanation: 'Schedule II substances require a written or electronic prescription and cannot be called in.',
        },
        {
          questionText: 'How often must controlled substance inventory be performed?',
          questionType: 'multiple_choice',
          options: [
            'Daily',
            'Weekly',
            'At least every 2 years',
            'Monthly'
          ],
          correctAnswers: [2],
          points: 20,
          explanation: 'DEA requires a complete inventory at least every 2 years, though many pharmacies do it more frequently.',
        },
        {
          questionText: 'Controlled substance discrepancies must be reported to the DEA.',
          questionType: 'true_false',
          options: ['True', 'False'],
          correctAnswers: [0],
          points: 20,
          explanation: 'True - Significant losses or thefts must be reported to the DEA using Form 106.',
        },
      ],
      totalPoints: 60,
      passingScore: 90,
      timeLimit: 20,
      maxAttempts: 2,
      shuffleQuestions: false,
      shuffleOptions: false,
      showResults: true,
      showCorrectAnswers: false,
      isActive: true,
      createdBy: adminUser._id,
    });

    // Training 3: Safety Training (no exam required)
    const training3 = await Training.create({
      trainingNumber: 'TRN-2025-003',
      tenantId,
      title: 'Workplace Safety and Emergency Procedures',
      description: 'Essential safety training covering emergency procedures, hazard identification, and workplace safety protocols.',
      trainingType: 'Initial',
      category: 'Safety',
      status: 'scheduled',
      priority: 'High',
      scheduledDate: new Date('2025-01-20'),
      dueDate: new Date('2025-02-15'),
      duration: 60,
      trainer: 'Safety Team',
      trainerType: 'Internal',
      assignedTo: [],
      completedBy: [],
      assessmentRequired: false,
      isRecurring: true,
      recurrenceInterval: 'Annual',
      createdBy: qaManager._id,
    });

    await TrainingContent.create({
      tenantId,
      trainingId: training3._id,
      title: 'Emergency Evacuation Procedures',
      description: 'What to do in case of fire, chemical spill, or other emergencies',
      contentType: 'video',
      contentUrl: '/training-content/emergency-procedures.mp4',
      fileName: 'emergency-procedures.mp4',
      duration: 20,
      order: 1,
      isRequired: true,
      createdBy: qaManager._id,
    });

    await TrainingContent.create({
      tenantId,
      trainingId: training3._id,
      title: 'Safety Data Sheets Guide',
      description: 'How to read and use Safety Data Sheets (SDS)',
      contentType: 'pdf',
      contentUrl: '/training-content/sds-guide.pdf',
      fileName: 'sds-guide.pdf',
      order: 2,
      isRequired: true,
      createdBy: qaManager._id,
    });

    // Create assignments for technician and trainee
    console.log('📋 Creating training assignments...');

    // Assign GMP training to technician and trainee
    const content1Ids = [content1_1._id, content1_2._id, content1_3._id];

    const assignment1 = await TrainingAssignment.create({
      tenantId,
      trainingId: training1._id,
      userId: technician._id,
      assignedBy: qaManager._id,
      assignedAt: new Date(),
      dueDate: new Date('2025-01-31'),
      status: 'assigned',
      contentProgress: content1Ids.map(id => ({
        contentId: id,
        completed: false,
      })),
      examAttempts: 0,
      totalTimeSpent: 0,
    });

    const assignment2 = await TrainingAssignment.create({
      tenantId,
      trainingId: training1._id,
      userId: trainee._id,
      assignedBy: qaManager._id,
      assignedAt: new Date(),
      dueDate: new Date('2025-01-31'),
      status: 'assigned',
      contentProgress: content1Ids.map(id => ({
        contentId: id,
        completed: false,
      })),
      examAttempts: 0,
      totalTimeSpent: 0,
    });

    // Create notifications
    console.log('🔔 Creating notifications...');

    await Notification.create([
      {
        tenantId,
        userId: technician._id,
        type: 'training_assigned',
        title: 'New Training Assigned',
        message: `You have been assigned to "GMP Fundamentals for Pharmacy Personnel"`,
        link: `/training/my-trainings/${assignment1._id}`,
        relatedId: assignment1._id,
        relatedType: 'TrainingAssignment',
        isRead: false,
        emailSent: false,
      },
      {
        tenantId,
        userId: trainee._id,
        type: 'training_assigned',
        title: 'New Training Assigned',
        message: `You have been assigned to "GMP Fundamentals for Pharmacy Personnel"`,
        link: `/training/my-trainings/${assignment2._id}`,
        relatedId: assignment2._id,
        relatedType: 'TrainingAssignment',
        isRead: false,
        emailSent: false,
      },
    ]);

    // Update training assignedTo
    await Training.findByIdAndUpdate(training1._id, {
      $push: { assignedTo: { $each: [technician._id, trainee._id] } }
    });

    console.log('\n✅ Training system seed completed!\n');
    console.log('📊 Summary:');
    console.log('━'.repeat(50));
    console.log(`  📚 Trainings created: 3`);
    console.log(`  📄 Training contents: 5`);
    console.log(`  📝 Exams created: 2`);
    console.log(`  📋 Assignments created: 2`);
    console.log(`  🔔 Notifications created: 2`);
    console.log('━'.repeat(50));
    console.log('\n📋 Trainings:');
    console.log('  1. GMP Fundamentals (with exam, 80% passing)');
    console.log('  2. Controlled Substance Handling (with exam, 90% passing)');
    console.log('  3. Workplace Safety (no exam required)');
    console.log('\n👥 Assigned Users:');
    console.log('  - Emily Davis (Technician) - GMP Fundamentals');
    console.log('  - Alex Wilson (Trainee) - GMP Fundamentals');
    console.log('━'.repeat(50));

  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n📦 MongoDB connection closed');
  }
}

seedTrainingSystem();
