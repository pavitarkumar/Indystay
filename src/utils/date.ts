/**
 * Date and stay interval utilities.
 * All stays are modeled on the half-open interval [checkIn, checkOut).
 */

export function parseDateOnly(dateStrOrObj: string | Date): Date {
  if (dateStrOrObj instanceof Date) {
    if (isNaN(dateStrOrObj.getTime())) {
      throw new Error('Invalid Date object');
    }
    return new Date(Date.UTC(dateStrOrObj.getUTCFullYear(), dateStrOrObj.getUTCMonth(), dateStrOrObj.getUTCDate(), 0, 0, 0, 0));
  }

  const str = String(dateStrOrObj || '').trim();
  if (!str) {
    throw new Error('Empty date string');
  }

  // 1. DD-MM-YYYY or DD/MM/YYYY (e.g., "30-10-2026", "02-11-2026", "30/10/2026")
  const dmyMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    const year = parseInt(dmyMatch[3], 10);
    return new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
  }

  // 2. YYYY-MM-DD or YYYY/MM/DD (e.g. "2026-10-30")
  const ymdMatch = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10) - 1;
    const day = parseInt(ymdMatch[3], 10);
    return new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
  }

  const d = new Date(str);
  if (isNaN(d.getTime())) {
    throw new Error(`Invalid date string: ${dateStrOrObj}`);
  }
  // Normalize to UTC midnight for date-only comparison
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

export function normalizeDateString(dateStrOrObj?: string | Date): string {
  if (!dateStrOrObj) return '';
  try {
    const d = parseDateOnly(dateStrOrObj);
    return formatDateYYYYMMDD(d);
  } catch {
    return typeof dateStrOrObj === 'string' ? dateStrOrObj : '';
  }
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
