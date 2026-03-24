import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

export type InvoiceType = 'company' | 'private';

export type InvoiceData = {
  invoiceType: InvoiceType;
  email: string;
  fullName: string;
  companyName: string | null;
  taxId: string | null;
  street: string;
  postalCode: string;
  city: string;
  country: string;
  consentEmailInvoice: boolean;
};

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function getAuthUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return null;
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

export function isMissingColumnError(error: { message?: string } | null) {
  const message = error?.message || '';
  return (
    message.includes('does not exist') ||
    message.includes("Could not find the '") ||
    message.includes('schema cache')
  );
}

const normalizeText = (value: unknown) => String(value ?? '').trim();

const normalizeTaxId = (value: unknown) => (
  normalizeText(value)
    .replace(/[\s-]/g, '')
    .toUpperCase()
);

const normalizePostalCode = (value: unknown) => (
  normalizeText(value)
    .replace(/\s+/g, '')
    .toUpperCase()
);

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidCountry(value: string) {
  return /^[A-Z]{2}$/.test(value);
}

function isValidTaxId(value: string) {
  // Accept plain NIP (10 digits) or VAT format with country prefix (e.g. PL123...).
  return /^[0-9]{10}$/.test(value) || /^[A-Z]{2}[A-Z0-9]{8,14}$/.test(value);
}

export function parseInvoiceData(input: unknown): { ok: true; data: InvoiceData } | { ok: false; error: string } {
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'Brak danych do faktury.' };
  }

  const raw = input as Record<string, unknown>;
  const invoiceType = normalizeText(raw.invoiceType);
  if (invoiceType !== 'company' && invoiceType !== 'private') {
    return { ok: false, error: 'Wybierz typ faktury: firma lub osoba prywatna.' };
  }

  const email = normalizeText(raw.email).toLowerCase();
  const fullName = normalizeText(raw.fullName);
  const companyNameRaw = normalizeText(raw.companyName);
  const taxIdRaw = normalizeTaxId(raw.taxId);
  const street = normalizeText(raw.street);
  const postalCode = normalizePostalCode(raw.postalCode);
  const city = normalizeText(raw.city);
  const country = normalizeText(raw.country || 'PL').toUpperCase();
  const consentEmailInvoice = raw.consentEmailInvoice === true;

  if (!isValidEmail(email)) {
    return { ok: false, error: 'Podaj poprawny adres e-mail do faktury.' };
  }
  if (fullName.length < 3) {
    return { ok: false, error: 'Podaj imie i nazwisko nabywcy.' };
  }
  if (street.length < 3) {
    return { ok: false, error: 'Podaj ulice i numer.' };
  }
  if (postalCode.length < 3) {
    return { ok: false, error: 'Podaj kod pocztowy.' };
  }
  if (city.length < 2) {
    return { ok: false, error: 'Podaj miasto.' };
  }
  if (!isValidCountry(country)) {
    return { ok: false, error: 'Podaj kod kraju, np. PL.' };
  }
  if (country !== 'PL') {
    return { ok: false, error: 'Sprzedaz Premium jest dostepna tylko w Polsce (PL).' };
  }
  if (!consentEmailInvoice) {
    return { ok: false, error: 'Aby kontynuowac, zaznacz zgode na wysylke faktury e-mailem.' };
  }

  if (invoiceType === 'company') {
    if (companyNameRaw.length < 2) {
      return { ok: false, error: 'Podaj nazwe firmy lub parafii do faktury.' };
    }
    if (!isValidTaxId(taxIdRaw)) {
      return { ok: false, error: 'Podaj poprawny NIP/VAT ID.' };
    }
  }

  const data: InvoiceData = {
    invoiceType,
    email,
    fullName,
    companyName: invoiceType === 'company' ? companyNameRaw : null,
    taxId: invoiceType === 'company' ? taxIdRaw : null,
    street,
    postalCode,
    city,
    country: 'PL',
    consentEmailInvoice,
  };
  return { ok: true, data };
}

export async function persistParafiaInvoiceData(parafiaId: string, adminId: string, invoiceData: InvoiceData) {
  const invoiceUpdates = {
    invoice_type: invoiceData.invoiceType,
    invoice_email: invoiceData.email,
    invoice_full_name: invoiceData.fullName,
    invoice_company_name: invoiceData.companyName,
    invoice_tax_id: invoiceData.taxId,
    invoice_street: invoiceData.street,
    invoice_postal_code: invoiceData.postalCode,
    invoice_city: invoiceData.city,
    invoice_country: invoiceData.country,
    invoice_email_consent: invoiceData.consentEmailInvoice,
    invoice_updated_at: new Date().toISOString(),
  };

  const { error } = await supabaseAdmin
    .from('parafie')
    .update(invoiceUpdates)
    .eq('id', parafiaId)
    .eq('admin_id', adminId);

  if (error && !isMissingColumnError(error)) {
    console.error('Nie udalo sie zapisac danych do faktury w parafii:', error);
  }
}

function isMissingImpersonationSchema(error: { message?: string } | null) {
  const message = error?.message || '';
  return (
    message.includes('admin_impersonation_sessions') &&
    (message.includes('does not exist') || message.includes("Could not find the table"))
  );
}

export async function findParafiaForAdmin(parafiaId: string, adminId: string) {
  const { data, error } = await supabaseAdmin
    .from('parafie')
    .select('*')
    .eq('id', parafiaId)
    .single();

  if (error || !data) return null;
  if (data.admin_id === adminId) return data as Record<string, unknown>;

  const { data: impersonationSession, error: impersonationError } = await supabaseAdmin
    .from('admin_impersonation_sessions')
    .select('id')
    .eq('admin_user_id', adminId)
    .eq('target_parafia_id', parafiaId)
    .eq('impersonated_typ', 'ksiadz')
    .is('ended_at', null)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (impersonationError) {
    if (isMissingImpersonationSchema(impersonationError)) {
      return null;
    }
    console.error('findParafiaForAdmin impersonation check error:', impersonationError);
    return null;
  }

  if (!impersonationSession) return null;

  return data as Record<string, unknown>;
}
