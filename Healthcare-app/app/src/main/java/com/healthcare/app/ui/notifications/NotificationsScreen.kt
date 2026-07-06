package com.healthcare.app.ui.notifications

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.healthcare.app.data.AppNotification
import com.healthcare.app.data.NotificationDeepLink
import com.healthcare.app.data.NotificationRepository
import com.healthcare.app.data.User
import com.healthcare.app.ui.components.AppBackground
import com.healthcare.app.ui.components.EmptyState
import com.healthcare.app.ui.components.LoadingState
import com.healthcare.app.ui.components.ScreenHeader
import com.healthcare.app.ui.components.StatusChip
import com.healthcare.app.ui.components.ThemedCard
import com.healthcare.app.ui.theme.LocalExtendedColors
import kotlinx.coroutines.launch

@Composable
fun NotificationsScreen(
    user: User,
    onBack: () -> Unit,
    onOpenDeepLink: (NotificationDeepLink) -> Unit,
    modifier: Modifier = Modifier,
    repository: NotificationRepository = NotificationRepository(),
) {
    val scope = rememberCoroutineScope()
    var loading by remember { mutableStateOf(true) }
    var items by remember { mutableStateOf<List<AppNotification>>(emptyList()) }
    val ext = LocalExtendedColors.current

    fun refresh() {
        scope.launch {
            loading = true
            runCatching { repository.fetchNotifications(user) }
                .onSuccess { items = it }
            loading = false
        }
    }

    LaunchedEffect(user.id) { refresh() }

    AppBackground(modifier = modifier) {
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            item {
                TextButton(onClick = onBack) { Text("Back", color = ext.accent) }
                ScreenHeader(
                    title = "Notifications",
                    subtitle = "Role-based alerts from AWS — appointments, vitals, pharmacy, blood bank, video",
                )
                Button(
                    onClick = {
                        scope.launch {
                            repository.markAllRead(user)
                            refresh()
                        }
                    },
                    modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
                ) { Text("Mark all read") }
            }
            if (loading) {
                item { LoadingState() }
            } else if (items.isEmpty()) {
                item { EmptyState("No notifications yet. Alerts appear when events occur on the backend.") }
            } else {
                items(items, key = { it.id }) { n ->
                    ThemedCard(
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            Text(n.title, fontWeight = FontWeight.Bold, color = ext.cardContent)
                            Text(n.body, color = ext.mutedText)
                            StatusChip(status = if (n.read) "Read" else "New · ${n.type}")
                            TextButton(
                                onClick = {
                                    scope.launch {
                                        if (!n.read) repository.markRead(user, n.id)
                                        onOpenDeepLink(
                                            NotificationDeepLink(
                                                route = n.route,
                                                patientId = n.patientId,
                                                room = n.room,
                                                entityId = n.entityId,
                                            ),
                                        )
                                    }
                                },
                            ) {
                                Text("Open", color = ext.accent)
                            }
                        }
                    }
                }
            }
        }
    }
}
