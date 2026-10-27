import { NextRequest, NextResponse } from 'next/server';
import { checkAvailabilitySchema } from '@/lib/validation/booking.schema';
import {
  checkRoomTypeAvailability,
  getHotelRoomTypesAvailability,
  getDetailedPhysicalRoomsAvailability,
} from '@/services/inventory.service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const queryObj = Object.fromEntries(searchParams.entries());
    const parsed = checkAvailabilitySchema.safeParse(queryObj);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Invalid availability query' },
        { status: 400 }
      );
    }

    const { hotelId, roomTypeId, checkInDate, checkOutDate, rooms } = parsed.data;

    if (roomTypeId) {
      const [result, physicalRooms] = await Promise.all([
        checkRoomTypeAvailability(hotelId, roomTypeId, checkInDate, checkOutDate, rooms),
        getDetailedPhysicalRoomsAvailability(hotelId, roomTypeId, checkInDate, checkOutDate),
      ]);
      return NextResponse.json({
        success: true,
        data: {
          ...result,
          rooms: physicalRooms,
        },
      });
    }

    const roomTypes = await getHotelRoomTypesAvailability(hotelId, checkInDate, checkOutDate);
    return NextResponse.json({ success: true, data: roomTypes });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Availability check failed' },
      { status: 500 }
    );
  }
}
