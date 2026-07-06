package com.healthcare.app.data

data class DemoCredential(
    val email: String,
    val password: String,
    val user: User,
)

object DemoUsers {
    val password = "demo123"

    private val credentials: List<DemoCredential> = listOf(
        demo("superadmin@demo.com", "Super", "Admin", UserRole.super_admin),
        demo("insurance@demo.com", "Insurance", "Provider", UserRole.insurance_provider),
        demo("vendor@demo.com", "Medical", "Vendor", UserRole.medical_vendor),
        demo("hospitaladmin@demo.com", "Hospital", "Admin", UserRole.hospital_admin, hospitalId = "org-1"),
        demo("hospitaladmin2@demo.com", "Admin", "Two", UserRole.hospital_admin, hospitalId = "org-2"),
        demo(
            "doctor@demo.com", "Dr. Sarah", "Johnson", UserRole.doctor,
            hospitalId = "org-1", specialization = "general", gender = "female", bloodType = "O+",
        ),
        demo(
            "nurse@demo.com", "Jane", "Miller", UserRole.nurse,
            hospitalId = "org-1", gender = "female", bloodType = "B+",
        ),
        demo(
            "patient@demo.com", "John", "Doe", UserRole.patient,
            patientId = "patient-1", gender = "male", bloodType = "A+",
        ),
        demo("bloodbank@demo.com", "Blood", "Bank Admin", UserRole.bloodbank_admin),
    )

    fun find(email: String, password: String): User? {
        val normalized = email.lowercase().trim()
        return credentials.find {
            it.email.equals(normalized, ignoreCase = true) && it.password == password
        }?.user?.copy(lastLogin = nowIso())
    }

    fun findByEmail(email: String): DemoCredential? =
        credentials.find { it.email.equals(email.trim(), ignoreCase = true) }

    private fun demo(
        email: String,
        firstName: String,
        lastName: String,
        role: UserRole,
        hospitalId: String? = null,
        patientId: String? = null,
        specialization: String? = null,
        gender: String? = null,
        bloodType: String? = null,
    ): DemoCredential {
        val id = "demo-${email.substringBefore("@")}"
        return DemoCredential(
            email = email.lowercase(),
            password = password,
            user = User(
                id = id,
                email = email.lowercase(),
                firstName = firstName,
                lastName = lastName,
                role = role,
                hospitalId = hospitalId,
                patientId = patientId,
                specialization = specialization,
                gender = gender,
                bloodType = bloodType,
                isVerified = true,
                createdAt = nowIso(),
                lastLogin = nowIso(),
            ),
        )
    }

    private fun nowIso(): String = java.time.Instant.now().toString()
}
