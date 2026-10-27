export interface DailyPriceItem {
  nightIndex: number;
  dateStr: string;
  formattedDate: string;
  pricePerNight: number;
  rooms: number;
  amount: number;
}

export interface GstBreakdown {
  taxRatePercent: number;
  cgstPercent: number;
  cgstAmount: number;
  sgstPercent: number;
  sgstAmount: number;
  totalGst: number;
}

export interface PriceCalculation {
  pricePerNight: number;
  numberOfNights: number;
  numberOfRooms: number;
  baseTotal: number;
  taxRatePercent: number;
  taxesAndFees: number;
  totalPrice: number;
  cgstAmount: number;
  sgstAmount: number;
  dailyBreakdown: DailyPriceItem[];
  gstBreakdown: GstBreakdown;
}

export function calculateBookingPrice(
  basePricePerNight: number,
  numberOfNights: number,
  numberOfRooms: number = 1,
  checkInDate?: string | Date
): PriceCalculation {
  if (basePricePerNight < 0) throw new Error('Base price cannot be negative');
  if (numberOfNights < 1) throw new Error('Stay must be at least 1 night');
  if (numberOfRooms < 1) throw new Error('Must book at least 1 room');

  const baseTotal = Math.round(basePricePerNight * numberOfNights * numberOfRooms);
  // Standard 12% GST for hotel stays
  const taxRatePercent = 12;
  const taxesAndFees = Math.round(baseTotal * (taxRatePercent / 100));
  const totalPrice = baseTotal + taxesAndFees;

  const cgstPercent = taxRatePercent / 2; // 6%
  const sgstPercent = taxRatePercent / 2; // 6%
  const cgstAmount = Math.round(taxesAndFees / 2);
  const sgstAmount = taxesAndFees - cgstAmount;

  const gstBreakdown: GstBreakdown = {
    taxRatePercent,
    cgstPercent,
    cgstAmount,
    sgstPercent,
    sgstAmount,
    totalGst: taxesAndFees,
  };

  // Generate day-by-day / night-by-night breakdown with formatted dates
  const dailyBreakdown: DailyPriceItem[] = [];
  const startDate = checkInDate ? new Date(checkInDate) : new Date();
  const validStart = isNaN(startDate.getTime()) ? new Date() : startDate;

  for (let i = 0; i < numberOfNights; i++) {
    const curDate = new Date(validStart);
    curDate.setDate(curDate.getDate() + i);
    const dateStr = curDate.toISOString().split('T')[0];
    const formattedDate = curDate.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    dailyBreakdown.push({
      nightIndex: i + 1,
      dateStr,
      formattedDate,
      pricePerNight: basePricePerNight,
      rooms: numberOfRooms,
      amount: Math.round(basePricePerNight * numberOfRooms),
    });
  }

  return {
    pricePerNight: basePricePerNight,
    numberOfNights,
    numberOfRooms,
    baseTotal,
    taxRatePercent,
    taxesAndFees,
    totalPrice,
    cgstAmount,
    sgstAmount,
    dailyBreakdown,
    gstBreakdown,
  };
}
