package com.healthcare.app.ui.profile

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.healthcare.app.domain.AppAppearance
import com.healthcare.app.domain.AppBrightness
import com.healthcare.app.domain.AppColorPalette
import com.healthcare.app.domain.AppThemeConfig
import com.healthcare.app.ui.components.ThemedCard
import com.healthcare.app.ui.theme.LocalExtendedColors

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun ThemeSettingsSection(
    config: AppThemeConfig,
    onAppearanceChange: (AppAppearance) -> Unit,
    onBrightnessChange: (AppBrightness) -> Unit,
    onPaletteChange: (AppColorPalette) -> Unit,
    modifier: Modifier = Modifier,
) {
    val ext = LocalExtendedColors.current
    val chipColors = FilterChipDefaults.filterChipColors(
        selectedContainerColor = ext.accentSoft,
        selectedLabelColor = ext.accent,
        containerColor = ext.cardSurface,
        labelColor = ext.cardContent,
    )
    ThemedCard(modifier = modifier.fillMaxWidth()) {
        Text("Appearance", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
        Text(
            "Compare web-style glass dashboard vs mobile-first layout. Colors can be changed later.",
            color = ext.mutedText,
            style = MaterialTheme.typography.bodySmall,
            modifier = Modifier.padding(top = 6.dp, bottom = 10.dp),
        )

        Text("Layout style", style = MaterialTheme.typography.labelLarge, color = ext.mutedText)
        FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.padding(top = 6.dp, bottom = 12.dp)) {
            FilterChip(
                selected = config.appearance == AppAppearance.WEB_DASHBOARD,
                onClick = { onAppearanceChange(AppAppearance.WEB_DASHBOARD) },
                label = { Text("Web dashboard") },
                colors = chipColors,
            )
            FilterChip(
                selected = config.appearance == AppAppearance.MOBILE_FIRST,
                onClick = { onAppearanceChange(AppAppearance.MOBILE_FIRST) },
                label = { Text("Mobile first") },
                colors = chipColors,
            )
        }

        Text("Brightness", style = MaterialTheme.typography.labelLarge, color = ext.mutedText)
        FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.padding(top = 6.dp, bottom = 12.dp)) {
            FilterChip(
                selected = config.brightness == AppBrightness.LIGHT,
                onClick = { onBrightnessChange(AppBrightness.LIGHT) },
                label = { Text("Light") },
                colors = chipColors,
            )
            FilterChip(
                selected = config.brightness == AppBrightness.DARK,
                onClick = { onBrightnessChange(AppBrightness.DARK) },
                label = { Text("Dark") },
                colors = chipColors,
            )
        }

        Text("Color theme", style = MaterialTheme.typography.labelLarge, color = ext.mutedText)
        FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.padding(top = 6.dp)) {
            AppColorPalette.entries.forEach { palette ->
                FilterChip(
                    selected = config.palette == palette,
                    onClick = { onPaletteChange(palette) },
                    label = { Text(paletteLabel(palette)) },
                    colors = chipColors,
                )
            }
        }
    }
}

private fun paletteLabel(palette: AppColorPalette): String = when (palette) {
    AppColorPalette.NAVY -> "Navy"
    AppColorPalette.OCEAN -> "Ocean"
    AppColorPalette.PURPLE -> "Purple"
    AppColorPalette.EMERALD -> "Emerald"
    AppColorPalette.ROSE -> "Rose"
}
