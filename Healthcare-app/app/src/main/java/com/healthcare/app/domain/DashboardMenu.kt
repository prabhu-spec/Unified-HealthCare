package com.healthcare.app.domain

import com.healthcare.app.data.UserRole

data class MenuItem(
    val route: String,
    val label: String,
    val icon: String,
    val description: String = "",
    val category: String = "General",
)

object DashboardMenu {
    private data class Entry(
        val route: String,
        val label: String,
        val icon: String,
        val roles: Set<UserRole>,
    )

    private val items = listOf(
        Entry("dashboard", "Dashboard", "🏠", UserRole.entries.toSet()),
        Entry("blood_requests", "Blood Requests", "🩸", setOf(UserRole.bloodbank_admin)),
        Entry("blood_inventory", "Blood Inventory", "🩺", setOf(UserRole.bloodbank_admin)),
        Entry("donation_requests", "Donation Requests", "❤️", setOf(UserRole.bloodbank_admin)),
        Entry("request_blood", "Request Blood", "🩸", setOf(UserRole.hospital_admin, UserRole.doctor, UserRole.nurse, UserRole.patient)),
        Entry("hospitals", "Hospitals", "🏥", setOf(UserRole.super_admin, UserRole.hospital_admin, UserRole.doctor, UserRole.nurse, UserRole.patient)),
        Entry("patients", "Patient Details", "👤", setOf(UserRole.super_admin, UserRole.insurance_provider, UserRole.medical_vendor, UserRole.hospital_admin, UserRole.doctor, UserRole.nurse, UserRole.patient)),
        Entry("appointments", "Book Appointment", "📅", setOf(UserRole.hospital_admin, UserRole.doctor, UserRole.patient)),
        Entry("scheduler", "Staff Scheduler", "🗓️", setOf(UserRole.super_admin, UserRole.hospital_admin, UserRole.doctor, UserRole.nurse)),
        Entry("video_meet", "Video Consults", "🎥", setOf(UserRole.hospital_admin, UserRole.doctor, UserRole.patient)),
        Entry("telemetry_overview", "Overview", "🏨", setOf(UserRole.hospital_admin, UserRole.doctor, UserRole.nurse, UserRole.patient)),
        Entry("telemetry_live", "Live Telemetry", "📡", setOf(UserRole.doctor, UserRole.nurse)),
        Entry("telemetry_devices", "Devices", "⌚", setOf(UserRole.hospital_admin)),
        Entry("telemetry_assignments", "Patients & Assignments", "🔗", setOf(UserRole.doctor)),
        Entry("queue", "Patient Queue", "📋", setOf(UserRole.super_admin, UserRole.hospital_admin, UserRole.doctor, UserRole.nurse)),
        Entry("history", "Patient History", "📜", setOf(UserRole.super_admin, UserRole.insurance_provider, UserRole.hospital_admin, UserRole.doctor, UserRole.nurse, UserRole.patient)),
        Entry("records", "Medical Records", "📁", setOf(UserRole.super_admin, UserRole.insurance_provider, UserRole.hospital_admin, UserRole.doctor, UserRole.nurse, UserRole.patient)),
        Entry("prescribe", "Prescribe", "💊", setOf(UserRole.super_admin, UserRole.doctor)),
        Entry("hospital_application", "Hospital Application", "📝", setOf(UserRole.doctor)),
        Entry("medicines", "Purchase Medicines", "🛒", setOf(UserRole.patient)),
        Entry("medicine_orders", "Medicine Orders", "📋", setOf(UserRole.super_admin, UserRole.medical_vendor)),
        Entry("prescription_orders", "Prescription Orders", "💊", setOf(UserRole.super_admin, UserRole.doctor)),
        Entry("documents", "Medical Documents", "📄", setOf(UserRole.patient)),
        Entry("pharmacy_stock", "Pharmacy Stock", "📦", setOf(UserRole.super_admin, UserRole.medical_vendor, UserRole.hospital_admin, UserRole.patient)),
        Entry("prescription_upload", "Upload Prescription (AI)", "🤖", setOf(UserRole.patient)),
        Entry("ai_assist", "AI Assist", "🤖", setOf(UserRole.super_admin, UserRole.hospital_admin, UserRole.doctor, UserRole.nurse, UserRole.patient)),
        Entry("insurance_renewal", "Insurance Renewal", "🛡️", setOf(UserRole.patient)),
        Entry("bed_availability", "Bed Availability", "🛏️", setOf(UserRole.super_admin, UserRole.hospital_admin, UserRole.patient)),
        Entry("inventory", "Inventory", "📊", setOf(UserRole.super_admin, UserRole.medical_vendor, UserRole.hospital_admin)),
        Entry("restock", "Restock Request", "🔄", setOf(UserRole.super_admin, UserRole.medical_vendor, UserRole.hospital_admin, UserRole.doctor)),
        Entry("prescription_verify", "Prescription Verification", "✅", setOf(UserRole.super_admin, UserRole.medical_vendor)),
        Entry("policies", "Policy Types", "📑", setOf(UserRole.super_admin, UserRole.insurance_provider)),
        Entry("applicants", "Applicants", "👥", setOf(UserRole.super_admin, UserRole.insurance_provider)),
        Entry("policy_status", "Policy Status", "📈", setOf(UserRole.super_admin, UserRole.insurance_provider)),
        Entry("hospital_doctors", "Hospital Doctors", "👨‍⚕️", setOf(UserRole.super_admin, UserRole.hospital_admin)),
        Entry("hospital_patients", "Hospital Patients", "🏥", setOf(UserRole.super_admin, UserRole.hospital_admin)),
        Entry("hospital_pharmacy", "Hospital Pharmacy", "💉", setOf(UserRole.super_admin, UserRole.hospital_admin)),
        Entry("hospital_beds", "Beds", "🛏️", setOf(UserRole.super_admin, UserRole.hospital_admin)),
        Entry("hospital_staff", "Staff", "👔", setOf(UserRole.super_admin, UserRole.hospital_admin)),
        Entry("hospital_billing", "Billing & Dues", "💰", setOf(UserRole.super_admin, UserRole.hospital_admin)),
        Entry("receipts", "Receipts", "🧾", setOf(UserRole.super_admin, UserRole.insurance_provider, UserRole.hospital_admin, UserRole.doctor, UserRole.patient)),
        Entry("platform_testing", "Platform Testing", "🧪", setOf(UserRole.super_admin, UserRole.hospital_admin)),
        Entry("logs", "System Logs", "📜", setOf(UserRole.super_admin)),
        Entry("profile", "Profile", "⚙️", UserRole.entries.toSet()),
        Entry("notifications", "Notifications", "🔔", UserRole.entries.toSet()),
    )

