#!/usr/bin/env bash
set -euo pipefail

AWS_REGION="us-east-1"

# ECS
CLUSTER="preprod-cluster"
SERVICE="healthcare-backend"

# Frontend
DIST_ID="E2KCEIXXFEZUGY"
S3_BUCKET="ie-healthcare-web-prod"

echo "===================================================="
echo " DEPLOY BACKEND (ECS)"
echo "===================================================="

echo "▶ Verifying ECS cluster: $CLUSTER"
aws ecs describe-clusters \
  --clusters "$CLUSTER" \
  --region "$AWS_REGION" \
  --query 'clusters[0].status' \
  --output text >/dev/null

echo "✔ ECS cluster found"

echo "▶ Triggering ECS service deployment: $SERVICE"
aws ecs update-service \
  --cluster "$CLUSTER" \
  --service "$SERVICE" \
  --force-new-deployment \
  --region "$AWS_REGION"

echo "✔ ECS deployment triggered"

echo ""
echo "===================================================="
echo " DEPLOY FRONTEND (S3 + CLOUDFRONT)"
echo "===================================================="

echo "▶ Building frontend"
cd frontend
npm run build
cd ..

echo "▶ Uploading frontend to S3 (/healthcare)"
aws s3 sync frontend/dist \
  s3://$S3_BUCKET/healthcare \
  --delete

echo "▶ Invalidating CloudFront cache"
aws cloudfront create-invalidation \
  --distribution-id "$DIST_ID" \
  --paths "/healthcare/*"

echo ""
echo "===================================================="
echo " ✅ DEPLOYMENT COMPLETE"
echo "===================================================="
echo "Frontend: https://api.acentle.ai/healthcare/"
echo "Backend:  https://api.acentle.ai/api/health"
