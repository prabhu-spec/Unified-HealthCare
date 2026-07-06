#!/usr/bin/env bash
set -euo pipefail

# ===============================
# CONFIG — CHANGE ONLY IF NEEDED
# ===============================
AWS_REGION="us-east-1"
ACCOUNT_ID="260476742932"

# Frontend
FRONTEND_DIR="frontend"
FRONTEND_BUILD_DIR="dist"          # change to "build" if needed
S3_BUCKET="ie-healthcare-web-prod"
S3_PREFIX="healthcare"
CF_DISTRIBUTION_ID="E2KCEIXXFEZUGY"

# Backend
ECR_REPO="healthcare-api"
ECS_CLUSTER="healthcare-prod"
ECS_SERVICE="healthcare-api"
IMAGE_TAG="latest"

IMAGE_URI="$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:$IMAGE_TAG"

# ===============================
# HELPERS
# ===============================
log() {
  echo ""
  echo "===================================================="
  echo "▶ $1"
  echo "===================================================="
}

require() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "❌ Required command not found: $1"
    exit 1
  }
}

# ===============================
# PRECHECKS
# ===============================
require aws
require docker
require npm

aws sts get-caller-identity >/dev/null || {
  echo "❌ AWS credentials not configured"
  exit 1
}

# ===============================
# FRONTEND DEPLOY
# ===============================
log "DEPLOYING FRONTEND"

cd "$FRONTEND_DIR"

echo "▶ Installing frontend dependencies"
npm ci

echo "▶ Building frontend"
npm run build

cd ..

echo "▶ Uploading frontend to S3"
aws s3 sync \
  "$FRONTEND_DIR/$FRONTEND_BUILD_DIR" \
  "s3://$S3_BUCKET/$S3_PREFIX" \
  --delete

echo "▶ Invalidating CloudFront cache"
aws cloudfront create-invalidation \
  --distribution-id "$CF_DISTRIBUTION_ID" \
  --paths "/$S3_PREFIX/*" \
  >/dev/null

echo "✔ Frontend deployed"

# ===============================
# BACKEND DEPLOY
# ===============================
log "DEPLOYING BACKEND"

echo "▶ Logging into ECR"
aws ecr get-login-password --region "$AWS_REGION" \
  | docker login \
    --username AWS \
    --password-stdin \
    "$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"

echo "▶ Building backend Docker image"
docker build -t "$IMAGE_URI" backend

echo "▶ Pushing image to ECR"
docker push "$IMAGE_URI"

echo "▶ Forcing ECS service deployment"
aws ecs update-service \
  --cluster "$ECS_CLUSTER" \
  --service "$ECS_SERVICE" \
  --force-new-deployment \
  >/dev/null

echo "✔ Backend deployed"

# ===============================
# DONE
# ===============================
log "DEPLOYMENT COMPLETE"

echo "Frontend:"
echo "  https://api.acentle.ai/healthcare/index.html"
echo ""
echo "Backend:"
echo "  https://api.acentle.ai/api/health"
echo ""
echo "CloudFront:"
echo "  https://d3kkn56hc6twv1.cloudfront.net/healthcare/index.html"
echo ""
echo "🚀 All services deployed successfully"

