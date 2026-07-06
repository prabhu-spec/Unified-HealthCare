package com.healthcare.app.ui.dashboard



import androidx.compose.foundation.clickable

import androidx.compose.foundation.layout.Arrangement

import androidx.compose.foundation.layout.Column

import androidx.compose.foundation.layout.Row

import androidx.compose.foundation.layout.Spacer

import androidx.compose.foundation.layout.fillMaxSize

import androidx.compose.foundation.layout.fillMaxWidth

import androidx.compose.foundation.layout.padding

import androidx.compose.foundation.rememberScrollState

import androidx.compose.foundation.verticalScroll

import androidx.compose.material.icons.Icons

import androidx.compose.material.icons.outlined.Notifications

import androidx.compose.material3.Icon

import androidx.compose.material3.IconButton

import androidx.compose.material3.MaterialTheme

import androidx.compose.material3.Text

import androidx.compose.runtime.Composable

import androidx.compose.ui.Alignment

import androidx.compose.ui.Modifier

import androidx.compose.ui.text.font.FontWeight

import androidx.compose.ui.unit.dp

import com.healthcare.app.data.User

import com.healthcare.app.data.roleLabel

import com.healthcare.app.domain.DashboardMenu

import com.healthcare.app.domain.MenuItem

import com.healthcare.app.ui.components.AppBackground

import com.healthcare.app.ui.components.ThemedCard

import com.healthcare.app.ui.theme.LocalExtendedColors



@Composable

fun DashboardScreen(

    user: User,

    onNavigate: (String) -> Unit,

    onOpenNotifications: () -> Unit = {},

    modifier: Modifier = Modifier,

) {

    val ext = LocalExtendedColors.current

    val menuItems = DashboardMenu.forRole(user.role)

    val quickLinks = menuItems.filter { it.route !in setOf("dashboard", "profile") }.take(8)

    val summaries = DashboardMenu.summaryCards(user.role)



    AppBackground(modifier = modifier) {

        Column(

            modifier = Modifier

                .fillMaxSize()

                .verticalScroll(rememberScrollState())

                .padding(horizontal = 16.dp, vertical = 12.dp),

            verticalArrangement = Arrangement.spacedBy(20.dp),

        ) {

            Row(

                modifier = Modifier.fillMaxWidth(),

                horizontalArrangement = Arrangement.SpaceBetween,

                verticalAlignment = Alignment.CenterVertically,

            ) {

                Column {

                    Text(

                        "Hi, ${user.firstName}",

                        style = MaterialTheme.typography.headlineSmall,

                        fontWeight = FontWeight.SemiBold,

                        color = ext.cardContent,

                    )

                    Text(roleLabel(user.role), style = MaterialTheme.typography.bodyMedium, color = ext.mutedText)

                }

                IconButton(onClick = onOpenNotifications) {

                    Icon(Icons.Outlined.Notifications, contentDescription = "Notifications", tint = ext.accent)

                }

            }



            summaries.chunked(2).forEach { row ->

                Row(

                    modifier = Modifier.fillMaxWidth(),

                    horizontalArrangement = Arrangement.spacedBy(10.dp),

                ) {

                    row.forEach { (label, value) ->

                        ThemedCard(modifier = Modifier.weight(1f)) {

                            Text(label, style = MaterialTheme.typography.labelSmall, color = ext.mutedText)

                            Text(

                                value,

                                style = MaterialTheme.typography.titleMedium,

                                fontWeight = FontWeight.SemiBold,

                                color = ext.cardContent,

                                modifier = Modifier.padding(top = 2.dp),

                            )

                        }

                    }

                    if (row.size == 1) Spacer(Modifier.weight(1f))

                }

            }



            Text(

                "Quick actions",

                style = MaterialTheme.typography.labelLarge,

                fontWeight = FontWeight.SemiBold,

                color = ext.mutedText,

            )

            quickLinks.chunked(2).forEach { row ->

                Row(

                    modifier = Modifier.fillMaxWidth(),

                    horizontalArrangement = Arrangement.spacedBy(10.dp),

                ) {

                    row.forEach { item ->

                        QuickActionCard(

                            item = item,

                            onClick = { onNavigate(item.route) },

                            modifier = Modifier.weight(1f),

                        )

                    }

                    if (row.size == 1) Spacer(Modifier.weight(1f))

                }

            }

        }

    }

}



@Composable

private fun QuickActionCard(item: MenuItem, onClick: () -> Unit, modifier: Modifier = Modifier) {

    val ext = LocalExtendedColors.current

    ThemedCard(

        modifier = modifier

            .fillMaxWidth()

            .clickable(onClick = onClick),

    ) {

        Text(item.icon, style = MaterialTheme.typography.titleLarge)

        Text(

            item.label,

            fontWeight = FontWeight.Medium,

            color = ext.cardContent,

            modifier = Modifier.padding(top = 6.dp),

        )

    }

}

