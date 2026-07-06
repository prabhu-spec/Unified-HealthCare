#!/usr/bin/env bash
set -euo pipefail

echo "===================================================="
echo " FIXING VITE + REACT FRONTEND"
echo "===================================================="

# -----------------------------------------------------
# 1. package.json (overwrite safely)
# -----------------------------------------------------
cat > package.json <<'EOF'
{
  "name": "frontend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.2.3",
    "react-dom": "^19.2.3"
  },
  "devDependencies": {
    "vite": "^7.3.0"
  }
}
EOF

echo "✔ package.json fixed"

# -----------------------------------------------------
# 2. index.html (Vite entry)
# -----------------------------------------------------
cat > index.html <<'EOF'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Healthcare Frontend</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
EOF

echo "✔ index.html created"

# -----------------------------------------------------
# 3. React entry files
# -----------------------------------------------------
mkdir -p src

cat > src/main.jsx <<'EOF'
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
EOF

cat > src/App.jsx <<'EOF'
export default function App() {
  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Healthcare frontend working</h1>
      <p>Vite + React deployment successful.</p>
    </div>
  );
}
EOF

echo "✔ React entry files created"

# -----------------------------------------------------
# 4. Clean install
# -----------------------------------------------------
echo "▶ Installing dependencies"
rm -rf node_modules package-lock.json
npm install

# -----------------------------------------------------
# 5. Build
# -----------------------------------------------------
echo "▶ Building frontend"
npm run build

# -----------------------------------------------------
# 6. Verify
# -----------------------------------------------------
if [ ! -d dist ]; then
  echo "❌ Build failed: dist/ not found"
  exit 1
fi

echo ""
echo "===================================================="
echo " ✅ FRONTEND READY"
echo "===================================================="
echo "Build output: frontend/dist/"
echo "Next step: deploy to S3 + CloudFront"

