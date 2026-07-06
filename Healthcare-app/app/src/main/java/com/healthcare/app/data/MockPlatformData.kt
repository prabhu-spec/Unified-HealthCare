package com.healthcare.app.data

object MockPlatformData {
    val hospitals = listOf(
        FeatureListItem("org-1", "Southeast Health Medical Center", "DOTHAN, AL", "★ 4.0 · (334) 793-8701"),
        FeatureListItem("org-2", "Flowers Hospital", "DOTHAN, AL", "★ 4.2 · Acute Care"),
    )

    val patients = listOf(
        FeatureListItem("patient-1", "John Michael Smith", "MRN123456", "Male · Springfield, IL"),
        FeatureListItem("patient-2", "Sarah Elizabeth Johnson", "MRN789012", "Female · Springfield, IL"),
        FeatureListItem("patient-3", "Robert James Williams", "MRN345678", "Male · Dothan, AL"),
        FeatureListItem("patient-4", "Maria Carmen Davis", "MRN901234", "Female · Florence, AL"),
    )

    val appointments = listOf(
        FeatureListItem("apt-1", "Dr. Sarah Johnson · General", "2025-03-10 10:00", "Southeast Health · scheduled"),
        FeatureListItem("apt-2", "Dr. Sarah Johnson · General", "2025-03-11 14:30", "Southeast Health · scheduled"),
        FeatureListItem("apt-3", "Dr. Murray Baker · Ortho", "2025-03-15 09:00", "Flowers Hospital · completed"),
    )

    val videoAppointments = listOf(
        FeatureListItem("vc-1", "John Doe video consult", "General · Southeast Health", "Pending doctor acceptance"),
        FeatureListItem("vc-2", "Sarah Johnson follow-up", "General · Southeast Health", "Accepted · room vc-2"),
    )

    val queue = listOf(
        FeatureListItem("q-1", "John Smith", "10:00 · Pending", "General · org-1"),
        FeatureListItem("q-2", "Sarah Johnson", "11:00 · Accepted", "General · org-1"),
    )

    val policies = listOf(
        FeatureListItem("pol-1", "Health Basic", meta = "Active"),
        FeatureListItem("pol-2", "Health Plus", meta = "Active"),
    )

    val applicants = listOf(
        FeatureListItem("app-1", "Alice", "Health Basic", "Pending"),
        FeatureListItem("app-2", "Bob", "Health Plus", "Approved"),
    )

    val policyStatus = listOf(
        FeatureListItem("ps-1", "John · Health Plus", "Due 2025-12-31", "Active"),
        FeatureListItem("ps-2", "Jane · Health Basic", "Due 2025-03-15", "Pending"),
    )

    val inventory = listOf(
        FeatureListItem("inv-1", "Amoxicillin", "Qty 120", "In-stock"),
        FeatureListItem("inv-2", "Paracetamol", "Qty 5", "Low stock"),
    )

    val beds = listOf(
        FeatureListItem("bed-1", "General Ward", "8 / 50 available", "Available"),
        FeatureListItem("bed-2", "ICU", "0 / 10 available", "Full"),
    )

    val bloodInventory = listOf(
        FeatureListItem("b-A+", "A+", "12 units", "In stock"),
        FeatureListItem("b-O-", "O-", "3 units", "Low"),
    )

    val bloodRequests = listOf(
        FeatureListItem("br-1", "2 units O+", "Southeast Health", "Urgent"),
        FeatureListItem("br-2", "1 unit AB-", "Flowers Hospital", "Pending"),
    )

    val medicines = listOf(
        FeatureListItem("med-1", "Amoxicillin 500mg", "Twice daily · 7 days", "In stock"),
        FeatureListItem("med-2", "Lisinopril 10mg", "Once daily", "Prescription required"),
    )

    val telemetryRooms = listOf(
        FeatureListItem("room-101", "Room 101 · John Doe", "HR 72 · SpO2 98%", "Stable"),
        FeatureListItem("room-102", "Room 102 · Sarah Johnson", "HR 88 · SpO2 95%", "Watch"),
        FeatureListItem("room-103", "Room 103 · Robert Williams", "HR 110 · SpO2 91%", "Critical alert"),
    )

    val devices = listOf(
        FeatureListItem("dev-1", "IoMT Watch #A12", "Assigned · Room 101", "Online"),
        FeatureListItem("dev-2", "IoMT Watch #B07", "Unassigned", "Online"),
    )

    val receipts = listOf(
        FeatureListItem("rcpt-1", "Pharmacy · $24.50", "2025-03-01", "Paid"),
        FeatureListItem("rcpt-2", "Lab work · $120.00", "2025-02-15", "Insurance pending"),
    )

    val hospitalDoctors = listOf(
        FeatureListItem("doc-1", "Dr. Sarah Johnson", "General", "org-1"),
        FeatureListItem("doc-2", "Dr. Murray Baker", "Orthopedics", "org-2"),
    )

    val systemLogs = listOf(
        FeatureListItem("log-1", "Login", "doctor@demo.com", "Auth"),
    )

    fun generic(route: String, label: String): List<FeatureListItem> = listOf(
        FeatureListItem("$route-1", "$label item 1", "Demo data — same as web app", "Available offline"),
        FeatureListItem("$route-2", "$label item 2", "Book / manage from this screen", "Syncs when backend is online"),
    )
}
