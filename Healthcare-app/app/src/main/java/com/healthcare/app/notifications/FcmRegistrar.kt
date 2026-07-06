package com.healthcare.app.notifications

import android.content.Context
import android.util.Log
import com.google.firebase.messaging.FirebaseMessaging
import com.healthcare.app.data.AuthRepository
import com.healthcare.app.data.User
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await

object FcmRegistrar {
    private const val TAG = "FcmRegistrar"
    private val scope = CoroutineScope(Dispatchers.IO)
    private val repository = PushTokenRepository()

    fun registerForUser(context: Context, user: User) {
        scope.launch {
            runCatching {
                val token = FirebaseMessaging.getInstance().token.await()
                if (token.isNotBlank()) {
                    repository.registerToken(user, token)
                    Log.d(TAG, "Registered FCM token with AWS")
                }
            }.onFailure {
                Log.d(TAG, "FCM registration skipped: ${it.message}")
            }
        }
    }

    fun onTokenRefresh(context: Context, token: String) {
        scope.launch {
            val user = AuthRepository(context).getStoredUserSnapshot() ?: return@launch
            repository.registerToken(user, token)
        }
    }
}
