import { Booking, IBooking } from '@/models/Booking';
import { Hotel } from '@/models/Hotel';
import { RoomType } from '@/models/RoomType';
import { PhysicalRoom } from '@/models/PhysicalRoom';
import { connectToDatabase } from '@/lib/db/connection';
import { calculateBookingPrice } from '@/utils/pricing';
import { calculateNights, parseDateOnly } from '@/utils/date';
import { assignRoomsToBooking } from './inventory.service';
import { createNotification } from '@/lib/notifications/notification.service';
import { createAuditLog } from '@/lib/audit/audit.service';
import { getCustomerLoyalty, redeemCustomerFreeNight } from './loyalty.service';
import mongoose from 'mongoose';

function generateBookingReference(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 6; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `IND-${new Date().getFullYear()}-${rand}`;
}

export interface CreateBookingRequestParams {
  customerId: string;
  hotelId: string;
  roomTypeId: string;
  checkInDate: string | Date;
  checkOutDate: string | Date;
  adults: number;
  children?: number;
  numberOfRooms?: number;
  selectedPhysicalRoomId?: string;
  paymentType?: 'ADVANCE_10' | 'FULL_100';
  paymentReference?: string;
  applyLoyaltyFreeNight?: boolean;
  guestDetails: {
    fullName: string;
    email: string;
    phone: string;
    specialRequests?: string;
  };
}

