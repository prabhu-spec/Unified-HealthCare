import { Router } from "express";
import { requireAuth } from "../lib/middleware/requireAuth";
import { requireRole } from "../lib/middleware/requireRole";
import { enforceSmartScope } from "../lib/smart/enforceSmartScope";
import { FhirClient } from "../lib/fhir/fhirClient";

const router = Router();

router.post(
  "/fhir/:resource",
  requireAuth,
  requireRole(["admin"]),
  enforceSmartScope("system/*.write"),
  async (req, res) => {
    const fhir = new FhirClient(process.env.FHIR_BASE_URL!, req.token);
    const result = await fhir.create(req.params.resource, req.body);
    res.json(result.data);
  }
);

export default router;
