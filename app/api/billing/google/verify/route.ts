import { NextRequest, NextResponse } from 'next/server';
import { BILLING_CONFIG } from '../../_config';
import { activateParafiaPremium, getExtendedPremiumExpiry } from '../../_premium';
import { getClientPlatform } from '../../_platform';
import {
  findParafiaForAdmin,
  getAuthUser,
  supabaseAdmin,
} from '../../stripe/_shared';
import { hashPurchaseToken, parseGoogleVerifyPayload } from '../_shared';

type StoredEntitlement = {
  id: string;
  status: string | null;
  current_period_end: string | null;
};

export async function POST(request: NextRequest) {
  try {
    const platform = getClientPlatform(request);
    if (platform !== 'android-app') {
      return NextResponse.json(
        { error: 'Google Play Billing jest dostępny tylko dla aplikacji Android.' },
        { status: 403 }
      );
    }

    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const parsedPayload = parseGoogleVerifyPayload(body);
    if (!parsedPayload.ok) {
      return NextResponse.json({ error: parsedPayload.error }, { status: 400 });
    }
    const payload = parsedPayload.data;

    const expectedPackageName = BILLING_CONFIG.googlePlay.packageName;
    if (expectedPackageName && payload.packageName !== expectedPackageName) {
      return NextResponse.json(
        { error: 'Nieprawidłowy packageName dla tej aplikacji.' },
        { status: 400 }
      );
    }

    const expectedProductId = BILLING_CONFIG.googlePlay.premiumProductId;
    if (payload.productId !== expectedProductId) {
      return NextResponse.json(
        { error: `Nieprawidłowy productId. Oczekiwano: ${expectedProductId}.` },
        { status: 400 }
      );
    }

    const expectedPrepaidBasePlanId = BILLING_CONFIG.googlePlay.prepaidBasePlanId;
    if (payload.basePlanId !== expectedPrepaidBasePlanId) {
      return NextResponse.json(
        { error: `Dozwolona jest tylko przedpłata (basePlanId: ${expectedPrepaidBasePlanId}).` },
        { status: 400 }
      );
    }

    const parafia = await findParafiaForAdmin(payload.parafiaId, authUser.id);
    if (!parafia) {
      return NextResponse.json({ error: 'Parafia nie znaleziona lub brak dostępu.' }, { status: 403 });
    }

    const purchaseTokenHash = hashPurchaseToken(payload.purchaseToken);
    const nowIso = new Date().toISOString();

    const { data: existingEntitlement, error: existingEntitlementError } = await supabaseAdmin
      .from('billing_entitlements')
      .select('id,status,current_period_end')
      .eq('provider', 'google_play')
      .eq('external_purchase_token_hash', purchaseTokenHash)
      .maybeSingle<StoredEntitlement>();

    if (existingEntitlementError) {
      console.error('Google verify: lookup billing_entitlements error:', existingEntitlementError);
      return NextResponse.json(
        {
          error: 'Brak tabeli billing_entitlements lub błąd dostępu. Uruchom migrację SQL add-google-billing-core.sql.',
        },
        { status: 500 }
      );
    }

    const alreadyActive = existingEntitlement?.status === 'active';
    const entitlementShouldBeActive = payload.acknowledged === true || alreadyActive;

    let premiumExpiresAt = existingEntitlement?.current_period_end || null;
    if (payload.acknowledged === true && !alreadyActive) {
      premiumExpiresAt = await getExtendedPremiumExpiry(payload.parafiaId);
      await activateParafiaPremium(payload.parafiaId, 'google_play', premiumExpiresAt);
    }

    const entitlementPayload = {
      parafia_id: payload.parafiaId,
      provider: 'google_play',
      platform: 'android',
      billing_product_id: payload.productId,
      billing_base_plan_id: payload.basePlanId,
      billing_offer_id: payload.offerId,
      external_customer_id: null,
      external_subscription_id: payload.purchaseKind === 'subscription' ? payload.orderId : null,
      external_order_id: payload.orderId,
      external_purchase_token_hash: purchaseTokenHash,
      status: entitlementShouldBeActive ? 'active' : 'pending_verification',
      starts_at: nowIso,
      current_period_end: premiumExpiresAt,
      auto_renew: false,
      raw_payload: {
        source: 'google_verify_endpoint',
        purchaseKind: payload.purchaseKind,
        packageName: payload.packageName,
        basePlanId: payload.basePlanId,
        offerId: payload.offerId,
        acknowledged: payload.acknowledged,
      },
      updated_at: nowIso,
    };

    if (existingEntitlement?.id) {
      const { error: updateError } = await supabaseAdmin
        .from('billing_entitlements')
        .update(entitlementPayload)
        .eq('id', existingEntitlement.id);

      if (updateError) {
        console.error('Google verify: update entitlement error:', updateError);
        return NextResponse.json({ error: 'Nie udało się zapisać statusu zakupu.' }, { status: 500 });
      }
    } else {
      const { error: insertError } = await supabaseAdmin
        .from('billing_entitlements')
        .insert({ ...entitlementPayload, created_at: nowIso });

      if (insertError) {
        console.error('Google verify: insert entitlement error:', insertError);
        return NextResponse.json({ error: 'Nie udało się zapisać zakupu Google Play.' }, { status: 500 });
      }
    }

    if (entitlementShouldBeActive) {
      return NextResponse.json({
        ok: true,
        status: 'active',
        premium_expires_at: premiumExpiresAt,
        message: 'Premium zostało aktywowane.',
      });
    }

    return NextResponse.json({
      ok: false,
      status: 'pending_verification',
      message: 'Zakup zapisany, ale Google Play nie potwierdził jeszcze zakupu (acknowledged=false).',
    }, { status: 202 });
  } catch (err) {
    console.error('Google verify error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    );
  }
}
