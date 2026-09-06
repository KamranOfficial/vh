// @ts-check
/**
 * N-Genius Online payment client.
 * Pure functions — no env, no global state. The caller passes the API key
 * (base64 outletRef:apiKey string) and host. All calls are direct fetches
 * (the secret never lives in code or files).
 *
 * Flow: getAccessToken -> createOrder -> redirect to _links.payment.href.
 */

const IDENTITY_PATH = '/identity/auth/access-token';
const ORDERS_PATH = (outletRef) => `/transactions/outlets/${outletRef}/orders`;
const ORDER_PATH = (outletRef, ref) => `/transactions/outlets/${outletRef}/orders/${ref}`;

/** Strip an optional "Basic " prefix so callers can pass either form. */
export function normalizeKey(apiKey) {
  if (!apiKey) return '';
  const v = String(apiKey).trim();
  return v.startsWith('Basic ') ? v.slice(6).trim() : v;
}

/** Derive the outlet reference from the base64 key (first segment). */
export function outletRefFromKey(apiKey) {
  try {
    return atob(normalizeKey(apiKey)).split(':')[0];
  } catch {
    return '';
  }
}

export async function getAccessToken(host, apiKey) {
  const res = await fetch(`${host}${IDENTITY_PATH}`, {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.ni-identity.v1+json',
      'Content-Type': 'application/vnd.ni-identity.v1+json',
      Authorization: `Basic ${normalizeKey(apiKey)}`,
    },
    body: JSON.stringify({ grant_type: 'client_credentials' }),
  });
  if (!res.ok) {
    const detail = await safeText(res);
    throw new NgeniusError('auth_failed', res.status, detail);
  }
  const json = await res.json();
  if (!json.access_token) throw new NgeniusError('no_token', res.status, JSON.stringify(json));
  return json.access_token;
}

/**
 * Create a hosted-checkout order. Returns the payment page URL + reference.
 * amount is in minor units (1 AED = 100). action PURCHASE captures immediately.
 */
export async function createOrder(host, apiKey, order) {
  const outletRef = order.outletRef || outletRefFromKey(apiKey);
  const token = await getAccessToken(host, apiKey);
  const body = {
    action: 'PURCHASE',
    amount: { currencyCode: order.currency, value: order.amount },
    merchantAttributes: {
      redirectUrl: order.redirectUrl,
      cancelUrl: order.cancelUrl || order.redirectUrl,
    },
    orderSummary: {
      total: { currencyCode: order.currency, value: order.amount },
      items: order.items.map((it) => ({
        category: 'Rooms',
        description: it.description,
        quantity: it.quantity,
        totalPrice: { currencyCode: order.currency, value: it.amount },
      })),
    },
  };
  const res = await fetch(`${host}${ORDERS_PATH(outletRef)}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.ni-payment.v2+json',
      'Content-Type': 'application/vnd.ni-payment.v2+json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await safeText(res);
    throw new NgeniusError('order_failed', res.status, detail);
  }
  const json = await res.json();
  const paymentUrl = json?._links?.payment?.href;
  const reference = json?.reference;
  if (!paymentUrl) throw new NgeniusError('no_payment_link', res.status, JSON.stringify(json));
  return { reference, paymentUrl, raw: json };
}

/** Query the outcome of an order by reference (used after redirect-back). */
export async function getOrderStatus(host, apiKey, outletRef, reference) {
  const token = await getAccessToken(host, apiKey);
  const res = await fetch(`${host}${ORDER_PATH(outletRef, reference)}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.ni-payment.v2+json' },
  });
  if (!res.ok) {
    const detail = await safeText(res);
    throw new NgeniusError('status_failed', res.status, detail);
  }
  const json = await res.json();
  // _embedded.payment[0].state is typically AUTHORIZED / CAPTURED / FAILED / DECLINED
  const payment = json?._embedded?.payment?.[0];
  return {
    reference: json?.reference || reference,
    state: payment?.state || json?.state || 'UNKNOWN',
    amount: payment?.amount?.value ?? json?.amount?.value,
    currency: payment?.amount?.currencyCode ?? json?.amount?.currencyCode,
    raw: json,
  };
}

export class NgeniusError extends Error {
  constructor(code, status, detail) {
    super(`${code} (${status})`);
    this.name = 'NgeniusError';
    this.code = code;
    this.status = status;
    this.detail = detail;
  }
}

async function safeText(res) {
  try {
    return await res.text();
  } catch {
    return '';
  }
}
