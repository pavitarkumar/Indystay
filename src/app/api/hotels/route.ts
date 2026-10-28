import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connection';
import { Hotel } from '@/models/Hotel';
import { RoomType } from '@/models/RoomType';
import { User } from '@/models/User';
import { getSession } from '@/lib/auth/session';
import { requireRole } from '@/lib/auth/rbac';
import { createHotelSchema, searchHotelsSchema } from '@/lib/validation/hotel.schema';
import { getHotelRoomTypesAvailability } from '@/services/inventory.service';
import { buildLocationSearchFilter, rankHotelsBySearchRelevance } from '@/lib/search/locationFilter';
import { normalizeDateString } from '@/utils/date';
import { createNotification } from '@/lib/notifications/notification.service';
import { createAuditLog } from '@/lib/audit/audit.service';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);

    const queryObj = Object.fromEntries(searchParams.entries());
    const parsed = searchHotelsSchema.safeParse(queryObj);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Invalid search parameters' },
        { status: 400 }
      );
    }

    let {
      city,
      checkIn,
      checkOut,
      guests,
      rooms,
      minPrice,
      maxPrice,
      propertyType,
      amenities,
      sortBy,
      page,
      limit,
    } = parsed.data;

    if (checkIn) checkIn = normalizeDateString(checkIn) || checkIn;
    if (checkOut) checkOut = normalizeDateString(checkOut) || checkOut;

    // Base filter: only public, approved, published properties
    const locationSearch = buildLocationSearchFilter(city);

    const filter: Record<string, unknown> = {
      verificationStatus: 'APPROVED',
      listingStatus: 'PUBLISHED',
      ...locationSearch.filter,
    };

    if (propertyType && propertyType !== 'ALL') {
      filter.propertyType = propertyType;
    }

    if (amenities) {
      const amenityList = amenities.split(',').map((a) => a.trim()).filter(Boolean);
      if (amenityList.length > 0) {
        filter.amenities = { $all: amenityList };
      }
    }

    // Query hotels
    const hotels = await Hotel.find(filter).lean();

    // Concurrent high-speed enrichment with room type pricing and real-time availability
    const enrichedResults = await Promise.all(
      hotels.map(async (hotel) => {
        let roomAvailability: any[] = [];
        try {
          roomAvailability = await getHotelRoomTypesAvailability(
            hotel._id,
            checkIn,
            checkOut
          );
        } catch {
          roomAvailability = [];
        }

        // Filter room types matching occupancy requirements
        const eligibleRooms = roomAvailability.filter(
          (ra) => ra.roomType.maxOccupancy * rooms >= guests
        );

        // If dates were provided, hotel must have at least one room type with available rooms >= requested rooms
        if (checkIn && checkOut) {
          const hasAvailability = eligibleRooms.some(
            (ra) => ra.availableRoomsCount >= rooms
          );
          if (!hasAvailability) {
            return null; // Exclude sold-out hotels for given dates
          }
        }

        const activePrices = (eligibleRooms.length > 0 ? eligibleRooms : roomAvailability).map(
          (ra) => ra.basePrice
        );

        const startingPrice = activePrices.length > 0 ? Math.min(...activePrices) : 3500;

        // Price filter
        if (minPrice !== undefined && startingPrice < minPrice) return null;
        if (maxPrice !== undefined && startingPrice > maxPrice) return null;

        return {
          ...hotel,
          startingPrice,
          roomTypesCount: roomAvailability.length,
          isAvailable: checkIn && checkOut ? eligibleRooms.some((ra) => ra.availableRoomsCount >= rooms) : true,
        };
      })
    );

    let enrichedHotels = enrichedResults.filter(Boolean) as any[];

    // Sort hotels
    if (sortBy === 'price_asc') {
      enrichedHotels.sort((a, b) => a.startingPrice - b.startingPrice);
    } else if (sortBy === 'price_desc') {
      enrichedHotels.sort((a, b) => b.startingPrice - a.startingPrice);
    } else if (sortBy === 'rating') {
      enrichedHotels.sort((a, b) => (b.ratingAverage || 0) - (a.ratingAverage || 0));
    } else {
      // Default: Rank by relevance to city/destination query
      enrichedHotels = rankHotelsBySearchRelevance(enrichedHotels, city);
    }

    // Pagination
    const total = enrichedHotels.length;
    const startIndex = (page - 1) * limit;
    const paginatedHotels = enrichedHotels.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      success: true,
      data: paginatedHotels,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Hotel search error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve hotels' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    const user = requireRole(session, ['HOTEL_ADMIN', 'SUPER_ADMIN']);

    const body = await req.json();
    const parsed = createHotelSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Invalid hotel data' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Generate unique slug
    let slug = parsed.data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const existingSlug = await Hotel.findOne({ slug });
    if (existingSlug) {
      slug = `${slug}-${Math.random().toString(36).substring(2, 6)}`;
    }

    const hotel = await Hotel.create({
      ...parsed.data,
      slug,
      ownerUserId: user.id,
      adminUserIds: [user.id],
      verificationStatus: 'PENDING',
      listingStatus: 'DRAFT',
      images: parsed.data.coverImage
        ? [{ url: parsed.data.coverImage.url, isPrimary: true, order: 0 }]
        : [],
    });

    // Update user assigned hotel
    await User.findByIdAndUpdate(user.id, { assignedHotelId: hotel._id });

    // Notify Super Admins of new application
    const superAdmins = await User.find({ role: 'SUPER_ADMIN' }).select('_id');
    for (const sa of superAdmins) {
      await createNotification({
        recipientUserId: sa._id,
        title: 'New Hotel Application',
        message: `A new hotel application "${hotel.name}" in ${hotel.city} has been submitted for review.`,
        type: 'HOTEL_APPROVAL',
        entityId: hotel._id.toString(),
      });
    }

    await createAuditLog({
      actorUserId: user.id,
      actorRole: user.role,
      action: 'HOTEL_APPLICATION_SUBMITTED',
      targetType: 'Hotel',
      targetId: hotel._id.toString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Hotel application submitted for approval',
      data: hotel,
    });
  } catch (error) {
    console.error('Hotel creation error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to submit hotel application' },
      { status: 500 }
    );
  }
}
