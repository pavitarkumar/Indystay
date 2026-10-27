import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connection';
import { PhysicalRoom } from '@/models/PhysicalRoom';
import { Booking } from '@/models/Booking';
import { getSession } from '@/lib/auth/session';
import { requireHotelAccess } from '@/lib/auth/rbac';
import mongoose from 'mongoose';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();

    await connectToDatabase();
    const room = await PhysicalRoom.findById(id).populate('roomTypeId', 'name basePrice bedConfiguration');
    if (!room) {
      return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 });
    }

    await requireHotelAccess(session, room.hotelId.toString());

    // Fetch complete booking history for this specific physical room
    const bookings = await Booking.find({
      assignedPhysicalRoomIds: new mongoose.Types.ObjectId(id),
    })
      .populate('customerId', 'name email phone')
      .populate('roomTypeId', 'name')
      .sort({ checkInDate: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: {
        room,
        bookings,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Access denied' },
      { status: 403 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();

    await connectToDatabase();
    const room = await PhysicalRoom.findById(id);
    if (!room) {
      return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 });
    }

    await requireHotelAccess(session, room.hotelId.toString());

    const body = await req.json();

    // Check duplicate room number if roomNumber is modified
    if (body.roomNumber && body.roomNumber.trim() !== room.roomNumber) {
      const existing = await PhysicalRoom.findOne({
        hotelId: room.hotelId,
        roomNumber: body.roomNumber.trim(),
        _id: { $ne: room._id },
      });
      if (existing) {
        return NextResponse.json(
          { success: false, error: `Room number ${body.roomNumber} already exists in this hotel` },
          { status: 409 }
        );
      }
      room.roomNumber = body.roomNumber.trim();
    }

    if (body.floor !== undefined) room.floor = Number(body.floor);
    if (body.roomTypeId && mongoose.Types.ObjectId.isValid(body.roomTypeId)) {
      room.roomTypeId = new mongoose.Types.ObjectId(body.roomTypeId);
    }
    if (body.operationalStatus) room.operationalStatus = body.operationalStatus;
    if (body.housekeepingStatus) room.housekeepingStatus = body.housekeepingStatus;
    if (body.notes !== undefined) room.notes = body.notes;

    await room.save();

    return NextResponse.json({
      success: true,
      message: 'Room details updated successfully',
      data: room,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update room' },
      { status: 403 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();

    await connectToDatabase();
    const room = await PhysicalRoom.findById(id);
    if (!room) {
      return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 });
    }

    await requireHotelAccess(session, room.hotelId.toString());

    // Check for active or ongoing bookings
    const activeBooking = await Booking.findOne({
      assignedPhysicalRoomIds: new mongoose.Types.ObjectId(id),
      bookingStatus: { $in: ['ACCEPTED', 'CHECKED_IN'] },
      checkOutDate: { $gt: new Date() },
    });

    if (activeBooking) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete room ${room.roomNumber} because it is currently assigned to active reservation ${activeBooking.bookingReference}. You may toggle it to Maintenance or Out of Service instead.`,
        },
        { status: 400 }
      );
    }

    await PhysicalRoom.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: `Room ${room.roomNumber} deleted successfully`,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to delete room' },
      { status: 403 }
    );
  }
}
