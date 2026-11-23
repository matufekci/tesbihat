package com.matufekci.tesbihat;

import android.Manifest;
import android.app.AlarmManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.Build;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.ContextCompat;

import org.json.JSONArray;
import org.json.JSONException;

import java.util.Calendar;
import java.util.TimeZone;

/** Five self-renewing alarms plus a daily retry for temporarily unavailable prayer times. */
public final class ReminderScheduler {
    private static final String PREFS = "ruhi.reminders";
    private static final String CHANNEL = "namaz-hatirlatma";
    private static final int COUNT = 5, RETRY = 5, REQUEST_BASE = 4100;
    private static final long MAX_LATE_MS = 2L * 60 * 60 * 1000;
    private ReminderScheduler() {}

    static SharedPreferences prefs(Context context) { return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE); }
    private static PendingIntent alarmIntent(Context context, int index, long scheduledAt, long generation) {
        Intent intent = new Intent(context, ReminderAlarmReceiver.class);
        intent.setAction("com.matufekci.tesbihat.REMINDER." + index);
        intent.putExtra("index", index).putExtra("scheduledAt", scheduledAt).putExtra("generation", generation);
        return PendingIntent.getBroadcast(context, REQUEST_BASE + index, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    static synchronized void configure(Context context, double lat, double lng, int delay, String date,
                                       JSONArray minutes, String title, JSONArray bodies, String channelName,
                                       String channelDescription) throws JSONException {
        if ((Double.isNaN(lat) || Double.isInfinite(lat)) || lat < -90 || lat > 90 || (Double.isNaN(lng) || Double.isInfinite(lng)) || lng < -180 || lng > 180
                || delay < 0 || delay > 1440 || minutes.length() != COUNT || bodies.length() != COUNT
                || !date.matches("\\d{4}-\\d{2}-\\d{2}")) throw new IllegalArgumentException("Invalid reminder configuration");
        for (int i = 0; i < COUNT; i++) {
            if (!minutes.isNull(i) && (minutes.getInt(i) < 0 || minutes.getInt(i) >= 1440)) throw new IllegalArgumentException("Invalid prayer time");
            if (bodies.getString(i).trim().isEmpty()) throw new IllegalArgumentException("Empty notification body");
        }
        cancelAlarms(context);
        SharedPreferences p = prefs(context);
        long generation = p.getLong("generation", 0) + 1;
        if (!p.edit().putBoolean("enabled", true).putLong("generation", generation)
                .putLong("lat", Double.doubleToRawLongBits(lat)).putLong("lng", Double.doubleToRawLongBits(lng))
                .putInt("delay", delay).putString("date", date).putString("minutes", minutes.toString())
                .putString("title", title).putString("bodies", bodies.toString())
                .putString("channelName", channelName).putString("channelDescription", channelDescription).commit()) {
            throw new IllegalStateException("Could not save reminder settings");
        }
        createChannel(context);
        scheduleAll(context, System.currentTimeMillis());
    }

    static synchronized void disable(Context context) {
        SharedPreferences p = prefs(context);
        p.edit().putBoolean("enabled", false).putLong("generation", p.getLong("generation", 0) + 1).commit();
        cancelAlarms(context);
    }

    private static void cancelAlarms(Context context) {
        AlarmManager alarms = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        for (int i = 0; i <= RETRY; i++) alarms.cancel(alarmIntent(context, i, 0, 0));
    }

    static synchronized void timeZoneChanged(Context context, long now) {
        // The supplied day was calculated in the old zone; use offline times in the new zone.
        prefs(context).edit().remove("date").commit();
        scheduleAll(context, now);
    }

    static synchronized void scheduleAll(Context context, long now) {
        SharedPreferences p = prefs(context);
        if (!p.getBoolean("enabled", false)) return;
        for (int i = 0; i < COUNT; i++) schedulePrayer(context, i, now);
        scheduleRetry(context, now);
    }

    private static void schedulePrayer(Context context, int index, long now) {
        SharedPreferences p = prefs(context);
        long next = nextPrayerTime(p, index, now);
        p.edit().putLong("scheduled." + index, next).apply();
        if (next > 0) setAlarm(context, index, next, p.getLong("generation", 0), true);
    }

    // Retry missing high-latitude times every day; do not cancel the other five alarms.
    private static void scheduleRetry(Context context, long now) {
        Calendar next = Calendar.getInstance();
        next.setTimeInMillis(now);
        next.add(Calendar.DAY_OF_MONTH, 1);
        next.set(Calendar.HOUR_OF_DAY, 0); next.set(Calendar.MINUTE, 20);
        next.set(Calendar.SECOND, 0); next.set(Calendar.MILLISECOND, 0);
        setAlarm(context, RETRY, next.getTimeInMillis(), prefs(context).getLong("generation", 0), false);
    }

    private static void setAlarm(Context context, int index, long at, long generation, boolean exactPreferred) {
        AlarmManager alarms = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        PendingIntent intent = alarmIntent(context, index, at, generation);
        boolean exact = exactPreferred && (Build.VERSION.SDK_INT < 31 || alarms.canScheduleExactAlarms());
        try {
            if (exact && Build.VERSION.SDK_INT >= 23) alarms.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, intent);
            else if (exact) alarms.setExact(AlarmManager.RTC_WAKEUP, at, intent);
            else if (Build.VERSION.SDK_INT >= 23) alarms.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, intent);
            else alarms.set(AlarmManager.RTC_WAKEUP, at, intent);
        } catch (SecurityException e) {
            if (Build.VERSION.SDK_INT >= 23) alarms.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, intent);
            else alarms.set(AlarmManager.RTC_WAKEUP, at, intent);
        }
    }

    static long nextPrayerTime(SharedPreferences p, int index, long now) {
        double lat = Double.longBitsToDouble(p.getLong("lat", Double.doubleToRawLongBits(0)));
        double lng = Double.longBitsToDouble(p.getLong("lng", Double.doubleToRawLongBits(0)));
        Integer[] supplied = null;
        try {
            JSONArray minutes = new JSONArray(p.getString("minutes", "[]"));
            if (minutes.length() == COUNT) {
                supplied = new Integer[COUNT];
                for (int i = 0; i < COUNT; i++) supplied[i] = minutes.isNull(i) ? null : minutes.getInt(i);
            }
        } catch (JSONException ignored) { }
        return ReminderTimeCalculator.next(index, now, TimeZone.getDefault(), lat, lng,
                p.getInt("delay", 15), p.getString("date", ""), supplied);
    }

    static synchronized void onAlarm(Context context, int index, long scheduledAt, long generation) {
        SharedPreferences p = prefs(context);
        if (!p.getBoolean("enabled", false) || p.getLong("generation", 0) != generation) return;
        long now = System.currentTimeMillis();
        if (index == RETRY) {
            for (int i = 0; i < COUNT; i++) if (p.getLong("scheduled." + i, 0) == 0) schedulePrayer(context, i, now);
            scheduleRetry(context, now);
            return;
        }
        if (index < 0 || index >= COUNT || p.getLong("scheduled." + index, 0) != scheduledAt) return;
        // Set up the next occurrence even when notification permission was later revoked.
        schedulePrayer(context, index, Math.max(now, scheduledAt));
        if (now - scheduledAt <= MAX_LATE_MS && now >= scheduledAt - 60000) showNotification(context, index);
    }

    private static void createChannel(Context context) {
        if (Build.VERSION.SDK_INT < 26) return;
        SharedPreferences p = prefs(context);
        NotificationChannel channel = new NotificationChannel(CHANNEL, p.getString("channelName", "Ruhi Tesbihat"), NotificationManager.IMPORTANCE_HIGH);
        channel.setDescription(p.getString("channelDescription", ""));
        channel.enableVibration(true);
        ((NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE)).createNotificationChannel(channel);
    }

    private static void showNotification(Context context, int index) {
        if (Build.VERSION.SDK_INT >= 33 && ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) return;
        SharedPreferences p = prefs(context);
        try {
            JSONArray bodies = new JSONArray(p.getString("bodies", "[]"));
            if (bodies.length() != COUNT) return;
            Intent open = new Intent(context, MainActivity.class).setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            PendingIntent content = PendingIntent.getActivity(context, index, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL)
                    .setSmallIcon(R.drawable.ic_reminder)
                    .setContentTitle(p.getString("title", "Ruhi Tesbihat")).setContentText(bodies.getString(index))
                    .setStyle(new NotificationCompat.BigTextStyle().bigText(bodies.getString(index)))
                    .setPriority(NotificationCompat.PRIORITY_HIGH).setDefaults(NotificationCompat.DEFAULT_ALL)
                    .setAutoCancel(true).setContentIntent(content);
            NotificationManagerCompat.from(context).notify(5100 + index, builder.build());
        } catch (JSONException | SecurityException ignored) { }
    }
}
