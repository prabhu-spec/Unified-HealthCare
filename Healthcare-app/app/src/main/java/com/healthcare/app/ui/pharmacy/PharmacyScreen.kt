package com.healthcare.app.ui.pharmacy

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
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
import androidx.compose.material3.OutlinedTextField
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.healthcare.app.data.PharmacyRecord
import com.healthcare.app.data.PharmacyRepository
import com.healthcare.app.data.User
import com.healthcare.app.data.UserRole
import com.healthcare.app.domain.DashboardMenu
import com.healthcare.app.ui.components.AppBackground
import com.healthcare.app.ui.components.EmptyState
import com.healthcare.app.ui.components.LoadingState
import com.healthcare.app.ui.components.ScreenHeader
import com.healthcare.app.ui.components.StatusChip
import com.healthcare.app.ui.components.ThemedCard
import com.healthcare.app.ui.theme.LocalExtendedColors
import kotlinx.coroutines.launch

@Composable
fun PharmacyScreen(
    route: String,
    user: User,
    onBack: () -> Unit,
    modifier: Modifier = Modifier,
    repository: PharmacyRepository = PharmacyRepository(),
) {
    val scope = rememberCoroutineScope()
    var records by remember { mutableStateOf<List<PharmacyRecord>>(emptyList()) }
    var secondary by remember { mutableStateOf<List<PharmacyRecord>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }
    var message by remember { mutableStateOf<String?>(null) }

    fun refresh() {
        scope.launch {
            loading = true
            message = null
            runCatching {
                records = when (route) {
                    "medicines" -> repository.prescriptions(user)
                    "medicine_orders", "prescription_orders" -> repository.orders(user)
                    "prescribe" -> repository.prescriptions(user)
                    "inventory", "pharmacy_stock", "hospital_pharmacy" -> repository.stock(user)
                    "restock" -> repository.restockRequests(user)
                    "prescription_verify", "prescription_upload" -> repository.verifications(user)
                    else -> emptyList()
                }
                secondary = if (route == "medicines") repository.orders(user) else emptyList()
            }.onFailure { message = it.message ?: "Could not load pharmacy data" }
            loading = false
        }
    }

    LaunchedEffect(route, user.id) {
        refresh()
    }

    val ext = LocalExtendedColors.current

    AppBackground(modifier = modifier) {
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
        item {
            TextButton(onClick = onBack) {
                Text("Back", color = ext.accent)
            }
            ScreenHeader(
                title = DashboardMenu.labelForRoute(route),
                subtitle = pharmacyDescription(route),
            )
        }

        item {
            RouteActionCard(
                route = route,
                user = user,
                loading = loading,
                onRefresh = { refresh() },
                onAction = { action ->
                    scope.launch {
                        loading = true
                        runCatching {
                            when (action) {
                                "issue" -> repository.issuePrescription(
                                    user = user,
                                    patientId = "patient-1",
                                    patientName = "John Michael Smith",
                                    medication = "Amoxicillin 500mg",
                                    dosage = "1 tablet twice daily",
                                )
                                "restock" -> repository.requestRestock(user, "Paracetamol", 100)
                            }
                        }.onSuccess {
                            message = "Action completed"
                        }.onFailure {
                            message = it.message ?: "Action failed"
                        }
                        loading = false
                        refresh()
                    }
                },
            )
        }

        message?.let {
            item { Text(it, color = Color(0xFFFBBF24)) }
        }

        if (loading) {
            item { CircularProgressIndicator() }
        } else {
            items(records, key = { it.id }) { record ->
                PharmacyRecordCard(
                    route = route,
                    user = user,
                    record = record,
                    onOrder = {
                        scope.launch {
                            runCatching { repository.orderPrescription(user, record) }
                                .onSuccess { message = "Order sent to pharmacy" }
                                .onFailure { message = it.message ?: "Could not place order" }
                            refresh()
                        }
                    },
                    onAccept = {
                        scope.launch {
                            runCatching {
                                if (route == "restock") repository.approveRestock(user, record.id)
                                else repository.acceptOrder(user, record.id)
                            }.onFailure { message = it.message ?: "Could not accept" }
                            refresh()
                        }
                    },
                    onReject = {
                        scope.launch {
                            runCatching {
                                if (route == "restock") repository.rejectRestock(user, record.id)
                                else repository.rejectOrder(user, record.id)
                            }.onFailure { message = it.message ?: "Could not reject" }
                            refresh()
                        }
                    },
                    onVerify = {
                        scope.launch {
                            runCatching { repository.verifyPrescription(user, record.id) }
                                .onFailure { message = it.message ?: "Could not verify prescription" }
                            refresh()
                        }
                    },
                )
            }

            if (route == "medicines") {
                item {
                    Text("My orders", color = ext.cardContent, style = MaterialTheme.typography.titleLarge)
                }
                items(secondary, key = { "order-${it.id}" }) { order ->
                    PharmacyRecordCard(route = "medicine_orders_readonly", user = user, record = order)
                }
            }

            if (records.isEmpty()) {
                item {
                    EmptyState("No live records yet.")
                }
            }
        }
        }
    }
}

