@echo off
setlocal
title CyberThreatMap - Stop
cd /d "%~dp0"
echo Stopping anything listening on :4000 (backend) and :3000 (frontend)...
powershell -NoProfile -ExecutionPolicy Bypass -Command "foreach ($p in 4000,3000) { $pids = Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique; if (-not $pids) { Write-Host ('port ' + $p + ' already free') } else { foreach ($id in $pids) { Stop-Process -Id $id -Force -ErrorAction SilentlyContinue; Write-Host ('port ' + $p + ': stopped PID ' + $id) } } }"
:: close the two console windows opened by start-app.bat
taskkill /FI "WINDOWTITLE eq CTM-Backend*" /T /F >nul 2>nul
taskkill /FI "WINDOWTITLE eq CTM-Frontend*" /T /F >nul 2>nul
echo Done.
if not defined NOPAUSE pause
exit /b 0
