import express from 'express';
import {
  getDashboardStats,
  getModuleReport,
  getComplianceSummary,
} from '../controllers/reportController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Routes
router.get('/dashboard', getDashboardStats);
router.get('/compliance', getComplianceSummary);
router.get('/module/:module', getModuleReport);

export default router;
