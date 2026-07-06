# Local Phase 1 setup (Windows PowerShell)
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host "Starting PostgreSQL..."
docker compose up -d postgres
Start-Sleep -Seconds 8

Set-Location "$root\backend"
Write-Host "Pushing schema..."
npm run db:setup
Write-Host "Done. Run: npm run dev (backend) and npm run dev (frontend)"
