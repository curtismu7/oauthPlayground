#!/bin/bash

echo "🧪 Combined MFA and AppDiscovery Modal Fix Test"
echo "=============================================="

# Test 1: Check MFA flow environment ID fallback
echo "📋 Checking MFA flow environment ID fallback..."
if grep -q "Applied global environment ID fallback for MFA flow" src/v8/flows/shared/MFAFlowBaseV8.tsx && \
   grep -q "v8:global_environment_id" src/v8/flows/shared/MFAFlowBaseV8.tsx && \
   grep -q "🔍 DEBUG: Checking global environment ID fallback" src/v8/flows/shared/MFAFlowBaseV8.tsx; then
    echo "✅ MFA flow environment ID fallback implemented with debug logging"
else
    echo "❌ MFA flow environment ID fallback missing!"
    exit 1
fi

# Test 2: Check AppDiscoveryModalV8U tokenStatus fixes
echo "📋 Checking AppDiscoveryModalV8U tokenStatus fixes..."
if grep -q "globalTokenStatus" src/v8u/components/AppDiscoveryModalV8U.tsx && \
   ! grep -q "tokenStatus" src/v8u/components/AppDiscoveryModalV8U.tsx && \
   ! grep -q "WorkerTokenStatusServiceV8" src/v8u/components/AppDiscoveryModalV8U.tsx; then
    echo "✅ AppDiscoveryModalV8U tokenStatus references fixed"
else
    echo "❌ AppDiscoveryModalV8U tokenStatus references not fixed!"
    exit 1
fi

# Test 3: Check localStorage access pattern in MFA flow
echo "📋 Checking localStorage access pattern in MFA flow..."
if grep -q "localStorage.getItem.*v8:global_environment_id" src/v8/flows/shared/MFAFlowBaseV8.tsx; then
    echo "✅ localStorage access pattern implemented in MFA flow"
else
    echo "❌ localStorage access pattern missing in MFA flow!"
    exit 1
fi

# Test 4: Check error handling in both components
echo "📋 Checking error handling in both components..."
if grep -q "Failed to access global environment ID for fallback" src/v8/flows/shared/MFAFlowBaseV8.tsx && \
   grep -q "Discovery error" src/v8u/components/AppDiscoveryModalV8U.tsx; then
    echo "✅ Error handling implemented in both components"
else
    echo "❌ Error handling missing in one or both components!"
    exit 1
fi

# Test 5: Check debug logging in MFA flow
echo "📋 Checking debug logging in MFA flow..."
if grep -q "🔍 DEBUG: Environment ID already exists in storage" src/v8/flows/shared/MFAFlowBaseV8.tsx && \
   grep -q "willApplyFallback" src/v8/flows/shared/MFAFlowBaseV8.tsx; then
    echo "✅ Debug logging implemented in MFA flow"
else
    echo "❌ Debug logging missing in MFA flow!"
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
echo "🎉 Combined MFA and AppDiscovery Modal Fix Test Complete!"
echo "✅ MFA flow environment ID fallback implemented with debug logging"
echo "✅ AppDiscoveryModalV8U tokenStatus references fixed"
echo "✅ localStorage access pattern implemented in MFA flow"
echo "✅ Error handling implemented in both components"
echo "✅ Debug logging implemented in MFA flow"
echo "✅ Build successful"

echo ""
echo "🔍 What these fixes do:"
echo "- MFA flows now use global environment ID as fallback with debug logging"
echo "- AppDiscoveryModalV8U no longer has undefined tokenStatus references"
echo "- Both components have proper error handling"
echo "- Debug logs help track when fallback is applied"

echo ""
echo "🔍 Expected behavior:"
echo "- MFA registration will work with global environment ID: 'b9817c16-9910-4415-b67e-4ac687da74d9'"
echo "- No more 'Environment ID is required' errors in MFA flows"
echo "- No more 'tokenStatus is not defined' errors in AppDiscoveryModalV8U"
echo "- Debug logs show when environment ID fallback is applied"
echo "- App discovery modal works properly with unified token service"
