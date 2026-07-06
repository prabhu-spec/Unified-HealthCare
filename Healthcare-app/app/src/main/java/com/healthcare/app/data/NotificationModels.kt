package com.healthcare.app.data

import kotlinx.serialization.Serializable

@Serializable
data class AppNotification(
    val id: String,
    val type: String,
    val title: String,
    val body: String,
    val targetRoles: List<String> = emptyList(),
    val hospitalId: String? = null,
    val patientId: String? = null,
    val room: String? = null,
    val route: String,
    val entityId: String? = null,
    val read: Boolean = false,
    val createdAt: String = "",
)

data class NotificationDeepLink(
    val route: String,
    val patientId: String? = null,
    val room: String? = null,
    val entityId: String? = null,
)
