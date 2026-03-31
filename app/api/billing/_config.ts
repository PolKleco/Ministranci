const normalizeText = (value: string | undefined) => (value || '').trim();

export const BILLING_CONFIG = {
  googlePlay: {
    packageName: normalizeText(process.env.GOOGLE_PLAY_PACKAGE_NAME),
    premiumProductId: normalizeText(process.env.GOOGLE_PLAY_PREMIUM_PRODUCT_ID) || 'premium_yearly',
    prepaidBasePlanId: normalizeText(process.env.GOOGLE_PLAY_PREPAID_BASE_PLAN_ID) || 'yearly-prepaid',
  },
  appStore: {
    bundleId: normalizeText(process.env.APPLE_IOS_BUNDLE_ID),
    premiumProductId: normalizeText(process.env.APPLE_PREMIUM_PRODUCT_ID) || 'premium_yearly_ios',
    issuerId: normalizeText(process.env.APPLE_APP_STORE_ISSUER_ID),
    keyId: normalizeText(process.env.APPLE_APP_STORE_KEY_ID),
    privateKey: normalizeText(process.env.APPLE_APP_STORE_PRIVATE_KEY),
  },
  stripe: {
    subscriptionPriceId: normalizeText(process.env.STRIPE_PREMIUM_PRICE_ID),
    oneTimePriceId: normalizeText(process.env.STRIPE_PREMIUM_ONETIME_PRICE_ID),
  },
} as const;
