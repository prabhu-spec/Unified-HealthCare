package com.healthcare.app.ui.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.healthcare.app.data.AuthRepository
import com.healthcare.app.data.AuthResult
import com.healthcare.app.data.User
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class AuthViewModel(private val authRepository: AuthRepository) : ViewModel() {
    val currentUser: StateFlow<User?> = authRepository.currentUser.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5_000),
        initialValue = null,
    )

    var isInitialized = false
        private set

    fun initialize(onReady: () -> Unit) {
        if (isInitialized) {
            onReady()
            return
        }
        viewModelScope.launch {
            authRepository.initialize()
            isInitialized = true
            onReady()
        }
    }

    fun login(email: String, password: String, onResult: (Boolean, String?) -> Unit) {
        viewModelScope.launch {
            when (val result = authRepository.login(email, password)) {
                is AuthResult.Success -> onResult(true, null)
                is AuthResult.Error -> onResult(false, result.message)
            }
        }
    }

    fun logout(onDone: () -> Unit) {
        viewModelScope.launch {
            authRepository.logout()
            onDone()
        }
    }

    fun backendStatus(onResult: (Boolean, String) -> Unit) {
        viewModelScope.launch {
            authRepository.backendStatus()
                .onSuccess { onResult(true, it) }
                .onFailure { onResult(false, it.message ?: "Cannot reach backend.") }
        }
    }

    fun requestForgotPasswordOtp(email: String, onResult: (Boolean, String?) -> Unit) {
        viewModelScope.launch { onResultFrom(authRepository.requestForgotPasswordOtp(email), onResult) }
    }

    fun resetPassword(email: String, otp: String, newPassword: String, onResult: (Boolean, String?) -> Unit) {
        viewModelScope.launch { onResultFrom(authRepository.resetPassword(email, otp, newPassword), onResult) }
    }

    fun requestPasswordChangeOtp(email: String, onResult: (Boolean, String?) -> Unit) {
        viewModelScope.launch { onResultFrom(authRepository.requestPasswordChangeOtp(email), onResult) }
    }

    fun changePassword(email: String, otp: String, newPassword: String, onResult: (Boolean, String?) -> Unit) {
        viewModelScope.launch { onResultFrom(authRepository.changePassword(email, otp, newPassword), onResult) }
    }

    fun forgotEmail(email: String, onResult: (Boolean, String?) -> Unit) {
        viewModelScope.launch { onResultFrom(authRepository.forgotEmail(email), onResult) }
    }

    fun requestDeleteAccountOtp(email: String, onResult: (Boolean, String?) -> Unit) {
        viewModelScope.launch { onResultFrom(authRepository.requestDeleteAccountOtp(email), onResult) }
    }

    fun confirmDeleteAccount(email: String, otp: String, onResult: (Boolean, String?) -> Unit) {
        viewModelScope.launch { onResultFrom(authRepository.confirmDeleteAccount(email, otp), onResult) }
    }

    private fun onResultFrom(result: AuthResult, onResult: (Boolean, String?) -> Unit) {
        when (result) {
            is AuthResult.Success -> onResult(true, null)
            is AuthResult.Error -> onResult(false, result.message)
        }
    }
}
