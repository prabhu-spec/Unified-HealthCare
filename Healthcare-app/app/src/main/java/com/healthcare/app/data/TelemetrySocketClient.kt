package com.healthcare.app.data

import com.healthcare.app.BuildConfig
import io.socket.client.IO
import io.socket.client.Socket
import org.json.JSONObject

data class TelemetryVitalsUpdate(
    val patientId: String,
    val heartRate: Float?,
    val spo2: Float?,
    val temperature: Float?,
    val battery: Float?,
    val systolic: Float? = null,
    val diastolic: Float? = null,
    val respiration: Float? = null,
    val alert: Boolean,
    val timestamp: String?,
    val room: String? = null,
    val fullName: String? = null,
)

class TelemetrySocketClient(
    private val user: User,
    private val onConnected: (Boolean, String) -> Unit,
    private val onVitals: (TelemetryVitalsUpdate) -> Unit,
) {
    private var socket: Socket? = null

    fun connect() {
        if (socket?.connected() == true) return
        val options = IO.Options().apply {
            transports = arrayOf("websocket", "polling")
            reconnection = true
            auth = mapOf(
                "role" to user.role.name,
                "hospitalId" to (user.hospitalId ?: ""),
                "userId" to user.id,
                "patientId" to (user.patientId ?: ""),
                "email" to user.email,
            )
        }
        val instance = IO.socket(BuildConfig.API_BASE_URL, options)
        socket = instance
        instance.on(Socket.EVENT_CONNECT) {
            onConnected(true, "Socket.IO connected")
        }
        instance.on(Socket.EVENT_DISCONNECT) {
            onConnected(false, "Socket.IO disconnected")
        }
        instance.on(Socket.EVENT_CONNECT_ERROR) { args ->
            onConnected(false, args.firstOrNull()?.toString() ?: "Socket.IO connection error")
        }
        instance.on("rpm") { args ->
            val payload = args.firstOrNull() as? JSONObject ?: return@on
            if (payload.optString("type") != "vitals" && payload.optString("type") != "critical_alert") {
                return@on
            }
            val vitals = payload.optJSONObject("vitals")
            val patientId = payload.optString("patientId")
            if (patientId.isBlank() || vitals == null) return@on
            onVitals(
                TelemetryVitalsUpdate(
                    patientId = patientId,
                    heartRate = vitals.optNullableFloat("heartRate"),
                    spo2 = vitals.optNullableFloat("spo2"),
                    temperature = vitals.optNullableFloat("temperature"),
                    battery = vitals.optNullableFloat("battery"),
                    systolic = vitals.optNullableFloat("systolic"),
                    diastolic = vitals.optNullableFloat("diastolic"),
                    respiration = vitals.optNullableFloat("respiration"),
                    alert = payload.optBoolean("alert") || payload.optString("type") == "critical_alert",
                    timestamp = vitals.optString("timestamp").ifBlank { payload.optString("at").ifBlank { null } },
                    room = payload.optString("room").ifBlank { null },
                    fullName = payload.optString("fullName").ifBlank { null },
                ),
            )
        }
        instance.connect()
    }

    fun disconnect() {
        socket?.disconnect()
        socket?.off()
        socket = null
    }
}

private fun JSONObject.optNullableFloat(key: String): Float? =
    if (has(key) && !isNull(key)) optDouble(key).toFloat() else null
