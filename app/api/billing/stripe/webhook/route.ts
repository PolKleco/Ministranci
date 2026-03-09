import { NextRequest, NextResponse } from 'next/server';
import { stripeRequest, verifyStripeWebhookSignature } from '@/lib/stripe';
import { isMissingColumnError, supabaseAdmin } from '../_shared';

export const runtime = 'nodejs';

type StripeSubscription = {
  id: string;
  customer: string | null;
  status: string;
  current_period_end?: number | null;
  metadata?: Record<string, string>;
};

type StripeEvent = {
  id: string;
  type: string;
  data: {
    object: Record<string, unknown>;
  };
};

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(['active', 'trialing', 'past_due']);

const normalizeParafiaId = (value: unknown) => {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized || null;
};

const getString = (value: unknown) => (typeof value === 'string' ? value : null);

const getObjectValue = (obj: Record<string, unknown>, key: string) => obj[key];

const getNestedString = (value: unknown, key: string) => {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  return getString(record[key]);
};

async function findParafiaIdByColumn(column: 'stripe_subscription_id' | 'stripe_customer_id', value: string) {
  const { data, error } = await supabaseAdmin
    .from('parafie')
    .select('id')
    .eq(column, value)
    .limit(1)
    .maybeSingle();

  if (error) {
    if (!isMissingColumnError(error)) {
      console.error(`Nie udalo sie znalezc parafii po ${column}:`, error);
    }
    return null;
  }

  return normalizeParafiaId(data?.id);
}

async function resolveParafiaId(subscription: StripeSubscription, hintedParafiaId?: string | null) {
  if (hintedParafiaId) return hintedParafiaId;

  const fromMetadata = normalizeParafiaId(subscription.metadata?.parafia_id);
  if (fromMetadata) return fromMetadata;

  if (subscription.id) {
    const bySubscription = await findParafiaIdByColumn('stripe_subscription_id', subscription.id);
    if (bySubscription) return bySubscription;
  }

  if (subscription.customer) {
    const byCustomer = await findParafiaIdByColumn('stripe_customer_id', subscription.customer);
    if (byCustomer) return byCustomer;
  }

  return null;
}

async function updateParafiaBilling(parafiaId: string, updates: Record<string, unknown>) {
  const { error } = await supabaseAdmin
    .from('parafie')
    .update(updates)
    .eq('id', parafiaId);

  if (!error) return;

  if (!isMissingColumnError(error)) {
    throw new Error(`Aktualizacja parafii nieudana: ${error.message}`);
  }

  const fallback: Record<string, unknown> = {};
  if (typeof updates.tier === 'string') fallback.tier = updates.tier;
  if (typeof updates.is_active === 'boolean') fallback.is_active = updates.is_active;
  if (Object.keys(fallback).length === 0) return;

  const { error: fallbackError } = await supabaseAdmin
    .from('parafie')
    .update(fallback)
    .eq('id', parafiaId);

  if (fallbackError) {
    throw new Error(`Fallback aktualizacji parafii nieudany: ${fallbackError.message}`);
  }
}

async function applySubscriptionState(subscription: StripeSubscription, hintedParafiaId?: string | null) {
  const parafiaId = await resolveParafiaId(subscription, hintedParafiaId);
  if (!parafiaId) {
    console.warn('Webhook Stripe: nie znaleziono parafii dla subskrypcji', subscription.id);
    return;
  }

  const isActive = ACTIVE_SUBSCRIPTION_STATUSES.has(subscription.status);
  const premiumExpiresAt = typeof subscription.current_period_end === 'number'
    ? new Date(subscription.current_period_end * 1000).toISOString()
    : null;

  await updateParafiaBilling(parafiaId, {
    tier: isActive ? 'premium' : 'free',
    is_active: isActive,
    premium_status: subscription.status,
    premium_source: 'stripe',
    premium_expires_at: premiumExpiresAt,
    stripe_customer_id: subscription.customer,
    stripe_subscription_id: subscription.id,
  });
}

async function fetchSubscriptionById(subscriptionId: string) {
  return stripeRequest<StripeSubscription>(`/subscriptions/${encodeURIComponent(subscriptionId)}`);
}

function safeParseEvent(payload: string): StripeEvent | null {
  try {
    return JSON.parse(payload) as StripeEvent;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Brak konfiguracji STRIPE_WEBHOOK_SECRET' }, { status: 500 });
    }

    if (!verifyStripeWebhookSignature(payload, signature)) {
      return NextResponse.json({ error: 'Nieprawidlowy podpis webhooka Stripe' }, { status: 400 });
    }

    const event = safeParseEvent(payload);
    if (!event) {
      return NextResponse.json({ error: 'Nieprawidlowy payload webhooka' }, { status: 400 });
    }

    const object = event.data.object;

    if (event.type === 'checkout.session.completed') {
      const hintedParafiaId =
        normalizeParafiaId(getObjectValue(object, 'client_reference_id')) ||
        normalizeParafiaId(getNestedString(getObjectValue(object, 'metadata'), 'parafia_id'));
      const subscriptionId = normalizeParafiaId(getObjectValue(object, 'subscription'));

      if (subscriptionId) {
        const subscription = await fetchSubscriptionById(subscriptionId);
        await applySubscriptionState(subscription, hintedParafiaId);
      } else if (hintedParafiaId) {
        await updateParafiaBilling(hintedParafiaId, {
          tier: 'premium',
          is_active: true,
          premium_status: 'active',
          premium_source: 'stripe',
        });
      }
    }

    if (
      event.type === 'customer.subscription.created' ||
      event.type === 'customer.subscription.updated' ||
      event.type === 'customer.subscription.deleted'
    ) {
      const subscription = object as unknown as StripeSubscription;
      await applySubscriptionState(subscription);
    }

    if (event.type === 'invoice.paid' || event.type === 'invoice.payment_failed') {
      const subscriptionId = normalizeParafiaId(getObjectValue(object, 'subscription'));
      if (subscriptionId) {
        const subscription = await fetchSubscriptionById(subscriptionId);
        await applySubscriptionState(subscription);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Stripe webhook error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    );
  }
}
