package com.healthcare.app.notifications

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.healthcare.app.MainActivity
import com.healthcare.app.R
import com.healthcare.app.data.AppNotification
import com.healthcare.app.data.NotificationDeepLink

object HealthcareNotificationManager {
    const val CHANNEL_ALERTS = "healthcare_alerts"
    const val CHANNEL_REMINDERS = "healthcare_reminders"
    /** Single slot for all critical vitals — updates replace instead of stacking */
    const val NOTIFY_ID_CRITICAL = 1001
    const val GROUP_CRITICAL = "healthcare_critical_vitals"
    const val EXTRA_ROUTE = "deep_link_route"
    const val EXTRA_PATIENT_ID = "deep_link_patient_id"
    const val EXTRA_ROOM = "deep_link_room"
    const val EXTRA_ENTITY_ID = "deep_link_entity_id"
    const val EXTRA_NOTIFICATION_ID = "deep_link_notification_id"

    fun ensureChannels(context: Context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val manager = context.getSystemService(NotificationManager::class.java)
        manager.createNotificationChannel(
            NotificationChannel(
                CHANNEL_ALERTS,
                "Critical alerts",
                NotificationManager.IMPORTANCE_HIGH,
            ).apply { description = "IoT vitals and urgent care alerts" },
        )
        manager.createNotificationChannel(
            NotificationChannel(
                CHANNEL_REMINDERS,
                "Reminders",
                NotificationManager.IMPORTANCE_DEFAULT,
            ).apply { description = "Appointments, video consults, and visit reminders" },
        )
    }

    fun show(context: Context, notification: AppNotification) {
        ensureChannels(context)
        val channel = when (notification.type) {
            "telemetry_critical", "room_visit_reminder" -> CHANNEL_ALERTS
            else -> CHANNEL_REMINDERS
        }
        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra(EXTRA_ROUTE, notification.route)
            notification.patientId?.let { putExtra(EXTRA_PATIENT_ID, it) }
            notification.room?.let { putExtra(EXTRA_ROOM, it) }
            notification.entityId?.let { putExtra(EXTRA_ENTITY_ID, it) }
            putExtra(EXTRA_NOTIFICATION_ID, notification.id)
        }
        val pending = PendingIntent.getActivity(
            context,
            notification.id.hashCode(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
        val notifyId = if (notification.type == "telemetry_critical") {
            NOTIFY_ID_CRITICAL
        } else {
            notification.id.hashCode()
        }
        val built = NotificationCompat.Builder(context, channel)
            .setSmallIcon(R.drawable.ic_launcher)
            .setContentTitle(notification.title)
            .setContentText(notification.body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(notification.body))
            .setPriority(
                if (channel == CHANNEL_ALERTS) NotificationCompat.PRIORITY_HIGH
                else NotificationCompat.PRIORITY_DEFAULT,
            )
            .setAutoCancel(true)
            .setContentIntent(pending)
            .apply {
                if (notification.type == "telemetry_critical") {
                    setGroup(GROUP_CRITICAL)
                    setGroupSummary(false)
                    setOnlyAlertOnce(true)
                }
            }
            .build()
        NotificationManagerCompat.from(context).notify(notifyId, built)
    }

    fun parseDeepLink(intent: Intent?): NotificationDeepLink? {
        if (intent == null) return null
        val route = intent.getStringExtra(EXTRA_ROUTE) ?: return null
        return NotificationDeepLink(
            route = route,
            patientId = intent.getStringExtra(EXTRA_PATIENT_ID),
            room = intent.getStringExtra(EXTRA_ROOM),
            entityId = intent.getStringExtra(EXTRA_ENTITY_ID),
        )
    }
}
