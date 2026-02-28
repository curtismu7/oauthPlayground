#!/bin/bash

echo "🧪 MFA First Page Features Verification"
echo "===================================="

# Test 1: Check logo file upload functionality
echo "📋 Checking logo file upload feature..."
if grep -q "type=\"file\"" src/v8/flows/unified/UnifiedMFARegistrationFlowV8_Legacy.tsx && grep -q "accept=\"image/\*\"" src/v8/flows/unified/UnifiedMFARegistrationFlowV8_Legacy.tsx; then
    echo "✅ Logo file upload input present"
else
    echo "❌ Logo file upload missing"
    exit 1
fi

# Test 2: Check upload button functionality
if grep -q "Upload Logo File" src/v8/flows/unified/UnifiedMFARegistrationFlowV8_Legacy.tsx; then
    echo "✅ Upload button present"
else
    echo "❌ Upload button missing"
    exit 1
fi

# Test 3: Check FileReader implementation
if grep -q "FileReader" src/v8/flows/unified/UnifiedMFARegistrationFlowV8_Legacy.tsx && grep -q "readAsDataURL" src/v8/flows/unified/UnifiedMFARegistrationFlowV8_Legacy.tsx; then
    echo "✅ FileReader implementation present"
else
    echo "❌ FileReader implementation missing"
    exit 1
fi

# Test 4: Verify NO client secret field (should not exist)
echo ""
echo "📋 Checking client secret field is NOT present..."
if ! grep -q "Client Secret" src/v8/flows/unified/UnifiedMFARegistrationFlowV8_Legacy.tsx && ! grep -q "client-secret" src/v8/flows/unified/UnifiedMFARegistrationFlowV8_Legacy.tsx; then
    echo "✅ Client secret field correctly absent"
else
    echo "❌ Client secret field incorrectly present"
    exit 1
fi

# Test 5: Verify NO eye icons (should not exist)
if ! grep -q "FiEye" src/v8/flows/unified/UnifiedMFARegistrationFlowV8_Legacy.tsx && ! grep -q "FiEyeOff" src/v8/flows/unified/UnifiedMFARegistrationFlowV8_Legacy.tsx; then
    echo "✅ Eye icons correctly absent"
else
    echo "❌ Eye icons incorrectly present"
    exit 1
fi

# Test 6: Verify NO showSecret state (should not exist)
if ! grep -q "showSecret" src/v8/flows/unified/UnifiedMFARegistrationFlowV8_Legacy.tsx && ! grep -q "setShowSecret" src/v8/flows/unified/UnifiedMFARegistrationFlowV8_Legacy.tsx; then
    echo "✅ showSecret state correctly absent"
else
    echo "❌ showSecret state incorrectly present"
    exit 1
fi

# Test 7: Check worker token functionality
echo ""
echo "📋 Checking worker token functionality..."
if grep -q "useGlobalWorkerToken" src/v8/flows/unified/UnifiedMFARegistrationFlowV8_Legacy.tsx && grep -q "hasWorkerToken" src/v8/flows/unified/UnifiedMFARegistrationFlowV8_Legacy.tsx; then
    echo "✅ Worker token hook usage present"
else
    echo "❌ Worker token hook usage missing"
    exit 1
fi

# Test 8: Check worker token modal
if grep -q "WorkerTokenModalV8" src/v8/flows/unified/UnifiedMFARegistrationFlowV8_Legacy.tsx && grep -q "Get Worker Token" src/v8/flows/unified/UnifiedMFARegistrationFlowV8_Legacy.tsx; then
    echo "✅ Worker token modal present"
else
    echo "❌ Worker token modal missing"
    exit 1
fi

# Test 9: Build verification
echo ""
echo "📋 Checking build..."
if npm run build > /dev/null 2>&1; then
    echo "✅ Build succeeds"
else
    echo "❌ Build fails"
    exit 1
fi

echo ""
echo "🎉 All MFA First Page Features Tests PASSED!"
echo "✅ Logo file upload functionality present"
echo "✅ Client secret field correctly removed"
echo "✅ Eye icons correctly removed"
echo "✅ Worker token functionality present"
echo "✅ Build successful"

exit 0
