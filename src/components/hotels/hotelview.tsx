import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star, MapPin, Sparkles, Bed } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export interface HotelCardData {
  _id: string;
  name: string;
  slug: string;
  city: string;
  state: string;
  locality: string;
  propertyType: string;
  amenities: string[];
  startingPrice: number;
  coverImage?: {
    url: string;
    alt?: string;
  };
  ratingAverage?: number;
  ratingCount?: number;
  isAvailable?: boolean;
}

interface HotelCardProps {
  hotel: HotelCardData;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  rooms?: number;
}

export function HotelCard({ hotel, checkIn, checkOut, guests, rooms }: HotelCardProps) {
  const queryParams = new URLSearchParams();
  if (checkIn) queryParams.set('checkIn', checkIn);
  if (checkOut) queryParams.set('checkOut', checkOut);
  if (guests) queryParams.set('guests', guests.toString());
  if (rooms) queryParams.set('rooms', rooms.toString());

  const hotelUrl = `/hotel/${hotel.slug}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

  const defaultImg =
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80';
  const imageUrl = hotel.coverImage?.url || defaultImg;

  return (
    <div className="group bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col">
      {/* Hotel Image with Badges */}
      <div className="relative h-56 w-full overflow-hidden bg-slate-100">
        <Image
          src={imageUrl}
          alt={hotel.coverImage?.alt || hotel.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
          <Badge variant="secondary" className="backdrop-blur-xs bg-slate-900/80 text-white font-semibold">
            {hotel.propertyType}
          </Badge>
          {hotel.ratingAverage && hotel.ratingAverage >= 4.7 && (
            <Badge variant="indigo" className="bg-indigo-600 text-white border-transparent flex items-center gap-1 font-semibold">
              <Sparkles className="w-3 h-3" />
              Top Rated
            </Badge>
          )}
        </div>

        {/* Rating badge bottom right */}
        {hotel.ratingAverage && (
          <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-lg shadow-sm flex items-center gap-1.5 border border-slate-100">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span className="text-xs font-bold text-slate-900">{hotel.ratingAverage}</span>
            <span className="text-[10px] text-slate-500">({hotel.ratingCount || 0})</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1.5">
            <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span className="truncate">
              {hotel.locality}, {hotel.city}
            </span>
          </div>

          <Link href={hotelUrl}>
            <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
              {hotel.name}
            </h3>
          </Link>

          {/* Amenities pill preview */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {hotel.amenities.slice(0, 3).map((amenity, i) => (
              <span
                key={i}
                className="text-[11px] bg-slate-50 text-slate-600 px-2 py-0.5 rounded-md border border-slate-100 font-medium"
              >
                {amenity}
              </span>
            ))}
            {hotel.amenities.length > 3 && (
              <span className="text-[10px] text-slate-400 self-center">
                +{hotel.amenities.length - 3} more
              </span>
            )}
          </div>
        </div>

        {/* Pricing and CTA */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
              Starting from
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-extrabold text-slate-900">
                ₹{hotel.startingPrice.toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-slate-500">/ night</span>
            </div>
          </div>

          <Link href={hotelUrl}>
            <Button variant="primary" size="sm">
              View Rooms
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
