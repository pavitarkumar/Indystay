import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { Hotel } from '../../src/models/Hotel';
import { RoomType } from '../../src/models/RoomType';
import { PhysicalRoom } from '../../src/models/PhysicalRoom';
import { Review } from '../../src/models/Review';
import { searchHotelsSchema, createHotelSchema, updateHotelSchema } from '../../src/lib/validation/hotel.schema';
import { createRoomTypeSchema, createPhysicalRoomSchema } from '../../src/lib/validation/room.schema';
import { getHotelRoomTypesAvailability } from '../../src/services/inventory.service';
import { buildLocationSearchFilter, rankHotelsBySearchRelevance } from '../../src/lib/search/locationFilter';
import { normalizeDateString } from '../../src/utils/date';
import { authenticate, requireAuth } from '../middleware/auth';
import { connectBackendDatabase } from '../db';
import { memoryCache } from '../cache';

export const hotelsRouter = Router();

// Helper to check hotel admin or super admin ownership
async function checkHotelAccess(userId: string, userRole: string, hotelId: string): Promise<boolean> {
  if (userRole === 'SUPER_ADMIN') return true;
  if (userRole !== 'HOTEL_ADMIN') return false;

  const h = await Hotel.findById(hotelId).select('ownerUserId adminUserIds').lean();
  if (!h) return false;

  const uid = userId.toString();
  const isOwner = h.ownerUserId && h.ownerUserId.toString() === uid;
  const isAdmin = Array.isArray(h.adminUserIds) && h.adminUserIds.some((a: any) => a.toString() === uid);

  return isOwner || isAdmin;
}

// GET /api/hotels
hotelsRouter.get('/', async (req: Request, res: Response) => {
  try {
    await connectBackendDatabase();

    const parsed = searchHotelsSchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: parsed.error.issues[0]?.message || 'Invalid search parameters',
      });
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

    // Cache key for popular repetitive queries
    const cacheKey = `hotels:${city || 'all'}:${propertyType || 'all'}:${checkIn || ''}:${checkOut || ''}:${guests}:${rooms}:${sortBy}:${page}:${limit}`;
    const cached = memoryCache.get(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cached);
    }

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

    const rawHotels = await Hotel.find(filter).lean();

    const enrichedResults = await Promise.all(
      rawHotels.map(async (hotel) => {
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

        const eligibleRooms = roomAvailability.filter(
          (ra) => ra.roomType.maxOccupancy * rooms >= guests
        );

        if (checkIn && checkOut) {
          const hasAvailability = eligibleRooms.some(
            (ra) => ra.availableRoomsCount >= rooms
          );
          if (!hasAvailability) {
            return null;
          }
        }

        const activePrices = (eligibleRooms.length > 0 ? eligibleRooms : roomAvailability).map(
          (ra) => ra.basePrice
        );
        const startingPrice = activePrices.length > 0 ? Math.min(...activePrices) : 1450;

        if (minPrice && startingPrice < minPrice) return null;
        if (maxPrice && startingPrice > maxPrice) return null;

        return {
          _id: (hotel._id as any).toString(),
          name: hotel.name,
          slug: hotel.slug,
          city: hotel.city,
          state: hotel.state,
          locality: hotel.locality,
          propertyType: hotel.propertyType,
          amenities: hotel.amenities || [],
          coverImage: hotel.coverImage,
          ratingAverage: hotel.ratingAverage,
          ratingCount: hotel.ratingCount,
          startingPrice,
          isAvailable: true,
        };
      })
    );

    let enrichedHotels = enrichedResults.filter(Boolean) as any[];

    if (sortBy === 'price_asc') {
      enrichedHotels.sort((a, b) => a.startingPrice - b.startingPrice);
    } else if (sortBy === 'price_desc') {
      enrichedHotels.sort((a, b) => b.startingPrice - a.startingPrice);
    } else if (sortBy === 'rating') {
      enrichedHotels.sort((a, b) => (b.ratingAverage || 0) - (a.ratingAverage || 0));
    } else {
      enrichedHotels = rankHotelsBySearchRelevance(enrichedHotels, city);
    }

    const total = enrichedHotels.length;
    const startIndex = (page - 1) * limit;
    const paginatedHotels = enrichedHotels.slice(startIndex, startIndex + limit);

    const payload = {
      success: true,
      data: paginatedHotels,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    memoryCache.set(cacheKey, payload, 30); // 30s cache for fast search
    res.setHeader('X-Cache', 'MISS');
    return res.json(payload);
  } catch (error) {
    console.error('Express Hotel search error:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve hotels' });
  }
});

