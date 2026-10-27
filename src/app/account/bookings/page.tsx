'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, MapPin, Clock, ArrowRight, Building, Plus, DoorOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface BookingItem {
  _id: string;
  bookingReference: string;
  bookingStatus: string;
  checkInDate: string;
  checkOutDate: string;
  numberOfRooms: number;
  priceBreakdown: {
    totalPrice: number;
  };
  hotelId: {
    name: string;
    city: string;
    coverImage?: { url: string };
  };
  roomTypeId: {
    name: string;
  };
  assignedPhysicalRoomIds?: Array<{
    _id: string;
    roomNumber: string;
    floor: number;
  }>;
}

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'ACCEPTED' | 'CHECKED_OUT' | 'CANCELLED'>('ALL');

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/bookings');
        const data = await res.json();
        if (data.success) {
          setBookings(data.data || []);
        }
      } catch {
        // error handling
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  const filteredBookings = bookings.filter((b) => {
    if (activeTab === 'ALL') return true;
    return b.bookingStatus === activeTab;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="warning">Pending Approval</Badge>;
      case 'ACCEPTED':
        return <Badge variant="success">Confirmed</Badge>;
      case 'CANCELLED':
        return <Badge variant="destructive">Cancelled</Badge>;
      case 'CHECKED_IN':
        return <Badge variant="indigo">Checked In</Badge>;
      case 'CHECKED_OUT':
        return <Badge variant="default">Completed Stay</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Bookings</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track status updates, manage stay itineraries, and download receipts.
          </p>
        </div>
        <Link href="/hotels">
          <Button variant="primary" size="sm" className="flex items-center gap-1.5">
            <Plus className="w-4 h-4" />
            <span>Book New Stay</span>
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-6 border-b border-slate-100 text-xs font-semibold text-slate-600">
        {[
          { key: 'ALL', label: 'All Stays' },
          { key: 'PENDING', label: 'Pending Requests' },
          { key: 'ACCEPTED', label: 'Confirmed' },
          { key: 'CHECKED_OUT', label: 'Completed' },
          { key: 'CANCELLED', label: 'Cancelled' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === tab.key
                ? 'bg-indigo-600 text-white font-bold'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-3" />
          <p className="text-xs text-slate-500">Loading your reservations...</p>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300 p-8">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No bookings in this category</h3>
          <p className="text-xs text-slate-500 mt-1">
            Browse our handpicked luxury properties and submit a booking request.
          </p>
          <div className="mt-5">
            <Link href="/hotels">
              <Button variant="primary" size="sm">
                Explore Stays
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((b) => (
            <div
              key={b._id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-indigo-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                  <Image
                    src={
                      b.hotelId?.coverImage?.url ||
                      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400&q=80'
                    }
                    alt={b.hotelId?.name || 'Hotel'}
                    fill
                    className="object-cover"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-indigo-600">
                      {b.bookingReference}
                    </span>
                    {getStatusBadge(b.bookingStatus)}
                  </div>

                  <h3 className="text-base font-bold text-slate-900">
                    {b.hotelId?.name || 'IndiStay Partner Hotel'}
                  </h3>

                  <div className="text-xs text-slate-500 mt-0.5">
                    {b.roomTypeId?.name} • {b.hotelId?.city}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-600 mt-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {new Date(b.checkInDate).toLocaleDateString()} &rarr;{' '}
                      {new Date(b.checkOutDate).toLocaleDateString()}
                    </span>
                  </div>

                  {b.assignedPhysicalRoomIds && b.assignedPhysicalRoomIds.length > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 mt-2 w-fit">
                      <DoorOpen className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>
                        {b.assignedPhysicalRoomIds
                          .map((r) => `Room #${r.roomNumber} (Floor ${r.floor})`)
                          .join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Total</div>
                  <div className="text-base font-extrabold text-slate-900">
                    ₹{b.priceBreakdown?.totalPrice?.toLocaleString('en-IN')}
                  </div>
                </div>

                <div className="mt-2">
                  <Link href={`/booking/${b._id}`}>
                    <Button variant="outline" size="sm" className="flex items-center gap-1 text-xs">
                      <span>View Details</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
