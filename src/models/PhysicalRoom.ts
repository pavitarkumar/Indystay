import mongoose, { Schema, Document, Model } from 'mongoose';

export type OperationalStatus = 'AVAILABLE' | 'MAINTENANCE' | 'OUT_OF_SERVICE';
export type HousekeepingStatus = 'CLEAN' | 'DIRTY' | 'CLEANING' | 'INSPECTED';

export interface IPhysicalRoomImage {
  url: string;
  caption?: string;
}

export interface IPhysicalRoom extends Document {
  hotelId: mongoose.Types.ObjectId;
  roomTypeId: mongoose.Types.ObjectId;
  roomNumber: string;
  floor: number;
  operationalStatus: OperationalStatus;
  housekeepingStatus: HousekeepingStatus;
  notes?: string;
  images?: IPhysicalRoomImage[];
  createdAt: Date;
  updatedAt: Date;
}

const PhysicalRoomSchema = new Schema<IPhysicalRoom>(
  {
    hotelId: { type: Schema.Types.ObjectId, ref: 'Hotel', required: true, index: true },
    roomTypeId: { type: Schema.Types.ObjectId, ref: 'RoomType', required: true, index: true },
    roomNumber: { type: String, required: true, trim: true },
    floor: { type: Number, required: true },
    operationalStatus: {
      type: String,
      enum: ['AVAILABLE', 'MAINTENANCE', 'OUT_OF_SERVICE'],
      default: 'AVAILABLE',
      index: true,
    },
    housekeepingStatus: {
      type: String,
      enum: ['CLEAN', 'DIRTY', 'CLEANING', 'INSPECTED'],
      default: 'CLEAN',
    },
    notes: { type: String },
    images: [
      {
        url: { type: String, required: true },
        caption: { type: String },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Enforce unique compound index on hotelId + roomNumber
PhysicalRoomSchema.index({ hotelId: 1, roomNumber: 1 }, { unique: true });
PhysicalRoomSchema.index({ hotelId: 1, roomTypeId: 1, operationalStatus: 1 });

export const PhysicalRoom: Model<IPhysicalRoom> =
  mongoose.models.PhysicalRoom || mongoose.model<IPhysicalRoom>('PhysicalRoom', PhysicalRoomSchema);
