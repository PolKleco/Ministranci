-- TABELA NA KODY RABATOWE GENEROWANE PRZEZ ADMINA
CREATE TABLE IF NOT EXISTS public.discount_codes (
    code_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_percentage INT NOT NULL CHECK (discount_percentage BETWEEN 1 AND 100),
    max_uses INT DEFAULT NULL,
    times_used INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by_admin UUID REFERENCES auth.users(id) -- Admin link
);

-- TABELA SUBSKRYPCJI PARAFII
CREATE TABLE IF NOT EXISTS public.parish_subscriptions (
    subscription_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parish_id UUID REFERENCES public.parishes(id) ON DELETE CASCADE,
    tier VARCHAR(20) DEFAULT 'FREE', -- 'FREE' or 'PREMIUM'
    applied_discount_id UUID REFERENCES public.discount_codes(code_id),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS (Zasady czytania)
ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parish_subscriptions ENABLE ROW LEVEL SECURITY;

-- Wypisywanie dla księży oraz admina...
-- Todo: RLS Policies for admin and parishes reading their plans

-- Funkcja RPC do bezpiecznego realizowania kodu rabatowego (transakcja)
CREATE OR REPLACE FUNCTION public.redeem_discount_code(
    p_code TEXT,
    p_parish_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_code_id UUID;
    v_max_uses INT;
    v_times_used INT;
BEGIN
    -- 1. Pobierz kod i zablokuj wiersz (FOR UPDATE)
    SELECT code_id, max_uses, times_used
    INTO v_code_id, v_max_uses, v_times_used
    FROM public.discount_codes
    WHERE code = p_code
    FOR UPDATE;

    -- 2. Walidacja
    IF v_code_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Nieprawidłowy kod rabatowy');
    END IF;

    IF v_max_uses IS NOT NULL AND v_times_used >= v_max_uses THEN
        RETURN jsonb_build_object('success', false, 'message', 'Kod został już wykorzystany');
    END IF;

    -- 3. Inkrementacja
    UPDATE public.discount_codes
    SET times_used = times_used + 1
    WHERE code_id = v_code_id;

    -- 4. Aktywacja subskrypcji (na rok)
    INSERT INTO public.parish_subscriptions (parish_id, tier, applied_discount_id, expires_at)
    VALUES (p_parish_id, 'PREMIUM', v_code_id, (now() + interval '1 year'));

    RETURN jsonb_build_object('success', true, 'message', 'Pakiet Premium został aktywowany!');
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', 'Wystąpił błąd bazy danych: ' || SQLERRM);
END;
$$;
