@echo off
setlocal
title CyberThreatMap - Automated tests
cd /d "%~dp0"
set FAILED=0

call :suite "Server unit tests"   server "npm test"
call :suite "Server coverage"     server "npm run test:coverage"
call :suite "Client lint"         client "npm run lint"
call :suite "Client unit tests"   client "npm test -- --watchAll=false"

echo ===================================================
if %FAILED%==0 (echo   ALL SUITES PASSED) else (echo   %FAILED% SUITE^(S^) FAILED)
echo ===================================================
if not defined NOPAUSE pause
exit /b %FAILED%

:suite
echo ---------- %~1 ----------
pushd "%~2"
call %~3
if errorlevel 1 (echo [FAIL] %~1 & set /a FAILED+=1) else (echo [PASS] %~1)
popd
echo.
exit /b 0
