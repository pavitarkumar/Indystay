import React from 'react';
import { Suspense } from 'react';
import { HotelSearchBar } from '@/components/hotels/HotelSearchBar';
import { HotelCard, HotelCardData } from '@/components/hotels/HotelCard';
import { connectToDatabase } from '@/lib/db/connection';
import { Hotel } from '@/models/Hotel';
import { getHotelRoomTypesAvailability } from '@/services/inventory.service';
import { Building2, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{
    city?: string;
    checkIn?: string;
    checkOut?: string;
    guests?: string;
    rooms?: string;
    minPrice?: string;
    maxPrice?: string;
    propertyType?: string;
    sortBy?: string;
  }>;
}

export default async function HotelsSearchPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const city = params.city || '';
  const checkIn = params.checkIn || '';
  const checkOut = params.checkOut || '';
  const guests = parseInt(params.guests || '1', 10);
  const rooms = parseInt(params.rooms || '1', 10);
  const propertyType = params.propertyType || 'ALL';
  const sortBy = params.sortBy || 'recommended';

  const hotels: HotelCardData[] = [];

  try {
    await connectToDatabase();

    const filter: Record<string, unknown> = {
      verificationStatus: 'APPROVED',
      listingStatus: 'PUBLISHED',
    };

    if (city.trim() !== '') {
      filter.$or = [
        { city: { $regex: new RegExp(city.trim(), 'i') } },
        { state: { $regex: new RegExp(city.trim(), 'i') } },
        { locality: { $regex: new RegExp(city.trim(), 'i') } },
        { name: { $regex: new RegExp(city.trim(), 'i') } },
      ];
    }

    if (propertyType !== 'ALL') {
      filter.propertyType = propertyType;
    }

    const rawHotels = await Hotel.find(filter).lean();

    for (const h of rawHotels) {
      let eligibleRooms: any[] = [];
      let roomAvailability: any[] = [];
      try {
        roomAvailability = await getHotelRoomTypesAvailability(h._id, checkIn, checkOut);
        eligibleRooms = roomAvailability.filter(
          (ra) => ra.roomType.maxOccupancy * rooms >= guests
        );
      } catch {
        eligibleRooms = [];
      }

      let isAvailable = true;
      if (checkIn && checkOut && eligibleRooms.length > 0) {
        isAvailable = eligibleRooms.some((ra) => ra.availableRoomsCount >= rooms);
      }

      const prices = (eligibleRooms.length > 0 ? eligibleRooms : roomAvailability).map(
        (ra) => ra.basePrice
      );
      const startingPrice = prices.length > 0 ? Math.min(...prices) : 3500;

      hotels.push({
        _id: h._id.toString(),
        name: h.name,
        slug: h.slug,
        city: h.city,
        state: h.state,
        locality: h.locality,
        propertyType: h.propertyType,
        amenities: h.amenities || [],
        startingPrice,
        coverImage: h.coverImage,
        ratingAverage: h.ratingAverage,
        ratingCount: h.ratingCount,
        isAvailable,
      });
    }
  } catch (err) {
    console.warn('[IndiStay Hotels] Query fallback notice:', err instanceof Error ? err.message : err);
  }

  // Sorting
  if (sortBy === 'price_asc') {
    hotels.sort((a, b) => a.startingPrice - b.startingPrice);
  } else if (sortBy === 'price_desc') {
    hotels.sort((a, b) => b.startingPrice - a.startingPrice);
  } else if (sortBy === 'rating') {
    hotels.sort((a, b) => (b.ratingAverage || 0) - (a.ratingAverage || 0));
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Search bar */}
      <div className="mb-8">
        <HotelSearchBar
          initialCity={city}
          initialCheckIn={checkIn}
          initialCheckOut={checkOut}
          initialGuests={guests}
          initialRooms={rooms}
          compact
        />
      </div>

      {/* Results Header and Quick Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {city ? `Hotels & Stays in ${city}` : 'All Verified Properties'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Found {hotels.length} verified {hotels.length === 1 ? 'property' : 'properties'}
            {checkIn && checkOut && ` for ${checkIn} to ${checkOut}`}
          </p>
        </div>

        {/* Sort & Filter controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-slate-700">Sort:</span>
            <div className="flex gap-2 font-medium">
              <Link
                href={`/hotels?city=${city}&checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}&rooms=${rooms}&sortBy=recommended`}
                className={`hover:text-indigo-600 ${sortBy === 'recommended' ? 'text-indigo-600 font-bold' : ''}`}
              >
                Recommended
              </Link>
              <span>•</span>
              <Link
                href={`/hotels?city=${city}&checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}&rooms=${rooms}&sortBy=price_asc`}
                className={`hover:text-indigo-600 ${sortBy === 'price_asc' ? 'text-indigo-600 font-bold' : ''}`}
              >
                Price (Low &gt; High)
              </Link>
              <span>•</span>
              <Link
                href={`/hotels?city=${city}&checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}&rooms=${rooms}&sortBy=rating`}
                className={`hover:text-indigo-600 ${sortBy === 'rating' ? 'text-indigo-600 font-bold' : ''}`}
              >
                Rating
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Hotels Grid */}
      {hotels.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300 p-8">
          <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-800">No matching stays found</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            Try adjusting your search destination, choosing alternative stay dates, or clearing
            filters.
          </p>
          <div className="mt-6">
            <Link
              href="/hotels"
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-xs"
            >
              Browse All Stays
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {hotels.map((hotel) => (
            <HotelCard
              key={hotel._id}
              hotel={hotel}
              checkIn={checkIn}
              checkOut={checkOut}
              guests={guests}
              rooms={rooms}
            />
          ))}
        </div>
      )}
    </div>
  );
}
