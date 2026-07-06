# Healthcare Platform — AWS EC2 Deployment

**EC2 Elastic IP:** `34.235.222.220`

## Quick deploy from Windows (WinSCP / PuTTY)

Production build + upload package (run on your PC):

```powershell
cd healthcare-platform
.\scripts\deploy-to-aws.ps1
# Optional automatic SCP (needs EC2 port 22 open + key):
.\scripts\deploy-to-aws.ps1 -Upload
```

Upload `deploy-staging\` via WinSCP (see script output), then SSH:

```bash
sed -i 's/\r$//' ~/ec2-deploy-remote.sh && chmod +x ~/ec2-deploy-remote.sh
~/ec2-deploy-remote.sh
```

**On server `.env`**, add (keep existing LiveKit/SendGrid keys):

```env
JWT_SECRET=your-long-random-secret
JWT_EXPIRES_IN=7d
ENFORCE_JWT=false
# Optional Phase 1 (RDS or local Postgres on EC2):
# DATABASE_URL=postgresql://...
```

---

## Quick start (on EC2 — Docker)

```bash
cd healthcare-platform
# Copy backend secrets
cp backend/.env.example backend/.env   # then edit with real keys

docker compose -f docker-compose.yml -f docker-compose.ec2.yml up -d --build
```

- **Web:** http://34.235.222.220/
- **API:** http://34.235.222.220:5000/health
- **Android app:** release build points to `http://34.235.222.220:5000`

## Security group (required)

| Port | Purpose |
|------|---------|
| 80 | Frontend (nginx) |
| 5000 | Backend API + Socket.IO |
| 22 | SSH (optional) |

## Local development

```bash
# Docker (backend + frontend)
docker compose up -d --build

# Or without Docker:
cd backend && npm run dev
cd frontend && npm run dev
```

- Local web: http://localhost:8080 (Docker) or http://localhost:5173 (Vite)
- Local API: http://localhost:5000

## Environment files

| File | Use |
|------|-----|
| `frontend/.env.development` | Vite dev proxy to localhost:5000 |
| `frontend/.env.production` | Build for AWS (`34.235.222.220`) |
| `.env.ec2` | Reference IP for compose + Android |

## Demo users

Accounts still work (`demo123` password) but login screens **hide** credential hints in production builds.

| Role | Email |
|------|-------|
| Patient | patient@demo.com |
| Doctor | doctor@demo.com |
| Hospital Admin | hospitaladmin@demo.com |

## Android

- **Debug:** `http://10.0.2.2:5000` (emulator → PC localhost)
- **Release:** `http://34.235.222.220:5000`

Build release APK: `cd Healthcare-app && ./gradlew assembleRelease`
