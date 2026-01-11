#!/bin/bash
# Test the application endpoints

echo "=== Testing Application ==="
echo ""

# Test Backend Health
echo "1. Backend Health Check:"
BACKEND_HEALTH=$(curl -s http://localhost:3000/health)
if [ "$BACKEND_HEALTH" = '{"ok":true}' ]; then
  echo "   ✅ Backend is healthy"
else
  echo "   ❌ Backend health check failed: $BACKEND_HEALTH"
fi
echo ""

# Test Frontend
echo "2. Frontend Homepage:"
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001)
if [ "$FRONTEND_STATUS" = "200" ]; then
  echo "   ✅ Frontend is accessible (HTTP $FRONTEND_STATUS)"
else
  echo "   ❌ Frontend returned HTTP $FRONTEND_STATUS"
fi
echo ""

# Test API Products
echo "3. API Products Endpoint:"
PRODUCTS=$(curl -s http://localhost:3000/api/products)
if echo "$PRODUCTS" | grep -q "products"; then
  PRODUCT_COUNT=$(echo "$PRODUCTS" | grep -o '"id"' | wc -l)
  echo "   ✅ Products endpoint working (found $PRODUCT_COUNT products)"
else
  echo "   ⚠️  Products endpoint response: ${PRODUCTS:0:100}"
fi
echo ""

# Test Admin API
echo "4. Admin API:"
ADMIN_PRODUCTS=$(curl -s http://localhost:3000/api/admin/products)
if echo "$ADMIN_PRODUCTS" | grep -q "products"; then
  echo "   ✅ Admin products endpoint working"
else
  echo "   ⚠️  Admin products response: ${ADMIN_PRODUCTS:0:100}"
fi
echo ""

# Test Admin Page
echo "5. Admin Page:"
ADMIN_PAGE=$(curl -s http://localhost:3001/admin)
if echo "$ADMIN_PAGE" | grep -q -i "admin"; then
  echo "   ✅ Admin page accessible"
else
  echo "   ❌ Admin page not found or error"
fi
echo ""

# Test Checkout Page
echo "6. Checkout Page:"
CHECKOUT_PAGE=$(curl -s http://localhost:3001/checkout)
if echo "$CHECKOUT_PAGE" | grep -q -i "checkout"; then
  echo "   ✅ Checkout page accessible"
  if echo "$CHECKOUT_PAGE" | grep -q -i "bank transfer"; then
    echo "   ✅ Bank transfer payment option found"
  fi
else
  echo "   ❌ Checkout page not found or error"
fi
echo ""

# Test Homepage Content
echo "7. Homepage Content:"
HOMEPAGE=$(curl -s http://localhost:3001)
if echo "$HOMEPAGE" | grep -q -i "igormraz"; then
  echo "   ✅ Homepage contains 'igormraz'"
fi
if echo "$HOMEPAGE" | grep -q -i "welcome"; then
  echo "   ✅ Hero banner found"
fi
if echo "$HOMEPAGE" | grep -q -i "hotshot"; then
  echo "   ✅ Footer attribution found"
fi
if ! echo "$HOMEPAGE" | grep -q -i "vercel"; then
  echo "   ✅ Vercel references removed"
fi
echo ""

# Test Search Page
echo "8. Search Page:"
SEARCH_PAGE=$(curl -s http://localhost:3001/search)
if echo "$SEARCH_PAGE" | grep -q -i "search"; then
  echo "   ✅ Search page accessible"
else
  echo "   ⚠️  Search page may have issues"
fi
echo ""

echo "=== Test Summary ==="
echo "Backend: http://localhost:3000"
echo "Frontend: http://localhost:3001"
echo "Admin: http://localhost:3001/admin"
echo "Checkout: http://localhost:3001/checkout"
