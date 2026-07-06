package com.healthcare.app.ui.video

import android.Manifest
import android.content.pm.PackageManager
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
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
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import com.healthcare.app.data.User
import com.healthcare.app.data.UserRole
import com.healthcare.app.data.VideoAppointment
import com.healthcare.app.data.VideoRepository
import com.healthcare.app.data.VideoToken
import com.healthcare.app.ui.components.AppBackground
import com.healthcare.app.ui.components.EmptyState
import com.healthcare.app.ui.components.ScreenHeader
import com.healthcare.app.ui.components.StatusChip
import com.healthcare.app.ui.components.ThemedCard
import com.healthcare.app.ui.theme.LocalExtendedColors
import kotlinx.coroutines.launch
import io.livekit.android.compose.local.RoomScope
import io.livekit.android.compose.state.rememberTracks
import io.livekit.android.compose.ui.VideoTrackView

@Composable
fun VideoConsultScreen(
    user: User,
    onBack: () -> Unit,
    modifier: Modifier = Modifier,
    repository: VideoRepository = VideoRepository(),
) {
    val scope = rememberCoroutineScope()
    var loading by remember { mutableStateOf(true) }
    var appointments by remember { mutableStateOf<List<VideoAppointment>>(emptyList()) }
    var activeToken by remember { mutableStateOf<VideoToken?>(null) }
    var message by remember { mutableStateOf<String?>(null) }

    fun refresh() {
        scope.launch {
            loading = true
            message = null
            runCatching { repository.listAppointments(user) }
                .onSuccess { appointments = it }
                .onFailure { message = it.message ?: "Could not load video appointments" }
            loading = false
        }
    }

    LaunchedEffect(user.id) {
        refresh()
    }

    val ext = LocalExtendedColors.current

    activeToken?.let { token ->
        LiveKitMeeting(
            token = token,
            onLeave = {
                activeToken = null
                refresh()
            },
            modifier = modifier,
        )
        return
    }

    AppBackground(modifier = modifier) {
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            item {
                TextButton(onClick = onBack) {
                    Text("Back", color = ext.accent)
                }
                ScreenHeader(
                    title = "Video Consults",
                    subtitle = "Create, accept, and join LiveKit video appointments from the native app.",
                )
            }

            item {
                ActionCard(
                    user = user,
                    loading = loading,
                    onRefresh = { refresh() },
                    onRequest = {
                        scope.launch {
                            loading = true
                            runCatching { repository.requestAppointment(user) }
                                .onSuccess { message = "Video consult requested" }
                                .onFailure { message = it.message ?: "Could not request consult" }
                            loading = false
                            refresh()
                        }
                    },
                )
            }

            if (message != null) {
                item {
                    Text(message.orEmpty(), color = Color(0xFFFBBF24))
                }
            }

            if (loading) {
                item {
                    Box(Modifier.fillMaxWidth().padding(24.dp), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator()
                    }
                }
            } else if (appointments.isEmpty()) {
                item {
                    EmptyState(
                        if (user.role == UserRole.patient) {
                            "No video consults yet. Request one to create a pending appointment."
                        } else {
                            "No video consults available for your hospital right now."
                        },
                    )
                }
            } else {
                items(appointments, key = { it.id }) { appointment ->
                    AppointmentCard(
                        appointment = appointment,
                        user = user,
                        onAccept = {
                            scope.launch {
                                loading = true
                                runCatching { repository.acceptAppointment(appointment.id, user) }
                                    .onFailure { message = it.message ?: "Could not accept appointment" }
                                loading = false
                                refresh()
                            }
                        },
                        onReject = {
                            scope.launch {
                                loading = true
                                runCatching { repository.rejectAppointment(appointment.id, user) }
                                    .onFailure { message = it.message ?: "Could not cancel appointment" }
                                loading = false
                                refresh()
                            }
                        },
                        onJoin = {
                            val room = appointment.roomName ?: return@AppointmentCard
                            scope.launch {
                                loading = true
                                runCatching { repository.token(room, user) }
                                    .onSuccess { token ->
                                        if (token.url.isBlank() || token.token.isBlank()) {
                                            message = "LiveKit server URL or token is missing on backend"
                                        } else {
                                            activeToken = token
                                        }
                                    }
                                    .onFailure { message = it.message ?: "Could not join meeting" }
                                loading = false
                            }
                        },
                    )
                }
            }
        }
    }
}

