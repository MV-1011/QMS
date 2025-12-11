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

const documentSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  title: { type: String, required: true },
  documentType: { type: String, required: true },
  content: String,
  version: { type: String, required: true },
  status: { type: String, default: 'draft' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: Date,
  effectiveDate: Date,
  reviewDate: Date,
  tags: [String],
}, { timestamps: true });

const Tenant = mongoose.model('Tenant', tenantSchema);
const User = mongoose.model('User', userSchema);
const Document = mongoose.model('Document', documentSchema);

// Demo documents data
const demoDocuments = [
  {
    title: 'SOP for Equipment Cleaning and Sanitization',
    documentType: 'SOP',
    version: '2.1',
    status: 'approved',
    content: `PURPOSE:
To establish a standardized procedure for cleaning and sanitizing pharmaceutical equipment to prevent cross-contamination and ensure product quality.

SCOPE:
This SOP applies to all equipment used in the compounding and dispensing areas of the pharmacy.

RESPONSIBILITIES:
- Pharmacy Staff: Execute cleaning procedures
- Quality Manager: Verify compliance
- Pharmacist-in-Charge: Review and approve

PROCEDURE:

1. PRE-CLEANING INSPECTION
   1.1. Disconnect equipment from power source
   1.2. Document equipment ID and date
   1.3. Remove any loose debris or residue

2. CLEANING PROCESS
   2.1. Prepare cleaning solution (70% isopropyl alcohol)
   2.2. Wipe all surfaces using lint-free cloths
   2.3. Pay special attention to crevices and hard-to-reach areas
   2.4. Allow solution to sit for 30 seconds

3. SANITIZATION
   3.1. Apply sanitizing solution
   3.2. Allow equipment to air dry completely
   3.3. Do not use equipment until fully dry

4. POST-CLEANING VERIFICATION
   4.1. Inspect equipment for cleanliness
   4.2. Document completion in cleaning log
   4.3. Attach "Clean" status label with date and initials

5. DOCUMENTATION
   5.1. Record in Equipment Cleaning Log:
       - Equipment ID
       - Date and time
       - Operator name
       - Solutions used
       - Any deviations

REFERENCES:
- USP <797> Pharmaceutical Compounding—Sterile Preparations
- FDA Current Good Manufacturing Practice (CGMP)

REVISION HISTORY:
Version 2.1 - Updated sanitization requirements
Version 2.0 - Added pre-cleaning inspection
Version 1.0 - Initial release`,
    effectiveDate: new Date('2024-01-15'),
    reviewDate: new Date('2025-01-15'),
    tags: ['cleaning', 'equipment', 'sanitization', 'GMP'],
  },
  {
    title: 'SOP for Temperature Monitoring of Storage Areas',
    documentType: 'SOP',
    version: '1.5',
    status: 'approved',
    content: `PURPOSE:
To ensure pharmaceutical products are stored at appropriate temperatures as required by manufacturers and regulatory guidelines.

SCOPE:
Applies to all refrigerated and climate-controlled storage areas in the pharmacy.

PROCEDURE:

1. DAILY TEMPERATURE CHECKS
   1.1. Check and record temperatures at opening and closing
   1.2. Verify refrigerator temperature: 2-8°C (36-46°F)
   1.3. Verify room temperature: 20-25°C (68-77°F)
   1.4. Document readings in Temperature Log

2. TEMPERATURE DEVIATIONS
   2.1. If temperature is outside acceptable range:
       a) Immediately notify Pharmacist-in-Charge
       b) Move products to backup storage
       c) Do not dispense affected products
       d) Complete Deviation Report

3. CALIBRATION
   3.1. Calibrate thermometers quarterly
   3.2. Maintain calibration certificates
   3.3. Replace batteries annually

4. ALARM SYSTEMS
   4.1. Test alarm functionality weekly
   4.2. Ensure 24/7 monitoring is active
   4.3. Maintain emergency contact list

DOCUMENTATION:
- Daily Temperature Log
- Calibration Certificates
- Deviation Reports (if applicable)

REFERENCES:
- USP <1079> Good Storage and Distribution Practices`,
    effectiveDate: new Date('2024-03-01'),
    reviewDate: new Date('2025-03-01'),
    tags: ['temperature', 'storage', 'monitoring', 'cold-chain'],
  },
  {
    title: 'SOP for Handling Customer Complaints',
    documentType: 'SOP',
    version: '1.0',
    status: 'review',
    content: `PURPOSE:
To establish a systematic approach for receiving, documenting, investigating, and resolving customer complaints.

SCOPE:
All pharmacy staff who interact with customers or handle medication-related inquiries.

PROCEDURE:

1. RECEIVING COMPLAINTS
   1.1. Listen to customer complaint without interruption
   1.2. Express empathy and understanding
   1.3. Collect detailed information:
       - Customer name and contact
       - Prescription/product details
       - Nature of complaint
       - Date of dispensing
       - Desired resolution

2. IMMEDIATE ACTIONS
   2.1. Determine if complaint requires immediate action
   2.2. For safety issues, escalate immediately to pharmacist
   2.3. Document complaint in Complaint Log

3. INVESTIGATION
   3.1. Review prescription records
   3.2. Interview involved staff
   3.3. Examine physical evidence if available
   3.4. Determine root cause

4. RESOLUTION
   4.1. Develop corrective action plan
   4.2. Communicate resolution to customer within 48 hours
   4.3. Implement preventive measures
   4.4. Close complaint with customer confirmation

5. FOLLOW-UP
   5.1. Contact customer within 1 week to ensure satisfaction
   5.2. Review complaint trends monthly
   5.3. Implement system improvements as needed`,
    tags: ['complaints', 'customer-service', 'quality'],
  },
  {
    title: 'Policy on Medication Error Prevention',
    documentType: 'Policy',
    version: '3.0',
    status: 'approved',
    content: `POLICY STATEMENT:
ABC Pharmacy is committed to preventing medication errors through systematic processes, staff training, and continuous quality improvement.

DEFINITIONS:
Medication Error: Any preventable event that may cause or lead to inappropriate medication use or patient harm.

PREVENTION STRATEGIES:

1. PRESCRIPTION VERIFICATION
   - Double-check high-risk medications
   - Verify patient allergies
   - Check drug interactions
   - Confirm appropriate dosing

2. DISPENSING CONTROLS
   - Use barcode scanning when available
   - Implement independent double-checks
   - Maintain organized storage (alphabetically)
   - Use tall-man lettering for look-alike drugs

3. PATIENT COUNSELING
   - Verify patient understanding
   - Provide written instructions
   - Highlight important warnings
   - Encourage questions

4. ERROR REPORTING
   - Non-punitive reporting culture
   - Anonymous reporting option
   - Root cause analysis for all errors
   - Share learnings with all staff

RESPONSIBILITIES:
- All Staff: Report potential errors immediately
- Pharmacists: Verify all prescriptions
- Quality Manager: Analyze trends and implement improvements
- Management: Provide resources and support

REVIEW:
This policy will be reviewed annually and updated as needed.`,
    effectiveDate: new Date('2024-02-01'),
    reviewDate: new Date('2025-02-01'),
    tags: ['medication-safety', 'error-prevention', 'quality'],
  },
  {
    title: 'Form - Equipment Cleaning Log',
    documentType: 'Form',
    version: '1.0',
    status: 'approved',
    content: `EQUIPMENT CLEANING LOG

Equipment Name/ID: _________________________________
Location: _________________________________________

[TABLE FORMAT]
Date | Time | Operator Name | Cleaning Agent | Sanitizing Agent | Verification | Initials
-----|------|---------------|----------------|------------------|--------------|----------
     |      |               |                |                  |              |
     |      |               |                |                  |              |
     |      |               |                |                  |              |

NOTES/DEVIATIONS:
_________________________________________________
_________________________________________________

Reviewed By: _________________ Date: ___________`,
    effectiveDate: new Date('2024-01-15'),
    tags: ['form', 'cleaning', 'equipment', 'documentation'],
  },
  {
    title: 'Protocol for Sterile Compounding',
    documentType: 'Protocol',
    version: '2.0',
    status: 'approved',
    content: `STERILE COMPOUNDING PROTOCOL

OBJECTIVE:
Ensure sterile compounding procedures meet USP <797> standards to prevent microbial contamination.

CLASSIFICATION:
This protocol covers low, medium, and high-risk compounding.

PERSONAL HYGIENE REQUIREMENTS:
1. No artificial nails, nail polish, or jewelry
2. Remove makeup and perfume
3. Tie back long hair
4. Wash hands thoroughly (30 seconds minimum)

GARBING PROCEDURE:
1. Don shoe covers
2. Put on hair cover/beard cover
3. Perform hand hygiene
4. Don face mask
5. Don sterile gown
6. Perform hand antisepsis
7. Don sterile gloves

CLEANROOM PROCEDURES:
1. Verify ISO Class 5 environment
2. Disinfect all materials before entry
3. Use aseptic technique throughout
4. Work at least 6 inches inside hood
5. Never block HEPA filter airflow
6. Minimize traffic and conversation

BEYOND-USE DATING:
- Low Risk (controlled room temp): 48 hours
- Low Risk (refrigerated): 14 days
- Medium Risk (controlled room temp): 30 hours
- Medium Risk (refrigerated): 9 days

QUALITY CHECKS:
- Media fill testing semi-annually
- Gloved fingertip sampling
- Surface sampling of ISO 5 areas
- Environmental monitoring`,
    effectiveDate: new Date('2024-01-01'),
    reviewDate: new Date('2025-01-01'),
    tags: ['sterile', 'compounding', 'USP797', 'cleanroom'],
  },
  {
    title: 'SOP for Inventory Management and Stock Rotation',
    documentType: 'SOP',
    version: '1.2',
    status: 'draft',
    content: `PURPOSE:
To maintain appropriate inventory levels and ensure proper stock rotation to minimize waste and prevent dispensing expired medications.

SCOPE:
All pharmacy staff involved in receiving, storing, and dispensing medications.

PROCEDURE:

1. RECEIVING STOCK
   1.1. Verify order against packing slip
   1.2. Check for damaged packaging
   1.3. Record receipt date
   1.4. Check expiration dates
   1.5. Reject items expiring within 6 months

2. STORAGE PROCEDURES
   2.1. Store by FEFO (First Expire, First Out)
   2.2. Place newer stock behind existing stock
   2.3. Face products with visible expiration dates
   2.4. Separate look-alike/sound-alike medications

3. MONTHLY EXPIRATION DATE CHECKS
   3.1. Review all stock for upcoming expirations
   3.2. Flag items expiring within 3 months
   3.3. Attempt to return to supplier
   3.4. Remove expired items immediately

4. INVENTORY COUNTS
   4.1. Perform cycle counts weekly
   4.2. Full inventory quarterly
   4.3. Investigate discrepancies >5%
   4.4. Update inventory management system

NOTE: This is a draft document awaiting final review and approval.`,
    tags: ['inventory', 'stock', 'expiration', 'FEFO'],
  },
  {
    title: 'SOP for Controlled Substance Handling',
    documentType: 'SOP',
    version: '2.5',
    status: 'approved',
    content: `PURPOSE:
To ensure secure handling, storage, and documentation of controlled substances in compliance with DEA regulations.

SCOPE:
All pharmacy personnel with access to controlled substances.

SECURITY REQUIREMENTS:

1. STORAGE
   1.1. Store in DEA-approved safe or securely locked cabinet
   1.2. Limit access to authorized personnel only
   1.3. Maintain separate storage from non-controlled substances
   1.4. Install security cameras covering storage areas

2. RECEIVING
   2.1. Verify DEA Form 222 or electronic equivalent
   2.2. Two pharmacists verify receipt
   2.3. Document immediately in controlled substance log
   2.4. Report any discrepancies to DEA within 1 business day

3. DISPENSING
   3.1. Verify valid prescription and prescriber DEA number
   3.2. Check state prescription monitoring program (PMP)
   3.3. Document in perpetual inventory
   3.4. Pharmacist must verify all counts

4. INVENTORY RECONCILIATION
   4.1. Perform daily count of Schedule II substances
   4.2. Weekly count of Schedule III-V substances
   4.3. Investigate any discrepancies immediately
   4.4. Complete DEA Form 106 for any losses

5. DESTRUCTION/RETURNS
   5.1. Complete DEA Form 41 for destruction
   5.2. Require witness for all destructions
   5.3. Maintain records for 2 years
   5.4. Use authorized reverse distributor

AUDIT REQUIREMENTS:
- Biannual inventory of all controlled substances
- Monthly review of prescription patterns
- Quarterly security assessment

REFERENCES:
- 21 CFR Part 1301-1308
- State Board of Pharmacy Regulations`,
    effectiveDate: new Date('2024-01-01'),
    reviewDate: new Date('2025-01-01'),
    tags: ['controlled-substances', 'DEA', 'security', 'compliance'],
  },
  {
    title: 'Record - Annual Training Completion Certificate',
    documentType: 'Record',
    version: '1.0',
    status: 'approved',
    content: `ANNUAL TRAINING COMPLETION CERTIFICATE

Employee Name: _________________________________
Employee ID: ___________________________________
Position: ______________________________________

TRAINING MODULES COMPLETED:

□ HIPAA Privacy and Security
□ Medication Error Prevention
□ Controlled Substance Management
□ USP <797> Sterile Compounding
□ Customer Service Excellence
□ Emergency Procedures
□ Equipment Cleaning and Maintenance
□ Inventory Management
□ Hazardous Drug Handling (if applicable)

Total Training Hours: __________

Completion Date: _______________

Employee Signature: _________________________

Supervisor Signature: ________________________

Pharmacist-in-Charge Signature: ______________

Date: __________`,
    tags: ['training', 'record', 'certification', 'compliance'],
  },
  {
    title: 'SOP for Hand Hygiene and Garbing',
    documentType: 'SOP',
    version: '1.8',
    status: 'archived',
    content: `[ARCHIVED - Superseded by version 2.0]

PURPOSE:
To establish proper hand hygiene and garbing procedures for compounding areas.

NOTE: This document has been archived and replaced by:
- SOP for Sterile Compounding v2.0
- Protocol for Sterile Compounding v2.0

Please refer to current documents for up-to-date procedures.

ARCHIVE DATE: January 1, 2024
REASON: Consolidated into comprehensive sterile compounding protocol`,
    tags: ['archived', 'hand-hygiene', 'garbing', 'historical'],
  },
];

