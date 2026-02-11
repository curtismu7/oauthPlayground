#!/bin/bash

echo "🔐 Protect Portal Login Test"
echo "=========================="
echo ""

echo "📋 Configuration Check:"
echo "Environment ID: b9817c16-9910-4415-b67e-4ac687da74d9"
echo "Client ID: a4f963ea-0736-456a-be72-b1fa4f63f81f"
echo "Redirect URI: http://localhost:3000/protect-portal-callback"
echo ""

echo "👤 Test Credentials:"
echo "Username: steven73125"
echo "Password: [CONFIGURED]"
echo ""

echo "🔧 Fixes Applied:"
echo "✅ Fixed parameter names: environment_id → environmentId"
echo "✅ Fixed parameter names: client_id → clientId"
echo "✅ Updated redirect URI to match Protect Portal expectations"
echo ""

echo "📝 Testing Instructions:"
echo "1. Navigate to http://localhost:3000/protect-portal"
echo "2. Enter username: steven73125"
echo "3. Enter password: y6MmKK&14kO~)Yx"
echo "4. Click 'Sign In' button"
echo ""

echo "🔍 Expected Behavior:"
echo "- Should initialize embedded login flow"
echo "- Should call /api/pingone/redirectless/authorize"
echo "- Should receive successful response (not 400 error)"
echo "- Should proceed to authentication flow"
echo ""

echo "🐛 If Still Failing:"
echo "1. Check browser console for errors"
echo "2. Check server logs for detailed error messages"
echo "3. Verify PingOne credentials are valid"
echo "4. Check network tab for actual request payload"
echo ""

echo "🎯 Next Steps:"
echo "- Monitor server logs during login attempt"
echo "- Check for any remaining parameter mismatches"
echo "- Verify PingOne API connectivity"
echo ""

echo "Ready to test! 🚀"
