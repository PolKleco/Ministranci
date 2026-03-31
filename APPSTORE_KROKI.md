# App Store: przygotowanie po 28.04.2026

## Co jest już przygotowane w kodzie
- Frontend rozróżnia platformy: `web`, `android-app`, `ios-app`.
- Stripe działa tylko na webie.
- Android używa Google Play Billing.
- iOS ma osobny flow płatności (App Store Billing).
- Backend ma endpoint weryfikacji Apple:
  - `POST /api/billing/apple/verify`
- Premium jest aktywowane wspólną warstwą backendową (`billing_entitlements` + wspólne `tier=premium`).

## Wymagane ENV (serwer)
- `APPLE_IOS_BUNDLE_ID` np. `net.ministranci.ios`
- `APPLE_PREMIUM_PRODUCT_ID` np. `premium_yearly_ios`
- `APPLE_APP_STORE_ISSUER_ID` (App Store Connect API)
- `APPLE_APP_STORE_KEY_ID` (App Store Connect API)
- `APPLE_APP_STORE_PRIVATE_KEY` (plik `.p8`, w ENV z `\n`)
- `GOOGLE_PLAY_PACKAGE_NAME`
- `GOOGLE_PLAY_PREMIUM_PRODUCT_ID`
- `GOOGLE_PLAY_PREPAID_BASE_PLAN_ID`

## Wymagane ENV (frontend)
- `NEXT_PUBLIC_IOS_BUNDLE_ID` np. `net.ministranci.ios`
- `NEXT_PUBLIC_APPLE_PREMIUM_PRODUCT_ID` np. `premium_yearly_ios`
- `NEXT_PUBLIC_GOOGLE_PLAY_PREMIUM_PRODUCT_ID`
- `NEXT_PUBLIC_GOOGLE_PLAY_PREPAID_BASE_PLAN_ID`

## Kontrakt iOS (wrapper natywny)
1. Frontend uruchamia zakup deeplinkiem:
   - `ministranci-ios-billing://checkout?parafiaId=...&productId=...`
2. Wrapper po zakończeniu zakupu wraca do webu z hashem:
   - `#ap_purchase_status=success|pending|canceled|error`
   - `ap_parafia_id`
   - `ap_product_id`
   - `ap_transaction_id`
   - `ap_original_transaction_id` (opcjonalnie)
   - `ap_error` (gdy `status=error`)
3. Frontend woła backend:
   - `POST /api/billing/apple/verify`
4. Backend sam weryfikuje transakcję przez App Store Server API.

## Co robisz przed i po 28.04.2026
- Do 27.04.2026: możesz jeszcze testowo wrzucać buildy starym toolchainem.
- Od 28.04.2026: każdy nowy upload do App Store Connect buduj w `Xcode 26+` i `SDK 26+`.

## Krótka checklista publikacyjna
1. Załóż konto Apple Developer.
2. Utwórz appkę w App Store Connect (`bundle id` identyczny jak w iOS).
3. Dodaj produkt IAP (`APPLE_PREMIUM_PRODUCT_ID`).
4. Ustaw wszystkie ENV powyżej na serwerze.
5. Wgraj build iOS do TestFlight (Xcode 26+).
6. Zrób test zakupu sandbox i sprawdź aktywację Premium.
7. Wyślij do App Review.
