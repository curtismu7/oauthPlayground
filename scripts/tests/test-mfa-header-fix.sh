#!/bin/bash

echo "🧪 MFA Header Fix Verification"
echo "============================="

# Test 1: Check if MFAHeaderV8 is imported
echo "📋 Checking MFAHeaderV8 import..."
if grep -q "import.*MFAHeaderV8.*from.*@/v8/components/MFAHeaderV8" src/mfa/flows/unified/UnifiedMFARegistrationFlowV8_Legacy.tsx; then
    echo "✅ MFAHeaderV8 is properly imported"
else
    echo "❌ MFAHeaderV8 not imported"
    exit 1
fi

# Test 2: Check if header is used in device selection (no device type)
echo ""
echo "📋 Checking header in device selection..."
if grep -A 10 "if (!selectedDeviceType)" src/mfa/flows/unified/UnifiedMFARegistrationFlowV8_Legacy.tsx | grep -q "MFAHeaderV8"; then
    echo "✅ Header shown when no device type selected"
else
    echo "❌ Header missing in device selection"
    exit 1
fi

# Test 3: Check if header is used in content component (device type selected)
echo ""
echo "📋 Checking header in content component..."
if grep -A 5 "return (" src/mfa/flows/unified/UnifiedMFARegistrationFlowV8_Legacy.tsx | grep -q "MFAHeaderV8"; then
    echo "✅ Header shown when device type selected"
else
    echo "❌ Header missing in content component"
    exit 1
fi

# Test 4: Check build succeeds
echo ""
echo "📋 Checking build..."
if npm run build > /dev/null 2>&1; then
    echo "✅ Build succeeds"
else
    echo "❌ Build fails"
    exit 1
fi

# Test 5: Check if header has dynamic title
echo ""
echo "📋 Checking dynamic header title..."
if grep -q 'title={`${config.displayName} Registration`}' src/mfa/flows/unified/UnifiedMFARegistrationFlowV8_Legacy.tsx; then
    echo "✅ Header uses dynamic device-specific title"
else
    echo "❌ Header not using dynamic title"
    exit 1
fi

echo ""
echo "🎉 MFA Header Fix Complete!"
echo "✅ Header now shows in both scenarios:"
echo "   • When no device type selected (device selection screen)"
echo "   • When device type selected (registration flow)"
echo "✅ Dynamic titles based on device type"
echo "✅ Build successful"

exit 0
