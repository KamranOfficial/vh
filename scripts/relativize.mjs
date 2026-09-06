// Post-build pass over the built HTML.
//
// 1. Guard: fail the build if Astro emitted runtime image URLs (`/_image?href=...`).
//    Those only appear in server/SSR mode and 404 on static hosts such as
//    Cloudflare Workers, so a silent adapter regression must break CI, not prod.
// 2. Rewrite root-absolute URLs to document-relative ones, so the same output works
//    at a domain root and under a hosted sub-path (preview proxies, object storage).
import fs from 'node:fs';
import path from 'node:path';

// An adapter build puts the browsable output in dist/client; a static build uses
// dist itself. Resolve the real web root so relative depths are correct either way.
const distDir = path.resolve('dist');
const clientDir = path.join(distDir, 'client');
const ROOT = fs.existsSync(path.join(clientDir, 'index.html')) ? clientDir : distDir;

const htmlFiles = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    // Never descend into an adapter's server bundle.
    if (e.isDirectory()) {
      if (e.name !== '_worker.js') walk(p);
    } else if (e.name.endsWith('.html')) htmlFiles.push(p);
  }
})(ROOT);

const SKIP = /^(https?:|mailto:|tel:|data:|#|\/\/)/;

const offenders = [];

for (const file of htmlFiles) {
  const depth = path.relative(ROOT, path.dirname(file)).split(path.sep).filter(Boolean).length;
  const prefix = depth === 0 ? './' : '../'.repeat(depth);
  const rel = (u) => (SKIP.test(u) || !u.startsWith('/') ? u : prefix + u.slice(1));

  let html = fs.readFileSync(file, 'utf8');

  if (html.includes('/_image?')) offenders.push(path.relative(distDir, file));

  // src="/..." | href="/..."
  html = html.replace(/\b(src|href)="(\/[^"]*)"/g, (m, attr, u) => `${attr}="${rel(u)}"`);

  // srcset="/a.webp 640w, /b.webp 1024w"
  html = html.replace(/\bsrcset="([^"]*)"/g, (m, set) => {
    const out = set
      .split(',')
      .map((part) => {
        const t = part.trim();
        if (!t) return t;
        const [u, ...d] = t.split(/\s+/);
        return [rel(u), ...d].join(' ');
      })
      .join(', ');
    return `srcset="${out}"`;
  });

  // url(/fonts/x.woff2) inside inlined CSS
  html = html.replace(/url\((['"]?)(\/[^)'"]+)\1\)/g, (m, q, u) => `url(${q}${rel(u)}${q})`);

  fs.writeFileSync(file, html);
}

if (offenders.length) {
  console.error(
    '\nBuild aborted: found runtime /_image URLs in ' +
      offenders.length +
      ' page(s), e.g. ' +
      offenders.slice(0, 3).join(', ') +
      '\n\nThis means the build ran in server/SSR mode (usually because an adapter such as\n' +
      '@astrojs/cloudflare was added). Those URLs 404 on static hosts and every image\n' +
      'breaks. Keep `output: "static"` in astro.config.mjs and remove the adapter.\n'
  );
  process.exit(1);
}

console.log(`relativized ${htmlFiles.length} html files (root: ${path.relative(process.cwd(), ROOT)})`);
