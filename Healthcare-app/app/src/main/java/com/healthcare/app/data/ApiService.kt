package com.healthcare.app.data

import com.healthcare.app.BuildConfig
import com.jakewharton.retrofit2.converter.kotlinx.serialization.asConverterFactory
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.jsonObject
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.HeaderMap
import retrofit2.http.PATCH
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Url
import java.util.concurrent.TimeUnit

interface HealthcareApi {
    @GET("/api/auth/check")
    suspend fun checkAuth(): HealthCheckResponse

    @POST("/api/auth/login")
    suspend fun login(@Body body: LoginRequest): LoginResponse

    @POST("/api/auth/forgot-password")
    suspend fun forgotPassword(@Body body: EmailRequest): ApiActionResponse

    @POST("/api/auth/reset-password")
    suspend fun resetPassword(@Body body: ResetPasswordRequest): ApiActionResponse

    @POST("/api/auth/request-password-change-otp")
    suspend fun requestPasswordChangeOtp(@Body body: EmailRequest): ApiActionResponse

    @POST("/api/auth/change-password")
    suspend fun changePassword(@Body body: ChangePasswordRequest): ApiActionResponse

    @POST("/api/auth/forgot-email")
    suspend fun forgotEmail(@Body body: EmailRequest): ApiActionResponse

    @POST("/api/auth/request-delete-account-otp")
    suspend fun requestDeleteAccountOtp(@Body body: EmailRequest): ApiActionResponse

    @POST("/api/auth/confirm-delete-account")
    suspend fun confirmDeleteAccount(@Body body: DeleteAccountRequest): ApiActionResponse

    @GET
    suspend fun getRaw(@Url url: String, @HeaderMap headers: Map<String, String>): JsonElement

    @POST
    suspend fun postRaw(@Url url: String, @HeaderMap headers: Map<String, String>, @Body body: JsonObject): JsonObject

    @PUT
    suspend fun putRaw(@Url url: String, @HeaderMap headers: Map<String, String>, @Body body: JsonObject): JsonObject

    @PATCH
    suspend fun patchRaw(@Url url: String, @HeaderMap headers: Map<String, String>, @Body body: JsonObject): JsonObject

    @DELETE
    suspend fun deleteRaw(@Url url: String, @HeaderMap headers: Map<String, String>): JsonObject
}

object ApiClient {
    private val json = Json {
        ignoreUnknownKeys = true
        isLenient = true
    }

    private val logging = HttpLoggingInterceptor().apply {
        level = HttpLoggingInterceptor.Level.BASIC
    }

    private val authInterceptor = okhttp3.Interceptor { chain ->
        val token = AuthTokenHolder.accessToken
        val request = if (!token.isNullOrBlank()) {
            chain.request().newBuilder()
                .header("Authorization", "Bearer $token")
                .build()
        } else {
            chain.request()
        }
        chain.proceed(request)
    }

    private val httpClient = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(120, TimeUnit.SECONDS)
        .addInterceptor(authInterceptor)
        .addInterceptor(logging)
        .build()

    private val retrofit: Retrofit by lazy {
        val contentType = "application/json".toMediaType()
        Retrofit.Builder()
            .baseUrl(ensureTrailingSlash(BuildConfig.API_BASE_URL))
            .client(httpClient)
            .addConverterFactory(json.asConverterFactory(contentType))
            .build()
    }

    val api: HealthcareApi by lazy {
        retrofit.create(HealthcareApi::class.java)
    }

    suspend fun HealthcareApi.getRaw(path: String, headers: Map<String, String>): JsonElement {
        val base = ensureTrailingSlash(BuildConfig.API_BASE_URL)
        val full = if (path.startsWith("http")) path else base.trimEnd('/') + path
        return getRaw(full, headers)
    }

    suspend fun HealthcareApi.postRaw(path: String, headers: Map<String, String>, body: JsonObject): JsonObject {
        val base = ensureTrailingSlash(BuildConfig.API_BASE_URL)
        val full = if (path.startsWith("http")) path else base.trimEnd('/') + path
        return postRaw(full, headers, body)
    }

    suspend fun HealthcareApi.putRaw(path: String, headers: Map<String, String>, body: JsonObject): JsonObject {
        val base = ensureTrailingSlash(BuildConfig.API_BASE_URL)
        val full = if (path.startsWith("http")) path else base.trimEnd('/') + path
        return putRaw(full, headers, body)
    }

    suspend fun HealthcareApi.patchRaw(path: String, headers: Map<String, String>, body: JsonObject): JsonObject {
        val base = ensureTrailingSlash(BuildConfig.API_BASE_URL)
        val full = if (path.startsWith("http")) path else base.trimEnd('/') + path
        return patchRaw(full, headers, body)
    }

    suspend fun HealthcareApi.deleteRaw(path: String, headers: Map<String, String>): JsonObject {
        val base = ensureTrailingSlash(BuildConfig.API_BASE_URL)
        val full = if (path.startsWith("http")) path else base.trimEnd('/') + path
        return deleteRaw(full, headers)
    }

    private fun ensureTrailingSlash(url: String): String =
        if (url.endsWith("/")) url else "$url/"
}
