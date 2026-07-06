package com.healthcare.app.domain

import com.healthcare.app.data.UserRole

fun canUseAiAssist(role: UserRole): Boolean =
    role in setOf(
        UserRole.super_admin,
        UserRole.hospital_admin,
        UserRole.doctor,
        UserRole.nurse,
        UserRole.patient,
    )

fun canAcceptAiDraft(role: UserRole): Boolean =
    role in setOf(
        UserRole.super_admin,
        UserRole.hospital_admin,
        UserRole.doctor,
        UserRole.nurse,
    )
