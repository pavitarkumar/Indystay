import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { ChatMessage } from '../../src/models/ChatMessage';
import { Hotel } from '../../src/models/Hotel';
import { User } from '../../src/models/User';
import { containsPhoneNumber, PHONE_BLOCKED_MESSAGE } from '../../src/utils/phone-filter';
import { createNotification } from '../../src/lib/notifications/notification.service';
import { requireAuth } from '../middleware/auth';
import { connectBackendDatabase } from '../db';

export const chatRouter = Router();

chatRouter.use(requireAuth);

// GET /api/chat
chatRouter.get('/', async (req: Request, res: Response) => {
  try {
    await connectBackendDatabase();
    const user = req.user!;
    const mode = req.query.mode ? String(req.query.mode) : undefined;
    const hotelIdParam = req.query.hotelId ? String(req.query.hotelId) : undefined;
    const customerIdParam = req.query.customerId ? String(req.query.customerId) : undefined;

    if (user.role === 'HOTEL_ADMIN') {
      const hotel = await Hotel.findOne({
        $or: [
          { _id: user.assignedHotelId },
          { ownerUserId: user.id },
          { adminUserIds: user.id },
        ],
      }).lean();

      if (!hotel) {
        return res.status(404).json({ success: false, error: 'No hotel property assigned to this admin account.' });
      }

      if (mode === 'threads') {
        const threads = await ChatMessage.aggregate([
          { $match: { hotelId: hotel._id } },
          { $sort: { createdAt: -1 } },
          {
            $group: {
              _id: '$customerId',
              lastMessage: { $first: '$content' },
              lastSenderRole: { $first: '$senderRole' },
              lastMessageAt: { $first: '$createdAt' },
              unreadCount: {
                $sum: {
                  $cond: [
                    { $and: [{ $eq: ['$isRead', false] }, { $eq: ['$senderRole', 'CUSTOMER'] }] },
                    1,
                    0,
                  ],
                },
              },
            },
          },
          { $sort: { lastMessageAt: -1 } },
        ]);

        const customerIds = threads.map((t) => t._id);
        const customers = await User.find({ _id: { $in: customerIds } }).select('name email phone').lean();
        const customerMap = new Map(customers.map((c: any) => [c._id.toString(), c]));

        const populatedThreads = threads.map((t) => ({
          customerId: t._id.toString(),
          customer: customerMap.get(t._id.toString()) || { name: 'Guest User', email: '' },
          lastMessage: t.lastMessage,
          lastSenderRole: t.lastSenderRole,
          lastMessageAt: t.lastMessageAt,
          unreadCount: t.unreadCount,
        }));

        return res.json({ success: true, data: populatedThreads });
      }

      const custId = customerIdParam ? new mongoose.Types.ObjectId(customerIdParam) : null;
      if (!custId) {
        return res.status(400).json({ success: false, error: 'customerId is required' });
      }

      await ChatMessage.updateMany(
        { hotelId: hotel._id, customerId: custId, senderRole: 'CUSTOMER', isRead: false },
        { $set: { isRead: true } }
      );

      const messages = await ChatMessage.find({ hotelId: hotel._id, customerId: custId })
        .sort({ createdAt: 1 })
        .limit(100)
        .lean();

      return res.json({ success: true, data: messages });
    }

    // Customer Mode:
    if (!hotelIdParam || !mongoose.Types.ObjectId.isValid(hotelIdParam)) {
      return res.status(400).json({ success: false, error: 'Valid hotelId is required for customer chats' });
    }

    const hOid = new mongoose.Types.ObjectId(hotelIdParam);
    const cOid = new mongoose.Types.ObjectId(user.id);

    await ChatMessage.updateMany(
      { hotelId: hOid, customerId: cOid, senderRole: 'HOTEL_ADMIN', isRead: false },
      { $set: { isRead: true } }
    );

    const messages = await ChatMessage.find({ hotelId: hOid, customerId: cOid })
      .sort({ createdAt: 1 })
      .limit(100)
      .lean();

    return res.json({ success: true, data: messages });
  } catch (error) {
    console.error('Express Chat GET error:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve messages' });
  }
});

// POST /api/chat
chatRouter.post('/', async (req: Request, res: Response) => {
  try {
    await connectBackendDatabase();
    const user = req.user!;
    const { hotelId, customerId: targetCustomerId, content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, error: 'Message content is required' });
    }

    const trimmed = content.trim();
    if (containsPhoneNumber(trimmed)) {
      return res.status(400).json({
        success: false,
        error: PHONE_BLOCKED_MESSAGE,
        blocked: true,
      });
    }

    if (user.role === 'HOTEL_ADMIN') {
      const hotel = await Hotel.findOne({
        $or: [
          { _id: user.assignedHotelId },
          { ownerUserId: user.id },
          { adminUserIds: user.id },
        ],
      }).lean();

      if (!hotel) {
        return res.status(404).json({ success: false, error: 'No hotel property assigned' });
      }

      if (!targetCustomerId || !mongoose.Types.ObjectId.isValid(targetCustomerId)) {
        return res.status(400).json({ success: false, error: 'Valid customerId is required' });
      }

      const msg = await ChatMessage.create({
        hotelId: hotel._id,
        customerId: new mongoose.Types.ObjectId(targetCustomerId),
        senderId: new mongoose.Types.ObjectId(user.id),
        senderRole: 'HOTEL_ADMIN',
        senderName: hotel.name,
        content: trimmed,
        isRead: false,
      });

      await createNotification({
        recipientUserId: targetCustomerId,
        title: `Message from ${hotel.name}`,
        message: trimmed.length > 80 ? trimmed.substring(0, 77) + '...' : trimmed,
        type: 'SYSTEM',
        entityId: hotel._id.toString(),
      });

      return res.status(201).json({ success: true, data: msg });
    }

    // Customer Mode:
    if (!hotelId || !mongoose.Types.ObjectId.isValid(hotelId)) {
      return res.status(400).json({ success: false, error: 'Valid hotelId is required' });
    }

    const hotel = await Hotel.findById(hotelId).select('name ownerUserId adminUserIds slug').lean();
    if (!hotel) {
      return res.status(404).json({ success: false, error: 'Hotel not found' });
    }

    const msg = await ChatMessage.create({
      hotelId: hotel._id,
      customerId: new mongoose.Types.ObjectId(user.id),
      senderId: new mongoose.Types.ObjectId(user.id),
      senderRole: 'CUSTOMER',
      senderName: user.name,
      content: trimmed,
      isRead: false,
    });

    const adminRecipients = Array.from(
      new Set([hotel.ownerUserId?.toString(), ...(hotel.adminUserIds || []).map((id: any) => id.toString())])
    ).filter(Boolean);

    for (const adminId of adminRecipients) {
      await createNotification({
        recipientUserId: adminId!,
        title: `New Guest Message: ${user.name}`,
        message: trimmed.length > 80 ? trimmed.substring(0, 77) + '...' : trimmed,
        type: 'SYSTEM',
        entityId: (user.id as any).toString(),
      });
    }

    return res.status(201).json({ success: true, data: msg });
  } catch (error) {
    console.error('Express Chat POST error:', error);
    return res.status(500).json({ success: false, error: 'Failed to send message' });
  }
});
