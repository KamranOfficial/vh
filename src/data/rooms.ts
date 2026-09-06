export interface Room {
  name: string;
  size: string;
  bed: string;
  image: string;
  blurb: string;
  amenities: string[];
}

const shared = [
  'Free Wi-Fi',
  'Air conditioning',
  'Minibar',
  'Safety deposit box',
  'Desk & seating area',
  'Electric kettle, coffee & tea',
  'Hairdryer, iron & wake-up service',
  'Slippers & free toiletries',
];

export const grandRooms: Room[] = [
  {
    name: 'Deluxe King Room',
    size: '32 m²',
    bed: '1 extra-large double bed',
    image: 'gv-room-king.webp',
    blurb:
      'A spacious room with a full bathroom and bath tub, dressed in warm neutrals with capital views from the upper floors.',
    amenities: ['Bath tub', 'Smart 50-inch LED TV', 'Cable channels', 'Bathrobe & slippers', ...shared],
  },
  {
    name: 'Deluxe Twin Room',
    size: '32 m²',
    bed: '2 single beds',
    image: 'gv-room-twin.webp',
    blurb:
      'The same generous footprint arranged for two, with a bath tub, free Italian toiletries and a wide work desk.',
    amenities: [
      'Bath tub',
      'Smart 50-inch LED TV',
      'Satellite channels',
      'Free Italian toiletries',
      'Two complimentary bottles of water',
      ...shared,
    ],
  },
  {
    name: 'Deluxe Suite King',
    size: '51 m²',
    bed: '1 extra-large double bed',
    image: 'gv-room-suite-living.webp',
    blurb:
      'An open-plan living and dining area, a sofa lounge and two luxury bathrooms — one with a bath tub, one with a walk-in shower.',
    amenities: [
      'Two bathrooms',
      'Walk-in shower & bath tub',
      'Two smart 50-inch LED TVs',
      'Sofa lounge',
      'Free Italian toiletries',
      ...shared,
    ],
  },
  {
    name: 'People of Determination Room',
    size: '32 m²',
    bed: 'On request',
    image: 'gv-room-king.webp',
    blurb:
      'Designed with accessibility and comfort in mind — grab bars, an accessible walk-in shower and easy-to-use controls throughout.',
    amenities: ['Grab bars', 'Accessible walk-in shower', 'Easy-to-use controls', 'Smart 50-inch LED TV', ...shared],
  },
];

export const villageRooms: Room[] = [
  {
    name: 'Standard Room',
    size: '20 m²',
    bed: '1 queen bed',
    image: 'vh-room-standard.jpg',
    blurb: 'A compact, quiet room with a walk-in shower — the simplest way into the village.',
    amenities: ['Walk-in shower', 'LED TV', 'Cable channels', ...shared],
  },
  {
    name: 'Superior Room',
    size: '30 m²',
    bed: '1 extra-large double bed',
    image: 'vh-room-superior.jpg',
    blurb: 'A spacious, modern room with a walk-in shower, bathrobe and a proper writing desk.',
    amenities: ['Walk-in shower', 'Bathrobe', 'LED TV', 'Cable channels', ...shared],
  },
  {
    name: 'Deluxe King Room',
    size: '38 m²',
    bed: '1 extra-large double bed',
    image: 'vh-room-deluxe-king.jpg',
    blurb: 'Extra space and a full bathroom with a bath tub, overlooking the gardens or courtyards.',
    amenities: ['Bath tub', 'Bathrobe', 'LED TV', ...shared],
  },
  {
    name: 'Deluxe Twin Room',
    size: '38 m²',
    bed: '2 single beds',
    image: 'vh-room-deluxe-twin.jpg',
    blurb: 'A twin layout with the same 38 m² footprint, bath tub and separate seating area.',
    amenities: ['Bath tub', 'Shower', 'Bathrobe', 'LED TV', ...shared],
  },
  {
    name: 'Junior Suite',
    size: '39 m²',
    bed: '1 extra-large double bed',
    image: 'vh-suite-deluxe.jpg',
    blurb:
      'Dual-purpose living and work space in an open style, with a generous two-seater sofa and a small private terrace.',
    amenities: ['Private terrace', 'Two-seater sofa', 'Walk-in shower', 'LED TV', ...shared],
  },
  {
    name: 'Deluxe Suite',
    size: '46 m²',
    bed: '1 extra-large double bed',
    image: 'vh-room-deluxe-king.jpg',
    blurb:
      'An open-plan living and dining area with a three-seater sofa and a luxury bathroom with bath tub.',
    amenities: ['Bath tub', 'Three-seater sofa', 'Flat-screen TV', 'Open-plan living & dining', ...shared],
  },
  {
    name: 'Executive Suite',
    size: '62 m²',
    bed: '1 king-size bed',
    image: 'vh-suite-executive.jpg',
    blurb:
      'A large bedroom with bath tub plus a separate living and dining unit with a seven-piece sofa, chaise lounge and dining table for four. One executive suite is adapted for guests with reduced mobility.',
    amenities: [
      'Separate living & dining room',
      'Seven-piece sofa & chaise lounge',
      'Dining table for four',
      'Bath tub',
      'Flat-screen TV',
      ...shared,
    ],
  },
  {
    name: 'Royal Suite with Private Pool',
    size: '55 m²',
    bed: '1 king-size bed',
    image: 'vh-suite-royal.webp',
    blurb:
      'The village’s signature stay — a private pool off the living room, a five-seater sofa, dining table and a 65-inch screen.',
    amenities: [
      'Private pool',
      'Five-seater sofa',
      'Dining table',
      '65-inch flat-screen TV',
      'Walk-in shower',
      ...shared,
    ],
  },
  {
    name: 'People of Determination Room',
    size: '38 – 62 m²',
    bed: 'On request',
    image: 'vh-room-deluxe-twin.jpg',
    blurb:
      'An inclusive, welcoming space with grab bars, an accessible shower and user-friendly controls for a seamless stay.',
    amenities: ['Grab bars', 'Accessible walk-in shower', 'User-friendly controls', 'Smart 50-inch LED TV', ...shared],
  },
];
