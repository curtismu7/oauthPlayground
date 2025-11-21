#!/bin/bash

# Verification script for backend endpoints

echo "🔍 Verifying Backend Endpoints..."
echo ""

# Check if server is running
echo "1. Checking if backend server is running..."
if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "   ✅ Backend server is running on port 3001"
else
    echo "   ❌ Backend server is NOT running on port 3001"
    echo "   Please start it with: npm run server"
    exit 1
fi

echo ""

# Test OIDC Discovery endpoint
echo "2. Testing OIDC Discovery endpoint..."
OIDC_RESPONSE=$(curl -s -X POST http://localhost:3001/api/pingone/oidc-discovery \
  -H "Content-Type: application/json" \
  -d '{"issuerUrl":"https://auth.pingone.com/b9817c16-9910-4415-b67e-4ac687da74d9/as"}' \
  -w "\n%{http_code}")

HTTP_CODE=$(echo "$OIDC_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$OIDC_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ OIDC Discovery endpoint is working (HTTP $HTTP_CODE)"
    echo "   Response preview: $(echo "$RESPONSE_BODY" | head -c 100)..."
else
    echo "   ❌ OIDC Discovery endpoint failed (HTTP $HTTP_CODE)"
    echo "   Response: $RESPONSE_BODY"
fi

echo ""

# Test UserInfo endpoint (will fail without valid token, but endpoint should exist)
echo "3. Testing UserInfo endpoint..."
USERINFO_RESPONSE=$(curl -s -X POST http://localhost:3001/api/pingone/userinfo \
  -H "Content-Type: application/json" \
  -d '{"userInfoEndpoint":"https://auth.pingone.com/test/as/userinfo","accessToken":"test"}' \
  -w "\n%{http_code}")

HTTP_CODE=$(echo "$USERINFO_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$USERINFO_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "403" ] || [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ UserInfo endpoint exists and is responding (HTTP $HTTP_CODE)"
    echo "   Note: 401/403 is expected with test token"
else
    echo "   ❌ UserInfo endpoint may not be working (HTTP $HTTP_CODE)"
    echo "   Response: $RESPONSE_BODY"
fi

echo ""
echo "✅ Verification complete!"
echo ""
echo "Next steps:"
echo "1. Hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)"
echo "2. Check browser console for '[📡 OIDC-DISCOVERY-V8] Using backend proxy'"
echo "3. Check Network tab for POST requests to /api/pingone/oidc-discovery"
