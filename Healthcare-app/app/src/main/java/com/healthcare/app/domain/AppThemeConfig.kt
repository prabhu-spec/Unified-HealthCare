package com.healthcare.app.domain

enum class AppAppearance {
    WEB_DASHBOARD,
    MOBILE_FIRST,
}

enum class AppBrightness {
    LIGHT,
    DARK,
}

enum class AppColorPalette {
    NAVY,
    OCEAN,
    PURPLE,
    EMERALD,
    ROSE,
}

data class AppThemeConfig(
    val appearance: AppAppearance = AppAppearance.MOBILE_FIRST,
    val brightness: AppBrightness = AppBrightness.LIGHT,
    val palette: AppColorPalette = AppColorPalette.OCEAN,
) {
    companion object {
        fun default() = AppThemeConfig()
    }
}
