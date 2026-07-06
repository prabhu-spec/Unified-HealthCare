package com.healthcare.app.ui.ai

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.healthcare.app.data.AiChatMessage
import com.healthcare.app.data.AiRepository
import com.healthcare.app.data.AiStatus
import com.healthcare.app.data.AiSummaryResult
import com.healthcare.app.data.User
import com.healthcare.app.domain.canAcceptAiDraft
import com.healthcare.app.domain.canUseAiAssist
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class AiAssistUiState(
    val allowed: Boolean = true,
    val status: AiStatus? = null,
    val patientId: String? = null,
    val patientLabel: String = "",
    val summary: AiSummaryResult? = null,
    val draftText: String = "",
    val appendToNotes: Boolean = true,
    val messages: List<AiChatMessage> = emptyList(),
    val chatInput: String = "",
    val loadingStatus: Boolean = true,
    val loadingSummary: Boolean = false,
    val loadingChat: Boolean = false,
    val savingDraft: Boolean = false,
    val saveSuccess: String? = null,
    val error: String? = null,
    val canAcceptDraft: Boolean = false,
)

class AiAssistViewModel(
    private val user: User,
    initialPatientId: String?,
    private val repository: AiRepository,
) : ViewModel() {
    private val _state = MutableStateFlow(
        AiAssistUiState(
            allowed = canUseAiAssist(user.role),
            patientId = initialPatientId?.trim()?.ifBlank { null },
            canAcceptDraft = canAcceptAiDraft(user.role),
        ),
    )
    val state: StateFlow<AiAssistUiState> = _state.asStateFlow()

    init {
        if (canUseAiAssist(user.role)) {
            loadStatus()
            val pid = initialPatientId?.trim()?.ifBlank { null }
            if (pid != null) {
                loadPatient(pid)
                runSummary(pid)
            }
        } else {
            _state.update { it.copy(loadingStatus = false, allowed = false) }
        }
    }

    fun loadStatus() {
        viewModelScope.launch {
            _state.update { it.copy(loadingStatus = true, error = null) }
            runCatching { repository.fetchStatus(user) }
                .onSuccess { status ->
                    _state.update { it.copy(status = status, loadingStatus = false) }
                }
                .onFailure { err ->
                    _state.update {
                        it.copy(
                            loadingStatus = false,
                            error = friendlyNetworkError(err.message),
                        )
                    }
                }
        }
    }

    fun loadPatient(patientId: String) {
        viewModelScope.launch {
            _state.update { it.copy(patientId = patientId, patientLabel = "Loading…") }
            val label = repository.fetchPatientLabel(user, patientId)
            _state.update { it.copy(patientLabel = label) }
        }
    }

    fun runSummary() {
        val patientId = _state.value.patientId ?: return
        runSummary(patientId)
    }

    private fun runSummary(patientId: String) {
        viewModelScope.launch {
            _state.update { it.copy(loadingSummary = true, error = null, saveSuccess = null) }
            runCatching { repository.summarizePatient(user, patientId) }
                .onSuccess { result ->
                    _state.update {
                        it.copy(
                            summary = result,
                            draftText = result.summary,
                            loadingSummary = false,
                        )
                    }
                }
                .onFailure { err ->
                    _state.update {
                        it.copy(
                            loadingSummary = false,
                            error = err.message ?: "Summary failed.",
                        )
                    }
                }
        }
    }

    fun updateDraftText(text: String) {
        _state.update { it.copy(draftText = text, saveSuccess = null) }
    }

    fun setAppendToNotes(append: Boolean) {
        _state.update { it.copy(appendToNotes = append) }
    }

    fun updateChatInput(text: String) {
        _state.update { it.copy(chatInput = text) }
    }

    fun sendChat() {
        val text = _state.value.chatInput.trim()
        if (text.isBlank() || _state.value.loadingChat) return

        viewModelScope.launch {
            _state.update {
                it.copy(
                    messages = it.messages + AiChatMessage("user", text),
                    chatInput = "",
                    loadingChat = true,
                    error = null,
                )
            }
            runCatching { repository.chat(user, text, _state.value.patientId) }
                .onSuccess { result ->
                    _state.update {
                        it.copy(
                            messages = it.messages + AiChatMessage("assistant", result.reply),
                            loadingChat = false,
                            draftText = if (it.canAcceptDraft && result.reply.isNotBlank()) {
                                result.reply
                            } else {
                                it.draftText
                            },
                        )
                    }
                }
                .onFailure { err ->
                    _state.update {
                        it.copy(
                            loadingChat = false,
                            error = err.message ?: "Chat failed.",
                        )
                    }
                }
        }
    }

    fun acceptDraft(source: String = "summary") {
        val patientId = _state.value.patientId ?: return
        val draft = _state.value.draftText.trim()
        if (draft.isBlank()) return

        viewModelScope.launch {
            _state.update { it.copy(savingDraft = true, error = null, saveSuccess = null) }
            runCatching {
                repository.acceptDraft(
                    user = user,
                    patientId = patientId,
                    draft = draft,
                    source = source,
                    append = _state.value.appendToNotes,
                )
            }
                .onSuccess { message ->
                    _state.update { it.copy(savingDraft = false, saveSuccess = message) }
                }
                .onFailure { err ->
                    _state.update {
                        it.copy(
                            savingDraft = false,
                            error = err.message ?: "Failed to save draft.",
                        )
                    }
                }
        }
    }

    private fun friendlyNetworkError(message: String?): String {
        val msg = message.orEmpty()
        return when {
            msg.contains("Failed to connect", true) ||
                msg.contains("Unable to resolve host", true) ||
                msg.contains("Connection refused", true) ->
                "Cannot reach AI service at ${com.healthcare.app.data.LlmConfig.baseUrl()}. " +
                    "Start llm-service locally (port 5001) or wait for server deployment."
            msg.isNotBlank() -> msg
            else -> "AI service unavailable."
        }
    }
}

class AiAssistViewModelFactory(
    private val user: User,
    private val patientId: String?,
    private val repository: AiRepository = AiRepository(),
) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(AiAssistViewModel::class.java)) {
            return AiAssistViewModel(user, patientId, repository) as T
        }
        throw IllegalArgumentException("Unknown ViewModel: ${modelClass.name}")
    }
}
