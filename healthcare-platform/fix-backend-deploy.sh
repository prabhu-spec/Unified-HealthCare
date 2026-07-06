#!/usr/bin/env bash
set -euo pipefail

echo "===================================================="
echo " FIXING BACKEND TYPESCRIPT + DOCKER BUILD"
echo "===================================================="

BACKEND_DIR="backend"

# -----------------------------------------------------
# 1. Ensure Express Request typing exists
# -----------------------------------------------------
echo "▶ Adding Express Request type augmentation"

mkdir -p "$BACKEND_DIR/src/types"

cat > "$BACKEND_DIR/src/types/express.d.ts" <<'EOF'
import "express";

declare global {
  namespace Express {
    interface Request {
      token?: string;
      user?: any;
      tenantId?: string;
    }
  }
}
EOF

echo "✔ Express Request types added"

# -----------------------------------------------------
# 2. Patch tsconfig.json to include custom types
# -----------------------------------------------------
echo "▶ Ensuring tsconfig includes custom type roots"

if ! grep -q '"typeRoots"' "$BACKEND_DIR/tsconfig.json"; then
  tmp=$(mktemp)
  jq '.compilerOptions.typeRoots=["./node_modules/@types","./src/types"]' \
    "$BACKEND_DIR/tsconfig.json" > "$tmp"
  mv "$tmp" "$BACKEND_DIR/tsconfig.json"
  echo "✔ tsconfig.json updated"
else
  echo "✔ tsconfig.json already configured"
fi

# -----------------------------------------------------
# 3. Fix Dockerfile (copy entire src)
# -----------------------------------------------------
echo "▶ Fixing Dockerfile"

cat > "$BACKEND_DIR/Dockerfile" <<'EOF'
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

# ✅ COPY ALL SOURCE FILES
COPY src ./src
COPY tsconfig.json ./

RUN npm run build

# ---------------- Runtime image ----------------
FROM node:18-alpine

WORKDIR /app

COPY --from=build /app/dist ./dist
COPY package*.json ./

RUN npm install --production

EXPOSE 3000

CMD ["node", "dist/index.js"]
EOF

echo "✔ Dockerfile fixed"

# -----------------------------------------------------
# 4. Verify local TypeScript build
# -----------------------------------------------------
echo "▶ Verifying local backend build"

cd "$BACKEND_DIR"
npm install
npm run build

cd ..

echo ""
echo "===================================================="
echo " ✅ BACKEND FIX COMPLETE"
echo "===================================================="
echo "You can now safely run:"
echo "  docker build backend"
echo "  ./deploy.sh"
echo ""

