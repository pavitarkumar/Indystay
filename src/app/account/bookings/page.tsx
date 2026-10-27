'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Calendar,
  MapPin,
  Clock,
  ArrowRight,
  Building,
  Plus,
  DoorOpen,
  Crown,
  Sparkles,
  Gift,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoyaltyWheel } from '@/components/loyalty/LoyaltyWheel';

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
  appliedLoyaltyFreeNight?: boolean;
  loyaltyDiscountAmount?: number;
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

interface LoyaltyData {
  totalValidStays: number;
  currentSlices: number;
  freeNightsAvailable: number;
  totalRewardsClaimed: number;
  staysNeededForNextReward: number;
  isRewardReady: boolean;
  tierName: string;
}

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loyalty, setLoyalty] = useState<LoyaltyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'ACCEPTED' | 'CHECKED_OUT' | 'CANCELLED'>('ALL');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bookingsRes, loyaltyRes] = await Promise.all([
        fetch('/api/bookings'),
        fetch('/api/loyalty'),
      ]);

      const bookingsData = await bookingsRes.json();
      if (bookingsData.success) {
        setBookings(bookingsData.data || []);
      }

      const loyaltyData = await loyaltyRes.json();
      if (loyaltyData.success) {
        setLoyalty(loyaltyData.data);
      }
    } catch {
      // error handling
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSimulateStay = async () => {
    try {
      setSimulating(true);
      const res = await fetch('/api/loyalty', { method: 'POST' });
      const data = await res.json();
      if (data.success && data.data) {
        setLoyalty(data.data);
      }
    } catch {
      // ignore
    } finally {
      setSimulating(false);
    }
  };

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
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Bookings & Royalty Hub</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track status updates, manage stay itineraries, and monitor your 5-Slice Royalty Club rewards.
          </p>
        </div>
        <Link href="/hotels">
          <Button variant="primary" size="sm" className="flex items-center gap-1.5">
            <Plus className="w-4 h-4" />
            <span>Book New Stay</span>
          </Button>
        </Link>
      </div>

      {/* IndiStay Royalty Club Progress Card (5-Slice Circular Progress Wheel) */}
      <div className="mb-8 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-white p-6 sm:p-8 shadow-xl border border-indigo-900/50 relative overflow-hidden">
        {/* Background Ambient Glows */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
          {/* Left Side: Royalty Information & Status */}
          <div className="flex-1 space-y-4 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-black tracking-wider uppercase">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>IndiStay Royalty Club • {loyalty?.tierName || 'Silver Member'}</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
              Book 5 Times, Get 1 Day FREE on Any Room!
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Every completed stay automatically fills <strong>1 slice</strong> of your circular 5-slice Royalty Wheel.
              Fill all 5 slices to unlock a <strong>100% Free 1-Day Stay Voucher</strong> applicable on ANY luxury resort,
              palace, or villa across India.
            </p>

            {/* Loyalty Milestone Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Current Slices</span>
                <span className="text-lg font-black text-amber-400">
                  {loyalty?.currentSlices || 0} / 5 Slices
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Free Days Ready</span>
                <span className="text-lg font-black text-emerald-400">
                  {loyalty?.freeNightsAvailable || 0} Day(s) Free
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs col-span-2 sm:col-span-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Stays</span>
                <span className="text-lg font-black text-indigo-300">
                  {loyalty?.totalValidStays || bookings.length} Stays
                </span>
              </div>
            </div>

            {/* Action Buttons & Quick Simulator for Testing */}
            <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-3">
              <Link href="/hotels">
                <Button
                  variant="primary"
                  size="sm"
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-lg flex items-center gap-2"
                >
                  <Gift className="w-4 h-4" />
                  <span>
                    {loyalty?.isRewardReady
                      ? 'Redeem 1-Day Free Stay Now!'
                      : `Book Stay (${loyalty?.staysNeededForNextReward || 0} more for Free Day)`}
                  </span>
                </Button>
              </Link>

              {/* Demo button to easily test/simulate 5 slices */}
              <button
                type="button"
                onClick={handleSimulateStay}
                disabled={simulating}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold text-white transition-all cursor-pointer disabled:opacity-50"
                title="Add 1 simulated stay to watch slices fill"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-amber-300 ${simulating ? 'animate-spin' : ''}`} />
                <span>+ Simulate 1 Stay (Demo)</span>
              </button>
            </div>
          </div>

          {/* Right Side: Visual 5-Slice Circular Progress Wheel */}
          <div className="bg-slate-950/60 p-6 rounded-3xl border border-white/10 backdrop-blur-md flex flex-col items-center justify-center shrink-0">
            <LoyaltyWheel
              currentSlices={loyalty?.currentSlices || 0}
              freeNightsAvailable={loyalty?.freeNightsAvailable || 0}
              totalValidStays={loyalty?.totalValidStays || 0}
              size="md"
            />
          </div>
        </div>
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
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-sm transition-shadow flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                  {b.hotelId?.coverImage ? (
                    <Image
                      src={b.hotelId.coverImage.url}
                      alt={b.hotelId.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <Building className="w-6 h-6" />
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-bold text-indigo-600">
                      {b.bookingReference}
                    </span>
                    {getStatusBadge(b.bookingStatus)}
                    {b.appliedLoyaltyFreeNight && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        <Crown className="w-3 h-3 text-amber-500" />
                        <span>1 Day Free Applied</span>
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{b.hotelId?.name}</h3>
                  <div className="text-xs text-slate-500 flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {b.hotelId?.city}
                    </span>
                    <span>•</span>
                    <span>{b.roomTypeId?.name}</span>
                    <span>•</span>
                    <span>{b.numberOfRooms} Room(s)</span>
                  </div>

                  {b.assignedPhysicalRoomIds && b.assignedPhysicalRoomIds.length > 0 && (
                    <div className="pt-1 flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                      <DoorOpen className="w-3.5 h-3.5" />
                      <span>
                        Room Allocated: {b.assignedPhysicalRoomIds.map((r) => `#${r.roomNumber}`).join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-row md:flex-col items-end justify-between w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 gap-2">
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Total Rate</span>
                  <span className="text-base font-black text-slate-900">
                    ₹{b.priceBreakdown?.totalPrice?.toLocaleString('en-IN')}
                  </span>
                  {b.loyaltyDiscountAmount && b.loyaltyDiscountAmount > 0 && (
                    <span className="text-[10px] text-emerald-600 font-semibold block">
                      Saved ₹{b.loyaltyDiscountAmount.toLocaleString('en-IN')} (Free Day)
                    </span>
                  )}
                </div>
                <Link href={`/booking/${b._id}`}>
                  <Button variant="outline" size="sm" className="flex items-center gap-1 text-xs">
                    <span>Manage Itinerary</span>
                    <ArrowRight className="w-3 h-3" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
