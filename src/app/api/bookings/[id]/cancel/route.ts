import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connection';
import { Booking } from '@/models/Booking';
import { getSession } from '@/lib/auth/session';
import { requireAuth } from '@/lib/auth/rbac';
import { cancelBookingSchema } from '@/lib/validation/booking.schema';
import { cancelBooking } from '@/services/booking.service';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    const user = requireAuth(session);

    await connectToDatabase();
    const booking = await Booking.findById(id);
    if (!booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
    }

    // Customer can cancel own booking, Hotel Admin / Super Admin can also cancel
    const isOwner = booking.customerId.toString() === user.id;
    const isPrivileged = ['HOTEL_ADMIN', 'SUPER_ADMIN'].includes(user.role);

    if (!isOwner && !isPrivileged) {
      return NextResponse.json({ success: false, error: 'Unauthorized to cancel this booking' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = cancelBookingSchema.safeParse(body);
    const reason = parsed.success ? parsed.data.reason : 'Cancelled by user';

    const updatedBooking = await cancelBooking(id, user.id, reason);

    return NextResponse.json({
      success: true,
      message: 'Booking cancelled successfully and room inventory released',
      data: updatedBooking,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to cancel booking' },
      { status: 400 }
    );
  }
}
