import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getSession } from '@/lib/auth/session';
import { connectToDatabase } from '@/lib/db/connection';
import { ChatMessage } from '@/models/ChatMessage';
import { Hotel } from '@/models/Hotel';
import { User } from '@/models/User';
import { containsPhoneNumber, PHONE_BLOCKED_MESSAGE } from '@/utils/phone-filter';
import { createNotification } from '@/lib/notifications/notification.service';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('mode');
    const hotelIdParam = searchParams.get('hotelId');
    const customerIdParam = searchParams.get('customerId');

    // If HOTEL_ADMIN:
    if (session.role === 'HOTEL_ADMIN') {
      const hotel = await Hotel.findOne({
        $or: [
          { _id: session.assignedHotelId },
          { ownerUserId: session.id },
          { adminUserIds: session.id },
        ],
      }).lean();

      if (!hotel) {
        return NextResponse.json(
          { success: false, error: 'No hotel property assigned to this admin account.' },
          { status: 404 }
        );
      }

      // Mode: threads - list distinct customers who sent messages to this hotel
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
        const users = await User.find({ _id: { $in: customerIds } })
          .select('name email')
          .lean();
        const userMap = new Map(users.map((u) => [u._id.toString(), u]));

        const formattedThreads = threads.map((t) => ({
          customerId: t._id.toString(),
          customerName: userMap.get(t._id.toString())?.name || 'Guest User',
          customerEmail: userMap.get(t._id.toString())?.email || '',
          lastMessage: t.lastMessage,
          lastSenderRole: t.lastSenderRole,
          lastMessageAt: t.lastMessageAt,
          unreadCount: t.unreadCount,
        }));

        return NextResponse.json({
          success: true,
          hotel: { id: hotel._id.toString(), name: hotel.name },
          threads: formattedThreads,
        });
      }

      // Specific conversation with a customer
      if (!customerIdParam) {
        return NextResponse.json(
          { success: false, error: 'customerId is required to fetch messages' },
          { status: 400 }
        );
      }

      const messages = await ChatMessage.find({
        hotelId: hotel._id,
        customerId: new mongoose.Types.ObjectId(customerIdParam),
      })
        .sort({ createdAt: 1 })
        .lean();

      // Mark unread customer messages as read
      await ChatMessage.updateMany(
        {
          hotelId: hotel._id,
          customerId: new mongoose.Types.ObjectId(customerIdParam),
          senderRole: 'CUSTOMER',
          isRead: false,
        },
        { isRead: true }
      );

      const customerUser = await User.findById(customerIdParam).select('name email').lean();

      return NextResponse.json({
        success: true,
        hotel: { id: hotel._id.toString(), name: hotel.name },
        customer: {
          id: customerIdParam,
          name: customerUser?.name || 'Guest User',
          email: customerUser?.email || '',
        },
        messages,
      });
    }

    // CUSTOMER or regular user fetching messages for a specific hotel
    if (!hotelIdParam) {
      return NextResponse.json(
        { success: false, error: 'hotelId is required to fetch chat' },
        { status: 400 }
      );
    }

    const hotel = await Hotel.findById(hotelIdParam).select('name slug coverImage images').lean();
    if (!hotel) {
      return NextResponse.json({ success: false, error: 'Hotel not found' }, { status: 404 });
    }

    const messages = await ChatMessage.find({
      hotelId: hotel._id,
      customerId: new mongoose.Types.ObjectId(session.id),
    })
      .sort({ createdAt: 1 })
      .lean();

    // Mark unread hotel admin messages as read
    await ChatMessage.updateMany(
      {
        hotelId: hotel._id,
        customerId: new mongoose.Types.ObjectId(session.id),
        senderRole: 'HOTEL_ADMIN',
        isRead: false,
      },
      { isRead: true }
    );

    return NextResponse.json({
      success: true,
      hotel: {
        id: hotel._id.toString(),
        name: hotel.name,
        slug: hotel.slug,
        avatar: hotel.coverImage?.url || hotel.images?.[0]?.url || null,
      },
      messages,
    });
  } catch (error) {
    console.error('Chat GET error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Please login to send messages.' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { hotelId, customerId, content } = body;

    if (!content || typeof content !== 'string' || !content.trim()) {
      return NextResponse.json(
        { success: false, error: 'Message content cannot be empty.' },
        { status: 400 }
      );
    }

    // STRICT PHONE NUMBER BLOCK
    if (containsPhoneNumber(content)) {
      return NextResponse.json(
        {
          success: false,
          error: PHONE_BLOCKED_MESSAGE,
          code: 'PHONE_NUMBER_DETECTED',
        },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Handle HOTEL_ADMIN sending to CUSTOMER
    if (session.role === 'HOTEL_ADMIN') {
      const hotel = await Hotel.findOne({
        $or: [
          { _id: session.assignedHotelId },
          { ownerUserId: session.id },
          { adminUserIds: session.id },
        ],
      }).lean();

      if (!hotel) {
        return NextResponse.json(
          { success: false, error: 'No hotel property assigned to your account.' },
          { status: 403 }
        );
      }

      if (!customerId) {
        return NextResponse.json(
          { success: false, error: 'Recipient customerId is required.' },
          { status: 400 }
        );
      }

      const newMsg = await ChatMessage.create({
        hotelId: hotel._id,
        customerId: new mongoose.Types.ObjectId(customerId),
        senderId: new mongoose.Types.ObjectId(session.id),
        senderRole: 'HOTEL_ADMIN',
        senderName: hotel.name,
        content: content.trim(),
        isRead: false,
      });

      // Notify customer
      await createNotification({
        recipientUserId: customerId,
        title: `Reply from ${hotel.name}`,
        message: content.trim().slice(0, 100),
        type: 'SYSTEM',
        entityId: hotel._id.toString(),
      });

      return NextResponse.json({ success: true, message: newMsg });
    }

    // Handle CUSTOMER sending to HOTEL
    if (!hotelId) {
      return NextResponse.json(
        { success: false, error: 'hotelId is required.' },
        { status: 400 }
      );
    }

    const hotel = await Hotel.findById(hotelId).lean();
    if (!hotel) {
      return NextResponse.json({ success: false, error: 'Hotel not found.' }, { status: 404 });
    }

    const newMsg = await ChatMessage.create({
      hotelId: hotel._id,
      customerId: new mongoose.Types.ObjectId(session.id),
      senderId: new mongoose.Types.ObjectId(session.id),
      senderRole: 'CUSTOMER',
      senderName: session.name || 'Guest User',
      content: content.trim(),
      isRead: false,
    });

    // Notify hotel admin / owner
    if (hotel.ownerUserId) {
      await createNotification({
        recipientUserId: hotel.ownerUserId.toString(),
        title: `New guest inquiry for ${hotel.name}`,
        message: `${session.name || 'A guest'}: "${content.trim().slice(0, 80)}"`,
        type: 'SYSTEM',
        entityId: hotel._id.toString(),
      });
    }

    return NextResponse.json({ success: true, message: newMsg });
  } catch (error) {
    console.error('Chat POST error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Server error' },
      { status: 500 }
    );
  }
}
