package com.healthcare.app.ui.feature

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.healthcare.app.data.DataSource
import com.healthcare.app.data.FeatureListItem
import com.healthcare.app.data.PlatformRepository
import com.healthcare.app.data.User
import com.healthcare.app.domain.canUseAiAssist
import com.healthcare.app.ui.components.AppBackground
import com.healthcare.app.ui.components.LoadingState
import com.healthcare.app.ui.components.StatusChip
import com.healthcare.app.ui.components.ThemedCard
import com.healthcare.app.ui.components.VitalsLineChart
import com.healthcare.app.ui.components.VitalsMetricsGrid
import com.healthcare.app.ui.theme.LocalExtendedColors

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FeatureScreen(
    route: String,
    user: User,
    platformRepository: PlatformRepository,
    onBack: () -> Unit,
    backLabel: String? = null,
    onOpenAiAssist: ((patientId: String) -> Unit)? = null,
) {
    val viewModel: FeatureViewModel = viewModel(
        factory = FeatureViewModelFactory(route, user, platformRepository),
        key = "feature-$route-${user.id}",
    )
    val uiState by viewModel.state.collectAsState()
    val ext = LocalExtendedColors.current

    AppBackground(modifier = Modifier.fillMaxSize()) {
        Scaffold(
            containerColor = Color.Transparent,
            topBar = {
                TopAppBar(
                    title = {
                        Column {
                            Text(
                                uiState.content?.title ?: route.replace('_', ' '),
                                color = ext.cardContent,
                            )
                            if (backLabel != null) {
                                Spacer(Modifier.height(2.dp))
                                Text(
                                    "Back to $backLabel",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = ext.mutedText,
                                )
                            }
                        }
                    },
                    navigationIcon = {
                        IconButton(onClick = onBack) {
                            Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = ext.cardContent)
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.Transparent),
                )
            },
        ) { padding ->
            when {
                uiState.loading -> Box(
                    Modifier.fillMaxSize().padding(padding),
                    contentAlignment = Alignment.Center,
                ) {
                    LoadingState()
                }
                uiState.error != null -> Box(
                    Modifier.fillMaxSize().padding(padding).padding(16.dp),
                    contentAlignment = Alignment.Center,
                ) {
                    Text(uiState.error!!, color = ext.error)
                }
                uiState.content != null -> FeatureContentBody(
                    content = uiState.content!!,
                    route = route,
                    user = user,
                    realtimeConnected = uiState.realtimeConnected,
                    realtimeMessage = uiState.realtimeMessage,
                    onAcceptQueue = viewModel::acceptQueueItem,
                    onRejectQueue = viewModel::rejectQueueItem,
                    onBookAppointment = viewModel::bookAppointment,
                    onRequestBlood = viewModel::requestBlood,
                    onOpenAiAssist = onOpenAiAssist,
                    modifier = Modifier.padding(padding),
                )
            }
        }
    }
}

