// Post-build: rewrite root-absolute asset/page URLs to document-relative ones so the
// site works when hosted under a sub-path (preview proxies, static file hosts) as well
// as at a domain root.
import fs from 'node:fs';
import path from 'node:path';

const DIST = path.resolve('dist');

const htmlFiles = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.html')) htmlFiles.push(p);
  }
})(DIST);

const SKIP = /^(https?:|mailto:|tel:|data:|#|\/\/)/;

for (const file of htmlFiles) {
  const depth = path.relative(DIST, path.dirname(file)).split(path.sep).filter(Boolean).length;
  const prefix = depth === 0 ? './' : '../'.repeat(depth);
  const rel = (u) => (SKIP.test(u) || !u.startsWith('/') ? u : prefix + u.slice(1));

  let html = fs.readFileSync(file, 'utf8');

  // src="/..." | href="/..." | content="/..."
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

console.log(`relativized ${htmlFiles.length} html files`);
