package com.healthcare.app

import android.Manifest
import android.content.Intent
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import com.healthcare.app.data.NotificationDeepLink
import com.healthcare.app.notifications.HealthcareNotificationManager
import com.healthcare.app.ui.HealthcareNavHost

class MainActivity : ComponentActivity() {
    private var pendingDeepLink by mutableStateOf<NotificationDeepLink?>(null)

    private val notificationPermission = registerForActivityResult(
        ActivityResultContracts.RequestPermission(),
    ) { }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            notificationPermission.launch(Manifest.permission.POST_NOTIFICATIONS)
        }
        pendingDeepLink = HealthcareNotificationManager.parseDeepLink(intent)
        val authRepository = (application as HealthcareApp).authRepository
        setContent {
            Surface(modifier = Modifier.fillMaxSize()) {
                HealthcareNavHost(
                    authRepository = authRepository,
                    pendingDeepLink = pendingDeepLink,
                    onDeepLinkConsumed = { pendingDeepLink = null },
                )
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        pendingDeepLink = HealthcareNotificationManager.parseDeepLink(intent)
    }
}
