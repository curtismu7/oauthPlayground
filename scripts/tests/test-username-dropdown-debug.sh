#!/bin/bash

echo "🧪 Username Dropdown Debug Test"
echo "=============================="

# Test 1: Check if SearchableDropdownV8 is properly imported
echo "📋 Checking SearchableDropdownV8 import..."
if grep -q "import.*SearchableDropdownV8.*from.*@/v8/components/SearchableDropdownV8" src/mfa/flows/unified/UnifiedMFARegistrationFlowV8_Legacy.tsx; then
    echo "✅ SearchableDropdownV8 imported"
else
    echo "❌ SearchableDropdownV8 import missing"
    exit 1
fi

# Test 2: Check if useUserSearch hook is imported
if grep -q "import.*useUserSearch.*from.*@/v8/hooks/useUserSearch" src/mfa/flows/unified/UnifiedMFARegistrationFlowV8_Legacy.tsx; then
    echo "✅ useUserSearch hook imported"
else
    echo "❌ useUserSearch hook import missing"
    exit 1
fi

# Test 3: Check if username state exists
if grep -q "const \[username, setUsername\]" src/mfa/flows/unified/UnifiedMFARegistrationFlowV8_Legacy.tsx; then
    echo "✅ Username state present"
else
    echo "❌ Username state missing"
    exit 1
fi

# Test 4: Check if environmentId state exists
if grep -q "const \[environmentId, setEnvironmentId\]" src/mfa/flows/unified/UnifiedMFARegistrationFlowV8_Legacy.tsx; then
    echo "✅ Environment ID state present"
else
    echo "❌ Environment ID state missing"
    exit 1
fi

# Test 5: Check if users are being loaded from useUserSearch
if grep -q "users," src/mfa/flows/unified/UnifiedMFARegistrationFlowV8_Legacy.tsx && grep -q "isLoading: isLoadingUsers," src/mfa/flows/unified/UnifiedMFARegistrationFlowV8_Legacy.tsx; then
    echo "✅ Users and loading state from useUserSearch present"
else
    echo "❌ Users or loading state from useUserSearch missing"
    exit 1
fi

# Test 6: Check if SearchableDropdownV8 has all required props
echo ""
echo "📋 Checking SearchableDropdownV8 props..."
if grep -q "value={username}" src/mfa/flows/unified/UnifiedMFARegistrationFlowV8_Legacy.tsx; then
    echo "✅ value prop present"
else
    echo "❌ value prop missing"
    exit 1
fi

if grep -q "options=" src/mfa/flows/unified/UnifiedMFARegistrationFlowV8_Legacy.tsx; then
    echo "✅ options prop present"
else
    echo "❌ options prop missing"
    exit 1
fi

if grep -q "onChange={setUsername}" src/mfa/flows/unified/UnifiedMFARegistrationFlowV8_Legacy.tsx; then
    echo "✅ onChange prop present"
else
    echo "❌ onChange prop missing"
    exit 1
fi

if grep -q "isLoading={isLoadingUsers}" src/mfa/flows/unified/UnifiedMFARegistrationFlowV8_Legacy.tsx; then
    echo "✅ isLoading prop present"
else
    echo "❌ isLoading prop missing"
    exit 1
fi

if grep -q "onSearchChange={setSearchQuery}" src/mfa/flows/unified/UnifiedMFARegistrationFlowV8_Legacy.tsx; then
    echo "✅ onSearchChange prop present"
else
    echo "❌ onSearchChange prop missing"
    exit 1
fi

# Test 7: Check if conditional rendering is correct
echo ""
echo "📋 Checking conditional rendering..."
if grep -q "environmentId && _tokenStatus.isValid" src/mfa/flows/unified/UnifiedMFARegistrationFlowV8_Legacy.tsx; then
    echo "✅ Conditional rendering for environment and token present"
else
    echo "❌ Conditional rendering for environment and token missing"
    exit 1
fi

# Test 8: Build verification
echo ""
echo "📋 Checking build..."
if npm run build > /dev/null 2>&1; then
    echo "✅ Build succeeds"
else
    echo "❌ Build fails"
    exit 1
fi

echo ""
echo "🎉 Username Dropdown Debug Test Complete!"
echo "✅ All required imports and props present"
echo "✅ If dropdown still doesn't work, check:"
echo "   - Environment ID is set"
echo "   - Worker token is valid"
echo "   - Users are being loaded (check browser console)"
echo "   - Network requests are successful"

exit 0
