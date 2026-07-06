package com.healthcare.app.notifications

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.healthcare.app.data.AuthRepository

class NotificationPollWorker(
    appContext: Context,
    params: WorkerParameters,
) : CoroutineWorker(appContext, params) {
    override suspend fun doWork(): Result {
        val user = AuthRepository(applicationContext).getStoredUserSnapshot() ?: return Result.success()
        pollOncePersistent(applicationContext, user)
        return Result.success()
    }
}
