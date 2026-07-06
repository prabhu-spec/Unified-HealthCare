#!/usr/bin/env bash
set -euo pipefail

echo "===================================================="
echo " FIXING BACKEND DEPENDENCIES + TYPESCRIPT ERRORS"
echo "===================================================="

BACKEND="backend"

cd "$BACKEND"

# -----------------------------------------------------
# 1. Install missing runtime dependencies
# -----------------------------------------------------
echo "▶ Installing runtime dependencies"
npm install jsonwebtoken jwks-rsa axios

# -----------------------------------------------------
# 2. Install missing type definitions
# -----------------------------------------------------
echo "▶ Installing TypeScript type definitions"
npm install -D @types/jsonwebtoken @types/express @types/node

# -----------------------------------------------------
# 3. Express Request augmentation (complete + safe)
# -----------------------------------------------------
echo "▶ Fixing Express Request typing"

mkdir -p src/types

cat > src/types/express.d.ts <<'EOF'
import "express";

declare global {
  namespace Express {
    interface User {
      scope?: string;
      [key: string]: any;
    }

    interface Request {
      token?: string;
      user?: User;
      tenantId?: string;
    }
  }
}

export {};
EOF

echo "✔ Express Request augmented"

# -----------------------------------------------------
# 4. Ensure tsconfig includes type roots
# -----------------------------------------------------
echo "▶ Ensuring tsconfig.json includes custom types"

if ! grep -q '"typeRoots"' tsconfig.json; then
  tmp=$(mktemp)
  jq '.compilerOptions.typeRoots=["./node_modules/@types","./src/types"]' \
    tsconfig.json > "$tmp"
  mv "$tmp" tsconfig.json
  echo "✔ tsconfig.json updated"
else
  echo "✔ tsconfig.json already configured"
fi

# -----------------------------------------------------
# 5. Fix implicit any callbacks (safe patch)
# -----------------------------------------------------
echo "▶ Patching jwt callback typing"

JWT_FILE="src/lib/auth/jwt.ts"

if [ -f "$JWT_FILE" ]; then
  sed -i.bak \
    -e 's/(err, key)/(err: Error | null, key: any)/' \
    -e 's/(err, decoded)/(err: Error | null, decoded: any)/' \
    "$JWT_FILE"
  rm -f "$JWT_FILE.bak"
  echo "✔ jwt.ts callbacks typed"
fi

# -----------------------------------------------------
# 6. Verify TypeScript build
# -----------------------------------------------------
echo "▶ Running TypeScript build"
npm run build

cd ..

echo ""
echo "===================================================="
echo " ✅ BACKEND TYPESCRIPT FIX COMPLETE"
echo "===================================================="
echo "Next steps:"
echo "  docker build backend"
echo "  ./deploy.sh"
echo ""

