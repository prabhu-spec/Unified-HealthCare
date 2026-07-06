package com.healthcare.app.data

import com.healthcare.app.domain.DashboardMenu
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive

class PlatformRepository(
    private val api: HealthcareApi = ApiClient.api,
) {
    private val json = Json { ignoreUnknownKeys = true }

    suspend fun loadFeature(route: String, user: User): FeatureContent {
        val title = DashboardMenu.labelForRoute(route)
        val description = DashboardMenu.forRole(user.role)
            .find { it.route == route }?.description.orEmpty()

        val live = tryLoadFromApi(route, user)
        if (live != null) {
            return FeatureContent(route, title, description, live, DataSource.LIVE)
        }
        return FeatureContent(
            route = route,
            title = title,
            description = description.ifBlank { "Healthcare platform feature" },
            items = offlineItems(route, user),
            dataSource = DataSource.OFFLINE,
        )
    }

    private suspend fun tryLoadFromApi(route: String, user: User): List<FeatureListItem>? {
        return try {
            when (route) {
                "hospitals" -> fetchJsonList("/api/core/hospitals", user) { obj ->
                    val address = obj.array("address")?.firstOrNull()?.jsonObject
                    FeatureListItem(
                        id = obj.string("id"),
                        title = obj.string("name").ifBlank { "Hospital" },
                        subtitle = listOf(address?.string("city"), address?.string("state"))
                            .filterNotNull()
                            .filter { it.isNotBlank() }
                            .joinToString(", "),
                        meta = obj.array("type")?.firstOrNull()?.jsonObject
                            ?.array("coding")?.firstOrNull()?.jsonObject?.string("display"),
                    )
                }
                "patients", "hospital_patients" -> fetchJsonList("/api/core/patients", user) { obj ->
                    FeatureListItem(
                        id = obj.string("id"),
                        title = obj.patientName(),
                        subtitle = listOf(obj.string("gender"), obj.string("birthDate"), obj.string("hospitalId"))
                            .filter { it.isNotBlank() }
                            .joinToString(" · "),
                        meta = obj.array("identifier")?.firstOrNull()?.jsonObject?.string("value"),
                    )
                }
                "appointments", "queue" -> fetchJsonList(
                    if (route == "queue") "/api/core/queue" else "/api/core/appointments",
                    user,
                ) { obj ->
                    val date = obj.string("date")
                    val time = obj.string("time")
                    FeatureListItem(
                        id = obj.string("id"),
                        title = "Patient ${obj.string("patientId").ifBlank { "appointment" }}",
                        subtitle = listOf(date, time, obj.string("doctorId"), obj.string("hospitalId"))
                            .filter { it.isNotBlank() }
                            .joinToString(" · "),
                        meta = obj.string("status").ifBlank { "Scheduled" },
                    )
                }
                "video_meet" -> fetchJsonList("/api/video/appointments", user) { obj ->
                    val roomName = obj.string("roomName")
                    FeatureListItem(
                        id = obj.string("id"),
                        title = obj.string("patientName").ifBlank { "Video appointment" },
                        subtitle = listOf(obj.string("date"), obj.string("time"), obj.string("hospitalName"))
                            .filter { it.isNotBlank() }
                            .joinToString(" · "),
                        meta = if (roomName.isNotBlank()) "${obj.string("status")} · room $roomName" else obj.string("status"),
                    )
                }
                "policies" -> fetchJsonList("/api/policies", user) { obj ->
                    FeatureListItem(obj.string("id"), obj.string("name"), meta = obj.string("status"))
                }
                "applicants" -> fetchJsonList("/api/applicants", user) { obj ->
                    FeatureListItem(obj.string("id"), obj.string("name"), meta = obj.string("status"))
                }
                "policy_status" -> fetchJsonList("/api/policy-status", user) { obj ->
                    FeatureListItem(
                        obj.string("id"),
                        "${obj.string("holder")} · ${obj.string("policy")}",
                        subtitle = "Due ${obj.string("dueDate")}",
                        meta = obj.string("status"),
                    )
                }
                "inventory" -> fetchJsonList("/api/inventory", user) { obj ->
                    FeatureListItem(
                        obj.string("id"),
                        obj.string("name"),
                        subtitle = "Qty ${obj.string("quantity")}",
                        meta = obj.string("status"),
                    )
                }
                "bed_availability", "hospital_beds" -> fetchJsonList("/api/beds", user) { obj ->
                    FeatureListItem(
                        obj.string("id"),
                        obj.string("ward"),
                        subtitle = "${obj.string("available")} / ${obj.string("total")} beds",
                        meta = obj.string("status"),
                    )
                }
                "blood_inventory" -> fetchJsonList("/api/blood/inventory", user) { obj ->
                    FeatureListItem(
                        id = obj.string("id"),
                        title = obj.string("type"),
                        subtitle = "${obj.string("units")} units",
                        meta = obj.string("status"),
                    )
                }
                "blood_requests", "request_blood" -> fetchJsonList("/api/blood/requests", user) { obj ->
                    FeatureListItem(
                        id = obj.string("id"),
                        title = "${obj.string("units")} units ${obj.string("bloodType")}",
                        subtitle = listOf(obj.string("requestedBy"), obj.string("urgency"))
                            .filter { it.isNotBlank() }
                            .joinToString(" · "),
                        meta = obj.string("status"),
                    )
                }
                "donation_requests" -> fetchJsonList("/api/blood/donations", user) { obj ->
                    FeatureListItem(
                        id = obj.string("id"),
                        title = obj.string("donorName"),
                        subtitle = listOf(obj.string("bloodType"), obj.string("preferredDate"))
                            .filter { it.isNotBlank() }
                            .joinToString(" · "),
                        meta = obj.string("status"),
                    )
                }
                "hospital_doctors" -> fetchJsonList("/api/hospital/doctors", user) { obj ->
                    FeatureListItem(
                        id = obj.string("id"),
                        title = obj.string("name"),
                        subtitle = obj.string("specialization"),
                        meta = obj.string("status"),
                    )
                }
                "hospital_staff" -> fetchJsonList("/api/staff/users", user) { obj ->
                    FeatureListItem(
                        id = obj.string("id").ifBlank { obj.string("email") },
                        title = "${obj.string("firstName")} ${obj.string("lastName")}".trim(),
                        subtitle = obj.string("email"),
                        meta = obj.string("role"),
                    )
                }
                "restock" -> fetchJsonList("/api/restock-requests", user) { obj ->
                    FeatureListItem(
                        id = obj.string("id"),
                        title = obj.string("item"),
                        subtitle = "Qty ${obj.string("quantity")} · ${obj.string("requestedBy")}",
                        meta = obj.string("status"),
                    )
                }
                "scheduler" -> fetchJsonList("/api/schedules", user) { obj ->
                    FeatureListItem(
                        id = obj.string("id"),
                        title = obj.string("title"),
                        subtitle = listOf(obj.string("date"), obj.string("startTime"), obj.string("staffName"))
                            .filter { it.isNotBlank() }
                            .joinToString(" · "),
                        meta = obj.string("status"),
                    )
                }
                "hospital_billing" -> fetchJsonList("/api/hospital/billing", user) { obj ->
                    FeatureListItem(
                        id = obj.string("id"),
                        title = obj.string("patientName"),
                        subtitle = "$${obj.string("amount")}",
                        meta = obj.string("status"),
                    )
                }
                "hospital_application" -> fetchJsonList("/api/hospital/applications", user) { obj ->
                    FeatureListItem(
                        id = obj.string("id"),
                        title = obj.string("hospitalName"),
                        subtitle = obj.string("applicant"),
                        meta = obj.string("status"),
                    )
                }
                "insurance_renewal" -> fetchJsonList("/api/insurance/renewals", user) { obj ->
                    FeatureListItem(
                        id = obj.string("id"),
                        title = "${obj.string("holder")} · ${obj.string("policy")}",
                        subtitle = "Due ${obj.string("dueDate")}",
                        meta = obj.string("status"),
                    )
                }
                "logs" -> fetchJsonList("/api/logs", user) { obj ->
                    FeatureListItem(
                        obj.string("id"),
                        obj.string("action"),
                        subtitle = obj.string("timestamp"),
                        meta = obj.string("userId"),
                    )
                }
                "telemetry_overview" -> fetchTelemetryOverview(user)
                "telemetry_live" -> fetchTelemetryPatients(user, includeVitals = true)
                "telemetry_devices" -> fetchTelemetryDevices(user)
                "telemetry_assignments" -> fetchTelemetryPatients(user, includeVitals = false)
                "history" -> fetchJsonList("/api/core/history", user) { obj ->
                    FeatureListItem(
                        id = obj.string("id"),
                        title = obj.string("patientName"),
                        subtitle = listOf(obj.string("date"), obj.string("type"), obj.string("provider"))
                            .filter { it.isNotBlank() }
                            .joinToString(" · "),
                        meta = obj.string("summary"),
                    )
                }
                "records" -> fetchJsonList("/api/core/records", user) { obj ->
                    FeatureListItem(
                        id = obj.string("id"),
                        title = "${obj.string("category")} · ${obj.string("name")}",
                        subtitle = obj.string("patientName"),
                        meta = obj.string("value"),
                    )
                }
                "receipts" -> fetchJsonList("/api/core/receipts", user) { obj ->
                    FeatureListItem(
                        id = obj.string("id"),
                        title = obj.string("description"),
                        subtitle = listOf(obj.string("patientName"), obj.string("date"))
                            .filter { it.isNotBlank() }
                            .joinToString(" · "),
                        meta = "$${obj.string("amount")} · ${obj.string("status")}",
                    )
                }
                "medicine_orders", "prescription_orders" -> {
                    val q = if (user.role == UserRole.patient && user.patientId != null) {
                        "?patientId=${user.patientId}"
                    } else ""
                    fetchJsonList("/api/medicine-orders$q", user) { obj ->
                        FeatureListItem(
                            obj.string("id"),
                            obj.string("medication"),
                            subtitle = obj.string("patientName"),
                            meta = obj.string("status"),
                        )
                    }
                }
                else -> null
            }
        } catch (_: Exception) {
            null
        }
    }

    private suspend fun fetchJsonList(
        path: String,
        user: User,
        map: (JsonObject) -> FeatureListItem,
    ): List<FeatureListItem>? {
        val body = api.getRaw(path, ApiHeaders.forUser(user))
        val root = body.objOrNull() ?: return null
        val array = root.array("data") ?: return null
        return array.mapNotNull { el ->
            (el as? JsonObject)?.let(map)
        }
    }

    private suspend fun fetchTelemetryOverview(user: User): List<FeatureListItem>? {
        val hospitalId = user.hospitalId ?: if (user.role == UserRole.patient) "org-1" else return null
        val path = "/api/telemetry/overview?hospitalId=$hospitalId"
        val body = api.getRaw(path, ApiHeaders.forUser(user))
        val root = body.objOrNull() ?: return null
        val rooms = root.array("rooms") ?: return null
        return rooms.mapNotNull { el ->
            runCatching {
                val room = el.jsonObject
                val patient = room.obj("patient")
                val vitals = patient?.obj("latestVitals")
                    ?: room.obj("latestVitals")
                    ?: room.obj("vitals")
                val name = patient?.string("displayName")?.ifBlank { null }
                    ?: patient?.string("fullName")?.ifBlank { null }
                    ?: patient?.string("patientId")
                    ?: "Patient"
                val hr = vitals?.metric("heartRate")
                val spo2 = vitals?.metric("spo2")
                val temp = vitals?.metric("temperature")
                val battery = vitals?.metric("battery")
                val systolic = vitals?.metric("systolic")
                val diastolic = vitals?.metric("diastolic")
                val respiration = vitals?.metric("respiration")
                val occupied = room.string("occupied").ifBlank { "false" }.toBooleanStrictOrNull() == true
                val alert = vitals?.string("alert")?.toBooleanStrictOrNull() == true
                    || room.string("alertLevel").contains("critical", ignoreCase = true)
                FeatureListItem(
                    id = room.string("room").ifBlank { name },
                    title = "Room ${room.string("room")} · $name",
                    subtitle = if (occupied) "Occupied" else "Available",
                    meta = if (alert) "Critical alert" else "Stable",
                    heartRate = hr?.toFloatOrNull(),
                    spo2 = spo2?.toFloatOrNull(),
                    temperature = temp?.toFloatOrNull(),
                    battery = battery?.toFloatOrNull(),
                    systolic = systolic?.toFloatOrNull(),
                    diastolic = diastolic?.toFloatOrNull(),
                    respiration = respiration?.toFloatOrNull(),
                    alert = alert,
                    patientId = patient?.string("patientId"),
                    room = room.string("room"),
                    fullName = name,
                )
            }.getOrNull()
        }
    }

    private suspend fun fetchTelemetryDevices(user: User): List<FeatureListItem>? {
        val hospitalId = user.hospitalId ?: return null
        val path = "/api/telemetry/devices?hospitalId=$hospitalId"
        val body = api.getRaw(path, ApiHeaders.forUser(user))
        val root = body.objOrNull()
        val data = body.arrayOrNull() ?: root?.array("devices") ?: root?.array("data")
        if (data == null) return null
        return data.mapNotNull { el ->
            val d = el.jsonObject
            FeatureListItem(
                id = d.string("deviceId").ifBlank { d.string("id") },
                title = d.string("label").ifBlank { d.string("name").ifBlank { d.string("deviceId") } },
                subtitle = listOf(d.string("type"), d.string("patientId").ifBlank { "Unassigned" })
                    .filter { it.isNotBlank() }
                    .joinToString(" · "),
                meta = d.string("status").ifBlank { if (d.string("online").toBooleanStrictOrNull() == true) "Online" else "Registered" },
            )
        }
    }

    private suspend fun fetchTelemetryPatients(user: User, includeVitals: Boolean): List<FeatureListItem>? {
        val body = api.getRaw("/api/telemetry/patients", ApiHeaders.forUser(user))
        val root = body.objOrNull()
        val data = body.arrayOrNull() ?: root?.array("patients") ?: root?.array("data")
        if (data == null) return null
        return data.mapNotNull { el ->
            val p = el.jsonObject
            val vitals = p.obj("latestVitals")
            val alert = vitals?.string("alert")?.toBooleanStrictOrNull() == true ||
                p.string("alert").toBooleanStrictOrNull() == true
            FeatureListItem(
                id = p.string("patientId"),
                title = p.string("displayName").ifBlank { p.string("fullName").ifBlank { p.string("patientId") } },
                subtitle = "Room ${p.string("room")}".takeIf { p.string("room").isNotBlank() },
                meta = if (alert) "Critical alert" else p.string("assignedDoctorId").ifBlank { "Unassigned doctor" },
                heartRate = vitals?.metric("heartRate")?.toFloatOrNull(),
                spo2 = vitals?.metric("spo2")?.toFloatOrNull(),
                temperature = vitals?.metric("temperature")?.toFloatOrNull(),
                battery = vitals?.metric("battery")?.toFloatOrNull(),
                systolic = vitals?.metric("systolic")?.toFloatOrNull(),
                diastolic = vitals?.metric("diastolic")?.toFloatOrNull(),
                respiration = vitals?.metric("respiration")?.toFloatOrNull(),
                alert = alert,
                patientId = p.string("patientId"),
                room = p.string("room"),
                fullName = p.string("fullName").ifBlank { p.string("displayName") },
            )
        }
    }

    private fun offlineItems(route: String, user: User): List<FeatureListItem> {
        val role = user.role
        fun scopeHospitals(items: List<FeatureListItem>) =
            if ((role == UserRole.hospital_admin || role == UserRole.doctor || role == UserRole.nurse) && user.hospitalId != null) {
                items.filter { it.meta?.contains(user.hospitalId!!) != false }
            } else items

        return when (route) {
            "hospitals" -> {
                val list = MockPlatformData.hospitals
                if ((role == UserRole.hospital_admin || role == UserRole.doctor || role == UserRole.nurse) && user.hospitalId != null) {
                    list.filter { it.id == user.hospitalId }
                } else list
            }
            "patients" -> {
                if (role == UserRole.patient) {
                    listOf(FeatureListItem(user.patientId ?: user.id, user.displayName, user.email, user.bloodType))
                } else MockPlatformData.patients
            }
            "appointments" -> {
                if (role == UserRole.patient) MockPlatformData.appointments.take(2)
                else MockPlatformData.appointments
            }
            "video_meet" -> MockPlatformData.videoAppointments
            "queue" -> MockPlatformData.queue
            "policies" -> MockPlatformData.policies
            "applicants" -> MockPlatformData.applicants
            "policy_status" -> MockPlatformData.policyStatus
            "inventory", "pharmacy_stock", "hospital_pharmacy" -> MockPlatformData.inventory
            "bed_availability", "hospital_beds" -> MockPlatformData.beds
            "blood_inventory" -> MockPlatformData.bloodInventory
            "blood_requests", "request_blood", "donation_requests" -> MockPlatformData.bloodRequests
            "medicines", "prescription_orders", "prescribe" -> MockPlatformData.medicines
            "telemetry_overview", "telemetry_live" -> MockPlatformData.telemetryRooms
            "telemetry_devices" -> MockPlatformData.devices
            "telemetry_assignments" -> MockPlatformData.patients.take(3)
            "receipts" -> MockPlatformData.receipts
            "hospital_doctors" -> MockPlatformData.hospitalDoctors
            "logs" -> MockPlatformData.systemLogs
            "hospital_patients" -> MockPlatformData.patients
            "profile" -> listOf(
                FeatureListItem("p", user.displayName, user.email, roleLabel(user.role)),
            )
            else -> MockPlatformData.generic(route, DashboardMenu.labelForRoute(route))
        }
    }

    private fun JsonObject.string(key: String): String =
        runCatching { this[key]?.jsonPrimitive?.content.orEmpty() }.getOrDefault("")

    private fun JsonObject.obj(key: String): JsonObject? =
        this[key] as? JsonObject

    private fun JsonObject.array(key: String): JsonArray? =
        this[key] as? JsonArray

    private fun JsonElement.objOrNull(): JsonObject? =
        this as? JsonObject

    private fun JsonElement.arrayOrNull(): JsonArray? =
        this as? JsonArray

    private fun JsonObject.metric(key: String): String? {
        val element = this[key] ?: return null
        return runCatching { element.jsonPrimitive.content }.getOrNull()
            ?: runCatching { element.jsonObject.string("value") }.getOrNull()
    }

    private fun JsonObject.patientName(): String {
        val firstName = array("name")?.firstOrNull()?.jsonObject ?: return string("id").ifBlank { "Patient" }
        val given = firstName.array("given")?.joinToString(" ") { runCatching { it.jsonPrimitive.content }.getOrDefault("") }.orEmpty()
        val family = firstName.string("family")
        return "$given $family".trim().ifBlank { string("id").ifBlank { "Patient" } }
    }

    suspend fun acceptQueueItem(user: User, appointmentId: String) {
        api.patchRaw("/api/core/queue/$appointmentId/accept", ApiHeaders.forUser(user), JsonObject(emptyMap()))
    }

    suspend fun rejectQueueItem(user: User, appointmentId: String) {
        api.patchRaw("/api/core/queue/$appointmentId/reject", ApiHeaders.forUser(user), JsonObject(emptyMap()))
    }

    suspend fun fetchPatientDetail(user: User, patientId: String): FeatureContent? {
        val body = api.getRaw("/api/core/patients/$patientId", ApiHeaders.forUser(user))
        val root = body.objOrNull()?.obj("data") ?: body.objOrNull() ?: return null
        val patient = root.obj("patient") ?: root
        val name = patient.patientName()
        val items = mutableListOf(
            FeatureListItem(patient.string("id"), name, patient.string("gender"), patient.string("birthDate")),
        )
        root.array("history")?.forEach { el ->
            val h = el.jsonObject
            items.add(FeatureListItem(h.string("id"), h.string("type"), h.string("date"), h.string("summary")))
        }
        root.array("records")?.forEach { el ->
            val r = el.jsonObject
            items.add(FeatureListItem(r.string("id"), r.string("name"), r.string("category"), r.string("value")))
        }
        return FeatureContent("patient_detail", name, "Patient detail from AWS", items, DataSource.LIVE)
    }

    suspend fun fetchTelemetryRoom(user: User, room: String?, patientId: String?): FeatureContent? {
        val hospitalId = user.hospitalId ?: "org-1"
        val resolvedRoom = room?.ifBlank { null } ?: run {
            if (patientId.isNullOrBlank()) return null
            val patientsBody = api.getRaw("/api/telemetry/patients", ApiHeaders.forUser(user))
            val data = patientsBody.arrayOrNull()
                ?: patientsBody.objOrNull()?.array("patients")
                ?: return null
            data.mapNotNull { it as? JsonObject }
                .find { it.string("patientId") == patientId }
                ?.string("room")
                ?.ifBlank { null }
        } ?: return null

        val body = api.getRaw(
            "/api/telemetry/overview/rooms/$resolvedRoom?hospitalId=$hospitalId",
            ApiHeaders.forUser(user),
        )
        val roomObj = body.objOrNull() ?: return null
        if (roomObj.string("error").isNotBlank()) return null
        val patient = roomObj.obj("patient") ?: return null
        val vitals = patient.obj("latestVitals")
        val name = patient.string("fullName").ifBlank { patient.string("patientId") }
        val alert = vitals?.string("alert")?.toBooleanStrictOrNull() == true
        val item = FeatureListItem(
            id = patient.string("patientId"),
            title = name,
            subtitle = "Room $resolvedRoom · ${patient.string("patientId")}",
            meta = if (alert) "Critical alert" else "Stable",
            heartRate = vitals?.metric("heartRate")?.toFloatOrNull(),
            spo2 = vitals?.metric("spo2")?.toFloatOrNull(),
            temperature = vitals?.metric("temperature")?.toFloatOrNull(),
            battery = vitals?.metric("battery")?.toFloatOrNull(),
            systolic = vitals?.metric("systolic")?.toFloatOrNull(),
            diastolic = vitals?.metric("diastolic")?.toFloatOrNull(),
            respiration = vitals?.metric("respiration")?.toFloatOrNull(),
            alert = alert,
            patientId = patient.string("patientId"),
            room = resolvedRoom,
            fullName = name,
        )
        return FeatureContent(
            route = "telemetry_room",
            title = "Room $resolvedRoom",
            description = name,
            items = listOf(item),
            dataSource = DataSource.LIVE,
        )
    }

    suspend fun createAppointment(user: User): Boolean = runCatching {
        api.postRaw(
            "/api/core/appointments",
            ApiHeaders.forUser(user),
            buildJsonObject {
                put("patientId", JsonPrimitive(user.patientId ?: "patient-1"))
                put("patientName", JsonPrimitive(user.displayName))
                put("hospitalId", JsonPrimitive(user.hospitalId ?: "org-1"))
                put("date", JsonPrimitive("2026-05-30"))
                put("time", JsonPrimitive("10:00"))
                put("type", JsonPrimitive("Consultation"))
            },
        )
        true
    }.getOrDefault(false)

    suspend fun fetchPlatformStatus(user: User): Result<PlatformStatus> = runCatching {
        val body = api.getRaw("/api/platform/status", ApiHeaders.forUser(user))
        val root = body.objOrNull() ?: error("Invalid response")
        val features = root.array("features")?.mapNotNull { el ->
            val o = el.jsonObject
            PlatformFeature(
                id = o.string("id"),
                label = o.string("label"),
                api = o.string("api"),
                phase = o.string("phase").toIntOrNull() ?: 0,
                roles = o.array("roles")?.joinToString { it.jsonPrimitive.content } ?: "",
            )
        } ?: emptyList()
        PlatformStatus(
            phase = root.string("phase").toIntOrNull() ?: 0,
            phaseLabel = root.string("phaseLabel"),
            storage = root.string("storage"),
            demoPassword = root.string("demoPassword"),
            features = features,
        )
    }

    suspend fun submitBloodRequest(user: User): Boolean = runCatching {
        api.postRaw(
            "/api/blood/requests",
            ApiHeaders.forUser(user),
            buildJsonObject {
                put("bloodType", JsonPrimitive("O+"))
                put("units", JsonPrimitive(2))
                put("hospitalId", JsonPrimitive(user.hospitalId ?: "org-1"))
                put("urgency", JsonPrimitive("Urgent"))
            },
        )
        true
    }.getOrDefault(false)
}

object ApiHeaders {
    fun forUser(user: User): Map<String, String> = buildMap {
        AuthTokenHolder.accessToken?.takeIf { it.isNotBlank() }?.let {
            put("Authorization", "Bearer $it")
        }
        put("x-role", user.role.name)
        put("x-user-email", user.email)
        put("x-user-id", user.id.ifBlank { user.email })
        user.hospitalId?.let { put("x-hospital-id", it) }
        user.patientId?.let { put("x-patient-id", it) }
    }
}
