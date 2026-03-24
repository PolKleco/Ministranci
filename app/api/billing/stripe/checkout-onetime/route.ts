import { NextRequest, NextResponse } from 'next/server';
import { buildStripeFormPayload, stripeRequest } from '@/lib/stripe';
import {
  findParafiaForAdmin,
  getAuthUser,
  isMissingColumnError,
  parseInvoiceData,
  persistParafiaInvoiceData,
  type InvoiceData,
  supabaseAdmin,
} from '../_shared';

type StripeCustomerResponse = {
  id: string;
};

type StripeCheckoutSessionResponse = {
  id: string;
  url: string | null;
};

const normalizeTaxIdForStripe = (invoiceData: InvoiceData) => {
  if (invoiceData.invoiceType !== 'company' || !invoiceData.taxId) return null;
  if (/^[A-Z]{2}/.test(invoiceData.taxId)) return invoiceData.taxId;
  return `${invoiceData.country}${invoiceData.taxId}`;
};

async function attachCompanyTaxId(customerId: string, invoiceData: InvoiceData) {
  const taxId = normalizeTaxIdForStripe(invoiceData);
  if (!taxId) return;
  try {
    await stripeRequest(`/customers/${encodeURIComponent(customerId)}/tax_ids`, {
      method: 'POST',
      form: buildStripeFormPayload([
        ['type', 'eu_vat'],
        ['value', taxId],
      ]),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (!message.toLowerCase().includes('already')) {
      console.warn('Nie udalo sie dodac tax_id do klienta Stripe:', message);
    }
  }
}

const buildCustomerPayload = (invoiceData: InvoiceData, parafiaId: string, adminId: string, fallbackName: string) => {
  const displayName = invoiceData.invoiceType === 'company'
    ? (invoiceData.companyName || fallbackName)
    : invoiceData.fullName;
  return buildStripeFormPayload([
    ['email', invoiceData.email],
    ['name', displayName],
    ['address[line1]', invoiceData.street],
    ['address[city]', invoiceData.city],
    ['address[postal_code]', invoiceData.postalCode],
    ['address[country]', invoiceData.country],
    ['metadata[parafia_id]', parafiaId],
    ['metadata[admin_id]', adminId],
    ['metadata[invoice_type]', invoiceData.invoiceType],
    ['metadata[invoice_full_name]', invoiceData.fullName],
    ['metadata[invoice_company_name]', invoiceData.companyName],
    ['metadata[invoice_tax_id]', invoiceData.taxId],
    ['metadata[invoice_email_consent]', invoiceData.consentEmailInvoice ? 'true' : 'false'],
  ]);
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
    const parsedInvoice = parseInvoiceData(body?.invoiceData);
    if (!parsedInvoice.ok) {
      return NextResponse.json({ error: parsedInvoice.error }, { status: 400 });
    }
    const invoiceData = parsedInvoice.data;

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

    await persistParafiaInvoiceData(parafiaId, authUser.id, invoiceData);

    let customerId = typeof parafia.stripe_customer_id === 'string'
      ? parafia.stripe_customer_id
      : null;

    if (!customerId) {
      const customerPayload = buildCustomerPayload(invoiceData, parafiaId, authUser.id, parafiaName);
      const customer = await stripeRequest<StripeCustomerResponse>('/customers', {
        method: 'POST',
        form: customerPayload,
      });
      customerId = customer.id;
      await attachCompanyTaxId(customerId, invoiceData);

      const { error: persistCustomerError } = await supabaseAdmin
        .from('parafie')
        .update({ stripe_customer_id: customerId })
        .eq('id', parafiaId)
        .eq('admin_id', authUser.id);

      if (persistCustomerError && !isMissingColumnError(persistCustomerError)) {
        console.error('Nie udalo sie zapisac stripe_customer_id:', persistCustomerError);
      }
    } else {
      await stripeRequest<StripeCustomerResponse>(`/customers/${encodeURIComponent(customerId)}`, {
        method: 'POST',
        form: buildCustomerPayload(invoiceData, parafiaId, authUser.id, parafiaName),
      });
      await attachCompanyTaxId(customerId, invoiceData);
    }

    const checkoutEntries: Array<[string, string | number | boolean | null | undefined]> = [
      ['mode', 'payment'],
      ['customer', customerId],
      ['billing_address_collection', 'required'],
      ['line_items[0][price]', priceId],
      ['line_items[0][quantity]', 1],
      ['allow_promotion_codes', true],
      ['client_reference_id', parafiaId],
      ['success_url', `${appUrl}/app?stripe=success`],
      ['cancel_url', `${appUrl}/app?stripe=cancel`],
      ['metadata[parafia_id]', parafiaId],
      ['metadata[admin_id]', authUser.id],
      ['metadata[payment_flow]', 'one_time_yearly'],
      ['metadata[invoice_type]', invoiceData.invoiceType],
      ['metadata[invoice_email]', invoiceData.email],
      ['metadata[invoice_full_name]', invoiceData.fullName],
      ['metadata[invoice_company_name]', invoiceData.companyName],
      ['metadata[invoice_tax_id]', invoiceData.taxId],
      ['metadata[invoice_email_consent]', invoiceData.consentEmailInvoice ? 'true' : 'false'],
    ];
    if (invoiceData.invoiceType === 'company') {
      checkoutEntries.push(['tax_id_collection[enabled]', true]);
    }
    const checkoutPayload = buildStripeFormPayload(checkoutEntries);

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
