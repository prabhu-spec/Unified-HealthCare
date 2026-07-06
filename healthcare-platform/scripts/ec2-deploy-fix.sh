#!/usr/bin/env bash
# Run on EC2 after uploading updated backend/ + frontend/ from your PC (WinSCP).
# If you see "bash\r: No such file or directory", run: sed -i 's/\r$//' ~/ec2-deploy-fix.sh
set -euo pipefail

echo "=== Backend ==="
cd ~/backend
npm install
npm run build
pm2 restart healthcare-api
sleep 2
curl -sf http://127.0.0.1:5000/health
echo ""

echo ""
echo "=== Frontend ==="
cd ~/frontend
if [ ! -f src/main.jsx ]; then
  echo "ERROR: ~/frontend/src/main.jsx is missing (incomplete WinSCP upload)."
  echo "Upload the full folder from your PC: healthcare-platform/frontend/src/"
  echo "Also need: index.html, vite.config.js, package.json, package-lock.json"
  echo ""
  echo "Faster: build on your PC, upload dist/ to ~/frontend-dist/, then run:"
  echo "  sed -i 's/\\r$//' ~/ec2-deploy-dist-only.sh && chmod +x ~/ec2-deploy-dist-only.sh"
  echo "  ~/ec2-deploy-dist-only.sh"
  exit 1
fi
cat > .env.production << 'EOF'
VITE_API_URL=
VITE_SOCKET_URL=
EOF
npm install
npm run build

echo ""
echo "=== Web root (nginx) ==="
sudo mkdir -p /var/www/healthcare
sudo cp -r dist/* /var/www/healthcare/

if [ -f ~/scripts/nginx-ec2-unified.conf ]; then
  sudo cp ~/scripts/nginx-ec2-unified.conf /etc/nginx/sites-available/healthcare 2>/dev/null || true
  sudo ln -sf /etc/nginx/sites-available/healthcare /etc/nginx/sites-enabled/healthcare 2>/dev/null || true
  sudo nginx -t && sudo systemctl reload nginx
fi

echo ""
echo "Done. Open http://34.235.222.220/ as doctor@demo.com"
echo "Overview + Live Telemetry should load (no 'Failed to fetch')."
