package com.healthcare.app.ui.platform

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.healthcare.app.data.PlatformRepository
import com.healthcare.app.data.PlatformStatus
import com.healthcare.app.data.User
import com.healthcare.app.domain.DashboardMenu
import com.healthcare.app.ui.components.AppBackground
import com.healthcare.app.ui.components.LoadingState
import com.healthcare.app.ui.components.ScreenHeader
import com.healthcare.app.ui.components.ThemedCard
import com.healthcare.app.ui.theme.LocalExtendedColors

@Composable
fun PlatformTestingScreen(
    user: User,
    repository: PlatformRepository,
    onBack: () -> Unit,
    modifier: Modifier = Modifier,
) {
    var loading by remember { mutableStateOf(true) }
    var status by remember { mutableStateOf<PlatformStatus?>(null) }
    var error by remember { mutableStateOf<String?>(null) }
    val ext = LocalExtendedColors.current
    val menu = remember(user.role) { DashboardMenu.forRole(user.role) }

    LaunchedEffect(user.id) {
        loading = true
        error = null
        repository.fetchPlatformStatus(user)
            .onSuccess { status = it }
            .onFailure { error = it.message ?: "Failed to load status" }
        loading = false
    }

    AppBackground(modifier = modifier) {
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            item {
                TextButton(onClick = onBack) { Text("Back", color = ext.accent) }
                ScreenHeader(
                    title = "Platform testing",
                    subtitle = "Phase 0 — API-backed UI with in-memory server data",
                )
            }
            when {
                loading -> item { LoadingState() }
                error != null -> item { Text(error!!, color = ext.error) }
                status != null -> {
                    item {
                        ThemedCard(modifier = Modifier.fillMaxWidth()) {
                            Text("Phase: ${status!!.phaseLabel}", fontWeight = FontWeight.SemiBold)
                            Text("Storage: ${status!!.storage}", style = MaterialTheme.typography.bodySmall)
                            Text("Demo password: ${status!!.demoPassword}", style = MaterialTheme.typography.bodySmall)
                        }
                    }
                    item {
                        Text("Your menu (${user.role})", fontWeight = FontWeight.SemiBold, modifier = Modifier.padding(top = 8.dp))
                    }
                    items(menu.filter { it.route != "dashboard" && it.route != "platform_testing" }) { item ->
                        Text("• ${item.icon} ${item.label}", style = MaterialTheme.typography.bodyMedium)
                    }
                    item {
                        Text("API features", fontWeight = FontWeight.SemiBold, modifier = Modifier.padding(top = 12.dp))
                    }
                    items(status!!.features) { f ->
                        ThemedCard(modifier = Modifier.fillMaxWidth()) {
                            Text(f.label, fontWeight = FontWeight.Medium)
                            Text(f.api, style = MaterialTheme.typography.labelSmall, color = ext.mutedText)
                            Text("Phase ${f.phase} · ${f.roles}", style = MaterialTheme.typography.labelSmall)
                        }
                    }
                }
            }
        }
    }
}
