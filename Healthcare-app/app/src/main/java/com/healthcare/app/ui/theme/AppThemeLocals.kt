package com.healthcare.app.ui.theme

import androidx.compose.runtime.compositionLocalOf
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import com.healthcare.app.domain.AppAppearance
import com.healthcare.app.domain.AppThemeConfig

data class ExtendedThemeColors(
    val gradientBackground: Brush,
    val cardSurface: Color,
    val cardBorder: Color,
    val cardContent: Color,
    val mutedText: Color,
    val accent: Color,
    val accentSoft: Color,
    val success: Color,
    val warning: Color,
    val error: Color,
    val useGlassCards: Boolean,
)

val LocalAppThemeConfig = staticCompositionLocalOf { AppThemeConfig.default() }
val LocalExtendedColors = staticCompositionLocalOf {
    ExtendedThemeColors(
        gradientBackground = Brush.verticalGradient(listOf(Color(0xFFF8FAFC), Color.White)),
        cardSurface = Color.White,
        cardBorder = Color(0xFFE2E8F0),
        cardContent = Color(0xFF0F172A),
        mutedText = Color(0xFF64748B),
        accent = Color(0xFF0EA5E9),
        accentSoft = Color(0xFFE0F2FE),
        success = Color(0xFF22C55E),
        warning = Color(0xFFF59E0B),
        error = Color(0xFFEF4444),
        useGlassCards = false,
    )
}

fun AppAppearance.isWebStyle(): Boolean = this == AppAppearance.WEB_DASHBOARD
