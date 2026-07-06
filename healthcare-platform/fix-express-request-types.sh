#!/usr/bin/env bash
set -euo pipefail

echo "===================================================="
echo " FINAL FIX: EXPRESS REQUEST TYPES"
echo "===================================================="

BACKEND="backend"

cd "$BACKEND"

# -----------------------------------------------------
# 1. Ensure express.d.ts exists (idempotent)
# -----------------------------------------------------
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

echo "✔ express.d.ts ensured"

# -----------------------------------------------------
# 2. Ensure tsconfig.json includes src
# -----------------------------------------------------
echo "▶ Fixing tsconfig.json include + typeRoots"

tmp=$(mktemp)

jq '
.compilerOptions.typeRoots = ["./node_modules/@types","./src/types"]
| .include = ["src/**/*.ts","src/**/*.tsx"]
' tsconfig.json > "$tmp"

mv "$tmp" tsconfig.json

echo "✔ tsconfig.json fixed"

# -----------------------------------------------------
# 3. Force-load augmentation via reference
# -----------------------------------------------------
GLOBAL_FILE="src/global.d.ts"

cat > "$GLOBAL_FILE" <<'EOF'
/// <reference path="./types/express.d.ts" />
EOF

echo "✔ global.d.ts reference added"

# -----------------------------------------------------
# 4. Clean TS cache + rebuild
# -----------------------------------------------------
echo "▶ Rebuilding backend"

rm -rf dist
npm run build

cd ..

echo ""
echo "===================================================="
echo " ✅ EXPRESS REQUEST TYPES FIXED"
echo "===================================================="
echo "Next steps:"
echo "  docker build -t healthcare-backend backend"
echo "  ./deploy.sh"
echo ""

