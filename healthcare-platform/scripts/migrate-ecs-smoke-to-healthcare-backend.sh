#!/usr/bin/env bash
set -e

echo "===================================================="
echo " ZERO-DOWNTIME ECS SERVICE MIGRATION"
echo " ecs-smoke  →  healthcare-backend"
echo "===================================================="

# ---------------- CONFIG ----------------
CLUSTER="preprod-cluster"
OLD_SERVICE="ecs-smoke"
NEW_SERVICE="healthcare-backend"
REGION="us-east-1"

echo "🔍 Fetching task definition from old service..."

TASK_DEF=$(aws ecs describe-services \
  --cluster "$CLUSTER" \
  --services "$OLD_SERVICE" \
  --query "services[0].taskDefinition" \
  --output text)

if [[ -z "$TASK_DEF" ]]; then
  echo "❌ Failed to find task definition for $OLD_SERVICE"
  exit 1
fi

echo "✔ Task definition: $TASK_DEF"

echo ""
echo "🔍 Fetching network config from old service..."

NETCFG=$(aws ecs describe-services \
  --cluster "$CLUSTER" \
  --services "$OLD_SERVICE" \
  --query "services[0].networkConfiguration" \
  --output json)

if [[ "$NETCFG" == "null" ]]; then
  echo "❌ Failed to read network configuration"
  exit 1
fi

echo "✔ Network config copied"

echo ""
echo "🚢 Creating new ECS service: $NEW_SERVICE"

aws ecs create-service \
  --cluster "$CLUSTER" \
  --service-name "$NEW_SERVICE" \
  --task-definition "$TASK_DEF" \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "$NETCFG"

echo "⏳ Waiting for new service to stabilize..."

aws ecs wait services-stable \
  --cluster "$CLUSTER" \
  --services "$NEW_SERVICE"

echo "✅ New service is stable"

echo ""
echo "===================================================="
echo " HEALTH VERIFICATION"
echo "===================================================="

read -p "Enter ALB DNS name (e.g. preprod-alb-xxxx.elb.amazonaws.com): " ALB_DNS

echo "🔍 Testing /health endpoint..."
HTTP_CODE=$(curl -s -o /tmp/health.out -w "%{http_code}" "http://$ALB_DNS/health")

cat /tmp/health.out
echo ""

if [[ "$HTTP_CODE" != "200" ]]; then
  echo "❌ Health check failed — aborting cleanup"
  exit 1
fi

echo "✅ Health check passed"

echo ""
read -p "Delete old service '$OLD_SERVICE'? (yes/no): " CONFIRM

if [[ "$CONFIRM" == "yes" ]]; then
  echo "🧹 Deleting old service..."
  aws ecs update-service \
    --cluster "$CLUSTER" \
    --service "$OLD_SERVICE" \
    --desired-count 0

  aws ecs delete-service \
    --cluster "$CLUSTER" \
    --service "$OLD_SERVICE"

  echo "✅ Old service deleted"
else
  echo "ℹ️ Old service retained"
fi

echo ""
echo "===================================================="
echo " MIGRATION COMPLETE"
echo "===================================================="
echo ""
echo "👉 Update CI/CD to use:"
echo "   --cluster $CLUSTER"
echo "   --service $NEW_SERVICE"
echo ""

