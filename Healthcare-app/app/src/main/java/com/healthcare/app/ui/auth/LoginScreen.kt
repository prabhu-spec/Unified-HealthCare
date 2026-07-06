package com.healthcare.app.ui.auth

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import com.healthcare.app.BuildConfig
import com.healthcare.app.domain.AppBrightness
import com.healthcare.app.ui.components.AppBackground
import com.healthcare.app.ui.components.ThemedCard
import com.healthcare.app.ui.theme.AuthTextPrimary
import com.healthcare.app.ui.theme.AuthTextSecondary
import com.healthcare.app.ui.theme.LocalAppThemeConfig
import com.healthcare.app.ui.theme.LocalExtendedColors

private enum class RecoveryMode {
    None,
    ForgotPassword,
    ResetPassword,
    ForgotEmail,
}

@Composable
fun LoginScreen(
    onLoginSuccess: () -> Unit,
    onLogin: (email: String, password: String, onResult: (Boolean, String?) -> Unit) -> Unit,
    onForgotPasswordOtp: (email: String, onResult: (Boolean, String?) -> Unit) -> Unit,
    onResetPassword: (email: String, otp: String, newPassword: String, onResult: (Boolean, String?) -> Unit) -> Unit,
    onForgotEmail: (email: String, onResult: (Boolean, String?) -> Unit) -> Unit,
) {
    var email by rememberSaveable { mutableStateOf("") }
    var password by rememberSaveable { mutableStateOf("") }
    var otp by rememberSaveable { mutableStateOf("") }
    var newPassword by rememberSaveable { mutableStateOf("") }
    var confirmPassword by rememberSaveable { mutableStateOf("") }
    var error by rememberSaveable { mutableStateOf<String?>(null) }
    var message by rememberSaveable { mutableStateOf<String?>(null) }
    var loading by rememberSaveable { mutableStateOf(false) }
    var mode by rememberSaveable { mutableStateOf(RecoveryMode.None) }
    var showPassword by rememberSaveable { mutableStateOf(false) }
    var showNewPassword by rememberSaveable { mutableStateOf(false) }
    var showConfirmPassword by rememberSaveable { mutableStateOf(false) }

    val ext = LocalExtendedColors.current
    val themeConfig = LocalAppThemeConfig.current
    val onDarkGlass = themeConfig.brightness == AppBrightness.DARK && ext.useGlassCards
    val titleColor = if (onDarkGlass) ext.cardContent else AuthTextPrimary
    val subtitleColor = if (onDarkGlass) ext.mutedText else AuthTextSecondary
    val fieldColors = OutlinedTextFieldDefaults.colors(
        focusedTextColor = if (onDarkGlass) ext.cardContent else AuthTextPrimary,
        unfocusedTextColor = if (onDarkGlass) ext.cardContent else AuthTextPrimary,
        focusedLabelColor = subtitleColor,
        unfocusedLabelColor = subtitleColor,
        cursorColor = ext.accent,
        focusedBorderColor = ext.accent,
        unfocusedBorderColor = if (onDarkGlass) ext.cardBorder else Color(0xFFCBD5E1),
    )

    AppBackground(modifier = Modifier.fillMaxSize()) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
        ) {
            Text(
                text = "Healthcare",
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.SemiBold,
                color = ext.accent,
            )
            Text(
                text = "Sign in to continue",
                style = MaterialTheme.typography.bodyMedium,
                color = subtitleColor,
                modifier = Modifier.padding(top = 4.dp, bottom = 20.dp),
            )

            ThemedCard(modifier = Modifier.fillMaxWidth()) {
                Text(
                    "Welcome back",
                    style = MaterialTheme.typography.titleLarge,
                    color = titleColor,
                    fontWeight = FontWeight.Bold,
                )
                Text(
                    "Sign in with your account",
                    color = subtitleColor,
                    modifier = Modifier.padding(top = 4.dp, bottom = 16.dp),
                )

                if (BuildConfig.SHOW_DEMO_HINTS) {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = ext.accentSoft),
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Text(
                                "Development only — demo accounts enabled on server",
                                fontWeight = FontWeight.SemiBold,
                                color = ext.accent,
                            )
                        }
                    }
                    Spacer(Modifier.height(16.dp))
                }

                error?.let {
                    Text(it, color = Color(0xFFDC2626), modifier = Modifier.padding(bottom = 8.dp))
                }
                message?.let {
                    Text(it, color = Color(0xFF047857), modifier = Modifier.padding(bottom = 8.dp))
                }

                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    label = { Text("Email", color = AuthTextSecondary) },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    colors = fieldColors,
                )
                Spacer(Modifier.height(12.dp))

                when (mode) {
                    RecoveryMode.None -> {
                        ToggleablePasswordField(
                            value = password,
                            onValueChange = { password = it },
                            label = "Password",
                            visible = showPassword,
                            onVisibilityChange = { showPassword = it },
                            modifier = Modifier.fillMaxWidth(),
                            colors = fieldColors,
                        )
                        Spacer(Modifier.height(20.dp))

                        Button(
                            onClick = {
                                loading = true
                                error = null
                                message = null
                                onLogin(email, password) { ok, msg ->
                                    loading = false
                                    if (ok) onLoginSuccess() else error = msg
                                }
                            },
                            modifier = Modifier.fillMaxWidth(),
                            enabled = !loading && email.isNotBlank() && password.isNotBlank(),
                            colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
                        ) {
                            if (loading) {
                                CircularProgressIndicator(
                                    modifier = Modifier.height(24.dp),
                                    color = Color.White,
                                )
                            } else {
                                Text("Sign In", color = Color.White)
                            }
                        }

                        Row(
                            modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                        ) {
                            TextButton(onClick = { error = null; message = null; mode = RecoveryMode.ForgotPassword }) {
                                Text("Forgot password?")
                            }
                            TextButton(onClick = { error = null; message = null; mode = RecoveryMode.ForgotEmail }) {
                                Text("Forgot email?")
                            }
                        }
                    }

                    RecoveryMode.ForgotPassword -> {
                        RecoveryHeader(
                            title = "Reset password",
                            body = "We will send a 6-digit code to your email. Use it to set a new password.",
                        )
                        Button(
                            onClick = {
                                loading = true
                                error = null
                                message = null
                                onForgotPasswordOtp(email) { ok, msg ->
                                    loading = false
                                    if (ok) {
                                        message = "Code sent. Enter it below with your new password."
                                        mode = RecoveryMode.ResetPassword
                                    } else {
                                        error = msg
                                    }
                                }
                            },
                            modifier = Modifier.fillMaxWidth(),
                            enabled = !loading && email.isNotBlank(),
                            colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
                        ) {
                            Text(if (loading) "Sending..." else "Send reset code", color = Color.White)
                        }
                        RecoveryBackButton { mode = RecoveryMode.None; error = null; message = null }
                    }

                    RecoveryMode.ResetPassword -> {
                        OutlinedTextField(
                            value = otp,
                            onValueChange = { otp = it.filter(Char::isDigit).take(6) },
                            label = { Text("Verification code", color = AuthTextSecondary) },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true,
                            colors = fieldColors,
                        )
                        Spacer(Modifier.height(12.dp))
                        ToggleablePasswordField(
                            value = newPassword,
                            onValueChange = { newPassword = it },
                            label = "New password",
                            visible = showNewPassword,
                            onVisibilityChange = { showNewPassword = it },
                            modifier = Modifier.fillMaxWidth(),
                            colors = fieldColors,
                        )
                        Spacer(Modifier.height(12.dp))
                        ToggleablePasswordField(
                            value = confirmPassword,
                            onValueChange = { confirmPassword = it },
                            label = "Confirm password",
                            visible = showConfirmPassword,
                            onVisibilityChange = { showConfirmPassword = it },
                            modifier = Modifier.fillMaxWidth(),
                            colors = fieldColors,
                        )
                        Spacer(Modifier.height(16.dp))
                        Button(
                            onClick = {
                                if (newPassword != confirmPassword) {
                                    error = "Passwords do not match."
                                    return@Button
                                }
                                if (newPassword.length < 6) {
                                    error = "Password must be at least 6 characters."
                                    return@Button
                                }
                                loading = true
                                error = null
                                onResetPassword(email, otp, newPassword) { ok, msg ->
                                    loading = false
                                    if (ok) {
                                        mode = RecoveryMode.None
                                        password = ""
                                        otp = ""
                                        newPassword = ""
                                        confirmPassword = ""
                                        message = "Password updated. Sign in with your new password."
                                    } else {
                                        error = msg
                                    }
                                }
                            },
                            modifier = Modifier.fillMaxWidth(),
                            enabled = !loading && email.isNotBlank() && otp.length == 6 && newPassword.isNotBlank(),
                            colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
                        ) {
                            Text(if (loading) "Updating..." else "Update password", color = Color.White)
                        }
                        RecoveryBackButton { mode = RecoveryMode.ForgotPassword; error = null }
                    }

                    RecoveryMode.ForgotEmail -> {
                        RecoveryHeader(
                            title = "Forgot email",
                            body = "Enter the email address you registered with and we will send a reminder.",
                        )
                        Button(
                            onClick = {
                                loading = true
                                error = null
                                message = null
                                onForgotEmail(email) { ok, msg ->
                                    loading = false
                                    if (ok) {
                                        mode = RecoveryMode.None
                                        message = "If an account exists, we sent the login email reminder."
                                    } else {
                                        error = msg
                                    }
                                }
                            },
                            modifier = Modifier.fillMaxWidth(),
                            enabled = !loading && email.isNotBlank(),
                            colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
                        ) {
                            Text(if (loading) "Sending..." else "Send reminder", color = Color.White)
                        }
                        RecoveryBackButton { mode = RecoveryMode.None; error = null; message = null }
                    }
                }
            }
        }
    }
}

