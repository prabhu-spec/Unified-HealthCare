#!/usr/bin/env bash
set -e

echo "===================================================="
echo " PHASE 4 — FHIR + SMART-on-FHIR APIs"
echo "===================================================="

BACKEND_DIR="backend/src"
FHIR_DIR="$BACKEND_DIR/lib/fhir"
ROUTES_DIR="$BACKEND_DIR/routes"
SMART_DIR="$BACKEND_DIR/lib/smart"

mkdir -p "$FHIR_DIR" "$ROUTES_DIR" "$SMART_DIR"

# ---------------------------
# 1️⃣ FHIR CLIENT (GENERIC)
# ---------------------------
cat > "$FHIR_DIR/fhirClient.ts" <<'EOF'
import axios from "axios";

export class FhirClient {
  constructor(
    private baseUrl: string,
    private token?: string
  ) {}

  async get(resource: string, id?: string) {
    return axios.get(
      `${this.baseUrl}/${resource}${id ? "/" + id : ""}`,
      { headers: this.headers() }
    );
  }

  async search(resource: string, params: any) {
    return axios.get(
      `${this.baseUrl}/${resource}`,
      { params, headers: this.headers() }
    );
  }

  async create(resource: string, body: any) {
    return axios.post(
      `${this.baseUrl}/${resource}`,
      body,
      { headers: this.headers() }
    );
  }

  private headers() {
    return this.token
      ? { Authorization: `Bearer ${this.token}` }
      : {};
  }
}
EOF

# ---------------------------
# 2️⃣ SMART-on-FHIR SCOPE MAP
# ---------------------------
cat > "$SMART_DIR/scopes.ts" <<'EOF'
export const SMART_SCOPES = {
  patient: [
    "patient/Patient.read",
    "patient/Observation.read",
    "patient/Condition.read"
  ],
  provider: [
    "user/Patient.read",
    "user/Observation.read",
    "user/Condition.read",
    "user/Encounter.read"
  ],
  admin: ["system/*.read", "system/*.write"]
};
EOF

# ---------------------------
# 3️⃣ SMART AUTH CHECK
# ---------------------------
cat > "$SMART_DIR/enforceSmartScope.ts" <<'EOF'
import { Request, Response, NextFunction } from "express";

export function enforceSmartScope(required: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const scopes: string[] =
      req.user?.scope?.split(" ") || [];

    if (!scopes.includes(required)) {
      return res.status(403).json({
        error: "Missing SMART scope",
        required
      });
    }
    next();
  };
}
EOF

# ---------------------------
# 4️⃣ FHIR ROUTES (PATIENT)
# ---------------------------
cat > "$ROUTES_DIR/fhirPatient.ts" <<'EOF'
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
EOF

# ---------------------------
# 5️⃣ FHIR ROUTES (PROVIDER)
# ---------------------------
cat > "$ROUTES_DIR/fhirProvider.ts" <<'EOF'
import { Router } from "express";
import { requireAuth } from "../lib/middleware/requireAuth";
import { requireRole } from "../lib/middleware/requireRole";
import { enforceTenant } from "../lib/middleware/enforceTenant";
import { enforceSmartScope } from "../lib/smart/enforceSmartScope";
import { FhirClient } from "../lib/fhir/fhirClient";

const router = Router();

router.get(
  "/fhir/Observation",
  requireAuth,
  enforceTenant,
  requireRole(["provider", "admin"]),
  enforceSmartScope("user/Observation.read"),
  async (req, res) => {
    const fhir = new FhirClient(process.env.FHIR_BASE_URL!, req.token);
    const result = await fhir.search("Observation", req.query);
    res.json(result.data);
  }
);

export default router;
EOF

# ---------------------------
# 6️⃣ SYSTEM / ADMIN ACCESS
# ---------------------------
cat > "$ROUTES_DIR/fhirAdmin.ts" <<'EOF'
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
EOF

echo ""
echo "===================================================="
echo " PHASE 4 FHIR SETUP COMPLETE"
echo "===================================================="
echo ""
echo "NEXT:"
echo "1️⃣ Add FHIR routes to server.ts"
echo "2️⃣ Set env:"
echo "   FHIR_BASE_URL=https://hapi.fhir.org/baseR4"
echo "3️⃣ Enable SMART scopes in Cognito / Keycloak"
echo ""
echo "READY FOR PHASE 5 — FRONTEND SMART-on-FHIR 🚀"

