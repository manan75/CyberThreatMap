@echo off
setlocal
title CyberThreatMap - Release gate
cd /d "%~dp0"
:: usage: verify-release.bat [version]   (default 9.9.9 = deliberately wrong, gate must reject it)
set VERSION=%1
if "%VERSION%"=="" set VERSION=9.9.9
echo Release gate for version %VERSION%
echo.
node scripts\verify-release.js %VERSION%
set RC=%ERRORLEVEL%
echo.
if %RC%==0 (echo GATE PASSED - release allowed) else (echo GATE REJECTED - exit code %RC%)
if not defined NOPAUSE pause
exit /b %RC%
