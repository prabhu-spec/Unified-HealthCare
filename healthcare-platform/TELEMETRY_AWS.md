# Telemetry on AWS — why it differs from localhost

## There is no MQTT in this project

Live vitals on **localhost** come from the **Node backend**, not Docker MQTT:

- `startVitalsSimulator()` in `backend/src/telemetry/vitalsEngine.ts` (runs every 1 second)
- **Socket.IO** event `rpm` → browser **Live Telemetry** page
- In-memory patients/devices in `backend/src/telemetry/store.ts`

If you used MQTT in another Docker stack locally, that was **not** uploaded to EC2. Only the backend PM2 process provides telemetry on AWS unless you add MQTT ingestion separately.

---

## Why AWS web often shows no live telemetry

| Cause | Localhost | AWS |
|--------|-----------|-----|
| Vite dev **proxy** | `/socket.io` → `localhost:5000` | No proxy unless nginx |
| Frontend build env | `.env.development` | Must set `.env.production` at **build time** |
| **HTTPS** site → **HTTP** API | Rare locally | **Blocked** (mixed content) |
| PM2 simulator | Starts with server | Must see log: `vitals simulator started` |

---

## Fix A — Recommended: one origin on EC2 (nginx + PM2)

### 1. On EC2 — confirm backend + simulator

```bash
pm2 logs healthcare-api --lines 20
curl -s http://127.0.0.1:5000/health
bash ~/scripts/verify-telemetry-ec2.sh
```

You must see `"telemetry":true` and in logs: `[telemetry] vitals simulator started`.

### 2. Rebuild frontend (on EC2 or your PC)

**Option 1 — same server (best for telemetry):**

```bash
cd ~/frontend
cp .env.production.nginx .env.production
# Or create .env.production with empty VITE_API_URL and VITE_SOCKET_URL
npm install
npm run build
sudo mkdir -p /var/www/healthcare
sudo cp -r dist/* /var/www/healthcare/
```

**Option 2 — direct to port 5000:**

```env
VITE_API_URL=http://34.235.222.220:5000
VITE_SOCKET_URL=http://34.235.222.220:5000
```

Then `npm run build` again.

### 3. Install nginx (unified origin)

```bash
sudo apt-get install -y nginx
sudo cp ~/scripts/nginx-ec2-unified.conf /etc/nginx/sites-available/healthcare
sudo ln -sf /etc/nginx/sites-available/healthcare /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

Open **http://34.235.222.220/** (port **80**), login **doctor@demo.com** / **demo123**, go to **Live Telemetry**.

Stream badge should say **live** (green).

Security group: allow **80** and **5000**.

### 4. Restart backend after code updates

```bash
cd ~/backend
npm run build
pm2 restart healthcare-api
pm2 save
```

---

## Fix B — Frontend on S3 / CloudFront (HTTPS)

If the site is **https://** (e.g. CloudFront) and API is **http://34.235.222.220:5000**:

- Browsers **block** Socket.IO and often API calls (**mixed content**).
- Telemetry will **not** match localhost.

**Options:**

1. Serve the UI from EC2 over **HTTP** (Fix A), or  
2. Put **HTTPS** on the API (ALB + certificate), or  
3. CloudFront origin path that proxies `/api` and `/socket.io` to EC2.

Rebuild S3 assets **after** setting env:

```bash
cd frontend
# .env.production must have your public API URL
npm run build
aws s3 sync dist/ s3://YOUR-BUCKET/healthcare/ --delete
```

---

## Browser check (doctor account)

1. F12 → **Network** → filter `socket.io` — should connect to `34.235.222.220:5000` or same host as the page.  
2. **Live Telemetry** → badge **Stream live** (not “reconnecting…”).  
3. PuTTY: `pm2 logs healthcare-api` — should show connections when you open the page.

---

## Login for telemetry pages

| Page | Role |
|------|------|
| Live Telemetry | **doctor@demo.com** |
| Overview | doctor, hospital admin, patient |
| Devices | hospital admin |

Doctor must have `hospitalId: org-1` (demo user already does).