@Composable
private fun RecoveryHeader(title: String, body: String) {
    Text(
        title,
        style = MaterialTheme.typography.titleMedium,
        color = AuthTextPrimary,
        fontWeight = FontWeight.SemiBold,
        modifier = Modifier.padding(top = 8.dp),
    )
    Text(
        body,
        color = AuthTextSecondary,
        modifier = Modifier.padding(top = 4.dp, bottom = 12.dp),
    )
}

@Composable
private fun RecoveryBackButton(onClick: () -> Unit) {
    TextButton(onClick = onClick, modifier = Modifier.padding(top = 8.dp)) {
        Text("Back to sign in")
    }
}

@Composable
private fun ToggleablePasswordField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    visible: Boolean,
    onVisibilityChange: (Boolean) -> Unit,
    modifier: Modifier = Modifier,
    colors: androidx.compose.material3.TextFieldColors,
) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        label = { Text(label, color = AuthTextSecondary) },
        modifier = modifier,
        singleLine = true,
        visualTransformation = if (visible) VisualTransformation.None else PasswordVisualTransformation(),
        trailingIcon = {
            IconButton(onClick = { onVisibilityChange(!visible) }) {
                Icon(
                    imageVector = if (visible) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                    contentDescription = if (visible) "Hide password" else "Show password",
                    tint = AuthTextSecondary,
                )
            }
        },
        colors = colors,
    )
}
