// @ts-check

import {
  getAccessToken,
  createOrder,
  getOrderStatus,
  NgeniusError,
} from './ngenius.js';

import {
  quote,
  validateBooking,
} from './catalog.js';

const JSON_HEADERS = {
  'Content-Type': 'application/json',
};

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods':
    'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type',
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: CORS,
      });
    }

    if (path === '/api/health') {
      return json({
        ok: true,
        hasKey: Boolean(env.NGENIUS_API_KEY),
        hasOutlet: Boolean(env.NGENIUS_OUTLET),
        host: ngeniusHost(env),
      });
    }

    if (
      path === '/api/checkout' &&
      request.method === 'POST'
    ) {
      return checkout(request, env);
    }

    if (
      path === '/api/order-status' &&
      request.method === 'GET'
    ) {
      return orderStatus(url, env);
    }

    if (
      path === '/api/webhook/ngenius' &&
      request.method === 'POST'
    ) {
      return webhook(request);
    }

    return json(
      {
        error: 'not_found',
        path,
      },
      404
    );
  },
};

async function checkout(request, env) {
  let body;

  try {
    body = await request.json();
  } catch {
    return json(
      {
        error: 'bad_json',
      },
      400,
      CORS
    );
  }

  const validation =
    validateBooking(body);

  if (!validation.ok) {
    return json(
      {
        error: 'invalid_input',
        detail: validation.error,
      },
      400,
      CORS
    );
  }

  const { room, input } =
    validation.value;

  const q = quote(room, input);

  if (!q) {
    return json(
      {
        error: 'invalid_dates',
        detail:
          'check-out must be after check-in (1–30 nights)',
      },
      400,
      CORS
    );
  }

  const apiKey =
    env.NGENIUS_API_KEY;

  const outletRef =
    env.NGENIUS_OUTLET;

  const host =
    ngeniusHost(env);

  const siteUrl =
    (
      env.PUBLIC_SITE_URL ||
      'https://villaggiohotels.ae'
    ).replace(/\/$/, '');

  /*
   * IMPORTANT:
   * This is the hotel's own reference.
   * N-Genius will generate its own order reference.
   */
  const merchantReference =
    `VIL-${input.hotel
      .slice(0, 2)
      .toUpperCase()}-${Date.now()
      .toString(36)
      .toUpperCase()}`;

  /*
   * N-Genius will append ?ref=<N-GENIUS-ORDER-REFERENCE>
   * to this URL after payment.
   */
  const redirectUrl =
    `${siteUrl}/payment-result`;

  /*
   * Never run a simulated payment.
   */
  if (!apiKey) {
    return json(
      {
        error: 'payment_not_configured',
        detail:
          'N-Genius API key is not configured.',
      },
      503,
      CORS
    );
  }

  if (!outletRef) {
    return json(
      {
        error: 'payment_not_configured',
        detail:
          'N-Genius outlet reference is not configured.',
      },
      503,
      CORS
    );
  }

  try {
    /*
     * N-Genius expects MINOR UNITS.
     *
     * AED 100.00 = 10000
     */
    const amountMinor =
      Math.round(q.total * 100);

    const order =
      await createOrder(
        host,
        apiKey,
        outletRef,
        {
          currency: q.currency,

          amount: amountMinor,

          emailAddress:
            input.guest.email,

          merchantOrderReference:
            merchantReference,

          redirectUrl,

          cancelUrl:
            redirectUrl,

          items: [
            {
              description: q.label,
              quantity: 1,
              amount: amountMinor,
            },
          ],
        }
      );

    /*
     * REAL N-GENIUS PAYMENT ONLY.
     */
    return json(
      {
        success: true,

        demo: false,

        reference:
          order.reference,

        merchantReference,

        paymentUrl:
          order.paymentUrl,

        quote: q,
      },
      200,
      CORS
    );

  } catch (err) {
    console.error(
      '[N-GENIUS CHECKOUT ERROR]',
      err
    );

    /*
     * IMPORTANT:
     * NEVER turn an N-Genius failure into a fake payment.
     */
    const code =
      err instanceof NgeniusError
        ? err.code
        : 'unknown';

    return json(
      {
        success: false,

        demo: false,

        error:
          'payment_initialization_failed',

        code,

        detail:
          err instanceof NgeniusError
            ? err.detail
            : String(err?.message || err),
      },
      502,
      CORS
    );
  }
}

async function orderStatus(url, env) {
  const ref =
    url.searchParams.get('ref');

  if (!ref) {
    return json(
      {
        error:
          'missing_ref',
      },
      400,
      CORS
    );
  }

  const apiKey =
    env.NGENIUS_API_KEY;

  const outletRef =
    env.NGENIUS_OUTLET;

  const host =
    ngeniusHost(env);

  if (!apiKey || !outletRef) {
    return json(
      {
        success: false,

        paid: false,

        state: 'UNKNOWN',

        error:
          'payment_not_configured',
      },
      503,
      CORS
    );
  }

  try {
    const status =
      await getOrderStatus(
        host,
        apiKey,
        outletRef,
        ref
      );

    const state =
      String(
        status.state || 'UNKNOWN'
      ).toUpperCase();

    /*
     * PURCHASE successful status is PURCHASED.
     *
     * CAPTURED / SETTLED are also accepted
     * for accounts using those states.
     */
    const paid =
      [
        'PURCHASED',
        'CAPTURED',
        'SETTLED',
      ].includes(state);

    return json(
      {
        success: true,

        paid,

        demo: false,

        ...status,
      },
      200,
      CORS
    );

  } catch (err) {
    console.error(
      '[N-GENIUS STATUS ERROR]',
      err
    );

    return json(
      {
        success: false,

        paid: false,

        demo: false,

        state: 'UNKNOWN',

        error:
          err instanceof NgeniusError
            ? err.code
            : 'status_failed',

        detail:
          err instanceof NgeniusError
            ? err.detail
            : String(err?.message || err),
      },
      502,
      CORS
    );
  }
}

async function webhook(request) {
  /*
   * Do not fulfil bookings from this endpoint yet.
   *
   * N-Genius recommends webhook/callback notifications
   * for payment outcomes. Signature verification should
   * be configured before using this endpoint for fulfilment.
   */
  const raw =
    await request.text();

  console.log(
    '[NGENIUS WEBHOOK]',
    raw.slice(0, 500)
  );

  return new Response(
    'ok',
    {
      status: 200,
    }
  );
}

function ngeniusHost(env) {
  return (
    env.NGENIUS_HOST ||
    'https://api-gateway.sandbox.ngenius-payments.com'
  ).replace(/\/$/, '');
}

function json(
  data,
  status = 200,
  extra = {}
) {
  return new Response(
    JSON.stringify(data),
    {
      status,

      headers: {
        ...JSON_HEADERS,
        ...CORS,
        ...extra,
      },
    }
  );
}
