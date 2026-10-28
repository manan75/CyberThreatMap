@echo off
setlocal
title CyberThreatMap - Health and CORS check
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\check-health.ps1
set RC=%ERRORLEVEL%
if not defined NOPAUSE pause
exit /b %RC%
