import { decodeJwt, importPKCS8, SignJWT } from 'jose';
import { NextRequest, NextResponse } from 'next/server';
import { BILLING_CONFIG } from '../../_config';
import { activateParafiaPremium, getExtendedPremiumExpiry } from '../../_premium';
import { getClientPlatform } from '../../_platform';
import {
  findParafiaForAdmin,
  getAuthUser,
  supabaseAdmin,
} from '../../stripe/_shared';
import { hashAppleTransactionId, parseAppleVerifyPayload } from '../_shared';

type StoredEntitlement = {
  id: string;
  status: string | null;
  current_period_end: string | null;
};

type AppleTransactionResponse = {
  signedTransactionInfo?: string;
};

type AppleTransactionClaims = {
  transactionId?: string | number;
  originalTransactionId?: string | number;
  productId?: string;
  bundleId?: string;
  expiresDate?: string | number;
  purchaseDate?: string | number;
  environment?: string;
  type?: string;
  [key: string]: unknown;
};

const APP_STORE_API_BASE_URL = 'https://api.storekit.itunes.apple.com';
const APP_STORE_SANDBOX_API_BASE_URL = 'https://api.storekit-sandbox.itunes.apple.com';

const normalizeText = (value: unknown) => String(value ?? '').trim();

const parseMillis = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) return Math.floor(value);
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return null;
};

const buildAppleServerToken = async (bundleId: string) => {
  const issuerId = BILLING_CONFIG.appStore.issuerId;
  const keyId = BILLING_CONFIG.appStore.keyId;
  const privateKeyRaw = BILLING_CONFIG.appStore.privateKey;

  if (!issuerId || !keyId || !privateKeyRaw) {
    throw new Error(
      'Brak konfiguracji Apple App Store Server API (APPLE_APP_STORE_ISSUER_ID / APPLE_APP_STORE_KEY_ID / APPLE_APP_STORE_PRIVATE_KEY).'
    );
  }

  const privateKey = await importPKCS8(privateKeyRaw.replace(/\\n/g, '\n'), 'ES256');
  const nowSeconds = Math.floor(Date.now() / 1000);

  return new SignJWT({ bid: bundleId })
    .setProtectedHeader({ alg: 'ES256', kid: keyId, typ: 'JWT' })
    .setIssuer(issuerId)
    .setAudience('appstoreconnect-v1')
    .setIssuedAt(nowSeconds)
    .setExpirationTime(nowSeconds + 5 * 60)
    .sign(privateKey);
};

