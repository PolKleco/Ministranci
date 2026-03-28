package net.ministranci.twa;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.text.TextUtils;
import android.util.Log;

import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.PendingPurchasesParams;
import com.android.billingclient.api.ProductDetails;
import com.android.billingclient.api.Purchase;
import com.android.billingclient.api.PurchasesUpdatedListener;
import com.android.billingclient.api.QueryProductDetailsParams;
import com.android.billingclient.api.QueryPurchasesParams;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class GoogleBillingActivity extends Activity implements PurchasesUpdatedListener {
    private static final String TAG = "GoogleBillingActivity";
    private static final long CANCELED_FALLBACK_DELAY_MS = 1200L;

    private static final String PRODUCT_ID = "premium_yearly";
    private static final String BASE_PLAN_ID = "yearly-prepaid";
    private static final String RETURN_URL = "https://www.ministranci.net/app";

    private static final String HASH_STATUS = "gp_purchase_status";
    private static final String HASH_PARAFIA_ID = "gp_parafia_id";
    private static final String HASH_PRODUCT_ID = "gp_product_id";
    private static final String HASH_BASE_PLAN_ID = "gp_base_plan_id";
    private static final String HASH_PURCHASE_TOKEN = "gp_purchase_token";
    private static final String HASH_ORDER_ID = "gp_order_id";
    private static final String HASH_ACKNOWLEDGED = "gp_ack";
    private static final String HASH_ERROR = "gp_error";

    private BillingClient billingClient;
    private boolean resultSent = false;
    private boolean billingFlowLaunched = false;
    private boolean waitingForPurchaseCallback = false;
    private String parafiaId = null;
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private final Runnable canceledFallbackRunnable = new Runnable() {
        @Override
        public void run() {
            if (resultSent || !billingFlowLaunched || !waitingForPurchaseCallback) return;
            Log.w(TAG, "Billing callback timeout after resume. Returning as canceled.");
            returnWithStatus("canceled", null, null, null);
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Uri data = getIntent() != null ? getIntent().getData() : null;
        parafiaId = sanitize(data != null ? data.getQueryParameter("parafiaId") : null);
        if (TextUtils.isEmpty(parafiaId)) {
            returnWithError("missing_parafia_id");
            return;
        }

        connectBilling();
    }

    @Override
    protected void onDestroy() {
        mainHandler.removeCallbacks(canceledFallbackRunnable);
        disconnectBilling();
        super.onDestroy();
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (resultSent || !billingFlowLaunched || !waitingForPurchaseCallback) return;
        mainHandler.removeCallbacks(canceledFallbackRunnable);
        mainHandler.postDelayed(canceledFallbackRunnable, CANCELED_FALLBACK_DELAY_MS);
    }

    @Override
    public void onPurchasesUpdated(BillingResult billingResult, List<Purchase> purchases) {
        if (resultSent) return;
        waitingForPurchaseCallback = false;
        mainHandler.removeCallbacks(canceledFallbackRunnable);

        int code = billingResult.getResponseCode();
        if (code == BillingClient.BillingResponseCode.OK) {
            Purchase purchase = selectPremiumPurchase(purchases);
            if (purchase == null) {
                returnWithError("empty_purchase");
                return;
            }
            returnWithPurchase(purchase);
            return;
        }

        if (code == BillingClient.BillingResponseCode.USER_CANCELED) {
            returnWithStatus("canceled", null, null, null);
            return;
        }

        if (code == BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED) {
            queryExistingPurchaseAndReturn();
            return;
        }

        returnWithError("purchase_failed_" + code);
    }

    private void connectBilling() {
        PendingPurchasesParams pendingPurchasesParams = PendingPurchasesParams.newBuilder()
                .enableOneTimeProducts()
                .enablePrepaidPlans()
                .build();

        billingClient = BillingClient.newBuilder(this)
                .setListener(this)
                .enablePendingPurchases(pendingPurchasesParams)
                .build();

        billingClient.startConnection(new BillingClientStateListener() {
            @Override
            public void onBillingSetupFinished(BillingResult billingResult) {
                if (billingResult.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                    returnWithError("billing_setup_" + billingResult.getResponseCode());
                    return;
                }
                queryAndLaunchPrepaid();
            }

            @Override
            public void onBillingServiceDisconnected() {
                if (!resultSent) {
                    returnWithError("billing_disconnected");
                }
            }
        });
    }

    private void queryAndLaunchPrepaid() {
        if (billingClient == null) {
            returnWithError("billing_not_ready");
            return;
        }

        QueryProductDetailsParams.Product product = QueryProductDetailsParams.Product.newBuilder()
                .setProductId(PRODUCT_ID)
                .setProductType(BillingClient.ProductType.SUBS)
                .build();

        QueryProductDetailsParams queryParams = QueryProductDetailsParams.newBuilder()
                .setProductList(Collections.singletonList(product))
                .build();

        billingClient.queryProductDetailsAsync(queryParams, (result, productDetailsList) -> {
            if (resultSent) return;

            if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                returnWithError("query_products_" + result.getResponseCode());
                return;
            }

            if (productDetailsList == null || productDetailsList.isEmpty()) {
                returnWithError("product_not_found");
                return;
            }

            ProductDetails productDetails = productDetailsList.get(0);
            ProductDetails.SubscriptionOfferDetails prepaidOffer = findPrepaidOffer(productDetails);
            if (prepaidOffer == null || TextUtils.isEmpty(prepaidOffer.getOfferToken())) {
                returnWithError("prepaid_offer_not_found");
                return;
            }

            BillingFlowParams.ProductDetailsParams productParams =
                    BillingFlowParams.ProductDetailsParams.newBuilder()
                            .setProductDetails(productDetails)
                            .setOfferToken(prepaidOffer.getOfferToken())
                            .build();

            BillingFlowParams flowParams = BillingFlowParams.newBuilder()
                    .setProductDetailsParamsList(Collections.singletonList(productParams))
                    .build();

            BillingResult launchResult = billingClient.launchBillingFlow(this, flowParams);
            if (launchResult.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                returnWithError("launch_failed_" + launchResult.getResponseCode());
                return;
            }
            billingFlowLaunched = true;
            waitingForPurchaseCallback = true;
        });
    }

    private ProductDetails.SubscriptionOfferDetails findPrepaidOffer(ProductDetails productDetails) {
        List<ProductDetails.SubscriptionOfferDetails> offers = productDetails.getSubscriptionOfferDetails();
        if (offers == null || offers.isEmpty()) return null;
        for (ProductDetails.SubscriptionOfferDetails offer : offers) {
            if (BASE_PLAN_ID.equals(offer.getBasePlanId())) {
                return offer;
            }
        }
        return null;
    }

    private void queryExistingPurchaseAndReturn() {
        if (billingClient == null) {
            returnWithError("already_owned");
            return;
        }

        QueryPurchasesParams params = QueryPurchasesParams.newBuilder()
                .setProductType(BillingClient.ProductType.SUBS)
                .build();

        billingClient.queryPurchasesAsync(params, (result, purchases) -> {
            if (resultSent) return;
            if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                returnWithError("already_owned");
                return;
            }
            Purchase purchase = selectPremiumPurchase(purchases);
            if (purchase == null) {
                returnWithError("already_owned");
                return;
            }
            returnWithPurchase(purchase);
        });
    }

    private Purchase selectPremiumPurchase(List<Purchase> purchases) {
        if (purchases == null || purchases.isEmpty()) return null;
        for (Purchase purchase : purchases) {
            List<String> products = purchase.getProducts();
            if (products != null && products.contains(PRODUCT_ID)) {
                return purchase;
            }
        }
        return purchases.get(0);
    }

    private void returnWithPurchase(Purchase purchase) {
        String status;
        if (purchase.getPurchaseState() == Purchase.PurchaseState.PENDING) {
            status = "pending";
        } else if (purchase.getPurchaseState() == Purchase.PurchaseState.PURCHASED) {
            status = "success";
        } else {
            returnWithError("invalid_purchase_state");
            return;
        }

        String acknowledged = purchase.isAcknowledged() ? "1" : "0";
        returnWithStatus(status, purchase.getPurchaseToken(), purchase.getOrderId(), acknowledged);
    }

    private void returnWithError(String errorCode) {
        returnWithStatus("error", null, null, null, errorCode);
    }

    private void returnWithStatus(
            String status,
            String purchaseToken,
            String orderId,
            String acknowledged
    ) {
        returnWithStatus(status, purchaseToken, orderId, acknowledged, null);
    }

    private void returnWithStatus(
            String status,
            String purchaseToken,
            String orderId,
            String acknowledged,
            String errorCode
    ) {
        if (resultSent) return;
        resultSent = true;

        ArrayList<String> fragmentParts = new ArrayList<>();
        addFragmentPart(fragmentParts, HASH_STATUS, status);
        addFragmentPart(fragmentParts, HASH_PARAFIA_ID, parafiaId);
        addFragmentPart(fragmentParts, HASH_PRODUCT_ID, PRODUCT_ID);
        addFragmentPart(fragmentParts, HASH_BASE_PLAN_ID, BASE_PLAN_ID);
        addFragmentPart(fragmentParts, HASH_PURCHASE_TOKEN, purchaseToken);
        addFragmentPart(fragmentParts, HASH_ORDER_ID, orderId);
        addFragmentPart(fragmentParts, HASH_ACKNOWLEDGED, acknowledged);
        addFragmentPart(fragmentParts, HASH_ERROR, errorCode);

        String fragment = TextUtils.join("&", fragmentParts);
        Uri returnUri = Uri.parse(RETURN_URL).buildUpon().encodedFragment(fragment).build();
        Intent returnIntent = new Intent(Intent.ACTION_VIEW, returnUri);
        returnIntent.setClass(this, LauncherActivity.class);
        returnIntent.addFlags(
                Intent.FLAG_ACTIVITY_CLEAR_TOP
                        | Intent.FLAG_ACTIVITY_SINGLE_TOP
                        | Intent.FLAG_ACTIVITY_NEW_TASK
        );

        try {
            startActivity(returnIntent);
        } catch (Exception e) {
            Log.e(TAG, "Unable to route purchase result back to TWA", e);
        }

        disconnectBilling();
        finish();
    }

    private void disconnectBilling() {
        if (billingClient == null) return;
        try {
            billingClient.endConnection();
        } catch (Exception ignored) {
            // No-op.
        }
        billingClient = null;
    }

    private static void addFragmentPart(List<String> parts, String key, String value) {
        if (TextUtils.isEmpty(key) || TextUtils.isEmpty(value)) return;
        parts.add(Uri.encode(key) + "=" + Uri.encode(value));
    }

    private static String sanitize(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
