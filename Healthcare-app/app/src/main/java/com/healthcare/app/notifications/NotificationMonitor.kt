package com.healthcare.app.notifications

import android.content.Context
import com.healthcare.app.data.AppNotification
import com.healthcare.app.data.NotificationRepository
import com.healthcare.app.data.TelemetrySocketClient
import com.healthcare.app.data.TelemetryVitalsUpdate
import com.healthcare.app.data.User
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

class NotificationMonitor(
    private val context: Context,
    private val user: User,
    private val repository: NotificationRepository = NotificationRepository(),
) {
    private val scope = CoroutineScope(Dispatchers.IO)
    private var pollJob: Job? = null
    private var socket: TelemetrySocketClient? = null
    private val deliveryState = InMemoryDeliveryState()
    private val pendingCritical = linkedMapOf<String, TelemetryVitalsUpdate>()
    private var batchJob: Job? = null

    fun start() {
        HealthcareNotificationManager.ensureChannels(context)
        pollJob?.cancel()
        pollJob = scope.launch {
            while (isActive) {
                pollNotifications()
                delay(60_000)
            }
        }
        if (user.role.name in setOf("doctor", "hospital_admin")) {
            socket?.disconnect()
            socket = TelemetrySocketClient(
                user = user,
                onConnected = { _, _ -> },
                onVitals = { update -> handleRealtime(update) },
            ).also { it.connect() }
        }
    }

    fun stop() {
        pollJob?.cancel()
        pollJob = null
        batchJob?.cancel()
        batchJob = null
        socket?.disconnect()
        socket = null
        pendingCritical.clear()
    }

    private suspend fun pollNotifications() {
        NotificationPollHelper.pollOnce(context, user, deliveryState, repository)
    }

    private fun handleRealtime(update: TelemetryVitalsUpdate) {
        if (!update.alert) return
        pendingCritical[update.patientId] = update
        if (batchJob?.isActive == true) return
        batchJob = scope.launch {
            delay(2_000)
            flushCriticalBatch()
        }
    }

    private suspend fun flushCriticalBatch() {
        val batch = pendingCritical.values.toList()
        pendingCritical.clear()
        if (batch.isEmpty()) return
        val now = System.currentTimeMillis()
        val fresh = batch.filter { patient ->
            now - deliveryState.lastCriticalAt(patient.patientId) >= 5 * 60_000L
        }
        if (fresh.isEmpty()) return
        fresh.forEach { deliveryState.markCriticalShown(it.patientId, now) }
        if (fresh.size == 1) {
            val p = fresh.first()
            val label = p.fullName ?: p.patientId
            HealthcareNotificationManager.show(
                context,
                AppNotification(
                    id = "critical-${p.patientId}",
                    type = "telemetry_critical",
                    title = "Critical vitals alert",
                    body = "$label in room ${p.room ?: "?"} has critical vitals. Tap to view.",
                    route = "telemetry_room",
                    patientId = p.patientId,
                    room = p.room,
                    read = false,
                ),
            )
        } else {
            val names = fresh.joinToString(", ") { it.fullName ?: it.patientId }
            HealthcareNotificationManager.show(
                context,
                AppNotification(
                    id = "critical-batch",
                    type = "telemetry_critical",
                    title = "Critical vitals — ${fresh.size} patients",
                    body = "Multiple patients need attention: $names. Tap to open the first patient room.",
                    route = "telemetry_room",
                    patientId = fresh.first().patientId,
                    room = fresh.first().room,
                    read = false,
                ),
            )
        }
    }
}
