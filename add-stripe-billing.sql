-- =============================================
-- STRIPE BILLING (ROCZNA SUBSKRYPCJA PREMIUM)
-- =============================================

ALTER TABLE public.parafie
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS premium_status TEXT DEFAULT 'inactive',
  ADD COLUMN IF NOT EXISTS premium_source TEXT,
  ADD COLUMN IF NOT EXISTS premium_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS invoice_type TEXT,
  ADD COLUMN IF NOT EXISTS invoice_email TEXT,
  ADD COLUMN IF NOT EXISTS invoice_full_name TEXT,
  ADD COLUMN IF NOT EXISTS invoice_company_name TEXT,
  ADD COLUMN IF NOT EXISTS invoice_tax_id TEXT,
  ADD COLUMN IF NOT EXISTS invoice_street TEXT,
  ADD COLUMN IF NOT EXISTS invoice_postal_code TEXT,
  ADD COLUMN IF NOT EXISTS invoice_city TEXT,
  ADD COLUMN IF NOT EXISTS invoice_country TEXT,
  ADD COLUMN IF NOT EXISTS invoice_email_consent BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS invoice_updated_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS parafie_stripe_customer_id_idx
  ON public.parafie (stripe_customer_id);

CREATE INDEX IF NOT EXISTS parafie_stripe_subscription_id_idx
  ON public.parafie (stripe_subscription_id);

-- Zachowujemy dotychczasowe premium z kodow rabatowych jako aktywne.
UPDATE public.parafie
SET premium_source = COALESCE(premium_source, 'kod_rabatowy'),
    premium_status = COALESCE(premium_status, 'active')
WHERE tier = 'premium';

UPDATE public.parafie
SET premium_status = COALESCE(premium_status, 'inactive')
WHERE tier <> 'premium' OR tier IS NULL;
