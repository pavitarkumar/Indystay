import { describe, it, expect } from 'vitest';
import { calculateBookingPrice } from '../../src/utils/pricing';

describe('Pricing Calculation Engine', () => {
  it('calculates price for single room, single night correctly with 12% GST', () => {
    const result = calculateBookingPrice(5000, 1, 1);
    expect(result.pricePerNight).toBe(5000);
    expect(result.numberOfNights).toBe(1);
    expect(result.numberOfRooms).toBe(1);
    expect(result.baseTotal).toBe(5000);
    expect(result.taxRatePercent).toBe(12);
    expect(result.taxesAndFees).toBe(600); // 12% of 5000
    expect(result.totalPrice).toBe(5600);
  });

  it('calculates price for multiple rooms and multiple nights correctly', () => {
    const result = calculateBookingPrice(4000, 3, 2);
    // 4000 * 3 nights * 2 rooms = 24,000 base
    expect(result.baseTotal).toBe(24000);
    expect(result.taxesAndFees).toBe(2880); // 12% of 24000
    expect(result.totalPrice).toBe(26880);
  });

  it('throws error when base price is negative', () => {
    expect(() => calculateBookingPrice(-100, 1, 1)).toThrow('Base price cannot be negative');
  });

  it('throws error when nights is less than 1', () => {
    expect(() => calculateBookingPrice(1000, 0, 1)).toThrow('Stay must be at least 1 night');
  });

  it('throws error when rooms is less than 1', () => {
    expect(() => calculateBookingPrice(1000, 2, 0)).toThrow('Must book at least 1 room');
  });
});
