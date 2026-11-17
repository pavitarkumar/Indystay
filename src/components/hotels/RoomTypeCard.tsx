'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import {
  Bed,
  Users,
  Maximize2,
  Check,
  Eye,
  Box,
  Camera,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { calculateBookingPrice } from '@/utils/pricing';
import { calculateNights } from '@/utils/date';
import type { PanoramaScene } from '@/components/viewers/Panorama360Viewer';

// Dynamic imports — heavy 3D viewers load strictly on demand
const Panorama360Viewer = dynamic(() => import('@/components/viewers/Panorama360Viewer'), {
  ssr: false,
});
const Room3DViewer = dynamic(() => import('@/components/viewers/Room3DViewer'), {
  ssr: false,
});
import { ViewerErrorBoundary } from '@/components/viewers/ViewerErrorBoundary';

interface RoomTypeCardProps {
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
    panoramas?: PanoramaScene[];
    model3d?: {
      url: string;
      thumbnailUrl?: string;
      description?: string;
      themeStyle?: string;
    };
  };
  availableCount: number;
  isAvailable: boolean;
  checkIn?: string;
  checkOut?: string;
  roomsCount?: number;
  onBook: (roomTypeId: string) => void;
}

export function RoomTypeCard({
  roomType,
  availableCount,
  isAvailable,
  checkIn,
  checkOut,
  roomsCount = 1,
  onBook,
}: RoomTypeCardProps) {
  const nights = checkIn && checkOut ? calculateNights(checkIn, checkOut) : 1;
  const pricing = calculateBookingPrice(roomType.basePrice, nights, roomsCount, checkIn);

  const defaultImg =
    'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80';
  const imageUrl = roomType.images?.[0]?.url || defaultImg;
  const roomImages = roomType.images && roomType.images.length > 0
    ? roomType.images
    : [{ url: imageUrl, caption: roomType.name }];

  const hasPanorama = !!(roomType.panoramas && roomType.panoramas.length > 0);
  const has3D = !!(roomType.model3d?.url);

  const [show360, setShow360] = useState(false);
  const [show3D, setShow3D] = useState(false);
  const [showPhotos, setShowPhotos] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:border-indigo-200 transition-all grid grid-cols-1 md:grid-cols-12 gap-0">
        {/* Room Photo */}
        <div className="relative md:col-span-4 h-56 md:h-full min-h-[220px] bg-slate-100 group">
          <Image
            src={imageUrl}
            alt={roomType.name}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover"
          />

          <div className="absolute top-3 left-3">
            {isAvailable ? (
              <Badge variant="success" className="font-semibold shadow-xs">
                {availableCount} {availableCount === 1 ? 'Room' : 'Rooms'} Available
              </Badge>
            ) : (
              <Badge variant="destructive" className="font-semibold shadow-xs">
                Sold Out for Dates
              </Badge>
            )}
          </div>

          {/* Quick interactive badges on image bottom */}
          <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-1.5 z-10">
            {hasPanorama && (
              <button
                type="button"
                onClick={() => setShow360(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600/90 hover:bg-indigo-600 backdrop-blur-md text-white text-[11px] font-bold rounded-lg border border-indigo-400/30 transition-all shadow-md cursor-pointer hover:scale-105"
                title="Open 360° Virtual Tour"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>360° Tour</span>
              </button>
            )}
            {has3D && (
              <button
                type="button"
                onClick={() => setShow3D(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-violet-600/90 hover:bg-violet-600 backdrop-blur-md text-white text-[11px] font-bold rounded-lg border border-violet-400/30 transition-all shadow-md cursor-pointer hover:scale-105"
                title="Open Interactive 3D View"
              >
                <Box className="w-3.5 h-3.5" />
                <span>3D View</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setPhotoIndex(0);
                setShowPhotos(true);
              }}
              className="flex items-center gap-1 px-2 py-1.5 bg-black/60 hover:bg-black/80 backdrop-blur-md text-white text-[11px] font-semibold rounded-lg border border-white/20 transition-all shadow-md cursor-pointer"
              title="View room photos"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>{roomImages.length}</span>
            </button>
          </div>
        </div>

        {/* Room Details */}
        <div className="p-5 md:col-span-5 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-100">
          <div>
            <h4 className="text-lg font-bold text-slate-900">{roomType.name}</h4>

            <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs text-slate-600">
              <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                <Bed className="w-3.5 h-3.5 text-indigo-600" />
                <span>{roomType.bedConfiguration}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                <Users className="w-3.5 h-3.5 text-indigo-600" />
                <span>Up to {roomType.maxOccupancy} Guests</span>
              </div>
              {roomType.sizeSqFt && (
                <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                  <Maximize2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{roomType.sizeSqFt} sq. ft</span>
                </div>
              )}
            </div>

            {/* Amenities checklist */}
            <div className="mt-4 grid grid-cols-2 gap-1.5">
              {roomType.amenities.slice(0, 6).map((amenity, idx) => (
                <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-600">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate">{amenity}</span>
                </div>
              ))}
            </div>

            {/* Interactive Experience Action Bar */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
              {hasPanorama && (
                <button
                  type="button"
                  onClick={() => setShow360(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 transition-colors cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Explore in 360°</span>
                  {roomType.panoramas && roomType.panoramas.length > 1 && (
                    <span className="bg-indigo-200 text-indigo-800 px-1.5 py-0.2 rounded-full text-[10px]">
                      {roomType.panoramas.length} scenes
                    </span>
                  )}
                </button>
              )}

              {has3D && (
                <button
                  type="button"
                  onClick={() => setShow3D(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 hover:bg-violet-100 text-violet-700 text-xs font-bold rounded-xl border border-violet-200 transition-colors cursor-pointer"
                >
                  <Box className="w-3.5 h-3.5" />
                  <span>View in 3D</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setPhotoIndex(0);
                  setShowPhotos(true);
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5 text-slate-500" />
                <span>View Photos</span>
              </button>
            </div>
          </div>

          <div className="mt-4 text-[11px] text-slate-400">
            * Direct reservation backed by manager room inventory & 12% GST invoice.
          </div>
        </div>

        {/* Pricing & Booking Action */}
        <div className="p-5 md:col-span-3 flex flex-col justify-between bg-slate-50/50">
          <div>
            <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
              Price Breakdown
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-black text-slate-900">
                ₹{roomType.basePrice.toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-slate-500">/ night</span>
            </div>

            <div className="mt-2 text-xs text-slate-500 space-y-1 border-t border-slate-200/60 pt-2">
              <div className="flex justify-between">
                <span>
                  {nights} night{nights > 1 ? 's' : ''} × {roomsCount} room{roomsCount > 1 ? 's' : ''}
                </span>
                <span className="font-semibold text-slate-700">₹{pricing.baseTotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Taxes & GST (12%)</span>
                <span className="font-semibold text-slate-700">+ ₹{pricing.taxesAndFees.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 pt-1.5 text-sm border-t border-slate-200">
                <span>Estimated Total</span>
                <span className="text-indigo-600 font-black">₹{pricing.totalPrice.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          <div className="mt-5">
            <Button
              onClick={() => onBook(roomType._id)}
              disabled={!isAvailable || availableCount < roomsCount}
              variant={isAvailable ? 'primary' : 'outline'}
              className="w-full font-bold shadow-sm"
            >
              {isAvailable ? 'Reserve Room' : 'Unavailable'}
            </Button>
          </div>
        </div>
      </div>

      {/* ── 360° Virtual Tour Viewer ── */}
      {show360 && (
        <ViewerErrorBoundary
          title={`${roomType.name} — 360° Virtual Tour`}
          onClose={() => setShow360(false)}
        >
          <Panorama360Viewer
            scenes={roomType.panoramas}
            roomName={roomType.name}
            onClose={() => setShow360(false)}
          />
        </ViewerErrorBoundary>
      )}

      {/* ── 3D Interactive Room Model Viewer ── */}
      {show3D && (
        <ViewerErrorBoundary
          title={`${roomType.name} — 3D Suite`}
          onClose={() => setShow3D(false)}
        >
          <Room3DViewer
            modelUrl={roomType.model3d?.url || '/models/luxury-armchair.glb'}
            roomName={roomType.name}
            description={roomType.model3d?.description || 'Interactive 3D Suite Visualization'}
            themeStyle={roomType.model3d?.themeStyle as any}
            onClose={() => setShow3D(false)}
          />
        </ViewerErrorBoundary>
      )}

      {/* ── Room Photos Lightbox with Direct Tour Switcher ── */}
      {showPhotos && roomImages.length > 0 && (
        <div className="fixed inset-0 z-[65] bg-black/95 backdrop-blur-xl flex flex-col justify-between p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-white pb-3 border-b border-white/10">
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-white">
                {roomType.name} — Photos
              </h3>
              <p className="text-xs text-slate-300">
                Photo {photoIndex + 1} of {roomImages.length}
              </p>
            </div>
            <button
              onClick={() => setShowPhotos(false)}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="relative flex-1 flex items-center justify-center my-4 min-h-[300px]">
            {roomImages.length > 1 && (
              <button
                onClick={() => setPhotoIndex((prev) => (prev === 0 ? roomImages.length - 1 : prev - 1))}
                className="absolute left-2 sm:left-4 z-20 p-3 rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur-md cursor-pointer"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            <div className="relative w-full max-w-4xl h-full max-h-[70vh] rounded-2xl overflow-hidden shadow-2xl">
              <Image
                src={roomImages[photoIndex].url}
                alt={roomImages[photoIndex].caption || roomType.name}
                fill
                priority
                className="object-contain"
                sizes="(max-width: 1280px) 100vw, 1200px"
              />
            </div>

            {roomImages.length > 1 && (
              <button
                onClick={() => setPhotoIndex((prev) => (prev === roomImages.length - 1 ? 0 : prev + 1))}
                className="absolute right-2 sm:right-4 z-20 p-3 rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur-md cursor-pointer"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Quick switcher buttons inside photo gallery */}
          <div className="flex items-center justify-center gap-3 py-2">
            {hasPanorama && (
              <button
                onClick={() => {
                  setShowPhotos(false);
                  setShow360(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                Switch to 360° Tour
              </button>
            )}
            {has3D && (
              <button
                onClick={() => {
                  setShowPhotos(false);
                  setShow3D(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
              >
                <Box className="w-4 h-4" />
                Switch to 3D View
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
