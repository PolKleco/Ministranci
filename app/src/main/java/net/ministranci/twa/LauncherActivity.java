/*
 * Copyright 2020 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package net.ministranci.twa;

import android.content.SharedPreferences;
import android.content.pm.ActivityInfo;
import android.content.pm.PackageInfo;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.text.TextUtils;

import com.android.installreferrer.api.InstallReferrerClient;
import com.android.installreferrer.api.InstallReferrerStateListener;
import com.android.installreferrer.api.ReferrerDetails;

import java.util.Locale;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

public class LauncherActivity
        extends com.google.androidbrowserhelper.trusted.LauncherActivity {
    private static final String REFERRER_PREFS_NAME = "join_referrer_prefs";
    private static final String REFERRER_CONSUMED_KEY = "install_referrer_consumed";
    private static final long REFERRER_WAIT_TIMEOUT_MS = 1200L;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Setting an orientation crashes the app due to the transparent background on Android 8.0
        // Oreo and below. We only set the orientation on Oreo and above. This only affects the
        // splash screen and Chrome will still respect the orientation.
        // See https://github.com/GoogleChromeLabs/bubblewrap/issues/496 for details.
        if (Build.VERSION.SDK_INT > Build.VERSION_CODES.O) {
            setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED);
        } else {
            setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED);
        }
    }

    @Override
    protected Uri getLaunchingUrl() {
        Uri uri = super.getLaunchingUrl();
        Uri.Builder builder = uri.buildUpon();
        appendAppVersionParams(builder, uri);
        appendDeferredJoinParams(builder, uri);
        return builder.build();
    }

    private void appendAppVersionParams(Uri.Builder builder, Uri uri) {
        try {
            PackageInfo packageInfo = getPackageManager().getPackageInfo(getPackageName(), 0);
            long versionCode = Build.VERSION.SDK_INT >= Build.VERSION_CODES.P
                    ? packageInfo.getLongVersionCode()
                    : packageInfo.versionCode;
            String versionName = packageInfo.versionName != null ? packageInfo.versionName : "";

            if (uri.getQueryParameter("app_vc") == null) {
                builder.appendQueryParameter("app_vc", String.valueOf(versionCode));
            }
            if (uri.getQueryParameter("app_vn") == null) {
                builder.appendQueryParameter("app_vn", versionName);
            }
        } catch (Exception ignored) {
            // If version metadata is unavailable we can still launch without it.
        }
    }

    private void appendDeferredJoinParams(Uri.Builder builder, Uri uri) {
        if (uri.getQueryParameter("kod") != null) {
            return;
        }

        DeferredJoinPayload payload = consumeDeferredJoinPayload();
        if (payload == null || TextUtils.isEmpty(payload.joinCode)) {
            return;
        }

        builder.appendQueryParameter("kod", payload.joinCode);
        if (uri.getQueryParameter("auth") == null && payload.openRegisterView) {
            builder.appendQueryParameter("auth", "register");
        }
    }

    private DeferredJoinPayload consumeDeferredJoinPayload() {
        SharedPreferences preferences = getSharedPreferences(REFERRER_PREFS_NAME, MODE_PRIVATE);
        if (preferences.getBoolean(REFERRER_CONSUMED_KEY, false)) {
            return null;
        }

        InstallReferrerFetchResult result = fetchInstallReferrer();
        if (result.markAsConsumed) {
            preferences.edit().putBoolean(REFERRER_CONSUMED_KEY, true).apply();
        }
        return result.payload;
    }

    private InstallReferrerFetchResult fetchInstallReferrer() {
        InstallReferrerClient referrerClient = InstallReferrerClient.newBuilder(this).build();
        AtomicReference<String> installReferrerValue = new AtomicReference<>(null);
        AtomicInteger responseCode = new AtomicInteger(InstallReferrerClient.InstallReferrerResponse.SERVICE_DISCONNECTED);
        CountDownLatch latch = new CountDownLatch(1);

        try {
            referrerClient.startConnection(new InstallReferrerStateListener() {
                @Override
                public void onInstallReferrerSetupFinished(int code) {
                    responseCode.set(code);
                    if (code == InstallReferrerClient.InstallReferrerResponse.OK) {
                        try {
                            ReferrerDetails details = referrerClient.getInstallReferrer();
                            if (details != null) {
                                installReferrerValue.set(details.getInstallReferrer());
                            }
                        } catch (Exception ignored) {
                            // Keep null referrer when the service returns malformed payload.
                        }
                    }
                    try {
                        referrerClient.endConnection();
                    } catch (Exception ignored) {
                        // Ignore close failures; we already have the callback result.
                    }
                    latch.countDown();
                }

                @Override
                public void onInstallReferrerServiceDisconnected() {
                    latch.countDown();
                }
            });

            latch.await(REFERRER_WAIT_TIMEOUT_MS, TimeUnit.MILLISECONDS);
        } catch (Exception ignored) {
            try {
                referrerClient.endConnection();
            } catch (Exception ignoredClose) {
                // Ignored.
            }
            return new InstallReferrerFetchResult(null, false);
        }

        int code = responseCode.get();
        boolean shouldMarkConsumed = code == InstallReferrerClient.InstallReferrerResponse.OK
                || code == InstallReferrerClient.InstallReferrerResponse.FEATURE_NOT_SUPPORTED;

        if (code != InstallReferrerClient.InstallReferrerResponse.OK) {
            return new InstallReferrerFetchResult(null, shouldMarkConsumed);
        }

        String rawReferrer = installReferrerValue.get();
        if (TextUtils.isEmpty(rawReferrer)) {
            return new InstallReferrerFetchResult(null, true);
        }

        Uri referrerUri = Uri.parse("https://localhost/?" + rawReferrer);
        String joinCode = sanitizeJoinCode(referrerUri.getQueryParameter("kod"));
        if (TextUtils.isEmpty(joinCode)) {
            return new InstallReferrerFetchResult(null, true);
        }

        boolean openRegisterView = "register".equalsIgnoreCase(referrerUri.getQueryParameter("auth"));
        return new InstallReferrerFetchResult(new DeferredJoinPayload(joinCode, openRegisterView), true);
    }

    private static String sanitizeJoinCode(String rawCode) {
        if (rawCode == null) {
            return null;
        }
        String normalized = rawCode.trim().toUpperCase(Locale.ROOT).replaceAll("[^A-Z0-9]", "");
        if (normalized.isEmpty()) {
            return null;
        }
        return normalized.length() > 32 ? normalized.substring(0, 32) : normalized;
    }

    private static class DeferredJoinPayload {
        final String joinCode;
        final boolean openRegisterView;

        DeferredJoinPayload(String joinCode, boolean openRegisterView) {
            this.joinCode = joinCode;
            this.openRegisterView = openRegisterView;
        }
    }

    private static class InstallReferrerFetchResult {
        final DeferredJoinPayload payload;
        final boolean markAsConsumed;

        InstallReferrerFetchResult(DeferredJoinPayload payload, boolean markAsConsumed) {
            this.payload = payload;
            this.markAsConsumed = markAsConsumed;
        }
    }
}
