import React from 'react';
import { notFound } from 'next/navigation';
import { connectToDatabase } from '@/lib/db/connection';
import { Hotel } from '@/models/Hotel';
import { Review } from '@/models/Review';
import { getHotelRoomTypesAvailability } from '@/services/inventory.service';
import { HotelDetailView } from '@/components/hotels/HotelDetailView';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    checkIn?: string;
    checkOut?: string;
    guests?: string;
    rooms?: string;
  }>;
}

export default async function HotelDetailPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sParams = await searchParams;

  let hotel: any = null;
  let roomAvailability: any[] = [];
  let reviews: any[] = [];

  const checkIn = sParams.checkIn;
  const checkOut = sParams.checkOut;
  const guests = parseInt(sParams.guests || '2', 10);
  const rooms = parseInt(sParams.rooms || '1', 10);

  try {
    await connectToDatabase();

    const isObjectId = mongoose.Types.ObjectId.isValid(slug);
    const query = isObjectId ? { _id: slug } : { slug };

    hotel = await Hotel.findOne(query).lean();

    if (hotel) {
      roomAvailability = await getHotelRoomTypesAvailability(
        hotel._id,
        checkIn,
        checkOut
      );

      reviews = await Review.find({ hotelId: hotel._id, status: 'PUBLISHED' })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();
    }
  } catch (err) {
    console.warn('[IndiStay HotelDetail] Database error:', err);
  }

  if (!hotel) {
    notFound();
  }

  const formattedHotel = {
    _id: hotel._id.toString(),
    name: hotel.name,
    slug: hotel.slug,
    description: hotel.description,
    address: hotel.address,
    locality: hotel.locality,
    city: hotel.city,
    state: hotel.state,
    country: hotel.country,
    propertyType: hotel.propertyType,
    amenities: hotel.amenities || [],
    checkInTime: hotel.checkInTime || '14:00',
    checkOutTime: hotel.checkOutTime || '11:00',
    cancellationPolicy: hotel.cancellationPolicy || 'FLEXIBLE',
    contactInformation: {
      phone: hotel.contactInformation?.phone || '',
      email: hotel.contactInformation?.email || '',
    },
    coverImage: hotel.coverImage,
    images: (hotel.images || []).map((img: any) => ({
      url: img.url,
      caption: img.caption,
    })),
    ratingAverage: hotel.ratingAverage,
    ratingCount: hotel.ratingCount,
    roomTypes: roomAvailability.map((ra: any) => ({
      roomType: {
        _id: ra.roomType._id.toString(),
        name: ra.roomType.name,
        bedConfiguration: ra.roomType.bedConfiguration,
        maxAdults: ra.roomType.maxAdults,
        maxChildren: ra.roomType.maxChildren,
        maxOccupancy: ra.roomType.maxOccupancy,
        basePrice: ra.roomType.basePrice,
        currency: ra.roomType.currency || 'INR',
        amenities: ra.roomType.amenities || [],
        sizeSqFt: ra.roomType.sizeSqFt,
        images: (ra.roomType.images || []).map((img: any) => ({
          url: img.url,
          caption: img.caption,
        })),
      },
      totalPhysicalRooms: ra.totalPhysicalRooms,
      availableRoomsCount: ra.availableRoomsCount,
      isAvailable: ra.isAvailable,
      basePrice: ra.basePrice,
    })),
    reviews: reviews.map((r: any) => ({
      _id: r._id.toString(),
      customerName: r.customerName,
      rating: r.rating,
      title: r.title,
      comment: r.comment,
      createdAt: r.createdAt ? (typeof r.createdAt === 'string' ? r.createdAt : r.createdAt.toISOString()) : new Date().toISOString(),
    })),
  };

  return (
    <HotelDetailView
      hotel={formattedHotel}
      initialCheckIn={checkIn}
      initialCheckOut={checkOut}
      initialGuests={guests}
      initialRooms={rooms}
    />
  );
}
