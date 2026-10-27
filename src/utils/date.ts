/**
 * Date and stay interval utilities.
 * All stays are modeled on the half-open interval [checkIn, checkOut).
 */

export function parseDateOnly(dateStrOrObj: string | Date): Date {
  const d = new Date(dateStrOrObj);
  if (isNaN(d.getTime())) {
    throw new Error(`Invalid date string: ${dateStrOrObj}`);
  }
  // Normalize to UTC midnight for date-only comparison
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

export function calculateNights(checkIn: Date | string, checkOut: Date | string): number {
  const d1 = parseDateOnly(checkIn);
  const d2 = parseDateOnly(checkOut);
  const diffMs = d2.getTime() - d1.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

/**
 * Check if two stay intervals [start1, end1) and [start2, end2) overlap.
 * Overlap condition: start1 < end2 AND end1 > start2.
 */
export function areIntervalsOverlapping(
  start1: Date | string,
  end1: Date | string,
  start2: Date | string,
  end2: Date | string
): boolean {
  const s1 = parseDateOnly(start1).getTime();
  const e1 = parseDateOnly(end1).getTime();
  const s2 = parseDateOnly(start2).getTime();
  const e2 = parseDateOnly(end2).getTime();

  return s1 < e2 && e1 > s2;
}

export function formatDateYYYYMMDD(date: Date): string {
  return date.toISOString().split('T')[0];
}
