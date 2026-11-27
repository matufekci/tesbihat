package com.matufekci.tesbihat;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class ReminderSystemReceiver extends BroadcastReceiver {
    @Override public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        if (Intent.ACTION_TIMEZONE_CHANGED.equals(action)) {
            ReminderScheduler.timeZoneChanged(context, System.currentTimeMillis());
            return;
        }
        if (Intent.ACTION_BOOT_COMPLETED.equals(action) || Intent.ACTION_MY_PACKAGE_REPLACED.equals(action)
                || Intent.ACTION_TIME_CHANGED.equals(action)
                || "android.app.action.SCHEDULE_EXACT_ALARM_PERMISSION_STATE_CHANGED".equals(action)) {
            ReminderScheduler.scheduleAll(context, System.currentTimeMillis());
        }
    }
}
