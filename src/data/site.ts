export const site = {
  name: 'Villaggio Hotels & Resorts',
  short: 'Villaggio',
  founded: 2019,
  phone: '+971 2 499 2000',
  phoneHref: 'tel:+97124992000',
  email: 'info@villaggiohotels.ae',
  address: 'Al Salam St — Al Nahyan, Abu Dhabi, United Arab Emirates',
  hours: 'Reception open 24 / 7',
  description:
    'Two Abu Dhabi addresses — a garden village retreat and a 4-star city tower — run by one family of hoteliers since 2019.',
};

export const hotels = {
  grand: {
    slug: 'grand-villaggio',
    name: 'Grand Villaggio Hotel',
    tagline: 'A 4-star tower in the heart of the capital',
    stars: 4,
    rooms: 132,
    email: 'info.gvh@villaggiohotels.ae',
    address: 'Khadeejah Bint Khuwaylid St, W14-02, Al Manhal, Abu Dhabi',
    mapQuery: 'Grand+Villaggio+Hotel+Abu+Dhabi',
    checkIn: '2:00 pm',
    checkOut: '12:00 pm',
    intro:
      'An elegant 4-star hotel in the heart of Abu Dhabi city, minutes from Sheikh Zayed Grand Mosque, the Corniche, ADNEC and the capital’s shopping malls. Modern decor and casual settings create a sense of calm across 132 contemporary rooms, world-class dining venues and the latest meeting and events facilities.',
  },
  village: {
    slug: 'villaggio',
    name: 'Villaggio Hotel',
    tagline: 'A garden village hidden inside the city',
    stars: 4,
    rooms: 130,
    email: 'info.vh@villaggiohotels.ae',
    address: 'Al Salam Street, Al Nahyan, Abu Dhabi',
    mapQuery: 'Villaggio+Hotel+Abu+Dhabi+Al+Salam+Street',
    checkIn: '2:00 pm',
    checkOut: '12:00 pm',
    intro:
      'Nestled in a serene, uncrowded corner of Abu Dhabi, Villaggio Hotel is a distinctive escape from the city’s bustle. Designed with village-inspired charm, this boutique resort spreads across separate villas with aramid ceilings, rich woodwork and natural stone — every corridor lined with flowers and flourishing trees.',
  },
} as const;

export const nav = [
  { label: 'Grand Villaggio', href: '/grand-villaggio' },
  { label: 'Villaggio Hotel', href: '/villaggio' },
  { label: 'Gallery', href: '/gallery' },
  { label: 'Abu Dhabi', href: '/experience-abu-dhabi' },
  { label: 'Sustainability', href: '/sustainability' },
  { label: 'Contact', href: '/contact' },
];

export const bookHref = '/book';
export const bookingLinks = {
  grand: '/book?hotel=grand',
  village: '/book?hotel=village',
};
