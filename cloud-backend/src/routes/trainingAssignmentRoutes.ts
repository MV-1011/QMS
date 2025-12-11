import express from 'express';
import {
  getMyAssignments,
  getAssignmentDetails,
  assignTraining,
  startTraining,
  completeContent,
  getAllAssignments,
  getAssignmentStats,
  resetAssignment,
  issueCertificate,
} from '../controllers/trainingAssignmentController';
import { authenticate, requirePermission } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// User routes - my trainings
router.get('/my', getMyAssignments);
router.get('/my/:id', getAssignmentDetails);
router.patch('/my/:id/start', startTraining);
router.patch('/my/:id/content/:contentId/complete', completeContent);

// Admin routes
router.get('/', requirePermission('canAssignTrainings'), getAllAssignments);
router.get('/stats', requirePermission('canAssignTrainings'), getAssignmentStats);
router.post('/assign', requirePermission('canAssignTrainings'), assignTraining);
router.patch('/:id/reset', requirePermission('canAssignTrainings'), resetAssignment);
router.post('/:id/issue-certificate', requirePermission('canAssignTrainings'), issueCertificate);

export default router;
