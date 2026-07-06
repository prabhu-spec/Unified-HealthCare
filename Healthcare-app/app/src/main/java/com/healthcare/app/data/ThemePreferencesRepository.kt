package com.healthcare.app.data

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.healthcare.app.domain.AppAppearance
import com.healthcare.app.domain.AppBrightness
import com.healthcare.app.domain.AppColorPalette
import com.healthcare.app.domain.AppThemeConfig
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.themeDataStore: DataStore<Preferences> by preferencesDataStore(name = "app_theme")

class ThemePreferencesRepository(private val context: Context) {
    private val appearanceKey = stringPreferencesKey("appearance")
    private val brightnessKey = stringPreferencesKey("brightness")
    private val paletteKey = stringPreferencesKey("palette")
    private val mobileFirstIntroKey = stringPreferencesKey("mobile_first_intro_v1")

    val configFlow: Flow<AppThemeConfig> = context.themeDataStore.data.map { prefs ->
        AppThemeConfig(
            appearance = prefs[appearanceKey]?.let { runCatching { AppAppearance.valueOf(it) }.getOrNull() }
                ?: AppAppearance.MOBILE_FIRST,
            brightness = prefs[brightnessKey]?.let { runCatching { AppBrightness.valueOf(it) }.getOrNull() }
                ?: AppBrightness.LIGHT,
            palette = prefs[paletteKey]?.let { runCatching { AppColorPalette.valueOf(it) }.getOrNull() }
                ?: AppColorPalette.EMERALD,
        )
    }

    /** One-time switch so existing installs preview the mobile-first layout. */
    suspend fun applyMobileFirstIntroIfNeeded() {
        context.themeDataStore.edit { prefs ->
            if (prefs[mobileFirstIntroKey] != "done") {
                prefs[appearanceKey] = AppAppearance.MOBILE_FIRST.name
                prefs[mobileFirstIntroKey] = "done"
            }
        }
    }

    suspend fun setAppearance(appearance: AppAppearance) {
        context.themeDataStore.edit { it[appearanceKey] = appearance.name }
    }

    suspend fun setBrightness(brightness: AppBrightness) {
        context.themeDataStore.edit { it[brightnessKey] = brightness.name }
    }

    suspend fun setPalette(palette: AppColorPalette) {
        context.themeDataStore.edit { it[paletteKey] = palette.name }
    }

    suspend fun setConfig(config: AppThemeConfig) {
        context.themeDataStore.edit {
            it[appearanceKey] = config.appearance.name
            it[brightnessKey] = config.brightness.name
            it[paletteKey] = config.palette.name
        }
    }
}
