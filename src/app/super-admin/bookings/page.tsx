import React from 'react';
import Link from 'next/link';
import { Calendar, Search, Building, User, DollarSign } from 'lucide-react';
import { connectToDatabase } from '@/lib/db/connection';
import { Booking } from '@/models/Booking';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{
    status?: string;
    q?: string;
  }>;
}

export default async function SuperAdminBookingsPage({ searchParams }: PageProps) {
  const { status, q } = await searchParams;
  await connectToDatabase();

  const filter: Record<string, unknown> = {};
  if (status && status !== 'ALL') {
    filter.bookingStatus = status;
  }
  if (q && q.trim()) {
    filter.bookingReference = { $regex: new RegExp(q.trim(), 'i') };
  }

  const bookings = await Booking.find(filter)
    .populate('hotelId', 'name city slug')
    .populate('roomTypeId', 'name')
    .populate('customerId', 'name email')
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Platform Bookings Oversight</h1>
          <p className="text-xs text-slate-500 mt-1">
            Global view of all reservation requests, confirmed stays, and revenue breakdowns.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
          {['ALL', 'PENDING', 'ACCEPTED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED', 'REJECTED'].map((st) => (
            <Link
              key={st}
              href={`/super-admin/bookings?status=${st}${q ? `&q=${q}` : ''}`}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                (status || 'ALL') === st
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200'
              }`}
            >
              {st}
            </Link>
          ))}
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-2xl border border-dashed border-slate-300 p-8">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No bookings match criteria</h3>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-100 font-bold">
                <tr>
                  <th className="py-3 px-5">Reference</th>
                  <th className="py-3 px-5">Hotel Property</th>
                  <th className="py-3 px-5">Guest Name</th>
                  <th className="py-3 px-5">Stay Dates</th>
                  <th className="py-3 px-5">Gross Amount</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {bookings.map((b) => (
                  <tr key={b._id.toString()} className="hover:bg-slate-50/60">
                    <td className="py-3.5 px-5 font-black text-indigo-600 text-sm">
                      {b.bookingReference}
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="font-bold text-slate-900">
                        {(b.hotelId as unknown as { name?: string })?.name || 'Property'}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {(b.hotelId as unknown as { city?: string })?.city}
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-slate-800">
                      {b.guestDetails?.fullName}
                      <div className="text-[11px] text-slate-400">{b.guestDetails?.email}</div>
                    </td>
                    <td className="py-3.5 px-5 text-slate-600">
                      {new Date(b.checkInDate).toLocaleDateString()} &rarr;{' '}
                      {new Date(b.checkOutDate).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-5 font-extrabold text-slate-900">
                      ₹{b.priceBreakdown?.totalPrice?.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-5">
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
                    <td className="py-3.5 px-5 text-right">
                      <Link href={`/booking/${b._id.toString()}`} target="_blank">
                        <Button variant="outline" size="sm" className="text-xs">
                          Inspect
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
