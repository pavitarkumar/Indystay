'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  MapPin,
  Star,
  Check,
  ShieldCheck,
  Clock,
  FileText,
  Calendar,
  Users,
  Building,
  Phone,
  Mail,
  X,
  CreditCard,
  DoorOpen,
  CheckCircle2,
  Bed,
  ChevronLeft,
  ChevronRight,
  Camera,
  Sparkles,
  ArrowLeft,
  ExternalLink,
  Crown,
  Gift,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { RoomTypeCard } from './RoomTypeCard';
import { RealUpiPaymentGateway } from '@/components/payment/RealUpiPaymentGateway';
import { HotelChatWidget } from '@/components/chat/HotelChatWidget';
import { calculateBookingPrice } from '@/utils/pricing';
import { calculateNights } from '@/utils/date';

interface RoomTypeData {
  roomType: {
    _id: string;
    name: string;
    bedConfiguration: string;
    maxAdults: number;
    maxChildren: number;
    maxOccupancy: number;
    basePrice: number;
    currency: string;
    amenities: string[];
    sizeSqFt?: number;
    images?: Array<{ url: string; caption?: string }>;
  };
  totalPhysicalRooms: number;
  availableRoomsCount: number;
  isAvailable: boolean;
  basePrice: number;
}

interface ReviewData {
  _id: string;
  customerName: string;
  rating: number;
  title?: string;
  comment: string;
  createdAt: string;
}

interface HotelDetailViewProps {
  hotel: {
    _id: string;
    name: string;
    slug: string;
    description: string;
    address: string;
    locality: string;
    city: string;
    state: string;
    country: string;
    propertyType: string;
    amenities: string[];
    checkInTime: string;
    checkOutTime: string;
    cancellationPolicy: string;
    contactInformation: {
      phone: string;
      email: string;
    };
    coverImage?: { url: string; alt?: string };
    images: Array<{ url: string; caption?: string }>;
    ratingAverage?: number;
    ratingCount?: number;
    roomTypes: RoomTypeData[];
    reviews: ReviewData[];
  };
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialGuests?: number;
  initialRooms?: number;
}

