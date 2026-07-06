package com.healthcare.app.data

import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.put

class AiRepository(
    private val api: HealthcareApi = ApiClient.api,
) {
    suspend fun fetchStatus(user: User): AiStatus {
        val body = api.getRaw(LlmConfig.url("/api/ai/status"), ApiHeaders.forUser(user))
        val data = body.asObject()["data"]?.asObject() ?: body.asObject()
        return AiStatus(
            mode = data.str("mode").ifBlank { "unknown" },
            model = data.str("model"),
            ollamaReachable = data.str("mode") == "ollama",
            message = if (data.str("enabled") == "false") {
                "AI Assist is disabled on this server."
            } else {
                null
            },
        )
    }

    suspend fun summarizePatient(user: User, patientId: String): AiSummaryResult {
        val body = api.postRaw(
            LlmConfig.url("/api/ai/summarize-patient/$patientId"),
            ApiHeaders.forUser(user),
            JsonObject(emptyMap()),
        )
        val data = body.asObject()["data"]?.asObject()
            ?: throw IllegalStateException(body.asObject().str("error").ifBlank { "Summary failed." })
        return AiSummaryResult(
            patientId = data.str("patientId").ifBlank { patientId },
            summary = data.str("summary"),
            mode = data.str("mode"),
            model = data.str("model"),
            disclaimer = data.str("disclaimer").ifBlank { null },
            generatedAt = data.str("generatedAt").ifBlank { null },
        )
    }

    suspend fun chat(user: User, message: String, patientId: String?): AiChatResult {
        val payload = buildJsonObject {
            put("message", message)
            if (!patientId.isNullOrBlank()) put("patientId", patientId)
        }
        val body = api.postRaw(
            LlmConfig.url("/api/ai/chat"),
            ApiHeaders.forUser(user),
            payload,
        )
        val data = body.asObject()["data"]?.asObject()
            ?: throw IllegalStateException(body.asObject().str("error").ifBlank { "Chat failed." })
        return AiChatResult(
            reply = data.str("reply"),
            patientId = data.str("patientId").ifBlank { null },
            mode = data.str("mode"),
            model = data.str("model"),
            disclaimer = data.str("disclaimer").ifBlank { null },
        )
    }

    suspend fun acceptDraft(
        user: User,
        patientId: String,
        draft: String,
        source: String = "summary",
        append: Boolean = true,
    ): String {
        val payload = buildJsonObject {
            put("draft", draft)
            put("source", source)
            put("append", append)
        }
        val body = api.postRaw(
            "/api/core/patients/$patientId/accept-ai-draft",
            ApiHeaders.forUser(user),
            payload,
        )
        val data = body.asObject()["data"]?.asObject()
        if (data != null) {
            return data.str("message").ifBlank { "Saved to patient notes." }
        }
        throw IllegalStateException(body.asObject().str("error").ifBlank { "Failed to save draft." })
    }

    suspend fun fetchPatientLabel(user: User, patientId: String): String {
        return runCatching {
            val body = api.getRaw("/api/core/patients/$patientId", ApiHeaders.forUser(user))
            val patient = body.asObject()["data"]?.asObject()?.get("patient")?.asObject()
                ?: body.asObject()["patient"]?.asObject()
            patient?.readPatientName()?.ifBlank { null } ?: "Patient $patientId"
        }.getOrDefault("Patient $patientId")
    }

    private fun JsonElement.asObject(): JsonObject = this as? JsonObject ?: JsonObject(emptyMap())

    private fun JsonObject.str(key: String): String =
        this[key]?.jsonPrimitive?.content.orEmpty()

    private fun JsonObject.readPatientName(): String {
        val name = this["name"]?.asObject() ?: return ""
        val given = name["given"]?.let { el ->
            when (el) {
                is JsonArray -> el.joinToString(" ") { it.jsonPrimitive.content }
                else -> el.jsonPrimitive.content
            }
        }.orEmpty()
        val family = name["family"]?.jsonPrimitive?.content.orEmpty()
        return listOf(given, family).filter { it.isNotBlank() }.joinToString(" ")
    }
}
