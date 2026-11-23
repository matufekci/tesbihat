package com.matufekci.tesbihat;

import java.util.Calendar;
import java.util.Locale;
import java.util.TimeZone;

/** Computes the next occurrence, including a previous-day prayer whose delay crosses midnight. */
public final class ReminderTimeCalculator {
    private ReminderTimeCalculator() {}
    static String dateKey(Calendar date) {
        return String.format(Locale.US, "%04d-%02d-%02d", date.get(Calendar.YEAR), date.get(Calendar.MONTH) + 1, date.get(Calendar.DAY_OF_MONTH));
    }
    public static long next(int index, long now, TimeZone zone, double lat, double lng, int delay,
                            String suppliedDate, Integer[] suppliedMinutes) {
        Calendar day = Calendar.getInstance(zone);
        day.setTimeInMillis(now);
        day.set(Calendar.HOUR_OF_DAY, 12); day.set(Calendar.MINUTE, 0); day.set(Calendar.SECOND, 0); day.set(Calendar.MILLISECOND, 0);
        day.add(Calendar.DAY_OF_MONTH, -1);
        long best = Long.MAX_VALUE;
        for (int offset = 0; offset < 4; offset++, day.add(Calendar.DAY_OF_MONTH, 1)) {
            Integer minute = suppliedMinutes != null && dateKey(day).equals(suppliedDate)
                    ? suppliedMinutes[index] : PrayerTimeCalculator.calculate(day, lat, lng)[index];
            if (minute == null || minute < 0 || minute >= 1440) continue;
            Calendar alarm = (Calendar) day.clone();
            alarm.set(Calendar.HOUR_OF_DAY, minute / 60); alarm.set(Calendar.MINUTE, minute % 60);
            alarm.set(Calendar.SECOND, 0); alarm.set(Calendar.MILLISECOND, 0);
            alarm.add(Calendar.MINUTE, delay);
            long at = alarm.getTimeInMillis();
            if (at > now && at < best) best = at;
        }
        return best == Long.MAX_VALUE ? 0 : best;
    }
}
