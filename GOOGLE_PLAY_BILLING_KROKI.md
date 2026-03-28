# Google Play Billing - proste kroki

## Co już jest gotowe w kodzie

- Stripe jest zablokowany dla kontekstu Android app.
- Stripe na web działa dalej bez zmian.
- Dodane są endpointy startowe pod Google:
  - `POST /api/billing/google/verify`
  - `POST /api/billing/google/rtdn`
- Dodany jest skrypt SQL: `add-google-billing-core.sql`.

## Co musisz zrobić ręcznie (Play Console)

1. Wejdź do Play Console i wybierz aplikację.
2. Wejdź w **Monetize -> Products -> Subscriptions**.
3. Dodaj subskrypcję roczną:
   - Product ID: `premium_yearly`
   - Base plan ID (przedpłata): `yearly-prepaid`
   - Cena: 299 PLN
4. Dodaj konta testowe:
   - **Settings -> License testing**.
5. Włącz Real-time Developer Notifications (RTDN):
   - podaj endpoint: `/api/billing/google/rtdn`
6. Utwórz konto service account w Google Cloud i nadaj mu dostęp do Play Developer API.
7. W backendzie ustaw zmienne środowiskowe:
   - `GOOGLE_PLAY_PACKAGE_NAME=net.ministranci.twa`

## Co będzie dalej

- Następny krok to podpięcie natywnego flow zakupu w Android app
  i wywołanie `POST /api/billing/google/verify` po udanym zakupie.
- Na końcu podpinamy automatyczne odnawianie/anulowanie przez RTDN.

## Ustalona mapa identyfikatorów (nie zmieniać)

- `google_product_id = premium_yearly`
- `billing_base_plan_id = yearly-prepaid`
- `stripe_price_id` zostaje tylko dla web.

## Ustalona polityka cen (nie zmieniać bez decyzji)

- Web (Stripe): `249 PLN / rok`
- Android (Google Play): `299 PLN / rok`
- iOS (App Store): `299 PLN / rok` (docelowo, po wdrożeniu iOS billing)
