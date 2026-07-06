package com.healthcare.app.ui.profile

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import com.healthcare.app.BuildConfig
import com.healthcare.app.data.User
import com.healthcare.app.data.roleLabel
import com.healthcare.app.domain.AppAppearance
import com.healthcare.app.domain.AppBrightness
import com.healthcare.app.domain.AppColorPalette
import com.healthcare.app.domain.AppThemeConfig
import com.healthcare.app.ui.components.AppBackground
import com.healthcare.app.ui.components.ThemedCard
import com.healthcare.app.ui.theme.LocalExtendedColors

@Composable
fun ProfileScreen(
    user: User,
    themeConfig: AppThemeConfig,
    onOpenNotifications: () -> Unit = {},
    onAppearanceChange: (AppAppearance) -> Unit,
    onBrightnessChange: (AppBrightness) -> Unit,
    onPaletteChange: (AppColorPalette) -> Unit,
    onLogout: () -> Unit,
    onBackendStatus: (onResult: (Boolean, String) -> Unit) -> Unit,
    onRequestPasswordChangeOtp: (email: String, onResult: (Boolean, String?) -> Unit) -> Unit,
    onChangePassword: (email: String, otp: String, newPassword: String, onResult: (Boolean, String?) -> Unit) -> Unit,
    onRequestDeleteAccountOtp: (email: String, onResult: (Boolean, String?) -> Unit) -> Unit,
    onConfirmDeleteAccount: (email: String, otp: String, onResult: (Boolean, String?) -> Unit) -> Unit,
    modifier: Modifier = Modifier,
) {
    var backendMessage by rememberSaveable { mutableStateOf("Tap Check backend to verify EC2 connectivity.") }
    var backendOk by rememberSaveable { mutableStateOf<Boolean?>(null) }
    var passwordStep by rememberSaveable { mutableStateOf(false) }
    var passwordOtp by rememberSaveable { mutableStateOf("") }
    var newPassword by rememberSaveable { mutableStateOf("") }
    var passwordMessage by rememberSaveable { mutableStateOf<String?>(null) }
    var deleteStep by rememberSaveable { mutableStateOf(false) }
    var deleteOtp by rememberSaveable { mutableStateOf("") }
    var deleteMessage by rememberSaveable { mutableStateOf<String?>(null) }

    val ext = LocalExtendedColors.current
    AppBackground(modifier = modifier) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            ThemeSettingsSection(
                config = themeConfig,
                onAppearanceChange = onAppearanceChange,
                onBrightnessChange = onBrightnessChange,
                onPaletteChange = onPaletteChange,
            )
            ThemedCard(modifier = Modifier.fillMaxWidth()) {
                Text("Notifications", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = ext.cardContent)
                Text(
                    "Appointment, vitals, video, pharmacy, and blood bank alerts from AWS.",
                    color = ext.mutedText,
                    modifier = Modifier.padding(top = 6.dp, bottom = 10.dp),
                )
                Button(onClick = onOpenNotifications, modifier = Modifier.fillMaxWidth()) {
                    Text("Open notification center")
                }
            }
            ThemedCard(modifier = Modifier.fillMaxWidth()) {
                Text("Profile", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = ext.cardContent)
                Text(user.displayName, color = ext.cardContent, modifier = Modifier.padding(top = 8.dp))
                Text(user.email, color = ext.mutedText)
                Text(roleLabel(user.role), color = ext.mutedText, modifier = Modifier.padding(top = 4.dp))
                user.hospitalId?.let { Text("Hospital: $it", color = ext.mutedText, modifier = Modifier.padding(top = 4.dp)) }
                user.patientId?.let { Text("Patient ID: $it", color = ext.mutedText, modifier = Modifier.padding(top = 4.dp)) }
            }
            ThemedCard {
                Text("Backend", style = MaterialTheme.typography.labelLarge, color = ext.cardContent)
                Text(
                    BuildConfig.API_BASE_URL,
                    color = ext.accent,
                    style = MaterialTheme.typography.labelLarge,
                    modifier = Modifier.padding(top = 4.dp),
                )
                Text(
                    "Release builds use the AWS EC2 API. Features sync live data when the server is reachable.",
                    color = ext.mutedText,
                    modifier = Modifier.padding(top = 8.dp),
                )
                Text(
                    backendMessage,
                    color = when (backendOk) {
                        true -> ext.success
                        false -> ext.error
                        null -> ext.mutedText
                    },
                    modifier = Modifier.padding(top = 8.dp),
                )
                TextButton(
                    onClick = {
                        backendMessage = "Checking EC2 backend..."
                        backendOk = null
                        onBackendStatus { ok, msg ->
                            backendOk = ok
                            backendMessage = msg
                        }
                    },
                    modifier = Modifier.padding(top = 4.dp),
                ) {
                    Text("Check backend")
                }
            }
            ThemedCard {
                Text("Security", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                Text(
                    "Change your password with an email OTP, matching the web dashboard flow.",
                    color = ext.mutedText,
                    modifier = Modifier.padding(top = 6.dp),
                )
                passwordMessage?.let {
                    Text(it, color = if (it.startsWith("Password")) ext.success else ext.error, modifier = Modifier.padding(top = 8.dp))
                }
                if (!passwordStep) {
                    Button(
                        onClick = {
                            passwordMessage = "Sending verification code..."
                            onRequestPasswordChangeOtp(user.email) { ok, msg ->
                                if (ok) {
                                    passwordStep = true
                                    passwordMessage = "Code sent to ${user.email}."
                                } else {
                                    passwordMessage = msg ?: "Could not send code."
                                }
                            }
                        },
                        modifier = Modifier.fillMaxWidth().padding(top = 12.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
                    ) {
                        Text("Send password code")
                    }
                } else {
                    OutlinedTextField(
                        value = passwordOtp,
                        onValueChange = { passwordOtp = it.filter(Char::isDigit).take(6) },
                        label = { Text("Email code") },
                        modifier = Modifier.fillMaxWidth().padding(top = 12.dp),
                        singleLine = true,
                    )
                    OutlinedTextField(
                        value = newPassword,
                        onValueChange = { newPassword = it },
                        label = { Text("New password") },
                        modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
                        singleLine = true,
                        visualTransformation = PasswordVisualTransformation(),
                    )
                    Button(
                        onClick = {
                            if (newPassword.length < 6) {
                                passwordMessage = "Password must be at least 6 characters."
                                return@Button
                            }
                            onChangePassword(user.email, passwordOtp, newPassword) { ok, msg ->
                                if (ok) {
                                    passwordStep = false
                                    passwordOtp = ""
                                    newPassword = ""
                                    passwordMessage = "Password updated."
                                } else {
                                    passwordMessage = msg ?: "Could not update password."
                                }
                            }
                        },
                        modifier = Modifier.fillMaxWidth().padding(top = 12.dp),
                        enabled = passwordOtp.length == 6 && newPassword.isNotBlank(),
                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
                    ) {
                        Text("Update password")
                    }
                    TextButton(onClick = { passwordStep = false; passwordOtp = ""; newPassword = "" }) {
                        Text("Cancel")
                    }
                }
            }
            ThemedCard {
                Text("Danger zone", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = ext.error)
                Text(
                    "Permanent account deletion requires an email OTP and cannot be undone.",
                    color = ext.mutedText,
                    modifier = Modifier.padding(top = 6.dp),
                )
                deleteMessage?.let {
                    Text(it, color = ext.error, modifier = Modifier.padding(top = 8.dp))
                }
                if (!deleteStep) {
                    Button(
                        onClick = {
                            deleteMessage = "Sending deletion code..."
                            onRequestDeleteAccountOtp(user.email) { ok, msg ->
                                if (ok) {
                                    deleteStep = true
                                    deleteMessage = "Deletion code sent to ${user.email}."
                                } else {
                                    deleteMessage = msg ?: "Could not send deletion code."
                                }
                            }
                        },
                        modifier = Modifier.fillMaxWidth().padding(top = 12.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFB91C1C)),
                    ) {
                        Text("Request deletion code")
                    }
                } else {
                    OutlinedTextField(
                        value = deleteOtp,
                        onValueChange = { deleteOtp = it.filter(Char::isDigit).take(6) },
                        label = { Text("Deletion code") },
                        modifier = Modifier.fillMaxWidth().padding(top = 12.dp),
                        singleLine = true,
                    )
                    Button(
                        onClick = {
                            onConfirmDeleteAccount(user.email, deleteOtp) { ok, msg ->
                                if (ok) onLogout()
                                else deleteMessage = msg ?: "Could not delete account."
                            }
                        },
                        modifier = Modifier.fillMaxWidth().padding(top = 12.dp),
                        enabled = deleteOtp.length == 6,
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFB91C1C)),
                    ) {
                        Text("Permanently delete account")
                    }
                    TextButton(onClick = { deleteStep = false; deleteOtp = "" }) {
                        Text("Cancel")
                    }
                }
            }
            Button(
                onClick = onLogout,
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(containerColor = ext.error),
            ) {
                Text("Sign Out")
            }
        }
    }
}
