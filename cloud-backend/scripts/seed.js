const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runSeed() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'eqms_pharmacy',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
  });

  try {
    await client.connect();
    console.log('📦 Connected to database');

    // Read and execute seed data
    const seedPath = path.join(__dirname, 'seed.sql');
    const seedData = fs.readFileSync(seedPath, 'utf8');

    console.log('🌱 Seeding database...');
    await client.query(seedData);

    console.log('✅ Seed completed successfully!');
    console.log('\n📝 Demo accounts:');
    console.log('Tenant 1 (ABC Pharmacy):');
    console.log('  - admin@abcpharmacy.com / password123');
    console.log('  - qm@abcpharmacy.com / password123');
    console.log('  - user@abcpharmacy.com / password123');
    console.log('\nTenant 2 (XYZ Medical):');
    console.log('  - admin@xyzmedical.com / password123');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runSeed();
