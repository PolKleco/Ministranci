-- =============================================
-- GOOGLE PLAY BILLING: CORE TABLES
-- =============================================
-- Ten skrypt tworzy neutralną warstwę billingową.
-- Dzięki temu Stripe (web), Google Play (Android) i App Store (iOS)
-- mogą współdzielić jeden model danych.

CREATE TABLE IF NOT EXISTS public.billing_entitlements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  parafia_id UUID NOT NULL REFERENCES public.parafie(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('stripe', 'google_play', 'app_store', 'kod_rabatowy', 'manual')),
  platform TEXT NOT NULL CHECK (platform IN ('web', 'android', 'ios', 'server')),
  billing_product_id TEXT,
  billing_base_plan_id TEXT,
  billing_offer_id TEXT,
  external_customer_id TEXT,
  external_subscription_id TEXT,
  external_order_id TEXT,
  external_purchase_token_hash TEXT,
  status TEXT NOT NULL DEFAULT 'pending_verification'
    CHECK (status IN ('pending_verification', 'active', 'grace_period', 'paused', 'canceled', 'expired', 'revoked')),
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_period_end TIMESTAMPTZ,
  auto_renew BOOLEAN,
  raw_payload JSONB,
  received_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS billing_entitlements_parafia_id_idx
  ON public.billing_entitlements (parafia_id);

CREATE INDEX IF NOT EXISTS billing_entitlements_provider_status_idx
  ON public.billing_entitlements (provider, status);

CREATE UNIQUE INDEX IF NOT EXISTS billing_entitlements_provider_purchase_token_hash_uidx
  ON public.billing_entitlements (provider, external_purchase_token_hash)
  WHERE external_purchase_token_hash IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS billing_entitlements_provider_subscription_uidx
  ON public.billing_entitlements (provider, external_subscription_id)
  WHERE external_subscription_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.billing_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT NOT NULL CHECK (provider IN ('stripe', 'google_play', 'app_store', 'manual')),
  event_id TEXT,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  processing_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (processing_status IN ('pending', 'processed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS billing_events_provider_received_idx
  ON public.billing_events (provider, received_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS billing_events_provider_event_id_uidx
  ON public.billing_events (provider, event_id)
  WHERE event_id IS NOT NULL;
