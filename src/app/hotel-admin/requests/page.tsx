'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Check,
  X,
  UserCheck,
  LogOut,
  AlertCircle,
  Clock,
  CheckCircle2,
  Phone,
  Mail,
  DoorOpen,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';

interface BookingItem {
  _id: string;
  bookingReference: string;
  bookingStatus: string;
  paymentStatus: string;
  checkInDate: string;
  checkOutDate: string;
  numberOfRooms: number;
  adults: number;
  children: number;
  priceBreakdown: {
    totalPrice: number;
    pricePerNight: number;
    numberOfNights: number;
  };
  roomTypeId: {
    name: string;
  };
  assignedPhysicalRoomIds?: Array<{
    _id: string;
    roomNumber: string;
    floor: number;
  }>;
  guestDetails: {
    fullName: string;
    email: string;
    phone: string;
    specialRequests?: string;
  };
  rejectionReason?: string;
  cancellationReason?: string;
  createdAt: string;
}

export default function HotelAdminRequestsPage() {
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Rejection modal
  const [rejectModalBookingId, setRejectModalBookingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('Requested room inventory unavailable for specified dates');
  const [isRejecting, setIsRejecting] = useState(false);

  // Processing state
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/bookings');
      const data = await res.json();
      if (data.success) {
        setBookings(data.data || []);
      }
    } catch {
      // error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleAccept = async (bookingId: string) => {
    setActionLoadingId(bookingId);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/accept`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to accept booking');
      }
      alert('Booking accepted and physical room numbers allocated!');
      fetchBookings();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error accepting booking');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModalBookingId) return;
    setIsRejecting(true);
    try {
      const res = await fetch(`/api/bookings/${rejectModalBookingId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to reject booking');
      }
      setRejectModalBookingId(null);
      fetchBookings();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error rejecting booking');
    } finally {
      setIsRejecting(false);
    }
  };

  const handleCheckIn = async (bookingId: string) => {
    setActionLoadingId(bookingId);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/check-in`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error);
      fetchBookings();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Check-in failed');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCheckOut = async (bookingId: string) => {
    setActionLoadingId(bookingId);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/check-out`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error);
      fetchBookings();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Check-out failed');
    } finally {
      setActionLoadingId(null);
    }
  };

  const filtered = bookings.filter((b) => {
    if (statusFilter === 'ALL') return true;
    return b.bookingStatus === statusFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Booking Requests & Stays</h1>
          <p className="text-xs text-slate-500 mt-1">
            Review customer requests, atomically allocate physical room numbers, and manage check-ins.
          </p>
        </div>

        {/* Filter pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
          {['ALL', 'PENDING', 'ACCEPTED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED', 'REJECTED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-3" />
          <p className="text-xs text-slate-500">Loading bookings...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300 p-8">
          <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No bookings match this filter</h3>
          <p className="text-xs text-slate-400 mt-1">Incoming customer requests will appear here automatically.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((b) => (
            <div
              key={b._id}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col lg:flex-row justify-between gap-6"
            >
              {/* Left details */}
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-3">
                  <span className="text-base font-black text-indigo-600 tracking-wider">
                    {b.bookingReference}
                  </span>
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
                  <span className="text-xs text-slate-400">
                    Received {new Date(b.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <div className="font-bold text-slate-800 text-sm">{b.guestDetails.fullName}</div>
                    <div className="flex items-center gap-1.5 text-slate-500 mt-0.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{b.guestDetails.email}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500 mt-0.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{b.guestDetails.phone}</span>
                    </div>
                  </div>

                  <div>
                    <div className="font-bold text-slate-800">
                      {b.roomTypeId?.name} ({b.numberOfRooms} room)
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600 mt-0.5">
                      <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                      <span>
                        {new Date(b.checkInDate).toLocaleDateString()} &rarr;{' '}
                        {new Date(b.checkOutDate).toLocaleDateString()} (
                        {b.priceBreakdown.numberOfNights} nights)
                      </span>
                    </div>
                    {b.assignedPhysicalRoomIds && b.assignedPhysicalRoomIds.length > 0 && (
                      <div className="mt-1 flex items-center gap-1 text-emerald-700 font-bold">
                        <DoorOpen className="w-3.5 h-3.5" />
                        <span>
                          Assigned Room(s):{' '}
                          {b.assignedPhysicalRoomIds.map((r) => r.roomNumber).join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {b.guestDetails.specialRequests && (
                  <div className="p-2.5 bg-slate-50 rounded-lg text-xs text-slate-600 border border-slate-100">
                    <span className="font-bold text-slate-700">Special Request:</span>{' '}
                    {b.guestDetails.specialRequests}
                  </div>
                )}

                {b.rejectionReason && (
                  <div className="p-2.5 bg-rose-50 rounded-lg text-xs text-rose-700 border border-rose-100">
                    <span className="font-bold">Rejection Reason:</span> {b.rejectionReason}
                  </div>
                )}
              </div>

              {/* Right: Price & Workflow Action Buttons */}
              <div className="flex flex-col justify-between items-start lg:items-end border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100 shrink-0 min-w-[200px]">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold text-right">
                    Total Amount
                  </div>
                  <div className="text-xl font-black text-slate-900 text-right">
                    ₹{b.priceBreakdown.totalPrice.toLocaleString('en-IN')}
                  </div>
                  <div className="text-right mt-1">
                    <Badge variant={b.paymentStatus === 'PAID' ? 'success' : 'warning'}>
                      Payment: {b.paymentStatus}
                    </Badge>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 flex flex-wrap gap-2 justify-end w-full">
                  {b.bookingStatus === 'PENDING' && (
                    <>
                      <Button
                        variant="success"
                        size="sm"
                        isLoading={actionLoadingId === b._id}
                        onClick={() => handleAccept(b._id)}
                        className="flex items-center gap-1 font-bold shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Accept & Assign</span>
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setRejectModalBookingId(b._id)}
                        className="flex items-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </Button>
                    </>
                  )}

                  {b.bookingStatus === 'ACCEPTED' && (
                    <Button
                      variant="primary"
                      size="sm"
                      isLoading={actionLoadingId === b._id}
                      onClick={() => handleCheckIn(b._id)}
                      className="flex items-center gap-1"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Check In Guest</span>
                    </Button>
                  )}

                  {b.bookingStatus === 'CHECKED_IN' && (
                    <Button
                      variant="secondary"
                      size="sm"
                      isLoading={actionLoadingId === b._id}
                      onClick={() => handleCheckOut(b._id)}
                      className="flex items-center gap-1"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Check Out Guest</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      <Modal
        isOpen={Boolean(rejectModalBookingId)}
        onClose={() => setRejectModalBookingId(null)}
        title="Reject Booking Request"
        description="Provide a clear reason for the customer as to why this booking cannot be accepted."
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Rejection Reason *
            </label>
            <textarea
              rows={3}
              required
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRejectModalBookingId(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              isLoading={isRejecting}
              onClick={handleReject}
            >
              Confirm Rejection
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
