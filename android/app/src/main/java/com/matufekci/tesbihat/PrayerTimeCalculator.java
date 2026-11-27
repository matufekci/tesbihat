package com.matufekci.tesbihat;

import java.util.Calendar;
import java.util.GregorianCalendar;
import java.util.TimeZone;

/** Same approximate offline calculation as src/lib/prayer.js. Minutes are local wall time. */
public final class PrayerTimeCalculator {
    private PrayerTimeCalculator() {}

    public static Integer[] calculate(Calendar date, double lat, double lng) {
        TimeZone zone = date.getTimeZone();
        int year = date.get(Calendar.YEAR), month = date.get(Calendar.MONTH), day = date.get(Calendar.DAY_OF_MONTH);
        Calendar noonLocal = new GregorianCalendar(zone);
        noonLocal.clear();
        noonLocal.set(year, month, day, 12, 0, 0);
        double tz = zone.getOffset(noonLocal.getTimeInMillis()) / 3600000.0;
        Calendar utc = new GregorianCalendar(TimeZone.getTimeZone("UTC"));
        utc.clear();
        utc.set(year, month, day, 12, 0, 0);
        int doy = utc.get(Calendar.DAY_OF_YEAR);
        double g = 2 * Math.PI / 365 * (doy - 1 + (12.0 - 12) / 24);
        double eqTime = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g)
                - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
        double decl = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g)
                - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g)
                - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
        double noon = 720 - 4 * lng - eqTime + tz * 60;
        Double fajr = hourAngle(lat, decl, -18), sun = hourAngle(lat, decl, -0.833), isha = hourAngle(lat, decl, -17);
        double latRad = Math.toRadians(lat);
        double asrAltitude = Math.toDegrees(Math.atan(1 / (1 + Math.tan(Math.abs(latRad - decl)))));
        Double asr = hourAngle(lat, decl, asrAltitude);
        return new Integer[] { minute(fajr == null ? null : noon - fajr * 4), minute(noon + 5),
                minute(asr == null ? null : noon + asr * 4 + 4), minute(sun == null ? null : noon + sun * 4 + 7),
                minute(isha == null ? null : noon + isha * 4) };
    }

    private static Double hourAngle(double lat, double decl, double altitude) {
        double latRad = Math.toRadians(lat);
        double cosH = (Math.sin(Math.toRadians(altitude)) - Math.sin(latRad) * Math.sin(decl))
                / (Math.cos(latRad) * Math.cos(decl));
        return cosH > 1 || cosH < -1 ? null : Math.toDegrees(Math.acos(cosH));
    }

    private static Integer minute(Double value) {
        if (value == null || (Double.isNaN(value) || Double.isInfinite(value))) return null;
        int rounded = (int) Math.floor(value + 0.5);
        return ((rounded % 1440) + 1440) % 1440;
    }
}
