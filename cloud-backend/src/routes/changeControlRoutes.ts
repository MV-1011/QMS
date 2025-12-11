import { Router } from 'express';
import {
  getChangeControls,
  getChangeControl,
  createChangeControl,
  updateChangeControl,
  deleteChangeControl,
} from '../controllers/changeControlController';
import { authenticate, tenantIsolation } from '../middleware/auth';

const router = Router();

// All change control routes require authentication and tenant isolation
router.use(authenticate, tenantIsolation);

router.get('/', getChangeControls);
router.get('/:id', getChangeControl);
router.post('/', createChangeControl);
router.put('/:id', updateChangeControl);
router.delete('/:id', deleteChangeControl);

export default router;
