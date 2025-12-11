import express from 'express';
import {
  getAudits,
  getAudit,
  createAudit,
  updateAudit,
  deleteAudit,
} from '../controllers/auditController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Routes
router.get('/', getAudits);
router.get('/:id', getAudit);
router.post('/', createAudit);
router.put('/:id', updateAudit);
router.delete('/:id', deleteAudit);

export default router;
