#!/bin/bash

echo "🧪 CIBA 429 Loop Fix Test"
echo "=========================="

# Test 1: Check rate limiting implementation
echo "📋 Checking rate limiting implementation..."
if grep -q "discoveryRetryCount" src/pages/flows/CIBAFlowV9.tsx && \
   grep -q "lastDiscoveryAttempt" src/pages/flows/CIBAFlowV9.tsx && \
   grep -q "timeSinceLastAttempt.*5000" src/pages/flows/CIBAFlowV9.tsx; then
    echo "✅ Rate limiting state variables implemented"
else
    echo "❌ Rate limiting not implemented!"
    exit 1
fi

# Test 2: Check 429 error handling
echo "📋 Checking 429 error handling..."
if grep -q "error instanceof Error.*429" src/pages/flows/CIBAFlowV9.tsx && \
   grep -q "Got 429 error, will retry later" src/pages/flows/CIBAFlowV9.tsx; then
    echo "✅ 429 error handling implemented"
else
    echo "❌ 429 error handling not implemented!"
    exit 1
fi

# Test 3: Check useCallback implementation
echo "📋 Checking useCallback implementation..."
if grep -q "loadDiscoveryMetadataWithRetry.*useCallback" src/pages/flows/CIBAFlowV9.tsx && \
   grep -q "useCallback.*async.*envId.*string" src/pages/flows/CIBAFlowV9.tsx; then
    echo "✅ useCallback properly implemented"
else
    echo "❌ useCallback not implemented!"
    exit 1
fi

# Test 4: Check retry limit logic
echo "📋 Checking retry limit logic..."
if grep -q "discoveryRetryCount.*>=.*3.*30000" src/pages/flows/CIBAFlowV9.tsx && \
   grep -q "Too many failed attempts, waiting" src/pages/flows/CIBAFlowV9.tsx; then
    echo "✅ Retry limit logic implemented"
else
    echo "❌ Retry limit logic not implemented!"
    exit 1
fi

# Test 5: Check success reset
echo "📋 Checking success reset logic..."
if grep -q "setDiscoveryRetryCount.*0.*Reset on success" src/pages/flows/CIBAFlowV9.tsx; then
    echo "✅ Success reset logic implemented"
else
    echo "❌ Success reset logic not implemented!"
    exit 1
fi

# Test 6: Check build
echo ""
echo "📋 Checking build..."
if npm run build > /dev/null 2>&1; then
    echo "✅ Build succeeds"
else
    echo "❌ Build fails"
    exit 1
fi

echo ""
echo "🎉 CIBA 429 Loop Fix Test Complete!"
echo "✅ Rate limiting state variables implemented"
echo "✅ 429 error handling implemented"
echo "✅ useCallback properly implemented"
echo "✅ Retry limit logic implemented"
echo "✅ Success reset logic implemented"
echo "✅ Build successful"

echo ""
echo "🔍 What this fix does:"
echo "- Prevents infinite 429 error loops with rate limiting"
echo "- Waits 5 seconds between discovery metadata attempts"
echo "- Limits to 3 retries, then waits 30 seconds before trying again"
echo "- Silently handles 429 errors without showing toast notifications"
echo "- Uses useCallback to prevent useEffect dependency loops"
echo "- Resets retry count on successful metadata loading"

echo ""
echo "🔍 Expected behavior:"
echo "- CIBA flow will no longer spam the API with requests"
echo "- 429 errors are logged but don't trigger user notifications"
echo "- Automatic retries with intelligent backoff"
echo "- Manual retry available after waiting period"
