# Healthcare platform architecture

## System layers

```
┌─────────────────┐     ┌─────────────────┐
│  Web (Vite/React)│     │ Android (Kotlin) │
│  localhost:5173  │     │  Healthcare-app  │
└────────┬────────┘     └────────┬─────────┘
         │  REST + Socket.IO      │
         └──────────┬─────────────┘
                    ▼
         ┌──────────────────────┐
         │  Express API :5000    │
         │  middleware/jwtAuth   │
         │  routes/* + telemetry │
         └──────────┬───────────┘
                    │
         ┌──────────┴───────────┐
         ▼                      ▼
  PostgreSQL (Phase 1)    In-memory fallback
  Prisma repositories     (Phase 0, no Docker)
         │
  LiveKit / SendGrid / FCM (Phases 6–7)
```

## Backend layout (`healthcare-platform/backend/`)

| Path | Role |
|------|------|
| `src/server.ts` | HTTP + Socket.IO bootstrap, DB init |
| `src/middleware/jwtAuth.ts` | Bearer JWT → trusted `x-role` claims |
| `src/routes/` | REST handlers (coreCare, dashboard, auth, …) |
| `src/db/repositories/` | Prisma data access (Phase 1) |
| `src/db/seed.ts` | Demo hospitals, users, patients |
| `src/telemetry/` | Live vitals (in-memory until Phase 7) |
| `prisma/schema.prisma` | Single source of truth for persistence |

## Client contract

- **Login:** `POST /api/auth/login` → `{ user, token }`
- **API calls:** `Authorization: Bearer <token>` plus optional legacy `x-*` headers (ignored when JWT is valid)
- **Roles:** `super_admin`, `hospital_admin`, `doctor`, `nurse`, `patient`, `medical_vendor`, `insurance_provider`, `bloodbank_admin`

## Phase map

See [PLATFORM_ROADMAP.md](./PLATFORM_ROADMAP.md) for the full checklist.

| Phase | Status | Focus |
|-------|--------|--------|
| 0 | Done | Real APIs, in-memory data |
| 1 | Code done | PostgreSQL + Prisma (needs Docker + `db:push`) |
| 2 | In progress | JWT issued on login; web + Android send Bearer |
| 3–4 | Planned | EC2/RDS deploy, production client URLs |
| 5 | Planned | Remaining UI → API parity |
| 6–7 | Planned | LiveKit prod, FCM, telemetry persistence |
