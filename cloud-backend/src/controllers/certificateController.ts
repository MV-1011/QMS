import { Request, Response } from 'express';
import mongoose from 'mongoose';
import PDFDocument from 'pdfkit';
import Certificate from '../models/Certificate';
import Training from '../models/Training';
import { User } from '../models/User';
import { Tenant } from '../models/Tenant';
import path from 'path';
import fs from 'fs';

// Get user's certificates
export const getMyCertificates = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const tenantId = (req as any).user.tenantId;

    const certificates = await Certificate.find({ userId, tenantId, isValid: true })
      .populate('trainingId', 'title category trainingType')
      .sort({ issueDate: -1 });

    res.json({ success: true, data: certificates });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get certificate by ID
export const getCertificate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;
    const tenantId = (req as any).user.tenantId;
    const userRole = (req as any).user.role;

    // Admins and QA managers can view any certificate in their tenant
    const filter: any = { _id: id, tenantId };
    if (!['admin', 'qa_manager'].includes(userRole)) {
      filter.userId = userId;
    }

    const certificate = await Certificate.findOne(filter)
      .populate('trainingId', 'title category trainingType description')
      .populate('userId', 'firstName lastName email department jobTitle');

    if (!certificate) {
      return res.status(404).json({ success: false, message: 'Certificate not found' });
    }

    res.json({ success: true, data: certificate });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Verify certificate (public endpoint)
