package com.healthcare.app.ui.main

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.List
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import com.healthcare.app.data.NotificationDeepLink
import com.healthcare.app.data.NotificationRepository
import com.healthcare.app.data.PlatformRepository
import com.healthcare.app.data.User
import com.healthcare.app.domain.AppAppearance
import com.healthcare.app.domain.AppBrightness
import com.healthcare.app.domain.AppColorPalette
import com.healthcare.app.domain.AppThemeConfig
import com.healthcare.app.domain.DashboardMenu
import com.healthcare.app.ui.ai.AiAssistScreen
import com.healthcare.app.ui.dashboard.DashboardScreen
import com.healthcare.app.ui.feature.FeatureScreen
import com.healthcare.app.ui.pharmacy.PharmacyScreen
import com.healthcare.app.ui.profile.ProfileScreen
import com.healthcare.app.ui.theme.LocalExtendedColors
import com.healthcare.app.ui.notifications.NotificationsScreen
import com.healthcare.app.ui.telemetry.TelemetryRoomScreen
import com.healthcare.app.ui.platform.PlatformTestingScreen
import com.healthcare.app.ui.video.VideoConsultScreen

@Composable
fun MainShellScreen(
    user: User,
    platformRepository: PlatformRepository,
    notificationRepository: NotificationRepository,
    themeConfig: AppThemeConfig,
    pendingDeepLink: NotificationDeepLink? = null,
    onDeepLinkConsumed: () -> Unit = {},
    onAppearanceChange: (AppAppearance) -> Unit,
    onBrightnessChange: (AppBrightness) -> Unit,
    onPaletteChange: (AppColorPalette) -> Unit,
    onLogout: () -> Unit,
    onBackendStatus: (onResult: (Boolean, String) -> Unit) -> Unit,
    onRequestPasswordChangeOtp: (email: String, onResult: (Boolean, String?) -> Unit) -> Unit,
    onChangePassword: (email: String, otp: String, newPassword: String, onResult: (Boolean, String?) -> Unit) -> Unit,
    onRequestDeleteAccountOtp: (email: String, onResult: (Boolean, String?) -> Unit) -> Unit,
    onConfirmDeleteAccount: (email: String, otp: String, onResult: (Boolean, String?) -> Unit) -> Unit,
) {
    var tab by rememberSaveable { mutableIntStateOf(0) }
    var featureRoute by rememberSaveable { mutableStateOf<String?>(null) }
    var telemetryRoom by rememberSaveable { mutableStateOf<String?>(null) }
    var telemetryPatientId by rememberSaveable { mutableStateOf<String?>(null) }
    var aiAssistPatientId by rememberSaveable { mutableStateOf<String?>(null) }
    val featureRouteStack = remember { mutableListOf<String>() }

    val closeFeature = {
        featureRoute = null
        telemetryRoom = null
        telemetryPatientId = null
        aiAssistPatientId = null
        featureRouteStack.clear()
    }

    fun navigateToFeature(route: String) {
        val current = featureRoute
        if (current != null && current != route) {
            featureRouteStack.add(current)
        }
        telemetryRoom = null
        telemetryPatientId = null
        if (route != "ai_assist") {
            aiAssistPatientId = null
        }
        featureRoute = route
    }

    fun openAiAssist(patientId: String? = null) {
        aiAssistPatientId = patientId
        navigateToFeature("ai_assist")
    }

    fun goBackFromFeature() {
        if (telemetryRoom != null) {
            telemetryRoom = null
            telemetryPatientId = null
            return
        }
        if (featureRoute == "ai_assist") {
            aiAssistPatientId = null
        }
        if (featureRouteStack.isNotEmpty()) {
            featureRoute = featureRouteStack.removeAt(featureRouteStack.lastIndex)
        } else {
            closeFeature()
        }
    }

    fun openDeepLink(link: NotificationDeepLink) {
        when (link.route) {
            "telemetry_room" -> {
                navigateToFeature("telemetry_room")
                telemetryRoom = link.room
                telemetryPatientId = link.patientId
            }
            "notifications" -> navigateToFeature("notifications")
            else -> navigateToFeature(link.route)
        }
    }

    LaunchedEffect(pendingDeepLink) {
        pendingDeepLink?.let {
            openDeepLink(it)
            onDeepLinkConsumed()
        }
    }

    BackHandler(enabled = featureRoute != null) {
        goBackFromFeature()
    }

    if (featureRoute != null) {
        if (featureRoute == "platform_testing") {
            PlatformTestingScreen(
                user = user,
                repository = platformRepository,
                onBack = { goBackFromFeature() },
            )
            return
        }
        if (featureRoute == "notifications") {
            NotificationsScreen(
                user = user,
                onBack = { goBackFromFeature() },
                onOpenDeepLink = { link ->
                    closeFeature()
                    openDeepLink(link)
                },
                repository = notificationRepository,
            )
            return
        }
        if (featureRoute == "telemetry_room") {
            TelemetryRoomScreen(
                user = user,
                room = telemetryRoom,
                patientId = telemetryPatientId,
                onBack = { goBackFromFeature() },
                repository = platformRepository,
            )
            return
        }
        if (featureRoute == "video_meet") {
            VideoConsultScreen(
                user = user,
                onBack = { goBackFromFeature() },
            )
            return
        }
        if (featureRoute == "ai_assist") {
            AiAssistScreen(
                user = user,
                patientId = aiAssistPatientId,
                onBack = { goBackFromFeature() },
            )
            return
        }
        if (featureRoute in pharmacyRoutes) {
            PharmacyScreen(
                route = featureRoute!!,
                user = user,
                onBack = { goBackFromFeature() },
            )
            return
        }
        FeatureScreen(
            route = featureRoute!!,
            user = user,
            platformRepository = platformRepository,
            onBack = { goBackFromFeature() },
            backLabel = featureRouteStack.lastOrNull()?.let { DashboardMenu.labelForRoute(it) },
            onOpenAiAssist = { patientId -> openAiAssist(patientId) },
        )
        return
    }

    Scaffold(
        containerColor = Color.Transparent,
        bottomBar = {
            val ext = LocalExtendedColors.current
            NavigationBar(
                containerColor = ext.cardSurface,
                contentColor = ext.cardContent,
            ) {
                NavigationBarItem(
                    selected = tab == 0,
                    onClick = { tab = 0 },
                    icon = { Icon(Icons.Default.Home, contentDescription = "Home") },
                    label = { Text("Home") },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = ext.accent,
                        selectedTextColor = ext.accent,
                        indicatorColor = ext.accentSoft,
                        unselectedIconColor = ext.mutedText,
                        unselectedTextColor = ext.mutedText,
                    ),
                )
                NavigationBarItem(
                    selected = tab == 1,
                    onClick = { tab = 1 },
                    icon = { Icon(Icons.AutoMirrored.Filled.List, contentDescription = "Menu") },
                    label = { Text("Menu") },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = ext.accent,
                        selectedTextColor = ext.accent,
                        indicatorColor = ext.accentSoft,
                        unselectedIconColor = ext.mutedText,
                        unselectedTextColor = ext.mutedText,
                    ),
                )
                NavigationBarItem(
                    selected = tab == 2,
                    onClick = { tab = 2 },
                    icon = { Icon(Icons.Default.Person, contentDescription = "Profile") },
                    label = { Text("Profile") },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = ext.accent,
                        selectedTextColor = ext.accent,
                        indicatorColor = ext.accentSoft,
                        unselectedIconColor = ext.mutedText,
                        unselectedTextColor = ext.mutedText,
                    ),
                )
            }
        },
    ) { padding ->
        when (tab) {
            0 -> DashboardScreen(
                user = user,
                onNavigate = { navigateToFeature(it) },
                onOpenNotifications = { navigateToFeature("notifications") },
                modifier = Modifier.padding(padding),
            )
            1 -> MenuScreen(
                user = user,
                modifier = Modifier.padding(padding),
                onNavigate = { navigateToFeature(it) },
            )
            2 -> ProfileScreen(
                user = user,
                themeConfig = themeConfig,
                onOpenNotifications = { navigateToFeature("notifications") },
                onAppearanceChange = onAppearanceChange,
                onBrightnessChange = onBrightnessChange,
                onPaletteChange = onPaletteChange,
                onLogout = onLogout,
                onBackendStatus = onBackendStatus,
                onRequestPasswordChangeOtp = onRequestPasswordChangeOtp,
                onChangePassword = onChangePassword,
                onRequestDeleteAccountOtp = onRequestDeleteAccountOtp,
                onConfirmDeleteAccount = onConfirmDeleteAccount,
                modifier = Modifier.padding(padding),
            )
        }
    }
}

private val pharmacyRoutes = setOf(
    "medicines",
    "medicine_orders",
    "prescription_orders",
    "prescribe",
    "inventory",
    "pharmacy_stock",
    "hospital_pharmacy",
    "restock",
    "prescription_verify",
    "prescription_upload",
)
