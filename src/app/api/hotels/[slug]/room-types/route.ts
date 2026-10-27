import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connection';
import { Hotel } from '@/models/Hotel';
import { RoomType } from '@/models/RoomType';
import { getSession } from '@/lib/auth/session';
import { requireHotelAccess } from '@/lib/auth/rbac';
import { createRoomTypeSchema } from '@/lib/validation/room.schema';
import mongoose from 'mongoose';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    await connectToDatabase();

    const isObjectId = mongoose.Types.ObjectId.isValid(slug);
    const hotel = await Hotel.findOne(isObjectId ? { _id: slug } : { slug }).select('_id');

    if (!hotel) {
      return NextResponse.json({ success: false, error: 'Hotel not found' }, { status: 404 });
    }

    const roomTypes = await RoomType.find({ hotelId: hotel._id }).lean();
    return NextResponse.json({ success: true, data: roomTypes });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve room types' },
      { status: 500 }
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
    const parsed = createRoomTypeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Invalid room type data' },
        { status: 400 }
      );
    }

    // Check duplicate name within hotel
    const existing = await RoomType.findOne({ hotelId: hotel._id, name: parsed.data.name });
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'A room type with this name already exists in your hotel' },
        { status: 409 }
      );
    }

    const slugName = parsed.data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const roomType = await RoomType.create({
      ...parsed.data,
      slug: slugName,
      hotelId: hotel._id,
    });

    return NextResponse.json({
      success: true,
      message: 'Room type created successfully',
      data: roomType,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create room type' },
      { status: 403 }
    );
  }
}
