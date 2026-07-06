package com.healthcare.app.ui.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.healthcare.app.data.FeatureListItem
import com.healthcare.app.ui.theme.LocalExtendedColors

@Composable
fun VitalsMetricsGrid(
    item: FeatureListItem,
    modifier: Modifier = Modifier,
) {
    val ext = LocalExtendedColors.current
    val metrics = listOf(
        Triple("Heart rate", item.heartRate?.let { "${it.toInt()} bpm" } ?: "—", item.heartRate != null && item.heartRate > 130f),
        Triple("SpO₂", item.spo2?.let { "${it.toInt()}%" } ?: "—", item.spo2 != null && item.spo2 < 90f),
        Triple("Temperature", item.temperature?.let { "${"%.1f".format(it)} °C" } ?: "—", item.temperature != null && item.temperature > 39f),
        Triple("Blood pressure", if (item.systolic != null && item.diastolic != null) "${item.systolic.toInt()}/${item.diastolic.toInt()}" else "—", false),
        Triple("Respiration", item.respiration?.let { "${it.toInt()} /min" } ?: "—", false),
        Triple("Battery", item.battery?.let { "${it.toInt()}%" } ?: "—", false),
    )
    Column(modifier = modifier, verticalArrangement = Arrangement.spacedBy(8.dp)) {
        metrics.chunked(2).forEach { row ->
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                row.forEach { (label, value, emphasize) ->
                    VitalsMetricCell(
                        label = label,
                        value = value,
                        emphasize = emphasize || (item.alert && emphasize),
                        modifier = Modifier.weight(1f),
                    )
                }
                if (row.size == 1) {
                    Surface(modifier = Modifier.weight(1f), color = androidx.compose.ui.graphics.Color.Transparent) {}
                }
            }
        }
        if (item.alert) {
            Text("Critical threshold exceeded", color = ext.error, style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.SemiBold)
        }
    }
}

@Composable
private fun VitalsMetricCell(
    label: String,
    value: String,
    emphasize: Boolean,
    modifier: Modifier = Modifier,
) {
    val ext = LocalExtendedColors.current
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(10.dp),
        color = if (emphasize) ext.error.copy(alpha = 0.08f) else Color(0xFFF8FAFC),
        border = androidx.compose.foundation.BorderStroke(
            1.dp,
            if (emphasize) ext.error.copy(alpha = 0.25f) else ext.cardBorder,
        ),
    ) {
        Column(modifier = Modifier.padding(horizontal = 10.dp, vertical = 8.dp)) {
            Text(label, style = MaterialTheme.typography.labelSmall, color = ext.mutedText)
            Text(value, style = MaterialTheme.typography.bodyLarge, color = ext.cardContent, fontWeight = FontWeight.SemiBold)
        }
    }
}
