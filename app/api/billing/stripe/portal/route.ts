import { NextRequest, NextResponse } from 'next/server';
import { buildStripeFormPayload, stripeRequest } from '@/lib/stripe';
import { rejectExternalBillingOnMobile } from '../../_platform';
import { findParafiaForAdmin, getAuthUser } from '../_shared';

type StripePortalSessionResponse = {
  url: string;
};

export async function POST(request: NextRequest) {
  try {
    const billingBlockedResponse = rejectExternalBillingOnMobile(request);
    if (billingBlockedResponse) {
      return billingBlockedResponse;
    }

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

    const customerId = typeof parafia.stripe_customer_id === 'string'
      ? parafia.stripe_customer_id
      : '';
    if (!customerId) {
      return NextResponse.json({ error: 'Brak klienta Stripe dla tej parafii' }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || request.nextUrl.origin;
    const payload = buildStripeFormPayload([
      ['customer', customerId],
      ['return_url', `${appUrl}/app`],
    ]);

    const portalSession = await stripeRequest<StripePortalSessionResponse>('/billing_portal/sessions', {
      method: 'POST',
      form: payload,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (err) {
    console.error('Stripe portal error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    );
  }
}
