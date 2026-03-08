-- 1. UTWORZENIE TABELI Z KODAMI PROMOCYJNYMI (DLA ADMINA)
CREATE TABLE IF NOT EXISTS public.discount_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    discount_percent INTEGER NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 100),
    max_uses INTEGER DEFAULT NULL,
    times_used INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. ROZSZERZANIE PARAFII O WERSJE PLATNE I KONTINGENTY
-- Dodanie kolumny do parishes jezeli ich tam jeszcze nie ma
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='parishes' AND column_name='subscription_tier') THEN
        ALTER TABLE public.parishes ADD COLUMN subscription_tier TEXT DEFAULT 'FREE';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='parishes' AND column_name='used_discount_id') THEN
        ALTER TABLE public.parishes ADD COLUMN used_discount_id UUID REFERENCES public.discount_codes(id);
    END IF;
END $$;
