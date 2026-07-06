package com.healthcare.app.notifications

import android.util.Log
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.healthcare.app.data.AppNotification

class HealthcareFirebaseMessagingService : FirebaseMessagingService() {
    override fun onMessageReceived(message: RemoteMessage) {
        HealthcareNotificationManager.ensureChannels(this)
        val data = message.data
        val title = message.notification?.title ?: data["title"] ?: "Healthcare alert"
        val body = message.notification?.body ?: data["body"] ?: "You have a new notification"
        HealthcareNotificationManager.show(
            this,
            AppNotification(
                id = data["notificationId"] ?: "fcm-${System.currentTimeMillis()}",
                type = data["type"] ?: "system",
                title = title,
                body = body,
                route = data["route"] ?: "notifications",
                patientId = data["patientId"]?.ifBlank { null },
                room = data["room"]?.ifBlank { null },
                entityId = data["entityId"]?.ifBlank { null },
                read = false,
            ),
        )
    }

    override fun onNewToken(token: String) {
        Log.d(TAG, "FCM token refreshed")
        FcmRegistrar.onTokenRefresh(applicationContext, token)
    }

    companion object {
        private const val TAG = "HealthcareFCM"
    }
}
