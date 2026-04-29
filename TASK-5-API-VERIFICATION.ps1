# Task 5: Backend API Verification Script (PowerShell)
# This script tests all header and footer endpoints

$BASE_URL = "http://localhost:3000"
$ADMIN_TOKEN = ""

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Task 5: Backend API Verification" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$TESTS_PASSED = 0
$TESTS_FAILED = 0

function Test-Result {
    param(
        [bool]$Success,
        [string]$Message
    )
    if ($Success) {
        Write-Host "✓ PASS: $Message" -ForegroundColor Green
        $script:TESTS_PASSED++
    } else {
        Write-Host "✗ FAIL: $Message" -ForegroundColor Red
        $script:TESTS_FAILED++
    }
}

function Invoke-AuthRequest {
    param(
        [string]$Method,
        [string]$Path,
        [string]$Body = $null
    )
    
    $headers = @{
        "Authorization" = "Bearer $script:ADMIN_TOKEN"
        "Content-Type" = "application/json"
    }
    
    try {
        if ($Body) {
            $response = Invoke-RestMethod -Uri "$BASE_URL$Path" -Method $Method -Headers $headers -Body $Body -ErrorAction Stop
        } else {
            $response = Invoke-RestMethod -Uri "$BASE_URL$Path" -Method $Method -Headers $headers -ErrorAction Stop
        }
        return $response
    } catch {
        return $null
    }
}

