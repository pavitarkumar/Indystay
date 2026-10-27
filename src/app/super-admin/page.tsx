import React from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  DollarSign,
  Building,
  Users,
  CalendarCheck,
  AlertCircle,
  ShieldCheck,
  ArrowRight,
  Clock,
  CheckCircle2,
  Key,
} from 'lucide-react';
import { connectToDatabase } from '@/lib/db/connection';
import { User } from '@/models/User';
import { Hotel } from '@/models/Hotel';
import { Booking } from '@/models/Booking';
import { AuditLog } from '@/models/AuditLog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export default async function SuperAdminOverviewPage() {
  await connectToDatabase();

  const [
    totalCustomers,
    totalHotelAdmins,
    totalHotels,
    pendingHotels,
    publishedHotels,
    suspendedHotels,
    bookings,
    recentAudits,
  ] = await Promise.all([
    User.countDocuments({ role: 'CUSTOMER' }),
    User.countDocuments({ role: 'HOTEL_ADMIN' }),
    Hotel.countDocuments({}),
    Hotel.find({ verificationStatus: 'PENDING' }).populate('ownerUserId', 'name email').lean(),
    Hotel.countDocuments({ verificationStatus: 'APPROVED', listingStatus: 'PUBLISHED' }),
    Hotel.countDocuments({ listingStatus: 'SUSPENDED' }),
    Booking.find({}).select('bookingStatus priceBreakdown createdAt').lean(),
    AuditLog.find({}).sort({ createdAt: -1 }).limit(6).populate('actorUserId', 'name email role').lean(),
  ]);

  let grossBookingValue = 0;
  const statusCounts: Record<string, number> = {
    PENDING: 0,
    ACCEPTED: 0,
    CHECKED_IN: 0,
    CHECKED_OUT: 0,
    CANCELLED: 0,
    REJECTED: 0,
  };

  for (const b of bookings) {
    if (statusCounts[b.bookingStatus] !== undefined) {
      statusCounts[b.bookingStatus]++;
    } else {
      statusCounts[b.bookingStatus] = 1;
    }

    if (['ACCEPTED', 'CHECKED_IN', 'CHECKED_OUT'].includes(b.bookingStatus)) {
      grossBookingValue += b.priceBreakdown?.totalPrice || 0;
    }
  }

  const recognizedPlatformRevenue = Math.round(grossBookingValue * 0.15); // 15% marketplace take-rate
  const totalBookings = bookings.length;
  const cancellationRate =
    totalBookings > 0 ? Math.round((statusCounts.CANCELLED / totalBookings) * 100) : 0;
  const rejectionRate =
    totalBookings > 0 ? Math.round((statusCounts.REJECTED / totalBookings) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="indigo" className="font-bold">
              Executive Platform Console
            </Badge>
            <span className="text-xs text-slate-400">• Multi-Tenant Control</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Platform Overview & Analytics
          </h1>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Link href="/super-admin/hotel-admins">
            <Button variant="outline" size="sm" className="flex items-center gap-1.5 font-bold shadow-xs bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50">
              <Key className="w-4 h-4 text-indigo-600" />
              <span>Manage Hotel Admins (26)</span>
            </Button>
          </Link>
          <Link href="/super-admin/hotels">
            <Button variant="primary" size="sm" className="flex items-center gap-1.5 font-bold shadow-xs">
              <Building className="w-4 h-4" />
              <span>Review Properties ({pendingHotels.length})</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Pending Applications Alert Banner */}
      {pendingHotels.length > 0 && (
        <div className="p-5 bg-amber-50 rounded-2xl border border-amber-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-amber-900">
                {pendingHotels.length} Hotel Application(s) Awaiting Super Admin Review
              </h3>
              <p className="text-xs text-amber-700 mt-0.5">
                New partner properties require verification before appearing in search results.
              </p>
            </div>
          </div>
          <Link href="/super-admin/hotels">
            <Button variant="primary" size="sm" className="bg-amber-600 hover:bg-amber-700 text-white font-bold">
              Review Now
            </Button>
          </Link>
        </div>
      )}

      {/* Financials & Volume Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Gross Booking Value (GBV)
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              ₹{grossBookingValue.toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-slate-400">total confirmed</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Recognized Platform Revenue
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-purple-700">
              ₹{recognizedPlatformRevenue.toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-slate-400">(15% commission)</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Active Properties
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{publishedHotels}</span>
            <span className="text-xs text-slate-400">of {totalHotels} registered</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Registered Accounts
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">
              {totalCustomers + totalHotelAdmins}
            </span>
            <span className="text-xs text-slate-400">
              {totalCustomers} guests, {totalHotelAdmins} admins
            </span>
          </div>
        </div>
      </div>

      {/* Bookings Status Breakdown & Quality Rates */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900">Bookings by Lifecycle Status</h3>
            <span className="text-xs text-slate-400 font-semibold">{totalBookings} Total Requests</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-amber-50/70 rounded-xl border border-amber-100">
              <div className="text-[10px] font-bold text-amber-700 uppercase">Pending Requests</div>
              <div className="text-2xl font-black text-amber-900 mt-1">{statusCounts.PENDING}</div>
            </div>
            <div className="p-4 bg-emerald-50/70 rounded-xl border border-emerald-100">
              <div className="text-[10px] font-bold text-emerald-700 uppercase">Confirmed / Accepted</div>
              <div className="text-2xl font-black text-emerald-900 mt-1">{statusCounts.ACCEPTED}</div>
            </div>
            <div className="p-4 bg-indigo-50/70 rounded-xl border border-indigo-100">
              <div className="text-[10px] font-bold text-indigo-700 uppercase">Checked In</div>
              <div className="text-2xl font-black text-indigo-900 mt-1">{statusCounts.CHECKED_IN}</div>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-[10px] font-bold text-slate-600 uppercase">Completed Stays</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{statusCounts.CHECKED_OUT}</div>
            </div>
            <div className="p-4 bg-rose-50/70 rounded-xl border border-rose-100">
              <div className="text-[10px] font-bold text-rose-700 uppercase">Cancelled</div>
              <div className="text-2xl font-black text-rose-900 mt-1">{statusCounts.CANCELLED}</div>
            </div>
            <div className="p-4 bg-rose-50/70 rounded-xl border border-rose-100">
              <div className="text-[10px] font-bold text-rose-700 uppercase">Rejected by Partner</div>
              <div className="text-2xl font-black text-rose-900 mt-1">{statusCounts.REJECTED}</div>
            </div>
          </div>
        </div>

        {/* Quality Rates */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Quality Health Metrics</h3>
            <p className="text-xs text-slate-500">Cancellation & rejection monitoring.</p>

            <div className="mt-6 space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-600">Cancellation Rate</span>
                  <span className="text-slate-900 font-bold">{cancellationRate}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full"
                    style={{ width: `${Math.min(cancellationRate, 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-600">Rejection Rate</span>
                  <span className="text-slate-900 font-bold">{rejectionRate}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-rose-500 h-full rounded-full"
                    style={{ width: `${Math.min(rejectionRate, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400">
            Platform targets: Cancellation &lt; 15%, Rejection &lt; 5%.
          </div>
        </div>
      </div>

      {/* Recent Administrative Audit Trail */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recent Administrative Audit Logs</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Consequential state transitions, room assignments, and approvals.
            </p>
          </div>
          <Link href="/super-admin/audit-logs">
            <Button variant="outline" size="sm" className="text-xs">
              View Complete Audit Trail
            </Button>
          </Link>
        </div>

        {recentAudits.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">No audit records logged yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-100 font-bold">
                <tr>
                  <th className="py-3 px-5">Timestamp</th>
                  <th className="py-3 px-5">Action</th>
                  <th className="py-3 px-5">Target Entity</th>
                  <th className="py-3 px-5">Actor Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {recentAudits.map((a) => (
                  <tr key={a._id.toString()} className="hover:bg-slate-50/60">
                    <td className="py-3 px-5 text-slate-400">
                      {new Date(a.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-5 font-bold text-slate-900">{a.action}</td>
                    <td className="py-3 px-5 text-indigo-600">
                      {a.targetType} ({a.targetId})
                    </td>
                    <td className="py-3 px-5">
                      <Badge variant="indigo">{a.actorRole}</Badge>
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
