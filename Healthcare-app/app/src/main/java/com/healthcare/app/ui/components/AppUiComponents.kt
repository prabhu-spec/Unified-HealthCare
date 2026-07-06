package com.healthcare.app.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.healthcare.app.ui.theme.LocalExtendedColors

@Composable
fun AppBackground(
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit,
) {
    val ext = LocalExtendedColors.current
    Box(
        modifier = modifier
            .fillMaxSize()
            .background(ext.gradientBackground),
    ) {
        content()
    }
}

@Composable
fun ThemedCard(
    modifier: Modifier = Modifier,
    content: @Composable ColumnScope.() -> Unit,
) {
    val ext = LocalExtendedColors.current
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(12.dp),
        color = ext.cardSurface,
        border = BorderStroke(1.dp, ext.cardBorder),
        shadowElevation = 1.dp,
        contentColor = ext.cardContent,
    ) {
        Column(modifier = Modifier.padding(14.dp), content = content)
    }
}

@Composable
fun ScreenHeader(
    title: String,
    subtitle: String? = null,
    modifier: Modifier = Modifier,
) {
    val ext = LocalExtendedColors.current
    Column(modifier = modifier.fillMaxWidth()) {
        Text(
            title,
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.SemiBold,
            color = ext.cardContent,
        )
        if (!subtitle.isNullOrBlank()) {
            Text(
                subtitle,
                style = MaterialTheme.typography.bodyMedium,
                color = ext.mutedText,
                modifier = Modifier.padding(top = 4.dp),
            )
        }
    }
}

@Composable
fun StatusChip(
    status: String,
    modifier: Modifier = Modifier,
) {
    val ext = LocalExtendedColors.current
    val isAlert = status.contains("critical", ignoreCase = true) || status.contains("pending", ignoreCase = true)
    val bg = when {
        isAlert -> ext.error.copy(alpha = 0.1f)
        status.contains("stable", ignoreCase = true) || status.contains("live", ignoreCase = true) ->
            ext.success.copy(alpha = 0.1f)
        else -> ext.accentSoft
    }
    val fg = when {
        isAlert -> ext.error
        status.contains("stable", ignoreCase = true) || status.contains("live", ignoreCase = true) -> ext.success
        else -> ext.accent
    }
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(6.dp),
        color = bg,
    ) {
        Text(
            status,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
            style = MaterialTheme.typography.labelMedium,
            fontWeight = FontWeight.Medium,
            color = fg,
        )
    }
}

@Composable
fun LoadingState(message: String = "Loading…") {
    val ext = LocalExtendedColors.current
    Column(
        modifier = Modifier.fillMaxWidth().padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        CircularProgressIndicator(color = ext.accent, strokeWidth = 2.dp)
        Text(message, color = ext.mutedText, style = MaterialTheme.typography.bodyMedium)
    }
}

@Composable
fun EmptyState(message: String, modifier: Modifier = Modifier) {
    val ext = LocalExtendedColors.current
    Text(
        message,
        modifier = modifier.padding(16.dp),
        color = ext.mutedText,
        style = MaterialTheme.typography.bodyMedium,
    )
}
