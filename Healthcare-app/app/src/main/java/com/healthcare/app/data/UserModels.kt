package com.healthcare.app.data

import kotlinx.serialization.Serializable

enum class UserRole {
    super_admin,
    insurance_provider,
    medical_vendor,
    hospital_admin,
    bloodbank_admin,
    doctor,
    nurse,
    patient;

    companion object {
        fun fromString(raw: String?): UserRole {
            val key = raw?.lowercase()?.trim().orEmpty()
            val aliases = mapOf(
                "healthcare_provider" to doctor,
                "physician" to doctor,
                "provider" to doctor,
            )
            aliases[key]?.let { return it }
            return entries.find { it.name == key } ?: patient
        }
    }
}

@Serializable
data class UserDto(
    val id: String = "",
    val email: String = "",
    val firstName: String = "",
    val lastName: String = "",
    val role: String = "patient",
    val dateOfBirth: String? = null,
    val gender: String? = null,
    val bloodType: String? = null,
    val patientId: String? = null,
    val hospitalId: String? = null,
    val specialization: String? = null,
    val isVerified: Boolean = true,
    val createdAt: String = "",
    val lastLogin: String = "",
)

data class User(
    val id: String,
    val email: String,
    val firstName: String,
    val lastName: String,
    val role: UserRole,
    val dateOfBirth: String? = null,
    val gender: String? = null,
    val bloodType: String? = null,
    val patientId: String? = null,
    val hospitalId: String? = null,
    val specialization: String? = null,
    val isVerified: Boolean = true,
    val createdAt: String = "",
    val lastLogin: String = "",
) {
    val displayName: String get() = "$firstName $lastName".trim()
}

fun UserDto.toUser(): User = User(
    id = id,
    email = email.lowercase().trim(),
    firstName = firstName,
    lastName = lastName,
    role = UserRole.fromString(role),
    dateOfBirth = dateOfBirth,
    gender = gender,
    bloodType = bloodType,
    patientId = patientId,
    hospitalId = hospitalId,
    specialization = specialization,
    isVerified = isVerified,
    createdAt = createdAt,
    lastLogin = lastLogin,
)

fun roleLabel(role: UserRole): String = when (role) {
    UserRole.super_admin -> "Super Admin"
    UserRole.insurance_provider -> "Insurance Agent"
    UserRole.medical_vendor -> "Pharmacy Vendor"
    UserRole.hospital_admin -> "Hospital Admin"
    UserRole.bloodbank_admin -> "Blood Bank Admin"
    UserRole.doctor -> "Doctor"
    UserRole.nurse -> "Nurse"
    UserRole.patient -> "Patient"
}

@Serializable
data class LoginRequest(val email: String, val password: String)

@Serializable
data class LoginResponse(
    val success: Boolean = false,
    val user: UserDto? = null,
    val token: String? = null,
    val error: String? = null,
)

@Serializable
data class HealthCheckResponse(
    val ok: Boolean = false,
    val status: String = "",
    val telemetry: Boolean = false,
)

@Serializable
data class EmailRequest(val email: String)

@Serializable
data class ResetPasswordRequest(
    val email: String,
    val otp: String,
    val newPassword: String,
)

@Serializable
data class ChangePasswordRequest(
    val email: String,
    val otp: String,
    val newPassword: String,
)

@Serializable
data class DeleteAccountRequest(
    val email: String,
    val otp: String,
)

@Serializable
data class ApiActionResponse(
    val success: Boolean = false,
    val message: String? = null,
    val error: String? = null,
)
