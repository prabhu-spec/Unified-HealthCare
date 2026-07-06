# Run on Windows before WinSCP upload (dist-only deploy).
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location (Join-Path $root "frontend")

@"
VITE_API_URL=
VITE_SOCKET_URL=
"@ | Set-Content -NoNewline -Encoding utf8 .env.production

npm install
npm run build

Write-Host ""
Write-Host "Upload with WinSCP:"
Write-Host "  Local:  $root\frontend\dist\*"
Write-Host "  Remote: /home/ubuntu/frontend-dist/"
Write-Host ""
Write-Host "Then in PuTTY:"
Write-Host "  sed -i 's/\r$//' ~/ec2-deploy-dist-only.sh && chmod +x ~/ec2-deploy-dist-only.sh"
Write-Host "  ~/ec2-deploy-dist-only.sh"