@Composable
private fun FeatureContentBody(
    content: com.healthcare.app.data.FeatureContent,
    route: String,
    user: User,
    realtimeConnected: Boolean,
    realtimeMessage: String?,
    onAcceptQueue: (String) -> Unit,
    onRejectQueue: (String) -> Unit,
    onBookAppointment: () -> Unit,
    onRequestBlood: () -> Unit,
    onOpenAiAssist: ((patientId: String) -> Unit)? = null,
    modifier: Modifier = Modifier,
) {
    val ext = LocalExtendedColors.current
    val showAiOnPatients = route in setOf("patients", "hospital_patients") &&
        canUseAiAssist(user.role) &&
        onOpenAiAssist != null

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        if (route in setOf("queue", "appointments", "request_blood")) {
            item {
                when (route) {
                    "appointments" -> if (user.role.name == "patient") {
                        ThemedCard(modifier = Modifier.fillMaxWidth()) {
                            Button(onClick = onBookAppointment) { Text("Book appointment") }
                        }
                    }
                    "request_blood" -> {
                        ThemedCard(modifier = Modifier.fillMaxWidth()) {
                            Button(onClick = onRequestBlood) { Text("Submit blood request") }
                        }
                    }
                }
            }
        }
        if (content.route == "telemetry_live" || content.route == "telemetry_overview") {
            item {
                LiveTelemetryChartCard(items = content.items)
            }
        }
        if (content.items.isEmpty()) {
            item {
                ThemedCard(modifier = Modifier.fillMaxWidth()) {
                    Text("No records yet", fontWeight = FontWeight.SemiBold, color = ext.cardContent)
                    Text(
                        "This feature is available in the app. New records will appear here when the backend returns data.",
                        color = ext.mutedText,
                        modifier = Modifier.padding(top = 4.dp),
                    )
                }
            }
        } else {
            items(content.items, key = { it.id }) { item ->
                FeatureItemCard(
                    item = item,
                    showQueueActions = route == "queue" && item.meta?.contains("Pending", true) == true,
                    showAiSummary = showAiOnPatients,
                    onAccept = { onAcceptQueue(item.id) },
                    onReject = { onRejectQueue(item.id) },
                    onAiSummary = { onOpenAiAssist?.invoke(item.id) },
                )
            }
        }
        item { Box(Modifier.padding(bottom = 24.dp)) }
    }
}

@Composable
private fun LiveTelemetryChartCard(items: List<FeatureListItem>) {
    val ext = LocalExtendedColors.current
    val vitalItems = items.filter { it.heartRate != null || it.spo2 != null || it.temperature != null }
    ThemedCard(modifier = Modifier.fillMaxWidth()) {
        Text("Vitals", fontWeight = FontWeight.SemiBold, color = ext.cardContent)
        if (vitalItems.isEmpty()) {
            Text("No data yet", color = ext.mutedText, modifier = Modifier.padding(top = 8.dp))
            return@ThemedCard
        }
        VitalsLineChart(
            label = "Heart rate",
            unit = "bpm",
            values = vitalItems.mapNotNull { it.heartRate },
            color = Color(0xFFF87171),
            minValue = 50f,
            maxValue = 160f,
            modifier = Modifier.padding(top = 10.dp),
        )
        VitalsLineChart(
            label = "SpO2",
            unit = "%",
            values = vitalItems.mapNotNull { it.spo2 },
            color = Color(0xFF60A5FA),
            minValue = 80f,
            maxValue = 100f,
            modifier = Modifier.padding(top = 10.dp),
        )
        VitalsLineChart(
            label = "Temperature",
            unit = "°C",
            values = vitalItems.mapNotNull { it.temperature },
            color = Color(0xFFFBBF24),
            minValue = 35f,
            maxValue = 41f,
            modifier = Modifier.padding(top = 10.dp),
        )
    }
}

@Composable
private fun FeatureItemCard(
    item: FeatureListItem,
    showQueueActions: Boolean = false,
    showAiSummary: Boolean = false,
    onAccept: () -> Unit = {},
    onReject: () -> Unit = {},
    onAiSummary: () -> Unit = {},
) {
    val ext = LocalExtendedColors.current
    ThemedCard(modifier = Modifier.fillMaxWidth()) {
        Text(item.title, fontWeight = FontWeight.SemiBold, color = ext.cardContent)
        item.subtitle?.let {
            Text(it, color = ext.mutedText, modifier = Modifier.padding(top = 4.dp))
        }
        item.meta?.let {
            StatusChip(status = it, modifier = Modifier.padding(top = 8.dp))
        }
        if (item.heartRate != null || item.spo2 != null || item.temperature != null) {
            VitalsMetricsGrid(item = item, modifier = Modifier.padding(top = 10.dp))
        }
        if (showQueueActions) {
            Row(modifier = Modifier.padding(top = 8.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Button(onClick = onAccept) { Text("Accept") }
                OutlinedButton(onClick = onReject) { Text("Reject") }
            }
        }
        if (showAiSummary) {
            OutlinedButton(
                onClick = onAiSummary,
                modifier = Modifier.padding(top = 8.dp),
            ) {
                Text("AI Summary")
            }
        }
    }
}
