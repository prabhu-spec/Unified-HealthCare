package com.healthcare.app.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.healthcare.app.ui.theme.LocalExtendedColors

@Composable
fun VitalsLineChart(
    label: String,
    unit: String,
    values: List<Float>,
    color: Color,
    minValue: Float,
    maxValue: Float,
    modifier: Modifier = Modifier,
    chartHeight: androidx.compose.ui.unit.Dp = 82.dp,
) {
    val ext = LocalExtendedColors.current
    if (values.isEmpty()) return
    Column(modifier = modifier) {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text(label, color = ext.cardContent, style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.SemiBold)
            Text("${values.last().roundDisplay()} $unit", color = color, style = MaterialTheme.typography.labelLarge)
        }
        Canvas(
            modifier = Modifier
                .fillMaxWidth()
                .height(chartHeight)
                .padding(top = 8.dp),
        ) {
            val axisColor = ext.cardBorder
            val usableWidth = size.width
            val usableHeight = size.height
            repeat(3) { index ->
                val y = usableHeight * (index + 1) / 4f
                drawLine(
                    color = axisColor,
                    start = androidx.compose.ui.geometry.Offset(0f, y),
                    end = androidx.compose.ui.geometry.Offset(usableWidth, y),
                    strokeWidth = 1.dp.toPx(),
                )
            }
            val normalized = values.map {
                ((it.coerceIn(minValue, maxValue) - minValue) / (maxValue - minValue)).coerceIn(0f, 1f)
            }
            val path = Path()
            normalized.forEachIndexed { index, value ->
                val x = if (normalized.size == 1) usableWidth / 2f else index * usableWidth / (normalized.size - 1)
                val y = usableHeight - (value * usableHeight)
                if (index == 0) path.moveTo(x, y) else path.lineTo(x, y)
                drawCircle(color = color, radius = 4.dp.toPx(), center = androidx.compose.ui.geometry.Offset(x, y))
            }
            drawPath(
                path = path,
                color = color,
                style = Stroke(width = 3.dp.toPx(), cap = StrokeCap.Round),
            )
        }
    }
}

@Composable
fun PatientVitalsChartCard(
    heartRateSeries: List<Float>,
    spo2Series: List<Float>,
    modifier: Modifier = Modifier,
    connected: Boolean = false,
) {
    val ext = LocalExtendedColors.current
    ThemedCard(modifier = modifier.fillMaxWidth()) {
        Text("Heart rate & SpO₂", fontWeight = FontWeight.SemiBold, color = ext.cardContent)
        if (heartRateSeries.isEmpty() && spo2Series.isEmpty()) {
            Text("Waiting for live samples…", color = ext.mutedText, modifier = Modifier.padding(top = 6.dp))
        } else {
            VitalsLineChart(
                label = "Heart rate",
                unit = "bpm",
                values = heartRateSeries,
                color = Color(0xFF6BAB54),
                minValue = 50f,
                maxValue = 160f,
                modifier = Modifier.padding(top = 4.dp),
            )
            VitalsLineChart(
                label = "SpO₂",
                unit = "%",
                values = spo2Series,
                color = Color(0xFF0EA5E9),
                minValue = 85f,
                maxValue = 100f,
                modifier = Modifier.padding(top = 10.dp),
                chartHeight = 100.dp,
            )
        }
    }
}

private fun Float.roundDisplay(): String =
    if (this % 1f == 0f) toInt().toString() else String.format("%.1f", this)
