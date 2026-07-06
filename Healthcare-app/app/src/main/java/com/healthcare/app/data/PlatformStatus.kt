package com.healthcare.app.data

data class PlatformFeature(
    val id: String,
    val label: String,
    val api: String,
    val phase: Int,
    val roles: String,
)

data class PlatformStatus(
    val phase: Int,
    val phaseLabel: String,
    val storage: String,
    val demoPassword: String,
    val features: List<PlatformFeature>,
)
