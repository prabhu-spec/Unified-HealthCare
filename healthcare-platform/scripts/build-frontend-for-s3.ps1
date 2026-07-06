# Build frontend for S3 static website (API on EC2 :5000).
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$fe = Join-Path $root "frontend"
Set-Location $fe

Copy-Item -Force (Join-Path $fe ".env.production.s3") (Join-Path $fe ".env.production")
Write-Host "Using .env.production.s3 -> VITE_API_URL=http://34.235.222.220:5000"

npm install
npm run build

Write-Host ""
Write-Host "Upload ONLY the contents of:"
Write-Host "  $fe\dist\"
Write-Host "To S3 bucket website root, e.g.:"
Write-Host "  s3://unified-healthcare/   (or your healthcare/ prefix)"
Write-Host ""
Write-Host "AWS Console: S3 -> bucket -> Upload -> select ALL files inside dist (index.html + assets/)"
Write-Host "Invalidate CloudFront cache if you use CloudFront."
Write-Host ""
Write-Host "Open: http://unified-healthcare.s3-website-us-east-1.amazonaws.com"
Write-Host "Login: doctor@demo.com / demo123"
