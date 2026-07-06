#!/bin/bash
set -euo pipefail

echo "===================================================="
echo " MIGRATE OLD REPO → ie-healthcare (USER INPUT MODE)"
echo "===================================================="

# ----------------------------------------------------
# USER INPUT
# ----------------------------------------------------
read -p "Enter OLD Git repo URL: " OLD_REPO_URL
read -p "Enter OLD repo branch (default: main): " OLD_REPO_BRANCH
OLD_REPO_BRANCH=${OLD_REPO_BRANCH:-main}

NEW_REPO_ROOT="$(pwd)"              # must run from ie-healthcare root
TMP_DIR="/tmp/old-repo-migrate"

FRONTEND_DIR="$NEW_REPO_ROOT/frontend"
BACKEND_DIR="$NEW_REPO_ROOT/backend"
PLATFORM_CORE_DIR="$NEW_REPO_ROOT/platform-core"

# ----------------------------------------------------
# PRE-CHECKS
# ----------------------------------------------------
echo "🔍 Running pre-checks..."

if [ ! -d "$FRONTEND_DIR" ] || [ ! -d "$BACKEND_DIR" ]; then
  echo "❌ ERROR: Run this script from ie-healthcare repo root"
  exit 1
fi

rm -rf "$TMP_DIR"

# ----------------------------------------------------
# CLONE OLD REPO
# ----------------------------------------------------
echo "📥 Cloning old repo..."
git clone --depth 1 --branch "$OLD_REPO_BRANCH" "$OLD_REPO_URL" "$TMP_DIR"

echo "✅ Old repo cloned"

# ----------------------------------------------------
# FRONTEND COPY (HEURISTIC-BASED)
# ----------------------------------------------------
echo "🎨 Migrating frontend code..."

mkdir -p "$FRONTEND_DIR/src"

for path in src app pages components styles hooks public; do
  if [ -d "$TMP_DIR/$path" ]; then
    echo "  → Copying $path → frontend/src/$path"
    cp -R "$TMP_DIR/$path" "$FRONTEND_DIR/src/" || true
  fi
done

if [ -d "$TMP_DIR/public" ]; then
  cp -R "$TMP_DIR/public" "$FRONTEND_DIR/"
fi

# ----------------------------------------------------
# BACKEND COPY (LOGIC ONLY)
# ----------------------------------------------------
echo "🧠 Migrating backend logic..."

mkdir -p "$BACKEND_DIR/src"

for path in api server routes controllers services models lib middleware; do
  if [ -d "$TMP_DIR/$path" ]; then
    echo "  → Copying $path → backend/src/$path"
    cp -R "$TMP_DIR/$path" "$BACKEND_DIR/src/" || true
  fi
done

# ----------------------------------------------------
# PLATFORM-CORE COPY (SHARED LOGIC)
# ----------------------------------------------------
echo "🔁 Migrating shared / platform-core logic..."

mkdir -p "$PLATFORM_CORE_DIR/shared"
mkdir -p "$PLATFORM_CORE_DIR/services"

if [ -d "$TMP_DIR/lib" ]; then
  cp -R "$TMP_DIR/lib" "$PLATFORM_CORE_DIR/shared/" || true
fi

if [ -d "$TMP_DIR/fhir" ]; then
  cp -R "$TMP_DIR/fhir" "$PLATFORM_CORE_DIR/services/" || true
fi

# ----------------------------------------------------
# REMOVE DANGEROUS FILES (CRITICAL)
# ----------------------------------------------------
echo "🧹 Removing secrets & infra files..."

find "$FRONTEND_DIR" "$BACKEND_DIR" "$PLATFORM_CORE_DIR" \
  -type f \( \
    -name ".env*" \
    -o -name "*.pem" \
    -o -name "*.key" \
    -o -name "Dockerfile" \
    -o -name "docker-compose*" \
    -o -name "*.tf" \
  \) -print -delete || true

# ----------------------------------------------------
# CLEANUP
# ----------------------------------------------------
rm -rf "$TMP_DIR"

echo ""
echo "===================================================="
echo " MIGRATION COMPLETE"
echo "===================================================="
echo ""
echo "NEXT REQUIRED STEPS:"
echo "1️⃣ Review copied code"
echo "2️⃣ Create backend/src/server.ts adapter"
echo "3️⃣ npm install (frontend & backend)"
echo "4️⃣ Local test"
echo "5️⃣ Deploy using existing AWS scripts"
echo ""
echo "IMPORTANT:"
echo "❌ Do NOT commit secrets"
echo "❌ Do NOT reuse old Dockerfiles"
echo "❌ Do NOT reuse old infra scripts"

