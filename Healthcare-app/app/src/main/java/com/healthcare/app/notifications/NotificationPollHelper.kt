package com.healthcare.app.notifications

import android.content.Context
import com.healthcare.app.data.AppNotification
import com.healthcare.app.data.NotificationRepository
import com.healthcare.app.data.User

interface NotificationDeliveryState {
    fun alreadyShown(id: String): Boolean
    fun markShown(id: String)
    fun lastCriticalAt(key: String): Long
    fun markCriticalShown(key: String, atMs: Long)
}

class InMemoryDeliveryState : NotificationDeliveryState {
    private val shownIds = mutableSetOf<String>()
    private val lastCriticalShown = mutableMapOf<String, Long>()

    override fun alreadyShown(id: String): Boolean = id in shownIds
    override fun markShown(id: String) {
        shownIds.add(id)
    }

    override fun lastCriticalAt(key: String): Long = lastCriticalShown[key] ?: 0L
    override fun markCriticalShown(key: String, atMs: Long) {
        lastCriticalShown[key] = atMs
    }
}

object NotificationPollHelper {
    private const val CRITICAL_COOLDOWN_MS = 5 * 60_000L

    suspend fun pollOnce(
        context: Context,
        user: User,
        state: NotificationDeliveryState,
        repository: NotificationRepository = NotificationRepository(),
    ) {
        HealthcareNotificationManager.ensureChannels(context)
        runCatching {
            repository.fetchNotifications(user, unreadOnly = true)
        }.onSuccess { list ->
            val critical = list.filter { it.type == "telemetry_critical" }
            val other = list.filter { it.type != "telemetry_critical" }
            if (critical.isNotEmpty()) {
                showGroupedCriticalFromApi(context, critical, state)
            }
            other.filter { !state.alreadyShown(it.id) }.forEach { notification ->
                state.markShown(notification.id)
                HealthcareNotificationManager.show(context, notification)
            }
        }
    }

    private fun showGroupedCriticalFromApi(
        context: Context,
        critical: List<AppNotification>,
        state: NotificationDeliveryState,
    ) {
        val now = System.currentTimeMillis()
        val fresh = critical.filter { notification ->
            val key = notification.patientId ?: notification.id
            now - state.lastCriticalAt(key) >= CRITICAL_COOLDOWN_MS && !state.alreadyShown(notification.id)
        }
        if (fresh.isEmpty()) return
        fresh.forEach { notification ->
            val key = notification.patientId ?: notification.id
            state.markCriticalShown(key, now)
            state.markShown(notification.id)
        }
        if (fresh.size == 1) {
            HealthcareNotificationManager.show(context, fresh.first())
        } else {
            val summary = fresh.joinToString("; ") { it.body.take(60) }
            HealthcareNotificationManager.show(
                context,
                fresh.first().copy(
                    id = "api-critical-batch",
                    title = "Critical vitals — ${fresh.size} patients",
                    body = summary,
                    patientId = fresh.first().patientId,
                    room = fresh.first().room,
                ),
            )
        }
    }
}
