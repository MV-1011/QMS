import { Router } from 'express';
import {
  getDocuments,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
} from '../controllers/documentController';
import { authenticate, tenantIsolation } from '../middleware/auth';

const router = Router();

// All document routes require authentication and tenant isolation
router.use(authenticate, tenantIsolation);

router.get('/', getDocuments);
router.get('/:id', getDocument);
router.post('/', createDocument);
router.put('/:id', updateDocument);
router.delete('/:id', deleteDocument);

export default router;
