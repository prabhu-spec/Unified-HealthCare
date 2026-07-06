#!/usr/bin/env bash
# Run on EC2 after PM2 start — checks API + telemetry simulator
set -euo pipefail

API="${API:-http://127.0.0.1:5000}"

echo "=== Health ==="
curl -sf "$API/health" | head -c 200
echo ""

echo ""
echo "=== PM2 (look for 'vitals simulator started') ==="
pm2 logs healthcare-api --lines 15 --nostream 2>/dev/null || echo "pm2 not running"

echo ""
echo "=== Telemetry patients (doctor) ==="
curl -sf "$API/api/telemetry/patients" \
  -H "x-role: doctor" \
  -H "x-hospital-id: org-1" \
  -H "x-user-email: doctor@demo.com" \
  -H "x-user-id: u-doc" | head -c 400
echo ""

echo ""
echo "=== Telemetry overview ==="
curl -sf "$API/api/telemetry/overview?hospitalId=org-1" \
  -H "x-role: doctor" \
  -H "x-hospital-id: org-1" \
  -H "x-user-email: doctor@demo.com" | head -c 400
echo ""

echo ""
echo "Done. If health shows telemetry:true but browser has no live data,"
echo "rebuild frontend with VITE_SOCKET_URL=http://34.235.222.220:5000"
echo "and avoid HTTPS site calling HTTP API (mixed content)."
