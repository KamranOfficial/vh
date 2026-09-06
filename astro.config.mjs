// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://villaggiohotels.ae',
  trailingSlash: 'ignore',
  build: { inlineStylesheets: 'always', format: 'directory' },
  image: {
    service: { entrypoint: 'astro/assets/services/sharp' },
  },
  integrations: [sitemap()],
  compressHTML: true,
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
});
