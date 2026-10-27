import mongoose, { Schema, Document, Model } from 'mongoose';

export type NotificationType =
  | 'BOOKING_REQUEST'
  | 'BOOKING_CONFIRMED'
  | 'BOOKING_REJECTED'
  | 'BOOKING_CANCELLED'
  | 'HOTEL_APPROVAL'
  | 'HOTEL_REJECTION'
  | 'SYSTEM';

export interface INotification extends Document {
  recipientUserId: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: NotificationType;
  entityId?: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipientUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: [
        'BOOKING_REQUEST',
        'BOOKING_CONFIRMED',
        'BOOKING_REJECTED',
        'BOOKING_CANCELLED',
        'HOTEL_APPROVAL',
        'HOTEL_REJECTION',
        'SYSTEM',
      ],
      default: 'SYSTEM',
    },
    entityId: { type: String },
    isRead: { type: Boolean, default: false, index: true },
  },
  {
    timestamps: true,
  }
);

NotificationSchema.index({ recipientUserId: 1, isRead: 1, createdAt: -1 });

export const Notification: Model<INotification> =
  mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
