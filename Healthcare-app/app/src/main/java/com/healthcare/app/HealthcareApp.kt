package com.healthcare.app

import android.app.Application
import com.healthcare.app.data.AuthRepository
import com.healthcare.app.data.NotificationRepository
import com.healthcare.app.data.PlatformRepository
import com.healthcare.app.data.ThemePreferencesRepository
import com.healthcare.app.notifications.NotificationMonitor
import com.healthcare.app.notifications.BackgroundNotificationScheduler
import com.healthcare.app.notifications.FcmRegistrar

class HealthcareApp : Application() {
    lateinit var authRepository: AuthRepository
        private set
    lateinit var platformRepository: PlatformRepository
        private set
    lateinit var themePreferences: ThemePreferencesRepository
        private set
    lateinit var notificationRepository: NotificationRepository
        private set
    var notificationMonitor: NotificationMonitor? = null
        private set

    override fun onCreate() {
        super.onCreate()
        authRepository = AuthRepository(applicationContext)
        platformRepository = PlatformRepository()
        themePreferences = ThemePreferencesRepository(applicationContext)
        notificationRepository = NotificationRepository()
    }

    fun startNotificationMonitor(user: com.healthcare.app.data.User) {
        notificationMonitor?.stop()
        notificationMonitor = NotificationMonitor(applicationContext, user).also { it.start() }
        BackgroundNotificationScheduler.schedule(applicationContext)
        FcmRegistrar.registerForUser(applicationContext, user)
    }

    fun stopNotificationMonitor() {
        notificationMonitor?.stop()
        notificationMonitor = null
        BackgroundNotificationScheduler.cancel(applicationContext)
    }
}
