import { createHash } from 'crypto';

export type AppleVerifyPayload = {
  parafiaId: string;
  productId: string;
  transactionId: string;
  originalTransactionId: string | null;
  bundleId: string;
};

const normalizeText = (value: unknown) => String(value ?? '').trim();

export const parseAppleVerifyPayload = (
  input: unknown
): { ok: true; data: AppleVerifyPayload } | { ok: false; error: string } => {
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'Brak danych zakupu App Store.' };
  }

  const raw = input as Record<string, unknown>;
  const parafiaId = normalizeText(raw.parafiaId);
  const productId = normalizeText(raw.productId);
  const transactionId = normalizeText(raw.transactionId);
  const originalTransactionIdRaw = normalizeText(raw.originalTransactionId);
  const bundleId = normalizeText(raw.bundleId);

  if (!parafiaId) return { ok: false, error: 'Brak parafiaId.' };
  if (!productId) return { ok: false, error: 'Brak productId App Store.' };
  if (!transactionId) return { ok: false, error: 'Brak transactionId App Store.' };
  if (!bundleId) return { ok: false, error: 'Brak bundleId aplikacji.' };

  return {
    ok: true,
    data: {
      parafiaId,
      productId,
      transactionId,
      originalTransactionId: originalTransactionIdRaw || null,
      bundleId,
    },
  };
};

export const hashAppleTransactionId = (transactionId: string) => (
  createHash('sha256').update(transactionId).digest('hex')
);
