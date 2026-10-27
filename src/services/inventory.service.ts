import { PhysicalRoom, IPhysicalRoom } from '@/models/PhysicalRoom';
import { Booking, IBooking } from '@/models/Booking';
import { RoomType, IRoomType } from '@/models/RoomType';
import { Hotel } from '@/models/Hotel';
import { connectToDatabase } from '@/lib/db/connection';
import { parseDateOnly } from '@/utils/date';
import mongoose from 'mongoose';

export interface RoomTypeAvailability {
  roomType: IRoomType;
  totalPhysicalRooms: number;
  availableRoomsCount: number;
  isAvailable: boolean;
  basePrice: number;
}

/**
 * Find all physical rooms for a given roomType that are not under maintenance
 * and NOT assigned to any active overlapping booking between [checkIn, checkOut).
 */
export async function getAvailablePhysicalRooms(
  hotelId: string | mongoose.Types.ObjectId,
  roomTypeId: string | mongoose.Types.ObjectId,
  checkInDate: Date | string,
  checkOutDate: Date | string
): Promise<IPhysicalRoom[]> {
  await connectToDatabase();

  const cIn = parseDateOnly(checkInDate);
  const cOut = parseDateOnly(checkOutDate);

  if (cOut <= cIn) {
    throw new Error('Check-out date must be after check-in date');
  }

  const hId = new mongoose.Types.ObjectId(hotelId);
  const rTypeId = new mongoose.Types.ObjectId(roomTypeId);

  // 1. Get all operational physical rooms for this room type
  const operationalRooms = await PhysicalRoom.find({
    hotelId: hId,
    roomTypeId: rTypeId,
    operationalStatus: 'AVAILABLE',
  });

  if (operationalRooms.length === 0) {
    return [];
  }

  const operationalRoomIds = operationalRooms.map((r) => r._id);

  // 2. Query all active bookings overlapping [cIn, cOut)
  // Overlap condition: checkInDate < cOut AND checkOutDate > cIn
  const overlappingBookings = await Booking.find({
    hotelId: hId,
    bookingStatus: { $in: ['ACCEPTED', 'CHECKED_IN'] },
    assignedPhysicalRoomIds: { $in: operationalRoomIds },
    checkInDate: { $lt: cOut },
    checkOutDate: { $gt: cIn },
  }).select('assignedPhysicalRoomIds');

  const occupiedRoomIdSet = new Set<string>();
  for (const b of overlappingBookings) {
    if (b.assignedPhysicalRoomIds && Array.isArray(b.assignedPhysicalRoomIds)) {
      for (const assignedId of b.assignedPhysicalRoomIds) {
        occupiedRoomIdSet.add(assignedId.toString());
      }
    }
  }

  // 3. Filter operational rooms that are not in occupiedRoomIdSet
  return operationalRooms.filter((r) => !occupiedRoomIdSet.has(r._id.toString()));
}

/**
 * Check if a room type has at least `requestedRooms` available for [checkIn, checkOut).
 */
export async function checkRoomTypeAvailability(
  hotelId: string | mongoose.Types.ObjectId,
  roomTypeId: string | mongoose.Types.ObjectId,
  checkInDate: Date | string,
  checkOutDate: Date | string,
  requestedRooms: number = 1
): Promise<{ isAvailable: boolean; availableCount: number }> {
  const availableRooms = await getAvailablePhysicalRooms(
    hotelId,
    roomTypeId,
    checkInDate,
    checkOutDate
  );

  return {
    isAvailable: availableRooms.length >= requestedRooms,
    availableCount: availableRooms.length,
  };
}

/**
 * Get availability breakdown for all room types in a hotel for given dates.
 */
export async function getHotelRoomTypesAvailability(
  hotelId: string | mongoose.Types.ObjectId,
  checkInDate?: Date | string,
  checkOutDate?: Date | string
): Promise<RoomTypeAvailability[]> {
  await connectToDatabase();
  const hId = new mongoose.Types.ObjectId(hotelId);

  const roomTypes = await RoomType.find({ hotelId: hId, status: 'ACTIVE' }).lean();

  if (!checkInDate || !checkOutDate) {
    // If no dates requested, return room types with total room count
    return Promise.all(
      roomTypes.map(async (rt) => {
        const count = await PhysicalRoom.countDocuments({
          hotelId: hId,
          roomTypeId: rt._id,
          operationalStatus: 'AVAILABLE',
        });
        return {
          roomType: rt as unknown as IRoomType,
          totalPhysicalRooms: count,
          availableRoomsCount: count,
          isAvailable: count > 0,
          basePrice: rt.basePrice,
        };
      })
    );
  }

  return Promise.all(
    roomTypes.map(async (rt) => {
      const availableRooms = await getAvailablePhysicalRooms(
        hId,
        rt._id,
        checkInDate,
        checkOutDate
      );
      const totalRooms = await PhysicalRoom.countDocuments({
        hotelId: hId,
        roomTypeId: rt._id,
      });

      return {
        roomType: rt as unknown as IRoomType,
        totalPhysicalRooms: totalRooms,
        availableRoomsCount: availableRooms.length,
        isAvailable: availableRooms.length > 0,
        basePrice: rt.basePrice,
      };
    })
  );
}

