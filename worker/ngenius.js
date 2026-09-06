// @ts-check
/**
 * N-Genius Online payment client.
 *
 * The API key and outlet reference are supplied separately through
 * Cloudflare Worker Secrets.
 */

const IDENTITY_PATH = '/identity/auth/access-token';

const ORDERS_PATH = (outletRef) =>
  `/transactions/outlets/${encodeURIComponent(outletRef)}/orders`;

const ORDER_PATH = (outletRef, ref) =>
  `/transactions/outlets/${encodeURIComponent(outletRef)}/orders/${encodeURIComponent(ref)}`;

export function normalizeKey(apiKey) {
  if (!apiKey) return '';

  const value = String(apiKey).trim();

  return value.startsWith('Basic ')
    ? value.slice(6).trim()
    : value;
}

export async function getAccessToken(host, apiKey) {
  const res = await fetch(`${host}${IDENTITY_PATH}`, {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.ni-identity.v1+json',
      'Content-Type': 'application/vnd.ni-identity.v1+json',
      Authorization: `Basic ${normalizeKey(apiKey)}`,
    },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      realm: 'ni',
    }),
  });

  const detail = await safeText(res);

  if (!res.ok) {
    throw new NgeniusError(
      'auth_failed',
      res.status,
      detail
    );
  }

  let data;

  try {
    data = JSON.parse(detail);
  } catch {
    throw new NgeniusError(
      'invalid_auth_response',
      res.status,
      detail
    );
  }

  if (!data.access_token) {
    throw new NgeniusError(
      'no_token',
      res.status,
      detail
    );
  }

  return data.access_token;
}

/**
 * Create a real N-Genius hosted payment order.
 *
 * amount must already be in minor units.
 * Example:
 * AED 100.00 = 10000
 */
export async function createOrder(host, apiKey, outletRef, order) {
  if (!outletRef) {
    throw new NgeniusError(
      'missing_outlet',
      500,
      'NGENIUS_OUTLET is not configured'
    );
  }

  const token = await getAccessToken(host, apiKey);

  const body = {
    action: 'PURCHASE',

    amount: {
      currencyCode: order.currency,
      value: order.amount,
    },

    emailAddress: order.emailAddress,

    merchantOrderReference: order.merchantOrderReference,

    merchantAttributes: {
      redirectUrl: order.redirectUrl,
      cancelUrl: order.cancelUrl || order.redirectUrl,
    },

    orderSummary: {
      total: {
        currencyCode: order.currency,
        value: order.amount,
      },

      items: (order.items || []).map((item) => ({
        category: 'Rooms',
        description: item.description,
        quantity: item.quantity,
        totalPrice: {
          currencyCode: order.currency,
          value: item.amount,
        },
      })),
    },
  };

  const res = await fetch(
    `${host}${ORDERS_PATH(outletRef)}`,
    {
      method: 'POST',

      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.ni-payment.v2+json',
        'Content-Type': 'application/vnd.ni-payment.v2+json',
      },

      body: JSON.stringify(body),
    }
  );

  const detail = await safeText(res);

  if (!res.ok) {
    throw new NgeniusError(
      'order_failed',
      res.status,
      detail
    );
  }

  let data;

  try {
    data = JSON.parse(detail);
  } catch {
    throw new NgeniusError(
      'invalid_order_response',
      res.status,
      detail
    );
  }

  const paymentUrl =
    data?._links?.payment?.href ||
    data?._links?.['cnp:payment-link']?.href;

  const reference = data?.reference;

  if (!paymentUrl) {
    throw new NgeniusError(
      'no_payment_link',
      res.status,
      detail
    );
  }

  if (!reference) {
    throw new NgeniusError(
      'no_order_reference',
      res.status,
      detail
    );
  }

  return {
    reference,
    paymentUrl,
    raw: data,
  };
}

export async function getOrderStatus(
  host,
  apiKey,
  outletRef,
  reference
) {
  if (!outletRef) {
    throw new NgeniusError(
      'missing_outlet',
      500,
      'NGENIUS_OUTLET is not configured'
    );
  }

  if (!reference) {
    throw new NgeniusError(
      'missing_order_reference',
      400,
      'Missing N-Genius order reference'
    );
  }

  const token = await getAccessToken(
    host,
    apiKey
  );

  const res = await fetch(
    `${host}${ORDER_PATH(outletRef, reference)}`,
    {
      method: 'GET',

      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.ni-payment.v2+json',
      },
    }
  );

  const detail = await safeText(res);

  if (!res.ok) {
    throw new NgeniusError(
      'status_failed',
      res.status,
      detail
    );
  }

  let data;

  try {
    data = JSON.parse(detail);
  } catch {
    throw new NgeniusError(
      'invalid_status_response',
      res.status,
      detail
    );
  }

  const payment =
    data?._embedded?.payment?.[0];

  return {
    reference:
      data?.reference || reference,

    state:
      payment?.state ||
      data?.state ||
      'UNKNOWN',

    amount:
      payment?.amount?.value ??
      data?.amount?.value,

    currency:
      payment?.amount?.currencyCode ??
      data?.amount?.currencyCode,

    raw: data,
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
