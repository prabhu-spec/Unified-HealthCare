package com.healthcare.app.data

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore("healthcare_auth")

sealed class AuthResult {
    data class Success(val user: User) : AuthResult()
    data class Error(val message: String) : AuthResult()
}

class AuthRepository(private val context: Context) {
    private val json = Json { ignoreUnknownKeys = true }
    private val userKey = stringPreferencesKey("current_user")
    private val tokenKey = stringPreferencesKey("access_token")

    val currentUser: Flow<User?> = context.dataStore.data.map { prefs ->
        prefs[userKey]?.let { stored ->
            runCatching { json.decodeFromString<UserDto>(stored).toUser() }.getOrNull()
        }
    }

    suspend fun initialize(): User? {
        val user = getStoredUser()
        if (user == null) {
            AuthTokenHolder.accessToken = null
            return null
        }
        AuthTokenHolder.accessToken = getStoredToken()
        return try {
            ApiClient.api.checkAuth()
            user
        } catch (_: Exception) {
            // Keep signed-in user when backend is unreachable; features use offline demo data.
            user
        }
    }

    suspend fun login(email: String, password: String): AuthResult {
        val trimmedEmail = email.trim()
        return try {
            val response = ApiClient.api.login(LoginRequest(trimmedEmail, password))
            if (response.success && response.user != null) {
                val user = response.user.toUser()
                saveUser(user, response.token)
                AuthResult.Success(user)
            } else {
                localFallback(trimmedEmail, password)
                    ?: AuthResult.Error(response.error ?: "Invalid email or password.")
            }
        } catch (e: Exception) {
            localFallback(trimmedEmail, password)
                ?: AuthResult.Error(
                    if (isNetworkError(e)) {
                        "Cannot reach server at ${com.healthcare.app.BuildConfig.API_BASE_URL}. Check internet and that the AWS backend is running."
                    } else {
                        e.message ?: "Login failed."
                    },
                )
        }
    }

    suspend fun getStoredUserSnapshot(): User? = getStoredUser()

    suspend fun logout() {
        clearSession()
    }

    suspend fun backendStatus(): Result<String> = runCatching {
        val health = ApiClient.api.checkAuth()
        if (health.ok || health.status == "ok") "Connected to ${com.healthcare.app.BuildConfig.API_BASE_URL}"
        else "Backend reachable, but returned an unexpected health response."
    }

    suspend fun requestForgotPasswordOtp(email: String): AuthResult =
        actionResult { ApiClient.api.forgotPassword(EmailRequest(email.trim())) }

    suspend fun resetPassword(email: String, otp: String, newPassword: String): AuthResult =
        actionResult {
            ApiClient.api.resetPassword(
                ResetPasswordRequest(
                    email = email.trim(),
                    otp = otp.trim(),
                    newPassword = newPassword,
                ),
            )
        }

    suspend fun requestPasswordChangeOtp(email: String): AuthResult =
        actionResult { ApiClient.api.requestPasswordChangeOtp(EmailRequest(email.trim())) }

    suspend fun changePassword(email: String, otp: String, newPassword: String): AuthResult =
        actionResult {
            ApiClient.api.changePassword(
                ChangePasswordRequest(
                    email = email.trim(),
                    otp = otp.trim(),
                    newPassword = newPassword,
                ),
            )
        }

    suspend fun forgotEmail(email: String): AuthResult =
        actionResult { ApiClient.api.forgotEmail(EmailRequest(email.trim())) }

    suspend fun requestDeleteAccountOtp(email: String): AuthResult =
        actionResult { ApiClient.api.requestDeleteAccountOtp(EmailRequest(email.trim())) }

    suspend fun confirmDeleteAccount(email: String, otp: String): AuthResult {
        return when (
            val result = actionResult {
                ApiClient.api.confirmDeleteAccount(
                    DeleteAccountRequest(email = email.trim(), otp = otp.trim()),
                )
            }
        ) {
            is AuthResult.Success -> {
                clearSession()
                result
            }
            is AuthResult.Error -> result
        }
    }

    private suspend fun localFallback(email: String, password: String): AuthResult? {
        val user = DemoUsers.find(email, password) ?: return null
        saveUser(user)
        return AuthResult.Success(user)
    }

    private suspend fun actionResult(call: suspend () -> ApiActionResponse): AuthResult {
        return try {
            val response = call()
            if (response.success) {
                AuthResult.Success(
                    User(
                        id = "action",
                        email = "",
                        firstName = "",
                        lastName = "",
                        role = UserRole.patient,
                    ),
                )
            } else {
                AuthResult.Error(response.error ?: response.message ?: "Request failed.")
            }
        } catch (e: Exception) {
            AuthResult.Error(
                if (isNetworkError(e)) {
                    "Cannot reach server at ${com.healthcare.app.BuildConfig.API_BASE_URL}. Check AWS backend and port 5000."
                } else {
                    e.message ?: "Request failed."
                },
            )
        }
    }

    private suspend fun getStoredUser(): User? {
        val stored = context.dataStore.data.first()[userKey] ?: return null
        return runCatching { json.decodeFromString<UserDto>(stored).toUser() }.getOrNull()
    }

    private suspend fun saveUser(user: User, token: String? = null) {
        if (!token.isNullOrBlank()) {
            AuthTokenHolder.accessToken = token
            context.dataStore.edit { it[tokenKey] = token }
        }
        val dto = UserDto(
            id = user.id,
            email = user.email,
            firstName = user.firstName,
            lastName = user.lastName,
            role = user.role.name,
            dateOfBirth = user.dateOfBirth,
            gender = user.gender,
            bloodType = user.bloodType,
            patientId = user.patientId,
            hospitalId = user.hospitalId,
            specialization = user.specialization,
            isVerified = user.isVerified,
            createdAt = user.createdAt,
            lastLogin = user.lastLogin,
        )
        context.dataStore.edit { it[userKey] = json.encodeToString(dto) }
    }

    private suspend fun clearSession() {
        AuthTokenHolder.accessToken = null
        context.dataStore.edit {
            it.remove(userKey)
            it.remove(tokenKey)
        }
    }

    private suspend fun getStoredToken(): String? =
        context.dataStore.data.first()[tokenKey]

    private fun isNetworkError(e: Exception): Boolean {
        val msg = e.message?.lowercase().orEmpty()
        return msg.contains("failed") || msg.contains("unable to resolve") ||
            msg.contains("timeout") || msg.contains("connection")
    }
}
