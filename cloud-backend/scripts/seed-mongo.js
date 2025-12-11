const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/Qms_Pharm';

// Define schemas (simplified versions of the TypeScript models)
const tenantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  subdomain: { type: String, required: true, unique: true },
  isActive: { type: Boolean, default: true },
  settings: {
    branding: {
      logo: String,
      primaryColor: String,
      secondaryColor: String,
    },
    features: [String],
  },
}, { timestamps: true });

const userSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  email: { type: String, required: true },
  passwordHash: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  role: { type: String, enum: ['admin', 'manager', 'user', 'viewer'], default: 'user' },
  isActive: { type: Boolean, default: true },
  lastLogin: Date,
}, { timestamps: true });

userSchema.index({ tenantId: 1, email: 1 }, { unique: true });

const Tenant = mongoose.model('Tenant', tenantSchema);
const User = mongoose.model('User', userSchema);

async function seedDatabase() {
  try {
    // Connect to MongoDB
    console.log('📦 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await User.deleteMany({});
    await Tenant.deleteMany({});

    // Hash password for all demo users
    const passwordHash = await bcrypt.hash('password123', 10);

    // Create Tenant 1: ABC Pharmacy
    console.log('🏢 Creating Tenant 1: ABC Pharmacy...');
    const tenant1 = await Tenant.create({
      name: 'ABC Pharmacy',
      subdomain: 'abcpharmacy',
      isActive: true,
      settings: {
        branding: {
          primaryColor: '#0066cc',
          secondaryColor: '#00cc66',
        },
        features: ['quality_management', 'document_control', 'audit_management'],
      },
    });

    // Create users for Tenant 1
    console.log('👤 Creating users for ABC Pharmacy...');
    await User.create([
      {
        tenantId: tenant1._id,
        email: 'admin@abcpharmacy.com',
        passwordHash,
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        isActive: true,
      },
      {
        tenantId: tenant1._id,
        email: 'qm@abcpharmacy.com',
        passwordHash,
        firstName: 'Quality',
        lastName: 'Manager',
        role: 'manager',
        isActive: true,
      },
      {
        tenantId: tenant1._id,
        email: 'user@abcpharmacy.com',
        passwordHash,
        firstName: 'Regular',
        lastName: 'User',
        role: 'user',
        isActive: true,
      },
    ]);

    // Create Tenant 2: XYZ Medical
    console.log('🏢 Creating Tenant 2: XYZ Medical...');
    const tenant2 = await Tenant.create({
      name: 'XYZ Medical',
      subdomain: 'xyzmedical',
      isActive: true,
      settings: {
        branding: {
          primaryColor: '#cc0066',
          secondaryColor: '#6600cc',
        },
        features: ['quality_management', 'document_control'],
      },
    });

    // Create users for Tenant 2
    console.log('👤 Creating users for XYZ Medical...');
    await User.create({
      tenantId: tenant2._id,
      email: 'admin@xyzmedical.com',
      passwordHash,
      firstName: 'Admin',
      lastName: 'Medical',
      role: 'admin',
      isActive: true,
    });

    console.log('\n✅ Seed completed successfully!\n');
    console.log('📝 Demo accounts:');
    console.log('━'.repeat(50));
    console.log('\n🏢 Tenant 1 (ABC Pharmacy):');
    console.log('  👤 Admin:   admin@abcpharmacy.com / password123');
    console.log('  👤 Manager: qm@abcpharmacy.com / password123');
    console.log('  👤 User:    user@abcpharmacy.com / password123');
    console.log('\n🏢 Tenant 2 (XYZ Medical):');
    console.log('  👤 Admin:   admin@xyzmedical.com / password123');
    console.log('\n' + '━'.repeat(50));

  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n📦 MongoDB connection closed');
  }
}

seedDatabase();
