import express from 'express';
import {
  getNotifications,
  getUnreadNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from '../controllers/notificationController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all notifications (paginated)
router.get('/', getNotifications);

// Get unread notifications
router.get('/unread', getUnreadNotifications);

// Get unread count
router.get('/unread/count', getUnreadCount);

// Mark single notification as read
router.patch('/:id/read', markAsRead);

// Mark all notifications as read
router.patch('/read-all', markAllAsRead);

export default router;
