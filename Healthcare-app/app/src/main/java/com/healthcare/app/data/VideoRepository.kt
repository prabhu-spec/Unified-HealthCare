package com.healthcare.app.data

import com.healthcare.app.data.ApiClient.getRaw
import com.healthcare.app.data.ApiClient.patchRaw
import com.healthcare.app.data.ApiClient.postRaw
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import java.time.LocalDate
import java.time.LocalTime
import java.time.format.DateTimeFormatter

data class VideoAppointment(
    val id: String,
    val patientName: String,
    val doctorType: String,
    val hospitalId: String,
    val hospitalName: String,
    val date: String,
    val time: String,
    val status: String,
    val roomName: String?,
)

data class VideoToken(
    val token: String,
    val roomName: String,
    val url: String,
)

class VideoRepository(
    private val api: HealthcareApi = ApiClient.api,
) {
    suspend fun listAppointments(user: User): List<VideoAppointment> {
        val query = when {
            user.role == UserRole.patient && user.patientId != null -> "?patientId=${user.patientId}"
            else -> ""
        }
        val body = api.getRaw("/api/video/appointments$query", ApiHeaders.forUser(user))
        val root = body as? JsonObject ?: return emptyList()
        return root["data"]?.jsonArray?.mapNotNull { element ->
            runCatching {
                val obj = element.jsonObject
                VideoAppointment(
                    id = obj.string("id"),
                    patientName = obj.string("patientName").ifBlank { "Patient" },
                    doctorType = obj.string("doctorType").ifBlank { "General medicine" },
                    hospitalId = obj.string("hospitalId"),
                    hospitalName = obj.string("hospitalName"),
                    date = obj.string("date"),
                    time = obj.string("time"),
                    status = obj.string("status").ifBlank { "pending" },
                    roomName = obj.string("roomName").ifBlank { null },
                )
            }.getOrNull()
        }.orEmpty()
    }

    suspend fun requestAppointment(user: User): VideoAppointment {
        val body = JsonObject(
            mapOf(
                "doctorType" to JsonPrimitive(user.specialization ?: "General medicine"),
                "hospitalId" to JsonPrimitive(user.hospitalId ?: "org-1"),
                "hospitalName" to JsonPrimitive(if (user.hospitalId != null) "Assigned hospital" else "Southeast Health"),
                "date" to JsonPrimitive(LocalDate.now().toString()),
                "time" to JsonPrimitive(LocalTime.now().plusHours(1).format(DateTimeFormatter.ofPattern("HH:mm"))),
                "patientId" to JsonPrimitive(user.patientId ?: user.id),
                "patientName" to JsonPrimitive(user.displayName.ifBlank { user.email }),
            ),
        )
        return unwrapAppointment(api.postRaw("/api/video/appointments", ApiHeaders.forUser(user), body))
    }

    suspend fun acceptAppointment(id: String, user: User): VideoAppointment =
        unwrapAppointment(api.patchRaw("/api/video/appointments/$id/accept", ApiHeaders.forUser(user), JsonObject(emptyMap())))

    suspend fun rejectAppointment(id: String, user: User): VideoAppointment =
        unwrapAppointment(api.patchRaw("/api/video/appointments/$id/reject", ApiHeaders.forUser(user), JsonObject(emptyMap())))

    suspend fun completeAppointment(id: String, user: User): VideoAppointment =
        unwrapAppointment(api.patchRaw("/api/video/appointments/$id/complete", ApiHeaders.forUser(user), JsonObject(emptyMap())))

    suspend fun token(roomName: String, user: User): VideoToken {
        val body = JsonObject(
            mapOf(
                "roomName" to JsonPrimitive(roomName),
                "participantName" to JsonPrimitive(user.displayName.ifBlank { user.email }),
            ),
        )
        val response = api.postRaw("/api/video/token", ApiHeaders.forUser(user), body)
        return VideoToken(
            token = response.string("token"),
            roomName = response.string("roomName").ifBlank { roomName },
            url = response.string("url"),
        )
    }

    private fun unwrapAppointment(response: JsonObject): VideoAppointment {
        val obj = response["data"]?.jsonObject ?: response
        return VideoAppointment(
            id = obj.string("id"),
            patientName = obj.string("patientName").ifBlank { "Patient" },
            doctorType = obj.string("doctorType").ifBlank { "General medicine" },
            hospitalId = obj.string("hospitalId"),
            hospitalName = obj.string("hospitalName"),
            date = obj.string("date"),
            time = obj.string("time"),
            status = obj.string("status").ifBlank { "pending" },
            roomName = obj.string("roomName").ifBlank { null },
        )
    }

    private fun JsonObject.string(key: String): String =
        runCatching { this[key]?.jsonPrimitive?.content.orEmpty() }.getOrDefault("")
}
