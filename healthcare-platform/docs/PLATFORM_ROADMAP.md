# Healthcare platform roadmap

**Current mode: Phase 0 or Phase 1** — Set `DATABASE_URL` in `backend/.env` for PostgreSQL (Phase 1). Without it, the API uses in-memory data (Phase 0).

## Phase 0 — Now (mock data, real APIs)

**Goal:** Web + Android call the same REST/Socket endpoints; data lives in server memory (resets on restart).

| When this is "done" | You can verify |
|---------------------|----------------|
| Pages use `/api/*` not local `MOCK_*` arrays | CRUD and lists survive a browser refresh (same server process) |
| Role headers (`x-role`, `x-hospital-id`) on requests | Nurse/doctor/admin see scoped data only |
| `/api/platform/status` | Checklist of wired features per role |
| Scheduler, patients, staff, prescriptions, queue | End-to-end from UI |
| Hospital application, restock, medicine orders (vendor) | API + role headers |
| Platform Testing page (web + Android) | `/api/platform/status` |
| Back navigation (web top bar + Android stack) | Previous service / dashboard |

**Not done yet in Phase 0:** Data survives server restart; multi-server deploy.

---

## Phase 1 — PostgreSQL + Prisma (implemented locally)

**Approach:** Prisma schema + repositories in `backend/src/db/`. Routes keep the same JSON shapes; when `DATABASE_URL` is set, data persists across restarts.

| When done | What changed |
|-----------|----------------|
| `docker compose up -d` in `healthcare-platform/` | Local Postgres on port 5432 |
| `DATABASE_URL` in `backend/.env` | API uses PostgreSQL |
| `npm run db:push` in `backend/` | Tables created; seed runs on first start |
| Repositories behind routes | Patients, users, appointments, schedules, Rx, blood, etc. |

**Local setup:**
```bash
cd healthcare-platform && docker compose up -d
cd backend && cp .env.example .env   # set DATABASE_URL
npm install && npm run db:push && npm run dev
```

---

## Phase 2 — Real login / JWT (implemented)

**Approach:** `POST /api/auth/login` returns `token`; `middleware/jwtAuth.ts` applies claims from Bearer JWT (overrides spoofed `x-role`). Set `ENFORCE_JWT=true` in production to reject requests without a valid token.

| When done | What changed |
|-----------|----------------|
| JWT on web + Android | `Authorization: Bearer` on API calls |
| Middleware | Role/hospital/patient from token claims |
| `ENFORCE_JWT=true` | Production-only hard requirement |

**Env:** `JWT_SECRET`, `JWT_EXPIRES_IN` (default `7d`), `ENFORCE_JWT=false` for local dev.

---

## Phase 3 — Deploy API + DB (config ready)

| When done | What changed |
|-----------|----------------|
| `docker-compose.prod.yml` | Postgres + API + nginx web |
| `backend/ecosystem.config.cjs` | PM2 on EC2 |
| `DEPLOYMENT.md` + `docker-compose.ec2.yml` | Elastic IP deploy |

**You run:** deploy to EC2/RDS with your secrets.

---

## Phase 4 — Clients on production HTTPS (config ready)

| When done | What changed |
|-----------|----------------|
| `frontend/.env.production` | `VITE_API_URL` for AWS IP |
| Android release `API_BASE_URL` | EC2 :5000 in BuildConfig |

---

## Phase 5 — Wire remaining features (core paths done)

| When done | What changed |
|-----------|----------------|
| Patients page + records | `/api/core/patients` |
| Legacy `mock-data` | Fallback only when API unavailable |

---

## Phase 6 — LiveKit + FCM (integrated)

| When done | What changed |
|-----------|----------------|
| LiveKit env on server | Video tokens when keys set |
| `FCM_SERVER_KEY` + device tokens in DB | Push when app backgrounded |

---

## Phase 7 — Telemetry persistence (implemented)

| When done | What changed |
|-----------|----------------|
| Vitals history in DB | `GET /api/telemetry/vitals/history/:patientId` |
| Telemetry seed + hydrate | Patients, devices, vitals snapshots, room presence in Postgres |
| Writes mirrored | Simulator and CRUD persist to DB when connected |

See [PHASE_COMPLETION.md](./PHASE_COMPLETION.md) for ops checklist.

---

## Architecture answers (unchanged at go-live)

| Question | Answer |
|----------|--------|
| App with its own DB? | No — one cloud DB via API; optional SQLite cache on mobile later |
| Same data web + app? | Yes — one API + one DB |
| All features both clients? | Server implements once; UI parity is incremental |
| Telemetry + LiveKit + CRUD? | Yes — realtime + token service + REST/DB |

## Demo logins (password `demo123`)

- `superadmin@demo.com`, `hospitaladmin@demo.com`, `doctor@demo.com`, `nurse@demo.com`, `patient@demo.com`, `vendor@demo.com`, `insurance@demo.com`, `bloodbank@demo.com`
