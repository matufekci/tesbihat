package com.matufekci.tesbihat;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class ReminderAlarmReceiver extends BroadcastReceiver {
    @Override public void onReceive(Context context, Intent intent) {
        ReminderScheduler.onAlarm(context, intent.getIntExtra("index", -1),
                intent.getLongExtra("scheduledAt", 0), intent.getLongExtra("generation", -1));
    }
}
