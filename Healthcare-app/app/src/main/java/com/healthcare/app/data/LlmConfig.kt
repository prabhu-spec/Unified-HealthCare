package com.healthcare.app.data

import com.healthcare.app.BuildConfig

/**
 * LLM service runs on a separate port from the main API (local :5001; EC2 Phase 7).
 * Leave [BuildConfig.LLM_BASE_URL] empty to derive host from [BuildConfig.API_BASE_URL] with port 5001.
 */
object LlmConfig {
    fun baseUrl(): String {
        val explicit = BuildConfig.LLM_BASE_URL.trim()
        if (explicit.isNotEmpty()) {
            return explicit.trimEnd('/')
        }
        val api = BuildConfig.API_BASE_URL.trim().trimEnd('/')
        return if (api.endsWith(":5000")) {
            api.dropLast(5) + ":5001"
        } else {
            "$api:5001"
        }
    }

    fun url(path: String): String {
        if (path.startsWith("http")) return path
        val normalized = if (path.startsWith("/")) path else "/$path"
        return baseUrl() + normalized
    }
}
