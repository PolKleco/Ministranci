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
const RESEND_API_KEY = process.env.RESEND_API_KEY?.trim() || '';
const BILLING_NOTIFICATION_FROM = process.env.BILLING_NOTIFICATION_FROM?.trim() || 'onboarding@resend.dev';
const BILLING_NOTIFICATION_RECIPIENTS = Array.from(new Set(
  (
    process.env.BILLING_NOTIFICATION_EMAILS ||
    process.env.INTERNAL_ADMIN_EMAILS ||
    process.env.NEXT_PUBLIC_ADMIN_EMAILS ||
    ''
  )
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
));

type ParafiaBillingSnapshot = {
  parafiaName: string;
  invoiceType: string | null;
  invoiceEmail: string | null;
  invoiceFullName: string | null;
  invoiceCompanyName: string | null;
  invoiceTaxId: string | null;
  invoiceStreet: string | null;
  invoicePostalCode: string | null;
  invoiceCity: string | null;
  invoiceCountry: string | null;
  invoiceEmailConsent: boolean | null;
};

const normalizeParafiaId = (value: unknown) => {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized || null;
};

const getString = (value: unknown) => (typeof value === 'string' ? value : null);
const getNumber = (value: unknown) => (typeof value === 'number' ? value : null);
const getBoolean = (value: unknown) => (typeof value === 'boolean' ? value : null);

const getObjectValue = (obj: Record<string, unknown>, key: string) => obj[key];

const getNestedString = (value: unknown, key: string) => {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  return getString(record[key]);
};

function toInvoiceTypeLabel(invoiceType: string | null) {
  if (invoiceType === 'company') return 'Firma / parafia';
  if (invoiceType === 'private') return 'Osoba prywatna';
  return '-';
}

function toConsentLabel(consent: boolean | null) {
  if (consent === true) return 'TAK';
  if (consent === false) return 'NIE';
  return '-';
}

function formatAmount(amountMinor: number | null, currency: string | null) {
  if (amountMinor === null || !currency) return '-';
  return `${(amountMinor / 100).toFixed(2)} ${currency.toUpperCase()}`;
}

function formatAddress(snapshot: ParafiaBillingSnapshot) {
  const street = snapshot.invoiceStreet || '';
  const postal = snapshot.invoicePostalCode || '';
  const city = snapshot.invoiceCity || '';
  const country = snapshot.invoiceCountry || '';
  const joined = [street, [postal, city].filter(Boolean).join(' '), country]
    .map((item) => item.trim())
    .filter(Boolean)
    .join(', ');
  return joined || '-';
}

async function loadParafiaBillingSnapshot(parafiaId: string): Promise<ParafiaBillingSnapshot> {
  const baseFallback: ParafiaBillingSnapshot = {
    parafiaName: 'Parafia',
    invoiceType: null,
    invoiceEmail: null,
    invoiceFullName: null,
    invoiceCompanyName: null,
    invoiceTaxId: null,
    invoiceStreet: null,
    invoicePostalCode: null,
    invoiceCity: null,
    invoiceCountry: null,
    invoiceEmailConsent: null,
  };

  const selectWithInvoiceFields = [
    'nazwa',
    'invoice_type',
    'invoice_email',
    'invoice_full_name',
    'invoice_company_name',
    'invoice_tax_id',
    'invoice_street',
    'invoice_postal_code',
    'invoice_city',
    'invoice_country',
    'invoice_email_consent',
  ].join(', ');

  const { data, error } = await supabaseAdmin
    .from('parafie')
    .select(selectWithInvoiceFields)
    .eq('id', parafiaId)
    .limit(1)
    .maybeSingle();

  if (error) {
    if (!isMissingColumnError(error)) {
      console.error('Webhook Stripe: nie udalo sie pobrac danych parafii do e-maila billing:', error);
      return baseFallback;
    }

    const { data: fallbackData } = await supabaseAdmin
      .from('parafie')
      .select('nazwa')
      .eq('id', parafiaId)
      .limit(1)
      .maybeSingle();
    const fallbackName = getString((fallbackData as Record<string, unknown> | null)?.nazwa) || 'Parafia';
    return { ...baseFallback, parafiaName: fallbackName };
  }

  const row = (data || {}) as Record<string, unknown>;
  return {
    parafiaName: getString(row.nazwa) || 'Parafia',
    invoiceType: getString(row.invoice_type),
    invoiceEmail: getString(row.invoice_email),
    invoiceFullName: getString(row.invoice_full_name),
    invoiceCompanyName: getString(row.invoice_company_name),
    invoiceTaxId: getString(row.invoice_tax_id),
    invoiceStreet: getString(row.invoice_street),
    invoicePostalCode: getString(row.invoice_postal_code),
    invoiceCity: getString(row.invoice_city),
    invoiceCountry: getString(row.invoice_country),
    invoiceEmailConsent: getBoolean(row.invoice_email_consent),
  };
}

