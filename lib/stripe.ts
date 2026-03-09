import crypto from 'node:crypto';

const STRIPE_API_BASE = 'https://api.stripe.com/v1';
const WEBHOOK_TOLERANCE_SECONDS = 300;

type StripeMethod = 'GET' | 'POST' | 'DELETE';

const getRequiredEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Brak zmiennej środowiskowej: ${name}`);
  }
  return value;
};

export const buildStripeFormPayload = (
  entries: Array<[string, string | number | boolean | null | undefined]>
) => {
  const params = new URLSearchParams();
  for (const [key, rawValue] of entries) {
    if (rawValue === null || rawValue === undefined) continue;
    params.append(key, String(rawValue));
  }
  return params;
};

export async function stripeRequest<T>(
  path: string,
  options: { method?: StripeMethod; form?: URLSearchParams } = {}
): Promise<T> {
  const secretKey = getRequiredEnv('STRIPE_SECRET_KEY');
  const method = options.method ?? 'GET';
  const headers = new Headers({
    Authorization: `Bearer ${secretKey}`,
  });

  let body: string | undefined;
  if (method !== 'GET') {
    headers.set('Content-Type', 'application/x-www-form-urlencoded');
    body = options.form?.toString() ?? '';
  }

  const response = await fetch(`${STRIPE_API_BASE}${path}`, {
    method,
    headers,
    body,
  });

  const text = await response.text();
  let parsed: unknown = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }
  }

  if (!response.ok) {
    let message = `Stripe API error (${response.status})`;
    if (parsed && typeof parsed === 'object') {
      const errorObject = (parsed as { error?: { message?: unknown } }).error;
      if (errorObject && typeof errorObject.message === 'string' && errorObject.message.trim()) {
        message = errorObject.message;
      }
    }
    throw new Error(message);
  }

  return parsed as T;
}

export function verifyStripeWebhookSignature(payload: string, signatureHeader: string | null): boolean {
  if (!signatureHeader) return false;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) return false;

  const pieces = signatureHeader.split(',').map((piece) => piece.trim());
  let timestamp: string | null = null;
  const signatures: string[] = [];

  for (const piece of pieces) {
    const [key, value] = piece.split('=', 2);
    if (!value) continue;
    if (key === 't') timestamp = value;
    if (key === 'v1') signatures.push(value);
  }

  if (!timestamp || signatures.length === 0) return false;

  const timestampSec = Number(timestamp);
  if (!Number.isFinite(timestampSec)) return false;
  const nowSec = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSec - timestampSec) > WEBHOOK_TOLERANCE_SECONDS) return false;

  const expectedHex = crypto
    .createHmac('sha256', webhookSecret)
    .update(`${timestamp}.${payload}`, 'utf8')
    .digest('hex');
  const expected = Buffer.from(expectedHex, 'hex');

  for (const candidate of signatures) {
    if (candidate.length !== expectedHex.length) continue;
    if (!/^[0-9a-f]+$/i.test(candidate)) continue;
    const candidateBuffer = Buffer.from(candidate, 'hex');
    if (candidateBuffer.length !== expected.length) continue;
    if (crypto.timingSafeEqual(candidateBuffer, expected)) return true;
  }

  return false;
}