export const verifyCertificate = async (req: Request, res: Response) => {
  try {
    const { code } = req.params;

    const certificate = await Certificate.findOne({ verificationCode: code })
      .populate('trainingId', 'title category')
      .select('-verificationCode');

    if (!certificate) {
      return res.status(404).json({
        success: false,
        valid: false,
        message: 'Certificate not found',
      });
    }

    // Get tenant info
    const tenant = await Tenant.findById(certificate.tenantId);

    // Check if certificate is still valid
    const isExpired = certificate.expiryDate && new Date(certificate.expiryDate) < new Date();

    res.json({
      success: true,
      valid: certificate.isValid && !isExpired,
      data: {
        certificateNumber: certificate.certificateNumber,
        userName: certificate.userName,
        trainingTitle: certificate.trainingTitle,
        issueDate: certificate.issueDate,
        expiryDate: certificate.expiryDate,
        isExpired,
        isRevoked: !certificate.isValid,
        organization: tenant?.name,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Download certificate (returns data for PDF generation)
export const downloadCertificate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;
    const tenantId = (req as any).user.tenantId;
    const userRole = (req as any).user.role;

    const filter: any = { _id: id, tenantId };
    if (!['admin', 'qa_manager'].includes(userRole)) {
      filter.userId = userId;
    }

    const certificate = await Certificate.findOne(filter)
      .populate('trainingId', 'title category trainingType description duration')
      .populate('userId', 'firstName lastName email department jobTitle');

    if (!certificate) {
      return res.status(404).json({ success: false, message: 'Certificate not found' });
    }

    // Update download count
    certificate.downloadCount += 1;
    certificate.lastDownloadedAt = new Date();
    await certificate.save();

    // Get tenant for branding
    const tenant = await Tenant.findById(tenantId);

    // Return certificate data for PDF generation
    res.json({
      success: true,
      data: {
        certificate: {
          certificateNumber: certificate.certificateNumber,
          userName: certificate.userName,
          trainingTitle: certificate.trainingTitle,
          issueDate: certificate.issueDate,
          expiryDate: certificate.expiryDate,
          examScore: certificate.examScore,
          completionDate: certificate.completionDate,
          verificationCode: certificate.verificationCode,
        },
        training: certificate.trainingId,
        user: certificate.userId,
        organization: {
          name: tenant?.name,
          branding: tenant?.settings?.branding,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Get all certificates
export const getAllCertificates = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user.tenantId;
    const { userId, trainingId, isValid } = req.query;

    const filter: any = { tenantId };
    if (userId) filter.userId = userId;
    if (trainingId) filter.trainingId = trainingId;
    if (isValid !== undefined) filter.isValid = isValid === 'true';

    const certificates = await Certificate.find(filter)
      .populate('trainingId', 'title category')
      .populate('userId', 'firstName lastName email department')
      .sort({ issueDate: -1 });

    res.json({ success: true, data: certificates });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Revoke certificate
export const revokeCertificate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = (req as any).user.tenantId;
    const revokedBy = (req as any).user.id;
    const { reason } = req.body;

    const certificate = await Certificate.findOneAndUpdate(
      { _id: id, tenantId },
      {
        isValid: false,
        revokedAt: new Date(),
        revokedBy,
        revokeReason: reason,
      },
      { new: true }
    );

    if (!certificate) {
      return res.status(404).json({ success: false, message: 'Certificate not found' });
    }

    res.json({ success: true, data: certificate });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Generate and download certificate as PDF
export const downloadCertificatePDF = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;
    const tenantId = (req as any).user.tenantId;
    const userRole = (req as any).user.role;

    const filter: any = { _id: id, tenantId };
    if (!['admin', 'qa_manager'].includes(userRole)) {
      filter.userId = userId;
    }

    const certificate = await Certificate.findOne(filter)
      .populate('trainingId', 'title category trainingType certificateTemplate certificateEnabled')
      .populate('userId', 'firstName lastName email department jobTitle');

    if (!certificate) {
      return res.status(404).json({ success: false, message: 'Certificate not found' });
    }

    // Get training for template
    const training = await Training.findById(certificate.trainingId);

    // Get tenant for branding
    const tenant = await Tenant.findById(tenantId);

    // Update download count
    certificate.downloadCount += 1;
    certificate.lastDownloadedAt = new Date();
    await certificate.save();

    // Create PDF
    const doc = new PDFDocument({
      layout: 'landscape',
      size: 'A4',
      margin: 50,
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Certificate-${certificate.certificateNumber}.pdf"`);

    // Pipe to response
    doc.pipe(res);

    // Get template settings
    const template = training?.certificateTemplate || {};
    const bgColor = template.backgroundColor || '#ffffff';
    const textColor = template.textColor || '#1a1a2e';
    const borderColor = template.borderColor || '#0066cc';

    // Background
    doc.rect(0, 0, doc.page.width, doc.page.height).fill(bgColor);

    // Border
    doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40)
      .lineWidth(3)
      .stroke(borderColor);

    // Inner border
    doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60)
      .lineWidth(1)
      .stroke(borderColor);

    // Decorative corner elements
    const corners = [
      { x: 40, y: 40 },
      { x: doc.page.width - 60, y: 40 },
      { x: 40, y: doc.page.height - 60 },
      { x: doc.page.width - 60, y: doc.page.height - 60 },
    ];
    corners.forEach(corner => {
      doc.circle(corner.x, corner.y, 8).fill(borderColor);
    });

    // Header ribbon
    doc.rect(50, 60, doc.page.width - 100, 40)
      .fill(borderColor);

    doc.fillColor('#ffffff')
      .fontSize(18)
      .font('Helvetica-Bold')
      .text('CERTIFICATE OF COMPLETION', 50, 70, {
        width: doc.page.width - 100,
        align: 'center',
      });

    // Organization name
    doc.fillColor(textColor)
      .fontSize(24)
      .font('Helvetica-Bold')
      .text(tenant?.name || 'Quality Management System', 50, 130, {
        width: doc.page.width - 100,
        align: 'center',
      });

    // This is to certify text
    doc.fillColor(textColor)
      .fontSize(14)
      .font('Helvetica')
      .text('This is to certify that', 50, 180, {
        width: doc.page.width - 100,
        align: 'center',
      });

    // User name
    doc.fillColor(borderColor)
      .fontSize(36)
      .font('Helvetica-Bold')
      .text(certificate.userName, 50, 210, {
        width: doc.page.width - 100,
        align: 'center',
      });

    // Line under name
    const nameWidth = doc.widthOfString(certificate.userName);
    const lineX = (doc.page.width - nameWidth) / 2;
    doc.moveTo(lineX - 20, 260)
      .lineTo(lineX + nameWidth + 20, 260)
      .lineWidth(2)
      .stroke(borderColor);

    // Completion text
    doc.fillColor(textColor)
      .fontSize(14)
      .font('Helvetica')
      .text('has successfully completed the training program', 50, 280, {
        width: doc.page.width - 100,
        align: 'center',
      });

    // Training title
    doc.fillColor(textColor)
      .fontSize(24)
      .font('Helvetica-Bold')
      .text(certificate.trainingTitle, 50, 310, {
        width: doc.page.width - 100,
        align: 'center',
      });

    // Score if available
    if (certificate.examScore) {
      doc.fillColor(textColor)
        .fontSize(14)
        .font('Helvetica')
        .text(`with a score of ${certificate.examScore}%`, 50, 350, {
          width: doc.page.width - 100,
          align: 'center',
        });
    }

    // Date section
    const dateY = 400;

    // Issue date
    doc.fillColor(textColor)
      .fontSize(12)
      .font('Helvetica')
      .text('Date Issued', 150, dateY, { align: 'center', width: 150 });

    doc.fillColor(textColor)
      .fontSize(14)
      .font('Helvetica-Bold')
      .text(new Date(certificate.issueDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }), 150, dateY + 20, { align: 'center', width: 150 });

    // Valid until (if expiry date exists)
    if (certificate.expiryDate) {
      doc.fillColor(textColor)
        .fontSize(12)
        .font('Helvetica')
        .text('Valid Until', doc.page.width - 300, dateY, { align: 'center', width: 150 });

      doc.fillColor(textColor)
        .fontSize(14)
        .font('Helvetica-Bold')
        .text(new Date(certificate.expiryDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }), doc.page.width - 300, dateY + 20, { align: 'center', width: 150 });
    }

    // Signature section
    const sigY = 470;

    // Left signature (Admin/QA Manager)
    doc.moveTo(120, sigY + 30)
      .lineTo(280, sigY + 30)
      .lineWidth(1)
      .stroke(textColor);

    doc.fillColor(textColor)
      .fontSize(12)
      .font('Helvetica')
      .text(template.signerName || 'Training Administrator', 120, sigY + 35, {
        width: 160,
        align: 'center',
      });

    doc.fillColor(textColor)
      .fontSize(10)
      .font('Helvetica')
      .text(template.signerTitle || 'Quality Assurance', 120, sigY + 50, {
        width: 160,
        align: 'center',
      });

    // Right signature (Organization)
    doc.moveTo(doc.page.width - 280, sigY + 30)
      .lineTo(doc.page.width - 120, sigY + 30)
      .lineWidth(1)
      .stroke(textColor);

    doc.fillColor(textColor)
      .fontSize(12)
      .font('Helvetica')
      .text(tenant?.name || 'Organization', doc.page.width - 280, sigY + 35, {
        width: 160,
        align: 'center',
      });

    doc.fillColor(textColor)
      .fontSize(10)
      .font('Helvetica')
      .text('Authorized Representative', doc.page.width - 280, sigY + 50, {
        width: 160,
        align: 'center',
      });

    // Footer with certificate info
    const footerY = doc.page.height - 60;

    doc.fillColor('#666666')
      .fontSize(9)
      .font('Helvetica')
      .text(`Certificate ID: ${certificate.certificateNumber}`, 50, footerY, {
        width: (doc.page.width - 100) / 2,
        align: 'left',
      });

    doc.fillColor('#666666')
      .fontSize(9)
      .font('Helvetica')
      .text(`Verification Code: ${certificate.verificationCode}`, doc.page.width / 2, footerY, {
        width: (doc.page.width - 100) / 2,
        align: 'right',
      });

    // Custom text if available
    if (template.customText) {
      doc.fillColor('#666666')
        .fontSize(8)
        .font('Helvetica-Oblique')
        .text(template.customText, 50, footerY + 15, {
          width: doc.page.width - 100,
          align: 'center',
        });
    }

    // Finalize PDF
    doc.end();
  } catch (error: any) {
    console.error('PDF generation error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get certificate statistics
export const getCertificateStats = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user.tenantId;

    const stats = await Certificate.aggregate([
      { $match: { tenantId: new mongoose.Types.ObjectId(tenantId) } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          valid: { $sum: { $cond: ['$isValid', 1, 0] } },
          revoked: { $sum: { $cond: ['$isValid', 0, 1] } },
          expiringSoon: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ['$expiryDate', null] },
                    { $lte: ['$expiryDate', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)] },
                    { $gt: ['$expiryDate', new Date()] },
                    '$isValid',
                  ],
                },
                1,
                0,
              ],
            },
          },
          expired: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ['$expiryDate', null] },
                    { $lt: ['$expiryDate', new Date()] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    // Get certificates by training
    const byTraining = await Certificate.aggregate([
      { $match: { tenantId: new mongoose.Types.ObjectId(tenantId), isValid: true } },
      {
        $group: {
          _id: '$trainingId',
          count: { $sum: 1 },
          trainingTitle: { $first: '$trainingTitle' },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    res.json({
      success: true,
      data: {
        summary: stats[0] || { total: 0, valid: 0, revoked: 0, expiringSoon: 0, expired: 0 },
        byTraining,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
