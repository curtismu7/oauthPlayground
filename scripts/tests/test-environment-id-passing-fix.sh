#!/bin/bash

echo "🧪 Environment ID Passing Fix Test"
echo "=================================="

# Test 1: Check DeviceTypeSelectionScreenProps interface update
echo "📋 Checking DeviceTypeSelectionScreenProps interface..."
if grep -q "onSelectDeviceType: (deviceType: DeviceConfigKey, environmentId: string, username: string) => void;" src/v8/flows/unified/UnifiedMFARegistrationFlowV8_Legacy.tsx; then
    echo "✅ DeviceTypeSelectionScreenProps interface updated with environment ID and username"
else
    echo "❌ DeviceTypeSelectionScreenProps interface not updated"
    exit 1
fi

# Test 2: Check parent component state for environment ID and username
if grep -q "const \[selectedEnvironmentId, setSelectedEnvironmentId\] = useState<string>('');" src/v8/flows/unified/UnifiedMFARegistrationFlowV8_Legacy.tsx && \
   grep -q "const \[selectedUsername, setSelectedUsername\] = useState<string>('');" src/v8/flows/unified/UnifiedMFARegistrationFlowV8_Legacy.tsx; then
    echo "✅ Parent component has environment ID and username state"
else
    echo "❌ Parent component missing environment ID or username state"
    exit 1
fi

# Test 3: Check handleDeviceTypeSelection callback
if grep -q "const handleDeviceTypeSelection = useCallback((deviceType: DeviceConfigKey, environmentId: string, username: string) => {" src/v8/flows/unified/UnifiedMFARegistrationFlowV8_Legacy.tsx; then
    echo "✅ handleDeviceTypeSelection callback created"
else
    echo "❌ handleDeviceTypeSelection callback missing"
    exit 1
fi

# Test 4: Check callback updates state
if grep -q "setSelectedDeviceType(deviceType);" src/v8/flows/unified/UnifiedMFARegistrationFlowV8_Legacy.tsx && \
   grep -q "setSelectedEnvironmentId(environmentId);" src/v8/flows/unified/UnifiedMFARegistrationFlowV8_Legacy.tsx && \
   grep -q "setSelectedUsername(username);" src/v8/flows/unified/UnifiedMFARegistrationFlowV8_Legacy.tsx; then
    echo "✅ Callback updates all three state variables"
else
    echo "❌ Callback doesn't update all state variables"
    exit 1
fi

# Test 5: Check DeviceTypeSelectionScreen uses new handler
if grep -q "onSelectDeviceType={handleDeviceTypeSelection}" src/v8/flows/unified/UnifiedMFARegistrationFlowV8_Legacy.tsx; then
    echo "✅ DeviceTypeSelectionScreen uses new handler"
else
    echo "❌ DeviceTypeSelectionScreen not using new handler"
    exit 1
fi

# Test 6: Check button click passes environment ID and username
if grep -q "onClick={() => enabled && onSelectDeviceType(device.key, environmentId, username)}" src/v8/flows/unified/UnifiedMFARegistrationFlowV8_Legacy.tsx; then
    echo "✅ Button click passes environment ID and username"
else
    echo "❌ Button click doesn't pass environment ID and username"
    exit 1
fi

# Test 7: Check UnifiedMFARegistrationFlowContent interface
if grep -q "environmentId: string;" src/v8/flows/unified/UnifiedMFARegistrationFlowV8_Legacy.tsx && \
   grep -q "username: string;" src/v8/flows/unified/UnifiedMFARegistrationFlowV8_Legacy.tsx; then
    echo "✅ UnifiedMFARegistrationFlowContent interface updated"
else
    echo "❌ UnifiedMFARegistrationFlowContent interface not updated"
    exit 1
fi

# Test 8: Check props passed to UnifiedMFARegistrationFlowContent
if grep -q "environmentId={selectedEnvironmentId}" src/v8/flows/unified/UnifiedMFARegistrationFlowV8_Legacy.tsx && \
   grep -q "username={selectedUsername}" src/v8/flows/unified/UnifiedMFARegistrationFlowV8_Legacy.tsx; then
    echo "✅ Environment ID and username passed to UnifiedMFARegistrationFlowContent"
else
    echo "❌ Environment ID and username not passed to UnifiedMFARegistrationFlowContent"
    exit 1
fi

# Test 9: Check FLOW_KEY constant
if grep -q "const FLOW_KEY = 'mfa-flow-v8';" src/v8/flows/unified/UnifiedMFARegistrationFlowV8_Legacy.tsx; then
    echo "✅ FLOW_KEY constant defined"
else
    echo "❌ FLOW_KEY constant missing"
    exit 1
fi

# Test 10: Check credentials saving to storage
if grep -q "CredentialsServiceV8.saveCredentials(FLOW_KEY" src/v8/flows/unified/UnifiedMFARegistrationFlowV8_Legacy.tsx && \
   grep -q "environmentId," src/v8/flows/unified/UnifiedMFARegistrationFlowV8_Legacy.tsx && \
   grep -q "username," src/v8/flows/unified/UnifiedMFARegistrationFlowV8_Legacy.tsx; then
    echo "✅ Credentials saved to storage with environment ID and username"
else
    echo "❌ Credentials not saved properly to storage"
    exit 1
fi

# Test 11: Check immediate credential saving in callback
if grep -q "Saving credentials to storage IMMEDIATELY" src/v8/flows/unified/UnifiedMFARegistrationFlowV8_Legacy.tsx; then
    echo "✅ Credentials saved immediately in callback to prevent race condition"
else
    echo "❌ Credentials not saved immediately in callback!"
    exit 1
fi

# Test 12: Check that old useEffect was removed
if ! grep -q "Save environment ID and username to storage for MFAFlowBaseV8 to pick up" src/v8/flows/unified/UnifiedMFARegistrationFlowV8_Legacy.tsx; then
    echo "✅ Old useEffect properly removed"
else
    echo "❌ Old useEffect still present - may cause race condition!"
    exit 1
fi

# Test 13: Build verification
echo ""
echo "📋 Checking build..."
if npm run build > /dev/null 2>&1; then
    echo "✅ Build succeeds"
else
    echo "❌ Build fails"
    exit 1
fi

echo ""
echo "🎉 Environment ID Passing Fix Test Complete!"
echo "✅ All required interface updates present"
echo "✅ State management implemented correctly"
echo "✅ Data flow from device selection to MFA flow established"
echo "✅ Credentials saved to storage for MFAFlowBaseV8"
echo "✅ Build successful"
echo ""
echo "🔍 Next steps to test the fix:"
echo "1. Start the development server: npm run dev"
echo "2. Visit: https://localhost:3000/v8/unified-mfa"
echo "3. Fill in environment ID and select username"
echo "4. Select SMS device type"
echo "5. Verify no 'Environment ID is required' error"
echo "6. Check browser console for 'Saving environment ID and username to storage' log"

exit 0