    fun forRole(role: UserRole): List<MenuItem> =
        items.filter { role in it.roles }.map {
            MenuItem(
                route = it.route,
                label = it.label,
                icon = it.icon,
                description = descriptionFor(it.route, role),
                category = categoryFor(it.route),
            )
        }

    fun labelForRoute(route: String): String =
        items.find { it.route == route }?.label
            ?: route.replace('_', ' ').replaceFirstChar { it.uppercase() }

    fun summaryCards(role: UserRole): List<Pair<String, String>> = when (role) {
        UserRole.patient -> listOf("Upcoming Appointments" to "2", "My vitals" to "Overview", "Policy Status" to "Active")
        UserRole.doctor -> listOf("Queue Today" to "5", "Live telemetry" to "RPM", "Patients This Week" to "12")
        UserRole.nurse -> listOf("Monitoring rounds" to "Today", "Live vitals" to "RPM", "Assigned patients" to "Ward")
        UserRole.medical_vendor -> listOf("Low Stock Items" to "3", "Restock Requests" to "2", "Verifications Pending" to "1")
        UserRole.insurance_provider -> listOf("Active Policies" to "24", "Pending Applicants" to "5", "Expiring Soon" to "3")
        UserRole.hospital_admin -> listOf("Ward overview" to "RPM", "Telemetry devices" to "4", "Pending Dues" to "$2,400")
        UserRole.bloodbank_admin -> listOf("Pending Blood Requests" to "3", "Blood Types in Stock" to "8", "Donation Requests Sent" to "2")
        UserRole.super_admin -> listOf("Hospitals" to "All", "System Users" to "All", "Platform Logs" to "Live")
    }

    private fun descriptionFor(route: String, @Suppress("UNUSED_PARAMETER") role: UserRole): String =
        when (route) {
            "hospitals" -> "Find hospitals and book appointments"
            "appointments" -> "Book or manage appointments"
            "video_meet" -> "Join or manage video appointments"
            "ai_assist" -> "Clinical summaries and AI chat with patient context"
            "telemetry_overview" -> "Ward room tiles and vitals overview"
            "telemetry_live" -> "Live vitals charts and critical alerts"
            "medicines" -> "Order from digital prescription"
            "profile" -> "Account settings and sign out"
            else -> "Open ${items.find { it.route == route }?.label ?: route}"
        }

    private fun categoryFor(route: String): String =
        when (route) {
            "hospitals", "patients", "appointments", "video_meet", "ai_assist", "queue", "history", "records", "receipts", "scheduler" -> "Care"
            "telemetry_overview", "telemetry_live", "telemetry_devices", "telemetry_assignments" -> "Telemetry"
            "medicines", "medicine_orders", "prescription_orders", "prescribe", "pharmacy_stock", "prescription_upload", "prescription_verify", "restock", "inventory" -> "Pharmacy"
            "policies", "applicants", "policy_status", "insurance_renewal" -> "Insurance"
            "blood_requests", "blood_inventory", "donation_requests", "request_blood" -> "Blood bank"
            "hospital_application", "hospital_doctors", "hospital_patients", "hospital_pharmacy", "hospital_beds", "hospital_staff", "hospital_billing", "bed_availability" -> "Hospital admin"
            "logs" -> "System"
            "profile" -> "Account"
            "notifications" -> "Account"
            else -> "General"
        }
}
