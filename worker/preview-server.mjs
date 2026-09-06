// @ts-check
/**
 * Preview backend (Node) for the Villaggio payment API.
 * Reuses worker/ngenius.js + worker/catalog.js so preview and production behave identically.
 *
 * The N-Genius API key is injected by the platform as an env var when started with
 * api_credentials=['custom-cred:api-gateway.sandbox.ngenius-payments.com'].
 * The secret never appears in code, files, or logs.
 *
 * Run: start_server(command="node worker/preview-server.mjs", port=8787, ...)
 */
import http from 'node:http';
import { createOrder, getOrderStatus, outletRefFromKey, NgeniusError } from './ngenius.js';
import { validateBooking, quote } from './catalog.js';

const PORT = Number(process.env.PORT || 8787);
const TOKEN_ENV = 'CUSTOM_CRED_API_GATEWAY_SANDBOX_NGENIUS_PAYMENTS_COM_TOKEN';
const SITE_URL = (process.env.PUBLIC_SITE_URL || 'https://villaggiohotels.ae').replace(/\/$/, '');
const NGENIUS_HOST = 'https://api-gateway.sandbox.ngenius-payments.com';

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname;

  if (req.method === 'OPTIONS') return send(res, 204, null);

  if (path === '/api/health') return send(res, 200, { ok: true, hasKey: Boolean(process.env[TOKEN_ENV]) });

  if (path === '/api/checkout' && req.method === 'POST') return checkout(req, res);
  if (path === '/api/order-status' && req.method === 'GET') return orderStatus(url, res);
  if (path === '/api/webhook/ngenius' && req.method === 'POST') return webhook(req, res);

  return send(res, 404, { error: 'not_found', path });
});

async function checkout(req, res) {
  let body;
  try { body = await readJson(req); } catch { return send(res, 400, { error: 'bad_json' }); }

  const v = validateBooking(body);
  if (!v.ok) return send(res, 400, { error: 'invalid_input', detail: v.error });

  const { room, input } = v.value;
  const q = quote(room, input);
  if (!q) return send(res, 400, { error: 'invalid_dates', detail: 'check-out must be after check-in (1–30 nights)' });

  const apiKey = process.env[TOKEN_ENV]; // "Basic <base64>" — ngenius.js strips the prefix
  const reference = `VIL-${input.hotel.slice(0, 2).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
  const redirectUrl = `${SITE_URL}/payment-result?ref=${encodeURIComponent(reference)}`;

  if (!apiKey) {
    return send(res, 200, { demo: true, reason: 'no_api_key', reference,
      paymentUrl: `${SITE_URL}/payment-result?ref=${encodeURIComponent(reference)}&demo=1`, quote: q });
  }

  try {
    const outletRef = outletRefFromKey(apiKey);
    const order = await createOrder(NGENIUS_HOST, apiKey, {
      outletRef, currency: q.currency, amount: q.total, redirectUrl, cancelUrl: redirectUrl,
      items: [{ description: q.label, quantity: q.nights, amount: q.total }],
    });
    return send(res, 200, { demo: false, reference: order.reference, paymentUrl: order.paymentUrl, quote: q });
  } catch (err) {
    const code = err instanceof NgeniusError ? err.code : 'unknown';
    return send(res, 200, { demo: true, reason: code, reference,
      paymentUrl: `${SITE_URL}/payment-result?ref=${encodeURIComponent(reference)}&demo=1`, quote: q });
  }
}

async function orderStatus(url, res) {
  const ref = url.searchParams.get('ref');
  if (!ref) return send(res, 400, { error: 'missing_ref' });
  const demo = url.searchParams.get('demo') === '1';
  const apiKey = process.env[TOKEN_ENV];
  if (demo || !apiKey) {
    return send(res, 200, { demo: true, reference: ref, state: demo ? 'CAPTURED' : 'UNKNOWN',
      message: 'Demo payment — N-Genius key not provisioned.' });
  }
  try {
    const outletRef = outletRefFromKey(apiKey);
    const status = await getOrderStatus(NGENIUS_HOST, apiKey, outletRef, ref);
    return send(res, 200, { demo: false, ...status });
  } catch (err) {
    const code = err instanceof NgeniusError ? err.code : 'unknown';
    return send(res, 200, { demo: true, reference: ref, state: 'UNKNOWN', reason: code,
      message: 'Could not verify with N-Genius; showing demo result.' });
  }
}

async function webhook(req, res) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  console.log('[ngenius webhook]', Buffer.concat(chunks).toString('utf8').slice(0, 500));
  return send(res, 200, 'ok', 'text/plain');
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); } catch (e) { reject(e); } });
    req.on('error', reject);
  });
}

function send(res, status, body, contentType = 'application/json') {
  res.writeHead(status, { 'Content-Type': contentType, 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' });
  if (contentType === 'application/json') res.end(JSON.stringify(body));
  else res.end(String(body));
}

server.listen(PORT, () => console.log(`Villaggio payment API (preview) on :${PORT}`));
