import { createHash } from 'crypto';

export type GooglePurchaseKind = 'subscription' | 'one_time';

export type GoogleVerifyPayload = {
  parafiaId: string;
  productId: string;
  purchaseToken: string;
  packageName: string;
  purchaseKind: GooglePurchaseKind;
  orderId: string | null;
  acknowledged: boolean | null;
};

const normalizeText = (value: unknown) => String(value ?? '').trim();

export const parseGoogleVerifyPayload = (
  input: unknown
): { ok: true; data: GoogleVerifyPayload } | { ok: false; error: string } => {
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'Brak danych zakupu Google Play.' };
  }

  const raw = input as Record<string, unknown>;
  const parafiaId = normalizeText(raw.parafiaId);
  const productId = normalizeText(raw.productId);
  const purchaseToken = normalizeText(raw.purchaseToken);
  const packageName = normalizeText(raw.packageName);
  const purchaseKindRaw = normalizeText(raw.purchaseKind).toLowerCase();
  const orderIdRaw = normalizeText(raw.orderId);

  if (!parafiaId) return { ok: false, error: 'Brak parafiaId.' };
  if (!productId) return { ok: false, error: 'Brak productId Google Play.' };
  if (!purchaseToken) return { ok: false, error: 'Brak purchaseToken Google Play.' };
  if (!packageName) return { ok: false, error: 'Brak packageName aplikacji.' };

  const purchaseKind: GooglePurchaseKind =
    purchaseKindRaw === 'one_time' || purchaseKindRaw === 'inapp'
      ? 'one_time'
      : 'subscription';

  return {
    ok: true,
    data: {
      parafiaId,
      productId,
      purchaseToken,
      packageName,
      purchaseKind,
      orderId: orderIdRaw || null,
      acknowledged: typeof raw.acknowledged === 'boolean' ? raw.acknowledged : null,
    },
  };
};

export const hashPurchaseToken = (purchaseToken: string) => (
  createHash('sha256').update(purchaseToken).digest('hex')
);
