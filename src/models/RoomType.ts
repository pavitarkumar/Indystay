import mongoose, { Schema, Document, Model } from 'mongoose';

export type RoomTypeStatus = 'ACTIVE' | 'INACTIVE';

export interface IRoomTypeImage {
  url: string;
  publicId?: string;
  caption?: string;
}

export interface IRoomType extends Document {
  hotelId: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  bedConfiguration: string;
  maxAdults: number;
  maxChildren: number;
  maxOccupancy: number;
  basePrice: number;
  currency: string;
  amenities: string[];
  sizeSqFt?: number;
  images: IRoomTypeImage[];
  status: RoomTypeStatus;
  createdAt: Date;
  updatedAt: Date;
}

const RoomTypeSchema = new Schema<IRoomType>(
  {
    hotelId: { type: Schema.Types.ObjectId, ref: 'Hotel', required: true, index: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true },
    description: { type: String },
    bedConfiguration: { type: String, required: true },
    maxAdults: { type: Number, required: true, min: 1 },
    maxChildren: { type: Number, default: 0, min: 0 },
    maxOccupancy: { type: Number, required: true, min: 1 },
    basePrice: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    amenities: [{ type: String }],
    sizeSqFt: { type: Number },
    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String },
        caption: { type: String },
      },
    ],
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index so room type names are unique within a hotel
RoomTypeSchema.index({ hotelId: 1, name: 1 }, { unique: true });

export const RoomType: Model<IRoomType> =
  mongoose.models.RoomType || mongoose.model<IRoomType>('RoomType', RoomTypeSchema);