export async function createBookingRequest(params: CreateBookingRequestParams): Promise<IBooking> {
  await connectToDatabase();

  const checkIn = parseDateOnly(params.checkInDate);
  const checkOut = parseDateOnly(params.checkOutDate);
  const numberOfNights = calculateNights(checkIn, checkOut);

  if (numberOfNights < 1) {
    throw new Error('Check-out must be at least 1 day after check-in');
  }

  const hotel = await Hotel.findById(params.hotelId);
  if (!hotel) {
    throw new Error('Hotel not found');
  }

  if (hotel.verificationStatus !== 'APPROVED' || hotel.listingStatus !== 'PUBLISHED') {
    throw new Error('This hotel is currently not accepting bookings');
  }

  const roomType = await RoomType.findOne({
    _id: params.roomTypeId,
    hotelId: params.hotelId,
    status: 'ACTIVE',
  });

  if (!roomType) {
    throw new Error('Selected room type is invalid or inactive');
  }

  const numberOfRooms = params.numberOfRooms || 1;
  const maxOccupancyAllowed = roomType.maxOccupancy * numberOfRooms;
  const totalGuests = params.adults + (params.children || 0);

  if (totalGuests > maxOccupancyAllowed) {
    throw new Error(
      `Selected rooms can accommodate up to ${maxOccupancyAllowed} guests. Requested: ${totalGuests}`
    );
  }

  // Check if loyalty free night reward is requested
  let appliedLoyalty = false;
  if (params.applyLoyaltyFreeNight) {
    const loyalty = await getCustomerLoyalty(params.customerId);
    if (loyalty.freeNightsAvailable > 0 || loyalty.isRewardReady) {
      appliedLoyalty = true;
    } else {
      throw new Error('No 1-Day Free Stay rewards available in your Royalty account.');
    }
  }

  // Calculate pricing server-side (with 1-day free room discount if applicable)
  const pricing = calculateBookingPrice(
    roomType.basePrice,
    numberOfNights,
    numberOfRooms,
    checkIn,
    appliedLoyalty
  );

  // If loyalty free stay reward used, deduct 1 reward from customer
  if (appliedLoyalty) {
    await redeemCustomerFreeNight(params.customerId);
  }

  let bookingReference = generateBookingReference();
  let existing = await Booking.findOne({ bookingReference });
  while (existing) {
    bookingReference = generateBookingReference();
    existing = await Booking.findOne({ bookingReference });
  }

  let preAssignedRoomIds: mongoose.Types.ObjectId[] = [];
  if (params.selectedPhysicalRoomId && mongoose.Types.ObjectId.isValid(params.selectedPhysicalRoomId)) {
    const requestedRoom = await PhysicalRoom.findOne({
      _id: params.selectedPhysicalRoomId,
      hotelId: params.hotelId,
      roomTypeId: params.roomTypeId,
      operationalStatus: 'AVAILABLE',
    });

    if (requestedRoom) {
      const overlapping = await Booking.findOne({
        hotelId: params.hotelId,
        assignedPhysicalRoomIds: requestedRoom._id,
        bookingStatus: { $in: ['ACCEPTED', 'CHECKED_IN'] },
        checkInDate: { $lt: checkOut },
        checkOutDate: { $gt: checkIn },
      });
      if (overlapping) {
        throw new Error(`Room ${requestedRoom.roomNumber} is already booked for these dates`);
      }
      preAssignedRoomIds = [requestedRoom._id];
    }
  }

  const isFullPayment = params.paymentType === 'FULL_100';
  const isFreeStay = pricing.totalPrice === 0;
  const advancePaymentAmount = isFreeStay
    ? 0
    : isFullPayment
    ? pricing.totalPrice
    : Math.round(pricing.totalPrice * 0.10);
  const balanceDueAtHotel = pricing.totalPrice - advancePaymentAmount;
  const paymentStatus = isFreeStay || isFullPayment ? 'PAID' : 'PARTIALLY_PAID';
  const paymentMethod = isFreeStay ? 'ROYALTY_FREE_DAY' : 'RAZORPAY';

  const booking = await Booking.create({
    bookingReference,
    customerId: new mongoose.Types.ObjectId(params.customerId),
    hotelId: new mongoose.Types.ObjectId(params.hotelId),
    roomTypeId: new mongoose.Types.ObjectId(params.roomTypeId),
    assignedPhysicalRoomIds: preAssignedRoomIds,
    checkInDate: checkIn,
    checkOutDate: checkOut,
    adults: params.adults,
    children: params.children || 0,
    numberOfRooms,
    priceBreakdown: {
      pricePerNight: pricing.pricePerNight,
      numberOfNights: pricing.numberOfNights,
      baseTotal: pricing.baseTotal,
      taxesAndFees: pricing.taxesAndFees,
      totalPrice: pricing.totalPrice,
    },
    currency: roomType.currency || 'INR',
    bookingStatus: 'PENDING',
    paymentStatus,
    paymentMethod,
    appliedLoyaltyFreeNight: appliedLoyalty,
    loyaltyDiscountAmount: pricing.loyaltyDiscountAmount,
    paymentReference: params.paymentReference || (isFreeStay ? 'ROYALTY_VOUCHER_100' : `RZP-${Date.now().toString(36).toUpperCase()}`),
    advancePaymentAmount,
    balanceDueAtHotel,
    paymentTimestamp: new Date(),
    guestDetails: params.guestDetails,
  });

  // Notify hotel owner and admins
  const adminIds = [hotel.ownerUserId, ...(hotel.adminUserIds || [])];
  for (const adminId of adminIds) {
    await createNotification({
      recipientUserId: adminId,
      title: 'New Booking Request',
      message: `New booking request ${bookingReference} received for ${roomType.name} from ${params.guestDetails.fullName}.`,
      type: 'BOOKING_REQUEST',
      entityId: booking._id.toString(),
    });
  }

  return booking;
}

export async function acceptBooking(
  bookingId: string,
  actorUserId: string
): Promise<IBooking> {
  await connectToDatabase();
  const booking = await Booking.findById(bookingId).populate('roomTypeId');
  if (!booking) {
    throw new Error('Booking not found');
  }

  if (booking.bookingStatus !== 'PENDING') {
    throw new Error(`Cannot accept booking in ${booking.bookingStatus} status`);
  }

  // Assign physical rooms and update status
  await assignRoomsToBooking(booking, actorUserId);

  // Notify customer
  await createNotification({
    recipientUserId: booking.customerId,
    title: 'Booking Confirmed!',
    message: `Your booking ${booking.bookingReference} has been confirmed by the property.`,
    type: 'BOOKING_CONFIRMED',
    entityId: booking._id.toString(),
  });

  await createAuditLog({
    actorUserId,
    actorRole: 'HOTEL_ADMIN',
    action: 'BOOKING_ACCEPTED',
    targetType: 'Booking',
    targetId: booking._id.toString(),
    details: { assignedRooms: booking.assignedPhysicalRoomIds },
  });

  return booking;
}

