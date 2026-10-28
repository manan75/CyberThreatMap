# Used by check-health.bat. Checks /health and the CORS allowlist of a running backend.
$base = 'http://localhost:4000/health'
$fail = 0

Write-Host "[1] GET $base" -ForegroundColor Cyan
try {
    $res = Invoke-RestMethod -Uri $base -TimeoutSec 3
    $res | ConvertTo-Json -Depth 5
    Write-Host ("status=" + $res.status + "  version=" + $res.version + "  env=" + $res.environment + "  uptime=" + $res.uptimeSeconds + "s") -ForegroundColor Green
    Write-Host ("last poll: " + $res.lastPollAt + "  threats: " + $res.lastThreatCount) -ForegroundColor Green
} catch {
    Write-Host '[FAIL] Backend not reachable on :4000. Run start-app.bat first.' -ForegroundColor Red
    exit 1
}

function Get-AcaoHeader($origin) {
    $r = Invoke-WebRequest -Uri $base -Headers @{ Origin = $origin } -UseBasicParsing -TimeoutSec 3
    return $r.Headers['Access-Control-Allow-Origin']
}

Write-Host "`n[2] CORS: allowed origin http://localhost:3000" -ForegroundColor Cyan
$h = Get-AcaoHeader 'http://localhost:3000'
if ($h) { Write-Host "[PASS] Access-Control-Allow-Origin: $h" -ForegroundColor Green }
else    { Write-Host '[FAIL] header missing for allowed origin' -ForegroundColor Red; $fail = 1 }

Write-Host "`n[3] CORS: disallowed origin https://evil.example" -ForegroundColor Cyan
$h = Get-AcaoHeader 'https://evil.example'
if (-not $h) { Write-Host '[PASS] no Access-Control-Allow-Origin header - browser blocks it' -ForegroundColor Green }
else         { Write-Host "[WARN] origin allowed ($h). Expected in production without CORS_ORIGINS set." -ForegroundColor Yellow }

exit $fail
