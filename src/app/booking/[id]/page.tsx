'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowLeft,
  CreditCard,
  Building,
  Star,
  DoorOpen,
  FileText,
  Printer,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { BookingVoucherModal } from '@/components/bookings/BookingVoucherModal';

interface BookingDetail {
  _id: string;
  bookingReference: string;
  bookingStatus: string;
  paymentStatus: string;
  checkInDate: string;
  checkOutDate: string;
  adults: number;
  children: number;
  numberOfRooms: number;
  priceBreakdown: {
    pricePerNight: number;
    numberOfNights: number;
    baseTotal: number;
    taxesAndFees: number;
    totalPrice: number;
  };
  currency: string;
  hotelId: {
    _id: string;
    name: string;
    slug: string;
    address: string;
    locality: string;
    city: string;
    contactInformation: { phone: string; email: string };
  };
  roomTypeId: {
    name: string;
    bedConfiguration: string;
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

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('Change of travel schedule');
  const [isCancelling, setIsCancelling] = useState(false);
  const [voucherModalOpen, setVoucherModalOpen] = useState(false);

  // Review modal
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState(false);

  const fetchBooking = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/bookings/${id}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to load booking');
      }
      setBooking(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Booking error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchBooking();
  }, [id]);

  const handleCancel = async () => {
    if (!booking) return;
    setIsCancelling(true);
    try {
      const res = await fetch(`/api/bookings/${booking._id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to cancel booking');
      }
      setCancelModalOpen(false);
      fetchBooking();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Cancellation failed');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking) return;
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hotelId: booking.hotelId._id,
          bookingId: booking._id,
          rating,
          title: reviewTitle,
          comment: reviewComment,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Review failed');
      }
      setReviewSuccess(true);
      setTimeout(() => {
        setReviewModalOpen(false);
        setReviewSuccess(false);
      }, 1500);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Review submission failed');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4" />
        <p className="text-sm text-slate-500">Retrieving booking confirmation...</p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-900">Booking Record Not Found</h3>
        <p className="text-sm text-slate-500 mt-1">{error || 'Please check your booking reference.'}</p>
        <div className="mt-6">
          <Link href="/account/bookings">
            <Button variant="primary">Go to My Bookings</Button>
          </Link>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="warning">Request Pending Approval</Badge>;
      case 'ACCEPTED':
        return <Badge variant="success">Confirmed & Rooms Assigned</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive">Request Rejected</Badge>;
      case 'CANCELLED':
        return <Badge variant="destructive">Booking Cancelled</Badge>;
      case 'CHECKED_IN':
        return <Badge variant="indigo">Guest Checked In</Badge>;
      case 'CHECKED_OUT':
        return <Badge variant="default">Completed Stay</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formattedCheckIn = new Date(booking.checkInDate).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const formattedCheckOut = new Date(booking.checkOutDate).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      {/* Navigation & Title */}
      <div className="mb-6">
        <Link
          href="/account/bookings"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to My Bookings</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Reservation {booking.bookingReference}
              </h1>
              {getStatusBadge(booking.bookingStatus)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Booked on {new Date(booking.createdAt).toLocaleDateString()}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {booking.bookingStatus !== 'CANCELLED' && booking.bookingStatus !== 'REJECTED' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setVoucherModalOpen(true)}
                className="flex items-center gap-1.5 text-xs font-bold border-indigo-200 text-indigo-700 hover:bg-indigo-50/80 cursor-pointer shadow-2xs"
              >
                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                <span>Stay Voucher &amp; Receipt</span>
              </Button>
            )}

            {['PENDING', 'ACCEPTED'].includes(booking.bookingStatus) && (
              <Button variant="outline" size="sm" onClick={() => setCancelModalOpen(true)}>
                Cancel Booking
              </Button>
            )}

            {booking.bookingStatus === 'CHECKED_OUT' && (
              <Button variant="primary" size="sm" onClick={() => setReviewModalOpen(true)}>
                Write Review
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Status banner */}
        <div
          className={`p-4 border-b text-xs flex items-center justify-between ${
            booking.bookingStatus === 'ACCEPTED'
              ? 'bg-emerald-50/80 border-emerald-100 text-emerald-800'
              : booking.bookingStatus === 'PENDING'
              ? 'bg-amber-50/80 border-amber-100 text-amber-800'
              : booking.bookingStatus === 'CANCELLED' || booking.bookingStatus === 'REJECTED'
              ? 'bg-rose-50/80 border-rose-100 text-rose-800'
              : 'bg-slate-50 border-slate-100 text-slate-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {booking.bookingStatus === 'ACCEPTED' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : booking.bookingStatus === 'PENDING' ? (
              <Clock className="w-4 h-4 text-amber-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
            <span className="font-semibold">
              {booking.bookingStatus === 'ACCEPTED'
                ? 'Your reservation is confirmed! The property has allocated your room.'
                : booking.bookingStatus === 'PENDING'
                ? 'Request awaiting Hotel Admin confirmation. We will notify you once accepted.'
                : booking.bookingStatus === 'CANCELLED'
                ? `Booking Cancelled: ${booking.cancellationReason || 'User requested cancellation'}`
                : booking.bookingStatus === 'REJECTED'
                ? `Booking Rejected: ${booking.rejectionReason || 'Unavailable'}`
                : `Status: ${booking.bookingStatus}`}
            </span>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Hotel & Stay Details */}
          <div className="space-y-6">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Property
              </div>
              <Link href={`/hotel/${booking.hotelId.slug}`}>
                <h3 className="text-lg font-bold text-slate-900 hover:text-indigo-600 transition-colors">
                  {booking.hotelId.name}
                </h3>
              </Link>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span>
                  {booking.hotelId.address}, {booking.hotelId.city}
                </span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Room Reserved
                </div>
                <div className="text-sm font-bold text-slate-800">
                  {booking.roomTypeId.name} ({booking.numberOfRooms} room)
                </div>
                <div className="text-xs text-slate-500">{booking.roomTypeId.bedConfiguration}</div>

                {/* Particular Room Number Assigned */}
                {booking.assignedPhysicalRoomIds && booking.assignedPhysicalRoomIds.length > 0 ? (
                  <div className="mt-3 p-2.5 bg-emerald-50 rounded-lg border border-emerald-200 text-xs text-emerald-950 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DoorOpen className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        <strong>Assigned Room:</strong>{' '}
                        {booking.assignedPhysicalRoomIds
                          .map((r) => `Room #${r.roomNumber} (Floor ${r.floor})`)
                          .join(', ')}
                      </span>
                    </div>
                    <Badge variant="success" className="text-[10px] font-bold">
                      Confirmed Room
                    </Badge>
                  </div>
                ) : (
                  <div className="mt-2.5 p-2 bg-slate-100 rounded-lg text-[11px] text-slate-500 flex items-center gap-1.5">
                    <DoorOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Room number allocated upon hotel check-in confirmation.</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-200/60">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Check-In</div>
                  <div className="text-xs font-bold text-slate-900">{formattedCheckIn}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">
                    Check-Out
                  </div>
                  <div className="text-xs font-bold text-slate-900">{formattedCheckOut}</div>
                </div>
              </div>
            </div>

            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Primary Guest Contact
              </div>
              <div className="text-xs text-slate-700 space-y-1">
                <div>
                  <span className="font-semibold">Name:</span> {booking.guestDetails.fullName}
                </div>
                <div>
                  <span className="font-semibold">Email:</span> {booking.guestDetails.email}
                </div>
                <div>
                  <span className="font-semibold">Phone:</span> {booking.guestDetails.phone}
                </div>
                {booking.guestDetails.specialRequests && (
                  <div>
                    <span className="font-semibold">Requests:</span>{' '}
                    {booking.guestDetails.specialRequests}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Pricing Breakdown */}
          <div className="space-y-6">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">
                Confirmed Price Breakdown
              </h4>

              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>
                    ₹{booking.priceBreakdown.pricePerNight.toLocaleString('en-IN')} ×{' '}
                    {booking.priceBreakdown.numberOfNights} nights × {booking.numberOfRooms} room(s)
                  </span>
                  <span className="font-semibold text-slate-900">
                    ₹{booking.priceBreakdown.baseTotal.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>Hospitality Taxes & GST (12%)</span>
                  <span className="font-semibold text-slate-900">
                    ₹{booking.priceBreakdown.taxesAndFees.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-200 flex justify-between items-baseline font-black text-slate-900">
                  <span className="text-sm">Total Confirmed</span>
                  <span className="text-xl text-indigo-600">
                    ₹{booking.priceBreakdown.totalPrice.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                <span>Payment Status:</span>
                <Badge variant={booking.paymentStatus === 'PAID' ? 'success' : 'warning'}>
                  {booking.paymentStatus}
                </Badge>
              </div>
            </div>

            <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 flex items-center gap-3 text-xs text-indigo-900">
              <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0" />
              <span>
                Historical price snapshot protected by IndiStay engine. Rates cannot be altered
                after booking.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Booking Modal */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Cancel Reservation?"
        description="Are you sure you want to cancel this booking? This will immediately release the reserved room."
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Cancellation Reason
            </label>
            <textarea
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setCancelModalOpen(false)}>
              Keep Booking
            </Button>
            <Button
              variant="destructive"
              size="sm"
              isLoading={isCancelling}
              onClick={handleCancel}
            >
              Confirm Cancellation
            </Button>
          </div>
        </div>
      </Modal>

      {/* Review Modal */}
      <Modal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        title="Review Your Stay"
        description={`Share your verified experience at ${booking.hotelId.name}`}
      >
        {reviewSuccess ? (
          <div className="py-6 text-center text-xs text-emerald-700 font-bold">
            Thank you! Your review has been submitted and published.
          </div>
        ) : (
          <form onSubmit={handleReviewSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Your Rating (1 to 5 Stars)
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 cursor-pointer"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Headline / Title
              </label>
              <input
                type="text"
                placeholder="e.g. Beautiful ocean view and great service"
                value={reviewTitle}
                onChange={(e) => setReviewTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Detailed Review *
              </label>
              <textarea
                required
                rows={3}
                placeholder="Describe your room, cleanliness, staff, and overall stay..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setReviewModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Publish Review
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Official Printable Stay Voucher & Receipt Modal */}
      {booking && (
        <BookingVoucherModal
          isOpen={voucherModalOpen}
          onClose={() => setVoucherModalOpen(false)}
          booking={{
            _id: booking._id,
            bookingReference: booking.bookingReference,
            bookingStatus: booking.bookingStatus,
            paymentStatus: booking.paymentStatus,
            checkInDate: booking.checkInDate,
            checkOutDate: booking.checkOutDate,
            numberOfRooms: booking.numberOfRooms,
            adults: booking.adults,
            children: booking.children,
            priceBreakdown: booking.priceBreakdown,
            currency: booking.currency,
            hotel: {
              name: booking.hotelId?.name || 'IndiStay Partner Hotel',
              address: booking.hotelId?.address,
              locality: booking.hotelId?.locality,
              city: booking.hotelId?.city || 'India',
              phone: booking.hotelId?.contactInformation?.phone,
              email: booking.hotelId?.contactInformation?.email,
            },
            roomType: {
              name: booking.roomTypeId?.name || 'Standard Room',
              bedConfiguration: booking.roomTypeId?.bedConfiguration,
            },
            allocatedRooms: booking.assignedPhysicalRoomIds?.map((r) => r.roomNumber) || [],
            guest: {
              fullName: booking.guestDetails?.fullName || 'Valued Guest',
              email: booking.guestDetails?.email || '',
              phone: booking.guestDetails?.phone || '',
              specialRequests: booking.guestDetails?.specialRequests,
            },
            createdAt: booking.createdAt,
          }}
        />
      )}
    </div>
  );
}
