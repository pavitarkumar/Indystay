import { describe, it, expect } from 'vitest';
import { calculateNights, areIntervalsOverlapping, parseDateOnly } from '../../src/utils/date';

describe('Stay Interval and Overlap Engine', () => {
  it('calculates nights correctly between dates', () => {
    const checkIn = '2026-11-01';
    const checkOut = '2026-11-05';
    expect(calculateNights(checkIn, checkOut)).toBe(4);
  });

  it('detects overlapping dates when stay periods intersect', () => {
    // Existing booking: Nov 10 to Nov 15
    const existingIn = '2026-11-10';
    const existingOut = '2026-11-15';

    // Requested booking: Nov 12 to Nov 17 (Overlaps Nov 12 - 15)
    expect(areIntervalsOverlapping(existingIn, existingOut, '2026-11-12', '2026-11-17')).toBe(true);

    // Requested booking: Nov 08 to Nov 11 (Overlaps Nov 10 - 11)
    expect(areIntervalsOverlapping(existingIn, existingOut, '2026-11-08', '2026-11-11')).toBe(true);

    // Requested booking entirely inside: Nov 11 to Nov 13
    expect(areIntervalsOverlapping(existingIn, existingOut, '2026-11-11', '2026-11-13')).toBe(true);
  });

  it('allows same-day turnaround: guest checking in on checkout date is NOT overlapping', () => {
    // Existing booking: Nov 10 to Nov 15
    const existingIn = '2026-11-10';
    const existingOut = '2026-11-15';

    // New guest checking in Nov 15 and checking out Nov 18
    // Should NOT overlap because existing stay is [Nov 10, Nov 15)
    expect(areIntervalsOverlapping(existingIn, existingOut, '2026-11-15', '2026-11-18')).toBe(false);

    // New guest checking out on Nov 10 (stay: Nov 05 to Nov 10)
    // Should NOT overlap
    expect(areIntervalsOverlapping(existingIn, existingOut, '2026-11-05', '2026-11-10')).toBe(false);
  });

  it('correctly normalizes dates across timezones to UTC midnight', () => {
    const d1 = parseDateOnly('2026-12-25T14:30:00Z');
    const d2 = parseDateOnly('2026-12-25');
    expect(d1.getTime()).toBe(d2.getTime());
  });
});
