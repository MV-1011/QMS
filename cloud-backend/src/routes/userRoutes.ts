import express from 'express';
import {
  getUsers,
  getUser,
  createUser,
  updateUser,
  changePassword,
  deleteUser,
  getProfile,
  getUsersByRole,
} from '../controllers/userController';
import { authenticate, requirePermission } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Current user profile
router.get('/profile', getProfile);
router.patch('/profile', updateUser);
router.patch('/profile/password', changePassword);

// Get users by role (for training assignment dropdown)
router.get('/by-role', getUsersByRole);

// Admin routes
router.get('/', requirePermission('canManageUsers'), getUsers);
router.get('/:id', requirePermission('canManageUsers'), getUser);
router.post('/', requirePermission('canManageUsers'), createUser);
router.put('/:id', updateUser); // Users can update own profile, admins can update anyone
router.patch('/:id/password', changePassword);
router.delete('/:id', requirePermission('canManageUsers'), deleteUser);

export default router;
