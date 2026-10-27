import { describe, it, expect } from 'vitest';
import { containsPhoneNumber } from '../../src/utils/phone-filter';

describe('Phone Number Filter & Protection Engine', () => {
  it('detects standard 10-digit Indian mobile numbers', () => {
    expect(containsPhoneNumber('9876543210')).toBe(true);
    expect(containsPhoneNumber('Please call me at 9876543210 for details')).toBe(true);
  });

  it('detects phone numbers with country code and formatting', () => {
    expect(containsPhoneNumber('+91 98765 43210')).toBe(true);
    expect(containsPhoneNumber('+91-9876543210')).toBe(true);
    expect(containsPhoneNumber('09876543210')).toBe(true);
    expect(containsPhoneNumber('(987) 654-3210')).toBe(true);
  });

  it('detects evasively spaced-out phone numbers', () => {
    expect(containsPhoneNumber('9 8 7 6 5 4 3 2 1 0')).toBe(true);
    expect(containsPhoneNumber('contact 9 8 7 6 5-4 3 2 1 0')).toBe(true);
  });

  it('detects spelled-out numeric words', () => {
    expect(containsPhoneNumber('call nine eight seven six five four three two one zero')).toBe(true);
  });

  it('allows safe guest queries without phone numbers', () => {
    expect(containsPhoneNumber('Hello, what is the check-in time?')).toBe(false);
    expect(containsPhoneNumber('We will arrive at 11am on 25th Oct with 2 guests in room 101')).toBe(false);
    expect(containsPhoneNumber('Is airport pickup available at 4pm?')).toBe(false);
    expect(containsPhoneNumber('Can we get extra towels and twin beds?')).toBe(false);
    expect(containsPhoneNumber('Booking ref: INDY-2026-4')).toBe(false);
  });

  it('handles empty or non-string inputs safely', () => {
    expect(containsPhoneNumber('')).toBe(false);
    // @ts-expect-error testing invalid type input
    expect(containsPhoneNumber(null)).toBe(false);
  });
});
