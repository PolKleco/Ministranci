# iOS wrapper: instrukcja 1:1 (bardzo prosto)

Ten plik to instrukcja "kliknij tu, wklej to".

## Co ja już zrobiłem w Twojej aplikacji
- Frontend i backend są gotowe na iOS billing:
  - frontend oczekuje deeplinka: `ministranci-ios-billing://checkout?...`
  - frontend przyjmuje wynik jako hash `ap_*`
  - backend ma endpoint: `POST /api/billing/apple/verify`

Ty musisz tylko dodać cienki wrapper iOS (Xcode), który:
1. przechwyci deeplink zakupu,
2. uruchomi StoreKit,
3. wróci do `/app` z parametrami `ap_*`.

## Krok 1: utwórz iOS app w Xcode
1. Otwórz `Xcode`.
2. `File` -> `New` -> `Project...`
3. Wybierz: `iOS` -> `App` -> `Next`.
4. Ustaw:
   - `Product Name`: `Ministranci`
   - `Organization Identifier`: np. `net.ministranci`
   - `Interface`: `Storyboard` albo `SwiftUI` (dowolnie)
   - `Language`: `Swift`
5. Kliknij `Next` i zapisz projekt.

## Krok 2: ustaw Bundle ID
1. W Xcode kliknij projekt po lewej.
2. Zakładka `Signing & Capabilities`.
3. Ustaw `Bundle Identifier` na dokładnie:
   - `net.ministranci.ios`

Jeśli chcesz inny bundle id, zmień potem też:
- `APPLE_IOS_BUNDLE_ID`
- `NEXT_PUBLIC_IOS_BUNDLE_ID`

## Krok 3: włącz In-App Purchase
1. Dalej w `Signing & Capabilities`.
2. Kliknij `+ Capability`.
3. Dodaj `In-App Purchase`.

## Krok 4: dodaj plik Swift (kopiuj-wklej)
1. W Xcode: prawy klik na folder projektu -> `New File...` -> `Swift File`.
2. Nazwa pliku: `MinistranciWebViewController.swift`
3. Otwórz plik z repo:
   - `/Users/pawelimac/ministranci/ios-template/MinistranciWebViewController.swift`
4. Skopiuj całą zawartość i wklej do pliku w Xcode.

## Krok 5: ustaw ten kontroler jako startowy
### Jeśli masz Storyboard
1. Otwórz `Main.storyboard`.
2. Dodaj `View Controller`.
3. W prawym panelu (`Identity Inspector`) ustaw `Class`:
   - `MinistranciWebViewController`
4. Zaznacz strzałkę startową (`Is Initial View Controller`) na tym kontrolerze.

### Jeśli masz SwiftUI start
Napisz, to dam Ci gotowy 10-linijkowy bridge do uruchomienia tego kontrolera w SwiftUI.

## Krok 6: uruchom na iPhone Simulator
1. Kliknij `Run` (trójkąt).
2. Powinna otworzyć się Twoja aplikacja web:
   - `https://www.ministranci.net/app?app_platform=ios-app&app_vc=1`

## Krok 7: sprawdź flow płatności
1. W aplikacji otwórz Premium.
2. Kliknij przycisk zakupu.
3. Wrapper przechwyci deeplink i odpali StoreKit.
4. Po wyniku wróci do `/app` z `ap_*`.
5. Frontend sam wywoła `/api/billing/apple/verify`.

## Krok 8: ENV na serwerze (musisz ustawić ręcznie)
W panelu hostingu dodaj:
- `APPLE_IOS_BUNDLE_ID=net.ministranci.ios`
- `APPLE_PREMIUM_PRODUCT_ID=premium_yearly_ios`
- `APPLE_APP_STORE_ISSUER_ID=...`
- `APPLE_APP_STORE_KEY_ID=...`
- `APPLE_APP_STORE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----`
- `NEXT_PUBLIC_IOS_BUNDLE_ID=net.ministranci.ios`
- `NEXT_PUBLIC_APPLE_PREMIUM_PRODUCT_ID=premium_yearly_ios`

Po dodaniu ENV zrób redeploy.

## Krok 9: App Store Connect
1. Utwórz aplikację z tym samym `Bundle ID`.
2. Dodaj IAP:
   - product id: `premium_yearly_ios`
3. Skonfiguruj cenę `299 PLN`.
4. Test przez `TestFlight`.

## Krok 10: wymóg po 28.04.2026
Wysyłaj nowe buildy do App Store Connect tylko z:
- `Xcode 26+`
- `SDK 26+`
