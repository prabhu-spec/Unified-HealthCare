#!/usr/bin/env bash
# Run on EC2 after WinSCP/SCP upload from deploy-to-aws.ps1
set -euo pipefail

BACKEND="${BACKEND_DIR:-$HOME/healthcare-backend}"
FRONTEND_DIST="${FRONTEND_DIST_DIR:-$HOME/frontend-dist}"

echo "=== Backend ($BACKEND) ==="
cd "$BACKEND"
if [ ! -f package.json ]; then
  echo "ERROR: $BACKEND/package.json missing. Upload deploy-staging/backend first."
  exit 1
fi
npm install
npx prisma generate
npm run build
pm2 restart healthcare-api 2>/dev/null || pm2 start dist/server.js --name healthcare-api
sleep 2
curl -sf http://127.0.0.1:5000/health | head -c 500
echo ""

echo "=== Frontend (nginx) ==="
if [ ! -f "$FRONTEND_DIST/index.html" ]; then
  echo "WARN: $FRONTEND_DIST/index.html missing — skip nginx update"
  exit 0
fi
sudo mkdir -p /var/www/healthcare
sudo rm -rf /var/www/healthcare/*
sudo cp -r "$FRONTEND_DIST"/* /var/www/healthcare/
if [ -f "$HOME/scripts/nginx-ec2-unified.conf" ]; then
  sudo cp "$HOME/scripts/nginx-ec2-unified.conf" /etc/nginx/sites-available/healthcare 2>/dev/null || true
  sudo ln -sf /etc/nginx/sites-available/healthcare /etc/nginx/sites-enabled/healthcare 2>/dev/null || true
fi
sudo nginx -t && sudo systemctl reload nginx

echo ""
echo "Deployed. Web: http://34.235.222.220/  API: http://34.235.222.220:5000/health"
echo "Login: doctor@demo.com / demo123 (JWT enabled)"
