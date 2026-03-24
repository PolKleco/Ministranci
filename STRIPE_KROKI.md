# Stripe Premium - najprostszy plan (krok po kroku)

## 1. Co już jest zrobione w kodzie
- Endpoint rozpoczęcia płatności: `/api/billing/stripe/checkout`
- Endpoint panelu klienta Stripe: `/api/billing/stripe/portal`
- Webhook Stripe: `/api/billing/stripe/webhook`
- Przycisk płatności w modalu Premium + odliczanie dni do końca
- Migracja SQL z polami premium: `add-stripe-billing.sql`

## 2. Zrób migrację w Supabase
W SQL Editor odpal cały plik:
- `add-stripe-billing.sql`

## 3. Utwórz produkt roczny w Stripe
W Stripe Dashboard:
1. `Product catalog` -> `Add product`
2. Nazwa np. `Premium parafia`
3. Dodaj 2 ceny:
   - `Recurring` -> `Yearly` (auto-odnowienie)
   - `One-time` (jednorazowo za 1 rok)
4. Zapisz i skopiuj oba `price_id` (zaczynają się od `price_...`)

## 4. Ustaw zmienne środowiskowe
Dodaj do `.env.local`:

```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PREMIUM_PRICE_ID=price_...
STRIPE_PREMIUM_ONE_TIME_PRICE_ID=price_...
NEXT_PUBLIC_APP_URL=https://twoja-domena.pl
```

Na lokalnym dev możesz dać:
- `NEXT_PUBLIC_APP_URL=http://localhost:3000`

## 5. Dodaj webhook w Stripe
W Stripe:
1. `Developers` -> `Webhooks` -> `Add endpoint`
2. URL:
   - lokalnie (przez Stripe CLI): `http://localhost:3000/api/billing/stripe/webhook`
   - produkcja: `https://twoja-domena.pl/api/billing/stripe/webhook`
3. Zdarzenia:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
4. Zapisz i skopiuj `Signing secret` -> wklej do `STRIPE_WEBHOOK_SECRET`

## 6. Test działania
1. Zaloguj się jako ksiądz
2. Otwórz modal `Subskrypcja Premium`
3. Wypełnij obowiązkowe dane do faktury (`firma/parafia` albo `osoba prywatna`) i zaznacz zgodę na wysyłkę e-mailem
4. Kliknij `Zapłać online za Premium (rok)` albo `Zapłać jednorazowo za 1 rok`
5. Zrób testową płatność
6. Po powrocie do aplikacji zobaczysz premium i liczbę dni do końca okresu

## 7. Jak działa odliczanie
- Data końca trzymana jest w `parafie.premium_expires_at`
- UI pokazuje: `Do końca okresu: X dni`
- Po odnowieniu Stripe webhook aktualizuje datę automatycznie

## 8. Co później (Google Play Billing)
- Gdy wejdziesz do Google Play, dodasz drugi kanał płatności.
- Nadal trzymasz jedną datę końca premium w tej samej tabeli, więc UI zostaje to samo.
