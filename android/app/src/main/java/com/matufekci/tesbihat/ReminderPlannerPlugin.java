package com.matufekci.tesbihat;

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
            String channelName = call.getString("channelName"), description = call.getString("channelDescription");
            if (lat == null || lng == null || delay == null || date == null || title == null || minutes == null || bodies == null
                    || channelName == null || description == null) throw new IllegalArgumentException("Missing reminder configuration");
            ReminderScheduler.configure(getContext(), lat, lng, delay, date, minutes, title, bodies, channelName, description);
            call.resolve();
        } catch (Exception error) { call.reject("Could not configure reminders", error); }
    }

    @PluginMethod public void cancel(PluginCall call) {
        try { ReminderScheduler.disable(getContext()); call.resolve(); }
        catch (Exception error) { call.reject("Could not cancel reminders", error); }
    }
}
