import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connection';
import { Hotel } from '@/models/Hotel';
import { RoomType } from '@/models/RoomType';
import { PhysicalRoom } from '@/models/PhysicalRoom';
import { getSession } from '@/lib/auth/session';
import { requireHotelAccess } from '@/lib/auth/rbac';
import { createPhysicalRoomSchema } from '@/lib/validation/room.schema';
import mongoose from 'mongoose';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const session = await getSession();

    await connectToDatabase();
    const isObjectId = mongoose.Types.ObjectId.isValid(slug);
    const hotel = await Hotel.findOne(isObjectId ? { _id: slug } : { slug }).select('_id');

    if (!hotel) {
      return NextResponse.json({ success: false, error: 'Hotel not found' }, { status: 404 });
    }

    // Physical rooms are confidential operational records; require authorized hotel admin access
    await requireHotelAccess(session, hotel._id.toString());

    const rooms = await PhysicalRoom.find({ hotelId: hotel._id })
      .populate('roomTypeId', 'name')
      .sort({ floor: 1, roomNumber: 1 })
      .lean();

    return NextResponse.json({ success: true, data: rooms });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Access denied' },
      { status: 403 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const session = await getSession();

    await connectToDatabase();
    const isObjectId = mongoose.Types.ObjectId.isValid(slug);
    const hotel = await Hotel.findOne(isObjectId ? { _id: slug } : { slug }).select('_id');

    if (!hotel) {
      return NextResponse.json({ success: false, error: 'Hotel not found' }, { status: 404 });
    }

    await requireHotelAccess(session, hotel._id.toString());

    const body = await req.json();
    const parsed = createPhysicalRoomSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Invalid room data' },
        { status: 400 }
      );
    }

    // Verify room type belongs to this hotel
    const roomType = await RoomType.findOne({
      _id: parsed.data.roomTypeId,
      hotelId: hotel._id,
    });

    if (!roomType) {
      return NextResponse.json(
        { success: false, error: 'Specified Room Type does not belong to this hotel' },
        { status: 400 }
      );
    }

    // Check duplicate room number
    const existing = await PhysicalRoom.findOne({
      hotelId: hotel._id,
      roomNumber: parsed.data.roomNumber.trim(),
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: `Room ${parsed.data.roomNumber} already exists in this hotel` },
        { status: 409 }
      );
    }

    const room = await PhysicalRoom.create({
      hotelId: hotel._id,
      roomTypeId: roomType._id,
      roomNumber: parsed.data.roomNumber.trim(),
      floor: parsed.data.floor,
      operationalStatus: parsed.data.operationalStatus,
      housekeepingStatus: parsed.data.housekeepingStatus,
      notes: parsed.data.notes,
      images: parsed.data.images || [],
    });

    return NextResponse.json({
      success: true,
      message: `Room ${room.roomNumber} created successfully`,
      data: room,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create room' },
      { status: 403 }
    );
  }
}
