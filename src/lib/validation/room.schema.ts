import { z } from 'zod';

export const createRoomTypeSchema = z.object({
  name: z.string().min(2, 'Room type name must be at least 2 characters').max(80),
  description: z.string().optional(),
  bedConfiguration: z.string().min(2, 'Bed configuration is required (e.g., 1 King Bed)'),
  maxAdults: z.coerce.number().min(1, 'At least 1 adult required'),
  maxChildren: z.coerce.number().min(0).default(0),
  maxOccupancy: z.coerce.number().min(1, 'Max occupancy must be at least 1'),
  basePrice: z.coerce.number().min(0, 'Base price must be a positive number'),
  currency: z.string().default('INR'),
  amenities: z.array(z.string()).default([]),
  sizeSqFt: z.coerce.number().optional(),
  images: z
    .array(
      z.object({
        url: z.string().url(),
        publicId: z.string().optional(),
        caption: z.string().optional(),
      })
    )
    .default([]),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});

export const updateRoomTypeSchema = createRoomTypeSchema.partial();

export const createPhysicalRoomSchema = z.object({
  roomTypeId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Room Type ID'),
  roomNumber: z.string().min(1, 'Room number is required').max(20),
  floor: z.coerce.number().int(),
  operationalStatus: z.enum(['AVAILABLE', 'MAINTENANCE', 'OUT_OF_SERVICE']).default('AVAILABLE'),
  housekeepingStatus: z.enum(['CLEAN', 'DIRTY', 'CLEANING', 'INSPECTED']).default('CLEAN'),
  notes: z.string().optional(),
});

export const updatePhysicalRoomSchema = z.object({
  operationalStatus: z.enum(['AVAILABLE', 'MAINTENANCE', 'OUT_OF_SERVICE']).optional(),
  housekeepingStatus: z.enum(['CLEAN', 'DIRTY', 'CLEANING', 'INSPECTED']).optional(),
  notes: z.string().optional(),
});

export type CreateRoomTypeInput = z.infer<typeof createRoomTypeSchema>;
export type UpdateRoomTypeInput = z.infer<typeof updateRoomTypeSchema>;
export type CreatePhysicalRoomInput = z.infer<typeof createPhysicalRoomSchema>;
export type UpdatePhysicalRoomInput = z.infer<typeof updatePhysicalRoomSchema>;
