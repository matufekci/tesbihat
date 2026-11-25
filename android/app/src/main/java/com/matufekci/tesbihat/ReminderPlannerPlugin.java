package com.matufekci.tesbihat;

import android.app.AlarmManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.provider.Settings;
import androidx.core.app.NotificationManagerCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;

@CapacitorPlugin(name = "ReminderPlanner")
public class ReminderPlannerPlugin extends Plugin {
    @PluginMethod public void configure(PluginCall call) {
        try {
            Double lat = call.getDouble("latitude"), lng = call.getDouble("longitude");
            Integer delay = call.getInt("delay");
            String date = call.getString("date"), title = call.getString("title");
            JSONArray minutes = call.getArray("minutes"), bodies = call.getArray("bodies");
            JSONArray enabled = call.getArray("enabled"), delays = call.getArray("delays");
            String channelName = call.getString("channelName"), description = call.getString("channelDescription");
            if (lat == null || lng == null || delay == null || date == null || title == null || minutes == null || bodies == null
                    || channelName == null || description == null) throw new IllegalArgumentException("Missing reminder configuration");
            ReminderScheduler.configure(getContext(), lat, lng, delay, date, minutes, title, bodies, channelName, description, enabled, delays);
            call.resolve();
        } catch (Exception error) { call.reject("Could not configure reminders", error); }
    }

    @PluginMethod public void cancel(PluginCall call) {
        try { ReminderScheduler.disable(getContext()); call.resolve(); }
        catch (Exception error) { call.reject("Could not cancel reminders", error); }
    }
    @PluginMethod public void status(PluginCall call) {
        Context ctx = getContext();
        AlarmManager alarms = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        NotificationManagerCompat notifications = NotificationManagerCompat.from(ctx);
        boolean channelEnabled = true;
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationChannel channel = ((NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE)).getNotificationChannel("namaz-hatirlatma");
            if (channel != null) channelEnabled = channel.getImportance() != NotificationManager.IMPORTANCE_NONE;
        }
        boolean batteryUnrestricted = Build.VERSION.SDK_INT < 23 || ((PowerManager) ctx.getSystemService(Context.POWER_SERVICE)).isIgnoringBatteryOptimizations(ctx.getPackageName());
        JSObject result = new JSObject();
        result.put("notificationsEnabled", notifications.areNotificationsEnabled());
        result.put("channelEnabled", channelEnabled);
        result.put("exactAllowed", Build.VERSION.SDK_INT < 31 || alarms.canScheduleExactAlarms());
        result.put("batteryUnrestricted", batteryUnrestricted);
        result.put("enabled", ReminderScheduler.prefs(ctx).getBoolean("enabled", false));
        result.put("nextAt", ReminderScheduler.nextScheduled(ctx, System.currentTimeMillis()));
        call.resolve(result);
    }

    @PluginMethod public void openAlarmSettings(PluginCall call) {
        try {
            Context ctx = getContext();
            Intent intent = new Intent(Build.VERSION.SDK_INT >= 31 ? Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM : Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
            intent.setData(Uri.parse("package:" + ctx.getPackageName()));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            ctx.startActivity(intent);
            call.resolve();
        } catch (Exception error) { call.reject("Could not open alarm settings", error); }
    }

}