const fetchAppleTransactionClaims = async (transactionId: string, bundleId: string) => {
  const jwt = await buildAppleServerToken(bundleId);
  const encodedTransactionId = encodeURIComponent(transactionId);
  const bases = [APP_STORE_API_BASE_URL, APP_STORE_SANDBOX_API_BASE_URL];
  let lastErrorMessage = '';

  for (const baseUrl of bases) {
    const response = await fetch(`${baseUrl}/inApps/v1/transactions/${encodedTransactionId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      const apiMessage = normalizeText((payload as Record<string, unknown>)?.errorMessage);
      const fallbackMessage = normalizeText((payload as Record<string, unknown>)?.errorCode);
      lastErrorMessage = apiMessage || fallbackMessage || `HTTP ${response.status}`;
      continue;
    }

    const payload = await response.json().catch(() => ({})) as AppleTransactionResponse;
    const signedTransactionInfo = normalizeText(payload?.signedTransactionInfo);
    if (!signedTransactionInfo) {
      throw new Error('App Store nie zwrócił signedTransactionInfo.');
    }

    const claims = decodeJwt(signedTransactionInfo) as AppleTransactionClaims;
    return { claims, sourceBaseUrl: baseUrl };
  }

  throw new Error(
    lastErrorMessage
      ? `Nie udało się zweryfikować transakcji w App Store (${lastErrorMessage}).`
      : 'Nie udało się zweryfikować transakcji w App Store.'
  );
};

export async function POST(request: NextRequest) {
  try {
    const platform = getClientPlatform(request);
    if (platform !== 'ios-app') {
      return NextResponse.json(
        { error: 'App Store Billing jest dostępny tylko dla aplikacji iOS.' },
        { status: 403 }
      );
    }

    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const parsedPayload = parseAppleVerifyPayload(body);
    if (!parsedPayload.ok) {
      return NextResponse.json({ error: parsedPayload.error }, { status: 400 });
    }
    const payload = parsedPayload.data;

    const expectedBundleId = BILLING_CONFIG.appStore.bundleId || payload.bundleId;
    if (payload.bundleId !== expectedBundleId) {
      return NextResponse.json(
        { error: `Nieprawidłowy bundleId. Oczekiwano: ${expectedBundleId}.` },
        { status: 400 }
      );
    }

    const expectedProductId = BILLING_CONFIG.appStore.premiumProductId;
    if (payload.productId !== expectedProductId) {
      return NextResponse.json(
        { error: `Nieprawidłowy productId. Oczekiwano: ${expectedProductId}.` },
        { status: 400 }
      );
    }

    const parafia = await findParafiaForAdmin(payload.parafiaId, authUser.id);
    if (!parafia) {
      return NextResponse.json({ error: 'Parafia nie znaleziona lub brak dostępu.' }, { status: 403 });
    }

    const appleVerification = await fetchAppleTransactionClaims(payload.transactionId, expectedBundleId);
    const claims = appleVerification.claims;

    const claimBundleId = normalizeText(claims.bundleId);
    if (!claimBundleId || claimBundleId !== expectedBundleId) {
      return NextResponse.json({ error: 'BundleId transakcji App Store nie pasuje do aplikacji.' }, { status: 400 });
    }

    const claimProductId = normalizeText(claims.productId);
    if (!claimProductId || claimProductId !== expectedProductId) {
      return NextResponse.json({ error: 'ProductId transakcji App Store nie pasuje do Premium.' }, { status: 400 });
    }

    const claimTransactionId = normalizeText(claims.transactionId);
    if (!claimTransactionId || claimTransactionId !== payload.transactionId) {
      return NextResponse.json({ error: 'transactionId z App Store nie pasuje do żądania.' }, { status: 400 });
    }

    const claimOriginalTransactionId = normalizeText(claims.originalTransactionId) || payload.originalTransactionId;
    const expiresMs = parseMillis(claims.expiresDate);
    const purchaseMs = parseMillis(claims.purchaseDate);
    const nowIso = new Date().toISOString();

    const transactionHash = hashAppleTransactionId(claimTransactionId);
    const { data: existingEntitlement, error: existingEntitlementError } = await supabaseAdmin
      .from('billing_entitlements')
      .select('id,status,current_period_end')
      .eq('provider', 'app_store')
      .eq('external_purchase_token_hash', transactionHash)
      .maybeSingle<StoredEntitlement>();

    if (existingEntitlementError) {
      console.error('Apple verify: lookup billing_entitlements error:', existingEntitlementError);
      return NextResponse.json(
        {
          error: 'Brak tabeli billing_entitlements lub błąd dostępu. Uruchom migrację SQL add-google-billing-core.sql.',
        },
        { status: 500 }
      );
    }

    let premiumExpiresAt = existingEntitlement?.current_period_end || null;
    if (expiresMs) {
      premiumExpiresAt = new Date(expiresMs).toISOString();
    } else if (purchaseMs) {
      const fallbackFromPurchase = new Date(purchaseMs);
      fallbackFromPurchase.setFullYear(fallbackFromPurchase.getFullYear() + 1);
      premiumExpiresAt = fallbackFromPurchase.toISOString();
    } else if (!premiumExpiresAt) {
      premiumExpiresAt = await getExtendedPremiumExpiry(payload.parafiaId);
    }

    await activateParafiaPremium(payload.parafiaId, 'app_store', premiumExpiresAt);

    const entitlementPayload = {
      parafia_id: payload.parafiaId,
      provider: 'app_store',
      platform: 'ios',
      billing_product_id: claimProductId,
      billing_base_plan_id: null,
      billing_offer_id: null,
      external_customer_id: null,
      external_subscription_id: claimOriginalTransactionId || null,
      external_order_id: claimTransactionId,
      external_purchase_token_hash: transactionHash,
      status: 'active',
      starts_at: nowIso,
      current_period_end: premiumExpiresAt,
      auto_renew: false,
      raw_payload: {
        source: 'apple_verify_endpoint',
        verified_by: 'app_store_server_api',
        verification_base_url: appleVerification.sourceBaseUrl,
        request_bundle_id: payload.bundleId,
        request_product_id: payload.productId,
        claim_environment: normalizeText(claims.environment) || null,
        claim_type: normalizeText(claims.type) || null,
      },
      updated_at: nowIso,
    };

    if (existingEntitlement?.id) {
      const { error: updateError } = await supabaseAdmin
        .from('billing_entitlements')
        .update(entitlementPayload)
        .eq('id', existingEntitlement.id);

      if (updateError) {
        console.error('Apple verify: update entitlement error:', updateError);
        return NextResponse.json({ error: 'Nie udało się zapisać statusu zakupu.' }, { status: 500 });
      }
    } else {
      const { error: insertError } = await supabaseAdmin
        .from('billing_entitlements')
        .insert({ ...entitlementPayload, created_at: nowIso });

      if (insertError) {
        console.error('Apple verify: insert entitlement error:', insertError);
        return NextResponse.json({ error: 'Nie udało się zapisać zakupu App Store.' }, { status: 500 });
      }
    }

    return NextResponse.json({
      ok: true,
      status: 'active',
      premium_expires_at: premiumExpiresAt,
      message: 'Premium zostało aktywowane.',
    });
  } catch (err) {
    console.error('Apple verify error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    );
  }
}
