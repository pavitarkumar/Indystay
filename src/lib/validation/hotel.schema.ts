import { z } from 'zod';

export const createHotelSchema = z.object({
  name: z.string().min(3, 'Hotel name must be at least 3 characters').max(120),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  address: z.string().min(5, 'Address is required'),
  locality: z.string().min(2, 'Locality is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  country: z.string().default('India'),
  postalCode: z.string().min(4, 'Postal code is required'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  propertyType: z.enum(['HOTEL', 'RESORT', 'HOMESTAY', 'VILLA', 'BOUTIQUE']).default('HOTEL'),
  amenities: z.array(z.string()).default([]),
  checkInTime: z.string().default('14:00'),
  checkOutTime: z.string().default('11:00'),
  cancellationPolicy: z.enum(['FLEXIBLE', 'MODERATE', 'STRICT']).default('FLEXIBLE'),
  contactInformation: z.object({
    phone: z.string().min(5, 'Phone number is required'),
    email: z.string().email('Valid email is required'),
    supportContact: z.string().optional(),
  }),
  coverImage: z
    .object({
      url: z.string().url('Cover image must be a valid URL'),
      publicId: z.string().optional(),
      alt: z.string().optional(),
    })
    .optional(),
});

export const updateHotelSchema = createHotelSchema.partial();

export const rejectHotelSchema = z.object({
  reason: z.string().min(5, 'Rejection reason must be at least 5 characters'),
});

export const searchHotelsSchema = z.object({
  city: z.string().optional(),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  guests: z.coerce.number().min(1).default(1),
  rooms: z.coerce.number().min(1).default(1),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  propertyType: z.string().optional(),
  amenities: z.string().optional(),
  sortBy: z.enum(['price_asc', 'price_desc', 'rating', 'recommended']).default('recommended'),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(12),
});

export type CreateHotelInput = z.infer<typeof createHotelSchema>;
export type UpdateHotelInput = z.infer<typeof updateHotelSchema>;
export type SearchHotelsInput = z.infer<typeof searchHotelsSchema>;
