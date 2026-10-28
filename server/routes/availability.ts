import { Router, Request, Response } from 'express';
import { checkAvailabilitySchema } from '../../src/lib/validation/booking.schema';
import {
  checkRoomTypeAvailability,
  getHotelRoomTypesAvailability,
  getDetailedPhysicalRoomsAvailability,
} from '../../src/services/inventory.service';
import { connectBackendDatabase } from '../db';

export const availabilityRouter = Router();

// GET /api/availability
availabilityRouter.get('/', async (req: Request, res: Response) => {
  try {
    await connectBackendDatabase();
    const parsed = checkAvailabilitySchema.safeParse(req.query);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: parsed.error.issues[0]?.message || 'Invalid availability query',
      });
    }

    const { hotelId, roomTypeId, checkInDate, checkOutDate, rooms } = parsed.data;

    if (roomTypeId) {
      const [result, physicalRooms] = await Promise.all([
        checkRoomTypeAvailability(hotelId, roomTypeId, checkInDate, checkOutDate, rooms),
        getDetailedPhysicalRoomsAvailability(hotelId, roomTypeId, checkInDate, checkOutDate),
      ]);
      return res.json({
        success: true,
        data: {
          ...result,
          rooms: physicalRooms,
        },
      });
    }

    const roomTypes = await getHotelRoomTypesAvailability(hotelId, checkInDate, checkOutDate);
    return res.json({ success: true, data: roomTypes });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Availability check failed',
    });
  }
});
