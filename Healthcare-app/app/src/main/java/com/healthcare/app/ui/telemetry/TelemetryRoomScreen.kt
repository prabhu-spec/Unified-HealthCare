package com.healthcare.app.ui.telemetry

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.healthcare.app.data.PlatformRepository
import com.healthcare.app.data.User
import com.healthcare.app.ui.components.AppBackground
import com.healthcare.app.ui.components.LoadingState
import com.healthcare.app.ui.components.PatientVitalsChartCard
import com.healthcare.app.ui.components.ScreenHeader
import com.healthcare.app.ui.components.StatusChip
import com.healthcare.app.ui.components.ThemedCard
import com.healthcare.app.ui.components.VitalsMetricsGrid
import com.healthcare.app.ui.theme.LocalExtendedColors

@Composable
fun TelemetryRoomScreen(
    user: User,
    room: String?,
    patientId: String?,
    onBack: () -> Unit,
    modifier: Modifier = Modifier,
    repository: PlatformRepository = PlatformRepository(),
) {
    val viewModel: TelemetryRoomViewModel = viewModel(
        factory = TelemetryRoomViewModelFactory(user, room, patientId, repository),
        key = "telemetry-room-${user.id}-$room-$patientId",
    )
    val uiState by viewModel.state.collectAsState()
    val ext = LocalExtendedColors.current
    val item = uiState.content?.items?.firstOrNull()

    AppBackground(modifier = modifier) {
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            item {
                TextButton(onClick = onBack) { Text("Back", color = ext.accent) }
                ScreenHeader(
                    title = uiState.content?.title ?: "Patient room",
                    subtitle = "Live vitals + charts from AWS",
                )
            }
            when {
                uiState.loading && uiState.content == null -> item { LoadingState("Loading room vitals...") }
                uiState.error != null && uiState.content == null -> item { Text(uiState.error!!, color = ext.error) }
                uiState.content != null -> {
                    item {
                        ThemedCard(modifier = Modifier.fillMaxWidth()) {
                            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                Text(item?.title ?: "Patient", fontWeight = FontWeight.Bold, color = ext.cardContent)
                                item?.subtitle?.let { Text(it, color = ext.mutedText) }
                                item?.meta?.let { StatusChip(it) }
                                if (item != null) {
                                    VitalsMetricsGrid(item = item)
                                }
                            }
                        }
                    }
                    item {
                        PatientVitalsChartCard(
                            heartRateSeries = uiState.heartRateSeries,
                            spo2Series = uiState.spo2Series,
                            connected = uiState.socketConnected,
                        )
                    }
                }
            }
        }
    }
}