@Composable
private fun ActionCard(
    user: User,
    loading: Boolean,
    onRefresh: () -> Unit,
    onRequest: () -> Unit,
) {
    val ext = LocalExtendedColors.current
    ThemedCard {
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Text("Consult actions", color = ext.cardContent, style = MaterialTheme.typography.titleMedium)
            Text(
                if (user.role == UserRole.patient) {
                    "Patients can request a new consult. Doctors and hospital admins can accept pending requests."
                } else {
                    "Review pending consults and open accepted LiveKit rooms."
                },
                color = ext.mutedText,
            )
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                OutlinedButton(onClick = onRefresh, enabled = !loading) {
                    Text("Refresh")
                }
                if (user.role == UserRole.patient) {
                    Button(onClick = onRequest, enabled = !loading) {
                        Text("Request consult")
                    }
                }
            }
        }
    }
}

@Composable
private fun AppointmentCard(
    appointment: VideoAppointment,
    user: User,
    onAccept: () -> Unit,
    onReject: () -> Unit,
    onJoin: () -> Unit,
) {
    val accepted = appointment.status == "accepted" && appointment.roomName != null
    val ext = LocalExtendedColors.current
    ThemedCard(modifier = Modifier.fillMaxWidth()) {
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(appointment.patientName, color = ext.cardContent, style = MaterialTheme.typography.titleLarge)
            Text(
                listOf(appointment.doctorType, appointment.date, appointment.time, appointment.hospitalName)
                    .filter { it.isNotBlank() }
                    .joinToString(" · "),
                color = ext.mutedText,
            )
            StatusChip(
                status = if (appointment.roomName != null) {
                    "${appointment.status} · room ${appointment.roomName}"
                } else {
                    appointment.status
                },
            )
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                if (appointment.status == "pending" && user.role != UserRole.patient) {
                    Button(onClick = onAccept) {
                        Text("Accept")
                    }
                    OutlinedButton(onClick = onReject) {
                        Text("Reject")
                    }
                }
                if (accepted) {
                    Button(onClick = onJoin) {
                        Text("Join video")
                    }
                }
            }
        }
    }
}

@Composable
private fun LiveKitMeeting(
    token: VideoToken,
    onLeave: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val context = LocalContext.current
    var permissionsGranted by remember {
        mutableStateOf(
            ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED &&
                ContextCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED,
        )
    }
    val launcher = rememberLauncherForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { result ->
        permissionsGranted = result[Manifest.permission.CAMERA] == true &&
            result[Manifest.permission.RECORD_AUDIO] == true
    }

    LaunchedEffect(Unit) {
        if (!permissionsGranted) {
            launcher.launch(arrayOf(Manifest.permission.CAMERA, Manifest.permission.RECORD_AUDIO))
        }
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(Color(0xFF020617))
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            Column {
                Text("LiveKit Room", color = Color.White, style = MaterialTheme.typography.titleLarge)
                Text(token.roomName, color = Color(0xFF93C5FD))
            }
            OutlinedButton(onClick = onLeave) {
                Text("Leave")
            }
        }

        if (!permissionsGranted) {
            Text("Camera and microphone permissions are required for video consults.", color = Color(0xFFFBBF24))
            Button(onClick = { launcher.launch(arrayOf(Manifest.permission.CAMERA, Manifest.permission.RECORD_AUDIO)) }) {
                Text("Grant permissions")
            }
            return@Column
        }

        RoomScope(
            url = token.url,
            token = token.token,
            audio = true,
            video = true,
            connect = true,
        ) {
            val trackRefs by rememberTracks()
            if (trackRefs.isEmpty()) {
                Box(Modifier.fillMaxWidth().weight(1f), contentAlignment = Alignment.Center) {
                    Text("Connected. Waiting for participant video...", color = Color(0xFFCBD5E1))
                }
            } else {
                LazyColumn(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    items(trackRefs.size) { index ->
                        VideoTrackView(
                            trackReference = trackRefs[index],
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(320.dp),
                        )
                    }
                }
            }
        }
    }
}