@Composable
private fun RouteActionCard(
    route: String,
    user: User,
    loading: Boolean,
    onRefresh: () -> Unit,
    onAction: (String) -> Unit,
) {
    val ext = LocalExtendedColors.current
    ThemedCard {
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Text("Actions", color = ext.cardContent, style = MaterialTheme.typography.titleMedium)
            Text("This screen syncs with the backend APIs used by the web dashboard.", color = ext.mutedText)
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                OutlinedButton(onClick = onRefresh, enabled = !loading) {
                    Text("Refresh")
                }
                if (route == "prescribe" && user.role == UserRole.doctor) {
                    Button(onClick = { onAction("issue") }, enabled = !loading) {
                        Text("Issue demo Rx")
                    }
                }
                if ((route == "inventory" || route == "pharmacy_stock" || route == "restock" || route == "hospital_pharmacy") &&
                    (user.role == UserRole.hospital_admin || user.role == UserRole.doctor)
                ) {
                    Button(onClick = { onAction("restock") }, enabled = !loading) {
                        Text("Request restock")
                    }
                }
                if ((route == "inventory" || route == "pharmacy_stock") && user.role == UserRole.medical_vendor) {
                    Button(onClick = { onAction("restock") }, enabled = !loading) {
                        Text("Request restock")
                    }
                }
            }
        }
    }
}

@Composable
private fun PharmacyRecordCard(
    route: String,
    user: User,
    record: PharmacyRecord,
    onOrder: (() -> Unit)? = null,
    onAccept: (() -> Unit)? = null,
    onReject: (() -> Unit)? = null,
    onVerify: (() -> Unit)? = null,
) {
    val ext = LocalExtendedColors.current
    ThemedCard(modifier = Modifier.fillMaxWidth()) {
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(record.title, color = ext.cardContent, style = MaterialTheme.typography.titleLarge)
            if (record.subtitle.isNotBlank()) Text(record.subtitle, color = ext.mutedText)
            StatusChip(status = record.status.ifBlank { "Available" })
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                if (route == "medicines" && user.role == UserRole.patient) {
                    Button(onClick = { onOrder?.invoke() }) {
                        Text("Order")
                    }
                }
                if ((route == "medicine_orders" || route == "prescription_orders") && record.status == "pending") {
                    Button(onClick = { onAccept?.invoke() }) {
                        Text("Accept")
                    }
                    OutlinedButton(onClick = { onReject?.invoke() }) {
                        Text("Reject")
                    }
                }
                if (route == "restock" && record.status == "Pending" && user.role == UserRole.medical_vendor) {
                    Button(onClick = { onAccept?.invoke() }) {
                        Text("Approve")
                    }
                    OutlinedButton(onClick = { onReject?.invoke() }) {
                        Text("Reject")
                    }
                }
                if ((route == "prescription_verify" || route == "prescription_upload") && record.status == "Pending") {
                    Button(onClick = { onVerify?.invoke() }) {
                        Text("Verify")
                    }
                }
            }
        }
    }
}

private fun pharmacyDescription(route: String): String =
    when (route) {
        "medicines" -> "Order medicines from active digital prescriptions and track pharmacy status."
        "medicine_orders", "prescription_orders" -> "Review pharmacy orders and accept or reject pending requests."
        "prescribe" -> "Issue prescriptions for patients."
        "inventory", "pharmacy_stock", "hospital_pharmacy" -> "Review stock levels and trigger restock requests."
        "restock" -> "Manage restock requests between hospital and pharmacy vendor."
        "prescription_verify", "prescription_upload" -> "Verify prescriptions submitted for pharmacy fulfillment."
        else -> "Pharmacy workflow"
    }
