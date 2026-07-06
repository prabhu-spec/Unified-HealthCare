# Phase completion status

All phases are **implemented in this repository**. Some steps require **your environment** (Docker, AWS credentials, app store builds).

## Done in code

| Phase | Delivered |
|-------|-----------|
| **0** | REST APIs for web + Android; role-scoped data |
| **1** | Prisma schema, seed, repositories, Docker Postgres |
| **2** | JWT on login; middleware; web + Android Bearer token; `/api/auth/me` |
| **3** | `docker-compose.prod.yml`, `ecosystem.config.cjs`, `DEPLOYMENT.md`, EC2 compose overlay |
| **4** | `frontend/.env.production`, Android `BuildConfig.API_BASE_URL` for release |
| **5** | Patients list + records load from `/api/core/patients` when logged in |
| **6** | FCM device tokens in DB; `FCM_SERVER_KEY` + LiveKit env validation on startup |
| **7** | Telemetry patients/devices/vitals/presence/notifications persisted to Postgres |

## Your checklist (operations)

1. **Docker Desktop** running  
2. `cd healthcare-platform && docker compose up -d`  
3. `cd backend && npm run db:setup && npm run dev`  
4. `cd frontend && npm run dev`  
5. **Production:** set `JWT_SECRET`, `ENFORCE_JWT=true`, RDS `DATABASE_URL`, deploy with `docker-compose.prod.yml` or PM2 on EC2  
6. **Android release:** point `API_BASE_URL` to `http://34.235.222.220:5000` (or HTTPS API domain)  
7. **FCM:** set `FCM_SERVER_KEY` on server for push when app is closed  

## Verify

- `GET /health` → `database: true`, `jwt: true`  
- `GET /api/platform/status` → `phase: 7` when Postgres connected  
- Login → response includes `token`  
- Restart backend → patients and telemetry data still present  
