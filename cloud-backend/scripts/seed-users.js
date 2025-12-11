const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/Qms_Pharm';

// Role permissions mapping
const rolePermissions = {
  admin: {
    canManageUsers: true,
    canManageTrainings: true,
    canCreateExams: true,
    canAssignTrainings: true,
    canViewReports: true,
    canIssueCertificates: true,
    canManageDocuments: true,
  },
  qa_manager: {
    canManageUsers: false,
    canManageTrainings: true,
    canCreateExams: true,
    canAssignTrainings: true,
    canViewReports: true,
    canIssueCertificates: true,
    canManageDocuments: true,
  },
  pharmacist: {
    canManageUsers: false,
    canManageTrainings: false,
    canCreateExams: false,
    canAssignTrainings: false,
    canViewReports: true,
    canIssueCertificates: false,
    canManageDocuments: true,
  },
  technician: {
    canManageUsers: false,
    canManageTrainings: false,
    canCreateExams: false,
    canAssignTrainings: false,
    canViewReports: false,
    canIssueCertificates: false,
    canManageDocuments: false,
  },
  trainee: {
    canManageUsers: false,
    canManageTrainings: false,
    canCreateExams: false,
    canAssignTrainings: false,
    canViewReports: false,
    canIssueCertificates: false,
    canManageDocuments: false,
  },
};

// Define user schema
const userSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  email: { type: String, required: true },
  passwordHash: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  role: { type: String, enum: ['admin', 'qa_manager', 'pharmacist', 'technician', 'trainee'], default: 'trainee' },
  department: String,
  jobTitle: String,
  employeeId: String,
  phone: String,
  permissions: {
    canManageUsers: { type: Boolean, default: false },
    canManageTrainings: { type: Boolean, default: false },
    canCreateExams: { type: Boolean, default: false },
    canAssignTrainings: { type: Boolean, default: false },
    canViewReports: { type: Boolean, default: false },
    canIssueCertificates: { type: Boolean, default: false },
    canManageDocuments: { type: Boolean, default: false },
  },
  isActive: { type: Boolean, default: true },
  emailNotifications: { type: Boolean, default: true },
  lastLogin: Date,
}, { timestamps: true });

userSchema.index({ tenantId: 1, email: 1 }, { unique: true });

// Tenant schema for lookup
const tenantSchema = new mongoose.Schema({
  name: String,
  subdomain: String,
  isActive: Boolean,
  settings: {
    branding: {
      logo: String,
      primaryColor: String,
      secondaryColor: String,
    },
    features: [String],
  },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const Tenant = mongoose.model('Tenant', tenantSchema);

async function seedUsers() {
  try {
    console.log('📦 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get ABC Pharmacy tenant
    const tenant = await Tenant.findOne({ subdomain: 'abcpharmacy' });
    if (!tenant) {
      console.error('❌ ABC Pharmacy tenant not found. Please run seed-mongo.js first.');
      process.exit(1);
    }

    const tenantId = tenant._id;
    const passwordHash = await bcrypt.hash('password123', 10);

    // Clear existing users for this tenant
    console.log('🧹 Clearing existing users...');
    await User.deleteMany({ tenantId });

    // Create users with different roles
    console.log('👥 Creating users with different roles...');

    const users = [
      {
        tenantId,
        email: 'admin@abcpharmacy.com',
        passwordHash,
        firstName: 'John',
        lastName: 'Administrator',
        role: 'admin',
        department: 'Administration',
        jobTitle: 'System Administrator',
        employeeId: 'EMP001',
        phone: '+1-555-0101',
        permissions: rolePermissions.admin,
        isActive: true,
        emailNotifications: true,
      },
      {
        tenantId,
        email: 'qa.manager@abcpharmacy.com',
        passwordHash,
        firstName: 'Sarah',
        lastName: 'Johnson',
        role: 'qa_manager',
        department: 'Quality Assurance',
        jobTitle: 'QA Manager',
        employeeId: 'EMP002',
        phone: '+1-555-0102',
        permissions: rolePermissions.qa_manager,
        isActive: true,
        emailNotifications: true,
      },
      {
        tenantId,
        email: 'pharmacist@abcpharmacy.com',
        passwordHash,
        firstName: 'Michael',
        lastName: 'Chen',
        role: 'pharmacist',
        department: 'Pharmacy',
        jobTitle: 'Senior Pharmacist',
        employeeId: 'EMP003',
        phone: '+1-555-0103',
        permissions: rolePermissions.pharmacist,
        isActive: true,
        emailNotifications: true,
      },
      {
        tenantId,
        email: 'technician@abcpharmacy.com',
        passwordHash,
        firstName: 'Emily',
        lastName: 'Davis',
        role: 'technician',
        department: 'Pharmacy',
        jobTitle: 'Pharmacy Technician',
        employeeId: 'EMP004',
        phone: '+1-555-0104',
        permissions: rolePermissions.technician,
        isActive: true,
        emailNotifications: true,
      },
      {
        tenantId,
        email: 'trainee@abcpharmacy.com',
        passwordHash,
        firstName: 'Alex',
        lastName: 'Wilson',
        role: 'trainee',
        department: 'Pharmacy',
        jobTitle: 'Pharmacy Trainee',
        employeeId: 'EMP005',
        phone: '+1-555-0105',
        permissions: rolePermissions.trainee,
        isActive: true,
        emailNotifications: true,
      },
    ];

    await User.insertMany(users);

    console.log(`\n✅ Successfully created ${users.length} users!\n`);
    console.log('📋 User Accounts:');
    console.log('━'.repeat(70));
    console.log('\n🏢 ABC Pharmacy Users:\n');

    users.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.firstName} ${user.lastName}`);
      console.log(`     📧 Email: ${user.email}`);
      console.log(`     🔑 Password: password123`);
      console.log(`     👤 Role: ${user.role}`);
      console.log(`     🏷️  Department: ${user.department}`);
      console.log(`     💼 Job Title: ${user.jobTitle}`);
      console.log('');
    });

    console.log('━'.repeat(70));
    console.log('\n📊 Role Permissions Summary:');
    console.log('━'.repeat(70));
    console.log('\n  Admin:');
    console.log('    ✅ Full access to all features');
    console.log('\n  QA Manager:');
    console.log('    ✅ Manage trainings, create exams, assign trainings');
    console.log('    ✅ View reports, issue certificates, manage documents');
    console.log('    ❌ Cannot manage users');
    console.log('\n  Pharmacist:');
    console.log('    ✅ View reports, manage documents');
    console.log('    ❌ Cannot manage trainings or create exams');
    console.log('\n  Technician:');
    console.log('    ✅ Complete assigned trainings only');
    console.log('    ❌ No management permissions');
    console.log('\n  Trainee:');
    console.log('    ✅ Complete assigned trainings only');
    console.log('    ❌ No management permissions');
    console.log('━'.repeat(70));

  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n📦 MongoDB connection closed');
  }
}

seedUsers();
