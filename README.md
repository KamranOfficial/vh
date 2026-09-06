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
- Dark mode (system preference + manual toggle), scroll reveal, mobile nav, gallery lightbox, Astro prefetch
- Cloudflare Worker backend for the N-Genius payment API (`worker/`)

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

That post-build step does two things:

1. **Guards against SSR image URLs.** If any page contains `/_image?href=...` the
   build fails on purpose. See the warning below.
2. **Rewrites root-absolute URLs** (`/_astro/...`, `/fonts/...`, page links) into
   document-relative ones, so the same `dist/` works at a domain root *and* under a
   hosted sub-path (preview proxies, object storage, GitHub Pages style hosts).

## Do not add an Astro adapter

`astro.config.mjs` pins `output: 'static'`. Keep it that way.

In server/SSR mode — which is what `@astrojs/cloudflare`, `@astrojs/netlify` and
friends switch on — Astro stops pre-generating resized images and instead emits
runtime URLs like `/_image?href=/_astro/photo.webp&w=640&f=webp`. That endpoint
needs sharp at request time. Cloudflare Workers and most edge runtimes cannot run
it, so **every image on the site 404s** while the HTML, CSS and fonts load fine.

The site has no server-rendered routes, so an adapter buys nothing. The build
guard in `scripts/relativize.mjs` fails loudly if this regresses.

## Deploying

This is a prerendered static bundle plus a small Cloudflare Worker that handles the
payment API. Build, then deploy with Wrangler.

### Cloudflare Workers

`wrangler.jsonc` is committed with a `main` Worker (`worker/index.js`) and an
`assets` binding pointing at `dist/`. Cloudflare serves the prerendered Astro
bundle from its asset store for matching routes and falls through unmatched
requests (the `/api/*` payment surface) to the Worker. No Astro adapter is used.

```bash
npm run build
npx wrangler deploy
```

Set the N-Genius secrets before the first deploy:

```bash
npx wrangler secret put NGENIUS_API_KEY   # base64 key from the N-Genius portal
npx wrangler secret put PUBLIC_SITE_URL    # e.g. https://villaggiohotels.ae
```

`NGENIUS_HOST` in `wrangler.jsonc` points at the sandbox. Switch it to
`https://api-gateway.ngenius-payments.com` for live payments.

For a git-connected Workers Build, set build command `npm run build` and leave the
assets directory as `dist`. If Cloudflare offers to add the Astro framework preset,
decline it — it installs the adapter and breaks images.

`public/_headers` sets immutable caching on `/_astro/*` and `/fonts/*`.

### Vercel / Netlify / any static host

The marketing pages are pure static output (build command `npm run build`, output
directory `dist`, Node **22 or later**). The payment API only runs on Cloudflare
Workers — on other hosts the `/book` page still renders but checkout falls back to
a demo payment link.

## Payments (N-Genius Online)

Guests book directly on-site instead of being sent to a third-party listing. The
flow is `/book` → `/api/checkout` → N-Genius hosted payment page →
`/payment-result`.

- `src/pages/book.astro` — booking form (hotel, room, dates, guests). Prices are
  computed live client-side for preview only.
- `worker/index.js` — Cloudflare Worker exposing `/api/checkout`,
  `/api/order-status`, and `/api/webhook/ngenius` (stub). It re-validates the
  booking and re-prices **server-side** from `worker/catalog.js` — the client
  price is never trusted.
- `worker/ngenius.js` — N-Genius client: access-token → create-order → order
  status. The outlet reference is derived from the API key.
- `worker/preview-server.mjs` — a Node mirror of the Worker for local/preview.

### Taxes & pricing

All prices are in AED. Per night, plus a 7% Abu Dhabi municipality fee and a
AED 20 tourism dirham per night. Room rates live in `src/data/rooms.ts` and are
mirrored (authoritatively) in `worker/catalog.js`. Change both together.

### Sandbox note

The N-Genius sandbox key authenticates but order creation returns `accessDenied`
unless the outlet is provisioned for hosted checkout. The Worker handles this
gracefully: if order creation fails (or no key is set), `/api/checkout` returns a
`demo` payment link to `/payment-result` so the UX is fully demonstrable. With a
provisioned key the real N-Genius hosted checkout replaces the demo automatically.

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
  data/        site.ts, rooms.ts (with pricing), venues.ts, images.ts, booking.ts
  components/  Hero, Figure, RoomCard (price + Book now), Header (dark toggle), Footer, ...
  layouts/     Base.astro (head, fonts, theme init, JSON-LD, reveal script)
  pages/       index, gallery, contact, book, payment-result, experience-abu-dhabi,
               sustainability, 404
               grand-villaggio/{index,rooms,dining,facilities}
               villaggio/{index,rooms,dining,facilities}
  styles/      base.css (design tokens, dark mode, booking components)
  assets/img/  51 property photos (gv-* Grand Villaggio, vh-* Villaggio Hotel)
worker/        index.js (Cloudflare Worker), ngenius.js, catalog.js, preview-server.mjs
public/        favicon.svg, robots.txt, _headers, self-hosted fonts
scripts/       relativize.mjs (SSR guard + post-build URL rewrite)
wrangler.jsonc Cloudflare Workers config (main Worker + assets binding)
```

Editing copy, room types, dining venues or facilities usually means touching only
`src/data/*.ts` — the pages read from those modules.

## Design tokens

`--ink #17130d`, `--cream #fbf8f2`, `--sand #f0e8db`, `--line #ddd1bd`,
`--clay #a2542e` (accent/CTA), `--gold #ab8342`, `--olive #4a5443`, radius 2px.

## Notes

- Booking is now handled on-site via `/book` and the N-Genius Worker. The old
  `bookingLinks` in `src/data/site.ts` point at `/book?hotel=...`.
- `astro.config.mjs` sets `site: 'https://villaggiohotels.ae'` — used by the sitemap
  and canonical URLs. Change it if the site is hosted elsewhere.
- `src/data/images.ts` throws at build time if a referenced photo filename is
  missing, so a typo fails the build instead of shipping a broken image.
