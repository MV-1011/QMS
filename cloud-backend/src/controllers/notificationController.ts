import { Request, Response } from 'express';
import notificationService from '../services/notificationService';
import mongoose from 'mongoose';

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const userId = new mongoose.Types.ObjectId((req as any).user.id);
    const tenantId = new mongoose.Types.ObjectId((req as any).user.tenantId);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await notificationService.getAllNotifications(userId, tenantId, page, limit);

    res.json({
      success: true,
      data: result.notifications,
      pagination: result.pagination,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUnreadNotifications = async (req: Request, res: Response) => {
  try {
    const userId = new mongoose.Types.ObjectId((req as any).user.id);
    const tenantId = new mongoose.Types.ObjectId((req as any).user.tenantId);

    const notifications = await notificationService.getUnreadNotifications(userId, tenantId);

    res.json({
      success: true,
      data: notifications,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const userId = new mongoose.Types.ObjectId((req as any).user.id);
    const tenantId = new mongoose.Types.ObjectId((req as any).user.tenantId);

    const count = await notificationService.getUnreadCount(userId, tenantId);

    res.json({
      success: true,
      data: { count },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const userId = new mongoose.Types.ObjectId((req as any).user.id);
    const notificationId = new mongoose.Types.ObjectId(req.params.id);

    const notification = await notificationService.markAsRead(notificationId, userId);

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.json({
      success: true,
      data: notification,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    const userId = new mongoose.Types.ObjectId((req as any).user.id);
    const tenantId = new mongoose.Types.ObjectId((req as any).user.tenantId);

    await notificationService.markAllAsRead(userId, tenantId);

    res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
