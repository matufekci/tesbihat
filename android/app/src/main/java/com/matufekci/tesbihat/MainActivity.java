package com.matufekci.tesbihat;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(SettingsLauncherPlugin.class);
        super.onCreate(savedInstanceState);
        // The WebView defaults to white while its first page loads. Match the
        // launch background so the first painted frame is not a white flash.
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().setBackgroundColor(
                androidx.core.content.ContextCompat.getColor(this, R.color.tesbihat_splash_background));
        }
    }
}
