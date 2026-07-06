#!/usr/bin/env bash
set -euo pipefail

# =====================================================
# CONFIG
# =====================================================
DISTRIBUTION_ID="E2KCEIXXFEZUGY"
HEALTHCARE_BUCKET="ie-healthcare-web-prod"
REGION="us-east-1"

HEALTHCARE_ORIGIN_ID="healthcare-s3"
PATH_PATTERN="/healthcare/*"
MANAGED_CACHE_POLICY_NAME="Managed-CachingOptimized"

WORKDIR="$HOME/cf-healthcare-merge"
TFDIR="$WORKDIR/tf"
RAW_CF_JSON="$WORKDIR/cf-raw.json"
DIST_CFG_JSON="$WORKDIR/dist-config.json"
UPDATED_CFG_JSON="$WORKDIR/dist-config-updated.json"

# =====================================================
# PRECHECKS
# =====================================================
for cmd in aws jq terraform; do
  command -v "$cmd" >/dev/null || { echo "❌ $cmd is required"; exit 1; }
done

mkdir -p "$TFDIR"
cd "$WORKDIR"

echo "===================================================="
echo " MERGE /healthcare/* INTO EXISTING CLOUDFRONT"
echo " Distribution: $DISTRIBUTION_ID"
echo " Bucket:       $HEALTHCARE_BUCKET"
echo "===================================================="

# =====================================================
# 1) TERRAFORM — OAC + LOCK DOWN EXISTING BUCKET
# =====================================================
cat > "$TFDIR/main.tf" <<EOF
terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
}

provider "aws" {
  region = "$REGION"
}

data "aws_s3_bucket" "healthcare" {
  bucket = "$HEALTHCARE_BUCKET"
}

resource "aws_s3_bucket_public_access_block" "healthcare" {
  bucket = data.aws_s3_bucket.healthcare.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_cloudfront_origin_access_control" "healthcare" {
  name                              = "healthcare-oac-$DISTRIBUTION_ID"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

output "oac_id" {
  value = aws_cloudfront_origin_access_control.healthcare.id
}

output "bucket_domain" {
  value = data.aws_s3_bucket.healthcare.bucket_regional_domain_name
}
EOF

echo "▶ Terraform apply (OAC + public-access-block only)"
cd "$TFDIR"
terraform init -input=false >/dev/null
terraform apply -auto-approve -input=false >/dev/null

OAC_ID="$(terraform output -raw oac_id)"
BUCKET_DOMAIN="$(terraform output -raw bucket_domain)"
cd "$WORKDIR"

echo "✔ OAC_ID:        $OAC_ID"
echo "✔ Bucket domain: $BUCKET_DOMAIN"

# =====================================================
# 2) CACHE POLICY ID
# =====================================================
CACHE_POLICY_ID="$(aws cloudfront list-cache-policies --type managed \
  | jq -r --arg NAME "$MANAGED_CACHE_POLICY_NAME" '
      .CachePolicyList.Items[]
      | select(.CachePolicy.CachePolicyConfig.Name==$NAME)
      | .CachePolicy.Id
    ' | head -n 1)"

[[ -n "$CACHE_POLICY_ID" && "$CACHE_POLICY_ID" != "null" ]] \
  || { echo "❌ Cache policy not found"; exit 1; }

echo "✔ CachePolicyId: $CACHE_POLICY_ID"

# =====================================================
# 3) FETCH + ISOLATE DISTRIBUTION CONFIG
# =====================================================
aws cloudfront get-distribution-config \
  --id "$DISTRIBUTION_ID" > "$RAW_CF_JSON"

ETAG="$(jq -r '.ETag' "$RAW_CF_JSON")"

# Extract DistributionConfig ONLY
jq '.DistributionConfig' "$RAW_CF_JSON" > "$DIST_CFG_JSON"

# =====================================================
# 4) PATCH DISTRIBUTION CONFIG (NO AMBIGUITY)
# =====================================================
jq \
  --arg ORIGIN_ID "$HEALTHCARE_ORIGIN_ID" \
  --arg ORIGIN_DOMAIN "$BUCKET_DOMAIN" \
  --arg OAC_ID "$OAC_ID" \
  --arg PATH_PATTERN "$PATH_PATTERN" \
  --arg CACHE_POLICY_ID "$CACHE_POLICY_ID" \
'
  # ---------- ORIGINS ----------
  (.Origins //= { "Quantity": 0, "Items": [] })
  |
  (.Origins.Items //= [])
  |
  (if (.Origins.Items | map(.Id) | index($ORIGIN_ID)) == null then
     .Origins.Items += [{
       "Id": $ORIGIN_ID,
       "DomainName": $ORIGIN_DOMAIN,
       "OriginPath": "",
       "CustomHeaders": { "Quantity": 0, "Items": [] },
       "S3OriginConfig": { "OriginAccessIdentity": "" },
       "OriginAccessControlId": $OAC_ID
     }]
   else
     .Origins.Items |= map(
       if .Id == $ORIGIN_ID
       then . + { "OriginAccessControlId": $OAC_ID }
       else .
       end)
   end)
  |
  (.Origins.Quantity = (.Origins.Items | length))
  |

  # ---------- CACHE BEHAVIORS ----------
  (.CacheBehaviors //= { "Quantity": 0, "Items": [] })
  |
  (.CacheBehaviors.Items //= [])
  |
  (if (.CacheBehaviors.Items | map(.PathPattern) | index($PATH_PATTERN)) == null then
     (.DefaultCacheBehavior + { "PathPattern": $PATH_PATTERN }) as $new
     |
     ($new.TargetOriginId = $ORIGIN_ID)
     |
     ($new.CachePolicyId = $CACHE_POLICY_ID)
     |
     (del($new.ForwardedValues)?)
     |
     ($new.AllowedMethods.Items = ["GET","HEAD"])
     |
     ($new.AllowedMethods.Quantity = 2)
     |
     ($new.AllowedMethods.CachedMethods.Items = ["GET","HEAD"])
     |
     ($new.AllowedMethods.CachedMethods.Quantity = 2)
     |
     ($new.ViewerProtocolPolicy = "redirect-to-https")
     |
     ($new.Compress = true)
     |
     ($new.SmoothStreaming = false)
     |
     .CacheBehaviors.Items += [$new]
   else .
   end)
  |
  (.CacheBehaviors.Quantity = (.CacheBehaviors.Items | length))
' "$DIST_CFG_JSON" > "$UPDATED_CFG_JSON"

# =====================================================
# 5) UPDATE CLOUDFRONT
# =====================================================
echo "🚀 Updating CloudFront distribution..."
aws cloudfront update-distribution \
  --id "$DISTRIBUTION_ID" \
  --if-match "$ETAG" \
  --distribution-config "file://$UPDATED_CFG_JSON" >/dev/null

echo "✔ CloudFront update submitted"

echo ""
echo "===================================================="
echo " ✅ MERGE COMPLETE"
echo "===================================================="
echo " Origin:        $HEALTHCARE_ORIGIN_ID"
echo " Path:          $PATH_PATTERN"
echo " CachePolicyId: $CACHE_POLICY_ID"
echo " OAC:           $OAC_ID"
echo ""
echo "⏳ CloudFront deployment: ~5–15 minutes"