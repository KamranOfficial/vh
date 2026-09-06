import type { Room, HotelKey } from './rooms';

/** Booking & payment configuration. Taxes/fees are applied server-side too. */
export const booking = {
  currency: 'AED' as const,
  currencySymbol: 'AED',
  locale: 'en-AE',
  /** Municipality fee, % of room revenue (Abu Dhabi). */
  taxes: { vatRate: 0, serviceRate: 0, municipalityRate: 0.07, tourismDirhamPerNight: 20 },
  minNights: 1,
  maxNights: 30,
  maxGuests: 6,
} as const;

/** Validated booking request (server authoritative). */
export interface BookingInput {
  hotel: HotelKey;
  roomCode: string;
  checkIn: string; // ISO date YYYY-MM-DD
  checkOut: string; // ISO date YYYY-MM-DD
  adults: number;
  children: number;
  guest: { firstName: string; lastName: string; email: string; phone: string; notes?: string };
}

/** Price breakdown for a stay. All amounts in AED minor units (1 AED = 100). */
export interface PriceQuote {
  nights: number;
  nightlyRate: number;
  roomTotal: number; // nights * nightlyRate
  municipalityFee: number;
  tourismDirham: number;
  total: number; // charged amount, minor units
  currency: 'AED';
  label: string; // human label e.g. "2 nights · Deluxe King Room"
}

export function nightsBetween(checkIn: string, checkOut: string): number {
  const a = Date.parse(`${checkIn}T00:00:00`);
  const b = Date.parse(`${checkOut}T00:00:00`);
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  const diff = Math.round((b - a) / 86400000);
  return diff > 0 ? diff : 0;
}

/** Compute a server-authoritative price quote. Never trust a client amount. */
export function quote(room: Room, input: Pick<BookingInput, 'checkIn' | 'checkOut'>): PriceQuote | null {
  const nights = nightsBetween(input.checkIn, input.checkOut);
  if (nights < booking.minNights || nights > booking.maxNights) return null;
  const nightlyRate = room.pricePerNight;
  const roomTotal = nightlyRate * nights;
  const municipalityFee = Math.round(roomTotal * booking.taxes.municipalityRate);
  const tourismDirham = booking.taxes.tourismDirhamPerNight * nights;
  const total = roomTotal + municipalityFee + tourismDirham;
  return {
    nights,
    nightlyRate,
    roomTotal,
    municipalityFee,
    tourismDirham,
    total: Math.round(total),
    currency: 'AED',
    label: `${nights} night${nights > 1 ? 's' : ''} · ${room.name}`,
  };
}

export function formatAed(amount: number): string {
  return new Intl.NumberFormat(booking.locale, {
    style: 'currency',
    currency: booking.currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatAedMinor(minor: number): string {
  return formatAed(Math.round(minor));
}
