package net.ministranci.twa;

import com.google.androidbrowserhelper.playbilling.digitalgoods.DigitalGoodsRequestHandler;


public class DelegationService extends
        com.google.androidbrowserhelper.trusted.DelegationService {
    @Override
    public void onCreate() {
        super.onCreate();
        // Enables Digital Goods API commands used by Google Play Billing in TWA.
        registerExtraCommandHandler(new DigitalGoodsRequestHandler(getApplicationContext()));
    }
}
