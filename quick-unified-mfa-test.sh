#!/bin/bash

echo "🧪 Quick /v8/unified-mfa Verification"
echo "===================================="

# Test 1: Check if route returns HTML with MFA content
echo "📋 Checking route content..."
response=$(curl -k -s https://localhost:3000/v8/unified-mfa)
if [[ "$response" == *"mfaOAuthCallbackReturn"* ]]; then
    echo "✅ Route returns MFA-related content"
else
    echo "❌ Route not returning expected MFA content"
    exit 1
fi

# Test 2: Check build succeeds
echo ""
echo "📋 Checking build..."
if npm run build > /dev/null 2>&1; then
    echo "✅ Build succeeds"
else
    echo "❌ Build fails"
    exit 1
fi

# Test 3: Check import is correct
echo ""
echo "📋 Checking import..."
if grep -q "UnifiedMFARegistrationFlowV8.*default.*module.UnifiedMFARegistrationFlowV8" src/App.tsx; then
    echo "✅ Import uses correct export name"
else
    echo "❌ Import issue"
    exit 1
fi

echo ""
echo "🎉 /v8/unified-mfa should now be working!"
echo "✅ Import issue resolved"
echo "✅ Route functional"
echo "✅ Build successful"

exit 0
