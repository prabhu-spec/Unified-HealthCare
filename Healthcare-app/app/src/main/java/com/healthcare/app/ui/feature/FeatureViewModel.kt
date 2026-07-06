package com.healthcare.app.ui.feature

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.healthcare.app.data.FeatureContent
import com.healthcare.app.data.FeatureListItem
import com.healthcare.app.data.PlatformRepository
import com.healthcare.app.data.TelemetrySocketClient
import com.healthcare.app.data.TelemetryVitalsUpdate
import com.healthcare.app.data.User
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class FeatureUiState(
    val loading: Boolean = true,
    val content: FeatureContent? = null,
    val error: String? = null,
    val realtimeConnected: Boolean = false,
    val realtimeMessage: String? = null,
)

class FeatureViewModel(
    private val route: String,
    private val user: User,
    private val repository: PlatformRepository,
) : ViewModel() {
    private val _state = MutableStateFlow(FeatureUiState())
    val state: StateFlow<FeatureUiState> = _state.asStateFlow()
    private var telemetrySocket: TelemetrySocketClient? = null

    init {
        load()
        if (route == "telemetry_live" || route == "telemetry_overview") {
            startTelemetrySocket()
        }
    }

    fun load() {
        viewModelScope.launch {
            _state.value = FeatureUiState(loading = true)
            try {
                val content = repository.loadFeature(route, user)
                _state.value = _state.value.copy(loading = false, content = content, error = null)
            } catch (e: Exception) {
                _state.value = _state.value.copy(
                    loading = false,
                    error = e.message ?: "Could not load data",
                )
            }
        }
    }

    fun acceptQueueItem(itemId: String) = queueAction { repository.acceptQueueItem(user, itemId) }

    fun rejectQueueItem(itemId: String) = queueAction { repository.rejectQueueItem(user, itemId) }

    fun bookAppointment() = queueAction { repository.createAppointment(user) }

    fun requestBlood() = queueAction { repository.submitBloodRequest(user) }

    private fun queueAction(block: suspend () -> Unit) {
        viewModelScope.launch {
            _state.value = _state.value.copy(loading = true)
            runCatching { block() }
                .onFailure { e ->
                    _state.value = _state.value.copy(loading = false, error = e.message)
                }
            load()
        }
    }

    private fun startTelemetrySocket() {
        telemetrySocket = TelemetrySocketClient(
            user = user,
            onConnected = { connected, message ->
                viewModelScope.launch {
                    _state.value = _state.value.copy(
                        realtimeConnected = connected,
                        realtimeMessage = message,
                    )
                }
            },
            onVitals = { update ->
                viewModelScope.launch { applyTelemetryUpdate(update) }
            },
        ).also { it.connect() }
    }

    private fun applyTelemetryUpdate(update: TelemetryVitalsUpdate) {
        val current = _state.value.content ?: return
        val updated = current.items.map { item ->
            if (item.id == update.patientId || item.patientId == update.patientId) {
                item.withVitals(update)
            } else {
                item
            }
        }
        _state.value = _state.value.copy(content = current.copy(items = updated))
    }

    private fun FeatureListItem.withVitals(update: TelemetryVitalsUpdate): FeatureListItem {
        val subtitle = listOfNotNull(
            room?.let { "Room $it" },
            update.heartRate?.let { "HR ${it.roundDisplay()}" },
            update.spo2?.let { "SpO2 ${it.roundDisplay()}%" },
        ).joinToString(" · ").ifBlank { subtitle }
        return copy(
            subtitle = subtitle,
            meta = if (update.alert) "Critical alert" else "Live · ${update.timestamp ?: "now"}",
            heartRate = update.heartRate ?: heartRate,
            spo2 = update.spo2 ?: spo2,
            temperature = update.temperature ?: temperature,
            battery = update.battery ?: battery,
            systolic = update.systolic ?: systolic,
            diastolic = update.diastolic ?: diastolic,
            respiration = update.respiration ?: respiration,
            alert = update.alert,
            room = update.room ?: room,
            fullName = update.fullName ?: fullName,
        )
    }

    private fun Float.roundDisplay(): String =
        if (this % 1f == 0f) toInt().toString() else String.format("%.1f", this)

    override fun onCleared() {
        telemetrySocket?.disconnect()
        super.onCleared()
    }
}

class FeatureViewModelFactory(
    private val route: String,
    private val user: User,
    private val repository: PlatformRepository,
) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(FeatureViewModel::class.java)) {
            return FeatureViewModel(route, user, repository) as T
        }
        throw IllegalArgumentException("Unknown ViewModel: ${modelClass.name}")
    }
}
