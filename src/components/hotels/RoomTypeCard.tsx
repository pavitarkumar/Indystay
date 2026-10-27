'use client';

import React from 'react';
import Image from 'next/image';
import { Bed, Users, Maximize2, Check, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { calculateBookingPrice } from '@/utils/pricing';
import { calculateNights } from '@/utils/date';

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

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:border-indigo-200 transition-all grid grid-cols-1 md:grid-cols-12 gap-0">
      {/* Room Photo */}
      <div className="relative md:col-span-4 h-52 md:h-full min-h-[200px] bg-slate-100">
        <Image
          src={imageUrl}
          alt={roomType.name}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover"
        />
        <div className="absolute top-3 left-3">
          {isAvailable ? (
            <Badge variant="success" className="font-semibold">
              {availableCount} {availableCount === 1 ? 'Room' : 'Rooms'} Available
            </Badge>
          ) : (
            <Badge variant="destructive" className="font-semibold">
              Sold Out for Dates
            </Badge>
          )}
        </div>
      </div>

      {/* Room Details */}
      <div className="p-5 md:col-span-5 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-100">
        <div>
          <h4 className="text-lg font-bold text-slate-900">{roomType.name}</h4>

          <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs text-slate-600">
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
  );
}
