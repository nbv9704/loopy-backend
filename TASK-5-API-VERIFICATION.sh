#!/bin/bash

# Task 5: Backend API Verification Script
# This script tests all header and footer endpoints

BASE_URL="http://localhost:3000"
ADMIN_TOKEN=""  # Will be set after login

echo "=========================================="
echo "Task 5: Backend API Verification"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to print test result
test_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ PASS${NC}: $2"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC}: $2"
        ((TESTS_FAILED++))
    fi
}

# Function to make authenticated request
auth_request() {
    curl -s -X "$1" "$BASE_URL$2" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -H "Content-Type: application/json" \
        ${3:+-d "$3"}
}

echo "Step 1: Login as admin user"
echo "----------------------------"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@example.com","password":"admin123"}')

ADMIN_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -n "$ADMIN_TOKEN" ]; then
    test_result 0 "Admin login successful"
    echo "Token: ${ADMIN_TOKEN:0:20}..."
else
    test_result 1 "Admin login failed"
    echo "Response: $LOGIN_RESPONSE"
    echo "Please ensure admin user exists in database"
    exit 1
fi
echo ""

echo "=========================================="
echo "HEADER ENDPOINTS TESTING"
echo "=========================================="
echo ""

echo "Step 2: Test GET /api/admin/header"
echo "-----------------------------------"
HEADER_GET=$(auth_request "GET" "/api/admin/header")
echo "$HEADER_GET" | head -n 5
if echo "$HEADER_GET" | grep -q '"success":true'; then
    test_result 0 "GET /api/admin/header"
else
    test_result 1 "GET /api/admin/header"
fi
echo ""

echo "Step 3: Test PUT /api/admin/header (update alt text)"
echo "-----------------------------------------------------"
HEADER_UPDATE=$(auth_request "PUT" "/api/admin/header" \
    '{"logo_alt_text":"Test Logo Vietnamese","logo_alt_text_en":"Test Logo English"}')
echo "$HEADER_UPDATE" | head -n 5
if echo "$HEADER_UPDATE" | grep -q '"success":true'; then
    test_result 0 "PUT /api/admin/header"
else
    test_result 1 "PUT /api/admin/header"
fi
echo ""

echo "Step 4: Test POST /api/admin/header/logo (file upload)"
echo "-------------------------------------------------------"
# Create a small test image (1x1 PNG)
echo -n "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" | base64 -d > /tmp/test-logo.png

LOGO_UPLOAD=$(curl -s -X POST "$BASE_URL/api/admin/header/logo" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -F "logo=@/tmp/test-logo.png")
echo "$LOGO_UPLOAD" | head -n 5
if echo "$LOGO_UPLOAD" | grep -q '"success":true'; then
    test_result 0 "POST /api/admin/header/logo"
    LOGO_URL=$(echo $LOGO_UPLOAD | grep -o '"logo_url":"[^"]*' | cut -d'"' -f4)
    echo "Uploaded logo URL: $LOGO_URL"
else
    test_result 1 "POST /api/admin/header/logo"
fi
echo ""

echo "Step 5: Test GET /api/content/header (public endpoint)"
echo "-------------------------------------------------------"
PUBLIC_HEADER=$(curl -s "$BASE_URL/api/content/header")
echo "$PUBLIC_HEADER" | head -n 5
if echo "$PUBLIC_HEADER" | grep -q '"success":true'; then
    test_result 0 "GET /api/content/header"
else
    test_result 1 "GET /api/content/header"
fi
echo ""

echo "Step 6: Test GET /api/content/header?lang=en (English)"
echo "--------------------------------------------------------"
PUBLIC_HEADER_EN=$(curl -s "$BASE_URL/api/content/header?lang=en")
echo "$PUBLIC_HEADER_EN" | head -n 5
if echo "$PUBLIC_HEADER_EN" | grep -q '"success":true'; then
    test_result 0 "GET /api/content/header?lang=en"
else
    test_result 1 "GET /api/content/header?lang=en"
fi
echo ""

echo "Step 7: Verify cache invalidation (header)"
echo "-------------------------------------------"
# Get header (should be cached)
CACHE_TEST_1=$(curl -s "$BASE_URL/api/content/header")
# Update header
auth_request "PUT" "/api/admin/header" '{"logo_alt_text":"Cache Test"}' > /dev/null
# Get header again (should be fresh data)
CACHE_TEST_2=$(curl -s "$BASE_URL/api/content/header")
if echo "$CACHE_TEST_2" | grep -q "Cache Test"; then
    test_result 0 "Cache invalidation on header update"
else
    test_result 1 "Cache invalidation on header update"
fi
echo ""

echo "=========================================="
echo "FOOTER ENDPOINTS TESTING"
echo "=========================================="
echo ""

echo "Step 8: Test POST /api/admin/footer/columns (create column)"
echo "------------------------------------------------------------"
COLUMN_CREATE=$(auth_request "POST" "/api/admin/footer/columns" \
    '{"title":"Test Company","title_en":"Test Company EN","column_type":"company_links"}')
