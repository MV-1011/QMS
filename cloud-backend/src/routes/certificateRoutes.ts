import express from 'express';
import {
  getMyCertificates,
  getCertificate,
  verifyCertificate,
  downloadCertificate,
  downloadCertificatePDF,
  getAllCertificates,
  revokeCertificate,
  getCertificateStats,
} from '../controllers/certificateController';
import { authenticate, requirePermission } from '../middleware/auth';

const router = express.Router();

// Public route for certificate verification
router.get('/verify/:code', verifyCertificate);

// All other routes require authentication
router.use(authenticate);

// User routes
router.get('/my', getMyCertificates);
router.get('/:id', getCertificate);
router.get('/:id/download', downloadCertificate);
router.get('/:id/pdf', downloadCertificatePDF);

// Admin routes
router.get('/', requirePermission('canIssueCertificates'), getAllCertificates);
router.get('/stats/summary', requirePermission('canViewReports'), getCertificateStats);
router.patch('/:id/revoke', requirePermission('canIssueCertificates'), revokeCertificate);

export default router;
