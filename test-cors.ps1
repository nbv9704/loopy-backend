# CORS Configuration Test Script
# Tests that CORS only allows the main frontend origin (port 5173)

Write-Host "Testing CORS Configuration..." -ForegroundColor Cyan
Write-Host ""

# Test 1: Allowed origin (port 5173)
Write-Host "Test 1: Request from allowed origin (http://localhost:5173)" -ForegroundColor Yellow
$headers = @{ "Origin" = "http://localhost:5173" }
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -Headers $headers -Method GET
    $allowedOrigin = $response.Headers["Access-Control-Allow-Origin"]
    
    if ($response.StatusCode -eq 200 -and $allowedOrigin -eq "http://localhost:5173") {
        Write-Host "✅ PASS: Request succeeded with status $($response.StatusCode)" -ForegroundColor Green
        Write-Host "   Access-Control-Allow-Origin: $allowedOrigin" -ForegroundColor Green
    } else {
        Write-Host "❌ FAIL: Unexpected response" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ FAIL: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 2: Old admin origin (port 5174) - should be blocked
Write-Host "Test 2: Request from old admin origin (http://localhost:5174)" -ForegroundColor Yellow
$headers = @{ "Origin" = "http://localhost:5174" }
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -Headers $headers -Method GET -ErrorAction Stop
    Write-Host "❌ FAIL: Request should have been blocked by CORS but succeeded" -ForegroundColor Red
} catch {
    if ($_.Exception.Message -like "*500*") {
        Write-Host "✅ PASS: Request blocked by CORS (500 error)" -ForegroundColor Green
    } else {
        Write-Host "⚠️  WARNING: Unexpected error: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

Write-Host ""

# Test 3: No origin header - should be allowed
Write-Host "Test 3: Request with no origin header" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -Method GET
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ PASS: Request succeeded (no origin header is allowed)" -ForegroundColor Green
    } else {
        Write-Host "❌ FAIL: Unexpected status code $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ FAIL: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "CORS Configuration Test Complete!" -ForegroundColor Cyan
