import { describe, it, expect } from 'vitest';
import { calculateBookingPrice } from '@/utils/pricing';

describe('IndiStay Royalty Club & 5-Slice Rewards System', () => {
  it('correctly calculates 100% free stay for 1-night booking when Royalty reward is applied', () => {
    const basePrice = 4500;
    const nights = 1;
    const rooms = 1;

    // Standard booking without royalty reward
    const regularPricing = calculateBookingPrice(basePrice, nights, rooms, '2026-11-01', false);
    expect(regularPricing.baseTotal).toBe(4500);
    expect(regularPricing.loyaltyDiscountAmount).toBe(0);
    expect(regularPricing.taxesAndFees).toBe(540); // 12% of 4500
    expect(regularPricing.totalPrice).toBe(5040);

    // With 5-slice Royalty 1-Day Free Stay applied
    const freePricing = calculateBookingPrice(basePrice, nights, rooms, '2026-11-01', true);
    expect(freePricing.baseTotal).toBe(4500);
    expect(freePricing.loyaltyDiscountAmount).toBe(4500);
    expect(freePricing.discountedBaseTotal).toBe(0);
    expect(freePricing.taxesAndFees).toBe(0); // 12% of 0
    expect(freePricing.totalPrice).toBe(0); // 100% Free room stay
    expect(freePricing.appliedLoyaltyFreeNight).toBe(true);
    expect(freePricing.dailyBreakdown[0].isLoyaltyFreeNight).toBe(true);
    expect(freePricing.dailyBreakdown[0].amount).toBe(0);
  });

  it('correctly discounts exactly 1 night base charges on a multi-night stay', () => {
    const basePrice = 6000;
    const nights = 3;
    const rooms = 1;

    // 3 nights with 1 free night reward
    const pricing = calculateBookingPrice(basePrice, nights, rooms, '2026-11-05', true);
    expect(pricing.baseTotal).toBe(18000);
    expect(pricing.loyaltyDiscountAmount).toBe(6000); // 1 night free
    expect(pricing.discountedBaseTotal).toBe(12000); // 2 nights charged
    expect(pricing.taxesAndFees).toBe(1440); // 12% of 12000
    expect(pricing.totalPrice).toBe(13440);
    expect(pricing.dailyBreakdown[0].isLoyaltyFreeNight).toBe(true);
    expect(pricing.dailyBreakdown[0].amount).toBe(0); // Night 1 is Free
    expect(pricing.dailyBreakdown[1].amount).toBe(6000); // Night 2 standard
    expect(pricing.dailyBreakdown[2].amount).toBe(6000); // Night 3 standard
  });

  it('correctly computes 5-slice progression milestones', () => {
    const computeSlices = (validStays: number) => {
      const earned = Math.floor(validStays / 5);
      const currentSlices = validStays % 5;
      const isRewardReady = earned > 0 || currentSlices === 5;
      const staysNeeded = isRewardReady ? 0 : 5 - currentSlices;
      return { currentSlices, isRewardReady, staysNeeded, earned };
    };

    expect(computeSlices(0)).toEqual({ currentSlices: 0, isRewardReady: false, staysNeeded: 5, earned: 0 });
    expect(computeSlices(1)).toEqual({ currentSlices: 1, isRewardReady: false, staysNeeded: 4, earned: 0 });
    expect(computeSlices(2)).toEqual({ currentSlices: 2, isRewardReady: false, staysNeeded: 3, earned: 0 });
    expect(computeSlices(3)).toEqual({ currentSlices: 3, isRewardReady: false, staysNeeded: 2, earned: 0 });
    expect(computeSlices(4)).toEqual({ currentSlices: 4, isRewardReady: false, staysNeeded: 1, earned: 0 });
    expect(computeSlices(5)).toEqual({ currentSlices: 0, isRewardReady: true, staysNeeded: 0, earned: 1 });
    expect(computeSlices(7)).toEqual({ currentSlices: 2, isRewardReady: true, staysNeeded: 0, earned: 1 });
  });
});
