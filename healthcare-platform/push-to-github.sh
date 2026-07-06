#!/usr/bin/env bash
set -euo pipefail

REPO_URL="https://github.com/<YOUR_GITHUB_USERNAME>/healthcare-platform.git"

echo "▶ Initializing git (if needed)"
git init

echo "▶ Ensuring .gitignore"
cat > .gitignore <<'EOF'
node_modules
dist
build
.env
.env.*
*.log
.DS_Store
EOF

echo "▶ Adding files"
git add .

echo "▶ Committing"
git commit -m "Deploy healthcare frontend + backend (ECS, CloudFront, ECR)" || echo "Nothing to commit"

echo "▶ Setting branch"
git branch -M main

if ! git remote | grep -q origin; then
  git remote add origin "$REPO_URL"
fi

echo "▶ Pushing to GitHub"
git push -u origin main

echo "✅ Code pushed to GitHub"

