import mongoose, { Schema, Document, Model } from 'mongoose';

export type UserRole = 'SUPER_ADMIN' | 'HOTEL_ADMIN' | 'CUSTOMER';
export type AccountStatus = 'ACTIVE' | 'SUSPENDED';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  phone?: string;
  role: UserRole;
  accountStatus: AccountStatus;
  emailVerifiedAt?: Date | null;
  assignedHotelId?: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    phone: { type: String, trim: true },
    role: {
      type: String,
      enum: ['SUPER_ADMIN', 'HOTEL_ADMIN', 'CUSTOMER'],
      default: 'CUSTOMER',
      index: true,
    },
    accountStatus: {
      type: String,
      enum: ['ACTIVE', 'SUSPENDED'],
      default: 'ACTIVE',
      index: true,
    },
    emailVerifiedAt: { type: Date, default: null },
    assignedHotelId: { type: Schema.Types.ObjectId, ref: 'Hotel', default: null, index: true },
  },
  {
    timestamps: true,
  }
);

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
