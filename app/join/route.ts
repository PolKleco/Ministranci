import { NextRequest, NextResponse } from 'next/server';

const ANDROID_APP_PACKAGE_ID = 'net.ministranci.twa';

function sanitizeJoinCode(rawCode: string | null): string {
  if (!rawCode) return '';
  return rawCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 32);
}

export function GET(request: NextRequest) {
  const joinCode = sanitizeJoinCode(request.nextUrl.searchParams.get('kod'));
  const appVersionCode = request.nextUrl.searchParams.get('app_vc');
  const mobileVersionCode = request.nextUrl.searchParams.get('mobile_vc');
  const userAgent = request.headers.get('user-agent') || '';
  const isAndroid = /Android/i.test(userAgent);
  const isTwaContext = Boolean(appVersionCode || mobileVersionCode);

  if (!joinCode) {
    return NextResponse.redirect(new URL('/app?auth=register', request.url));
  }

  if (isAndroid && !isTwaContext) {
    const playStoreUrl = new URL('https://play.google.com/store/apps/details');
    const installReferrer = new URLSearchParams({
      kod: joinCode,
      auth: 'register',
      source: 'qr',
    }).toString();

    playStoreUrl.searchParams.set('id', ANDROID_APP_PACKAGE_ID);
    playStoreUrl.searchParams.set('referrer', installReferrer);
    return NextResponse.redirect(playStoreUrl);
  }

  const webJoinUrl = new URL('/app', request.url);
  webJoinUrl.searchParams.set('auth', 'register');
  webJoinUrl.searchParams.set('kod', joinCode);
  return NextResponse.redirect(webJoinUrl);
}
