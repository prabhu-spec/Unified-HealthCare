#!/usr/bin/env bash
# Use when you built frontend on your PC and uploaded ~/frontend-dist/ (contents of dist/).
set -euo pipefail

SRC="${1:-$HOME/frontend-dist}"
if [ ! -f "$SRC/index.html" ]; then
  echo "Missing $SRC/index.html"
  echo "On your PC: cd frontend && npm run build"
  echo "WinSCP: upload local frontend/dist/* to ubuntu@server:~/frontend-dist/"
  exit 1
fi

sudo mkdir -p /var/www/healthcare
sudo rm -rf /var/www/healthcare/*
sudo cp -r "$SRC"/* /var/www/healthcare/

if [ -f "$HOME/scripts/nginx-ec2-unified.conf" ]; then
  sudo cp "$HOME/scripts/nginx-ec2-unified.conf" /etc/nginx/sites-available/healthcare 2>/dev/null || true
  sudo ln -sf /etc/nginx/sites-available/healthcare /etc/nginx/sites-enabled/healthcare 2>/dev/null || true
fi

sudo nginx -t && sudo systemctl reload nginx
echo "Done. Open http://34.235.222.220/"
