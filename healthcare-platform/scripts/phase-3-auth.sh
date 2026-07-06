#!/usr/bin/env bash
set -e

echo "===================================================="
echo " PHASE 3 — AUTHENTICATION (JWT + RBAC)"
echo "===================================================="

BACKEND_DIR="backend/src"
SHARED_DIR="$BACKEND_DIR/lib/auth"
MIDDLEWARE_DIR="$BACKEND_DIR/lib/middleware"
AUDIT_DIR="$BACKEND_DIR/lib/audit"

mkdir -p "$SHARED_DIR" "$MIDDLEWARE_DIR" "$AUDIT_DIR"

# ---------------------------
# 1️⃣ JWT VERIFIER (COGNITO)
# ---------------------------
cat > "$SHARED_DIR/jwt.ts" <<'EOF'
import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";

const client = jwksClient({
  jwksUri: process.env.JWT_JWKS_URI!,
});

function getKey(header: any, callback: any) {
  client.getSigningKey(header.kid, (err, key) => {
    const signingKey = key?.getPublicKey();
    callback(null, signingKey);
  });
}

export function verifyJwt(token: string): Promise<any> {
  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      getKey,
      {
        issuer: process.env.JWT_ISSUER,
        audience: process.env.JWT_AUDIENCE,
      },
      (err, decoded) => {
        if (err) reject(err);
        else resolve(decoded);
      }
    );
  });
}
EOF

# ---------------------------
# 2️⃣ AUTH MIDDLEWARE
# ---------------------------
cat > "$MIDDLEWARE_DIR/requireAuth.ts" <<'EOF'
import { Request, Response, NextFunction } from "express";
import { verifyJwt } from "../auth/jwt";

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing token" });
  }

  try {
    const token = auth.replace("Bearer ", "");
    const claims = await verifyJwt(token);
    (req as any).user = claims;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}
EOF

# ---------------------------
# 3️⃣ ROLE-BASED ACCESS
# ---------------------------
cat > "$MIDDLEWARE_DIR/requireRole.ts" <<'EOF'
import { Request, Response, NextFunction } from "express";

export function requireRole(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user || !roles.includes(user["custom:role"])) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}
EOF

# ---------------------------
# 4️⃣ TENANT ENFORCEMENT
# ---------------------------
cat > "$MIDDLEWARE_DIR/enforceTenant.ts" <<'EOF'
import { Request, Response, NextFunction } from "express";

export function enforceTenant(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const tenant = req.headers["x-tenant-id"];
  const user = (req as any).user;

  if (!tenant || user["custom:tenant"] !== tenant) {
    return res.status(403).json({ error: "Invalid tenant" });
  }
  next();
}
EOF

# ---------------------------
# 5️⃣ AUDIT LOGGING (HIPAA)
# ---------------------------
cat > "$AUDIT_DIR/audit.ts" <<'EOF'
export function auditLog(event: {
  userId: string;
  action: string;
  resource: string;
  tenant: string;
}) {
  console.log(JSON.stringify({
    ...event,
    timestamp: new Date().toISOString(),
  }));
}
EOF

# ---------------------------
# 6️⃣ SAMPLE PROTECTED ROUTE
# ---------------------------
ROUTES_DIR="$BACKEND_DIR/routes"
mkdir -p "$ROUTES_DIR"

cat > "$ROUTES_DIR/secure.ts" <<'EOF'
import { Router } from "express";
import { requireAuth } from "../lib/middleware/requireAuth";
import { requireRole } from "../lib/middleware/requireRole";
import { enforceTenant } from "../lib/middleware/enforceTenant";

const router = Router();

router.get(
  "/secure/health",
  requireAuth,
  enforceTenant,
  requireRole(["admin", "provider"]),
  (_req, res) => {
    res.json({ status: "secure ok" });
  }
);

export default router;
EOF

echo ""
echo "===================================================="
echo " PHASE 3 AUTH SETUP COMPLETE"
echo "===================================================="
echo ""
echo "NEXT:"
echo "1️⃣ Add env vars to ECS:"
echo "   JWT_JWKS_URI"
echo "   JWT_ISSUER"
echo "   JWT_AUDIENCE"
echo ""
echo "2️⃣ Import secure routes in server.ts"
echo "3️⃣ Enable Cognito or plug in Keycloak"
echo ""
echo "READY FOR PHASE 4 — FHIR APIs 🚀"