Write-Host "Step 1: Login as admin user" -ForegroundColor Yellow
Write-Host "----------------------------"
try {
    $loginBody = @{
        email = "admin@example.com"
        password = "admin123"
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "$BASE_URL/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json" -ErrorAction Stop
    $ADMIN_TOKEN = $loginResponse.token
    
    if ($ADMIN_TOKEN) {
        Test-Result $true "Admin login successful"
        Write-Host "Token: $($ADMIN_TOKEN.Substring(0, [Math]::Min(20, $ADMIN_TOKEN.Length)))..."
    } else {
        Test-Result $false "Admin login failed - no token received"
        exit 1
    }
} catch {
    Test-Result $false "Admin login failed - $($_.Exception.Message)"
    Write-Host "Please ensure admin user exists in database" -ForegroundColor Red
    exit 1
}
Write-Host ""

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "HEADER ENDPOINTS TESTING" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Step 2: Test GET /api/admin/header" -ForegroundColor Yellow
Write-Host "-----------------------------------"
$headerGet = Invoke-AuthRequest -Method "GET" -Path "/api/admin/header"
if ($headerGet -and $headerGet.success) {
    Test-Result $true "GET /api/admin/header"
    Write-Host ($headerGet | ConvertTo-Json -Depth 3 | Select-Object -First 5)
} else {
    Test-Result $false "GET /api/admin/header"
}
Write-Host ""

Write-Host "Step 3: Test PUT /api/admin/header (update alt text)" -ForegroundColor Yellow
Write-Host "-----------------------------------------------------"
$updateBody = @{
    logo_alt_text = "Test Logo Vietnamese"
    logo_alt_text_en = "Test Logo English"
} | ConvertTo-Json

$headerUpdate = Invoke-AuthRequest -Method "PUT" -Path "/api/admin/header" -Body $updateBody
if ($headerUpdate -and $headerUpdate.success) {
    Test-Result $true "PUT /api/admin/header"
} else {
    Test-Result $false "PUT /api/admin/header"
}
Write-Host ""

Write-Host "Step 4: Test POST /api/admin/header/logo (file upload)" -ForegroundColor Yellow
Write-Host "-------------------------------------------------------"
# Create a small test PNG (1x1 pixel)
$pngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
$pngBytes = [Convert]::FromBase64String($pngBase64)
$tempFile = [System.IO.Path]::GetTempFileName() + ".png"
[System.IO.File]::WriteAllBytes($tempFile, $pngBytes)

try {
    $boundary = [System.Guid]::NewGuid().ToString()
    $LF = "`r`n"
    
    $bodyLines = (
        "--$boundary",
        "Content-Disposition: form-data; name=`"logo`"; filename=`"test-logo.png`"",
        "Content-Type: image/png$LF",
        [System.Text.Encoding]::GetEncoding("iso-8859-1").GetString($pngBytes),
        "--$boundary--$LF"
    ) -join $LF

    $headers = @{
        "Authorization" = "Bearer $ADMIN_TOKEN"
        "Content-Type" = "multipart/form-data; boundary=$boundary"
    }

    $logoUpload = Invoke-RestMethod -Uri "$BASE_URL/api/admin/header/logo" -Method Post -Headers $headers -Body $bodyLines -ErrorAction Stop
    
    if ($logoUpload -and $logoUpload.success) {
        Test-Result $true "POST /api/admin/header/logo"
        $script:LOGO_URL = $logoUpload.data.logo_url
        Write-Host "Uploaded logo URL: $LOGO_URL"
    } else {
        Test-Result $false "POST /api/admin/header/logo"
    }
} catch {
    Test-Result $false "POST /api/admin/header/logo - $($_.Exception.Message)"
} finally {
    Remove-Item $tempFile -ErrorAction SilentlyContinue
}
Write-Host ""

Write-Host "Step 5: Test GET /api/content/header (public endpoint)" -ForegroundColor Yellow
Write-Host "-------------------------------------------------------"
try {
    $publicHeader = Invoke-RestMethod -Uri "$BASE_URL/api/content/header" -Method Get -ErrorAction Stop
    if ($publicHeader -and $publicHeader.success) {
        Test-Result $true "GET /api/content/header"
    } else {
        Test-Result $false "GET /api/content/header"
    }
} catch {
    Test-Result $false "GET /api/content/header - $($_.Exception.Message)"
}
Write-Host ""

Write-Host "Step 6: Test GET /api/content/header?lang=en (English)" -ForegroundColor Yellow
Write-Host "--------------------------------------------------------"
try {
    $publicHeaderEn = Invoke-RestMethod -Uri "$BASE_URL/api/content/header?lang=en" -Method Get -ErrorAction Stop
    if ($publicHeaderEn -and $publicHeaderEn.success) {
        Test-Result $true "GET /api/content/header?lang=en"
    } else {
        Test-Result $false "GET /api/content/header?lang=en"
    }
} catch {
    Test-Result $false "GET /api/content/header?lang=en - $($_.Exception.Message)"
}
Write-Host ""

Write-Host "Step 7: Verify cache invalidation (header)" -ForegroundColor Yellow
Write-Host "-------------------------------------------"
try {
    $cacheTest1 = Invoke-RestMethod -Uri "$BASE_URL/api/content/header" -Method Get -ErrorAction Stop
    
    $cacheUpdateBody = @{ logo_alt_text = "Cache Test" } | ConvertTo-Json
    Invoke-AuthRequest -Method "PUT" -Path "/api/admin/header" -Body $cacheUpdateBody | Out-Null
    
    $cacheTest2 = Invoke-RestMethod -Uri "$BASE_URL/api/content/header" -Method Get -ErrorAction Stop
    
    if ($cacheTest2.data.logo_alt_text -eq "Cache Test") {
        Test-Result $true "Cache invalidation on header update"
    } else {
        Test-Result $false "Cache invalidation on header update"
    }
} catch {
    Test-Result $false "Cache invalidation test - $($_.Exception.Message)"
}
Write-Host ""

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "FOOTER ENDPOINTS TESTING" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Step 8: Test POST /api/admin/footer/columns (create column)" -ForegroundColor Yellow
Write-Host "------------------------------------------------------------"
$columnBody = @{
    title = "Test Company"
    title_en = "Test Company EN"
    column_type = "company_links"
} | ConvertTo-Json

$columnCreate = Invoke-AuthRequest -Method "POST" -Path "/api/admin/footer/columns" -Body $columnBody
if ($columnCreate -and $columnCreate.success) {
    Test-Result $true "POST /api/admin/footer/columns"
    $script:COLUMN_ID = $columnCreate.data.id
    Write-Host "Created column ID: $COLUMN_ID"
} else {
    Test-Result $false "POST /api/admin/footer/columns"
    $script:COLUMN_ID = $null
}
Write-Host ""

Write-Host "Step 9: Test GET /api/admin/footer/columns" -ForegroundColor Yellow
Write-Host "-------------------------------------------"
$columnsGet = Invoke-AuthRequest -Method "GET" -Path "/api/admin/footer/columns"
if ($columnsGet -and $columnsGet.success) {
    Test-Result $true "GET /api/admin/footer/columns"
} else {
    Test-Result $false "GET /api/admin/footer/columns"
}
Write-Host ""

if ($COLUMN_ID) {
    Write-Host "Step 10: Test PUT /api/admin/footer/columns/:id (update column)" -ForegroundColor Yellow
    Write-Host "----------------------------------------------------------------"
    $columnUpdateBody = @{
        title = "Updated Company"
        title_en = "Updated Company EN"
        status = "published"
    } | ConvertTo-Json
    
    $columnUpdate = Invoke-AuthRequest -Method "PUT" -Path "/api/admin/footer/columns/$COLUMN_ID" -Body $columnUpdateBody
    if ($columnUpdate -and $columnUpdate.success) {
        Test-Result $true "PUT /api/admin/footer/columns/:id"
    } else {
        Test-Result $false "PUT /api/admin/footer/columns/:id"
    }
    Write-Host ""

    Write-Host "Step 11: Test POST /api/admin/footer/columns/:columnId/items (create item)" -ForegroundColor Yellow
    Write-Host "--------------------------------------------------------------------------"
    $itemBody = @{
        item_type = "navigation_link"
        content_data = @{
            label = "About Us"
            label_en = "About Us EN"
            path = "/about"
        }
    } | ConvertTo-Json -Depth 3
    
    $itemCreate = Invoke-AuthRequest -Method "POST" -Path "/api/admin/footer/columns/$COLUMN_ID/items" -Body $itemBody
    if ($itemCreate -and $itemCreate.success) {
        Test-Result $true "POST /api/admin/footer/columns/:columnId/items"
        $script:ITEM_ID = $itemCreate.data.id
        Write-Host "Created item ID: $ITEM_ID"
    } else {
        Test-Result $false "POST /api/admin/footer/columns/:columnId/items"
        $script:ITEM_ID = $null
    }
    Write-Host ""

    Write-Host "Step 12: Test GET /api/admin/footer/columns/:columnId/items" -ForegroundColor Yellow
    Write-Host "------------------------------------------------------------"
    $itemsGet = Invoke-AuthRequest -Method "GET" -Path "/api/admin/footer/columns/$COLUMN_ID/items"
    if ($itemsGet -and $itemsGet.success) {
        Test-Result $true "GET /api/admin/footer/columns/:columnId/items"
    } else {
        Test-Result $false "GET /api/admin/footer/columns/:columnId/items"
    }
    Write-Host ""

    if ($ITEM_ID) {
        Write-Host "Step 13: Test PUT /api/admin/footer/columns/:columnId/items/:id (update item)" -ForegroundColor Yellow
        Write-Host "-----------------------------------------------------------------------------"
        $itemUpdateBody = @{
            content_data = @{
                label = "Updated About"
                label_en = "Updated About EN"
                path = "/about-us"
            }
        } | ConvertTo-Json -Depth 3
        
        $itemUpdate = Invoke-AuthRequest -Method "PUT" -Path "/api/admin/footer/columns/$COLUMN_ID/items/$ITEM_ID" -Body $itemUpdateBody
        if ($itemUpdate -and $itemUpdate.success) {
            Test-Result $true "PUT /api/admin/footer/columns/:columnId/items/:id"
        } else {
            Test-Result $false "PUT /api/admin/footer/columns/:columnId/items/:id"
        }
        Write-Host ""

        Write-Host "Step 14: Test PUT /api/admin/footer/columns/:columnId/items/:id/reorder" -ForegroundColor Yellow
        Write-Host "------------------------------------------------------------------------"
        $itemReorderBody = @{ newOrder = 1 } | ConvertTo-Json
        
        $itemReorder = Invoke-AuthRequest -Method "PUT" -Path "/api/admin/footer/columns/$COLUMN_ID/items/$ITEM_ID/reorder" -Body $itemReorderBody
        if ($itemReorder -and $itemReorder.success) {
            Test-Result $true "PUT /api/admin/footer/columns/:columnId/items/:id/reorder"
        } else {
            Test-Result $false "PUT /api/admin/footer/columns/:columnId/items/:id/reorder"
        }
        Write-Host ""
    }

    Write-Host "Step 15: Test PUT /api/admin/footer/columns/:id/reorder" -ForegroundColor Yellow
    Write-Host "--------------------------------------------------------"
    $columnReorderBody = @{ newOrder = 1 } | ConvertTo-Json
    
    $columnReorder = Invoke-AuthRequest -Method "PUT" -Path "/api/admin/footer/columns/$COLUMN_ID/reorder" -Body $columnReorderBody
    if ($columnReorder -and $columnReorder.success) {
        Test-Result $true "PUT /api/admin/footer/columns/:id/reorder"
    } else {
        Test-Result $false "PUT /api/admin/footer/columns/:id/reorder"
    }
    Write-Host ""
}

Write-Host "Step 16: Test GET /api/content/footer (public endpoint)" -ForegroundColor Yellow
Write-Host "--------------------------------------------------------"
try {
    $publicFooter = Invoke-RestMethod -Uri "$BASE_URL/api/content/footer" -Method Get -ErrorAction Stop
    if ($publicFooter -and $publicFooter.success) {
        Test-Result $true "GET /api/content/footer"
    } else {
        Test-Result $false "GET /api/content/footer"
    }
} catch {
    Test-Result $false "GET /api/content/footer - $($_.Exception.Message)"
}
Write-Host ""

Write-Host "Step 17: Test GET /api/content/footer?lang=en (English)" -ForegroundColor Yellow
Write-Host "--------------------------------------------------------"
try {
    $publicFooterEn = Invoke-RestMethod -Uri "$BASE_URL/api/content/footer?lang=en" -Method Get -ErrorAction Stop
    if ($publicFooterEn -and $publicFooterEn.success) {
        Test-Result $true "GET /api/content/footer?lang=en"
    } else {
        Test-Result $false "GET /api/content/footer?lang=en"
    }
} catch {
    Test-Result $false "GET /api/content/footer?lang=en - $($_.Exception.Message)"
}
Write-Host ""

Write-Host "Step 18: Verify cache invalidation (footer)" -ForegroundColor Yellow
Write-Host "--------------------------------------------"
if ($COLUMN_ID) {
    try {
        $cacheTest3 = Invoke-RestMethod -Uri "$BASE_URL/api/content/footer" -Method Get -ErrorAction Stop
        
        $cacheUpdateBody2 = @{ title = "Cache Invalidation Test" } | ConvertTo-Json
        Invoke-AuthRequest -Method "PUT" -Path "/api/admin/footer/columns/$COLUMN_ID" -Body $cacheUpdateBody2 | Out-Null
        
        Start-Sleep -Milliseconds 500
        
        $cacheTest4 = Invoke-RestMethod -Uri "$BASE_URL/api/content/footer" -Method Get -ErrorAction Stop
        
        $foundCacheTest = $false
        foreach ($col in $cacheTest4.data.columns) {
            if ($col.title -eq "Cache Invalidation Test") {
                $foundCacheTest = $true
                break
            }
        }
        
        if ($foundCacheTest) {
            Test-Result $true "Cache invalidation on footer update"
        } else {
            Test-Result $false "Cache invalidation on footer update"
        }
    } catch {
        Test-Result $false "Cache invalidation test - $($_.Exception.Message)"
    }
} else {
    Test-Result $false "Cache invalidation test - no column ID available"
}
Write-Host ""

Write-Host "Step 19: Verify file upload and file serving" -ForegroundColor Yellow
Write-Host "---------------------------------------------"
if ($LOGO_URL) {
    try {
        $fileResponse = Invoke-WebRequest -Uri "$BASE_URL$LOGO_URL" -Method Get -ErrorAction Stop
        if ($fileResponse.StatusCode -eq 200) {
            Test-Result $true "File serving from /uploads"
        } else {
            Test-Result $false "File serving from /uploads (HTTP $($fileResponse.StatusCode))"
        }
    } catch {
        Test-Result $false "File serving - $($_.Exception.Message)"
    }
} else {
    Test-Result $false "File serving (no logo URL available)"
}
Write-Host ""

Write-Host "Step 20: Check audit logs" -ForegroundColor Yellow
Write-Host "-------------------------"
$auditLogs = Invoke-AuthRequest -Method "GET" -Path "/api/admin/audit-logs?limit=5"
if ($auditLogs -and $auditLogs.data -and $auditLogs.data.Count -gt 0) {
    $hasUpdateAction = $false
    foreach ($log in $auditLogs.data) {
        if ($log.action -eq "update") {
            $hasUpdateAction = $true
            break
        }
    }
    if ($hasUpdateAction) {
        Test-Result $true "Audit logs are being created"
    } else {
        Test-Result $false "Audit logs verification (no update actions found)"
    }
} else {
    Test-Result $false "Audit logs verification"
}
Write-Host ""

# Cleanup
if ($ITEM_ID -and $COLUMN_ID) {
    Write-Host "Step 21: Cleanup - Delete test item" -ForegroundColor Yellow
    Write-Host "------------------------------------"
    $deleteItem = Invoke-AuthRequest -Method "DELETE" -Path "/api/admin/footer/columns/$COLUMN_ID/items/$ITEM_ID"
    if ($deleteItem -and $deleteItem.success) {
        Test-Result $true "DELETE /api/admin/footer/columns/:columnId/items/:id"
    } else {
        Test-Result $false "DELETE /api/admin/footer/columns/:columnId/items/:id"
    }
    Write-Host ""
}

if ($COLUMN_ID) {
    Write-Host "Step 22: Cleanup - Delete test column" -ForegroundColor Yellow
    Write-Host "--------------------------------------"
    $deleteColumn = Invoke-AuthRequest -Method "DELETE" -Path "/api/admin/footer/columns/$COLUMN_ID"
    if ($deleteColumn -and $deleteColumn.success) {
        Test-Result $true "DELETE /api/admin/footer/columns/:id"
    } else {
        Test-Result $false "DELETE /api/admin/footer/columns/:id"
    }
    Write-Host ""
}

Write-Host "Step 23: Cleanup - Delete test logo" -ForegroundColor Yellow
Write-Host "------------------------------------"
$deleteLogo = Invoke-AuthRequest -Method "DELETE" -Path "/api/admin/header/logo"
if ($deleteLogo -and $deleteLogo.success) {
    Test-Result $true "DELETE /api/admin/header/logo"
} else {
    Test-Result $false "DELETE /api/admin/header/logo"
}
Write-Host ""

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "VERIFICATION SUMMARY" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Tests Passed: $TESTS_PASSED" -ForegroundColor Green
Write-Host "Tests Failed: $TESTS_FAILED" -ForegroundColor Red
Write-Host ""

if ($TESTS_FAILED -eq 0) {
    Write-Host "✓ ALL TESTS PASSED" -ForegroundColor Green
    Write-Host "All backend API endpoints are working correctly!"
    exit 0
} else {
    Write-Host "✗ SOME TESTS FAILED" -ForegroundColor Red
    Write-Host "Please review the failed tests above."
    exit 1
}