export async function rejectBooking(
  bookingId: string,
  actorUserId: string,
  reason: string
): Promise<IBooking> {
  await connectToDatabase();
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new Error('Booking not found');
  }

  if (booking.bookingStatus !== 'PENDING') {
    throw new Error(`Cannot reject booking in ${booking.bookingStatus} status`);
  }

  booking.bookingStatus = 'REJECTED';
  booking.rejectionReason = reason;
  booking.rejectedBy = new mongoose.Types.ObjectId(actorUserId);
  booking.rejectedAt = new Date();
  await booking.save();

  // Notify customer
  await createNotification({
    recipientUserId: booking.customerId,
    title: 'Booking Update',
    message: `Your booking request ${booking.bookingReference} could not be confirmed: ${reason}`,
    type: 'BOOKING_REJECTED',
    entityId: booking._id.toString(),
  });

  await createAuditLog({
    actorUserId,
    actorRole: 'HOTEL_ADMIN',
    action: 'BOOKING_REJECTED',
    targetType: 'Booking',
    targetId: booking._id.toString(),
    details: { reason },
  });

  return booking;
}

export async function cancelBooking(
  bookingId: string,
  actorUserId: string,
  reason: string
): Promise<IBooking> {
  await connectToDatabase();
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new Error('Booking not found');
  }

  if (!['PENDING', 'ACCEPTED'].includes(booking.bookingStatus)) {
    throw new Error(`Cannot cancel booking in ${booking.bookingStatus} status`);
  }

  // Release assigned physical rooms
  booking.assignedPhysicalRoomIds = [];
  booking.bookingStatus = 'CANCELLED';
  booking.cancellationReason = reason;
  booking.cancellationTimestamp = new Date();
  await booking.save();

  // Notify parties
  await createNotification({
    recipientUserId: booking.customerId,
    title: 'Booking Cancelled',
    message: `Booking ${booking.bookingReference} has been cancelled.`,
    type: 'BOOKING_CANCELLED',
    entityId: booking._id.toString(),
  });

  await createAuditLog({
    actorUserId,
    actorRole: 'USER',
    action: 'BOOKING_CANCELLED',
    targetType: 'Booking',
    targetId: booking._id.toString(),
    details: { reason },
  });

  return booking;
}

export async function checkInGuest(bookingId: string, actorUserId: string): Promise<IBooking> {
  await connectToDatabase();
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new Error('Booking not found');
  if (booking.bookingStatus !== 'ACCEPTED') {
    throw new Error('Guest can only check in to an ACCEPTED booking');
  }

  booking.bookingStatus = 'CHECKED_IN';
  booking.checkedInAt = new Date();
  await booking.save();

  await createAuditLog({
    actorUserId,
    actorRole: 'HOTEL_ADMIN',
    action: 'GUEST_CHECKED_IN',
    targetType: 'Booking',
    targetId: booking._id.toString(),
  });

  return booking;
}

export async function checkOutGuest(bookingId: string, actorUserId: string): Promise<IBooking> {
  await connectToDatabase();
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new Error('Booking not found');
  if (booking.bookingStatus !== 'CHECKED_IN') {
    throw new Error('Guest can only check out from a CHECKED_IN booking');
  }

  booking.bookingStatus = 'CHECKED_OUT';
  booking.checkedOutAt = new Date();
  await booking.save();

  await createAuditLog({
    actorUserId,
    actorRole: 'HOTEL_ADMIN',
    action: 'GUEST_CHECKED_OUT',
    targetType: 'Booking',
    targetId: booking._id.toString(),
  });

  return booking;
}
