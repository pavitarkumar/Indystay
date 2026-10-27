import mongoose from 'mongoose';
import { User, IUser } from '@/models/User';
import { Booking } from '@/models/Booking';

export interface LoyaltySlice {
  sliceIndex: number; // 1 to 5
  isCompleted: boolean;
  label: string;
}

export interface CustomerLoyaltyData {
  userId: string;
  customerName: string;
  totalValidStays: number;
  currentSlices: number; // 0 to 5
  freeNightsAvailable: number;
  totalRewardsClaimed: number;
  staysNeededForNextReward: number;
  slices: LoyaltySlice[];
  isRewardReady: boolean;
  tierName: string;
}

/**
 * Calculate and retrieve real-time Royalty Club status for a customer.
 * 5 valid stays = 1 Day FREE room stay on ANY room in India!
 */
export async function getCustomerLoyalty(userId: string): Promise<CustomerLoyaltyData> {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error('Invalid user ID provided');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new Error('Customer account not found');
  }

  // Count customer's valid bookings (ACCEPTED, CHECKED_IN, CHECKED_OUT, or non-cancelled bookings)
  const customerBookings = await Booking.find({
    customerId: user._id,
    bookingStatus: { $in: ['ACCEPTED', 'CHECKED_IN', 'CHECKED_OUT', 'PENDING'] },
  }).lean();

  const totalValidStays = Math.max(
    customerBookings.length,
    user.loyalty?.completedBookingsCount || 0
  );

  const claimedRewards = customerBookings.filter(
    (b) => b.appliedLoyaltyFreeNight === true
  ).length;

  const totalClaimed = Math.max(claimedRewards, user.loyalty?.totalRewardsClaimed || 0);

  // Every 5 stays unlocks 1 Free Day Stay
  const totalEarnedRewards = Math.floor(totalValidStays / 5);
  const extraGranted = user.loyalty?.freeNightsAvailable || 0;
  const freeNightsAvailable = Math.max(0, totalEarnedRewards - totalClaimed + extraGranted);

  // Slices: 0 to 5
  let currentSlices = totalValidStays % 5;
  if (freeNightsAvailable > 0 && currentSlices === 0 && totalValidStays >= 5) {
    currentSlices = 5;
  }

  const slices: LoyaltySlice[] = [1, 2, 3, 4, 5].map((index) => ({
    sliceIndex: index,
    isCompleted: index <= currentSlices,
    label: `Stay #${index}`,
  }));

  const isRewardReady = freeNightsAvailable > 0 || currentSlices === 5;
  const staysNeededForNextReward = isRewardReady ? 0 : 5 - currentSlices;

  // Royalty Tier Name
  let tierName = 'Silver Member';
  if (totalValidStays >= 15) tierName = 'Imperial Diamond Elite';
  else if (totalValidStays >= 10) tierName = 'Platinum Royalty';
  else if (totalValidStays >= 5) tierName = 'Gold Royalty Member';

  return {
    userId: user._id.toString(),
    customerName: user.name,
    totalValidStays,
    currentSlices,
    freeNightsAvailable,
    totalRewardsClaimed: totalClaimed,
    staysNeededForNextReward,
    slices,
    isRewardReady,
    tierName,
  };
}

/**
 * Redeem 1 Free Night Reward upon booking
 */
export async function redeemCustomerFreeNight(userId: string): Promise<void> {
  const user = await User.findById(userId);
  if (!user) throw new Error('Customer account not found');

  if (!user.loyalty) {
    user.loyalty = {
      completedBookingsCount: 0,
      freeNightsAvailable: 0,
      totalRewardsClaimed: 0,
    };
  }

  user.loyalty.totalRewardsClaimed = (user.loyalty.totalRewardsClaimed || 0) + 1;
  if (user.loyalty.freeNightsAvailable && user.loyalty.freeNightsAvailable > 0) {
    user.loyalty.freeNightsAvailable -= 1;
  }
  await user.save();
}

/**
 * Add a simulated stay for demo / testing Royalty 5-slice wheel
 */
export async function addSimulatedStay(userId: string): Promise<CustomerLoyaltyData> {
  const user = await User.findById(userId);
  if (!user) throw new Error('Customer account not found');

  if (!user.loyalty) {
    user.loyalty = {
      completedBookingsCount: 0,
      freeNightsAvailable: 0,
      totalRewardsClaimed: 0,
    };
  }

  user.loyalty.completedBookingsCount = (user.loyalty.completedBookingsCount || 0) + 1;
  if (user.loyalty.completedBookingsCount % 5 === 0) {
    user.loyalty.freeNightsAvailable = (user.loyalty.freeNightsAvailable || 0) + 1;
  }
  await user.save();

  return getCustomerLoyalty(userId);
}
