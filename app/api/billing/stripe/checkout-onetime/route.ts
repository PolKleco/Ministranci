import { NextRequest, NextResponse } from 'next/server';
import { buildStripeFormPayload, stripeRequest } from '@/lib/stripe';
import { findParafiaForAdmin, getAuthUser, isMissingColumnError, supabaseAdmin } from '../_shared';

type StripeCustomerResponse = {
  id: string;
};

type StripeCheckoutSessionResponse = {
  id: string;
  url: string | null;
};

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const parafiaId = String(body?.parafiaId || '').trim();
    if (!parafiaId) {
      return NextResponse.json({ error: 'Brak parafiaId' }, { status: 400 });
    }

    const parafia = await findParafiaForAdmin(parafiaId, authUser.id);
    if (!parafia) {
      return NextResponse.json({ error: 'Parafia nie znaleziona lub brak dostepu' }, { status: 403 });
    }

    const priceId = process.env.STRIPE_PREMIUM_ONE_TIME_PRICE_ID?.trim();
    if (!priceId) {
      return NextResponse.json({ error: 'Brak konfiguracji STRIPE_PREMIUM_ONE_TIME_PRICE_ID' }, { status: 500 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || request.nextUrl.origin;
    const parafiaName = typeof parafia.nazwa === 'string' ? parafia.nazwa : 'Parafia';

    let customerId = typeof parafia.stripe_customer_id === 'string'
      ? parafia.stripe_customer_id
      : null;

    if (!customerId) {
      const customerPayload = buildStripeFormPayload([
        ['email', authUser.email || ''],
        ['name', parafiaName],
        ['metadata[parafia_id]', parafiaId],
        ['metadata[admin_id]', authUser.id],
      ]);
      const customer = await stripeRequest<StripeCustomerResponse>('/customers', {
        method: 'POST',
        form: customerPayload,
      });
      customerId = customer.id;

      const { error: persistCustomerError } = await supabaseAdmin
        .from('parafie')
        .update({ stripe_customer_id: customerId })
        .eq('id', parafiaId)
        .eq('admin_id', authUser.id);

      if (persistCustomerError && !isMissingColumnError(persistCustomerError)) {
        console.error('Nie udalo sie zapisac stripe_customer_id:', persistCustomerError);
      }
    }

    const checkoutPayload = buildStripeFormPayload([
      ['mode', 'payment'],
      ['customer', customerId],
      ['line_items[0][price]', priceId],
      ['line_items[0][quantity]', 1],
      ['allow_promotion_codes', true],
      ['client_reference_id', parafiaId],
      ['success_url', `${appUrl}/app?stripe=success`],
      ['cancel_url', `${appUrl}/app?stripe=cancel`],
      ['metadata[parafia_id]', parafiaId],
      ['metadata[admin_id]', authUser.id],
      ['metadata[payment_flow]', 'one_time_yearly'],
    ]);

    const session = await stripeRequest<StripeCheckoutSessionResponse>('/checkout/sessions', {
      method: 'POST',
      form: checkoutPayload,
    });

    if (!session.url) {
      return NextResponse.json({ error: 'Stripe nie zwrocil URL platnosci' }, { status: 502 });
    }

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error('Stripe one-time checkout error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    );
  }
}
