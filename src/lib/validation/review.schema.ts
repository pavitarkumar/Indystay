import { z } from 'zod';

export const createReviewSchema = z.object({
  hotelId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Hotel ID'),
  bookingId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Booking ID'),
  rating: z.coerce.number().min(1).max(5),
  title: z.string().max(100).optional(),
  comment: z.string().min(10, 'Review comment must be at least 10 characters').max(1000),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