export function HotelDetailView({
  hotel,
  initialCheckIn = '',
  initialCheckOut = '',
  initialGuests = 2,
  initialRooms = 1,
}: HotelDetailViewProps) {
  const router = useRouter();

  const today = new Date();
  const defCheckIn = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];
  const defCheckOut = new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const [checkIn, setCheckIn] = useState(initialCheckIn || defCheckIn);
  const [checkOut, setCheckOut] = useState(initialCheckOut || defCheckOut);
  const [guests, setGuests] = useState(initialGuests);
  const [rooms, setRooms] = useState(initialRooms);

  // Booking Modal State
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<{
    reference: string;
    id: string;
    roomNumber?: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [currentUser, setCurrentUser] = useState<{ id?: string; name?: string; email?: string; phone?: string; role?: string } | null>(null);

  // Physical room selection state
  const [availableRooms, setAvailableRooms] = useState<
    Array<{
      _id: string;
      roomNumber: string;
      floor: number;
      operationalStatus: string;
      isAvailable: boolean;
      statusMessage: string;
      images?: Array<{ url: string; caption?: string }>;
    }>
  >([]);
  const [selectedPhysicalRoomId, setSelectedPhysicalRoomId] = useState<string | null>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [paymentOption, setPaymentOption] = useState<'ADVANCE_10' | 'FULL_100'>('ADVANCE_10');
  const [paymentReferenceInput, setPaymentReferenceInput] = useState('');
  const [hasOpenedRazorpay, setHasOpenedRazorpay] = useState(false);
  const [loyaltyData, setLoyaltyData] = useState<{
    currentSlices: number;
    freeNightsAvailable: number;
    isRewardReady: boolean;
  } | null>(null);
  const [applyLoyaltyFreeNight, setApplyLoyaltyFreeNight] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryPhotoIndex, setGalleryPhotoIndex] = useState(0);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
        if (d.user) {
          setCurrentUser(d.user);
          setFullName((prev) => prev || d.user.name || '');
          setEmail((prev) => prev || d.user.email || '');
          setPhone((prev) => prev || d.user.phone || '');
        }
      })
      .catch(() => {});

    fetch('/api/loyalty')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data) {
          setLoyaltyData(d.data);
        }
      })
      .catch(() => {});
  }, []);

  const selectedRoomType = hotel.roomTypes.find(
    (rt) => rt.roomType._id === selectedRoomTypeId
  );

  const selectedPhysicalRoom = availableRooms.find(
    (r) => r._id === selectedPhysicalRoomId
  );

  const todayStr = new Date().toISOString().split('T')[0];

  const handleCheckInChange = (newCheckIn: string) => {
    setCheckIn(newCheckIn);
    if (!newCheckIn) return;

    const inDate = new Date(newCheckIn);
    const outDate = new Date(checkOut);
    let targetCheckOut = checkOut;

    if (isNaN(outDate.getTime()) || outDate <= inDate) {
      const nextDay = new Date(inDate.getTime() + 24 * 60 * 60 * 1000);
      targetCheckOut = nextDay.toISOString().split('T')[0];
      setCheckOut(targetCheckOut);
    }

    if (selectedRoomTypeId) {
      fetchRoomAvailability(selectedRoomTypeId, newCheckIn, targetCheckOut);
    }
  };

  const handleCheckOutChange = (newCheckOut: string) => {
    setCheckOut(newCheckOut);
    if (selectedRoomTypeId) {
      fetchRoomAvailability(selectedRoomTypeId, checkIn, newCheckOut);
    }
  };

  // Compute 2-3 photos to show for selected room (or room category fallback)
  const modalPhotos: Array<{ url: string; caption?: string }> = React.useMemo(() => {
    if (selectedPhysicalRoom?.images && selectedPhysicalRoom.images.length > 0) {
      return selectedPhysicalRoom.images;
    }

    if (selectedPhysicalRoom) {
      const numInt = parseInt(selectedPhysicalRoom.roomNumber.replace(/\D/g, ''), 10) || 1;
      const suites = [
        // Suite 0: Modern Executive Suite (1631049 series - 100% matching photoshoot)
        [
          {
            url: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1200&q=80',
            caption: `Room #${selectedPhysicalRoom.roomNumber} - Master King Bed & Ambient Headboard`,
          },
          {
            url: 'https://images.unsplash.com/photo-1631049035182-249067d7618e?auto=format&fit=crop&w=1200&q=80',
            caption: `Room #${selectedPhysicalRoom.roomNumber} - In-Room Executive Lounge & Desk`,
          },
          {
            url: 'https://images.unsplash.com/photo-1631049552240-59c37f38802b?auto=format&fit=crop&w=1200&q=80',
            caption: `Room #${selectedPhysicalRoom.roomNumber} - Ensuite Marble Vanity & Bath`,
          },
        ],
        // Suite 1: Tropical Garden Resort Suite (1582719 series - 100% matching photoshoot)
        [
          {
            url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
            caption: `Room #${selectedPhysicalRoom.roomNumber} - King Bed with Garden Terrace Access`,
          },
          {
            url: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80',
            caption: `Room #${selectedPhysicalRoom.roomNumber} - Private Outdoor Verandah & Daybed`,
          },
          {
            url: 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?auto=format&fit=crop&w=1200&q=80',
            caption: `Room #${selectedPhysicalRoom.roomNumber} - Open-Air Stone Bath & Vanity`,
          },
        ],
        // Suite 2: Scandinavian Boutique Suite (1616486 series - 100% matching photoshoot)
        [
          {
            url: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=80',
            caption: `Room #${selectedPhysicalRoom.roomNumber} - Upholstered King Bed & Sconces`,
          },
          {
            url: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1200&q=80',
            caption: `Room #${selectedPhysicalRoom.roomNumber} - Bedside Dressing Area & Mirror`,
          },
          {
            url: 'https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=1200&q=80',
            caption: `Room #${selectedPhysicalRoom.roomNumber} - In-Suite Linen Seating & Study`,
          },
        ],
        // Suite 3: Architectural Designer Suite (1600585 series - 100% matching photoshoot)
        [
          {
            url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
            caption: `Room #${selectedPhysicalRoom.roomNumber} - Designer Suite Bed & Mood Lighting`,
          },
          {
            url: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80',
            caption: `Room #${selectedPhysicalRoom.roomNumber} - Private Glass Balcony Terrace`,
          },
          {
            url: 'https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?auto=format&fit=crop&w=1200&q=80',
            caption: `Room #${selectedPhysicalRoom.roomNumber} - Ensuite Polished Marble Vanity`,
          },
        ],
        // Suite 4: Warm Amber Wood Suite (1590490 series - 100% matching photoshoot)
        [
          {
            url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
            caption: `Room #${selectedPhysicalRoom.roomNumber} - Warm Wood Bed & Backlit Headboard`,
          },
          {
            url: 'https://images.unsplash.com/photo-1590490359854-dfba19688d70?auto=format&fit=crop&w=1200&q=80',
            caption: `Room #${selectedPhysicalRoom.roomNumber} - Matching Wood Study & Lounge`,
          },
          {
            url: 'https://images.unsplash.com/photo-1631049552057-403cdb8f0658?auto=format&fit=crop&w=1200&q=80',
            caption: `Room #${selectedPhysicalRoom.roomNumber} - Bedside Ambient Sconces & Nightstand`,
          },
        ],
      ];
      return suites[numInt % suites.length];
    }

    if (selectedRoomType?.roomType.images && selectedRoomType.roomType.images.length > 0) {
      return selectedRoomType.roomType.images;
    }

    return [
      {
        url: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1200&q=80',
        caption: 'Master Bed & Ambient Headboard',
      },
      {
        url: 'https://images.unsplash.com/photo-1631049035182-249067d7618e?auto=format&fit=crop&w=1200&q=80',
        caption: 'In-Room Executive Lounge & Desk',
      },
      {
        url: 'https://images.unsplash.com/photo-1631049552240-59c37f38802b?auto=format&fit=crop&w=1200&q=80',
        caption: 'Ensuite Marble Vanity & Bath',
      },
    ];
  }, [selectedPhysicalRoom, selectedRoomType]);

  const nights = calculateNights(checkIn, checkOut);
  const pricing = selectedRoomType
    ? calculateBookingPrice(
        selectedRoomType.roomType.basePrice,
        nights,
        rooms,
        checkIn,
        applyLoyaltyFreeNight
      )
    : null;

  const fetchRoomAvailability = async (
    rtId: string,
    cIn: string = checkIn,
    cOut: string = checkOut
  ) => {
    try {
      setLoadingRooms(true);
      const res = await fetch(
        `/api/availability?hotelId=${hotel._id}&roomTypeId=${rtId}&checkInDate=${cIn}&checkOutDate=${cOut}&rooms=${rooms}`
      );
      const data = await res.json();
      if (data.success && data.data?.rooms) {
        setAvailableRooms(data.data.rooms);
      } else {
        setAvailableRooms([]);
      }
    } catch {
      setAvailableRooms([]);
    } finally {
      setLoadingRooms(false);
    }
  };

  const handleOpenBooking = (roomTypeId: string) => {
    setSelectedRoomTypeId(roomTypeId);
    setSelectedPhysicalRoomId(null);
    setActivePhotoIndex(0);
    setErrorMsg('');
    setPaymentOption('ADVANCE_10');
    setPaymentReferenceInput('');
    setHasOpenedRazorpay(false);
    setApplyLoyaltyFreeNight(false);
    if (currentUser) {
      if (!fullName && currentUser.name) setFullName(currentUser.name);
      if (!email && currentUser.email) setEmail(currentUser.email);
      if (!phone && currentUser.phone) setPhone(currentUser.phone);
    }
    fetchRoomAvailability(roomTypeId);
  };

  const executeBookingApi = async (paymentRef: string) => {
    try {
      const isFreeStay = pricing && pricing.totalPrice === 0;
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hotelId: hotel._id,
          roomTypeId: selectedRoomTypeId,
          selectedPhysicalRoomId: selectedPhysicalRoomId || undefined,
          checkInDate: checkIn,
          checkOutDate: checkOut,
          adults: guests,
          children: 0,
          numberOfRooms: rooms,
          paymentType: paymentOption,
          paymentReference: paymentRef || (isFreeStay ? 'ROYALTY_FREE_DAY' : `UPI_${Date.now().toString(36).toUpperCase()}`),
          applyLoyaltyFreeNight,
          guestDetails: {
            fullName,
            email,
            phone,
            specialRequests,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        if (res.status === 401) {
          router.push(`/auth/login?redirect=/hotel/${hotel.slug}`);
          return { success: false, error: 'Please login to complete your booking.' };
        }
        return { success: false, error: data.error || 'Failed to submit booking request' };
      }

      const assignedRoom = availableRooms.find((r) => r._id === selectedPhysicalRoomId);
      return {
        success: true,
        reference: data.data.bookingReference,
        id: data.data._id,
        roomNumber: assignedRoom?.roomNumber,
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Network error during booking.' };
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoomTypeId) return;

    if (!fullName.trim() || !email.trim() || !phone.trim()) {
      setErrorMsg('Please enter your primary guest Name, Email, and Phone number.');
      return;
    }

    const isFreeStay = pricing && pricing.totalPrice === 0;

    // 1. If 100% Free Stay covered by Royalty Club reward, book directly!
    if (isFreeStay) {
      setIsSubmitting(true);
      setErrorMsg('');
      const res = await executeBookingApi('ROYALTY_FREE_DAY');
      setIsSubmitting(false);
      if (res.success && res.reference && res.id) {
        setBookingSuccess({
          reference: res.reference,
          id: res.id,
          roomNumber: res.roomNumber,
        });
      } else {
        setErrorMsg(res.error || 'Failed to confirm free stay reservation.');
      }
      return;
    }

    // 2. Real Payment Gateway with 5-Minute Timer & Auto Verification
    setErrorMsg('');
    setIsPaymentModalOpen(true);
  };

  const allImages = [
    ...(hotel.coverImage ? [hotel.coverImage.url] : []),
    ...(hotel.images?.map((img) => img.url) || []),
  ];

  const fullGallery = [
    ...(hotel.coverImage
      ? [{ url: hotel.coverImage.url, caption: hotel.coverImage.alt || `${hotel.name} - Exterior Architecture` }]
      : []),
    ...(hotel.images?.map((img) => ({
      url: img.url,
      caption: img.caption || `${hotel.name} - Luxury Showcase`,
    })) || []),
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Back Navigation Bar */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/hotels"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-indigo-600 bg-white hover:bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs hover:border-indigo-300 transition-all cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1 text-slate-500 group-hover:text-indigo-600" />
          <span>Back to All Hotels</span>
        </Link>
        <span className="text-xs text-slate-400 hidden sm:inline">
          Hotels / {hotel.city} / <span className="text-slate-600 font-medium">{hotel.name}</span>
        </span>
      </div>

      {/* Title & Location Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between pb-6 gap-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="indigo" className="font-semibold">
              {hotel.propertyType}
            </Badge>
            <div className="flex items-center gap-1 text-xs font-bold text-slate-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{hotel.ratingAverage || 4.8}</span>
              <span className="text-slate-400">({hotel.ratingCount || 0} reviews)</span>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Verified Stay</span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            {hotel.name}
          </h1>

          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 mt-2">
            <MapPin className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              {hotel.address}, {hotel.locality}, {hotel.city}, {hotel.state}
            </span>
          </div>
        </div>

        {/* Quick Contact snippet */}
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
            <Phone className="w-3.5 h-3.5 text-indigo-600" />
            <span>{hotel.contactInformation.phone}</span>
          </div>
        </div>
      </div>

      {/* Image Gallery Showcase */}
      <div className="relative mt-6 rounded-2xl overflow-hidden shadow-sm group">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 h-[320px] sm:h-[440px]">
          <div
            onClick={() => {
              setGalleryPhotoIndex(0);
              setIsGalleryOpen(true);
            }}
            className="relative md:col-span-2 h-full bg-slate-100 cursor-pointer overflow-hidden"
          >
            <Image
              src={
                allImages[0] ||
                'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80'
              }
              alt={hotel.name}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-black/10 hover:bg-transparent transition-colors" />
          </div>
          <div className="hidden md:grid md:col-span-2 grid-cols-2 gap-3 h-full">
            {allImages.slice(1, 5).map((imgUrl, i) => (
              <div
                key={i}
                onClick={() => {
                  setGalleryPhotoIndex(i + 1);
                  setIsGalleryOpen(true);
                }}
                className="relative h-full bg-slate-100 overflow-hidden cursor-pointer"
              >
                <Image
                  src={imgUrl}
                  alt={`${hotel.name} gallery ${i + 1}`}
                  fill
                  sizes="25vw"
                  className="object-cover hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/10 hover:bg-transparent transition-colors" />
              </div>
            ))}
          </div>
        </div>

        {/* View All Photos Button */}
        <button
          type="button"
          onClick={() => {
            setGalleryPhotoIndex(0);
            setIsGalleryOpen(true);
          }}
          className="absolute bottom-4 right-4 z-10 flex items-center gap-2 px-4 py-2.5 bg-white/95 hover:bg-white text-slate-800 text-xs font-bold rounded-xl shadow-lg hover:shadow-xl backdrop-blur-md border border-slate-200 transition-all transform hover:scale-105 cursor-pointer"
        >
          <Camera className="w-4 h-4 text-indigo-600" />
          <span>View All Photos ({fullGallery.length})</span>
        </button>
      </div>

      {/* Full Luxury Hotel Photo Gallery Lightbox */}
      {isGalleryOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col justify-between p-4 sm:p-6 animate-in fade-in duration-200">
          {/* Top Bar */}
          <div className="flex items-center justify-between text-white pb-3 border-b border-white/10">
            <div>
              <h3 className="font-extrabold text-base sm:text-lg tracking-tight text-white">
                {hotel.name}
              </h3>
              <p className="text-xs text-slate-300 font-medium">
                Photo {galleryPhotoIndex + 1} of {fullGallery.length} • {fullGallery[galleryPhotoIndex]?.caption}
              </p>
            </div>
            <button
              onClick={() => setIsGalleryOpen(false)}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              aria-label="Close Gallery"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Main Full-Size Image & Arrows */}
          <div className="relative flex-1 flex items-center justify-center my-4 min-h-[300px]">
            <button
              onClick={() =>
                setGalleryPhotoIndex((prev) => (prev === 0 ? fullGallery.length - 1 : prev - 1))
              }
              className="absolute left-2 sm:left-4 z-20 p-3 rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur-md transition-all cursor-pointer"
              aria-label="Previous photo"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <div className="relative w-full max-w-5xl h-full max-h-[70vh] rounded-2xl overflow-hidden shadow-2xl">
              <Image
                src={fullGallery[galleryPhotoIndex]?.url || allImages[0]}
                alt={fullGallery[galleryPhotoIndex]?.caption || hotel.name}
                fill
                priority
                className="object-contain"
                sizes="(max-width: 1280px) 100vw, 1280px"
              />
            </div>

            <button
              onClick={() =>
                setGalleryPhotoIndex((prev) => (prev === fullGallery.length - 1 ? 0 : prev + 1))
              }
              className="absolute right-2 sm:right-4 z-20 p-3 rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur-md transition-all cursor-pointer"
              aria-label="Next photo"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Bottom Thumbnails Strip */}
          <div className="flex items-center justify-center gap-2 overflow-x-auto py-2 px-2 max-w-4xl mx-auto scrollbar-none">
            {fullGallery.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setGalleryPhotoIndex(idx)}
                className={`relative w-16 h-12 sm:w-20 sm:h-14 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                  idx === galleryPhotoIndex
                    ? 'border-indigo-500 scale-105 shadow-md shadow-indigo-500/30'
                    : 'border-white/20 opacity-60 hover:opacity-100'
                }`}
              >
                <Image src={img.url} alt={img.caption || ''} fill sizes="80px" className="object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Stay Date & Occupancy Selector Bar */}
      <div className="mt-8 bg-white rounded-2xl p-4 shadow-md border border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
        <div className="bg-slate-50/70 p-2.5 rounded-xl border border-slate-100 hover:border-indigo-200 transition-colors">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
            <span>Check-In Date</span>
          </label>
          <input
            type="date"
            min={todayStr}
            value={checkIn}
            onChange={(e) => handleCheckInChange(e.target.value)}
            className="w-full text-sm font-bold text-slate-900 bg-transparent focus:outline-none mt-1 cursor-pointer"
          />
        </div>
        <div className="bg-slate-50/70 p-2.5 rounded-xl border border-slate-100 hover:border-indigo-200 transition-colors">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
            <span>Check-Out Date</span>
          </label>
          <input
            type="date"
            min={checkIn || todayStr}
            value={checkOut}
            onChange={(e) => handleCheckOutChange(e.target.value)}
            className="w-full text-sm font-bold text-slate-900 bg-transparent focus:outline-none mt-1 cursor-pointer"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Guests & Rooms
          </label>
          <div className="flex gap-3 mt-1">
            <select
              value={guests}
              onChange={(e) => setGuests(Number(e.target.value))}
              className="text-sm font-semibold text-slate-900 bg-transparent focus:outline-none cursor-pointer"
            >
              {[1, 2, 3, 4, 6, 8].map((g) => (
                <option key={g} value={g}>
                  {g} {g === 1 ? 'Guest' : 'Guests'}
                </option>
              ))}
            </select>
            <span className="text-slate-300">•</span>
            <select
              value={rooms}
              onChange={(e) => setRooms(Number(e.target.value))}
              className="text-sm font-semibold text-slate-900 bg-transparent focus:outline-none cursor-pointer"
            >
              {[1, 2, 3, 4].map((r) => (
                <option key={r} value={r}>
                  {r} {r === 1 ? 'Room' : 'Rooms'}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-500">Duration</div>
          <div className="text-sm font-bold text-indigo-600">{nights} Night(s) Stay</div>
        </div>
      </div>

      {/* Main Content & Sidebar Layout */}
      <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left Column: Overview, Rooms, Policies */}
        <div className="lg:col-span-2 space-y-10">
          {/* Overview */}
          <section className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs">
            <h2 className="text-lg font-bold text-slate-900 mb-3">About this Property</h2>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {hotel.description}
            </p>

            {/* Amenities Grid */}
            <div className="mt-6 pt-6 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                Property Amenities & Services
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {hotel.amenities.map((amenity, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-700">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Room Types & Live Availability */}
          <section id="rooms">
            <div className="mb-4">
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
                Accommodation Options
              </span>
              <h2 className="text-xl font-bold text-slate-900 mt-1">Available Room Types</h2>
              <p className="text-xs text-slate-500">
                Live availability and exact prices calculated for {checkIn} to {checkOut} ({nights}{' '}
                nights).
              </p>
            </div>

            <div className="space-y-4">
              {hotel.roomTypes.map((rt) => (
                <RoomTypeCard
                  key={rt.roomType._id}
                  roomType={rt.roomType}
                  availableCount={rt.availableRoomsCount}
                  isAvailable={rt.isAvailable}
                  checkIn={checkIn}
                  checkOut={checkOut}
                  roomsCount={rooms}
                  onBook={handleOpenBooking}
                />
              ))}
            </div>
          </section>

          {/* Customer Reviews */}
          <section className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Guest Reviews</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verified reviews from completed stays.
                </p>
              </div>
              <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="text-sm font-bold text-slate-900">{hotel.ratingAverage || 4.8}</span>
                <span className="text-xs text-slate-500">/ 5.0</span>
              </div>
            </div>

            {hotel.reviews.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">
                No reviews published yet for this property.
              </p>
            ) : (
              <div className="space-y-4 divide-y divide-slate-100">
                {hotel.reviews.map((r) => (
                  <div key={r._id} className="pt-4 first:pt-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-800">{r.customerName}</span>
                      <div className="flex gap-0.5 text-amber-400">
                        {[...Array(r.rating)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                        ))}
                      </div>
                    </div>
                    {r.title && <h5 className="text-xs font-semibold text-slate-900">{r.title}</h5>}
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{r.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Policies & Quick Info Card */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs space-y-5">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-3 border-b border-slate-100">
              Hotel Policies & Timings
            </h3>

            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-slate-800">Check-In / Check-Out</div>
                <div className="text-xs text-slate-600 mt-0.5">
                  Check-in from <span className="font-semibold">{hotel.checkInTime}</span>
                </div>
                <div className="text-xs text-slate-600">
                  Check-out until <span className="font-semibold">{hotel.checkOutTime}</span>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-slate-800">Cancellation Terms</div>
                <div className="text-xs text-slate-600 mt-0.5">
                  Policy: <Badge variant="secondary">{hotel.cancellationPolicy}</Badge>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Free cancellation subject to operational deadlines.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-slate-800">IndiStay Protection</div>
                <div className="text-xs text-slate-600 mt-0.5">
                  Your reservation is backed by direct hotel manager verification and real-time room
                  allocation.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Submission Modal */}
      <Modal
        isOpen={Boolean(selectedRoomTypeId)}
        onClose={() => {
          setSelectedRoomTypeId(null);
          setBookingSuccess(null);
        }}
        title={bookingSuccess ? 'Booking Request Submitted!' : 'Complete Your Booking Request'}
        description={
          bookingSuccess
            ? 'The hotel administrator will review your reservation request shortly.'
            : `Confirm reservation details for ${hotel.name}`
        }
        maxWidth="xl"
      >
        {bookingSuccess ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-7 h-7" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                Booking Reference
              </div>
              <div className="text-2xl font-black text-indigo-600 tracking-wider">
                {bookingSuccess.reference}
              </div>
              {bookingSuccess.roomNumber && (
                <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Reserved Room: #{bookingSuccess.roomNumber}</span>
                </div>
              )}
            </div>
            <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
              We have forwarded your booking request to the property manager. You can track status
              updates in your <strong>My Bookings</strong> dashboard.
            </p>
            <div className="pt-4 flex gap-3 justify-center">
              <Button
                variant="primary"
                onClick={() => router.push(`/booking/${bookingSuccess.id}`)}
              >
                View Booking Status
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedRoomTypeId(null);
                  setBookingSuccess(null);
                }}
              >
                Close
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleBookingSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                {errorMsg}
              </div>
            )}

            {/* Room Image & Overview Banner with 2-3 Photos Gallery & Interactive Thumbnails */}
            {selectedRoomType && (
              <div className="space-y-2">
                <div className="relative h-52 sm:h-60 w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 shadow-md group">
                  <Image
                    key={modalPhotos[activePhotoIndex]?.url || activePhotoIndex}
                    src={
                      modalPhotos[activePhotoIndex]?.url ||
                      'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80'
                    }
                    alt={modalPhotos[activePhotoIndex]?.caption || selectedRoomType.roomType.name}
                    fill
                    className="object-cover transition-all duration-300"
                  />

                  {/* Carousel Left / Right Arrow Controls */}
                  {modalPhotos.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActivePhotoIndex((prev) => (prev === 0 ? modalPhotos.length - 1 : prev - 1));
                        }}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center backdrop-blur-xs transition-colors cursor-pointer z-10"
                        title="Previous photo"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActivePhotoIndex((prev) => (prev === modalPhotos.length - 1 ? 0 : prev + 1));
                        }}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center backdrop-blur-xs transition-colors cursor-pointer z-10"
                        title="Next photo"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}

                  {/* Top Bar Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
                    {selectedPhysicalRoom ? (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider bg-emerald-600/95 text-white px-3 py-1 rounded-full shadow-md backdrop-blur-md animate-in fade-in">
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>Room #{selectedPhysicalRoom.roomNumber} (Floor {selectedPhysicalRoom.floor}) Photos</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider bg-indigo-600/90 text-white px-3 py-1 rounded-full shadow-md backdrop-blur-md">
                        <span>Selected Room Category</span>
                      </span>
                    )}

                    {modalPhotos.length > 1 && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-black/65 text-white px-2.5 py-0.5 rounded-full backdrop-blur-md">
                        <Camera className="w-3 h-3 text-indigo-300" />
                        <span>{activePhotoIndex + 1} / {modalPhotos.length}</span>
                      </span>
                    )}
                  </div>

                  {/* Bottom Gradient Overlay with Room Details */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent p-4 text-white">
                    <h4 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                      <span>{selectedRoomType.roomType.name}</span>
                      {selectedPhysicalRoom && (
                        <span className="text-xs font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-md border border-emerald-400/40">
                          Unit #{selectedPhysicalRoom.roomNumber}
                        </span>
                      )}
                    </h4>
                    {modalPhotos[activePhotoIndex]?.caption && (
                      <p className="text-xs text-amber-200/90 mt-0.5 font-medium flex items-center gap-1">
                        <span>• {modalPhotos[activePhotoIndex]?.caption}</span>
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-slate-300 mt-1">
                      <span className="flex items-center gap-1">
                        <Bed className="w-3.5 h-3.5 text-indigo-300" />
                        {selectedRoomType.roomType.bedConfiguration}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-indigo-300" />
                        Up to {selectedRoomType.roomType.maxOccupancy} Guests
                      </span>
                      {selectedRoomType.roomType.sizeSqFt && (
                        <>
                          <span>•</span>
                          <span>{selectedRoomType.roomType.sizeSqFt} sq. ft</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3 Clickable Matching Perspectives of this Room */}
                {modalPhotos.length > 1 && (
                  <div className="grid grid-cols-3 gap-2">
                    {modalPhotos.map((photo, idx) => {
                      const isActive = idx === activePhotoIndex;
                      const areaLabels = ['1. Bed Area', '2. Room Lounge', '3. Bath & Vanity'];
                      const label = areaLabels[idx] || `View ${idx + 1}`;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActivePhotoIndex(idx)}
                          className={`relative h-14 sm:h-16 rounded-xl overflow-hidden border-2 transition-all cursor-pointer text-left group ${
                            isActive
                              ? 'border-indigo-600 ring-2 ring-indigo-500/30 shadow-xs'
                              : 'border-slate-200 hover:border-indigo-300 opacity-75 hover:opacity-100'
                          }`}
                        >
                          <Image
                            src={photo.url}
                            alt={photo.caption || `Photo ${idx + 1}`}
                            fill
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/40 to-transparent flex flex-col justify-end p-1.5">
                            <span className="text-[10px] font-extrabold text-white truncate drop-shadow-xs">
                              {label}
                            </span>
                            <span className="text-[8px] text-slate-300 truncate">
                              {photo.caption?.split('-').pop()?.trim()}
                            </span>
                          </div>
                          {isActive && (
                            <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-white" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Royalty Free Stay Voucher Card (5/5 Slices Reward) */}
            {loyaltyData && (loyaltyData.isRewardReady || loyaltyData.freeNightsAvailable > 0) && selectedRoomType && (
              <div className="p-3.5 bg-gradient-to-r from-amber-500/15 via-amber-50 to-amber-100/70 rounded-2xl border-2 border-amber-300 text-xs shadow-2xs space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start sm:items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                      👑
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-amber-950 text-xs sm:text-sm">
                          1-Day Free Room Stay Available!
                        </span>
                        <span className="text-[10px] font-extrabold text-amber-800 bg-amber-200/90 px-2 py-0.2 rounded-full border border-amber-300">
                          Royalty Reward
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-800 mt-0.5">
                        You collected 5 slices! Apply now to get <strong>1 Night Base Room Charges 100% FREE</strong> (Saves ₹{selectedRoomType.roomType.basePrice.toLocaleString('en-IN')}).
                      </p>
                    </div>
                  </div>

                  <label className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer shrink-0 self-start sm:self-auto ${
                    applyLoyaltyFreeNight
                      ? 'bg-amber-600 text-white ring-2 ring-amber-400'
                      : 'bg-white hover:bg-amber-100 text-amber-900 border border-amber-300'
                  }`}>
                    <input
                      type="checkbox"
                      checked={applyLoyaltyFreeNight}
                      onChange={(e) => setApplyLoyaltyFreeNight(e.target.checked)}
                      className="rounded text-amber-600 focus:ring-0 w-4 h-4 cursor-pointer"
                    />
                    <span>{applyLoyaltyFreeNight ? 'Free Day Applied ✓' : 'Apply 1-Day Free'}</span>
                  </label>
                </div>

                {applyLoyaltyFreeNight && (
                  <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] text-emerald-800 font-semibold flex items-center gap-2 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Royalty Reward Applied! 1 Night (₹{selectedRoomType.roomType.basePrice.toLocaleString('en-IN')}) is 100% Free on this booking.
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Physical Room Selection & Availability Grid */}
            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div>
                  <label className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                    <DoorOpen className="w-4 h-4 text-indigo-600" />
                    <span>Select Room Number</span>
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Choose your preferred room, or let the system auto-assign the best available room.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-semibold">
                  <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Available ({availableRooms.filter((r) => r.isAvailable).length})
                  </span>
                  <span className="flex items-center gap-1 text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    Booked ({availableRooms.filter((r) => !r.isAvailable).length})
                  </span>
                </div>
              </div>

              {loadingRooms ? (
                <div className="py-6 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2">
                  <Clock className="w-5 h-5 animate-spin text-indigo-600" />
                  <span>Checking real-time room availability for selected dates...</span>
                </div>
              ) : availableRooms.length === 0 ? (
                <div className="p-3 bg-white rounded-xl border border-slate-200 text-center text-xs text-slate-500">
                  No physical room numbers mapped. Your room will be allocated at the front desk upon check-in.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {/* Auto Assign Option */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPhysicalRoomId(null);
                      setActivePhotoIndex(0);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedPhysicalRoomId === null
                        ? 'bg-indigo-50 border-indigo-600 ring-2 ring-indigo-500/20 text-indigo-950 font-bold'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span>Auto-Assign</span>
                      {selectedPhysicalRoomId === null && (
                        <Check className="w-3.5 h-3.5 text-indigo-600" />
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">Best room chosen</div>
                  </button>

                  {/* Individual Physical Rooms */}
                  {availableRooms.map((r) => {
                    const isSelected = selectedPhysicalRoomId === r._id;
                    return (
                      <button
                        key={r._id}
                        type="button"
                        disabled={!r.isAvailable}
                        onClick={() => {
                          setSelectedPhysicalRoomId(r._id);
                          setActivePhotoIndex(0);
                        }}
                        title={r.statusMessage}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          !r.isAvailable
                            ? 'bg-slate-100/90 border-slate-200 text-slate-400 opacity-60 cursor-not-allowed'
                            : isSelected
                            ? 'bg-indigo-50 border-indigo-600 ring-2 ring-indigo-500/20 text-indigo-950 font-bold cursor-pointer shadow-xs'
                            : 'bg-white border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/20 text-slate-800 cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className={!r.isAvailable ? 'line-through' : 'font-extrabold'}>
                            Room #{r.roomNumber}
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                        </div>
                        <div className="flex items-center justify-between mt-1 text-[10px]">
                          <span className="text-slate-500">Floor {r.floor}</span>
                          {r.isAvailable ? (
                            <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200/60">
                              Free
                            </span>
                          ) : (
                            <span className="text-rose-600 font-semibold bg-rose-50 px-1 py-0.2 rounded">
                              Booked
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {selectedPhysicalRoomId && (
                <div className="p-2.5 bg-indigo-50 text-indigo-900 rounded-xl border border-indigo-200 text-xs flex items-center justify-between animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>
                      Selected{' '}
                      <strong>
                        Room #{availableRooms.find((r) => r._id === selectedPhysicalRoomId)?.roomNumber}
                      </strong>{' '}
                      (Floor{' '}
                      {availableRooms.find((r) => r._id === selectedPhysicalRoomId)?.floor}) for your stay.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPhysicalRoomId(null);
                      setActivePhotoIndex(0);
                    }}
                    className="text-[11px] font-semibold text-indigo-600 hover:underline cursor-pointer"
                  >
                    Change
                  </button>
                </div>
              )}
            </div>

            {/* Stay Summary Card with Live Date Change Picker & Full Day-Wise + GST Breakdown */}
            {selectedRoomType && pricing && (
              <div className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200/90 text-xs space-y-3 shadow-2xs">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/70">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">
                      Reservation Dates & Charges
                    </span>
                    <div className="font-extrabold text-slate-900 text-sm sm:text-base">
                      {selectedRoomType.roomType.name}
                    </div>
                  </div>
                  <Badge variant="indigo" className="font-bold text-xs px-2.5 py-0.5">
                    {nights} Night{nights > 1 ? 's' : ''} • {rooms} Room{rooms > 1 ? 's' : ''}
                  </Badge>
                </div>

                {/* Direct in-modal date modification */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 hover:border-indigo-300 transition-colors shadow-2xs">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-indigo-600" />
                      <span>Check-In</span>
                    </label>
                    <input
                      type="date"
                      min={todayStr}
                      value={checkIn}
                      onChange={(e) => handleCheckInChange(e.target.value)}
                      className="w-full text-xs font-bold text-slate-900 bg-transparent focus:outline-none cursor-pointer"
                    />
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 hover:border-indigo-300 transition-colors shadow-2xs">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-indigo-600" />
                      <span>Check-Out</span>
                    </label>
                    <input
                      type="date"
                      min={checkIn || todayStr}
                      value={checkOut}
                      onChange={(e) => handleCheckOutChange(e.target.value)}
                      className="w-full text-xs font-bold text-slate-900 bg-transparent focus:outline-none cursor-pointer"
                    />
                  </div>
                </div>

                {/* Day-Wise (Night-by-Night) Itemized Calculation Box */}
                <div className="bg-white rounded-xl border border-slate-200/90 p-3 space-y-2">
                  <div className="flex items-center justify-between text-slate-800 font-bold text-[11px] pb-1.5 border-b border-slate-100">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Day-Wise Nightly Stay Calculation</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      ₹{selectedRoomType.roomType.basePrice.toLocaleString('en-IN')}/night
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-0.5">
                    {pricing.dailyBreakdown.map((item) => (
                      <div
                        key={item.nightIndex}
                        className={`flex items-center justify-between text-[11px] transition-colors ${
                          item.isLoyaltyFreeNight
                            ? 'bg-amber-50 p-1.5 rounded-lg border border-amber-200 text-amber-900 font-bold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <span className={`w-4 h-4 rounded-full font-bold text-[9px] flex items-center justify-center shrink-0 ${
                            item.isLoyaltyFreeNight ? 'bg-amber-500 text-slate-950' : 'bg-indigo-50 text-indigo-700'
                          }`}>
                            {item.isLoyaltyFreeNight ? '👑' : item.nightIndex}
                          </span>
                          <span className="font-medium">{item.formattedDate}</span>
                          {item.isLoyaltyFreeNight && (
                            <span className="text-[10px] text-amber-800 font-extrabold bg-amber-200/90 px-1.5 rounded">
                              100% FREE (Royalty Club)
                            </span>
                          )}
                        </span>
                        <span className="font-semibold text-slate-800">
                          {item.isLoyaltyFreeNight ? (
                            <span className="text-emerald-700 font-black">
                              FREE (₹0)
                            </span>
                          ) : (
                            <>
                              ₹{item.pricePerNight.toLocaleString('en-IN')}
                              {rooms > 1 && (
                                <span className="text-[10px] text-slate-400 font-normal">
                                  {' '}× {rooms} = ₹{item.amount.toLocaleString('en-IN')}
                                </span>
                              )}
                            </>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>

                  {pricing.loyaltyDiscountAmount > 0 && (
                    <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
                      <span className="font-bold text-amber-800 flex items-center gap-1">
                        <Crown className="w-3.5 h-3.5 text-amber-500" />
                        <span>Royalty 1-Day Free Discount:</span>
                      </span>
                      <span className="font-extrabold text-emerald-600">
                        - ₹{pricing.loyaltyDiscountAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700">
                      Base Room Charges ({nights} Night{nights > 1 ? 's' : ''}{rooms > 1 ? ` × ${rooms} Rooms` : ''}):
                    </span>
                    <span className="font-extrabold text-slate-900">
                      ₹{pricing.discountedBaseTotal.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* GST & Fee Breakdown Card */}
                <div className="bg-indigo-50/50 rounded-xl border border-indigo-100/80 p-3 space-y-1.5 text-[11px]">
                  <div className="text-[10px] font-bold text-indigo-900 uppercase tracking-wider flex items-center justify-between">
                    <span>Taxes & GST Invoice Breakdown</span>
                    <span className="text-indigo-600 font-bold">Standard 12% Hotel GST</span>
                  </div>

                  <div className="flex justify-between text-slate-600 pt-1">
                    <span>Central GST (CGST @ 6%):</span>
                    <span className="font-semibold text-slate-800">₹{pricing.cgstAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>State GST (SGST @ 6%):</span>
                    <span className="font-semibold text-slate-800">₹{pricing.sgstAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>IndiStay Platform & Convenience Fee:</span>
                    <span className="font-bold text-emerald-600">FREE (₹0)</span>
                  </div>

                  <div className="pt-2 mt-1 border-t border-indigo-200/60 flex justify-between items-center text-xs">
                    <span className="font-extrabold text-slate-900">Total Taxes & GST:</span>
                    <span className="font-extrabold text-indigo-700">
                      + ₹{pricing.taxesAndFees.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Grand Total Box */}
                <div className="p-3 bg-gradient-to-r from-slate-900 to-indigo-950 rounded-xl text-white flex justify-between items-center shadow-xs">
                  <div>
                    <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider block">
                      Total Payable Amount
                    </span>
                    <span className="text-[11px] text-slate-300">
                      Room Base Charges + 12% GST
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg sm:text-xl font-black text-white">
                      ₹{pricing.totalPrice.toLocaleString('en-IN')}
                    </div>
                    <span className="text-[9px] text-emerald-300 font-semibold flex items-center justify-end gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Guaranteed Rate
                    </span>
                  </div>
                </div>
              </div>
            )}

            {currentUser ? (
              <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-800 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>
                  Booking with your account: <strong>{currentUser.name}</strong> ({currentUser.email})
                </span>
              </div>
            ) : (
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center justify-between">
                <span>Fast Guest Checkout • Instant confirmation</span>
                <Link
                  href={`/auth/login?redirect=/hotel/${hotel.slug}`}
                  className="text-indigo-600 font-bold hover:underline"
                >
                  Sign In instead
                </Link>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Primary Guest Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Rahul Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="rahul.sharma@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contact Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Special Requests (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Quiet room preferred, early check-in inquiry"
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Razorpay Advance Payment Section or 100% Free Stay Covered by Royalty */}
            {pricing && (
              pricing.totalPrice === 0 ? (
                <div className="p-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100/70 border-2 border-emerald-300 rounded-2xl text-xs space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                        👑
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                          Royalty Free Day Reward
                        </span>
                        <h4 className="text-xs font-black text-emerald-950">
                          100% Free Room Stay Voucher
                        </h4>
                      </div>
                    </div>
                    <span className="text-xs font-black text-emerald-800 bg-white px-3 py-1 rounded-xl border border-emerald-200 shadow-2xs">
                      ₹0 Due (100% Free)
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    Zero payment required! Your stay is fully covered by your 5-Slice Royalty Club reward. Submit your request below to receive your instant reservation reference.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Option selector: 10% Token Deposit vs 100% Full Payment */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentOption('ADVANCE_10')}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        paymentOption === 'ADVANCE_10'
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black">Pay 10% Token</span>
                        {paymentOption === 'ADVANCE_10' && <Check className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <div className={`text-xs font-black mt-0.5 ${paymentOption === 'ADVANCE_10' ? 'text-white' : 'text-indigo-600'}`}>
                        ₹{Math.round(pricing.totalPrice * 0.10).toLocaleString('en-IN')}
                      </div>
                      <div className={`text-[9px] mt-0.5 ${paymentOption === 'ADVANCE_10' ? 'text-indigo-100' : 'text-slate-400'}`}>
                        Balance ₹{(pricing.totalPrice - Math.round(pricing.totalPrice * 0.10)).toLocaleString('en-IN')} at hotel
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentOption('FULL_100')}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        paymentOption === 'FULL_100'
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black">Pay 100% Full</span>
                        {paymentOption === 'FULL_100' && <Check className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <div className={`text-xs font-black mt-0.5 ${paymentOption === 'FULL_100' ? 'text-white' : 'text-indigo-600'}`}>
                        ₹{pricing.totalPrice.toLocaleString('en-IN')}
                      </div>
                      <div className={`text-[9px] mt-0.5 ${paymentOption === 'FULL_100' ? 'text-indigo-100' : 'text-slate-400'}`}>
                        Zero due at check-in
                      </div>
                    </button>
                  </div>

                  {/* Payment Overview Card */}
                  <div className="p-3 bg-gradient-to-r from-indigo-50/80 via-slate-50 to-indigo-50/50 border border-indigo-100 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                        ⚡
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">
                          {paymentOption === 'ADVANCE_10' ? '10% Token Advance' : '100% Full Payment'}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          NPCI UPI QR Scanner • 5-min live session • Auto-verified
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-black text-indigo-700 bg-white px-2.5 py-1 rounded-lg border border-indigo-200 shrink-0">
                      ₹{(paymentOption === 'ADVANCE_10' ? Math.round(pricing.totalPrice * 0.10) : pricing.totalPrice).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              )
            )}

            {pricing && (
              <div className="p-3 bg-slate-50 border border-slate-200/90 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">
                    Final Billing Summary
                  </span>
                  <span className="text-slate-700 font-medium">
                    {nights} night{nights > 1 ? 's' : ''} stay • ₹{pricing.baseTotal.toLocaleString('en-IN')} + ₹{pricing.taxesAndFees.toLocaleString('en-IN')} GST
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-base font-black text-indigo-600">
                    ₹{pricing.totalPrice.toLocaleString('en-IN')}
                  </div>
                  <span className="text-[10px] text-emerald-600 font-semibold">All Taxes Included</span>
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Instant UPI QR payment with 5-min timer</span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedRoomTypeId(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
                  {pricing && pricing.totalPrice === 0
                    ? 'Confirm 100% Free Stay'
                    : `Proceed to Pay ₹${(paymentOption === 'ADVANCE_10' ? Math.round(pricing?.totalPrice ? pricing.totalPrice * 0.10 : 0) : (pricing?.totalPrice || 0)).toLocaleString('en-IN')} ➔`}
                </Button>
              </div>
            </div>
          </form>
        )}
      </Modal>

      {/* Dedicated Real UPI Payment Gateway with 5-Minute Timer & Auto-Verification */}
      {pricing && pricing.totalPrice > 0 && selectedRoomType && (
        <RealUpiPaymentGateway
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          amount={paymentOption === 'ADVANCE_10' ? Math.round(pricing.totalPrice * 0.10) : pricing.totalPrice}
          totalPrice={pricing.totalPrice}
          paymentType={paymentOption}
          hotelName={hotel.name}
          hotelCity={hotel.city}
          roomTypeName={selectedRoomType.roomType.name}
          roomNumber={selectedPhysicalRoom?.roomNumber}
          nights={nights}
          checkIn={checkIn}
          checkOut={checkOut}
          guestName={fullName || 'Valued Guest'}
          guestEmail={email || ''}
          guestPhone={phone || ''}
          onConfirmBooking={(paymentRef: string) => executeBookingApi(paymentRef)}
          onSuccess={(data) => {
            setIsPaymentModalOpen(false);
            setBookingSuccess({
              reference: data.reference,
              id: data.id,
              roomNumber: data.roomNumber,
            });
          }}
        />
      )}

      {/* Direct Hotel Chat Widget */}
      <HotelChatWidget
        hotelId={hotel._id}
        hotelName={hotel.name}
        user={currentUser ? { id: currentUser.id || '', name: currentUser.name || 'Guest', role: currentUser.role } : null}
      />
    </div>
  );
}
