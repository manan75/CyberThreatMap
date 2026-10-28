@echo off
setlocal
title CyberThreatMap - Start
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js not found. Install Node 22 or newer from https://nodejs.org
    if not defined NOPAUSE pause
    exit /b 1
)

if not exist "server\node_modules" (
    echo [setup] npm ci in server...
    pushd server
    call npm ci || (popd & exit /b 1)
    popd
)
if not exist "client\node_modules" (
    echo [setup] npm ci in client...
    pushd client
    call npm ci || (popd & exit /b 1)
    popd
)
if not exist "server\.env" copy "server\.env.example" "server\.env" >nul
if not exist "client\.env.local" copy "client\.env.example" "client\.env.local" >nul

netstat -ano | findstr /R /C:":4000 .*LISTENING" >nul
if not errorlevel 1 (
    echo [ERROR] Port 4000 is already in use. Run stop-app.bat first.
    if not defined NOPAUSE pause
    exit /b 1
)
netstat -ano | findstr /R /C:":3000 .*LISTENING" >nul
if not errorlevel 1 (
    echo [ERROR] Port 3000 is already in use. Run stop-app.bat first.
    if not defined NOPAUSE pause
    exit /b 1
)

echo [1/2] Starting backend  ^(window "CTM-Backend"^)
start "CTM-Backend" /D "%~dp0server" cmd /k npm run dev

echo Waiting for http://localhost:4000/health ...
powershell -NoProfile -ExecutionPolicy Bypass -Command "for ($i=0; $i -lt 30; $i++) { try { if ((Invoke-RestMethod http://localhost:4000/health -TimeoutSec 2).status -eq 'ok') { exit 0 } } catch {}; Start-Sleep 1 }; exit 1"
if errorlevel 1 (
    echo [ERROR] Backend did not become healthy in 30s. See the CTM-Backend window.
    if not defined NOPAUSE pause
    exit /b 1
)
echo Backend is healthy.

echo [2/2] Starting frontend ^(window "CTM-Frontend"^) - browser opens when it has compiled
start "CTM-Frontend" /D "%~dp0client" cmd /k npm start

echo.
echo   Backend : http://localhost:4000   Health: http://localhost:4000/health
echo   Frontend: http://localhost:3000
echo   Stop    : stop-app.bat
exit /b 0
