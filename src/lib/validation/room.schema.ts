import { z } from 'zod';

// Hotspot within a 360° panorama scene
const panoramaHotspotSchema = z.object({
  pitch: z.number(),
  yaw: z.number(),
  label: z.string().min(1),
  description: z.string().optional(),
});

// A single 360° panorama scene
export const panoramaSceneSchema = z.object({
  url: z.string().url('Panorama URL must be a valid URL'),
  sceneName: z.string().min(1, 'Scene name is required').max(80),
  sceneId: z.string().min(1, 'Scene ID is required').max(80),
  order: z.coerce.number().default(0),
  description: z.string().optional(),
  hotspots: z.array(panoramaHotspotSchema).default([]),
});

// 3D model asset
export const model3dSchema = z.object({
  url: z.string().url('Model URL must be a valid URL'),
  thumbnailUrl: z.string().url('Thumbnail must be a valid URL').optional().or(z.literal('')),
  description: z.string().optional(),
  config: z.record(z.string(), z.unknown()).optional(),
});

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
  // Virtual tour fields — optional
  panoramas: z.array(panoramaSceneSchema).optional(),
  model3d: model3dSchema.optional().nullable(),
});

export const updateRoomTypeSchema = createRoomTypeSchema.partial();

export const createPhysicalRoomSchema = z.object({
  roomTypeId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Room Type ID'),
  roomNumber: z.string().min(1, 'Room number is required').max(20),
  floor: z.coerce.number().int(),
  operationalStatus: z.enum(['AVAILABLE', 'MAINTENANCE', 'OUT_OF_SERVICE']).default('AVAILABLE'),
  housekeepingStatus: z.enum(['CLEAN', 'DIRTY', 'CLEANING', 'INSPECTED']).default('CLEAN'),
  notes: z.string().optional(),
  images: z
    .array(
      z.object({
        url: z.string().url('Invalid image URL'),
        caption: z.string().optional(),
      })
    )
    .optional()
    .default([]),
});

export const updatePhysicalRoomSchema = z.object({
  roomNumber: z.string().min(1).max(20).optional(),
  floor: z.coerce.number().int().optional(),
  roomTypeId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  operationalStatus: z.enum(['AVAILABLE', 'MAINTENANCE', 'OUT_OF_SERVICE']).optional(),
  housekeepingStatus: z.enum(['CLEAN', 'DIRTY', 'CLEANING', 'INSPECTED']).optional(),
  notes: z.string().optional(),
  images: z
    .array(
      z.object({
        url: z.string().url('Invalid image URL'),
        caption: z.string().optional(),
      })
    )
    .optional(),
});

export type CreateRoomTypeInput = z.infer<typeof createRoomTypeSchema>;
export type UpdateRoomTypeInput = z.infer<typeof updateRoomTypeSchema>;
export type CreatePhysicalRoomInput = z.infer<typeof createPhysicalRoomSchema>;
export type UpdatePhysicalRoomInput = z.infer<typeof updatePhysicalRoomSchema>;
