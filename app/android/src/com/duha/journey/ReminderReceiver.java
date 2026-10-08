package com.duha.journey;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import org.json.JSONArray;
import org.json.JSONObject;

public class ReminderReceiver extends BroadcastReceiver {
    static final String CHANNEL = "daily";

    @Override // android.content.BroadcastReceiver
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        if (action == null || !"android.intent.action.BOOT_COMPLETED".equals(action)) {
            long jCurrentTimeMillis = System.currentTimeMillis();
            JSONObject jSONObject = null;
            try {
                JSONArray jSONArrayPlan = plan(context);
                for (int i = 0; i < jSONArrayPlan.length(); i++) {
                    JSONObject jSONObject2 = jSONArrayPlan.getJSONObject(i);
                    long j = jSONObject2.getLong("t");
                    if (j <= 60000 + jCurrentTimeMillis && j > jCurrentTimeMillis - 21600000) {
                        jSONObject = jSONObject2;
                    }
                }
            } catch (Exception unused) {
            }
            if (jSONObject != null) {
                notify(context, jSONObject.optString("title", "رحلة الضحى"), jSONObject.optString("body", ""));
            }
        }
        schedule(context);
    }

    static JSONArray plan(Context context) throws Exception {
        return new JSONArray(context.getSharedPreferences("duha", 0).getString("reminders", "[]"));
    }

    static void save(Context context, String str) {
        context.getSharedPreferences("duha", 0).edit().putString("reminders", str).apply();
        schedule(context);
    }

    static void schedule(Context context) {
        long j;
        AlarmManager alarmManager = (AlarmManager) context.getSystemService("alarm");
        PendingIntent broadcast = PendingIntent.getBroadcast(context, 0, new Intent(context, (Class<?>) ReminderReceiver.class), 201326592);
        alarmManager.cancel(broadcast);
        long jCurrentTimeMillis = System.currentTimeMillis();
        try {
            JSONArray jSONArrayPlan = plan(context);
            j = Long.MAX_VALUE;
            for (int i = 0; i < jSONArrayPlan.length(); i++) {
                try {
                    long j2 = jSONArrayPlan.getJSONObject(i).getLong("t");
                    if (j2 > 30000 + jCurrentTimeMillis && j2 < j) {
                        j = j2;
                    }
                } catch (Exception unused) {
                }
            }
        } catch (Exception unused2) {
            j = Long.MAX_VALUE;
        }
        if (j == Long.MAX_VALUE) {
            return;
        }
        alarmManager.setAndAllowWhileIdle(0, j, broadcast);
    }

    static void notify(Context context, String str, String str2) {
        Notification.Builder builder;
        NotificationManager notificationManager = (NotificationManager) context.getSystemService("notification");
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationChannel notificationChannel = new NotificationChannel(CHANNEL, context.getString(R.string.channel_daily), 3);
            notificationChannel.setDescription(context.getString(R.string.channel_daily));
            notificationManager.createNotificationChannel(notificationChannel);
            builder = new Notification.Builder(context, CHANNEL);
        } else {
            builder = new Notification.Builder(context);
        }
        builder.setSmallIcon(R.drawable.ic_stat_sun).setContentTitle(str).setContentText(str2).setStyle(new Notification.BigTextStyle().bigText(str2)).setContentIntent(PendingIntent.getActivity(context, 2, new Intent(context, (Class<?>) MainActivity.class).setFlags(805306368), 201326592)).setAutoCancel(true).setColor(-542652);
        try {
            notificationManager.notify(7, builder.build());
        } catch (SecurityException unused) {
        }
    }
}
