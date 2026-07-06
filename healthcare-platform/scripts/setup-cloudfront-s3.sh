#!/bin/bash
set -e

echo "===================================================="
echo " PHASE 1 — Secure CloudFront + S3 Frontend (FIXED)"
echo "===================================================="

read -p "S3 BUCKET NAME (e.g. ie-healthcare-web-prod): " BUCKET
read -p "AWS REGION (e.g. us-east-1): " REGION
read -p "APP NAME (e.g. healthcare): " APP
read -p "ENV (preprod/prod): " ENV

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# ----------------------------------------------------
# Create S3 bucket (private)
# ----------------------------------------------------
echo "🪣 Creating private S3 bucket..."
aws s3api create-bucket \
  --bucket "$BUCKET" \
  --region "$REGION" || true

aws s3api put-public-access-block \
  --bucket "$BUCKET" \
  --public-access-block-configuration \
  BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

# ----------------------------------------------------
# Create CloudFront Origin Access Control
# ----------------------------------------------------

echo "☁️ Checking for existing CloudFront OAC..."

OAC_NAME="$APP-$ENV-oac"

OAC_ID=$(aws cloudfront list-origin-access-controls \
  --query "OriginAccessControlList.Items[?Name=='$OAC_NAME'].Id | [0]" \
  --output text)

if [[ "$OAC_ID" == "None" || -z "$OAC_ID" ]]; then
  echo "➕ Creating new OAC: $OAC_NAME"
  OAC_ID=$(aws cloudfront create-origin-access-control \
    --origin-access-control-config "{
      \"Name\": \"$OAC_NAME\",
      \"OriginAccessControlOriginType\": \"s3\",
      \"SigningBehavior\": \"always\",
      \"SigningProtocol\": \"sigv4\",
      \"Description\": \"OAC for $APP $ENV frontend\"
    }" \
    --query "OriginAccessControl.Id" \
    --output text)
else
  echo "♻️ Reusing existing OAC: $OAC_ID"
fi

# ----------------------------------------------------
# Use AWS Managed Cache & Origin Request Policies
# ----------------------------------------------------
CACHE_POLICY_ID="658327ea-f89d-4fab-a63d-7e88639e58f6"        # Managed-CachingOptimized
ORIGIN_REQUEST_POLICY_ID="88a5eaf4-2fd4-4709-b370-b4c650ea3fcf" # Managed-CORS-S3Origin

# ----------------------------------------------------
# Create CloudFront Distribution
# ----------------------------------------------------
echo "🌐 Creating CloudFront distribution..."

DIST_ID=$(aws cloudfront create-distribution \
  --distribution-config "{
    \"CallerReference\": \"$APP-$ENV-$(date +%s)\",
    \"Comment\": \"$APP $ENV frontend distribution\",
    \"Enabled\": true,
    \"Origins\": {
      \"Quantity\": 1,
      \"Items\": [{
        \"Id\": \"S3Origin\",
        \"DomainName\": \"$BUCKET.s3.amazonaws.com\",
        \"OriginAccessControlId\": \"$OAC_ID\",
        \"S3OriginConfig\": {\"OriginAccessIdentity\": \"\"}
      }]
    },
    \"DefaultCacheBehavior\": {
      \"TargetOriginId\": \"S3Origin\",
      \"ViewerProtocolPolicy\": \"redirect-to-https\",
      \"AllowedMethods\": {
        \"Quantity\": 2,
        \"Items\": [\"GET\", \"HEAD\"]
      },
      \"CachePolicyId\": \"$CACHE_POLICY_ID\",
      \"OriginRequestPolicyId\": \"$ORIGIN_REQUEST_POLICY_ID\",
      \"Compress\": true
    }
  }" \
  --query "Distribution.Id" \
  --output text)

# ----------------------------------------------------
# Lock S3 bucket to CloudFront only
# ----------------------------------------------------
echo "🔐 Applying S3 bucket policy (CloudFront only)..."

CF_ARN="arn:aws:cloudfront::$ACCOUNT_ID:distribution/$DIST_ID"

cat << EOF > /tmp/s3-policy.json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Service": "cloudfront.amazonaws.com" },
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::$BUCKET/*",
    "Condition": {
      "StringEquals": {
        "AWS:SourceArn": "$CF_ARN"
      }
    }
  }]
}
EOF

aws s3api put-bucket-policy \
  --bucket "$BUCKET" \
  --policy file:///tmp/s3-policy.json

echo ""
echo "===================================================="
echo " ✅ PHASE 1 COMPLETE"
echo "===================================================="
echo "CloudFront Distribution ID: $DIST_ID"
echo "S3 bucket is PRIVATE and secured by OAC"

