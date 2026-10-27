import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connection';
import { User } from '@/models/User';
import { Hotel } from '@/models/Hotel';
import { Booking } from '@/models/Booking';
import { AuditLog } from '@/models/AuditLog';
import { getSession } from '@/lib/auth/session';
import { requireSuperAdmin } from '@/lib/auth/rbac';

export async function GET() {
  try {
    const session = await getSession();
    requireSuperAdmin(session);

    await connectToDatabase();

    const [
      totalCustomers,
      totalHotelAdmins,
      totalHotels,
      pendingHotels,
      publishedHotels,
      suspendedHotels,
      bookings,
      recentAuditLogs,
    ] = await Promise.all([
      User.countDocuments({ role: 'CUSTOMER' }),
      User.countDocuments({ role: 'HOTEL_ADMIN' }),
      Hotel.countDocuments({}),
      Hotel.countDocuments({ verificationStatus: 'PENDING' }),
      Hotel.countDocuments({ verificationStatus: 'APPROVED', listingStatus: 'PUBLISHED' }),
      Hotel.countDocuments({ listingStatus: 'SUSPENDED' }),
      Booking.find({}).select('bookingStatus priceBreakdown createdAt paymentStatus').lean(),
      AuditLog.find({}).sort({ createdAt: -1 }).limit(10).populate('actorUserId', 'name email').lean(),
    ]);

    // Calculate booking statuses
    const bookingsByStatus: Record<string, number> = {
      PENDING: 0,
      ACCEPTED: 0,
      REJECTED: 0,
      CANCELLED: 0,
      EXPIRED: 0,
      CHECKED_IN: 0,
      CHECKED_OUT: 0,
    };

    let grossBookingValue = 0; // Gross booking value of all completed/accepted bookings
    let qualifyingBookingsCount = 0;

    for (const b of bookings) {
      if (bookingsByStatus[b.bookingStatus] !== undefined) {
        bookingsByStatus[b.bookingStatus]++;
      } else {
        bookingsByStatus[b.bookingStatus] = 1;
      }

      if (['ACCEPTED', 'CHECKED_IN', 'CHECKED_OUT'].includes(b.bookingStatus)) {
        grossBookingValue += b.priceBreakdown?.totalPrice || 0;
        qualifyingBookingsCount++;
      }
    }

    const totalBookingsCount = bookings.length;
    const cancellationRate =
      totalBookingsCount > 0
        ? Math.round((bookingsByStatus.CANCELLED / totalBookingsCount) * 100)
        : 0;
    const rejectionRate =
      totalBookingsCount > 0
        ? Math.round((bookingsByStatus.REJECTED / totalBookingsCount) * 100)
        : 0;

    // Platform revenue = 15% marketplace commission of confirmed stays
    const platformCommissionRate = 0.15;
    const recognizedPlatformRevenue = Math.round(grossBookingValue * platformCommissionRate);

    return NextResponse.json({
      success: true,
      data: {
        users: {
          totalCustomers,
          totalHotelAdmins,
        },
        hotels: {
          totalHotels,
          pendingHotels,
          publishedHotels,
          suspendedHotels,
        },
        bookings: {
          totalBookings: totalBookingsCount,
          byStatus: bookingsByStatus,
          cancellationRate,
          rejectionRate,
          qualifyingBookingsCount,
        },
        financials: {
          currency: 'INR',
          grossBookingValue,
          commissionRatePercent: 15,
          recognizedPlatformRevenue,
        },
        recentAuditLogs,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unauthorized' },
      { status: 403 }
    );
  }
}
