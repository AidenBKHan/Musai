package com.musai.musai_app

import android.appwidget.AppWidgetManager
import android.content.Context
import android.content.SharedPreferences
import android.widget.RemoteViews
import es.antonborri.home_widget.HomeWidgetLaunchIntent
import es.antonborri.home_widget.HomeWidgetProvider

/** Renders the "global safety index" the user last looked up on their home screen. */
class SafetyIndexWidgetProvider : HomeWidgetProvider() {

  override fun onUpdate(
      context: Context,
      appWidgetManager: AppWidgetManager,
      appWidgetIds: IntArray,
      widgetData: SharedPreferences,
  ) {
    appWidgetIds.forEach { widgetId ->
      val views =
          RemoteViews(context.packageName, R.layout.safety_index_widget).apply {
            val pendingIntent = HomeWidgetLaunchIntent.getActivity(context, MainActivity::class.java)
            setOnClickPendingIntent(R.id.widget_root, pendingIntent)

            val countryName = widgetData.getString("country_name", null)
            val regionName = widgetData.getString("region_name", null)
            val location =
                if (!regionName.isNullOrBlank()) "$regionName, $countryName" else countryName

            setTextViewText(R.id.widget_location, location ?: "위치를 선택하세요")

            val score = widgetData.getFloat("score", -1f)
            setTextViewText(R.id.widget_score, if (score >= 0) "%.1f".format(score) else "--")

            val sourceName = widgetData.getString("source_name", null)
            setTextViewText(R.id.widget_source, sourceName?.let { "출처: $it" } ?: "")
          }

      appWidgetManager.updateAppWidget(widgetId, views)
    }
  }
}