async function seedDocuments() {
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

    // Delete existing documents for this tenant
    console.log('🧹 Removing existing documents...');
    await Document.deleteMany({ tenantId: tenant._id });

    // Create demo documents
    console.log('📄 Creating demo documents...\n');

    for (const docData of demoDocuments) {
      let createdBy, updatedBy, approvedBy;

      // Assign creators based on document type and status
      if (docData.status === 'approved') {
        createdBy = adminUser._id;
        updatedBy = adminUser._id;
        approvedBy = adminUser._id;
      } else if (docData.status === 'review') {
        createdBy = qmUser._id;
        updatedBy = qmUser._id;
      } else if (docData.status === 'draft') {
        createdBy = regularUser._id;
        updatedBy = regularUser._id;
      } else if (docData.status === 'archived') {
        createdBy = adminUser._id;
        updatedBy = adminUser._id;
        approvedBy = adminUser._id;
      }

      const document = await Document.create({
        tenantId: tenant._id,
        ...docData,
        createdBy,
        updatedBy,
        approvedBy: approvedBy || undefined,
        approvedAt: approvedBy ? new Date() : undefined,
      });

      const statusIcon = {
        draft: '📝',
        review: '👀',
        approved: '✅',
        archived: '📦',
      }[docData.status] || '📄';

      console.log(`${statusIcon} Created: ${document.title} (${document.documentType} v${document.version}) - ${document.status}`);
    }

    console.log('\n✅ Demo documents seeded successfully!\n');
    console.log('📊 Summary:');
    console.log('━'.repeat(50));

    const stats = await Document.aggregate([
      { $match: { tenantId: tenant._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    stats.forEach(stat => {
      const icon = {
        draft: '📝',
        review: '👀',
        approved: '✅',
        archived: '📦',
      }[stat._id] || '📄';
      console.log(`${icon} ${stat._id}: ${stat.count} document(s)`);
    });

    const typeStats = await Document.aggregate([
      { $match: { tenantId: tenant._id } },
      { $group: { _id: '$documentType', count: { $sum: 1 } } },
    ]);

    console.log('\n📁 By Type:');
    typeStats.forEach(stat => {
      console.log(`   ${stat._id}: ${stat.count}`);
    });

    console.log('\n' + '━'.repeat(50));
    console.log('🎉 You can now login and view these documents!\n');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('📦 MongoDB connection closed');
  }
}

seedDocuments();
