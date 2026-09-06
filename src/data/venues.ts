export interface Venue {
  name: string;
  kind: string;
  hours: string;
  image: string;
  blurb: string;
  meta?: { label: string; value: string; href?: string }[];
}

export const grandVenues: Venue[] = [
  {
    name: 'All Day Dining Restaurant',
    kind: 'International · 16th floor',
    hours: 'Open 24 / 7',
    image: 'gv-dining-wide.webp',
    blurb:
      'Your go-to destination on the 16th floor, serving guests around the clock with a diverse selection of international dishes — from hearty breakfasts to late-night snacks, prepared with the finest ingredients.',
    meta: [{ label: 'Floor', value: '16' }],
  },
  {
    name: 'Lobby Café',
    kind: 'Coffee & pâtisserie · featuring Costa Coffee',
    hours: 'Daily 07:00 – 01:00',
    image: 'gv-dining-tables.webp',
    blurb:
      'A cozy corner in the heart of the hotel serving Costa Coffee — a quick espresso, a frothy cappuccino or a signature blend, alongside freshly baked pastries and indulgent treats.',
  },
  {
    name: 'Hummer Club',
    kind: 'Nightclub · 15th floor',
    hours: 'Daily 11:00 – 04:00',
    image: 'gv-hummer-club.webp',
    blurb:
      'The ultimate nightlife destination for party-goers in Abu Dhabi. World-class DJs, live performances and themed parties under state-of-the-art sound and lighting, with exclusive VIP areas.',
    meta: [{ label: 'Floor', value: '15' }],
  },
];

export const villageVenues: Venue[] = [
  {
    name: 'Villaggio Restaurant & Café',
    kind: 'Arabic cuisine',
    hours: 'Daily 07:00 – 02:00',
    image: 'vh-restaurant-hall.webp',
    blurb:
      'A family-friendly dining destination where delightful cuisine meets a serene ambiance. Choose spacious indoor seating or dine outdoors overlooking the sparkling pool and lush garden while the children play safely nearby.',
    meta: [{ label: 'Reservations', value: '+971 50 499 2099', href: 'tel:+971504992099' }],
  },
  {
    name: 'Sahriya Gourmet Restaurant',
    kind: 'Mediterranean & international',
    hours: 'Open 24 / 7',
    image: 'vh-restaurant-buffet.webp',
    blurb:
      'All-day dining in a warm and inviting setting, with a wide array of international cuisine — hearty breakfasts through to late-night plates, crafted with the finest ingredients.',
    meta: [{ label: 'Reservations', value: '+971 2 499 2077', href: 'tel:+97124992077' }],
  },
  {
    name: 'Hoods Resto & Bar',
    kind: 'Mediterranean · resto bar',
    hours: 'Daily 11:00 – 04:00',
    image: 'vh-restaurant-lounge.webp',
    blurb:
      'Founded in 2021 and now a neighbourhood favourite — great food, refreshing drinks, billiards and darts, live bands and DJs. Every visit is a celebration.',
    meta: [{ label: 'Reservations', value: '+971 50 676 8198', href: 'tel:+971506768198' }],
  },
  {
    name: 'Cubes Club',
    kind: 'Nightclub',
    hours: 'Daily 11:00 – 04:00',
    image: 'vh-restaurant-seating.webp',
    blurb:
      'An international haven of music, entertainment and sophistication. World-class DJs, live performances and signature cocktails in an intimate yet energetic setting.',
  },
];

export interface Facility {
  name: string;
  hours?: string;
  image: string;
  blurb: string;
  points?: string[];
  meta?: { label: string; value: string; href?: string }[];
}

