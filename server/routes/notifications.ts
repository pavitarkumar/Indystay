import { Router, Request, Response } from 'express';
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../../src/lib/notifications/notification.service';
import { requireAuth } from '../middleware/auth';
import { connectBackendDatabase } from '../db';

export const notificationsRouter = Router();

notificationsRouter.use(requireAuth);

// GET /api/notifications
notificationsRouter.get('/', async (req: Request, res: Response) => {
  try {
    await connectBackendDatabase();
    const notifications = await getUserNotifications(req.user!.id);
    return res.json({ success: true, data: notifications });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to retrieve notifications' });
  }
});

// PATCH /api/notifications
notificationsRouter.patch('/', async (req: Request, res: Response) => {
  try {
    await connectBackendDatabase();
    const { notificationId, markAll } = req.body || {};

    if (markAll) {
      await markAllNotificationsAsRead(req.user!.id);
      return res.json({ success: true, message: 'All notifications marked as read' });
    }

    if (notificationId) {
      await markNotificationAsRead(notificationId, req.user!.id);
      return res.json({ success: true, message: 'Notification marked as read' });
    }

    return res.status(400).json({ success: false, error: 'Invalid notification parameters' });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to update notification' });
  }
});
