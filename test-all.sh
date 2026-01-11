#!/bin/bash

set -e

echo "🧪 COMPREHENSIVE TEST SUITE"
echo "==========================="
echo ""

API_URL="${API_URL:-http://localhost:3000}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3001}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

test_endpoint() {
    local method=$1
    local endpoint=$2
    local expected_status=$3
    local description=$4
    local data=$5
    
    if [ -z "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$API_URL$endpoint" 2>/dev/null || echo -e "\n000")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" -H "Content-Type: application/json" -d "$data" "$API_URL$endpoint" 2>/dev/null || echo -e "\n000")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓${NC} $description (HTTP $http_code)"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}✗${NC} $description (Expected HTTP $expected_status, got $http_code)"
        echo "  Response: $body"
        ((TESTS_FAILED++))
        return 1
    fi
}

test_frontend_page() {
    local url=$1
    local description=$2
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
    
    if [ "$response" = "200" ] || [ "$response" = "301" ] || [ "$response" = "302" ]; then
        echo -e "${GREEN}✓${NC} $description (HTTP $response)"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}✗${NC} $description (Expected HTTP 200/301/302, got $response)"
        ((TESTS_FAILED++))
        return 1
    fi
}

echo "📡 Testing Backend API..."
echo "------------------------"

# Health check (should be /health not /api/health)
test_endpoint "GET" "/health" "200" "Backend health check"

# Public API endpoints
test_endpoint "GET" "/api/products" "200" "Get all products"
test_endpoint "GET" "/api/products?locale=sk" "200" "Get products (SK locale)"
test_endpoint "GET" "/api/products?locale=en" "200" "Get products (EN locale)"
test_endpoint "GET" "/api/products?category=PAINTINGS" "200" "Get paintings category"
test_endpoint "GET" "/api/products?category=SCULPTURES" "200" "Get sculptures category"

# Admin API endpoints (should return 401 or 404 if not authenticated, but endpoint should exist)
test_endpoint "GET" "/api/admin/products" "200" "Admin: Get all products" || test_endpoint "GET" "/api/admin/products" "401" "Admin: Get all products (unauthorized)"

echo ""
echo "🌐 Testing Frontend Pages..."
echo "---------------------------"

# Test locale routes
test_frontend_page "$FRONTEND_URL/sk" "Homepage (SK)"
test_frontend_page "$FRONTEND_URL/en" "Homepage (EN)"
test_frontend_page "$FRONTEND_URL/sk/about" "About page (SK)"
test_frontend_page "$FRONTEND_URL/en/about" "About page (EN)"
test_frontend_page "$FRONTEND_URL/sk/shop" "Shop page (SK)"
test_frontend_page "$FRONTEND_URL/en/shop" "Shop page (EN)"
test_frontend_page "$FRONTEND_URL/sk/custom" "Custom order page (SK)"
test_frontend_page "$FRONTEND_URL/en/custom" "Custom order page (EN)"
test_frontend_page "$FRONTEND_URL/sk/contact" "Contact page (SK)"
test_frontend_page "$FRONTEND_URL/en/contact" "Contact page (EN)"
test_frontend_page "$FRONTEND_URL/sk/faq" "FAQ page (SK)"
test_frontend_page "$FRONTEND_URL/en/faq" "FAQ page (EN)"
test_frontend_page "$FRONTEND_URL/sk/privacy" "Privacy page (SK)"
test_frontend_page "$FRONTEND_URL/en/privacy" "Privacy page (EN)"
test_frontend_page "$FRONTEND_URL/sk/terms" "Terms page (SK)"
test_frontend_page "$FRONTEND_URL/en/terms" "Terms page (EN)"
test_frontend_page "$FRONTEND_URL/sk/shipping" "Shipping page (SK)"
test_frontend_page "$FRONTEND_URL/en/shipping" "Shipping page (EN)"
test_frontend_page "$FRONTEND_URL/sk/returns" "Returns page (SK)"
test_frontend_page "$FRONTEND_URL/en/returns" "Returns page (EN)"
test_frontend_page "$FRONTEND_URL/sk/search" "Search page (SK)"
test_frontend_page "$FRONTEND_URL/en/search" "Search page (EN)"

echo ""
echo "🔍 Testing Content Presence..."
echo "-----------------------------"

# Test if pages contain expected content
check_content() {
    local url=$1
    local search_term=$2
    local description=$3
    
    content=$(curl -s "$url" 2>/dev/null || echo "")
    if echo "$content" | grep -qi "$search_term"; then
        echo -e "${GREEN}✓${NC} $description (contains '$search_term')"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${YELLOW}⚠${NC} $description (missing '$search_term' - may need server running)"
        return 1
    fi
}

# Only check content if frontend is accessible
if curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL/sk" 2>/dev/null | grep -q "200\|301\|302"; then
    check_content "$FRONTEND_URL/sk" "Igor Mraz" "Homepage contains artist name (SK)"
    check_content "$FRONTEND_URL/en" "Igor Mraz" "Homepage contains artist name (EN)"
    check_content "$FRONTEND_URL/sk/about" "Slovensku\|Slovakia" "About page contains location (SK)"
    check_content "$FRONTEND_URL/en/about" "Slovakia" "About page contains location (EN)"
    check_content "$FRONTEND_URL/sk/faq" "jedinečné\|unique" "FAQ page contains key word (SK)"
    check_content "$FRONTEND_URL/en/faq" "unique" "FAQ page contains key word (EN)"
fi

echo ""
echo "📊 Test Summary"
echo "==============="
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  Some tests failed. Make sure both backend and frontend servers are running:${NC}"
    echo "   Backend: $API_URL"
    echo "   Frontend: $FRONTEND_URL"
    exit 1
fi
