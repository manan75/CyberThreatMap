@echo off
setlocal
title CyberThreatMap - Local CI pipeline
cd /d "%~dp0"

echo Local copy of .github/workflows/ci.yml - same commands, same order.
echo.
set FAILED=0

call :stage "1/5 Server: unit tests + coverage"  server "npm run test:coverage"
call :stage "2/5 Server: start + /health smoke"  .      "node scripts\smoke-test.js"
call :stage "3/5 Client: ESLint"                 client "npm run lint"
call :stage "4/5 Client: unit tests"             client "npm test -- --watchAll=false"
set CI=true
call :stage "5/5 Client: production build"       client "npm run build"
set CI=

echo.
echo ===================================================
if %FAILED%==0 (echo   PIPELINE: PASSED - safe to push) else (echo   PIPELINE: FAILED - %FAILED% stage^(s^) red)
echo ===================================================
if not defined NOPAUSE pause
exit /b %FAILED%

:stage
echo ---------- [%~1] ----------
pushd "%~2"
call %~3
if errorlevel 1 (echo [RED] %~1 & set /a FAILED+=1) else (echo [GREEN] %~1)
popd
echo.
exit /b 0
