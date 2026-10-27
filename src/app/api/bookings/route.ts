import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connection';
import { Booking } from '@/models/Booking';
import { Hotel } from '@/models/Hotel';
import { User } from '@/models/User';
import { getSession, setSessionCookie } from '@/lib/auth/session';
import { requireAuth } from '@/lib/auth/rbac';
import { hashPassword } from '@/lib/auth/password';
import { createBookingSchema } from '@/lib/validation/booking.schema';
import { createBookingRequest } from '@/services/booking.service';
import mongoose from 'mongoose';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    const user = requireAuth(session);

    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const hotelIdParam = searchParams.get('hotelId');

    const filter: Record<string, unknown> = {};

    if (user.role === 'CUSTOMER') {
      filter.customerId = new mongoose.Types.ObjectId(user.id);
    } else if (user.role === 'HOTEL_ADMIN') {
      // Find assigned hotels
      let targetHotelId = user.assignedHotelId;
      if (!targetHotelId) {
        const hotel = await Hotel.findOne({
          $or: [{ ownerUserId: user.id }, { adminUserIds: user.id }],
        }).select('_id');
        targetHotelId = hotel?._id?.toString() || null;
      }

      if (!targetHotelId) {
        return NextResponse.json({ success: true, data: [] });
      }
      filter.hotelId = new mongoose.Types.ObjectId(targetHotelId);
    } else if (user.role === 'SUPER_ADMIN') {
      if (hotelIdParam && mongoose.Types.ObjectId.isValid(hotelIdParam)) {
        filter.hotelId = new mongoose.Types.ObjectId(hotelIdParam);
      }
    }

    if (status && status !== 'ALL') {
      filter.bookingStatus = status;
    }

    const bookings = await Booking.find(filter)
      .populate('hotelId', 'name slug address city coverImage contactInformation')
      .populate('roomTypeId', 'name bedConfiguration basePrice images')
      .populate('assignedPhysicalRoomIds', 'roomNumber floor')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: bookings });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to retrieve bookings' },
      { status: 401 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createBookingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Invalid booking submission' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const session = await getSession();
    let customerId: string;

    if (session) {
      customerId = session.id;
    } else {
      // Frictionless guest checkout: Provision or link account with provided email
      const guestEmail = parsed.data.guestDetails.email.toLowerCase().trim();
      let customerUser = await User.findOne({ email: guestEmail });

      if (!customerUser) {
        // Generate random initial password
        const initialPasswordHash = await hashPassword(
          `IndiStay#${Math.random().toString(36).substring(2, 8)}!`
        );

        customerUser = await User.create({
          name: parsed.data.guestDetails.fullName.trim(),
          email: guestEmail,
          phone: parsed.data.guestDetails.phone?.trim(),
          passwordHash: initialPasswordHash,
          role: 'CUSTOMER',
          accountStatus: 'ACTIVE',
          emailVerifiedAt: new Date(),
        });
      }

      customerId = customerUser._id.toString();

      // Automatically authenticate the guest and set session cookie
      await setSessionCookie({
        id: customerUser._id.toString(),
        email: customerUser.email,
        name: customerUser.name,
        role: customerUser.role,
        assignedHotelId: null,
      });
    }

    const booking = await createBookingRequest({
      customerId,
      hotelId: parsed.data.hotelId,
      roomTypeId: parsed.data.roomTypeId,
      checkInDate: parsed.data.checkInDate,
      checkOutDate: parsed.data.checkOutDate,
      adults: parsed.data.adults,
      children: parsed.data.children,
      numberOfRooms: parsed.data.numberOfRooms,
      selectedPhysicalRoomId: parsed.data.selectedPhysicalRoomId,
      paymentType: parsed.data.paymentType,
      paymentReference: parsed.data.paymentReference,
      guestDetails: parsed.data.guestDetails,
    });

    return NextResponse.json({
      success: true,
      message: 'Booking request submitted successfully',
      data: booking,
    });
  } catch (error) {
    console.error('Booking submission error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Booking creation failed' },
      { status: 400 }
    );
  }
}
