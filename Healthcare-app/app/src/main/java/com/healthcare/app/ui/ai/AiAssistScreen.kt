package com.healthcare.app.ui.ai

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.Button
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.healthcare.app.data.AiChatMessage
import com.healthcare.app.data.User
import com.healthcare.app.ui.components.AppBackground
import com.healthcare.app.ui.components.LoadingState
import com.healthcare.app.ui.components.StatusChip
import com.healthcare.app.ui.components.ThemedCard
import com.healthcare.app.ui.theme.LocalExtendedColors

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AiAssistScreen(
    user: User,
    patientId: String?,
    onBack: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val viewModel: AiAssistViewModel = viewModel(
        factory = AiAssistViewModelFactory(user, patientId),
        key = "ai-assist-${user.id}-$patientId",
    )
    val uiState by viewModel.state.collectAsState()
    val ext = LocalExtendedColors.current
    val listState = rememberLazyListState()

    LaunchedEffect(uiState.messages.size, uiState.loadingChat) {
        if (uiState.messages.isNotEmpty() || uiState.loadingChat) {
            listState.animateScrollToItem(maxOf(0, listState.layoutInfo.totalItemsCount - 1))
        }
    }

    AppBackground(modifier = modifier.fillMaxSize()) {
        if (!uiState.allowed) {
            Column(
                modifier = Modifier.fillMaxSize().padding(16.dp),
                verticalArrangement = Arrangement.Center,
            ) {
                OutlinedButton(onClick = onBack) {
                    Text("Back", color = ext.accent)
                }
                Text(
                    "Your role cannot use AI Assist.",
                    color = ext.error,
                    modifier = Modifier.padding(top = 16.dp),
                )
            }
            return@AppBackground
        }

        Scaffold(
            containerColor = Color.Transparent,
            topBar = {
                TopAppBar(
                    title = {
                        Column {
                            Text("AI Assist", color = ext.cardContent)
                            if (uiState.patientLabel.isNotBlank()) {
                                Text(
                                    uiState.patientLabel,
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
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .padding(horizontal = 16.dp),
                state = listState,
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                item {
                    StatusCard(uiState = uiState, onRefresh = viewModel::loadStatus)
                }

                uiState.error?.let { err ->
                    item {
                        ThemedCard(modifier = Modifier.fillMaxWidth()) {
                            Text(err, color = ext.error)
                        }
                    }
                }

                uiState.saveSuccess?.let { msg ->
                    item {
                        ThemedCard(modifier = Modifier.fillMaxWidth()) {
                            Text(msg, color = ext.accent, fontWeight = FontWeight.Medium)
                        }
                    }
                }

                if (uiState.patientId != null) {
                    item {
                        SummarySection(
                            loading = uiState.loadingSummary,
                            summary = uiState.summary,
                            onRunSummary = viewModel::runSummary,
                        )
                    }

                    if (uiState.canAcceptDraft) {
                        item {
                            DraftSection(
                                draftText = uiState.draftText,
                                appendToNotes = uiState.appendToNotes,
                                saving = uiState.savingDraft,
                                onDraftChange = viewModel::updateDraftText,
                                onAppendChange = viewModel::setAppendToNotes,
                                onAccept = { viewModel.acceptDraft("summary") },
                            )
                        }
                    }
                } else {
                    item {
                        ThemedCard(modifier = Modifier.fillMaxWidth()) {
                            Text("Patient context", fontWeight = FontWeight.SemiBold, color = ext.cardContent)
                            Text(
                                "Open AI Assist from Patient Details for a clinical summary, or use chat for general questions.",
                                color = ext.mutedText,
                                modifier = Modifier.padding(top = 6.dp),
                            )
                        }
                    }
                }

                item {
                    ChatSection(
                        messages = uiState.messages,
                        input = uiState.chatInput,
                        loading = uiState.loadingChat,
                        onInputChange = viewModel::updateChatInput,
                        onSend = viewModel::sendChat,
                    )
                }

                item { Spacer(Modifier.height(24.dp)) }
            }
        }
    }
}

@Composable
private fun StatusCard(
    uiState: AiAssistUiState,
    onRefresh: () -> Unit,
) {
    val ext = LocalExtendedColors.current
    ThemedCard(modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text("AI engine", fontWeight = FontWeight.SemiBold, color = ext.cardContent)
            OutlinedButton(onClick = onRefresh, enabled = !uiState.loadingStatus) {
                Text("Refresh")
            }
        }
        when {
            uiState.loadingStatus -> {
                LoadingState("Checking AI service…")
            }
            uiState.status != null -> {
                val s = uiState.status!!
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.padding(top = 8.dp)) {
                    StatusChip(status = s.mode)
                    if (s.model.isNotBlank()) {
                        StatusChip(status = s.model)
                    }
                }
                s.message?.let {
                    Text(it, color = ext.mutedText, modifier = Modifier.padding(top = 6.dp))
                }
            }
        }
    }
}

@Composable
private fun SummarySection(
    loading: Boolean,
    summary: com.healthcare.app.data.AiSummaryResult?,
    onRunSummary: () -> Unit,
) {
    val ext = LocalExtendedColors.current
    ThemedCard(modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text("Clinical summary", fontWeight = FontWeight.SemiBold, color = ext.cardContent)
            OutlinedButton(onClick = onRunSummary, enabled = !loading) {
                Text(if (loading) "…" else "Regenerate")
            }
        }
        when {
            loading -> Box(Modifier.fillMaxWidth().padding(top = 12.dp), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
            summary != null -> {
                summary.disclaimer?.let {
                    Text(it, color = ext.mutedText, style = MaterialTheme.typography.labelSmall, modifier = Modifier.padding(top = 8.dp))
                }
                Text(
                    summary.summary,
                    color = ext.cardContent,
                    modifier = Modifier.padding(top = 10.dp),
                )
                Text(
                    "Model: ${summary.model} · ${summary.mode}",
                    color = ext.mutedText,
                    style = MaterialTheme.typography.labelSmall,
                    modifier = Modifier.padding(top = 8.dp),
                )
            }
            else -> {
                Text("Tap Regenerate to create a summary.", color = ext.mutedText, modifier = Modifier.padding(top = 8.dp))
            }
        }
    }
}

@Composable
private fun DraftSection(
    draftText: String,
    appendToNotes: Boolean,
    saving: Boolean,
    onDraftChange: (String) -> Unit,
    onAppendChange: (Boolean) -> Unit,
    onAccept: () -> Unit,
) {
    val ext = LocalExtendedColors.current
    ThemedCard(modifier = Modifier.fillMaxWidth()) {
        Text("Review & save to notes", fontWeight = FontWeight.SemiBold, color = ext.cardContent)
        Text(
            "Edit the AI draft before saving to the patient record.",
            color = ext.mutedText,
            modifier = Modifier.padding(top = 4.dp),
        )
        OutlinedTextField(
            value = draftText,
            onValueChange = onDraftChange,
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 10.dp)
                .height(160.dp),
            placeholder = { Text("AI draft…") },
        )
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.padding(top = 8.dp),
        ) {
            Checkbox(checked = appendToNotes, onCheckedChange = onAppendChange)
            Text("Append to existing consult notes", color = ext.cardContent)
        }
        Button(
            onClick = onAccept,
            enabled = draftText.isNotBlank() && !saving,
            modifier = Modifier.padding(top = 8.dp),
        ) {
            Text(if (saving) "Saving…" else "Accept & save to notes")
        }
    }
}

@Composable
private fun ChatSection(
    messages: List<AiChatMessage>,
    input: String,
    loading: Boolean,
    onInputChange: (String) -> Unit,
    onSend: () -> Unit,
) {
    val ext = LocalExtendedColors.current
    ThemedCard(modifier = Modifier.fillMaxWidth()) {
        Text("Chat", fontWeight = FontWeight.SemiBold, color = ext.cardContent)
        if (messages.isEmpty()) {
            Text(
                "Ask follow-up questions about the patient or general clinical topics.",
                color = ext.mutedText,
                modifier = Modifier.padding(top = 6.dp),
            )
        } else {
            Column(modifier = Modifier.padding(top = 10.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                messages.forEach { msg ->
                    ChatBubble(message = msg)
                }
                if (loading) {
                    CircularProgressIndicator(modifier = Modifier.padding(8.dp))
                }
            }
        }
        OutlinedTextField(
            value = input,
            onValueChange = onInputChange,
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 12.dp),
            placeholder = { Text("Type a message…") },
            enabled = !loading,
            singleLine = false,
            maxLines = 4,
        )
        Button(
            onClick = onSend,
            enabled = input.isNotBlank() && !loading,
            modifier = Modifier.padding(top = 8.dp),
        ) {
            Text("Send")
        }
    }
}

@Composable
private fun ChatBubble(message: AiChatMessage) {
    val ext = LocalExtendedColors.current
    val isUser = message.role == "user"
    ThemedCard(
        modifier = Modifier.fillMaxWidth(),
    ) {
        Text(
            if (isUser) "You" else "AI",
            fontWeight = FontWeight.SemiBold,
            color = if (isUser) ext.accent else ext.cardContent,
        )
        Text(message.text, color = ext.cardContent, modifier = Modifier.padding(top = 4.dp))
    }
}