// GET /api/hotels/:slug
hotelsRouter.get('/:slug', async (req: Request, res: Response) => {
  try {
    const slug = req.params.slug as string;
    await connectBackendDatabase();

    const checkIn = req.query.checkIn ? String(req.query.checkIn) : undefined;
    const checkOut = req.query.checkOut ? String(req.query.checkOut) : undefined;

    const isObjectId = mongoose.Types.ObjectId.isValid(slug);
    const query = isObjectId ? { _id: slug } : { slug };

    const hotel = await Hotel.findOne(query).lean();
    if (!hotel) {
      return res.status(404).json({ success: false, error: 'Hotel not found' });
    }

    const roomTypesAvailability = await getHotelRoomTypesAvailability(
      hotel._id,
      checkIn,
      checkOut
    );

    const reviews = await Review.find({ hotelId: hotel._id, status: 'PUBLISHED' })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return res.json({
      success: true,
      data: {
        ...hotel,
        roomTypes: roomTypesAvailability,
        reviews,
      },
    });
  } catch (error) {
    console.error('Hotel detail error:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve hotel details' });
  }
});

// GET /api/hotels/:slug/room-types
hotelsRouter.get('/:slug/room-types', async (req: Request, res: Response) => {
  try {
    const slug = req.params.slug as string;
    await connectBackendDatabase();

    const isObjectId = mongoose.Types.ObjectId.isValid(slug);
    const hotel = await Hotel.findOne(isObjectId ? { _id: slug } : { slug }).select('_id');
    if (!hotel) {
      return res.status(404).json({ success: false, error: 'Hotel not found' });
    }

    const roomTypes = await RoomType.find({ hotelId: hotel._id }).lean();
    return res.json({ success: true, data: roomTypes });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to retrieve room types' });
  }
});

// POST /api/hotels/:slug/room-types
hotelsRouter.post('/:slug/room-types', requireAuth, async (req: Request, res: Response) => {
  try {
    const slug = req.params.slug as string;
    await connectBackendDatabase();

    const isObjectId = mongoose.Types.ObjectId.isValid(slug);
    const hotel = await Hotel.findOne(isObjectId ? { _id: slug } : { slug }).select('_id ownerUserId adminUserIds');
    if (!hotel) {
      return res.status(404).json({ success: false, error: 'Hotel not found' });
    }

    const hasAccess = await checkHotelAccess(req.user!.id, req.user!.role, hotel._id.toString());
    if (!hasAccess) {
      return res.status(403).json({ success: false, error: 'Forbidden. Not authorized to manage this hotel.' });
    }

    const parsed = createRoomTypeSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.issues[0]?.message || 'Invalid room type data' });
    }

    const roomType = await RoomType.create({
      ...parsed.data,
      hotelId: hotel._id,
      status: 'ACTIVE',
    });

    memoryCache.delPattern(/^hotels:/);
    return res.status(201).json({ success: true, data: roomType });
  } catch (error) {
    console.error('Create room type error:', error);
    return res.status(500).json({ success: false, error: 'Failed to create room type' });
  }
});

// GET /api/hotels/:slug/rooms
hotelsRouter.get('/:slug/rooms', requireAuth, async (req: Request, res: Response) => {
  try {
    const slug = req.params.slug as string;
    await connectBackendDatabase();

    const isObjectId = mongoose.Types.ObjectId.isValid(slug);
    const hotel = await Hotel.findOne(isObjectId ? { _id: slug } : { slug }).select('_id');
    if (!hotel) {
      return res.status(404).json({ success: false, error: 'Hotel not found' });
    }

    const hasAccess = await checkHotelAccess(req.user!.id, req.user!.role, hotel._id.toString());
    if (!hasAccess) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const rooms = await PhysicalRoom.find({ hotelId: hotel._id }).populate('roomTypeId', 'name code').lean();
    return res.json({ success: true, data: rooms });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to retrieve physical rooms' });
  }
});

// POST /api/hotels/:slug/rooms
hotelsRouter.post('/:slug/rooms', requireAuth, async (req: Request, res: Response) => {
  try {
    const slug = req.params.slug as string;
    await connectBackendDatabase();

    const isObjectId = mongoose.Types.ObjectId.isValid(slug);
    const hotel = await Hotel.findOne(isObjectId ? { _id: slug } : { slug }).select('_id');
    if (!hotel) {
      return res.status(404).json({ success: false, error: 'Hotel not found' });
    }

    const hasAccess = await checkHotelAccess(req.user!.id, req.user!.role, hotel._id.toString());
    if (!hasAccess) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const parsed = createPhysicalRoomSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.issues[0]?.message || 'Invalid room data' });
    }

    const room = await PhysicalRoom.create({
      ...parsed.data,
      hotelId: hotel._id,
      operationalStatus: 'AVAILABLE',
      housekeepingStatus: 'CLEAN',
    });

    memoryCache.delPattern(/^hotels:/);
    return res.status(201).json({ success: true, data: room });
  } catch (error) {
    console.error('Create room error:', error);
    return res.status(500).json({ success: false, error: 'Failed to create room' });
  }
});
