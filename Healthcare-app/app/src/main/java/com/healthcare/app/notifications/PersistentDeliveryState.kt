package com.healthcare.app.notifications

import android.content.Context
import androidx.datastore.preferences.preferencesDataStore
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.longPreferencesKey
import androidx.datastore.preferences.core.stringSetPreferencesKey
import com.healthcare.app.data.NotificationRepository
import com.healthcare.app.data.User
import kotlinx.coroutines.flow.first

internal val Context.notificationDeliveryStore by preferencesDataStore("notification_delivery")

private val shownKey = stringSetPreferencesKey("shown_ids")
private fun criticalKey(key: String) = longPreferencesKey("critical_$key")

suspend fun pollOncePersistent(
    context: Context,
    user: User,
    repository: NotificationRepository = NotificationRepository(),
) {
    val store = context.notificationDeliveryStore
    HealthcareNotificationManager.ensureChannels(context)
    runCatching {
        repository.fetchNotifications(user, unreadOnly = true)
    }.onSuccess { list ->
        val prefs = store.data.first()
        val shown = prefs[shownKey] ?: emptySet()
        val now = System.currentTimeMillis()
        val critical = list.filter { it.type == "telemetry_critical" }
        val other = list.filter { it.type != "telemetry_critical" }
        val freshCritical = critical.filter { notification ->
            val key = notification.patientId ?: notification.id
            now - (prefs[criticalKey(key)] ?: 0L) >= 5 * 60_000L && notification.id !in shown
        }
        if (freshCritical.isNotEmpty()) {
            store.edit { edit ->
                val ids = edit[shownKey]?.toMutableSet() ?: mutableSetOf()
                freshCritical.forEach { notification ->
                    val key = notification.patientId ?: notification.id
                    edit[criticalKey(key)] = now
                    ids.add(notification.id)
                }
                edit[shownKey] = ids
            }
            if (freshCritical.size == 1) {
                HealthcareNotificationManager.show(context, freshCritical.first())
            } else {
                val summary = freshCritical.joinToString("; ") { it.body.take(60) }
                HealthcareNotificationManager.show(
                    context,
                    freshCritical.first().copy(
                        id = "api-critical-batch",
                        title = "Critical vitals — ${freshCritical.size} patients",
                        body = summary,
                        patientId = freshCritical.first().patientId,
                        room = freshCritical.first().room,
                    ),
                )
            }
        }
        other.filter { it.id !in shown }.forEach { notification ->
            store.edit { edit ->
                val ids = edit[shownKey]?.toMutableSet() ?: mutableSetOf()
                ids.add(notification.id)
                edit[shownKey] = ids
            }
            HealthcareNotificationManager.show(context, notification)
        }
    }
}
