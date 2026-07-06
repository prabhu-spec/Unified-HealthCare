package com.healthcare.app.ui

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.compose.ui.platform.LocalContext
import com.healthcare.app.HealthcareApp
import com.healthcare.app.data.AuthRepository
import com.healthcare.app.data.NotificationDeepLink
import com.healthcare.app.domain.AppThemeConfig
import com.healthcare.app.ui.auth.AuthViewModel
import com.healthcare.app.ui.auth.AuthViewModelFactory
import com.healthcare.app.ui.auth.LoginScreen
import com.healthcare.app.ui.main.MainShellScreen
import com.healthcare.app.ui.theme.HealthcareTheme
import kotlinx.coroutines.launch

@Composable
fun HealthcareNavHost(
    authRepository: AuthRepository,
    pendingDeepLink: NotificationDeepLink? = null,
    onDeepLinkConsumed: () -> Unit = {},
) {
    val authViewModel: AuthViewModel = viewModel(
        factory = AuthViewModelFactory(authRepository),
    )
    val user by authViewModel.currentUser.collectAsState()
    var ready by remember { mutableStateOf(false) }
    val app = LocalContext.current.applicationContext as HealthcareApp
    val themeConfig by app.themePreferences.configFlow.collectAsState(initial = AppThemeConfig.default())
    val scope = rememberCoroutineScope()

    LaunchedEffect(Unit) {
        authViewModel.initialize { ready = true }
        app.themePreferences.applyMobileFirstIntroIfNeeded()
    }

    LaunchedEffect(user?.id) {
        if (user != null) {
            app.startNotificationMonitor(user!!)
        } else {
            app.stopNotificationMonitor()
        }
    }

    HealthcareTheme(config = themeConfig) {
        when {
            !ready -> LoadingBox()
            user == null -> LoginScreen(
                onLoginSuccess = { },
                onLogin = authViewModel::login,
                onForgotPasswordOtp = authViewModel::requestForgotPasswordOtp,
                onResetPassword = authViewModel::resetPassword,
                onForgotEmail = authViewModel::forgotEmail,
            )
            else -> {
                MainShellScreen(
                    user = user!!,
                    platformRepository = app.platformRepository,
                    notificationRepository = app.notificationRepository,
                    themeConfig = themeConfig,
                    pendingDeepLink = pendingDeepLink,
                    onDeepLinkConsumed = onDeepLinkConsumed,
                    onAppearanceChange = { scope.launch { app.themePreferences.setAppearance(it) } },
                    onBrightnessChange = { scope.launch { app.themePreferences.setBrightness(it) } },
                    onPaletteChange = { scope.launch { app.themePreferences.setPalette(it) } },
                    onLogout = { authViewModel.logout { } },
                    onBackendStatus = authViewModel::backendStatus,
                    onRequestPasswordChangeOtp = authViewModel::requestPasswordChangeOtp,
                    onChangePassword = authViewModel::changePassword,
                    onRequestDeleteAccountOtp = authViewModel::requestDeleteAccountOtp,
                    onConfirmDeleteAccount = authViewModel::confirmDeleteAccount,
                )
            }
        }
    }
}

@Composable
private fun LoadingBox() {
    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        CircularProgressIndicator()
    }
}