echo "$COLUMN_CREATE" | head -n 5
if echo "$COLUMN_CREATE" | grep -q '"success":true'; then
    test_result 0 "POST /api/admin/footer/columns"
    COLUMN_ID=$(echo $COLUMN_CREATE | grep -o '"id":"[^"]*' | cut -d'"' -f4)
    echo "Created column ID: $COLUMN_ID"
else
    test_result 1 "POST /api/admin/footer/columns"
    COLUMN_ID=""
fi
echo ""

echo "Step 9: Test GET /api/admin/footer/columns"
echo "-------------------------------------------"
COLUMNS_GET=$(auth_request "GET" "/api/admin/footer/columns")
echo "$COLUMNS_GET" | head -n 5
if echo "$COLUMNS_GET" | grep -q '"success":true'; then
    test_result 0 "GET /api/admin/footer/columns"
else
    test_result 1 "GET /api/admin/footer/columns"
fi
echo ""

if [ -n "$COLUMN_ID" ]; then
    echo "Step 10: Test PUT /api/admin/footer/columns/:id (update column)"
    echo "----------------------------------------------------------------"
    COLUMN_UPDATE=$(auth_request "PUT" "/api/admin/footer/columns/$COLUMN_ID" \
        '{"title":"Updated Company","title_en":"Updated Company EN","status":"published"}')
    echo "$COLUMN_UPDATE" | head -n 5
    if echo "$COLUMN_UPDATE" | grep -q '"success":true'; then
        test_result 0 "PUT /api/admin/footer/columns/:id"
    else
        test_result 1 "PUT /api/admin/footer/columns/:id"
    fi
    echo ""

    echo "Step 11: Test POST /api/admin/footer/columns/:columnId/items (create item)"
    echo "--------------------------------------------------------------------------"
    ITEM_CREATE=$(auth_request "POST" "/api/admin/footer/columns/$COLUMN_ID/items" \
        '{"item_type":"navigation_link","content_data":{"label":"About Us","label_en":"About Us EN","path":"/about"}}')
    echo "$ITEM_CREATE" | head -n 5
    if echo "$ITEM_CREATE" | grep -q '"success":true'; then
        test_result 0 "POST /api/admin/footer/columns/:columnId/items"
        ITEM_ID=$(echo $ITEM_CREATE | grep -o '"id":"[^"]*' | cut -d'"' -f4)
        echo "Created item ID: $ITEM_ID"
    else
        test_result 1 "POST /api/admin/footer/columns/:columnId/items"
        ITEM_ID=""
    fi
    echo ""

    echo "Step 12: Test GET /api/admin/footer/columns/:columnId/items"
    echo "------------------------------------------------------------"
    ITEMS_GET=$(auth_request "GET" "/api/admin/footer/columns/$COLUMN_ID/items")
    echo "$ITEMS_GET" | head -n 5
    if echo "$ITEMS_GET" | grep -q '"success":true'; then
        test_result 0 "GET /api/admin/footer/columns/:columnId/items"
    else
        test_result 1 "GET /api/admin/footer/columns/:columnId/items"
    fi
    echo ""

    if [ -n "$ITEM_ID" ]; then
        echo "Step 13: Test PUT /api/admin/footer/columns/:columnId/items/:id (update item)"
        echo "-----------------------------------------------------------------------------"
        ITEM_UPDATE=$(auth_request "PUT" "/api/admin/footer/columns/$COLUMN_ID/items/$ITEM_ID" \
            '{"content_data":{"label":"Updated About","label_en":"Updated About EN","path":"/about-us"}}')
        echo "$ITEM_UPDATE" | head -n 5
        if echo "$ITEM_UPDATE" | grep -q '"success":true'; then
            test_result 0 "PUT /api/admin/footer/columns/:columnId/items/:id"
        else
            test_result 1 "PUT /api/admin/footer/columns/:columnId/items/:id"
        fi
        echo ""

        echo "Step 14: Test PUT /api/admin/footer/columns/:columnId/items/:id/reorder"
        echo "------------------------------------------------------------------------"
        ITEM_REORDER=$(auth_request "PUT" "/api/admin/footer/columns/$COLUMN_ID/items/$ITEM_ID/reorder" \
            '{"newOrder":1}')
        echo "$ITEM_REORDER" | head -n 5
        if echo "$ITEM_REORDER" | grep -q '"success":true'; then
            test_result 0 "PUT /api/admin/footer/columns/:columnId/items/:id/reorder"
        else
            test_result 1 "PUT /api/admin/footer/columns/:columnId/items/:id/reorder"
        fi
        echo ""
    fi

    echo "Step 15: Test PUT /api/admin/footer/columns/:id/reorder"
    echo "--------------------------------------------------------"
    COLUMN_REORDER=$(auth_request "PUT" "/api/admin/footer/columns/$COLUMN_ID/reorder" \
        '{"newOrder":1}')
    echo "$COLUMN_REORDER" | head -n 5
    if echo "$COLUMN_REORDER" | grep -q '"success":true'; then
        test_result 0 "PUT /api/admin/footer/columns/:id/reorder"
    else
        test_result 1 "PUT /api/admin/footer/columns/:id/reorder"
    fi
    echo ""
