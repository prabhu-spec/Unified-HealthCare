package com.healthcare.app.data

import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.decodeFromJsonElement
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive

class NotificationRepository(
    private val api: HealthcareApi = ApiClient.api,
) {
    private val json = Json { ignoreUnknownKeys = true }

    suspend fun fetchNotifications(user: User, unreadOnly: Boolean = false): List<AppNotification> {
        val q = if (unreadOnly) "?unreadOnly=true" else ""
        val body = api.getRaw("/api/notifications$q", ApiHeaders.forUser(user))
        val root = body as? JsonObject ?: return emptyList()
        val array = root["data"] as? JsonArray ?: return emptyList()
        return array.mapNotNull { el ->
            runCatching { json.decodeFromJsonElement(AppNotification.serializer(), el) }.getOrNull()
        }
    }

    suspend fun markRead(user: User, notificationId: String) {
        runCatching {
            api.patchRaw(
                "/api/notifications/$notificationId/read",
                ApiHeaders.forUser(user),
                JsonObject(emptyMap()),
            )
        }
    }

    suspend fun markAllRead(user: User) {
        runCatching {
            api.postRaw(
                "/api/notifications/read-all",
                ApiHeaders.forUser(user),
                JsonObject(emptyMap()),
            )
        }
    }
}
