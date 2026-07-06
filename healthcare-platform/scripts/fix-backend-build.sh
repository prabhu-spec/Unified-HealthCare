#!/bin/bash
set -e

# ----------------------------------------------------
# Always resolve repo root (works from anywhere)
# ----------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "===================================================="
echo " FIX BACKEND BUILD (TS + DOCKER + ECS READY)"
echo "===================================================="
echo "📁 Repo root: $REPO_ROOT"

BACKEND_DIR="$REPO_ROOT/backend"
PLATFORM_CORE_DIR="$REPO_ROOT/platform-core"

# ----------------------------------------------------
# 1️⃣ Move shared libs if they exist
# ----------------------------------------------------
if [ -d "$BACKEND_DIR/src/lib" ]; then
  echo "🔀 Moving backend/src/lib → platform-core/shared"
  mkdir -p "$PLATFORM_CORE_DIR/shared"
  mv "$BACKEND_DIR/src/lib" "$PLATFORM_CORE_DIR/shared/"
  echo "✅ Shared libs moved"
else
  echo "ℹ️ No backend/src/lib found — skipping"
fi

# ----------------------------------------------------
# 2️⃣ Ensure backend directories exist
# ----------------------------------------------------
mkdir -p "$BACKEND_DIR/src/routes" "$BACKEND_DIR/src/services"

# ----------------------------------------------------
# 3️⃣ Write tsconfig.json (authoritative)
# ----------------------------------------------------
echo "🧠 Writing backend/tsconfig.json"

cat << 'EOF' > "$BACKEND_DIR/tsconfig.json"
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Node",
    "outDir": "dist",
    "rootDir": "src",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true
  },
  "include": [
    "src/server.ts",
    "src/routes/**/*",
    "src/services/**/*"
  ]
}
EOF

echo "✅ tsconfig.json updated"

# ----------------------------------------------------
# 4️⃣ Ensure backend server exists
# ----------------------------------------------------
SERVER="$BACKEND_DIR/src/server.ts"

if [ ! -f "$SERVER" ]; then
  echo "🚀 Creating backend/src/server.ts"
  cat << 'EOF' > "$SERVER"
import express from "express";

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

const PORT = Number(process.env.PORT) || 5000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
EOF
fi

# ----------------------------------------------------
# 5️⃣ Write Dockerfile (backend-only build)
# ----------------------------------------------------
echo "🐳 Writing backend/Dockerfile"

cat << 'EOF' > "$BACKEND_DIR/Dockerfile"
FROM node:18-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY tsconfig.json ./
COPY src/server.ts ./src/server.ts
COPY src/routes ./src/routes
COPY src/services ./src/services

RUN npm run build

FROM node:18-alpine
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

COPY package*.json ./
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist

EXPOSE 5000
CMD ["node", "dist/server.js"]
EOF

echo ""
echo "===================================================="
echo " ✅ BACKEND BUILD FIX COMPLETE"
echo "===================================================="
echo ""
echo "NEXT:"
echo "  ./scripts/deploy-all.sh"

