import { Router } from 'express';
import {
  getDeviations,
  getDeviation,
  createDeviation,
  updateDeviation,
  deleteDeviation,
} from '../controllers/deviationController';
import { authenticate, tenantIsolation } from '../middleware/auth';

const router = Router();

// All deviation routes require authentication and tenant isolation
router.use(authenticate, tenantIsolation);

router.get('/', getDeviations);
router.get('/:id', getDeviation);
router.post('/', createDeviation);
router.put('/:id', updateDeviation);
router.delete('/:id', deleteDeviation);

export default router;
