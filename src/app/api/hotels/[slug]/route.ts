import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connection';
import { Hotel } from '@/models/Hotel';
import { Review } from '@/models/Review';
import { getSession } from '@/lib/auth/session';
import { requireHotelAccess } from '@/lib/auth/rbac';
import { updateHotelSchema } from '@/lib/validation/hotel.schema';
import { getHotelRoomTypesAvailability } from '@/services/inventory.service';
import mongoose from 'mongoose';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const checkIn = searchParams.get('checkIn');
    const checkOut = searchParams.get('checkOut');

    // Query either by slug or by ObjectId
    const isObjectId = mongoose.Types.ObjectId.isValid(slug);
    const query = isObjectId ? { _id: slug } : { slug };

    const hotel = await Hotel.findOne(query).lean();
    if (!hotel) {
      return NextResponse.json({ success: false, error: 'Hotel not found' }, { status: 404 });
    }

    // Room types with real-time availability
    const roomTypesAvailability = await getHotelRoomTypesAvailability(
      hotel._id,
      checkIn || undefined,
      checkOut || undefined
    );

    // Reviews
    const reviews = await Review.find({ hotelId: hotel._id, status: 'PUBLISHED' })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return NextResponse.json({
      success: true,
      data: {
        ...hotel,
        roomTypes: roomTypesAvailability,
        reviews,
      },
    });
  } catch (error) {
    console.error('Hotel detail error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve hotel details' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const session = await getSession();

    await connectToDatabase();
    const isObjectId = mongoose.Types.ObjectId.isValid(slug);
    const hotel = await Hotel.findOne(isObjectId ? { _id: slug } : { slug });

    if (!hotel) {
      return NextResponse.json({ success: false, error: 'Hotel not found' }, { status: 404 });
    }

    // Require authorization to edit this hotel
    await requireHotelAccess(session, hotel._id.toString());

    const body = await req.json();
    const parsed = updateHotelSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }

    // Apply allowed updates (never allow changing status or owner directly here)
    const allowedFields = [
      'name',
      'description',
      'address',
      'locality',
      'city',
      'state',
      'country',
      'postalCode',
      'latitude',
      'longitude',
      'propertyType',
      'amenities',
      'checkInTime',
      'checkOutTime',
      'cancellationPolicy',
      'contactInformation',
      'coverImage',
      'images',
    ];

    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        // @ts-expect-error dynamic key assignment
        hotel[key] = body[key];
      }
    }

    await hotel.save();

    return NextResponse.json({
      success: true,
      message: 'Hotel updated successfully',
      data: hotel,
    });
  } catch (error) {
    console.error('Update hotel error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update hotel' },
      { status: 403 }
    );
  }
}