export const grandFacilities: Facility[] = [
  {
    name: 'Fitness & Wellness Club',
    hours: 'Daily 08:00 – 24:00',
    image: 'gv-gym-floor.webp',
    blurb:
      'A premier fitness destination on the 16th floor, right in front of the sparkling swimming pool. Brand-new machines for cardio, strength and functional training, with professional personal trainers and personalised programmes.',
    points: ['Cardio & strength floors', 'Functional training zone', 'Professional personal trainers', 'Poolside setting, 16th floor'],
  },
  {
    name: 'Swimming Pool',
    hours: 'Daily 08:00 – 21:00',
    image: 'gv-pool.webp',
    blurb:
      'A sparkling indoor pool on the 16th floor, framed by daybeds and floor-to-ceiling light — the calmest room in the tower.',
  },
  {
    name: 'Belle Care Luxury Spa',
    hours: 'Daily 10:00 – 24:00 · M floor',
    image: 'gv-spa-treatment.webp',
    blurb:
      'True luxury is not about extravagance — it is about an experience that is both memorable and rejuvenating. Highly trained therapists combine techniques to target muscle tension or simply help you unwind.',
    points: ['Massages & full-body treatments', 'Facials & body wraps', 'Custom-tailored packages'],
    meta: [{ label: 'Bookings', value: '+971 56 552 0999', href: 'tel:+971565520999' }],
  },
  {
    name: 'Ruspa European Spa',
    hours: 'Daily 10:00 – 01:00',
    image: 'gv-spa-lounge.webp',
    blurb:
      'Traditional Russian spa rituals combined with modern techniques — a refreshing banya session, a soothing massage or a luxurious facial in a tranquil oasis.',
    points: ['Banya sessions', 'Massage & facials', 'Gentlemen’s spa'],
  },
  {
    name: 'Meeting Rooms',
    image: 'gv-meeting-boardroom.webp',
    blurb:
      'Versatile, elegantly designed rooms for corporate seminars, brainstorming sessions and private business meetings — advanced audiovisual technology, high-speed Wi-Fi and flexible seating, with a dedicated events team and customisable catering.',
    points: ['Advanced AV technology', 'High-speed Wi-Fi', 'Flexible seating layouts', 'Customisable catering'],
  },
];

export const villageFacilities: Facility[] = [
  {
    name: 'Swimming Pools',
    hours: 'Daily 08:00 – 19:00',
    image: 'vh-pool-wide.webp',
    blurb:
      'A refreshing escape surrounded by lush trees and vibrant greenery — a tranquil main pool and a dedicated kids’ pool, with a poolside bar serving hot and cold drinks through the day.',
    points: ['Main outdoor pool', 'Dedicated children’s pool', 'Poolside bar', 'Garden setting'],
  },
  {
    name: 'Kids’ Playground',
    hours: 'Daily 08:00 – 24:00',
    image: 'vh-kids-playground.webp',
    blurb:
      'A vibrant, safe playground packed with activities — the perfect spot for children to laugh, learn and create unforgettable memories while the grown-ups relax. Evening entertainment and a kids’ club run alongside it.',
    points: ['Covered soft-play area', 'Kids’ club & activities', 'Evening entertainment', 'Steps from the children’s pool'],
  },
];

export interface Amenity {
  name: string;
  hours?: string;
  blurb: string;
  meta?: { label: string; value: string; href?: string }[];
}

export const villageAmenities: Amenity[] = [
  {
    name: 'Villaggio Fitness Club',
    hours: 'Daily 08:00 – 24:00',
    blurb:
      'Located by the sparkling swimming pool, the gym offers state-of-the-art equipment and expert male and female personal trainers for cardio, strength and functional fitness.',
  },
  {
    name: 'Business Centre',
    hours: 'Open 24 / 7',
    blurb:
      'A quiet, efficient workspace with high-speed internet, printing and scanning services and state-of-the-art meeting facilities — for finalising a presentation or running virtual meetings.',
  },
  {
    name: 'Meeting Rooms',
    hours: 'By arrangement',
    blurb:
      'Versatile rooms designed to host business and social gatherings with style and efficiency, equipped with modern technology and fully customisable setups.',
  },
  {
    name: 'GLOW Beauty Center',
    hours: 'Daily 09:00 – 21:00 · Villa 5',
    blurb:
      'An elite ladies’ beauty salon across four floors with more than 80 beauty experts from around the world, premium products and a single common goal — to make you beautiful, confident and happy.',
  },
  {
    name: 'Montenegro Gents Salon',
    hours: 'Daily 10:00 – 23:00',
    blurb:
      'A barbershop founded to redefine personalised hair, nail and skin care — skilled artists, international standards and refined products, for a weekly self-care ritual worth keeping.',
  },
];
