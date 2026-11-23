package com.matufekci.tesbihat;

import static org.junit.Assert.*;
import org.junit.Test;
import java.util.Calendar;
import java.util.GregorianCalendar;
import java.util.TimeZone;

public class ReminderTimeCalculatorTest {
    private static final TimeZone TR = TimeZone.getTimeZone("Europe/Istanbul");
    private static Calendar at(TimeZone zone, int year, int month, int day, int hour, int minute) {
        Calendar c = new GregorianCalendar(zone); c.clear(); c.set(year, month - 1, day, hour, minute, 0); return c;
    }
    @Test public void offlineCalculationMatchesWebFixtures() {
        assertArrayEquals(new Integer[] {361, 748, 942, 1042, 1129}, PrayerTimeCalculator.calculate(at(TR, 2026, 1, 15, 12, 0), 37.9144, 40.2306));
        assertArrayEquals(new Integer[] {181, 739, 1048, 1182, 1290}, PrayerTimeCalculator.calculate(at(TR, 2026, 6, 15, 12, 0), 37.9144, 40.2306));
        assertArrayEquals(new Integer[] {329, 724, 929, 1028, 1114}, PrayerTimeCalculator.calculate(at(TR, 2026, 11, 16, 12, 0), 37.9144, 40.2306));
    }
    @Test public void todayUsesSuppliedTimesAndTomorrowUsesOffline() {
        Integer[] today = {300, 720, 900, 1080, 1200};
        long morning = at(TR, 2026, 11, 16, 4, 0).getTimeInMillis();
        assertEquals(at(TR, 2026, 11, 16, 5, 15).getTimeInMillis(), ReminderTimeCalculator.next(0, morning, TR, 37.9144, 40.2306, 15, "2026-11-16", today));
        long evening = at(TR, 2026, 11, 16, 23, 0).getTimeInMillis();
        Integer nextMinute = PrayerTimeCalculator.calculate(at(TR, 2026, 11, 17, 12, 0), 37.9144, 40.2306)[0];
        Calendar next = at(TR, 2026, 11, 17, nextMinute / 60, nextMinute % 60); next.add(Calendar.MINUTE, 15);
        assertEquals(next.getTimeInMillis(), ReminderTimeCalculator.next(0, evening, TR, 37.9144, 40.2306, 15, "2026-11-16", today));
    }
    @Test public void previousDayReminderCanCrossMidnight() {
        Integer[] today = {300, 720, 900, 1080, 1430};
        long now = at(TR, 2026, 11, 17, 0, 5).getTimeInMillis();
        assertEquals(at(TR, 2026, 11, 17, 0, 20).getTimeInMillis(), ReminderTimeCalculator.next(4, now, TR, 37.9144, 40.2306, 30, "2026-11-16", today));
    }
    @Test public void unavailablePolarTimesRemainUnscheduledForDailyRetry() {
        TimeZone zone = TimeZone.getTimeZone("Europe/Oslo");
        long now = at(zone, 2026, 6, 15, 12, 0).getTimeInMillis();
        assertEquals(0, ReminderTimeCalculator.next(0, now, zone, 78.22, 15.64, 15, "", null));
    }
    @Test public void futureCalculationUsesEachDatesDaylightSavingOffset() {
        TimeZone zone = TimeZone.getTimeZone("Europe/Berlin");
        long now = at(zone, 2026, 3, 28, 23, 0).getTimeInMillis();
        Integer m = PrayerTimeCalculator.calculate(at(zone, 2026, 3, 29, 12, 0), 52.52, 13.405)[0];
        Calendar expected = at(zone, 2026, 3, 29, m / 60, m % 60); expected.add(Calendar.MINUTE, 15);
        assertEquals(expected.getTimeInMillis(), ReminderTimeCalculator.next(0, now, zone, 52.52, 13.405, 15, "", null));
    }
    @Test public void eachAlarmCanRenewAcrossManyDaysWithoutOpeningApp() {
        long cursor = at(TR, 2026, 1, 15, 0, 0).getTimeInMillis();
        String lastDay = "";
        for (int i = 0; i < 90; i++) {
            long next = ReminderTimeCalculator.next(2, cursor, TR, 37.9144, 40.2306, 15, "", null);
            assertTrue(next > cursor);
            Calendar local = Calendar.getInstance(TR); local.setTimeInMillis(next);
            String day = ReminderTimeCalculator.dateKey(local);
            assertNotEquals(lastDay, day);
            lastDay = day;
            cursor = next + 1;
        }
    }

}
