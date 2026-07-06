#!/bin/bash
set -e

echo "===================================================="
echo " HEALTHCARE PLATFORM – CONSOLIDATED DEPLOY SCRIPT"
echo "===================================================="

AWS_REGION="us-east-1"
ACCOUNT_ID="260476742932"

ECS_CLUSTER="preprod-cluster"
ECS_SERVICE="ecs-smoke"
ECR_REPO="healthcare-backend"

S3_BUCKET="ie-healthcare-web-prod"

# ----------------------------------------------------
# Ensure scripts directory
# ----------------------------------------------------
mkdir -p scripts

# ----------------------------------------------------
# Ensure backend config files
# ----------------------------------------------------
echo "🧠 Ensuring backend config files..."

if [ ! -f "backend/tsconfig.json" ]; then
  cat << 'EOF' > backend/tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Node",
    "outDir": "dist",
    "rootDir": "src",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true
  }
}
EOF
  echo "✅ backend/tsconfig.json created"
fi

if [ ! -f "backend/package.json" ]; then
  cat << 'EOF' > backend/package.json
{
  "name": "healthcare-backend",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "ts-node src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js"
  },
  "dependencies": {
    "express": "^4.18.2"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20.11.0",
    "ts-node": "^10.9.2",
    "typescript": "^5.3.3"
  }
}
EOF
  echo "✅ backend/package.json created"
fi

# ----------------------------------------------------
# Ensure backend Docker files
# ----------------------------------------------------
echo "🐳 Ensuring backend Docker files..."

if [ ! -f "backend/Dockerfile" ]; then
  cat << 'EOF' > backend/Dockerfile
FROM node:18-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:18-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000

COPY package*.json ./
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist

EXPOSE 5000
CMD ["node", "dist/server.js"]
EOF
fi

if [ ! -f "backend/.dockerignore" ]; then
  cat << 'EOF' > backend/.dockerignore
node_modules
dist
.env*
.git
EOF
fi

# ----------------------------------------------------
# Login to ECR
# ----------------------------------------------------
echo "🔐 Logging into ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login \
  --username AWS \
  --password-stdin $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

aws ecr create-repository \
  --repository-name $ECR_REPO \
  >/dev/null 2>&1 || true

# ----------------------------------------------------
# Build & push backend image (amd64)
# ----------------------------------------------------
IMAGE_TAG=$(git rev-parse --short HEAD)

echo "📦 Building backend image (linux/amd64)..."
docker buildx build \
  --platform linux/amd64 \
  -t $ECR_REPO:$IMAGE_TAG \
  backend \
  --load

docker tag $ECR_REPO:$IMAGE_TAG \
  $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:$IMAGE_TAG

docker push $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:$IMAGE_TAG

# ----------------------------------------------------
# Deploy backend to ECS
# ----------------------------------------------------
echo "🚢 Deploying backend to ECS..."
aws ecs update-service \
  --cluster $ECS_CLUSTER \
  --service $ECS_SERVICE \
  --force-new-deployment

# ----------------------------------------------------
# Build & deploy frontend
# ----------------------------------------------------
echo "🎨 Building frontend..."
cd frontend
npm install
npm run build
cd ..

echo "☁️ Uploading frontend to S3..."
aws s3 sync frontend/out s3://$S3_BUCKET --delete

echo ""
echo "===================================================="
echo " ✅ DEPLOY COMPLETE"
echo "===================================================="
echo ""
echo "VERIFY:"
echo "• Backend: curl http://<ALB-DNS>/health"
echo "• Frontend: https://<CloudFront-or-domain>"

