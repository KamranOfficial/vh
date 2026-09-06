// @ts-check
/**
 * Server-authoritative room catalog & pricing for the Worker.
 * KEEP IN SYNC with src/data/rooms.ts (pricePerNight) and src/data/booking.ts (taxes).
 * The Worker never trusts a client-supplied amount — it recomputes the total here.
 */

export const prices = {
  // Grand Villaggio
  'grand-deluxe-king': 690,
  'grand-deluxe-twin': 690,
  'grand-suite-king': 1090,
  'grand-accessible': 690,
  // Villaggio Hotel
  'village-standard': 390,
  'village-superior': 490,
  'village-deluxe-king': 590,
  'village-deluxe-twin': 590,
  'village-junior-suite': 790,
  'village-deluxe-suite': 990,
  'village-executive-suite': 1290,
  'village-royal-suite': 1890,
  'village-accessible': 590,
};

const TAXES = { municipalityRate: 0.07, tourismDirhamPerNight: 20 };
const MIN_NIGHTS = 1;
const MAX_NIGHTS = 30;
const MAX_GUESTS = 6;

const HOTELS = new Set(['grand', 'village']);

function nightsBetween(checkIn, checkOut) {
  const a = Date.parse(`${checkIn}T00:00:00`);
  const b = Date.parse(`${checkOut}T00:00:00`);
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  const diff = Math.round((b - a) / 86400000);
  return diff > 0 ? diff : 0;
}

export function quote(room, input) {
  const nights = nightsBetween(input.checkIn, input.checkOut);
  if (nights < MIN_NIGHTS || nights > MAX_NIGHTS) return null;
  const nightlyRate = room.pricePerNight;
  const roomTotal = nightlyRate * nights;
  const municipalityFee = Math.round(roomTotal * TAXES.municipalityRate);
  const tourismDirham = TAXES.tourismDirhamPerNight * nights;
  const total = Math.round(roomTotal + municipalityFee + tourismDirham);
  return {
    nights, nightlyRate, roomTotal, municipalityFee, tourismDirham, total,
    currency: 'AED',
    label: `${nights} night${nights > 1 ? 's' : ''} · ${room.name}`,
  };
}

/** Validate and normalize a booking request. Returns { ok, value | error }. */
export function validateBooking(body) {
  if (!body || typeof body !== 'object') return { ok: false, error: 'no body' };
  const hotel = String(body.hotel);
  const roomCode = String(body.roomCode);
  const checkIn = String(body.checkIn || '');
  const checkOut = String(body.checkOut || '');
  const adults = Number(body.adults) || 1;
  const children = Number(body.children) || 0;
  const guest = body.guest || {};

  if (!HOTELS.has(hotel)) return { ok: false, error: 'invalid hotel' };
  const price = prices[roomCode];
  if (!price) return { ok: false, error: 'invalid room' };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(checkIn) || !/^\d{4}-\d{2}-\d{2}$/.test(checkOut)) return { ok: false, error: 'invalid dates' };
  if (adults < 1 || adults + children > MAX_GUESTS) return { ok: false, error: 'invalid guest count' };

  const email = String(guest.email || '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: 'invalid email' };
  if (!String(guest.firstName || '').trim() || !String(guest.lastName || '').trim()) return { ok: false, error: 'missing name' };

  return {
    ok: true,
    value: {
      room: { code: roomCode, name: String(body.roomName || roomCode), pricePerNight: price },
      input: {
        hotel, roomCode, checkIn, checkOut, adults, children,
        guest: {
          firstName: String(guest.firstName).trim(),
          lastName: String(guest.lastName).trim(),
          email,
          phone: String(guest.phone || '').trim(),
          notes: String(guest.notes || '').trim().slice(0, 500),
        },
      },
    },
  };
}
