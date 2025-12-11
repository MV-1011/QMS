import express from 'express';
import {
  createExam,
  getExamAdmin,
  getExamForUser,
  startExamAttempt,
  submitExam,
  updateExam,
  getExamResults,
} from '../controllers/examController';
import { authenticate, requirePermission } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Admin routes
router.post('/', requirePermission('canCreateExams'), createExam);
router.get('/admin/:id', requirePermission('canCreateExams'), getExamAdmin);
router.put('/:id', requirePermission('canCreateExams'), updateExam);
router.get('/results/:trainingId', requirePermission('canViewReports'), getExamResults);

// User routes - taking exams
router.get('/take/:assignmentId', getExamForUser);
router.post('/attempt/:assignmentId', startExamAttempt);
router.post('/submit/:attemptId', submitExam);

export default router;
