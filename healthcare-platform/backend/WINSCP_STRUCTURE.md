# WinSCP Backend Upload Structure (AWS / Linux server)

## WinSCP connection (EC2)

| Setting | Value |
|---------|--------|
| Protocol | **SFTP** |
| Host | `34.235.222.220` |
| Port | `22` |
| Username | `ubuntu` |
| Private key | `E:\Important API Docs\Keys\a-healthcare.pem` or `healthcare-unified.ppk` |

See **`E:\Important API Docs\Keys\WINSCP_EC2_SETUP.md`** for troubleshooting login failures.

Use this layout on the **remote server** when uploading via WinSCP.  
Do **not** upload `node_modules` — install on the server with `npm install`.

---

## Option A – Upload source, build on server (recommended)

On your **local** machine, upload everything below **except** `node_modules` and `dist`.

**Remote folder (e.g. `/home/ubuntu/healthcare-backend` or `C:\app\backend`):**

```
healthcare-backend/
├── .env                    ← Required (LIVEKIT_*, PORT, etc.). Create from .env.example if needed.
├── .env.example            ← Optional; reference only
├── package.json
├── package-lock.json
├── tsconfig.json
└── src/
    ├── server.ts
    └── routes/
        ├── auth.ts
        ├── dashboard.ts
        └── video.ts
```

**After upload (SSH into server):**

```bash
cd /path/to/healthcare-backend
npm install
npm run build
node dist/server.js
# Or with PM2: pm2 start dist/server.js --name healthcare-api
```

---

## Option B – Upload pre-built (no TypeScript on server)

Upload the **built** `dist` folder and **do not** upload `src/` or `tsconfig.json`.  
Server only needs Node.js (no `tsc`).

**Remote folder:**

```
healthcare-backend/
├── .env
├── package.json
├── package-lock.json
└── dist/
    ├── server.js
    └── routes/
        ├── auth.js
        ├── dashboard.js
        └── video.js
```

**After upload (SSH):**

```bash
cd /path/to/healthcare-backend
npm install --production
node dist/server.js
```

*(Build locally first: `npm run build` in the backend folder, then upload the new `dist/`.)*

---

## What to exclude in WinSCP

- **node_modules/** – always exclude; run `npm install` on the server.
- **.git/** – optional to exclude to speed up upload.
- **dist/** – exclude only if using Option A (you build on server).

---

## .env – required (upload via WinSCP or create in PuTTY)

The backend **will not work correctly** without a `.env` file in the backend root (e.g. LiveKit and PORT). Either:

- **Upload** your local `backend/.env` via WinSCP into `/home/ubuntu/healthcare-backend/`, or  
- **Create** it on the server with the PuTTY commands below.

Contents (use your real values; PORT is optional, defaults to 5000):

```env
PORT=5000
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret
```

### Create .env on server via PuTTY (if you did not upload it)

```bash
cd /home/ubuntu/healthcare-backend
nano .env
```

Paste the 3–4 lines above (with your real LiveKit values). Save: **Ctrl+O**, Enter, **Ctrl+X**. Then restart the app if it’s already running:

```bash
pm2 restart healthcare-api
```

---

## Quick checklist

| Item              | Action |
|-------------------|--------|
| package.json      | Upload |
| package-lock.json | Upload |
| **.env**          | **Required.** Upload via WinSCP or create in PuTTY (see above). |
| src/              | Upload (Option A) |
| dist/             | Upload (Option B only) or build on server (Option A) |
| node_modules/     | Do **not** upload; run `npm install` on server |
