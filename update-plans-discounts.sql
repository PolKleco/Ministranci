-- 1. TABELA KODÓW ZNIŻKOWYCH (Tworzona przez panel admina)
CREATE TABLE IF NOT EXISTS public.discount_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_percentage INTEGER NOT NULL CHECK (discount_percentage > 0 AND discount_percentage <= 100),
    max_uses INTEGER DEFAULT NULL,
    times_used INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. ROZBUDOWA PARAFII O PLAN I KOD (Limit > 5 w logice wezmiemy na poziomie UI)
DO $$
BEGIN
    -- Dodajemy pole planu, jeśli go nie ma
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='parishes' AND column_name='subscription_tier') THEN
        ALTER TABLE public.parishes ADD COLUMN subscription_tier VARCHAR(20) DEFAULT 'FREE';
    END IF;

    -- Dodajemy pole do przypisania rabatu
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='parishes' AND column_name='used_discount_id') THEN
        ALTER TABLE public.parishes ADD COLUMN used_discount_id UUID REFERENCES public.discount_codes(id);
    END IF;
END $$;
