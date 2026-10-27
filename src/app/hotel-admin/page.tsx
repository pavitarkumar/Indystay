import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  Bed,
  DoorOpen,
  Wrench,
  Clock,
  CalendarCheck,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { getSession } from '@/lib/auth/session';
import { connectToDatabase } from '@/lib/db/connection';
import { Hotel } from '@/models/Hotel';
import { PhysicalRoom } from '@/models/PhysicalRoom';
import { RoomType } from '@/models/RoomType';
import { Booking } from '@/models/Booking';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export default async function HotelAdminDashboardPage() {
  const session = await getSession();
  if (!session) redirect('/auth/login');

  await connectToDatabase();

  const hotel = await Hotel.findOne({
    $or: [{ _id: session.assignedHotelId }, { ownerUserId: session.id }, { adminUserIds: session.id }],
  }).lean();

  if (!hotel) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center max-w-lg mx-auto mt-12">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900">No Assigned Hotel Property Found</h2>
        <p className="text-xs text-slate-500 mt-1">
          You are signed in as a Hotel Partner, but have not yet registered or been assigned a hotel
          listing.
        </p>
        <div className="mt-6">
          <Link href="/hotel-admin/property">
            <Button variant="primary">Submit Hotel Application</Button>
          </Link>
        </div>
      </div>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

  // Queries for real metrics
  const [
    totalRooms,
    maintenanceRooms,
    pendingBookingsCount,
    allHotelBookings,
    activeStaysToday,
    roomTypesCount,
  ] = await Promise.all([
    PhysicalRoom.countDocuments({ hotelId: hotel._id }),
    PhysicalRoom.countDocuments({ hotelId: hotel._id, operationalStatus: 'MAINTENANCE' }),
    Booking.countDocuments({ hotelId: hotel._id, bookingStatus: 'PENDING' }),
    Booking.find({ hotelId: hotel._id }).sort({ createdAt: -1 }).limit(8).populate('roomTypeId', 'name').lean(),
    // Active stays today: checkInDate <= today AND checkOutDate > today AND status IN ['ACCEPTED', 'CHECKED_IN']
    Booking.find({
      hotelId: hotel._id,
      bookingStatus: { $in: ['ACCEPTED', 'CHECKED_IN'] },
      checkInDate: { $lte: tomorrow },
      checkOutDate: { $gt: today },
    }).select('assignedPhysicalRoomIds'),
    RoomType.countDocuments({ hotelId: hotel._id }),
  ]);

  // Unique occupied rooms
  const occupiedRoomIdSet = new Set<string>();
  for (const b of activeStaysToday) {
    if (b.assignedPhysicalRoomIds) {
      for (const id of b.assignedPhysicalRoomIds) {
        occupiedRoomIdSet.add(id.toString());
      }
    }
  }

  const occupiedRoomsCount = occupiedRoomIdSet.size;
  const availableRoomsCount = Math.max(0, totalRooms - maintenanceRooms - occupiedRoomsCount);
  const occupancyRate =
    totalRooms > 0 ? Math.round((occupiedRoomsCount / (totalRooms - maintenanceRooms || 1)) * 100) : 0;

  // Calculate revenue from qualifying bookings
  const qualifyingBookings = await Booking.find({
    hotelId: hotel._id,
    bookingStatus: { $in: ['ACCEPTED', 'CHECKED_IN', 'CHECKED_OUT'] },
  }).select('priceBreakdown');

  const totalRevenue = qualifyingBookings.reduce(
    (sum, b) => sum + (b.priceBreakdown?.totalPrice || 0),
    0
  );

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge
              variant={
                hotel.verificationStatus === 'APPROVED'
                  ? 'success'
                  : hotel.verificationStatus === 'REJECTED'
                  ? 'destructive'
                  : 'warning'
              }
              className="font-bold"
            >
              {hotel.verificationStatus === 'APPROVED'
                ? 'Verified & Approved'
                : `Status: ${hotel.verificationStatus}`}
            </Badge>
            <Badge variant="secondary">{hotel.propertyType}</Badge>
            {hotel.listingStatus === 'PUBLISHED' && (
              <Badge variant="indigo">Live in Marketplace</Badge>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {hotel.name}
          </h1>

          <p className="text-xs text-slate-500 mt-1">
            {hotel.address}, {hotel.locality}, {hotel.city}
          </p>
        </div>

        <div className="flex gap-3">
          <Link href="/hotel-admin/requests">
            <Button variant="primary" size="md" className="flex items-center gap-1.5 font-bold shadow-xs">
              <Clock className="w-4 h-4" />
              <span>Review Requests ({pendingBookingsCount})</span>
            </Button>
          </Link>
          <Link href={`/hotel/${hotel.slug}`} target="_blank">
            <Button variant="outline" size="md">
              View Public Listing
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Physical Rooms
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <DoorOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{totalRooms}</span>
            <span className="text-xs text-slate-400">across {roomTypesCount} types</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Currently Occupied
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Bed className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{occupiedRoomsCount}</span>
            <span className="text-xs text-emerald-600 font-semibold">{occupancyRate}% Occupancy</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Maintenance / Offline
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{maintenanceRooms}</span>
            <span className="text-xs text-slate-400">rooms offline</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Recognized Revenue
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              ₹{totalRevenue.toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-slate-400">qualifying stays</span>
          </div>
        </div>
      </div>

      {/* Recent Booking Activity Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recent Booking Requests & Stays</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live incoming customer submissions and active stay itineraries.
            </p>
          </div>
          <Link href="/hotel-admin/requests">
            <Button variant="outline" size="sm" className="flex items-center gap-1 text-xs">
              <span>View All Requests</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>

        {allHotelBookings.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            No bookings recorded yet for this property.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-100 font-bold">
                <tr>
                  <th className="py-3 px-5">Reference</th>
                  <th className="py-3 px-5">Guest Name</th>
                  <th className="py-3 px-5">Room Type</th>
                  <th className="py-3 px-5">Stay Dates</th>
                  <th className="py-3 px-5">Total</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {allHotelBookings.map((b) => (
                  <tr key={b._id.toString()} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-5 font-bold text-indigo-600">
                      {b.bookingReference}
                    </td>
                    <td className="py-3 px-5 text-slate-900">
                      {b.guestDetails?.fullName}
                    </td>
                    <td className="py-3 px-5 text-slate-700">
                      {(b.roomTypeId as unknown as { name?: string })?.name || 'Standard'}
                    </td>
                    <td className="py-3 px-5 text-slate-600">
                      {new Date(b.checkInDate).toLocaleDateString()} &rarr;{' '}
                      {new Date(b.checkOutDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-5 font-bold text-slate-900">
                      ₹{b.priceBreakdown?.totalPrice?.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-5">
                      <Badge
                        variant={
                          b.bookingStatus === 'ACCEPTED'
                            ? 'success'
                            : b.bookingStatus === 'PENDING'
                            ? 'warning'
                            : b.bookingStatus === 'CHECKED_IN'
                            ? 'indigo'
                            : b.bookingStatus === 'CANCELLED' || b.bookingStatus === 'REJECTED'
                            ? 'destructive'
                            : 'default'
                        }
                      >
                        {b.bookingStatus}
                      </Badge>
                    </td>
                    <td className="py-3 px-5 text-right">
                      <Link href="/hotel-admin/requests">
                        <span className="text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer">
                          Manage
                        </span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
