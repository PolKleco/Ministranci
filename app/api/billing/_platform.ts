import { NextRequest, NextResponse } from 'next/server';

export type ClientPlatform = 'web' | 'android-app' | 'ios-app' | 'unknown';

export const CLIENT_PLATFORM_HEADER = 'x-client-platform';
export const CLIENT_APP_VERSION_HEADER = 'x-mobile-app-vc';

export function getClientPlatform(request: NextRequest): ClientPlatform {
  const headerValue = request.headers.get(CLIENT_PLATFORM_HEADER)?.trim().toLowerCase();
  if (headerValue === 'web' || headerValue === 'android-app' || headerValue === 'ios-app') {
    return headerValue;
  }
  return 'unknown';
}

export function rejectExternalBillingOnMobile(request: NextRequest) {
  const platform = getClientPlatform(request);
  if (platform === 'android-app') {
    return NextResponse.json(
      { error: 'W aplikacji Android płatności Premium są obsługiwane przez Google Play.' },
      { status: 403 }
    );
  }

  if (platform === 'ios-app') {
    return NextResponse.json(
      { error: 'W aplikacji iOS płatności Premium są obsługiwane przez App Store.' },
      { status: 403 }
    );
  }

  return null;
}
