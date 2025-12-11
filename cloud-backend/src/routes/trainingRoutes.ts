import express from 'express';
import {
  getTrainings,
  getTraining,
  createTraining,
  updateTraining,
  deleteTraining,
} from '../controllers/trainingController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Routes
router.get('/', getTrainings);
router.get('/:id', getTraining);
router.post('/', createTraining);
router.put('/:id', updateTraining);
router.delete('/:id', deleteTraining);

export default router;
