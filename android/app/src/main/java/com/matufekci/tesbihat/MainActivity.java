package com.matufekci.tesbihat;

import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final long SPLASH_VISIBLE_MS = 2200;
    private final Handler splashHandler = new Handler(Looper.getMainLooper());
    private View splashView;
    private final Runnable hideSplash = () -> {
        if (splashView == null) return;
        View view = splashView;
        view.animate().alpha(0f).setDuration(550).withEndAction(() -> {
            if (view.getParent() instanceof ViewGroup) {
                ((ViewGroup) view.getParent()).removeView(view);
            }
            if (splashView == view) splashView = null;
        }).start();
    };

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(SettingsLauncherPlugin.class);
        super.onCreate(savedInstanceState);
        showLaunchSplash();
    }

    @Override
    public void onRestart() {
        super.onRestart();
        // Android may resume an existing WebView instead of creating the app
        // again, in which case the React startup splash is not mounted anew.
        showLaunchSplash();
    }

    private void showLaunchSplash() {
        splashHandler.removeCallbacks(hideSplash);
        if (splashView != null) {
            splashView.animate().cancel();
            if (splashView.getParent() instanceof ViewGroup) {
                ((ViewGroup) splashView.getParent()).removeView(splashView);
            }
        }
        ImageView splash = new ImageView(this);
        splash.setBackgroundColor(getColor(R.color.tesbihat_splash_background));
        splash.setImageResource(R.drawable.splash);
        splash.setScaleType(ImageView.ScaleType.CENTER_CROP);
        splash.setClickable(true);
        splash.setImportantForAccessibility(View.IMPORTANT_FOR_ACCESSIBILITY_NO);
        addContentView(splash, new ViewGroup.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        splashView = splash;
        splashHandler.postDelayed(hideSplash, SPLASH_VISIBLE_MS);
    }

    @Override
    public void onDestroy() {
        splashHandler.removeCallbacks(hideSplash);
        if (splashView != null) splashView.animate().cancel();
        super.onDestroy();
    }
}
