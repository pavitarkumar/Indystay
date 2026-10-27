import mongoose, { Schema, Document, Model } from 'mongoose';

export type HotelVerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type HotelListingStatus = 'DRAFT' | 'PUBLISHED' | 'SUSPENDED';
export type PropertyType = 'HOTEL' | 'RESORT' | 'HOMESTAY' | 'VILLA' | 'BOUTIQUE';
export type CancellationPolicy = 'FLEXIBLE' | 'MODERATE' | 'STRICT';

export interface IHotelImage {
  url: string;
  publicId?: string;
  caption?: string;
  isPrimary?: boolean;
  order?: number;
}

export interface IHotelContact {
  phone: string;
  email: string;
  supportContact?: string;
}

export interface IHotel extends Document {
  name: string;
  slug: string;
  description: string;
  ownerUserId: mongoose.Types.ObjectId;
  adminUserIds: mongoose.Types.ObjectId[];
  address: string;
  locality: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  latitude?: number;
  longitude?: number;
  propertyType: PropertyType;
  amenities: string[];
  checkInTime: string;
  checkOutTime: string;
  cancellationPolicy: CancellationPolicy;
  contactInformation: IHotelContact;
  coverImage?: {
    url: string;
    publicId?: string;
    alt?: string;
  };
  images: IHotelImage[];
  verificationStatus: HotelVerificationStatus;
  listingStatus: HotelListingStatus;
  rejectionReason?: string;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  ratingAverage?: number;
  ratingCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

const HotelSchema = new Schema<IHotel>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    description: { type: String, required: true },
    ownerUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    adminUserIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    address: { type: String, required: true },
    locality: { type: String, required: true },
    city: { type: String, required: true, index: true },
    state: { type: String, required: true },
    country: { type: String, default: 'India' },
    postalCode: { type: String, required: true },
    latitude: { type: Number },
    longitude: { type: Number },
    propertyType: {
      type: String,
      enum: ['HOTEL', 'RESORT', 'HOMESTAY', 'VILLA', 'BOUTIQUE'],
      default: 'HOTEL',
    },
    amenities: [{ type: String }],
    checkInTime: { type: String, default: '14:00' },
    checkOutTime: { type: String, default: '11:00' },
    cancellationPolicy: {
      type: String,
      enum: ['FLEXIBLE', 'MODERATE', 'STRICT'],
      default: 'FLEXIBLE',
    },
    contactInformation: {
      phone: { type: String, required: true },
      email: { type: String, required: true },
      supportContact: { type: String },
    },
    coverImage: {
      url: { type: String },
      publicId: { type: String },
      alt: { type: String },
    },
    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String },
        caption: { type: String },
        isPrimary: { type: Boolean, default: false },
        order: { type: Number, default: 0 },
      },
    ],
    verificationStatus: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
      index: true,
    },
    listingStatus: {
      type: String,
      enum: ['DRAFT', 'PUBLISHED', 'SUSPENDED'],
      default: 'DRAFT',
      index: true,
    },
    rejectionReason: { type: String },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    ratingAverage: { type: Number, default: 4.5 },
    ratingCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

// Compound index for public search
HotelSchema.index({ verificationStatus: 1, listingStatus: 1, city: 1 });

export const Hotel: Model<IHotel> = mongoose.models.Hotel || mongoose.model<IHotel>('Hotel', HotelSchema);
