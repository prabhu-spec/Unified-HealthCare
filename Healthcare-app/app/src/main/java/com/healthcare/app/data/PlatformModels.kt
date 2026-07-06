package com.healthcare.app.data

data class FeatureListItem(
    val id: String,
    val title: String,
    val subtitle: String? = null,
    val meta: String? = null,
    val heartRate: Float? = null,
    val spo2: Float? = null,
    val temperature: Float? = null,
    val battery: Float? = null,
    val systolic: Float? = null,
    val diastolic: Float? = null,
    val respiration: Float? = null,
    val alert: Boolean = false,
    val patientId: String? = null,
    val room: String? = null,
    val fullName: String? = null,
)

data class FeatureContent(
    val route: String,
    val title: String,
    val description: String,
    val items: List<FeatureListItem>,
    val dataSource: DataSource,
)

enum class DataSource {
    LIVE,
    OFFLINE,
}
