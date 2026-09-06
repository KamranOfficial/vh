# Villaggio Hotels & Resorts — official website

Static marketing site for Villaggio Hotels & Resorts (Abu Dhabi), covering the group
and both properties: **Grand Villaggio Hotel** (132 rooms, Al Manhal) and
**Villaggio Hotel** (130 rooms, Al Salam Street).

Content and photography were sourced from the group's own site and its Booking.com
listings:

- https://villaggiohotels.ae/
- https://www.booking.com/hotel/ae/grand-villaggio.en-gb.html
- https://www.booking.com/hotel/ae/one-to-one-the-village.en-gb.html

## Stack

- **Astro 7** (static output, zero UI framework)
- `astro:assets` + `sharp` for responsive WebP
- `@astrojs/sitemap`
- Self-hosted variable fonts: **Fraunces** (display) + **Instrument Sans** (body)
- ~2.7 KB of shipped JavaScript total (scroll reveal, mobile nav, gallery lightbox, Astro prefetch)

## Requirements

**Node.js >= 22.12.0** — Astro 7 will refuse to run on Node 20.

## Commands

```bash
npm install
npm run dev      # local dev server
npm run build    # build to dist/ then relativize URLs
npm run preview  # preview the built site
```

## Build pipeline note

`npm run build` runs `astro build` followed by `node scripts/relativize.mjs`.

That post-build step rewrites root-absolute URLs (`/_astro/...`, `/fonts/...`,
page links) into document-relative ones. Without it the site only works when
served from a domain root; with it the same `dist/` also works when hosted under
a sub-path (preview proxies, object storage, GitHub Pages style hosts).

If you deploy exclusively to a domain root, the step is harmless and can stay.

## Measured performance

Lighthouse, mobile preset (simulated throttling, 4x CPU), served over HTTP/1.1
with Brotli. All 14 pages:

| Category       | Score  |
| -------------- | ------ |
| Performance    | 99–100 |
| Accessibility  | 100    |
| Best practices | 100    |
| SEO            | 100    |

LCP 1.2–2.2 s, TBT 0 ms, CLS 0. Homepage is 214 KB across 9 requests.

Levers used: preloaded WOFF2 subsets, `inlineStylesheets: 'always'`, responsive
WebP with explicit `widths`/`sizes`, exactly one eager `fetchpriority="high"`
hero image per page, everything else lazy, explicit `aspect-ratio` on every
image wrapper (no layout shift), and a `.js`-gated scroll-reveal so content
paints immediately and stays visible without JavaScript.

## Structure

```
src/
  data/        site.ts, rooms.ts, venues.ts, images.ts  <- all copy & photo mapping
  components/  Hero, Figure, RoomCard, VenueRow, GalleryGrid, Header, Footer, ...
  layouts/     Base.astro (head, fonts, JSON-LD, reveal script)
  pages/       index, gallery, contact, experience-abu-dhabi, sustainability, 404
               grand-villaggio/{index,rooms,dining,facilities}
               villaggio/{index,rooms,dining,facilities}
  styles/      base.css (design tokens + layout primitives)
  assets/img/  51 property photos (gv-* Grand Villaggio, vh-* Villaggio Hotel)
public/        favicon.svg, robots.txt, self-hosted fonts
scripts/       relativize.mjs (post-build URL rewrite)
```

Editing copy, room types, dining venues or facilities usually means touching only
`src/data/*.ts` — the pages read from those modules.

## Design tokens

`--ink #17130d`, `--cream #fbf8f2`, `--sand #f0e8db`, `--line #ddd1bd`,
`--clay #a2542e` (accent/CTA), `--gold #ab8342`, `--olive #4a5443`, radius 2px.

## Notes

- `booking` links in `src/data/site.ts` point at the live Booking.com listings; swap
  them for a direct booking engine when one is available.
- `astro.config.mjs` sets `site: 'https://villaggiohotels.ae'` — used by the sitemap
  and canonical URLs. Change it if the site is hosted elsewhere.
- `src/data/images.ts` throws at build time if a referenced photo filename is
  missing, so a typo fails the build instead of shipping a broken image.
