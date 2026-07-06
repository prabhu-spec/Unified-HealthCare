package com.healthcare.app.notifications

import com.healthcare.app.data.User
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put

class PushTokenRepository(
    private val api: com.healthcare.app.data.HealthcareApi = com.healthcare.app.data.ApiClient.api,
) {
    suspend fun registerToken(user: User, token: String): Boolean = runCatching {
        api.postRaw(
            "/api/notifications/device-token",
            com.healthcare.app.data.ApiHeaders.forUser(user),
            buildJsonObject {
                put("token", token)
                put("platform", "android")
            },
        )
        true
    }.getOrDefault(false)
}
