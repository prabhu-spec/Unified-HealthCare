package com.healthcare.app.data

data class AiStatus(
    val mode: String = "unknown",
    val model: String = "",
    val ollamaReachable: Boolean = false,
    val message: String? = null,
)

data class AiSummaryResult(
    val patientId: String,
    val summary: String,
    val mode: String,
    val model: String,
    val disclaimer: String? = null,
    val generatedAt: String? = null,
)

data class AiChatMessage(
    val role: String,
    val text: String,
)

data class AiChatResult(
    val reply: String,
    val patientId: String? = null,
    val mode: String = "",
    val model: String = "",
    val disclaimer: String? = null,
)
