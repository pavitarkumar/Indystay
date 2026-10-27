import mongoose, { Schema, Document, Model } from 'mongoose';

export type ChatSenderRole = 'CUSTOMER' | 'HOTEL_ADMIN';

export interface IChatMessage extends Document {
  hotelId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  senderRole: ChatSenderRole;
  senderName: string;
  content: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    hotelId: { type: Schema.Types.ObjectId, ref: 'Hotel', required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    senderRole: {
      type: String,
      enum: ['CUSTOMER', 'HOTEL_ADMIN'],
      required: true,
    },
    senderName: { type: String, required: true },
    content: { type: String, required: true, trim: true },
    isRead: { type: Boolean, default: false, index: true },
  },
  {
    timestamps: true,
  }
);

ChatMessageSchema.index({ hotelId: 1, customerId: 1, createdAt: 1 });
ChatMessageSchema.index({ hotelId: 1, customerId: 1, isRead: 1 });

export const ChatMessage: Model<IChatMessage> =
  mongoose.models.ChatMessage || mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);
