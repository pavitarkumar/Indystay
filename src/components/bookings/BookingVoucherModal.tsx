'use client';

import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import {
  Printer,
  Download,
  X,
  CheckCircle2,
  Building,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  User,
  ShieldCheck,
  DoorOpen,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface BookingVoucherData {
  _id: string;
  bookingReference: string;
  bookingStatus: string;
  paymentStatus?: string;
  checkInDate: string;
  checkOutDate: string;
  numberOfRooms: number;
  adults: number;
  children?: number;
  priceBreakdown: {
    pricePerNight?: number;
    numberOfNights?: number;
    baseTotal?: number;
    taxesAndFees?: number;
    totalPrice: number;
  };
  currency?: string;
  advancePaymentAmount?: number;
  balanceDueAtHotel?: number;
  appliedLoyaltyFreeNight?: boolean;
  loyaltyDiscountAmount?: number;
  hotel: {
    name: string;
    address?: string;
    locality?: string;
    city: string;
    state?: string;
    phone?: string;
    email?: string;
    checkInTime?: string;
    checkOutTime?: string;
  };
  roomType: {
    name: string;
    bedConfiguration?: string;
  };
  allocatedRooms?: string[];
  guest: {
    fullName: string;
    email: string;
    phone: string;
    specialRequests?: string;
  };
  createdAt?: string;
}

interface BookingVoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: BookingVoucherData | null;
}

