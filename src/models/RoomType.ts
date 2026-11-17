import mongoose, { Schema, Document, Model } from 'mongoose';

export type RoomTypeStatus = 'ACTIVE' | 'INACTIVE';

export interface IRoomTypeImage {
  url: string;
  publicId?: string;
  caption?: string;
}

export interface IPanoramaHotspot {
  pitch: number;
  yaw: number;
  label: string;
  description?: string;
}

export interface IPanoramaScene {
  url: string;
  sceneName: string;
  sceneId: string;
  order: number;
  description?: string;
  hotspots?: IPanoramaHotspot[];
}

export interface IModel3D {
  url: string;
  thumbnailUrl?: string;
  description?: string;
  config?: Record<string, unknown>;
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
  // Virtual tour assets (optional — existing rooms unaffected)
  panoramas?: IPanoramaScene[];
  model3d?: IModel3D | null;
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
    // 360° panorama scenes — optional, additive
    panoramas: [
      {
        url: { type: String, required: true },
        sceneName: { type: String, required: true },
        sceneId: { type: String, required: true },
        order: { type: Number, default: 0 },
        description: { type: String },
        hotspots: [
          {
            pitch: { type: Number, required: true },
            yaw: { type: Number, required: true },
            label: { type: String, required: true },
            description: { type: String },
          },
        ],
      },
    ],
    // 3D model — optional, additive
    model3d: {
      url: { type: String },
      thumbnailUrl: { type: String },
      description: { type: String },
      config: { type: Schema.Types.Mixed },
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
