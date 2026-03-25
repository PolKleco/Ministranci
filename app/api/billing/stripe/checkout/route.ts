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
    // Ignore duplicates/validation edge-cases and keep checkout flow alive.
    if (!message.toLowerCase().includes('already')) {
      console.warn('Nie udalo sie dodac tax_id do klienta Stripe:', message);
    }
  }
}

const buildCustomerPayload = (
  invoiceData: InvoiceData | null,
  parafiaId: string,
  adminId: string,
  fallbackName: string,
  fallbackEmail: string
) => {
  const displayName = invoiceData
    ? (invoiceData.invoiceType === 'company' ? (invoiceData.companyName || fallbackName) : invoiceData.fullName)
    : fallbackName;

  return buildStripeFormPayload([
    ['email', invoiceData?.email || fallbackEmail],
    ['name', displayName],
    ['address[line1]', invoiceData?.street || null],
    ['address[city]', invoiceData?.city || null],
    ['address[postal_code]', invoiceData?.postalCode || null],
    ['address[country]', invoiceData?.country || null],
    ['metadata[parafia_id]', parafiaId],
    ['metadata[admin_id]', adminId],
    ['metadata[invoice_type]', invoiceData?.invoiceType || null],
    ['metadata[invoice_full_name]', invoiceData?.fullName || null],
    ['metadata[invoice_company_name]', invoiceData?.companyName || null],
    ['metadata[invoice_tax_id]', invoiceData?.taxId || null],
    ['metadata[invoice_email_consent]', invoiceData ? (invoiceData.consentEmailInvoice ? 'true' : 'false') : null],
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
    const rawInvoiceData = body?.invoiceData;
    const hasInvoiceData = Boolean(rawInvoiceData && typeof rawInvoiceData === 'object');
    let invoiceData: InvoiceData | null = null;
    if (hasInvoiceData) {
      const parsedInvoice = parseInvoiceData(rawInvoiceData);
      if (!parsedInvoice.ok) {
        return NextResponse.json({ error: parsedInvoice.error }, { status: 400 });
      }
      invoiceData = parsedInvoice.data;
    }

    const parafia = await findParafiaForAdmin(parafiaId, authUser.id);
    if (!parafia) {
      return NextResponse.json({ error: 'Parafia nie znaleziona lub brak dostepu' }, { status: 403 });
    }

    const priceId = process.env.STRIPE_PREMIUM_PRICE_ID?.trim();
    if (!priceId) {
      return NextResponse.json({ error: 'Brak konfiguracji STRIPE_PREMIUM_PRICE_ID' }, { status: 500 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || request.nextUrl.origin;
    const parafiaName = typeof parafia.nazwa === 'string' ? parafia.nazwa : 'Parafia';

    const fallbackEmail = typeof authUser.email === 'string' ? authUser.email.trim().toLowerCase() : '';
    if (!fallbackEmail && !invoiceData?.email) {
      return NextResponse.json({ error: 'Brak e-maila użytkownika do płatności.' }, { status: 400 });
    }

    if (invoiceData) {
      await persistParafiaInvoiceData(parafiaId, authUser.id, invoiceData);
    }

    let customerId = typeof parafia.stripe_customer_id === 'string'
      ? parafia.stripe_customer_id
      : null;

    if (!customerId) {
      const customerPayload = buildCustomerPayload(
        invoiceData,
        parafiaId,
        authUser.id,
        parafiaName,
        fallbackEmail
      );
      const customer = await stripeRequest<StripeCustomerResponse>('/customers', {
        method: 'POST',
        form: customerPayload,
      });
      customerId = customer.id;
      if (invoiceData) {
        await attachCompanyTaxId(customerId, invoiceData);
      }

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
        form: buildCustomerPayload(
          invoiceData,
          parafiaId,
          authUser.id,
          parafiaName,
          fallbackEmail
        ),
      });
      if (invoiceData) {
        await attachCompanyTaxId(customerId, invoiceData);
      }
    }

    const checkoutPayload = buildStripeFormPayload([
      ['mode', 'subscription'],
      ['customer', customerId],
      ['billing_address_collection', 'required'],
      ['line_items[0][price]', priceId],
      ['line_items[0][quantity]', 1],
      ['allow_promotion_codes', true],
      ['client_reference_id', parafiaId],
      ['success_url', `${appUrl}/app?stripe=success`],
      ['cancel_url', `${appUrl}/app?stripe=cancel`],
      ['subscription_data[metadata][parafia_id]', parafiaId],
      ['subscription_data[metadata][admin_id]', authUser.id],
      ['subscription_data[metadata][invoice_type]', invoiceData?.invoiceType || null],
      ['subscription_data[metadata][invoice_email]', invoiceData?.email || null],
      ['subscription_data[metadata][invoice_full_name]', invoiceData?.fullName || null],
      ['subscription_data[metadata][invoice_company_name]', invoiceData?.companyName || null],
      ['subscription_data[metadata][invoice_tax_id]', invoiceData?.taxId || null],
      ['subscription_data[metadata][invoice_email_consent]', invoiceData ? (invoiceData.consentEmailInvoice ? 'true' : 'false') : null],
      ['metadata[parafia_id]', parafiaId],
      ['metadata[admin_id]', authUser.id],
      ['metadata[invoice_type]', invoiceData?.invoiceType || null],
      ['metadata[invoice_email]', invoiceData?.email || null],
      ['metadata[invoice_full_name]', invoiceData?.fullName || null],
      ['metadata[invoice_company_name]', invoiceData?.companyName || null],
      ['metadata[invoice_tax_id]', invoiceData?.taxId || null],
      ['metadata[invoice_email_consent]', invoiceData ? (invoiceData.consentEmailInvoice ? 'true' : 'false') : null],
    ]);

    if (invoiceData?.invoiceType === 'company') {
      checkoutPayload.append('tax_id_collection[enabled]', 'true');
    }

    const session = await stripeRequest<StripeCheckoutSessionResponse>('/checkout/sessions', {
      method: 'POST',
      form: checkoutPayload,
    });

    if (!session.url) {
      return NextResponse.json({ error: 'Stripe nie zwrocil URL platnosci' }, { status: 502 });
    }

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    );
  }
}
