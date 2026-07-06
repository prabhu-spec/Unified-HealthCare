#!/usr/bin/env bash
# Run ON the EC2 instance from healthcare-platform directory
set -euo pipefail

EC2_IP="${EC2_PUBLIC_IP:-34.235.222.220}"

echo "==> Building and starting Docker (EC2 IP: $EC2_IP)"
docker compose -f docker-compose.yml -f docker-compose.ec2.yml up -d --build

echo "==> Waiting for backend health..."
for i in $(seq 1 30); do
  if curl -sf "http://127.0.0.1:5000/health" >/dev/null; then
    echo "Backend OK"
    break
  fi
  sleep 2
done

echo ""
echo "Deployment ready:"
echo "  Web UI:    http://${EC2_IP}/"
echo "  Backend:   http://${EC2_IP}:5000/health"
echo "  Android:   API_BASE_URL=http://${EC2_IP}:5000"
echo ""
echo "Ensure EC2 security group allows inbound TCP 80 and 5000."
