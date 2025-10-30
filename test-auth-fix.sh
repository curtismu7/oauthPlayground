#!/bin/bash

echo "🧪 Testing Redirectless Flow Authentication Fix"
echo "=============================================="
echo ""

# Check if server.js has the fix
echo "✅ Checking server.js for client authentication..."
if grep -q "clientId, clientSecret" server.js && grep -q "Authorization.*authHeader" server.js; then
    echo "   ✓ Backend includes client authentication"
else
    echo "   ✗ Backend missing client authentication"
    exit 1
fi

# Check if PingOneAuthentication.tsx has the fix
echo "✅ Checking frontend for client credential passing..."
if grep -q "clientId: config.clientId" src/pages/PingOneAuthentication.tsx && grep -q "clientSecret: config.clientSecret" src/pages/PingOneAuthentication.tsx; then
    echo "   ✓ Frontend sends client credentials"
else
    echo "   ✗ Frontend missing client credentials"
    exit 1
fi

echo ""
echo "✅ All code checks passed!"
echo ""
echo "📋 Next steps:"
echo "   1. Ensure backend server is running (npm run dev)"
echo "   2. Navigate to: https://localhost:3000/pingone-authentication"
echo "   3. Fill in your PingOne credentials"
echo "   4. Select 'Redirectless' mode"
echo "   5. Click 'Launch Redirectless Flow' or use HEB login popup"
echo "   6. Check browser console and backend logs for success"
echo ""
echo "🔍 Expected backend logs:"
echo "   - [PingOne Flow Check] Client ID: a4f963ea..."
echo "   - [PingOne Flow Check] Has Client Secret: true"
echo "   - [PingOne Flow Check] Success: ..."
echo ""
