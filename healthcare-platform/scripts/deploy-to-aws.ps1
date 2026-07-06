# Build + stage files for AWS EC2 (WinSCP / SCP). Run from healthcare-platform folder.
# Usage:  .\scripts\deploy-to-aws.ps1
#         .\scripts\deploy-to-aws.ps1 -Upload   # also tries SCP if key exists

param(
    [switch]$Upload,
    [string]$Ec2Host = "34.235.222.220",
    [string]$Ec2User = "ubuntu",
    [string]$KeyPath = "E:\Important API Docs\Keys\a-healthcare.pem",
    [string]$RemoteBackend = "/home/ubuntu/healthcare-backend",
    [string]$RemoteFrontendDist = "/home/ubuntu/frontend-dist"
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
if (-not (Test-Path "$Root\backend\package.json")) {
    $Root = Split-Path -Parent $PSScriptRoot
}

$Staging = Join-Path $Root "deploy-staging"
$BackendStage = Join-Path $Staging "backend"
$FrontendStage = Join-Path $Staging "frontend-dist"

Write-Host "==> Building backend..."
Set-Location "$Root\backend"
npm run build
if ($LASTEXITCODE -ne 0) { throw "Backend build failed" }

Write-Host "==> Building frontend (production -> $Ec2Host)..."
Set-Location "$Root\frontend"
npm run build
if ($LASTEXITCODE -ne 0) { throw "Frontend build failed" }

Write-Host "==> Staging deploy package at $Staging"
if (Test-Path $Staging) { Remove-Item $Staging -Recurse -Force }
New-Item -ItemType Directory -Path $BackendStage, $FrontendStage | Out-Null

$BackendItems = @(
    "package.json", "package-lock.json", "tsconfig.json", "Dockerfile",
    "ecosystem.config.cjs", "prisma", "src", "dist"
)
foreach ($item in $BackendItems) {
    $src = Join-Path "$Root\backend" $item
    if (Test-Path $src) {
        Copy-Item $src (Join-Path $BackendStage $item) -Recurse -Force
    }
}
Copy-Item "$Root\scripts\ec2-deploy-remote.sh" (Join-Path $Staging "ec2-deploy-remote.sh") -Force

Copy-Item "$Root\frontend\dist\*" $FrontendStage -Recurse -Force

Write-Host ""
Write-Host "Staging complete:"
Write-Host "  Backend:  $BackendStage"
Write-Host "  Frontend: $FrontendStage"
Write-Host ""

if (-not $Upload) {
    Write-Host "WinSCP upload:"
    Write-Host "  1. Connect: SFTP $Ec2User@${Ec2Host}:22  key: $KeyPath"
    Write-Host "  2. Upload deploy-staging\backend\*  -> $RemoteBackend\"
    Write-Host "  3. Upload deploy-staging\frontend-dist\* -> $RemoteFrontendDist\"
    Write-Host "  4. Upload deploy-staging\ec2-deploy-remote.sh -> ~/ec2-deploy-remote.sh"
    Write-Host "  5. SSH: sed -i 's/\r$//' ~/ec2-deploy-remote.sh && chmod +x ~/ec2-deploy-remote.sh && ~/ec2-deploy-remote.sh"
    Write-Host ""
    Write-Host "Re-run with -Upload to attempt SCP automatically."
    exit 0
}

if (-not (Test-Path $KeyPath)) {
    Write-Host "Key not found: $KeyPath — use WinSCP steps above."
    exit 1
}

$scp = Get-Command scp -ErrorAction SilentlyContinue
if (-not $scp) {
    Write-Host "scp not in PATH — use WinSCP."
    exit 1
}

Write-Host "==> Uploading via SCP (may take several minutes)..."
& scp -i $KeyPath -o StrictHostKeyChecking=no -r "$BackendStage\*" "${Ec2User}@${Ec2Host}:${RemoteBackend}/"
& scp -i $KeyPath -o StrictHostKeyChecking=no -r "$FrontendStage\*" "${Ec2User}@${Ec2Host}:${RemoteFrontendDist}/"
& scp -i $KeyPath -o StrictHostKeyChecking=no "$Staging\ec2-deploy-remote.sh" "${Ec2User}@${Ec2Host}:~/ec2-deploy-remote.sh"

Write-Host "==> Running remote deploy script..."
& ssh -i $KeyPath -o StrictHostKeyChecking=no "${Ec2User}@${Ec2Host}" "sed -i 's/\r$//' ~/ec2-deploy-remote.sh && chmod +x ~/ec2-deploy-remote.sh && ~/ec2-deploy-remote.sh"

Write-Host "Done. Check http://${Ec2Host}/ and http://${Ec2Host}:5000/health"
