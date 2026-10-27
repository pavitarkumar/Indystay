import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connection';
import { PhysicalRoom } from '@/models/PhysicalRoom';
import { RoomType } from '@/models/RoomType';
import { Booking } from '@/models/Booking';
import { User } from '@/models/User';
import { getSession } from '@/lib/auth/session';
import { requireHotelAccess } from '@/lib/auth/rbac';
import { hashPassword } from '@/lib/auth/password';
import { parseDateOnly, calculateNights } from '@/utils/date';
import { calculateBookingPrice } from '@/utils/pricing';
import { createNotification } from '@/lib/notifications/notification.service';
import { createAuditLog } from '@/lib/audit/audit.service';
import mongoose from 'mongoose';

function generateBookingReference(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 6; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `IND-${new Date().getFullYear()}-${rand}`;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();

    await connectToDatabase();
    const room = await PhysicalRoom.findById(id);
    if (!room) {
      return NextResponse.json({ success: false, error: 'Physical room not found' }, { status: 404 });
    }

    const admin = await requireHotelAccess(session, room.hotelId.toString());

    const body = await req.json();
    const { checkInDate, checkOutDate, adults = 1, children = 0, guestDetails } = body;

    if (!checkInDate || !checkOutDate) {
      return NextResponse.json(
        { success: false, error: 'Check-in and check-out dates are required' },
        { status: 400 }
      );
    }

    const cIn = parseDateOnly(checkInDate);
    const cOut = parseDateOnly(checkOutDate);

    if (cOut <= cIn) {
      return NextResponse.json(
        { success: false, error: 'Check-out date must be after check-in date' },
        { status: 400 }
      );
    }

    if (!guestDetails?.fullName || !guestDetails?.email || !guestDetails?.phone) {
      return NextResponse.json(
        { success: false, error: 'Guest name, email, and phone number are required' },
        { status: 400 }
      );
    }

    // Check if this room is operational
    if (room.operationalStatus !== 'AVAILABLE') {
      return NextResponse.json(
        { success: false, error: `Room ${room.roomNumber} is currently ${room.operationalStatus} and cannot be booked.` },
        { status: 400 }
      );
    }

    // Check if room has an overlapping reservation for [cIn, cOut)
    const overlapping = await Booking.findOne({
      hotelId: room.hotelId,
      assignedPhysicalRoomIds: room._id,
      bookingStatus: { $in: ['ACCEPTED', 'CHECKED_IN'] },
      checkInDate: { $lt: cOut },
      checkOutDate: { $gt: cIn },
    });

    if (overlapping) {
      return NextResponse.json(
        {
          success: false,
          error: `Room ${room.roomNumber} is already booked from ${new Date(
            overlapping.checkInDate
          ).toLocaleDateString()} to ${new Date(overlapping.checkOutDate).toLocaleDateString()} (Ref: ${
            overlapping.bookingReference
          })`,
        },
        { status: 409 }
      );
    }

    const roomType = await RoomType.findById(room.roomTypeId);
    if (!roomType) {
      return NextResponse.json({ success: false, error: 'Room type not found' }, { status: 404 });
    }

    // Provision or link customer account
    const guestEmail = guestDetails.email.toLowerCase().trim();
    let customerUser = await User.findOne({ email: guestEmail });
    if (!customerUser) {
      const initialPasswordHash = await hashPassword(`IndiStay#${Math.random().toString(36).substring(2, 8)}!`);
      customerUser = await User.create({
        name: guestDetails.fullName.trim(),
        email: guestEmail,
        phone: guestDetails.phone.trim(),
        passwordHash: initialPasswordHash,
        role: 'CUSTOMER',
        accountStatus: 'ACTIVE',
        emailVerifiedAt: new Date(),
      });
    }

    const numberOfNights = calculateNights(cIn, cOut);
    const pricing = calculateBookingPrice(roomType.basePrice, numberOfNights, 1);
    const bookingReference = generateBookingReference();

    const booking = await Booking.create({
      bookingReference,
      customerId: customerUser._id,
      hotelId: room.hotelId,
      roomTypeId: room.roomTypeId,
      assignedPhysicalRoomIds: [room._id],
      checkInDate: cIn,
      checkOutDate: cOut,
      adults: Number(adults),
      children: Number(children || 0),
      numberOfRooms: 1,
      priceBreakdown: {
        pricePerNight: pricing.pricePerNight,
        numberOfNights: pricing.numberOfNights,
        baseTotal: pricing.baseTotal,
        taxesAndFees: pricing.taxesAndFees,
        totalPrice: pricing.totalPrice,
      },
      currency: roomType.currency || 'INR',
      bookingStatus: 'ACCEPTED',
      paymentStatus: 'PAID', // Direct hotel admin reservation
      guestDetails: {
        fullName: guestDetails.fullName.trim(),
        email: guestEmail,
        phone: guestDetails.phone.trim(),
        specialRequests: guestDetails.specialRequests || 'Direct admin reservation',
      },
      acceptedBy: new mongoose.Types.ObjectId(admin.id),
      acceptedAt: new Date(),
    });

    // Notify customer
    await createNotification({
      recipientUserId: customerUser._id,
      title: 'Direct Reservation Confirmed!',
      message: `Your reservation at room ${room.roomNumber} has been confirmed. Ref: ${bookingReference}.`,
      type: 'BOOKING_CONFIRMED',
      entityId: booking._id.toString(),
    });

    await createAuditLog({
      actorUserId: admin.id,
      actorRole: admin.role,
      action: 'DIRECT_ROOM_BOOKED',
      targetType: 'Booking',
      targetId: booking._id.toString(),
      details: { roomNumber: room.roomNumber, guestEmail },
    });

    return NextResponse.json({
      success: true,
      message: `Room ${room.roomNumber} reserved successfully for ${guestDetails.fullName}!`,
      data: booking,
    });
  } catch (error) {
    console.error('Direct room booking error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Reservation failed' },
      { status: 400 }
    );
  }
}