async function sendPaidCheckoutNotificationEmail(
  eventId: string,
  parafiaId: string,
  sessionMode: string | null,
  sessionObject: Record<string, unknown>
) {
  if (!RESEND_API_KEY) return;
  if (BILLING_NOTIFICATION_RECIPIENTS.length === 0) return;

  const billingSnapshot = await loadParafiaBillingSnapshot(parafiaId);
  const amountTotal = getNumber(getObjectValue(sessionObject, 'amount_total'));
  const currency = getString(getObjectValue(sessionObject, 'currency'));
  const checkoutSessionId = getString(getObjectValue(sessionObject, 'id'));
  const paymentIntentId = getString(getObjectValue(sessionObject, 'payment_intent'));
  const stripeCustomerEmail = (
    getNestedString(getObjectValue(sessionObject, 'customer_details'), 'email') ||
    getString(getObjectValue(sessionObject, 'customer_email'))
  );
  const flowLabel = sessionMode === 'payment'
    ? 'Jednorazowa platnosc Premium (1 rok)'
    : 'Subskrypcja Premium (auto-odnowienie)';
  const nowIso = new Date().toISOString();
  const subject = `[Premium] Oplacona platnosc - ${billingSnapshot.parafiaName}`;
  const text = [
    'Nowa oplacona platnosc Premium.',
    '',
    `Parafia: ${billingSnapshot.parafiaName}`,
    `Typ platnosci: ${flowLabel}`,
    `Kwota: ${formatAmount(amountTotal, currency)}`,
    `Kupujacy e-mail (Stripe): ${stripeCustomerEmail || '-'}`,
    `Parafia ID: ${parafiaId}`,
    `Checkout Session ID: ${checkoutSessionId || '-'}`,
    `Payment Intent ID: ${paymentIntentId || '-'}`,
    `Stripe Event ID: ${eventId}`,
    `Data (UTC): ${nowIso}`,
    '',
    'Dane do faktury (z formularza):',
    `- Typ: ${toInvoiceTypeLabel(billingSnapshot.invoiceType)}`,
    `- Nabywca: ${billingSnapshot.invoiceFullName || '-'}`,
    `- Firma / parafia: ${billingSnapshot.invoiceCompanyName || '-'}`,
    `- NIP / VAT ID: ${billingSnapshot.invoiceTaxId || '-'}`,
    `- E-mail do faktury: ${billingSnapshot.invoiceEmail || '-'}`,
    `- Adres: ${formatAddress(billingSnapshot)}`,
    `- Kraj: ${billingSnapshot.invoiceCountry || '-'}`,
    `- Zgoda na wysylke faktury e-mailem: ${toConsentLabel(billingSnapshot.invoiceEmailConsent)}`,
  ].join('\n');

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: BILLING_NOTIFICATION_FROM,
        to: BILLING_NOTIFICATION_RECIPIENTS,
        subject,
        text,
      }),
    });

    if (!response.ok) {
      const details = await response.text().catch(() => '');
      console.error('Webhook Stripe: wysylka maila billing nieudana:', response.status, details);
    }
  } catch (err) {
    console.error('Webhook Stripe: blad wysylki maila billing:', err);
  }
}

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

async function getExtendedPremiumExpiry(parafiaId: string) {
  const now = new Date();
  const fallback = new Date(now);
  fallback.setFullYear(fallback.getFullYear() + 1);

  const { data, error } = await supabaseAdmin
    .from('parafie')
    .select('premium_expires_at')
    .eq('id', parafiaId)
    .limit(1)
    .maybeSingle();

  if (error) {
    if (!isMissingColumnError(error)) {
      console.error('Nie udalo sie pobrac premium_expires_at:', error);
    }
    return fallback.toISOString();
  }

  const currentRaw = typeof data?.premium_expires_at === 'string' ? data.premium_expires_at : null;
  if (!currentRaw) return fallback.toISOString();

  const currentDate = new Date(currentRaw);
  if (Number.isNaN(currentDate.getTime()) || currentDate.getTime() <= now.getTime()) {
    return fallback.toISOString();
  }

  const extended = new Date(currentDate);
  extended.setFullYear(extended.getFullYear() + 1);
  return extended.toISOString();
}

async function applyOneTimePremium(parafiaId: string, stripeCustomerId: string | null) {
  const premiumExpiresAt = await getExtendedPremiumExpiry(parafiaId);
  await updateParafiaBilling(parafiaId, {
    tier: 'premium',
    is_active: true,
    premium_status: 'active',
    premium_source: 'stripe_one_time',
    premium_expires_at: premiumExpiresAt,
    stripe_customer_id: stripeCustomerId,
    stripe_subscription_id: null,
  });
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

async function resolveParafiaIdBySessionObject(object: Record<string, unknown>) {
  const fromClientRef = normalizeParafiaId(getObjectValue(object, 'client_reference_id'));
  if (fromClientRef) return fromClientRef;

  const fromMetadata = normalizeParafiaId(getNestedString(getObjectValue(object, 'metadata'), 'parafia_id'));
  if (fromMetadata) return fromMetadata;

  const customerId = normalizeParafiaId(getObjectValue(object, 'customer'));
  if (!customerId) return null;

  return findParafiaIdByColumn('stripe_customer_id', customerId);
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
      const hintedParafiaId = await resolveParafiaIdBySessionObject(object);
      const subscriptionId = normalizeParafiaId(getObjectValue(object, 'subscription'));
      const sessionMode = normalizeParafiaId(getObjectValue(object, 'mode'));
      const customerId = normalizeParafiaId(getObjectValue(object, 'customer'));
      const paymentStatus = normalizeParafiaId(getObjectValue(object, 'payment_status'));

      if (sessionMode === 'payment' && paymentStatus === 'paid' && hintedParafiaId) {
        await applyOneTimePremium(hintedParafiaId, customerId);
      } else if (sessionMode === 'payment' && hintedParafiaId) {
        console.warn('Webhook Stripe payment session bez statusu paid:', event.id);
      }

      if (subscriptionId) {
        const subscription = await fetchSubscriptionById(subscriptionId);
        await applySubscriptionState(subscription, hintedParafiaId);
      } else if (hintedParafiaId && sessionMode !== 'payment') {
        await updateParafiaBilling(hintedParafiaId, {
          tier: 'premium',
          is_active: true,
          premium_status: 'active',
          premium_source: 'stripe',
        });
      }

      if (paymentStatus === 'paid' && hintedParafiaId) {
        await sendPaidCheckoutNotificationEmail(event.id, hintedParafiaId, sessionMode, object);
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
