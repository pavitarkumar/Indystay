import { Notification, NotificationType } from '@/models/Notification';
import { connectToDatabase } from '@/lib/db/connection';
import mongoose from 'mongoose';

export interface CreateNotificationParams {
  recipientUserId: string | mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: NotificationType;
  entityId?: string;
}

export async function createNotification(params: CreateNotificationParams): Promise<void> {
  try {
    await connectToDatabase();
    await Notification.create({
      recipientUserId: new mongoose.Types.ObjectId(params.recipientUserId),
      title: params.title,
      message: params.message,
      type: params.type,
      entityId: params.entityId,
      isRead: false,
    });
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
}

export async function getUserNotifications(userId: string) {
  await connectToDatabase();
  return Notification.find({ recipientUserId: new mongoose.Types.ObjectId(userId) })
    .sort({ createdAt: -1 })
    .limit(30)
    .lean();
}

export async function markNotificationAsRead(notificationId: string, userId: string) {
  await connectToDatabase();
  return Notification.findOneAndUpdate(
    { _id: new mongoose.Types.ObjectId(notificationId), recipientUserId: new mongoose.Types.ObjectId(userId) },
    { isRead: true },
    { new: true }
  );
}

export async function markAllNotificationsAsRead(userId: string) {
  await connectToDatabase();
  return Notification.updateMany(
    { recipientUserId: new mongoose.Types.ObjectId(userId), isRead: false },
    { isRead: true }
  );
}
