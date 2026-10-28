'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
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
  Copy,
  Check,
  ShieldCheck,
  ChevronRight,
  BedDouble,
  Award,
  Star,
  Compass,
  MessageSquare,
  HelpCircle,
  ExternalLink,
  FileText,
  Printer,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoyaltyWheel } from '@/components/loyalty/LoyaltyWheel';
import { BookingVoucherModal } from '@/components/bookings/BookingVoucherModal';

interface BookingItem {
  _id: string;
  bookingReference: string;
  bookingStatus: string;
  paymentStatus?: string;
  checkInDate: string;
  checkOutDate: string;
  numberOfRooms: number;
  adults?: number;
  children?: number;
  priceBreakdown: {
    baseTotal?: number;
    taxesAndFees?: number;
    totalPrice: number;
  };
  advancePaymentAmount?: number;
  balanceDueAtHotel?: number;
  appliedLoyaltyFreeNight?: boolean;
  loyaltyDiscountAmount?: number;
  hotelId: {
    _id?: string;
    name: string;
    city: string;
    slug?: string;
    address?: string;
    locality?: string;
    coverImage?: { url: string };
  };
  roomTypeId: {
    name: string;
    bedConfiguration?: string;
  };
  assignedPhysicalRoomIds?: Array<{
    _id: string;
    roomNumber: string;
    floor: number;
  }>;
  guestDetails?: {
    fullName: string;
    email: string;
    phone: string;
  };
  createdAt?: string;
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

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  createdAt?: string;
}

function BookingsHubContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');

  const [mainTab, setMainTab] = useState<'bookings' | 'royalty'>(
    tabParam === 'royalty' ? 'royalty' : 'bookings'
  );
  const [activeFilter, setActiveFilter] = useState<
    'ALL' | 'PENDING' | 'ACCEPTED' | 'CHECKED_OUT' | 'CANCELLED'
  >('ALL');

  const [user, setUser] = useState<UserProfile | null>(null);
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loyalty, setLoyalty] = useState<LoyaltyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedRef, setCopiedRef] = useState<string | null>(null);
  const [showQaTools, setShowQaTools] = useState(false);
  const [selectedVoucherBooking, setSelectedVoucherBooking] = useState<BookingItem | null>(null);

  // Sync tab with URL
  useEffect(() => {
    if (tabParam === 'royalty') {
      setMainTab('royalty');
    } else if (tabParam === 'bookings') {
      setMainTab('bookings');
    }
  }, [tabParam]);

  const handleTabChange = (newTab: 'bookings' | 'royalty') => {
    setMainTab(newTab);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', newTab);
    router.replace(`/account/bookings?${params.toString()}`, { scroll: false });
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [userRes, bookingsRes, loyaltyRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/bookings'),
        fetch('/api/loyalty'),
      ]);

      if (userRes.ok) {
        const userData = await userRes.json();
        if (userData.success && userData.user) {
          setUser(userData.user);
        }
      }

      if (bookingsRes.ok) {
        const bookingsData = await bookingsRes.json();
        if (bookingsData.success) {
          setBookings(bookingsData.data || []);
        }
      }

      if (loyaltyRes.ok) {
        const loyaltyData = await loyaltyRes.json();
        if (loyaltyData.success) {
          setLoyalty(loyaltyData.data);
        }
      }
    } catch (err) {
      console.error('Failed to load account data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCopyCustomerId = () => {
    if (!user?.id) return;
    const customerCode = `IND-CUST-${user.id.slice(-6).toUpperCase()}`;
    navigator.clipboard.writeText(customerCode);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCopyBookingRef = (ref: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(ref);
    setCopiedRef(ref);
    setTimeout(() => setCopiedRef(null), 2000);
  };

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

  // Filter Bookings
  const filteredBookings = bookings.filter((b) => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'ACCEPTED') {
      return b.bookingStatus === 'ACCEPTED' || b.bookingStatus === 'CHECKED_IN';
    }
    return b.bookingStatus === activeFilter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <Badge variant="warning" className="px-2.5 py-0.5 text-[11px] font-bold">
            Pending Approval
          </Badge>
        );
      case 'ACCEPTED':
        return (
          <Badge variant="success" className="px-2.5 py-0.5 text-[11px] font-bold">
            Confirmed
          </Badge>
        );
      case 'CHECKED_IN':
        return (
          <Badge variant="indigo" className="px-2.5 py-0.5 text-[11px] font-bold">
            Checked In
          </Badge>
        );
      case 'CHECKED_OUT':
        return (
          <Badge variant="default" className="px-2.5 py-0.5 text-[11px] font-bold bg-slate-800 text-white">
            Completed Stay
          </Badge>
        );
      case 'CANCELLED':
        return (
          <Badge variant="destructive" className="px-2.5 py-0.5 text-[11px] font-bold">
            Cancelled
          </Badge>
        );
      default:
        return <Badge className="px-2.5 py-0.5 text-[11px]">{status}</Badge>;
    }
  };

  // Compute stats
  const activeCount = bookings.filter(
    (b) => b.bookingStatus === 'ACCEPTED' || b.bookingStatus === 'CHECKED_IN'
  ).length;
  const completedCount = bookings.filter((b) => b.bookingStatus === 'CHECKED_OUT').length;
  const freeDaysCount = loyalty?.freeNightsAvailable || 0;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Top Header Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-xs font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Verified Member</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200/80 text-xs font-bold">
                  <Crown className="w-3.5 h-3.5 text-amber-600 fill-amber-400" />
                  <span>{loyalty?.tierName || 'Silver Tier'}</span>
                </span>
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Welcome back, {user?.name || 'Valued Guest'}
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Manage your stay reservations, digital keys, and IndiStay 5-Slice Royalty Club rewards.
                </p>
              </div>

              {/* Clickable Customer ID Badge */}
              <div className="pt-1 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyCustomerId}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-100/90 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-xs font-mono font-bold text-slate-800 transition-all cursor-pointer group shadow-2xs"
                  title="Click to copy your unique Customer ID"
                >
                  <span className="text-[11px] font-sans font-bold text-slate-400 uppercase tracking-wider">
                    Customer ID:
                  </span>
                  <span className="text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {user?.id ? `IND-CUST-${user.id.slice(-6).toUpperCase()}` : 'IND-CUST-GUEST'}
                  </span>
                  <span className="ml-1 text-[11px] font-sans font-bold text-indigo-600 flex items-center gap-1">
                    {copiedId ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                        <span className="text-emerald-600 font-bold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600" />
                        <span className="text-slate-500 group-hover:text-indigo-600">Copy</span>
                      </>
                    )}
                  </span>
                </button>
              </div>
            </div>

            {/* Quick Action Button */}
            <div className="flex items-center gap-3 shrink-0">
              <Link href="/hotels">
                <Button
                  variant="primary"
                  size="lg"
                  className="rounded-2xl font-bold shadow-md shadow-indigo-600/20 px-5 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Book New Stay</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Segmented Section Switcher Tabs */}
          <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-2 gap-3 max-w-md">
            <button
              type="button"
              onClick={() => handleTabChange('bookings')}
              className={`p-3 rounded-2xl flex items-center justify-center gap-2.5 text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                mainTab === 'bookings'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 ring-2 ring-indigo-600/20'
                  : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>My Bookings</span>
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full font-black ${
                  mainTab === 'bookings'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {bookings.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('royalty')}
              className={`p-3 rounded-2xl flex items-center justify-center gap-2.5 text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                mainTab === 'royalty'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/25 ring-2 ring-amber-500/30'
                  : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600 hover:text-slate-900'
              }`}
            >
              <Crown className="w-4 h-4 text-amber-500 fill-amber-400" />
              <span>Royalty Club</span>
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full font-black ${
                  mainTab === 'royalty'
                    ? 'bg-slate-950/20 text-slate-950'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {loyalty?.currentSlices || 0}/5
              </span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: MY BOOKINGS SECTION                                                */}
        {/* ========================================================================= */}
        {mainTab === 'bookings' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Quick Stat Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Total Bookings
                </span>
                <div className="text-2xl font-black text-slate-900">{bookings.length}</div>
                <span className="text-[11px] text-slate-500 mt-1 block">Lifetime stays with IndiStay</span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Active &amp; Confirmed
                </span>
                <div className="text-2xl font-black text-indigo-600">{activeCount}</div>
                <span className="text-[11px] text-slate-500 mt-1 block">Upcoming confirmed trips</span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Completed Stays
                </span>
                <div className="text-2xl font-black text-emerald-600">{completedCount}</div>
                <span className="text-[11px] text-slate-500 mt-1 block">Successfully checked out</span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Free Nights Ready
                </span>
                <div className="text-2xl font-black text-amber-500">{freeDaysCount} Day(s)</div>
                <span className="text-[11px] text-amber-700 font-semibold mt-1 block">
                  Royalty vouchers unlocked
                </span>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200/80">
              {[
                { key: 'ALL', label: 'All Stays' },
                { key: 'ACCEPTED', label: 'Confirmed / Active' },
                { key: 'PENDING', label: 'Pending Approval' },
                { key: 'CHECKED_OUT', label: 'Completed' },
                { key: 'CANCELLED', label: 'Cancelled' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveFilter(tab.key as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    activeFilter === tab.key
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/80'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Bookings Content */}
            {loading ? (
              <div className="py-20 text-center bg-white rounded-3xl border border-slate-200 p-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-3" />
                <p className="text-xs text-slate-500 font-medium">Loading your verified bookings...</p>
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-slate-200/90 p-8 shadow-2xs">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-black text-slate-900">No bookings in this category</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Browse handpicked luxury stays, heritage palaces, and beach resorts across India.
                </p>
                <div className="mt-6">
                  <Link href="/hotels">
                    <Button variant="primary" size="sm" className="font-bold rounded-xl px-6">
                      Explore Handpicked Stays
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredBookings.map((b) => (
                  <div
                    key={b._id}
                    className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs hover:shadow-md transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                  >
                    <div className="flex flex-col sm:flex-row items-start gap-5 flex-1 min-w-0">
                      {/* Hotel Thumbnail */}
                      <div className="relative w-full sm:w-28 sm:h-28 h-40 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-slate-100 shadow-2xs">
                        {b.hotelId?.coverImage ? (
                          <Image
                            src={b.hotelId.coverImage.url}
                            alt={b.hotelId.name}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 100vw, 112px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <Building className="w-8 h-8" />
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="space-y-2 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Clickable Booking Reference */}
                          <button
                            type="button"
                            onClick={(e) => handleCopyBookingRef(b.bookingReference, e)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 border border-slate-200 text-xs font-mono font-bold text-slate-800 transition-colors cursor-pointer group"
                            title="Click to copy booking reference"
                          >
                            <span>{b.bookingReference}</span>
                            {copiedRef === b.bookingReference ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3 text-slate-400 group-hover:text-indigo-600" />
                            )}
                          </button>

                          {getStatusBadge(b.bookingStatus)}

                          {b.appliedLoyaltyFreeNight && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-black text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-300">
                              <Crown className="w-3 h-3 text-amber-600 fill-amber-400" />
                              <span>1 Day 100% Free Applied</span>
                            </span>
                          )}
                        </div>

                        <div>
                          <h3 className="text-base font-extrabold text-slate-900 truncate">
                            {b.hotelId?.name}
                          </h3>
                          <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2 mt-0.5">
                            <span className="flex items-center gap-1 font-medium">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              {b.hotelId?.city}
                            </span>
                            <span>•</span>
                            <span className="font-semibold text-slate-700">{b.roomTypeId?.name}</span>
                            <span>•</span>
                            <span>{b.numberOfRooms} Room(s)</span>
                          </div>
                        </div>

                        {/* Dates */}
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-600 pt-0.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {new Date(b.checkInDate).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}{' '}
                            –{' '}
                            {new Date(b.checkOutDate).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>

                        {/* Assigned Room */}
                        {b.assignedPhysicalRoomIds && b.assignedPhysicalRoomIds.length > 0 && (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800">
                            <DoorOpen className="w-3.5 h-3.5 text-emerald-600" />
                            <span>
                              Allocated Room:{' '}
                              {b.assignedPhysicalRoomIds.map((r) => `#${r.roomNumber}`).join(', ')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Pricing & Actions */}
                    <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100 gap-4 shrink-0">
                      <div className="text-left lg:text-right">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                          Total Rate
                        </span>
                        <div className="text-xl font-black text-slate-900">
                          ₹{b.priceBreakdown?.totalPrice?.toLocaleString('en-IN')}
                        </div>
                        {b.loyaltyDiscountAmount && b.loyaltyDiscountAmount > 0 && (
                          <span className="text-[11px] text-emerald-700 font-bold block">
                            Saved ₹{b.loyaltyDiscountAmount.toLocaleString('en-IN')} (Free Night)
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {b.bookingStatus !== 'CANCELLED' && b.bookingStatus !== 'REJECTED' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedVoucherBooking(b)}
                            className="rounded-xl font-bold text-xs flex items-center gap-1.5 border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer shadow-2xs"
                            title="Print or Save Official Stay Voucher"
                          >
                            <FileText className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Voucher</span>
                          </Button>
                        )}

                        <Link href={`/booking/${b._id}`}>
                          <Button
                            variant="primary"
                            size="sm"
                            className="rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs"
                          >
                            <span>Manage Itinerary</span>
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
        )}

        {/* ========================================================================= */}
        {/* TAB 2: ROYALTY CLUB & REWARDS SECTION                                     */}
        {/* ========================================================================= */}
        {mainTab === 'royalty' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Digital Membership Pass Card (Pristine Luxury Light Theme) */}
            <div className="relative rounded-3xl bg-gradient-to-br from-amber-50/70 via-white to-amber-100/40 text-slate-900 p-6 sm:p-8 shadow-xs border-2 border-amber-300/80 overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-amber-200/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-100/20 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-amber-200/70">
                <div className="flex items-center gap-4">
                  <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/25 font-black shrink-0">
                    <Crown className="w-7 h-7 fill-white text-amber-100" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold tracking-widest uppercase text-amber-800">
                        IndiStay Royalty Club
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-200/70 text-amber-900 border border-amber-300 text-[10px] font-black uppercase">
                        {loyalty?.tierName || 'Silver Member'}
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                      {user?.name || 'Valued Member'}
                    </h2>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-left md:text-right bg-white/90 backdrop-blur-xs p-3.5 px-5 rounded-2xl border border-amber-200/80 shadow-2xs">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Free Nights Balance
                    </span>
                    <span className="text-2xl font-black text-emerald-600">
                      {loyalty?.freeNightsAvailable || 0} 100% Free Day(s)
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer Details */}
              <div className="relative z-10 pt-4 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-3">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-500">Customer ID:</span>
                  <button
                    type="button"
                    onClick={handleCopyCustomerId}
                    className="font-mono font-bold text-slate-900 bg-white hover:bg-amber-50 px-2.5 py-1 rounded-lg border border-slate-200 hover:border-amber-300 flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs"
                    title="Click to copy Customer ID"
                  >
                    <span>{user?.id ? `IND-CUST-${user.id.slice(-6).toUpperCase()}` : 'IND-CUST'}</span>
                    {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                  </button>
                </div>
                <div className="flex items-center gap-1.5 font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Active Membership Status</span>
                </div>
                <div className="font-semibold text-slate-500">
                  Reward Rate: <span className="font-black text-amber-800">1 Free Night Every 5 Stays</span>
                </div>
              </div>
            </div>

            {/* The 5-Slice Circular Progress Wheel Hero Showcase */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-10 shadow-xs">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-10">
                {/* Left Information Column */}
                <div className="flex-1 space-y-4 text-center lg:text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-300/80 text-xs font-black uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>The 5-Slice Free Stay Program</span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                    Book 5 Times, Get 1 Day 100% FREE on Any Room!
                  </h2>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xl">
                    Every completed stay at any verified hotel automatically fills <strong>1 slice</strong> of your circular 5-slice wheel. Once all 5 slices are completed, you unlock an instant <strong>100% Free 1-Day Stay Voucher</strong> applicable on any luxury resort, palace, or hotel with zero hidden charges.
                  </p>

                  {/* Slices Milestone Badges */}
                  <div className="grid grid-cols-3 gap-3 pt-2">
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-center lg:text-left">
                      <span className="text-[10px] text-slate-400 uppercase font-extrabold block">
                        Current Slices
                      </span>
                      <span className="text-lg sm:text-xl font-black text-amber-600">
                        {loyalty?.currentSlices || 0} / 5 Slices
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-center lg:text-left">
                      <span className="text-[10px] text-slate-400 uppercase font-extrabold block">
                        Free Days Ready
                      </span>
                      <span className="text-lg sm:text-xl font-black text-emerald-600">
                        {loyalty?.freeNightsAvailable || 0} Ready
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-center lg:text-left">
                      <span className="text-[10px] text-slate-400 uppercase font-extrabold block">
                        Total Stays
                      </span>
                      <span className="text-lg sm:text-xl font-black text-indigo-600">
                        {loyalty?.totalValidStays || bookings.length} Stays
                      </span>
                    </div>
                  </div>

                  {/* Primary CTA */}
                  <div className="pt-3 flex flex-wrap items-center justify-center lg:justify-start gap-3">
                    <Link href="/hotels">
                      <Button
                        variant="primary"
                        size="lg"
                        className="rounded-2xl font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20 px-6 flex items-center gap-2"
                      >
                        <Gift className="w-4 h-4" />
                        <span>
                          {loyalty?.isRewardReady
                            ? 'Redeem 100% Free Stay Voucher Now!'
                            : `Book Stay (${loyalty?.staysNeededForNextReward || 0} more to Free Night)`}
                        </span>
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Right Visual 5-Slice SVG Wheel in Light Theme Container */}
                <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-amber-50/50 via-white to-slate-50 text-slate-900 flex flex-col items-center justify-center shrink-0 shadow-xs border border-amber-200/80">
                  <LoyaltyWheel
                    currentSlices={loyalty?.currentSlices || 0}
                    freeNightsAvailable={loyalty?.freeNightsAvailable || 0}
                    totalValidStays={loyalty?.totalValidStays || 0}
                    size="md"
                  />
                  <span className="text-[11px] font-black text-amber-900 mt-4 tracking-wide uppercase bg-amber-100/90 px-3.5 py-1 rounded-full border border-amber-300">
                    5 Stays = 1 Day 100% Free Room
                  </span>
                </div>
              </div>
            </div>

            {/* Member Privileges & Benefits Grid */}
            <div className="space-y-4">
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                Exclusive Royalty Club Privileges
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Gift className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">100% Free Stay</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Earn a complimentary 24-hour room voucher automatically on every 5th completed stay.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <DoorOpen className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">Priority Room Allocation</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Enjoy priority check-in and access to preferred upper-floor rooms upon availability.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">Direct Hotel Chat</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Chat directly with hotel management before arrival for customized requests and special dining.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">Zero Convenience Fees</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Members never pay extra convenience charges or hidden commissions on direct bookings.
                  </p>
                </div>
              </div>
            </div>

            {/* 3-Step Process Guide (Light Theme) */}
            <div className="bg-white text-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xs border border-slate-200/90">
              <h3 className="text-base sm:text-lg font-black tracking-tight mb-6 text-center text-slate-900">
                How It Works in 3 Simple Steps
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col items-center text-center space-y-2.5 p-4 rounded-2xl bg-slate-50/70 border border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-slate-200/80 text-slate-800 flex items-center justify-center font-black text-sm border border-slate-300/80">
                    1
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">Book &amp; Stay</h4>
                  <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                    Choose from 40+ verified properties across India and complete your stay.
                  </p>
                </div>

                <div className="flex flex-col items-center text-center space-y-2.5 p-4 rounded-2xl bg-slate-50/70 border border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-black text-sm border border-amber-300">
                    2
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">Fill 1 Slice Per Stay</h4>
                  <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                    Your 5-slice wheel automatically advances 1 slice after hotel check-out.
                  </p>
                </div>

                <div className="flex flex-col items-center text-center space-y-2.5 p-4 rounded-2xl bg-amber-50/80 border border-amber-200">
                  <div className="w-10 h-10 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-black text-sm shadow-md shadow-amber-500/20">
                    3
                  </div>
                  <h4 className="text-sm font-bold text-amber-900">Claim 100% Free Room</h4>
                  <p className="text-xs text-slate-600 max-w-xs leading-relaxed">
                    Use your unlocked voucher on any hotel booking for 1 completely free day!
                  </p>
                </div>
              </div>
            </div>

            {/* QA & Developer Testing Simulator (Discreet accordion at bottom) */}
            <div className="pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowQaTools(!showQaTools)}
                className="text-xs font-semibold text-slate-400 hover:text-slate-600 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>⚙️ QA / Testing Simulator</span>
                <span className="text-[10px] text-slate-400">({showQaTools ? 'Hide' : 'Show'})</span>
              </button>

              {showQaTools && (
                <div className="mt-3 p-4 rounded-2xl bg-slate-100 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
                  <div>
                    <span className="font-bold text-slate-800 block">Simulate Completed Stay</span>
                    <span>Test advancing your 5-slice wheel in real-time without completing physical checkouts.</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleSimulateStay}
                    disabled={simulating}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-xs font-bold text-slate-800 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${simulating ? 'animate-spin' : ''}`} />
                    <span>+ Simulate 1 Stay (Demo)</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Official Printable Stay Voucher & Receipt Modal */}
      {selectedVoucherBooking && (
        <BookingVoucherModal
          isOpen={!!selectedVoucherBooking}
          onClose={() => setSelectedVoucherBooking(null)}
          booking={{
            _id: selectedVoucherBooking._id,
            bookingReference: selectedVoucherBooking.bookingReference,
            bookingStatus: selectedVoucherBooking.bookingStatus,
            paymentStatus: selectedVoucherBooking.paymentStatus,
            checkInDate: selectedVoucherBooking.checkInDate,
            checkOutDate: selectedVoucherBooking.checkOutDate,
            numberOfRooms: selectedVoucherBooking.numberOfRooms,
            adults: selectedVoucherBooking.adults || 2,
            children: selectedVoucherBooking.children || 0,
            priceBreakdown: selectedVoucherBooking.priceBreakdown,
            advancePaymentAmount: selectedVoucherBooking.advancePaymentAmount,
            balanceDueAtHotel: selectedVoucherBooking.balanceDueAtHotel,
            appliedLoyaltyFreeNight: selectedVoucherBooking.appliedLoyaltyFreeNight,
            loyaltyDiscountAmount: selectedVoucherBooking.loyaltyDiscountAmount,
            hotel: {
              name: selectedVoucherBooking.hotelId?.name || 'IndiStay Partner Hotel',
              address: selectedVoucherBooking.hotelId?.address,
              locality: selectedVoucherBooking.hotelId?.locality,
              city: selectedVoucherBooking.hotelId?.city || 'India',
            },
            roomType: {
              name: selectedVoucherBooking.roomTypeId?.name || 'Deluxe Room',
              bedConfiguration: selectedVoucherBooking.roomTypeId?.bedConfiguration,
            },
            allocatedRooms:
              selectedVoucherBooking.assignedPhysicalRoomIds?.map((r) => r.roomNumber) || [],
            guest: {
              fullName:
                selectedVoucherBooking.guestDetails?.fullName || user?.name || 'Valued Guest',
              email: selectedVoucherBooking.guestDetails?.email || user?.email || '',
              phone: selectedVoucherBooking.guestDetails?.phone || user?.phone || '',
            },
            createdAt: selectedVoucherBooking.createdAt,
          }}
        />
      )}
    </div>
  );
}

export default function MyBookingsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="text-xs text-slate-400 font-medium">Loading your portal...</div>
        </div>
      }
    >
      <BookingsHubContent />
    </Suspense>
  );
}
