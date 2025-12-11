import { Router } from 'express';
import {
  getCAPAs,
  getCAPA,
  createCAPA,
  updateCAPA,
  deleteCAPA,
} from '../controllers/capaController';
import { authenticate, tenantIsolation } from '../middleware/auth';

const router = Router();

// All CAPA routes require authentication and tenant isolation
router.use(authenticate, tenantIsolation);

router.get('/', getCAPAs);
router.get('/:id', getCAPA);
router.post('/', createCAPA);
router.put('/:id', updateCAPA);
router.delete('/:id', deleteCAPA);

export default router;
