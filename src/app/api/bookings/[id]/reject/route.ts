import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connection';
import { Booking } from '@/models/Booking';
import { getSession } from '@/lib/auth/session';
import { requireHotelAccess } from '@/lib/auth/rbac';
import { rejectBookingSchema } from '@/lib/validation/booking.schema';
import { rejectBooking } from '@/services/booking.service';

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

    const body = await req.json();
    const parsed = rejectBookingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Rejection reason is required' },
        { status: 400 }
      );
    }

    const updatedBooking = await rejectBooking(id, authedUser.id, parsed.data.reason);

    return NextResponse.json({
      success: true,
      message: 'Booking request rejected',
      data: updatedBooking,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to reject booking' },
      { status: 400 }
    );
  }
}
