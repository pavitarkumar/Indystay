import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connection';
import { Booking } from '@/models/Booking';
import { getSession } from '@/lib/auth/session';
import { requireHotelAccess } from '@/lib/auth/rbac';
import { acceptBooking } from '@/services/booking.service';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();

    await connectToDatabase();
    const booking = await Booking.findById(id);
    if (!booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
    }

    const authedUser = await requireHotelAccess(session, booking.hotelId.toString());

    const updatedBooking = await acceptBooking(id, authedUser.id);

    return NextResponse.json({
      success: true,
      message: 'Booking request confirmed and physical room(s) assigned',
      data: updatedBooking,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to accept booking' },
      { status: 400 }
    );
  }
}
