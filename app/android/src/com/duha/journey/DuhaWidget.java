package com.duha.journey;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.widget.RemoteViews;
import org.json.JSONObject;

public class DuhaWidget extends AppWidgetProvider {
    static final String PREFS = "duha";

    @Override // android.appwidget.AppWidgetProvider
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] iArr) {
        for (int i : iArr) {
            appWidgetManager.updateAppWidget(i, views(context));
        }
    }

    static RemoteViews views(Context context) {
        RemoteViews remoteViews = new RemoteViews(context.getPackageName(), R.layout.widget_duha);
        try {
            String string = context.getSharedPreferences(PREFS, 0).getString("widget", null);
            if (string != null) {
                JSONObject jSONObject = new JSONObject(string);
                remoteViews.setTextViewText(R.id.w_title, jSONObject.optString("t", context.getString(R.string.app_name)));
                remoteViews.setTextViewText(R.id.w_verse, jSONObject.optString("v", "وَٱلضُّحَىٰ"));
                remoteViews.setTextViewText(R.id.w_sub, jSONObject.optString("s", context.getString(R.string.widget_tap)));
            }
        } catch (Exception unused) {
        }
        remoteViews.setOnClickPendingIntent(R.id.w_root, PendingIntent.getActivity(context, 1, new Intent(context, (Class<?>) MainActivity.class).setFlags(805306368), 201326592));
        return remoteViews;
    }

    static void save(Context context, String str) {
        context.getSharedPreferences(PREFS, 0).edit().putString("widget", str).apply();
        AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
        int[] appWidgetIds = appWidgetManager.getAppWidgetIds(new ComponentName(context, (Class<?>) DuhaWidget.class));
        if (appWidgetIds == null || appWidgetIds.length <= 0) {
            return;
        }
        appWidgetManager.updateAppWidget(appWidgetIds, views(context));
    }
}
