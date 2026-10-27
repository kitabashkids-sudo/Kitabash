#!/bin/bash
# Double-click to start Kitabash on a Mac. (Linux: run ./start-mac.command)
cd "$(dirname "$0")" || exit 1
echo
echo " ===== Kitabash ====="
echo
if ! command -v node >/dev/null 2>&1; then
  echo "Kitabash needs Node.js, which is not installed on this computer."
  echo "The download page will open now. Install the \"LTS\" version, then double-click start-mac.command again."
  (open https://nodejs.org/en/download || xdg-open https://nodejs.org/en/download) >/dev/null 2>&1
  read -r -p "Press Enter to close this window."
  exit 1
fi
if ! node -e "const [a,b]=process.versions.node.split('.').map(Number);process.exit(a>22||(a===22&&b>=13)?0:1)"; then
  echo "Your Node.js is too old. Kitabash needs version 22.13 or newer."
  (open https://nodejs.org/en/download || xdg-open https://nodejs.org/en/download) >/dev/null 2>&1
  read -r -p "Press Enter to close this window."
  exit 1
fi
if [ ! -d node_modules ]; then
  echo "First start: downloading what Kitabash needs. This takes a few minutes..."
  npm install --no-audit --no-fund || { echo "Something went wrong. Check your internet connection and try again."; read -r -p "Press Enter to close."; exit 1; }
fi
echo "Preparing the app..."
npm run -s build -- --quiet || { echo "Something went wrong while preparing Kitabash."; read -r -p "Press Enter to close."; exit 1; }
echo
echo "Kitabash is starting and your browser will open at http://localhost:3000"
echo "KEEP THIS WINDOW OPEN while you use Kitabash. Close it to stop Kitabash."
echo
OPEN_BROWSER=1 npm start
