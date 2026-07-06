# Fix telemetry on S3 website

Your app URL: `http://unified-healthcare.s3-website-us-east-1.amazonaws.com`

The UI is on **S3**. The API is on **EC2** `http://34.235.222.220:5000`.

If the frontend was built with **empty** `VITE_API_URL`, the browser calls the S3 host for `/api/...` and you get **Loading ward overview…** or **Failed to fetch**.

## Fix (on your Windows PC)

```powershell
cd e:\Healthcare-platform-new\healthcare-platform\scripts
.\build-frontend-for-s3.ps1
```

## Upload to S3

Upload **everything inside** `frontend\dist\` (not the `dist` folder itself as a single object):

- `index.html` → bucket root (or your site prefix)
- `assets/` → bucket root `assets/`

**AWS Console:** S3 → `unified-healthcare` → Upload → drag files from `dist\`

**AWS CLI (optional):**

```bash
aws s3 sync frontend/dist/ s3://unified-healthcare/ --delete
```

Hard-refresh the browser (Ctrl+F5) or use a private window.

## EC2 checks (PuTTY)

Backend must stay running:

```bash
curl -s http://127.0.0.1:5000/health
pm2 status
```

Security group must allow **inbound TCP 5000** from `0.0.0.0/0` (or your IP) so browsers can reach the API.

CORS defaults to `*` in `server.ts`; optional:

```bash
export CORS_ORIGIN=http://unified-healthcare.s3-website-us-east-1.amazonaws.com
pm2 restart healthcare-api --update-env
```

## Test in browser (F12 → Network)

After login, you should see:

- `http://34.235.222.220:5000/api/telemetry/overview` → **200** JSON  
- `socket.io` → **101** or polling to same host  

Not requests to `s3-website-us-east-1.amazonaws.com/api/...`

## Do not use EC2 nginx deploy for S3 users

`ec2-deploy-fix.sh` (empty `VITE_API_URL`) is only for **http://34.235.222.220/** served by nginx on EC2.

For S3, always use `build-frontend-for-s3.ps1`.
