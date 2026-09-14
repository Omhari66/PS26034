@echo off
echo ========================================================
echo Starting PS26034 - AI-assisted Legal Metrology Platform
echo ========================================================
echo.

echo [1/3] Starting Backend Server...
start "PS26034 Backend" cmd /k "pnpm run dev:backend"

echo [2/3] Starting Dashboard (Web)...
start "PS26034 Dashboard" cmd /k "pnpm run dev:dashboard"

echo [3/3] Starting Mobile App (Expo)...
start "PS26034 Mobile" cmd /k "pnpm run dev:mobile"

echo.
echo All services are booting up in separate windows!
echo - Backend will be available at: http://localhost:8000
echo - Dashboard will be available at: http://localhost:3000
echo - Mobile Expo server will open in a new tab/window
echo.
echo You can close this window now. The services will continue running in their own windows.
pause
