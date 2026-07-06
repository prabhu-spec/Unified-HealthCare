import { Router } from "express";
import { requireAuth } from "../lib/middleware/requireAuth";
import { requireRole } from "../lib/middleware/requireRole";
import { enforceTenant } from "../lib/middleware/enforceTenant";
import { enforceSmartScope } from "../lib/smart/enforceSmartScope";
import { FhirClient } from "../lib/fhir/fhirClient";

const router = Router();

router.get(
  "/fhir/Patient/:id",
  requireAuth,
  enforceTenant,
  requireRole(["patient", "provider", "admin"]),
  enforceSmartScope("patient/Patient.read"),
  async (req, res) => {
    const fhir = new FhirClient(process.env.FHIR_BASE_URL!, req.token);
    const result = await fhir.get("Patient", req.params.id);
    res.json(result.data);
  }
);

export default router;
