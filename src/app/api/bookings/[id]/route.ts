import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connection';
import { Booking } from '@/models/Booking';
import { getSession } from '@/lib/auth/session';
import { requireAuth } from '@/lib/auth/rbac';
import mongoose from 'mongoose';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    const user = requireAuth(session);

    await connectToDatabase();

    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = isObjectId ? { _id: id } : { bookingReference: id.toUpperCase() };

    const booking = await Booking.findOne(query)
      .populate('hotelId', 'name slug address locality city state country coverImage contactInformation checkInTime checkOutTime cancellationPolicy')
      .populate('roomTypeId', 'name bedConfiguration basePrice amenities images maxOccupancy')
      .populate('assignedPhysicalRoomIds', 'roomNumber floor')
      .lean();

    if (!booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
    }

    // Role-based access validation
    if (user.role === 'CUSTOMER' && booking.customerId.toString() !== user.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized to view this booking' }, { status: 403 });
    }

    // For customer, omit internal physical room numbers if configured, but show room type details
    return NextResponse.json({ success: true, data: booking });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to retrieve booking' },
      { status: 403 }
    );
  }
}
