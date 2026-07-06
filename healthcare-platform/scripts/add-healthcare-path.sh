#!/usr/bin/env bash
set -euo pipefail

# ================= CONFIG =================
DISTRIBUTION_ID="E2KCEIXXFEZUGY"
HEALTHCARE_BUCKET="ie-healthcare-web-prod"
HEALTHCARE_ORIGIN_ID="S3-healthcare"

command -v jq >/dev/null || { echo "❌ jq required"; exit 1; }

echo "===================================================="
echo " ADD /healthcare/* PATH TO EXISTING CLOUDFRONT"
echo " Distribution: $DISTRIBUTION_ID"
echo "===================================================="

TMP_CF="/tmp/cf.json"
TMP_UPDATED="/tmp/cf-updated.json"

# ---------------- Fetch config ----------------
aws cloudfront get-distribution-config \
  --id "$DISTRIBUTION_ID" > "$TMP_CF"

ETAG=$(jq -r '.ETag' "$TMP_CF")
CONFIG=$(jq '.DistributionConfig' "$TMP_CF")

# ---------------- HARDEN NULL STRUCTURES ----------------
CONFIG=$(echo "$CONFIG" | jq '
  .CacheBehaviors |=
    (if . == null then { Quantity: 0, Items: [] } else . end)
  |
  .CacheBehaviors.Items |= (. // [])
  |
  .Origins.Items |= (. // [])
')

# ---------------- Add Origin if missing ----------------
ORIGIN_EXISTS=$(echo "$CONFIG" | jq -r '
  .Origins.Items[].Id? // empty
' | grep -c "^${HEALTHCARE_ORIGIN_ID}$" || true)

if [[ "$ORIGIN_EXISTS" -eq 0 ]]; then
  echo "➕ Adding healthcare S3 origin"

  CONFIG=$(echo "$CONFIG" | jq '
    .Origins.Items += [{
      Id: "'"$HEALTHCARE_ORIGIN_ID"'",
      DomainName: "'"$HEALTHCARE_BUCKET"'.s3.amazonaws.com",
      OriginPath: "",
      CustomHeaders: { Quantity: 0, Items: [] },
      S3OriginConfig: { OriginAccessIdentity: "" }
    }]
    |
    .Origins.Quantity = (.Origins.Items | length)
  ')
else
  echo "ℹ️ Healthcare origin already exists"
fi

# ---------------- Add Cache Behavior if missing ----------------
BEHAVIOR_EXISTS=$(echo "$CONFIG" | jq -r '
  .CacheBehaviors.Items[].PathPattern? // empty
' | grep -c '^/healthcare/\*$' || true)

if [[ "$BEHAVIOR_EXISTS" -eq 0 ]]; then
  echo "➕ Adding /healthcare/* cache behavior"

  CONFIG=$(echo "$CONFIG" | jq '
    .CacheBehaviors.Items += [{
      PathPattern: "/healthcare/*",
      TargetOriginId: "'"$HEALTHCARE_ORIGIN_ID"'",
      ViewerProtocolPolicy: "redirect-to-https",

      AllowedMethods: {
        Quantity: 2,
        Items: ["GET","HEAD"],
        CachedMethods: {
          Quantity: 2,
          Items: ["GET","HEAD"]
        }
      },

      SmoothStreaming: false,
      Compress: true,

      ForwardedValues: {
        QueryString: false,
        Cookies: { Forward: "none" },
        Headers: {
          Quantity: 0,
          Items: []
        }
      },

      MinTTL: 0,
      DefaultTTL: 0,
      MaxTTL: 0
    }]
    |
    .CacheBehaviors.Quantity = (.CacheBehaviors.Items | length)
  ')
else
  echo "ℹ️ /healthcare/* cache behavior already exists"
fi

# ---------------- Update distribution ----------------
echo "🚀 Updating CloudFront distribution..."
echo "$CONFIG" > "$TMP_UPDATED"

aws cloudfront update-distribution \
  --id "$DISTRIBUTION_ID" \
  --if-match "$ETAG" \
  --distribution-config "file://$TMP_UPDATED"

echo ""
echo "===================================================="
echo " ✅ /healthcare/* PATH ADDED SUCCESSFULLY"
echo "===================================================="
echo ""
echo "⏳ CloudFront deployment: 5–15 minutes"
echo "Test URL:"
echo "  https://api.acentle.ai/healthcare/"
