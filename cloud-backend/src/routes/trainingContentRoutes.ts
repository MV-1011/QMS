import express from 'express';
import {
  getTrainingContent,
  uploadContentFile,
  addContentLink,
  updateContent,
  deleteContent,
  reorderContent,
  processPptSlides,
} from '../controllers/trainingContentController';
import { authenticate, requirePermission } from '../middleware/auth';
import { uploadContent } from '../middleware/upload';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get content for a training (anyone can view)
router.get('/:trainingId', getTrainingContent);

// Admin routes - require permission to manage trainings
router.post(
  '/:trainingId/upload',
  requirePermission('canManageTrainings'),
  uploadContent.single('file'),
  uploadContentFile
);

router.post(
  '/:trainingId/link',
  requirePermission('canManageTrainings'),
  addContentLink
);

router.put(
  '/item/:id',
  requirePermission('canManageTrainings'),
  updateContent
);

router.delete(
  '/item/:id',
  requirePermission('canManageTrainings'),
  deleteContent
);

router.patch(
  '/:trainingId/reorder',
  requirePermission('canManageTrainings'),
  reorderContent
);

// Process PPT to generate slides (any authenticated user can request this)
router.post(
  '/item/:id/process-slides',
  processPptSlides
);

export default router;
