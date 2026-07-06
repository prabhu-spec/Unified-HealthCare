package com.healthcare.app.ui.telemetry

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.healthcare.app.data.FeatureContent
import com.healthcare.app.data.FeatureListItem
import com.healthcare.app.data.PlatformRepository
import com.healthcare.app.data.TelemetrySocketClient
import com.healthcare.app.data.TelemetryVitalsUpdate
import com.healthcare.app.data.User
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class TelemetryRoomUiState(
    val loading: Boolean = true,
    val content: FeatureContent? = null,
    val error: String? = null,
    val socketConnected: Boolean = false,
    val heartRateSeries: List<Float> = emptyList(),
    val spo2Series: List<Float> = emptyList(),
)

class TelemetryRoomViewModel(
    private val user: User,
    private val room: String?,
    private val patientId: String?,
    private val repository: PlatformRepository,
) : ViewModel() {
    private val _state = MutableStateFlow(TelemetryRoomUiState())
    val state: StateFlow<TelemetryRoomUiState> = _state.asStateFlow()

    private var socket: TelemetrySocketClient? = null
    private val targetPatientId = patientId

    init {
        startPolling()
        startSocket()
    }

    private fun startPolling() {
        viewModelScope.launch {
            while (true) {
                _state.update { it.copy(loading = it.content == null, error = null) }
                runCatching {
                    repository.fetchTelemetryRoom(user, room, patientId)
                }.onSuccess { fetched ->
                    _state.update { current ->
                        current.copy(
                            loading = false,
                            content = fetched,
                            error = null,
                        )
                    }
                    seedChartFromItem(fetched?.items?.firstOrNull())
                }.onFailure { err ->
                    _state.update {
                        it.copy(
                            loading = false,
                            error = err.message ?: "Could not load room",
                        )
                    }
                }
                delay(5_000)
            }
        }
    }

    private fun startSocket() {
        socket?.disconnect()
        socket = TelemetrySocketClient(
            user = user,
            onConnected = { connected, _ ->
                _state.update { it.copy(socketConnected = connected) }
            },
            onVitals = { update -> applyVitalsUpdate(update) },
        ).also { it.connect() }
    }

    private fun applyVitalsUpdate(update: TelemetryVitalsUpdate) {
        val resolvedId = targetPatientId
            ?: _state.value.content?.items?.firstOrNull()?.patientId
        if (resolvedId != null && update.patientId != resolvedId) return

        _state.update { current ->
            val item = current.content?.items?.firstOrNull()
            val updatedItem = item?.let { mergeVitals(it, update) }
            val hr = update.heartRate?.let { current.heartRateSeries + it } ?: current.heartRateSeries
            val spo2 = update.spo2?.let { current.spo2Series + it } ?: current.spo2Series
            current.copy(
                heartRateSeries = hr.takeLast(MAX_SAMPLES),
                spo2Series = spo2.takeLast(MAX_SAMPLES),
                content = if (updatedItem != null && current.content != null) {
                    current.content.copy(items = listOf(updatedItem))
                } else {
                    current.content
                },
            )
        }
    }

    private fun seedChartFromItem(item: FeatureListItem?) {
        if (item == null) return
        _state.update { current ->
            if (current.heartRateSeries.isNotEmpty() || current.spo2Series.isNotEmpty()) return@update current
            current.copy(
                heartRateSeries = listOfNotNull(item.heartRate),
                spo2Series = listOfNotNull(item.spo2),
            )
        }
    }

    private fun mergeVitals(item: FeatureListItem, update: TelemetryVitalsUpdate): FeatureListItem =
        item.copy(
            meta = if (update.alert) "Critical alert" else "Live · ${update.timestamp ?: "now"}",
            heartRate = update.heartRate ?: item.heartRate,
            spo2 = update.spo2 ?: item.spo2,
            temperature = update.temperature ?: item.temperature,
            battery = update.battery ?: item.battery,
            systolic = update.systolic ?: item.systolic,
            diastolic = update.diastolic ?: item.diastolic,
            respiration = update.respiration ?: item.respiration,
            alert = update.alert,
            room = update.room ?: item.room,
            fullName = update.fullName ?: item.fullName,
        )

    override fun onCleared() {
        socket?.disconnect()
        super.onCleared()
    }

    companion object {
        private const val MAX_SAMPLES = 90
    }
}

class TelemetryRoomViewModelFactory(
    private val user: User,
    private val room: String?,
    private val patientId: String?,
    private val repository: PlatformRepository,
) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        return TelemetryRoomViewModel(user, room, patientId, repository) as T
    }
}
