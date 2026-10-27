@echo off
title Kitabash
cd /d "%~dp0"
echo.
echo  ===== Kitabash =====
echo.
where node >nul 2>nul
if errorlevel 1 goto nonode
node -e "const [a,b]=process.versions.node.split('.').map(Number);process.exit(a>22||(a===22&&b>=13)?0:1)"
if errorlevel 1 goto oldnode
if not exist node_modules (
  echo First start: downloading what Kitabash needs. This takes a few minutes...
  call npm install --no-audit --no-fund
  if errorlevel 1 goto installfail
)
echo Preparing the app...
call npm run -s build -- --quiet
if errorlevel 1 goto installfail
echo.
echo Kitabash is starting and your browser will open at http://localhost:3000
echo KEEP THIS WINDOW OPEN while you use Kitabash. Close it to stop Kitabash.
echo.
set OPEN_BROWSER=1
call npm start
pause
exit /b 0

:nonode
echo Kitabash needs Node.js, which is not installed on this computer.
echo The download page will open now. Install the "LTS" version,
echo then double-click start-windows.bat again.
start https://nodejs.org/en/download
pause
exit /b 1

:oldnode
echo Your Node.js is too old. Kitabash needs version 22.13 or newer.
echo The download page will open now. Install the "LTS" version, then try again.
start https://nodejs.org/en/download
pause
exit /b 1

:installfail
echo Something went wrong while preparing Kitabash.
echo Check your internet connection and double-click start-windows.bat again.
pause
exit /b 1