fi

echo "Step 16: Test GET /api/content/footer (public endpoint)"
echo "--------------------------------------------------------"
PUBLIC_FOOTER=$(curl -s "$BASE_URL/api/content/footer")
echo "$PUBLIC_FOOTER" | head -n 10
if echo "$PUBLIC_FOOTER" | grep -q '"success":true'; then
    test_result 0 "GET /api/content/footer"
else
    test_result 1 "GET /api/content/footer"
fi
echo ""

echo "Step 17: Test GET /api/content/footer?lang=en (English)"
echo "--------------------------------------------------------"
PUBLIC_FOOTER_EN=$(curl -s "$BASE_URL/api/content/footer?lang=en")
echo "$PUBLIC_FOOTER_EN" | head -n 10
if echo "$PUBLIC_FOOTER_EN" | grep -q '"success":true'; then
    test_result 0 "GET /api/content/footer?lang=en"
else
    test_result 1 "GET /api/content/footer?lang=en"
fi
echo ""

echo "Step 18: Verify cache invalidation (footer)"
echo "--------------------------------------------"
# Get footer (should be cached)
CACHE_TEST_3=$(curl -s "$BASE_URL/api/content/footer")
# Update footer column
if [ -n "$COLUMN_ID" ]; then
    auth_request "PUT" "/api/admin/footer/columns/$COLUMN_ID" \
        '{"title":"Cache Invalidation Test"}' > /dev/null
fi
# Get footer again (should be fresh data)
CACHE_TEST_4=$(curl -s "$BASE_URL/api/content/footer")
if echo "$CACHE_TEST_4" | grep -q "Cache Invalidation Test"; then
    test_result 0 "Cache invalidation on footer update"
else
    test_result 1 "Cache invalidation on footer update"
fi
echo ""

echo "Step 19: Verify file upload and file serving"
echo "---------------------------------------------"
if [ -n "$LOGO_URL" ]; then
    FILE_SERVE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$LOGO_URL")
    if [ "$FILE_SERVE" = "200" ]; then
        test_result 0 "File serving from /uploads"
    else
        test_result 1 "File serving from /uploads (HTTP $FILE_SERVE)"
    fi
else
    test_result 1 "File serving (no logo URL available)"
fi
echo ""

echo "Step 20: Check audit logs"
echo "-------------------------"
AUDIT_LOGS=$(auth_request "GET" "/api/admin/audit-logs?limit=5")
if echo "$AUDIT_LOGS" | grep -q '"action":"update"'; then
    test_result 0 "Audit logs are being created"
else
    test_result 1 "Audit logs verification"
fi
echo ""

# Cleanup
if [ -n "$ITEM_ID" ] && [ -n "$COLUMN_ID" ]; then
    echo "Step 21: Cleanup - Delete test item"
    echo "------------------------------------"
    DELETE_ITEM=$(auth_request "DELETE" "/api/admin/footer/columns/$COLUMN_ID/items/$ITEM_ID")
    if echo "$DELETE_ITEM" | grep -q '"success":true'; then
        test_result 0 "DELETE /api/admin/footer/columns/:columnId/items/:id"
    else
        test_result 1 "DELETE /api/admin/footer/columns/:columnId/items/:id"
    fi
    echo ""
fi

if [ -n "$COLUMN_ID" ]; then
    echo "Step 22: Cleanup - Delete test column"
    echo "--------------------------------------"
    DELETE_COLUMN=$(auth_request "DELETE" "/api/admin/footer/columns/$COLUMN_ID")
    if echo "$DELETE_COLUMN" | grep -q '"success":true'; then
        test_result 0 "DELETE /api/admin/footer/columns/:id"
    else
        test_result 1 "DELETE /api/admin/footer/columns/:id"
    fi
    echo ""
fi

echo "Step 23: Cleanup - Delete test logo"
echo "------------------------------------"
DELETE_LOGO=$(auth_request "DELETE" "/api/admin/header/logo")
if echo "$DELETE_LOGO" | grep -q '"success":true'; then
    test_result 0 "DELETE /api/admin/header/logo"
else
    test_result 1 "DELETE /api/admin/header/logo"
fi
echo ""

# Clean up temp file
rm -f /tmp/test-logo.png

echo "=========================================="
echo "VERIFICATION SUMMARY"
echo "=========================================="
echo ""
echo -e "${GREEN}Tests Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Tests Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ ALL TESTS PASSED${NC}"
    echo "All backend API endpoints are working correctly!"
    exit 0
else
    echo -e "${RED}✗ SOME TESTS FAILED${NC}"
    echo "Please review the failed tests above."
    exit 1
fi
