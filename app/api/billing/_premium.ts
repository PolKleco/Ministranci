import { isMissingColumnError, supabaseAdmin } from './stripe/_shared';

type PremiumSource = 'stripe' | 'stripe_one_time' | 'google_play' | 'app_store' | 'kod_rabatowy' | 'manual';

const addYearsIso = (date: Date, years: number) => {
  const next = new Date(date);
  next.setFullYear(next.getFullYear() + years);
  return next.toISOString();
};

export async function getExtendedPremiumExpiry(parafiaId: string, years = 1) {
  const now = new Date();
  const fallbackIso = addYearsIso(now, years);

  const { data, error } = await supabaseAdmin
    .from('parafie')
    .select('premium_expires_at')
    .eq('id', parafiaId)
    .limit(1)
    .maybeSingle();

  if (error) {
    if (!isMissingColumnError(error)) {
      console.error('Billing: nie udało się pobrać premium_expires_at:', error);
    }
    return fallbackIso;
  }

  const currentRaw = typeof data?.premium_expires_at === 'string' ? data.premium_expires_at : null;
  if (!currentRaw) return fallbackIso;

  const currentDate = new Date(currentRaw);
  if (Number.isNaN(currentDate.getTime()) || currentDate.getTime() <= now.getTime()) {
    return fallbackIso;
  }

  return addYearsIso(currentDate, years);
}

export async function activateParafiaPremium(
  parafiaId: string,
  source: PremiumSource,
  premiumExpiresAt: string
) {
  let { error: updateError } = await supabaseAdmin
    .from('parafie')
    .update({
      tier: 'premium',
      is_active: true,
      premium_status: 'active',
      premium_source: source,
      premium_expires_at: premiumExpiresAt,
    })
    .eq('id', parafiaId);

  if (updateError && isMissingColumnError(updateError)) {
    const fallback = await supabaseAdmin
      .from('parafie')
      .update({ tier: 'premium' })
      .eq('id', parafiaId);
    updateError = fallback.error;
  }

  if (updateError) {
    throw new Error(`Nie udało się aktywować Premium (${source}): ${updateError.message}`);
  }
}
