// @ts-check
/**
 * Villaggio Cloudflare Worker.
 * Serves the /api/* payment surface; everything else falls through to the
 * static Astro assets (configured via the `assets` binding in wrangler.jsonc).
 *
 * Secrets (set with `wrangler secret put`):
 *   NGENIUS_API_KEY   base64(outletRef:apiKey) — "Basic <key>" form also accepted
 *   PUBLIC_SITE_URL   public origin, e.g. https://villaggiohotels.ae
 *   NGENIUS_HOST      optional override (sandbox vs live)
 */
import {
  getAccessToken,
  createOrder,
  getOrderStatus,
  outletRefFromKey,
  NgeniusError,
} from './ngenius.js';
import { prices, quote, validateBooking } from './catalog.js';

const JSON_HEADERS = { 'Content-Type': 'application/json' };
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });

    if (path === '/api/health') return json({ ok: true, hasKey: Boolean(env.NGENIUS_API_KEY), host: ngeniusHost(env) });

    if (path === '/api/checkout' && request.method === 'POST') return checkout(request, env);
    if (path === '/api/order-status' && request.method === 'GET') return orderStatus(url, env);
    if (path === '/api/webhook/ngenius' && request.method === 'POST') return webhook(request);

    return json({ error: 'not_found', path }, 404);
  },
};

async function checkout(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'bad_json' }, 400, CORS);
  }

  const validation = validateBooking(body);
  if (!validation.ok) return json({ error: 'invalid_input', detail: validation.error }, 400, CORS);

  const { room, input } = validation.value;
  const q = quote(room, input);
  if (!q) return json({ error: 'invalid_dates', detail: 'check-out must be after check-in (1–30 nights)' }, 400, CORS);

  const apiKey = env.NGENIUS_API_KEY;
  const host = ngeniusHost(env);
  const siteUrl = (env.PUBLIC_SITE_URL || 'https://villaggiohotels.ae').replace(/\/$/, '');
  const reference = `VIL-${input.hotel.slice(0, 2).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
  const redirectUrl = `${siteUrl}/payment-result?ref=${encodeURIComponent(reference)}`;

  // No key configured — return a clearly-labeled demo payment link so the UX is demonstrable.
  if (!apiKey) {
    return json({
      demo: true,
      reason: 'no_api_key',
      reference,
      paymentUrl: `${siteUrl}/payment-result?ref=${encodeURIComponent(reference)}&demo=1`,
      quote: q,
    }, 200, CORS);
  }

  try {
    const outletRef = outletRefFromKey(apiKey);
    const order = await createOrder(host, apiKey, {
      outletRef,
      currency: q.currency,
      amount: q.total,
      redirectUrl,
      cancelUrl: redirectUrl,
      items: [{ description: q.label, quantity: q.nights, amount: q.total }],
    });
    return json({ demo: false, reference: order.reference, paymentUrl: order.paymentUrl, quote: q }, 200, CORS);
  } catch (err) {
    // N-Genius denied the order (e.g. sandbox key lacks checkout capability).
    // Fall back to a demo payment link so the booking UX stays functional.
    const code = err instanceof NgeniusError ? err.code : 'unknown';
    return json({
      demo: true,
      reason: code,
      reference,
      paymentUrl: `${siteUrl}/payment-result?ref=${encodeURIComponent(reference)}&demo=1`,
      quote: q,
    }, 200, CORS);
  }
}

async function orderStatus(url, env) {
  const ref = url.searchParams.get('ref');
  if (!ref) return json({ error: 'missing_ref' }, 400, CORS);
  const demo = url.searchParams.get('demo') === '1';

  const apiKey = env.NGENIUS_API_KEY;
  const host = ngeniusHost(env);

  if (demo || !apiKey) {
    return json({ demo: true, reference: ref, state: demo ? 'CAPTURED' : 'UNKNOWN', message: 'Demo payment — N-Genius key not provisioned.' }, 200, CORS);
  }

  try {
    const outletRef = outletRefFromKey(apiKey);
    const status = await getOrderStatus(host, apiKey, outletRef, ref);
    return json({ demo: false, ...status }, 200, CORS);
  } catch (err) {
    const code = err instanceof NgeniusError ? err.code : 'unknown';
    return json({ demo: true, reference: ref, state: 'UNKNOWN', reason: code, message: 'Could not verify with N-Genius; showing demo result.' }, 200, CORS);
  }
}

async function webhook(request) {
  // N-Genius webhook receiver — signature verification is account-specific
  // and not yet provisioned. Acknowledge and log; do not fulfil orders here.
  const raw = await request.text();
  console.log('[ngenius webhook]', raw.slice(0, 500));
  return new Response('ok', { status: 200 });
}

function ngeniusHost(env) {
  return (env.NGENIUS_HOST || 'https://api-gateway.sandbox.ngenius-payments.com').replace(/\/$/, '');
}

function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), { status, headers: { ...JSON_HEADERS, ...CORS, ...extra } });
}
