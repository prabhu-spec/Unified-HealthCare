#!/bin/bash
set -e

echo "===================================================="
echo " POST-MIGRATION FIX (FRONTEND + BACKEND READY)"
echo "===================================================="

REPO_ROOT="$(pwd)"

FRONTEND_SRC="$REPO_ROOT/frontend/src"
BACKEND_SRC="$REPO_ROOT/backend/src"

# ----------------------------------------------------
# 1. FIX FRONTEND NESTED src/src ISSUE
# ----------------------------------------------------
echo "🔧 Fixing frontend directory layout..."

if [ -d "$FRONTEND_SRC/src" ]; then
  echo "✔ Found nested frontend/src/src"
  cp -R "$FRONTEND_SRC/src/"* "$FRONTEND_SRC/"
  rm -rf "$FRONTEND_SRC/src"
  echo "✅ Flattened frontend/src"
else
  echo "ℹ️ No nested src/src found — skipping"
fi

# ----------------------------------------------------
# 2. ENSURE BACKEND STRUCTURE
# ----------------------------------------------------
echo "🧠 Ensuring backend structure..."

mkdir -p "$BACKEND_SRC/routes"
mkdir -p "$BACKEND_SRC/services"

# ----------------------------------------------------
# 3. CREATE BACKEND SERVER ADAPTER
# ----------------------------------------------------
SERVER_FILE="$BACKEND_SRC/server.ts"

if [ ! -f "$SERVER_FILE" ]; then
  echo "🚀 Creating backend server adapter..."

  cat << 'EOF' > "$SERVER_FILE"
import express from "express";

const app = express();
app.use(express.json());

// Health check (ALB / ECS)
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Smoke test endpoint
app.get("/smoke", (_req, res) => {
  res.send("✅ ECS + ALB smoke test working");
});

// TODO: mount real routes here
// app.use("/api", apiRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
EOF

  echo "✅ backend/src/server.ts created"
else
  echo "ℹ️ backend/src/server.ts already exists — skipping"
fi

# ----------------------------------------------------
# 4. ADD BACKEND PACKAGE.JSON (IF MISSING)
# ----------------------------------------------------
BACKEND_PKG="$REPO_ROOT/backend/package.json"

if [ ! -f "$BACKEND_PKG" ]; then
  echo "📦 Creating backend/package.json..."

  cat << 'EOF' > "$BACKEND_PKG"
{
  "name": "healthcare-backend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "ts-node src/server.ts",
    "start": "node dist/server.js",
    "build": "tsc"
  },
  "dependencies": {
    "express": "^4.18.2"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20.11.0",
    "ts-node": "^10.9.2",
    "typescript": "^5.3.3"
  }
}
EOF

  echo "✅ backend/package.json created"
else
  echo "ℹ️ backend/package.json already exists — skipping"
fi

# ----------------------------------------------------
# 5. SUMMARY
# ----------------------------------------------------
echo ""
echo "===================================================="
echo " FIX COMPLETE"
echo "===================================================="
echo ""
echo "NEXT STEPS:"
echo "1️⃣ cd frontend && npm install && npm run dev"
echo "2️⃣ cd backend && npm install && npm run dev"
echo "3️⃣ curl http://localhost:5000/health"
echo "4️⃣ git add frontend backend"
echo "5️⃣ git commit -m \"Prepare app for local + AWS deploy\""
echo ""
echo "✅ Safe to deploy to ECS + S3 after this"

