import { z } from 'zod';

export const createBookingSchema = z
  .object({
    hotelId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Hotel ID'),
    roomTypeId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Room Type ID'),
    checkInDate: z.string().min(10, 'Valid check-in date (YYYY-MM-DD) is required'),
    checkOutDate: z.string().min(10, 'Valid check-out date (YYYY-MM-DD) is required'),
    adults: z.coerce.number().min(1, 'At least 1 adult required'),
    children: z.coerce.number().min(0).default(0),
    numberOfRooms: z.coerce.number().min(1).default(1),
    selectedPhysicalRoomId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Physical Room ID').optional(),
    paymentType: z.enum(['ADVANCE_10', 'FULL_100']).default('ADVANCE_10'),
    paymentReference: z.string().optional(),
    guestDetails: z.object({
      fullName: z.string().min(2, 'Guest full name is required'),
      email: z.string().email('Valid guest email is required'),
      phone: z.string().min(7, 'Valid contact phone number is required'),
      specialRequests: z.string().max(500).optional(),
    }),
  })
  .refine(
    (data) => {
      const checkIn = new Date(data.checkInDate);
      const checkOut = new Date(data.checkOutDate);
      return checkOut.getTime() > checkIn.getTime();
    },
    {
      message: 'Check-out date must be after check-in date',
      path: ['checkOutDate'],
    }
  );

export const rejectBookingSchema = z.object({
  reason: z.string().min(3, 'Rejection reason is required'),
});

export const cancelBookingSchema = z.object({
  reason: z.string().min(3, 'Cancellation reason is required'),
});

export const checkAvailabilitySchema = z
  .object({
    hotelId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Hotel ID'),
    roomTypeId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Room Type ID').optional(),
    checkInDate: z.string().min(10, 'Valid check-in date is required'),
    checkOutDate: z.string().min(10, 'Valid check-out date is required'),
    rooms: z.coerce.number().min(1).default(1),
  })
  .refine(
    (data) => {
      const checkIn = new Date(data.checkInDate);
      const checkOut = new Date(data.checkOutDate);
      return checkOut.getTime() > checkIn.getTime();
    },
    {
      message: 'Check-out date must be after check-in date',
      path: ['checkOutDate'],
    }
  );

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type RejectBookingInput = z.infer<typeof rejectBookingSchema>;
export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;
export type CheckAvailabilityInput = z.infer<typeof checkAvailabilitySchema>;