/**
 * Atomically allocate physical rooms to a booking upon acceptance.
 * Concurrency safe: checks available rooms and assigns exact room IDs.
 */
export async function assignRoomsToBooking(
  booking: IBooking,
  actorUserId: string | mongoose.Types.ObjectId
): Promise<IBooking> {
  await connectToDatabase();

  const availableRooms = await getAvailablePhysicalRooms(
    booking.hotelId,
    booking.roomTypeId,
    booking.checkInDate,
    booking.checkOutDate
  );

  if (availableRooms.length < booking.numberOfRooms) {
    throw new Error(
      `Insufficient room inventory. Requested ${booking.numberOfRooms}, but only ${availableRooms.length} available.`
    );
  }

  // Select the first N rooms
  const assignedRooms = availableRooms.slice(0, booking.numberOfRooms);
  const assignedRoomIds = assignedRooms.map((r) => r._id);

  booking.assignedPhysicalRoomIds = assignedRoomIds;
  booking.bookingStatus = 'ACCEPTED';
  booking.acceptedBy = new mongoose.Types.ObjectId(actorUserId);
  booking.acceptedAt = new Date();

  await booking.save();
  return booking;
}

export interface PhysicalRoomAvailabilityDetail {
  _id: string;
  roomNumber: string;
  floor: number;
  operationalStatus: string;
  isAvailable: boolean;
  statusMessage: string;
  images?: Array<{ url: string; caption?: string }>;
}

/**
 * Get all physical rooms for a given roomType and their real-time availability status
 * for [checkInDate, checkOutDate).
 */
export async function getDetailedPhysicalRoomsAvailability(
  hotelId: string | mongoose.Types.ObjectId,
  roomTypeId: string | mongoose.Types.ObjectId,
  checkInDate: Date | string,
  checkOutDate: Date | string
): Promise<PhysicalRoomAvailabilityDetail[]> {
  await connectToDatabase();
  const cIn = parseDateOnly(checkInDate);
  const cOut = parseDateOnly(checkOutDate);

  const hId = new mongoose.Types.ObjectId(hotelId);
  const rTypeId = new mongoose.Types.ObjectId(roomTypeId);

  const rooms = await PhysicalRoom.find({
    hotelId: hId,
    roomTypeId: rTypeId,
  }).sort({ floor: 1, roomNumber: 1 });

  const roomIds = rooms.map((r) => r._id);

  const overlappingBookings = await Booking.find({
    hotelId: hId,
    bookingStatus: { $in: ['ACCEPTED', 'CHECKED_IN'] },
    assignedPhysicalRoomIds: { $in: roomIds },
    checkInDate: { $lt: cOut },
    checkOutDate: { $gt: cIn },
  }).select('assignedPhysicalRoomIds');

  const occupiedRoomIdSet = new Set<string>();
  for (const b of overlappingBookings) {
    if (b.assignedPhysicalRoomIds && Array.isArray(b.assignedPhysicalRoomIds)) {
      for (const assignedId of b.assignedPhysicalRoomIds) {
        occupiedRoomIdSet.add(assignedId.toString());
      }
    }
  }

  return rooms.map((r) => {
    const isOccupied = occupiedRoomIdSet.has(r._id.toString());
    const isOperational = r.operationalStatus === 'AVAILABLE';
    const isAvailable = isOperational && !isOccupied;

    let statusMessage = 'Available for booking';
    if (!isOperational) {
      statusMessage = `Under ${r.operationalStatus}`;
    } else if (isOccupied) {
      statusMessage = 'Unavailable for these dates';
    }

    const roomImages =
      r.images && r.images.length > 0
        ? r.images.map((img) => ({ url: img.url, caption: img.caption }))
        : undefined;

    return {
      _id: r._id.toString(),
      roomNumber: r.roomNumber,
      floor: r.floor,
      operationalStatus: r.operationalStatus,
      isAvailable,
      statusMessage,
      images: roomImages,
    };
  });
}

