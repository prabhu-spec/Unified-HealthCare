# Healthcare Android App

Native Android client for the healthcare platform.

## API endpoints

| Build | `API_BASE_URL` |
|-------|----------------|
| **Debug** (emulator) | `http://10.0.2.2:5000` |
| **Release** (AWS) | `http://34.235.222.220:5000` |

Change the release URL in `app/build.gradle.kts` if the EC2 IP changes.

## Build

```bash
# Debug APK (local backend / emulator)
./gradlew assembleDebug

# Release APK (AWS backend)
./gradlew assembleRelease
```

Output: `app/build/outputs/apk/`

## Login

- **Debug:** shows a short dev notice; demo accounts work via the server.
- **Release:** no credential hints on screen; same demo users (`patient@demo.com` / `demo123`, etc.) still work against AWS.

## Open in Android Studio

**File → Open** → `Healthcare-app` folder → Run.

See `../healthcare-platform/DEPLOYMENT.md` for Docker and EC2 deployment.