export function BookingVoucherModal({ isOpen, onClose, booking }: BookingVoucherModalProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  useEffect(() => {
    if (!booking) return;

    // Generate security QR data
    const qrData = `INDISTAY-VOUCHER:${booking.bookingReference}|HOTEL:${booking.hotel.name}|GUEST:${booking.guest.fullName}|CHECKIN:${booking.checkInDate}`;

    QRCode.toDataURL(qrData, {
      width: 130,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => setQrCodeUrl(url))
      .catch((err) => console.error('[IndiStay Voucher] QR generation error:', err));
  }, [booking]);

  if (!isOpen || !booking) return null;

  const handlePrint = () => {
    window.print();
  };

  const nights =
    booking.priceBreakdown?.numberOfNights ||
    Math.max(
      1,
      Math.round(
        (new Date(booking.checkOutDate).getTime() - new Date(booking.checkInDate).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    );

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

  const bookedDate = booking.createdAt
    ? new Date(booking.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-IN');

  const advancePaid =
    typeof booking.advancePaymentAmount === 'number'
      ? booking.advancePaymentAmount
      : booking.paymentStatus === 'PAID'
      ? booking.priceBreakdown.totalPrice
      : Math.round(booking.priceBreakdown.totalPrice * 0.1);

  const balanceDue =
    typeof booking.balanceDueAtHotel === 'number'
      ? booking.balanceDueAtHotel
      : Math.max(0, booking.priceBreakdown.totalPrice - advancePaid);

  return (
    <>
      {/* Print Specific CSS injected directly for 100% reliable print isolation */}
      <style>{`
        @media print {
          /* Hide everything in the document by default */
          body * {
            visibility: hidden !important;
          }

          /* Display only the voucher container and its children */
          #indistay-printable-voucher,
          #indistay-printable-voucher * {
            visibility: visible !important;
          }

          #indistay-printable-voucher {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 16px 24px !important;
            background: #ffffff !important;
            color: #0f172a !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
          }

          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Screen Backdrop Modal */}
      <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-150">
        <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[94vh]">
          {/* Action Bar (Screen Only) */}
          <div className="no-print bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Official Stay Voucher &amp; Invoice
                </h3>
                <p className="text-[11px] text-slate-400">
                  Ref: <span className="font-mono text-indigo-300 font-semibold">{booking.bookingReference}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={handlePrint}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 px-3 py-1.5 shadow-sm cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print / Save PDF</span>
              </Button>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close Voucher"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Printable Voucher Paper Body */}
          <div className="overflow-y-auto p-4 sm:p-8 bg-slate-50/50">
            <div
              id="indistay-printable-voucher"
              className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs text-slate-900 font-sans text-xs leading-relaxed"
            >
              {/* Header: Logo, Title & Reference */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-6 border-b border-slate-200 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-black flex items-center justify-center text-sm shadow-xs">
                      IS
                    </div>
                    <span className="text-lg font-black tracking-tight text-slate-900">
                      Indi<span className="text-indigo-600">Stay</span>
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                      Hospitality Network
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    Verified Stay Confirmation &amp; Tax Receipt
                  </p>
                </div>

                <div className="sm:text-right">
                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Booking Confirmed</span>
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    Booking Ref:{' '}
                    <span className="font-mono font-bold text-slate-900 text-xs">
                      {booking.bookingReference}
                    </span>
                  </div>
                  <div className="text-slate-400 text-[10px]">Issued on: {bookedDate}</div>
                </div>
              </div>

              {/* 2-Column Info: Guest & Hotel */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-5 border-b border-slate-200">
                {/* Guest Details */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Primary Guest Details
                  </div>
                  <div className="font-bold text-sm text-slate-900">{booking.guest.fullName}</div>
                  <div className="text-slate-600 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{booking.guest.phone || 'Phone not provided'}</span>
                  </div>
                  <div className="text-slate-600 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{booking.guest.email}</span>
                  </div>
                  <div className="text-slate-500 text-[11px] pt-0.5">
                    Occupancy: <strong className="text-slate-800">{booking.adults} Adults</strong>
                    {booking.children ? `, ${booking.children} Child(ren)` : ''} • {booking.numberOfRooms} Room(s)
                  </div>
                </div>

                {/* Hotel Details */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Property &amp; Destination
                  </div>
                  <div className="font-bold text-sm text-slate-900">{booking.hotel.name}</div>
                  <div className="text-slate-600 flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>
                      {booking.hotel.address ? `${booking.hotel.address}, ` : ''}
                      {booking.hotel.locality ? `${booking.hotel.locality}, ` : ''}
                      {booking.hotel.city}
                      {booking.hotel.state ? `, ${booking.hotel.state}` : ''}
                    </span>
                  </div>
                  {booking.hotel.phone && (
                    <div className="text-slate-600 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>Hotel Desk: {booking.hotel.phone}</span>
                    </div>
                  )}
                  {booking.hotel.email && (
                    <div className="text-slate-600 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{booking.hotel.email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Stay Itinerary & Room Allocation Box */}
              <div className="my-5 p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Check-In
                  </span>
                  <div className="font-bold text-slate-900 text-xs sm:text-sm">{formattedCheckIn}</div>
                  <div className="text-[11px] text-slate-500">From {booking.hotel.checkInTime || '14:00'}</div>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Check-Out
                  </span>
                  <div className="font-bold text-slate-900 text-xs sm:text-sm">{formattedCheckOut}</div>
                  <div className="text-[11px] text-slate-500">Until {booking.hotel.checkOutTime || '11:00'}</div>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Room Category
                  </span>
                  <div className="font-bold text-slate-900 text-xs">{booking.roomType.name}</div>
                  <div className="text-[11px] text-slate-500">
                    {booking.roomType.bedConfiguration || `${nights} Night(s)`}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Allocated Room
                  </span>
                  {booking.allocatedRooms && booking.allocatedRooms.length > 0 ? (
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 font-bold text-xs">
                      <DoorOpen className="w-3.5 h-3.5 text-emerald-700" />
                      <span>{booking.allocatedRooms.map((r) => `#${r}`).join(', ')}</span>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-600 font-medium">Assigned at check-in</div>
                  )}
                  <div className="text-[10px] text-slate-400 mt-0.5">{nights} Night(s) Stay</div>
                </div>
              </div>

              {/* Financial Breakdown Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden mb-5">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100/80 text-[10px] font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                      <th className="py-2.5 px-3.5">Description</th>
                      <th className="py-2.5 px-3 text-center">Nights</th>
                      <th className="py-2.5 px-3 text-center">Rooms</th>
                      <th className="py-2.5 px-3.5 text-right">Amount (INR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    <tr>
                      <td className="py-2.5 px-3.5 font-medium">
                        {booking.roomType.name} (Base Tariff)
                      </td>
                      <td className="py-2.5 px-3 text-center">{nights}</td>
                      <td className="py-2.5 px-3 text-center">{booking.numberOfRooms}</td>
                      <td className="py-2.5 px-3.5 text-right font-medium">
                        ₹
                        {(
                          booking.priceBreakdown.baseTotal ||
                          booking.priceBreakdown.totalPrice - (booking.priceBreakdown.taxesAndFees || 0)
                        ).toLocaleString('en-IN')}
                      </td>
                    </tr>

                    {booking.appliedLoyaltyFreeNight && (
                      <tr className="bg-amber-50/50 text-amber-900">
                        <td className="py-2 px-3.5 font-medium" colSpan={3}>
                          Royalty Club Free Stay Reward (1 Night 100% Waived)
                        </td>
                        <td className="py-2 px-3.5 text-right font-bold text-emerald-700">
                          -₹{(booking.loyaltyDiscountAmount || 0).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    )}

                    <tr>
                      <td className="py-2 px-3.5 text-slate-600" colSpan={3}>
                        Hospitality Goods &amp; Services Tax (GST 12%)
                      </td>
                      <td className="py-2 px-3.5 text-right font-medium">
                        ₹{(booking.priceBreakdown.taxesAndFees || 0).toLocaleString('en-IN')}
                      </td>
                    </tr>

                    {/* Total Row */}
                    <tr className="bg-slate-50 font-bold text-slate-900 text-xs border-t border-slate-200">
                      <td className="py-2.5 px-3.5" colSpan={3}>
                        Total Booking Value (Inclusive of GST)
                      </td>
                      <td className="py-2.5 px-3.5 text-right text-sm">
                        ₹{booking.priceBreakdown.totalPrice.toLocaleString('en-IN')}
                      </td>
                    </tr>

                    {/* Payment Status Summary */}
                    <tr>
                      <td className="py-2 px-3.5 text-emerald-700 font-semibold" colSpan={3}>
                        Advance Paid (Online Instant Confirmation)
                      </td>
                      <td className="py-2 px-3.5 text-right font-bold text-emerald-700">
                        ₹{advancePaid.toLocaleString('en-IN')}
                      </td>
                    </tr>

                    <tr className="bg-indigo-50/40 text-slate-900 font-bold">
                      <td className="py-2.5 px-3.5" colSpan={3}>
                        Balance Payable at Hotel Check-In
                      </td>
                      <td className="py-2.5 px-3.5 text-right text-xs text-indigo-900">
                        ₹{balanceDue.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* QR Verification & Essential Guidelines */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pt-4 border-t border-slate-200">
                {/* QR Code */}
                {qrCodeUrl && (
                  <div className="shrink-0 text-center">
                    <div className="p-1.5 bg-white border border-slate-200 rounded-xl shadow-2xs inline-block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={qrCodeUrl}
                        alt="Security Check-in QR"
                        className="w-24 h-24 object-contain"
                      />
                    </div>
                    <div className="text-[9px] font-mono text-slate-400 mt-1 uppercase tracking-wider">
                      Desk Check-In QR
                    </div>
                  </div>
                )}

                {/* Important Check-in Notes */}
                <div className="space-y-1.5 text-slate-600 text-[11px] leading-relaxed flex-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-900">
                    Important Guest Guidelines:
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-slate-500">
                    <li>
                      Please present this confirmation voucher and a valid Government Photo ID (Aadhaar, Passport, or DL) at check-in.
                    </li>
                    <li>
                      Balance payment of <strong>₹{balanceDue.toLocaleString('en-IN')}</strong> is due at hotel check-in via Cash, UPI, or Card.
                    </li>
                    <li>
                      Primary guest must be at least 18 years of age. Standard check-in time is {booking.hotel.checkInTime || '14:00'}.
                    </li>
                  </ul>
                </div>
              </div>

              {/* Voucher Footer Note */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-400 gap-2">
                <div>IndiStay Hospitality Technologies Pvt. Ltd. • Computer-generated confirmation voucher.</div>
                <div className="font-mono">Verification Hash: {booking._id.slice(-8).toUpperCase()}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
