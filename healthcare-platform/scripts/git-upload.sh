#!/usr/bin/env bash
set -e

echo "===================================================="
echo " GIT UPLOAD SCRIPT — SAFE COMMIT & PUSH"
echo "===================================================="

# -------- CONFIG --------
DEFAULT_BRANCH="main"
REMOTE_NAME="origin"

# -------- PRE-CHECKS --------
if [ ! -d ".git" ]; then
  echo "🔧 Initializing git repository..."
  git init
  git branch -m "$DEFAULT_BRANCH"
fi

if ! git remote | grep -q "^${REMOTE_NAME}$"; then
  echo "❌ ERROR: No git remote named '${REMOTE_NAME}'"
  echo "👉 Add one using:"
  echo "   git remote add origin <GITHUB_REPO_URL>"
  exit 1
fi

# -------- GITIGNORE SAFETY --------
if [ ! -f ".gitignore" ]; then
  echo "🛡️ Creating .gitignore..."
  cat > .gitignore <<'EOF'
node_modules
.env
.env.*
.DS_Store
dist
build
coverage
terraform.tfstate*
*.log
EOF
fi

# -------- STATUS --------
echo ""
echo "📋 Git status:"
git status

echo ""
read -p "Proceed with commit and push? (yes/no): " CONFIRM
if [[ "$CONFIRM" != "yes" ]]; then
  echo "❌ Aborted by user"
  exit 0
fi

# -------- ADD FILES --------
echo "➕ Adding files..."
git add \
  backend \
  frontend \
  platform-core \
  scripts \
  infra \
  .github \
  README.md \
  .gitignore || true

# -------- COMMIT --------
COMMIT_MSG=${1:-"Platform update"}
echo "📝 Committing with message: $COMMIT_MSG"
git commit -m "$COMMIT_MSG" || echo "ℹ️ Nothing new to commit"

# -------- PULL (SAFE) --------
echo "🔄 Syncing with remote..."
git pull --rebase "$REMOTE_NAME" "$DEFAULT_BRANCH" || true

# -------- PUSH --------
echo "🚀 Pushing to GitHub..."
git push "$REMOTE_NAME" "$DEFAULT_BRANCH"

echo ""
echo "===================================================="
echo " ✅ GIT UPLOAD COMPLETE"
echo "===================================================="

