package com.healthcare.app.ui.main

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.healthcare.app.data.User
import com.healthcare.app.domain.DashboardMenu
import com.healthcare.app.ui.components.AppBackground
import com.healthcare.app.ui.components.ScreenHeader
import com.healthcare.app.ui.components.ThemedCard
import com.healthcare.app.ui.theme.LocalExtendedColors

@Composable
fun MenuScreen(
    user: User,
    onNavigate: (String) -> Unit,
    modifier: Modifier = Modifier,
) {
    val ext = LocalExtendedColors.current
    val items = DashboardMenu.forRole(user.role).filter { it.route !in setOf("dashboard") }
    val groupedItems = items.groupBy { it.category }

    AppBackground(modifier = modifier) {
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            item {
                ScreenHeader(
                    title = "All features",
                    subtitle = "Grouped by category — same roles as the website",
                    modifier = Modifier.padding(bottom = 8.dp),
                )
            }
            groupedItems.forEach { (category, sectionItems) ->
                item {
                    Text(
                        category,
                        style = MaterialTheme.typography.titleMedium,
                        color = ext.accent,
                        fontWeight = FontWeight.SemiBold,
                        modifier = Modifier.padding(top = 8.dp),
                    )
                }
                items(sectionItems, key = { it.route }) { item ->
                    ThemedCard(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onNavigate(item.route) },
                    ) {
                        Text("${item.icon}  ${item.label}", fontWeight = FontWeight.SemiBold, color = ext.cardContent)
                        if (item.description.isNotBlank()) {
                            Text(
                                item.description,
                                style = MaterialTheme.typography.labelMedium,
                                color = ext.mutedText,
                                modifier = Modifier.padding(top = 4.dp),
                            )
                        }
                    }
                }
            }
        }
    }
}
