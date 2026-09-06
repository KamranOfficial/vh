// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://villaggiohotels.ae',
  // Fully prerendered. This must stay 'static': in server/SSR mode Astro emits
  // runtime `/_image?href=...` URLs, which edge hosts without sharp (Cloudflare
  // Workers, Netlify Edge) cannot serve — every image 404s. Static mode bakes the
  // resized WebP variants into dist/_astro at build time instead.
  output: 'static',
  trailingSlash: 'ignore',
  build: { inlineStylesheets: 'always', format: 'directory' },
  image: {
    service: { entrypoint: 'astro/assets/services/sharp' },
  },
  integrations: [sitemap()],
  compressHTML: true,
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
});
