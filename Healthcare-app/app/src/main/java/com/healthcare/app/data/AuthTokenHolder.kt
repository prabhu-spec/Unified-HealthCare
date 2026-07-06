package com.healthcare.app.data

/**
 * In-memory JWT from login (Phase 2). Attached to API requests via [ApiHeaders].
 */
object AuthTokenHolder {
    @Volatile
    var accessToken: String? = null
}
