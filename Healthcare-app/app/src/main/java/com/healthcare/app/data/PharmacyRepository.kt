package com.healthcare.app.data

import com.healthcare.app.data.ApiClient.getRaw
import com.healthcare.app.data.ApiClient.patchRaw
import com.healthcare.app.data.ApiClient.postRaw
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive

data class PharmacyRecord(
    val id: String,
    val title: String,
    val subtitle: String,
    val status: String,
    val medication: String = "",
    val dosage: String = "",
)

class PharmacyRepository(
    private val api: HealthcareApi = ApiClient.api,
) {
    suspend fun prescriptions(user: User): List<PharmacyRecord> {
        val query = if (user.role == UserRole.patient && user.patientId != null) "?patientId=${user.patientId}" else ""
        return list("/api/prescriptions$query", user) { obj ->
            PharmacyRecord(
                id = obj.string("id"),
                title = obj.string("medication"),
                subtitle = "${obj.string("dosage")} · ${obj.string("prescribedBy")}",
                status = obj.string("status"),
                medication = obj.string("medication"),
                dosage = obj.string("dosage"),
            )
        }
    }

    suspend fun issuePrescription(user: User, patientId: String, patientName: String, medication: String, dosage: String) {
        api.postRaw(
            "/api/prescriptions",
            ApiHeaders.forUser(user),
            JsonObject(
                mapOf(
                    "patientId" to JsonPrimitive(patientId),
                    "patientName" to JsonPrimitive(patientName),
                    "medication" to JsonPrimitive(medication),
                    "dosage" to JsonPrimitive(dosage),
                    "prescribedBy" to JsonPrimitive(user.displayName.ifBlank { "Doctor" }),
                    "prescribedByEmail" to JsonPrimitive(user.email),
                ),
            ),
        )
    }

    suspend fun orders(user: User): List<PharmacyRecord> {
        val query = if (user.role == UserRole.patient && user.patientId != null) "?patientId=${user.patientId}" else ""
        return list("/api/medicine-orders$query", user) { obj ->
            PharmacyRecord(
                id = obj.string("id"),
                title = obj.string("medication"),
                subtitle = listOf(obj.string("dosage"), obj.string("patientName"), obj.string("rejectionReason"))
                    .filter { it.isNotBlank() }
                    .joinToString(" · "),
                status = obj.string("status"),
                medication = obj.string("medication"),
                dosage = obj.string("dosage"),
            )
        }
    }

    suspend fun orderPrescription(user: User, prescription: PharmacyRecord) {
        api.postRaw(
            "/api/medicine-orders",
            ApiHeaders.forUser(user),
            JsonObject(
                mapOf(
                    "patientId" to JsonPrimitive(user.patientId ?: user.id),
                    "patientName" to JsonPrimitive(user.displayName.ifBlank { user.email }),
                    "medication" to JsonPrimitive(prescription.medication.ifBlank { prescription.title }),
                    "dosage" to JsonPrimitive(prescription.dosage),
                    "prescribedBy" to JsonPrimitive(prescription.subtitle.substringAfter(" · ", "Doctor")),
                ),
            ),
        )
    }

    suspend fun acceptOrder(user: User, id: String) {
        api.patchRaw("/api/medicine-orders/$id/accept", ApiHeaders.forUser(user), JsonObject(emptyMap()))
    }

    suspend fun rejectOrder(user: User, id: String) {
        api.patchRaw(
            "/api/medicine-orders/$id/reject",
            ApiHeaders.forUser(user),
            JsonObject(mapOf("reason" to JsonPrimitive("Medicine unavailable"))),
        )
    }

    suspend fun stock(user: User): List<PharmacyRecord> =
        list("/api/pharmacy-stock", user) { obj ->
            PharmacyRecord(
                id = obj.string("id"),
                title = obj.string("name"),
                subtitle = "Qty ${obj.string("quantity")} · reorder at ${obj.string("reorderLevel")}",
                status = obj.string("status"),
            )
        }

    suspend fun restockRequests(user: User): List<PharmacyRecord> =
        list("/api/restock-requests", user) { obj ->
            PharmacyRecord(
                id = obj.string("id"),
                title = obj.string("item"),
                subtitle = "Qty ${obj.string("quantity")} · ${obj.string("hospitalId")}",
                status = obj.string("status"),
            )
        }

    suspend fun requestRestock(user: User, item: String, quantity: Int) {
        api.postRaw(
            "/api/restock-requests",
            ApiHeaders.forUser(user),
            JsonObject(
                mapOf(
                    "item" to JsonPrimitive(item),
                    "quantity" to JsonPrimitive(quantity),
                    "hospitalId" to JsonPrimitive(user.hospitalId ?: "org-1"),
                    "requestedBy" to JsonPrimitive(user.email),
                ),
            ),
        )
    }

    suspend fun approveRestock(user: User, id: String) {
        api.patchRaw("/api/restock-requests/$id/approve", ApiHeaders.forUser(user), JsonObject(emptyMap()))
    }

    suspend fun rejectRestock(user: User, id: String) {
        api.patchRaw("/api/restock-requests/$id/reject", ApiHeaders.forUser(user), JsonObject(emptyMap()))
    }

    suspend fun verifications(user: User): List<PharmacyRecord> =
        list("/api/prescription-verifications", user) { obj ->
            PharmacyRecord(
                id = obj.string("id"),
                title = obj.string("patientName"),
                subtitle = obj.string("prescription"),
                status = obj.string("status"),
            )
        }

    suspend fun verifyPrescription(user: User, id: String) {
        api.patchRaw("/api/prescription-verifications/$id/verify", ApiHeaders.forUser(user), JsonObject(emptyMap()))
    }

    private suspend fun list(path: String, user: User, map: (JsonObject) -> PharmacyRecord): List<PharmacyRecord> {
        val body = api.getRaw(path, ApiHeaders.forUser(user))
        val root = body as? JsonObject ?: return emptyList()
        return root["data"]?.jsonArray?.mapNotNull { element ->
            runCatching { map(element.jsonObject) }.getOrNull()
        }.orEmpty()
    }

    private fun JsonObject.string(key: String): String =
        runCatching { this[key]?.jsonPrimitive?.content.orEmpty() }.getOrDefault("")
}
