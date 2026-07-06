#!/usr/bin/env bash
set -e

echo "===================================================="
echo " VERIFY ECS BACKEND DEPLOYMENT (PREPROD)"
echo "===================================================="

CLUSTER_NAME="preprod-cluster"
REGION="us-east-1"

echo "🔍 Checking ECS cluster exists..."
aws ecs describe-clusters \
  --clusters "$CLUSTER_NAME" \
  --query "clusters[0].status" \
  --output text > /dev/null

echo "✅ Cluster found: $CLUSTER_NAME"
echo ""

echo "🔍 Listing ECS services..."
SERVICES=$(aws ecs list-services \
  --cluster "$CLUSTER_NAME" \
  --query "serviceArns[]" \
  --output text)

if [[ -z "$SERVICES" ]]; then
  echo "❌ No services found in cluster"
  exit 1
fi

echo "✅ Services found:"
echo "$SERVICES"
echo ""

# Extract service names
SERVICE_NAMES=$(echo "$SERVICES" | awk -F'/' '{print $NF}')

echo "🔍 Checking service health..."
for SERVICE in $SERVICE_NAMES; do
  echo "------------------------------------"
  echo "Service: $SERVICE"

  aws ecs describe-services \
    --cluster "$CLUSTER_NAME" \
    --services "$SERVICE" \
    --query "services[0].{status:status,running:runningCount,desired:desiredCount}" \
    --output table
done

echo ""
echo "===================================================="
echo " ALB HEALTH CHECK"
echo "===================================================="

read -p "Enter ALB DNS name (e.g. preprod-alb-xxxx.elb.amazonaws.com): " ALB_DNS

echo ""
echo "🔍 Testing /health endpoint..."
HTTP_CODE=$(curl -s -o /tmp/health.out -w "%{http_code}" "http://$ALB_DNS/health")

cat /tmp/health.out
echo ""

if [[ "$HTTP_CODE" == "200" ]]; then
  echo "✅ ALB → ECS routing WORKING"
else
  echo "❌ ALB health check failed (HTTP $HTTP_CODE)"
fi

echo ""
echo "===================================================="
echo " NEXT STEPS"
echo "===================================================="
echo "1️⃣ Pick the ACTIVE service with running=desired"
echo "2️⃣ Update CI/CD to use that service name"
echo ""
echo "Example:"
echo "aws ecs update-service \\"
echo "  --cluster $CLUSTER_NAME \\"
echo "  --service <SERVICE_NAME> \\"
echo "  --force-new-deployment"
echo ""
echo "===================================================="
echo " VERIFICATION COMPLETE"
echo "===================================================="

