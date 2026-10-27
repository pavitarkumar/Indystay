import mongoose, { Schema, Document, Model } from 'mongoose';

export type BookingStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'CHECKED_IN'
  | 'CHECKED_OUT';

export type PaymentStatus =
  | 'NOT_REQUIRED'
  | 'PENDING'
  | 'AUTHORIZED'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'FAILED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED';

export interface IPriceBreakdown {
  pricePerNight: number;
  numberOfNights: number;
  baseTotal: number;
  taxesAndFees: number;
  totalPrice: number;
}

export interface IGuestDetails {
  fullName: string;
  email: string;
  phone: string;
  specialRequests?: string;
}

export interface IBooking extends Document {
  bookingReference: string;
  customerId: mongoose.Types.ObjectId;
  hotelId: mongoose.Types.ObjectId;
  roomTypeId: mongoose.Types.ObjectId;
  assignedPhysicalRoomIds: mongoose.Types.ObjectId[];
  checkInDate: Date;
  checkOutDate: Date;
  adults: number;
  children: number;
  numberOfRooms: number;
  priceBreakdown: IPriceBreakdown;
  currency: string;
  bookingStatus: BookingStatus;
  paymentStatus: PaymentStatus;
  paymentReference?: string;
  paymentMethod?: string;
  advancePaymentAmount?: number;
  balanceDueAtHotel?: number;
  paymentTimestamp?: Date;
  appliedLoyaltyFreeNight?: boolean;
  loyaltyDiscountAmount?: number;
  guestDetails: IGuestDetails;
  cancellationReason?: string;
  cancellationTimestamp?: Date;
  rejectionReason?: string;
  acceptedBy?: mongoose.Types.ObjectId;
  acceptedAt?: Date;
  rejectedBy?: mongoose.Types.ObjectId;
  rejectedAt?: Date;
  checkedInAt?: Date;
  checkedOutAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    bookingReference: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    hotelId: { type: Schema.Types.ObjectId, ref: 'Hotel', required: true, index: true },
    roomTypeId: { type: Schema.Types.ObjectId, ref: 'RoomType', required: true, index: true },
    assignedPhysicalRoomIds: [{ type: Schema.Types.ObjectId, ref: 'PhysicalRoom' }],
    checkInDate: { type: Date, required: true, index: true },
    checkOutDate: { type: Date, required: true, index: true },
    adults: { type: Number, required: true, min: 1 },
    children: { type: Number, default: 0, min: 0 },
    numberOfRooms: { type: Number, required: true, default: 1, min: 1 },
    priceBreakdown: {
      pricePerNight: { type: Number, required: true },
      numberOfNights: { type: Number, required: true },
      baseTotal: { type: Number, required: true },
      taxesAndFees: { type: Number, required: true },
      totalPrice: { type: Number, required: true },
    },
    currency: { type: String, default: 'INR' },
    bookingStatus: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'EXPIRED', 'CHECKED_IN', 'CHECKED_OUT'],
      default: 'PENDING',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: [
        'NOT_REQUIRED',
        'PENDING',
        'AUTHORIZED',
        'PARTIALLY_PAID',
        'PAID',
        'FAILED',
        'REFUNDED',
        'PARTIALLY_REFUNDED',
      ],
      default: 'PENDING',
      index: true,
    },
    paymentReference: { type: String },
    paymentMethod: { type: String, default: 'RAZORPAY' },
    advancePaymentAmount: { type: Number },
    balanceDueAtHotel: { type: Number },
    paymentTimestamp: { type: Date },
    appliedLoyaltyFreeNight: { type: Boolean, default: false },
    loyaltyDiscountAmount: { type: Number, default: 0 },
    guestDetails: {
      fullName: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
      specialRequests: { type: String },
    },
    cancellationReason: { type: String },
    cancellationTimestamp: { type: Date },
    acceptedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    acceptedAt: { type: Date },
    rejectedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    rejectedAt: { type: Date },
    checkedInAt: { type: Date },
    checkedOutAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

// High performance compound indexes for availability and reporting queries
BookingSchema.index({ hotelId: 1, bookingStatus: 1, checkInDate: 1, checkOutDate: 1 });
BookingSchema.index({ roomTypeId: 1, bookingStatus: 1, checkInDate: 1, checkOutDate: 1 });
BookingSchema.index({ assignedPhysicalRoomIds: 1, bookingStatus: 1, checkInDate: 1, checkOutDate: 1 });

export const Booking: Model<IBooking> =
  mongoose.models.Booking || mongoose.model<IBooking>('Booking', BookingSchema);
