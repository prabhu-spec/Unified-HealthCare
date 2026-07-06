package com.healthcare.app.ui.theme



import androidx.compose.material3.ColorScheme

import androidx.compose.material3.MaterialTheme

import androidx.compose.material3.darkColorScheme

import androidx.compose.material3.lightColorScheme

import androidx.compose.runtime.Composable

import androidx.compose.runtime.CompositionLocalProvider

import androidx.compose.ui.graphics.Brush

import androidx.compose.ui.graphics.Color

import com.healthcare.app.domain.AppAppearance

import com.healthcare.app.domain.AppBrightness

import com.healthcare.app.domain.AppColorPalette

import com.healthcare.app.domain.AppThemeConfig



val AuthTextPrimary = Color(0xFF0F172A)

val AuthTextSecondary = Color(0xFF64748B)



private data class PaletteTokens(

    val primary: Color,

    val secondary: Color,

    val lightBg: Color,

    val lightAccentSoft: Color,

    val lightBorder: Color,

)



private fun paletteTokens(palette: AppColorPalette): PaletteTokens = when (palette) {

    AppColorPalette.NAVY -> PaletteTokens(

        primary = Color(0xFF3B82F6),

        secondary = Color(0xFF60A5FA),

        lightBg = Color(0xFFF8FAFC),

        lightAccentSoft = Color(0xFFEFF6FF),

        lightBorder = Color(0xFFE2E8F0),

    )

    AppColorPalette.OCEAN -> PaletteTokens(

        primary = Color(0xFF0EA5E9),

        secondary = Color(0xFF38BDF8),

        lightBg = Color(0xFFF8FAFC),

        lightAccentSoft = Color(0xFFE0F2FE),

        lightBorder = Color(0xFFE2E8F0),

    )

    AppColorPalette.PURPLE -> PaletteTokens(

        primary = Color(0xFF8B5CF6),

        secondary = Color(0xFFA78BFA),

        lightBg = Color(0xFFFAFAFA),

        lightAccentSoft = Color(0xFFF3E8FF),

        lightBorder = Color(0xFFE9D5FF),

    )

    AppColorPalette.EMERALD -> PaletteTokens(

        primary = Color(0xFF10B981),

        secondary = Color(0xFF34D399),

        lightBg = Color(0xFFF8FAFC),

        lightAccentSoft = Color(0xFFD1FAE5),

        lightBorder = Color(0xFFE2E8F0),

    )

    AppColorPalette.ROSE -> PaletteTokens(

        primary = Color(0xFFF43F5E),

        secondary = Color(0xFFFB7185),

        lightBg = Color(0xFFFAFAFA),

        lightAccentSoft = Color(0xFFFFE4E6),

        lightBorder = Color(0xFFFECDD3),

    )

}



fun resolveColorScheme(config: AppThemeConfig): ColorScheme {

    val tokens = paletteTokens(config.palette)

    val dark = config.brightness == AppBrightness.DARK

    return if (dark) {

        darkColorScheme(

            primary = tokens.primary,

            secondary = tokens.secondary,

            background = Color(0xFF0F172A),

            surface = Color(0xFF1E293B),

            onBackground = Color(0xFFF1F5F9),

            onSurface = Color(0xFFF1F5F9),

            onPrimary = Color.White,

        )

    } else {

        lightColorScheme(

            primary = tokens.primary,

            secondary = tokens.secondary,

            background = tokens.lightBg,

            surface = Color.White,

            surfaceVariant = tokens.lightAccentSoft,

            onBackground = Color(0xFF0F172A),

            onSurface = Color(0xFF0F172A),

            onPrimary = Color.White,

            outline = tokens.lightBorder,

        )

    }

}



fun resolveExtendedColors(config: AppThemeConfig): ExtendedThemeColors {

    val tokens = paletteTokens(config.palette)

    val dark = config.brightness == AppBrightness.DARK



    return if (dark) {

        ExtendedThemeColors(

            gradientBackground = Brush.verticalGradient(listOf(Color(0xFF0F172A), Color(0xFF1E293B))),

            cardSurface = Color(0xFF1E293B),

            cardBorder = Color(0xFF334155),

            cardContent = Color(0xFFF1F5F9),

            mutedText = Color(0xFF94A3B8),

            accent = tokens.primary,

            accentSoft = tokens.lightAccentSoft.copy(alpha = 0.2f),

            success = Color(0xFF4ADE80),

            warning = Color(0xFFFBBF24),

            error = Color(0xFFF87171),

            useGlassCards = false,

        )

    } else {

        ExtendedThemeColors(

            gradientBackground = Brush.verticalGradient(listOf(tokens.lightBg, Color.White)),

            cardSurface = Color.White,

            cardBorder = tokens.lightBorder,

            cardContent = Color(0xFF0F172A),

            mutedText = Color(0xFF64748B),

            accent = tokens.primary,

            accentSoft = tokens.lightAccentSoft,

            success = Color(0xFF22C55E),

            warning = Color(0xFFF59E0B),

            error = Color(0xFFEF4444),

            useGlassCards = false,

        )

    }

}



@Composable

fun HealthcareTheme(

    config: AppThemeConfig = AppThemeConfig.default(),

    content: @Composable () -> Unit,

) {

    val colorScheme = resolveColorScheme(config)

    val extended = resolveExtendedColors(config)



    CompositionLocalProvider(

        LocalAppThemeConfig provides config,

        LocalExtendedColors provides extended,

    ) {

        MaterialTheme(

            colorScheme = colorScheme,

            typography = Typography,

            content = content,

        )

    }

}

