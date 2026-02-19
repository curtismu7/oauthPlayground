#!/bin/bash

echo "🧪 Username Dropdown Functionality Test"
echo "======================================"

# Test 1: Check SearchableDropdownV8 is properly imported
echo "📋 Checking SearchableDropdownV8 import..."
if grep -q "import.*SearchableDropdownV8.*from.*@/v8/components/SearchableDropdownV8" src/v8/flows/unified/UnifiedMFARegistrationFlowV8_Legacy.tsx; then
    echo "✅ SearchableDropdownV8 imported"
else
    echo "❌ SearchableDropdownV8 import missing"
    exit 1
fi

# Test 2: Check useUserSearch hook is imported
if grep -q "import.*useUserSearch.*from.*@/v8/hooks/useUserSearch" src/v8/flows/unified/UnifiedMFARegistrationFlowV8_Legacy.tsx; then
    echo "✅ useUserSearch hook imported"
else
    echo "❌ useUserSearch hook import missing"
    exit 1
fi

# Test 3: Check if username state exists
if grep -q "const \[username, setUsername\]" src/v8/flows/unified/UnifiedMFARegistrationFlowV8_Legacy.tsx; then
    echo "✅ Username state present"
else
    echo "❌ Username state missing"
    exit 1
fi

# Test 4: Check if users are being loaded from useUserSearch
if grep -q "users," src/v8/flows/unified/UnifiedMFARegistrationFlowV8_Legacy.tsx && grep -q "isLoading: isLoadingUsers," src/v8/flows/unified/UnifiedMFARegistrationFlowV8_Legacy.tsx; then
    echo "✅ Users and loading state from useUserSearch present"
else
    echo "❌ Users or loading state from useUserSearch missing"
    exit 1
fi

# Test 5: Check if SearchableDropdownV8 has all required props
echo ""
echo "📋 Checking SearchableDropdownV8 props..."
if grep -q "value={username}" src/v8/flows/unified/UnifiedMFARegistrationFlowV8_Legacy.tsx; then
    echo "✅ value prop present"
else
    echo "❌ value prop missing"
    exit 1
fi

if grep -q "options=" src/v8/flows/unified/UnifiedMFARegistrationFlowV8_Legacy.tsx; then
    echo "✅ options prop present"
else
    echo "❌ options prop missing"
    exit 1
fi

if grep -q "onChange={setUsername}" src/v8/flows/unified/UnifiedMFARegistrationFlowV8_Legacy.tsx; then
    echo "✅ onChange prop present"
else
    echo "❌ onChange prop missing"
    exit 1
fi

if grep -q "isLoading={isLoadingUsers}" src/v8/flows/unified/UnifiedMFARegistrationFlowV8_Legacy.tsx; then
    echo "✅ isLoading prop present"
else
    echo "❌ isLoading prop missing"
    exit 1
fi

if grep -q "onSearchChange={setSearchQuery}" src/v8/flows/unified/UnifiedMFARegistrationFlowV8_Legacy.tsx; then
    echo "✅ onSearchChange prop present"
else
    echo "❌ onSearchChange prop missing"
    exit 1
fi

# Test 6: Check if conditional rendering is correct
echo ""
echo "📋 Checking conditional rendering..."
if grep -q "environmentId && _tokenStatus.isValid" src/v8/flows/unified/UnifiedMFARegistrationFlowV8_Legacy.tsx; then
    echo "✅ Conditional rendering for environment and token present"
else
    echo "❌ Conditional rendering for environment and token missing"
    exit 1
fi

# Test 7: Check if debug fallback is present
if grep -q "Debug: Test dropdown" src/v8/flows/unified/UnifiedMFARegistrationFlowV8_Legacy.tsx; then
    echo "✅ Debug fallback dropdown present"
else
    echo "❌ Debug fallback dropdown missing"
    exit 1
fi

# Test 8: Check if debug info is displayed
if grep -q "Debug mode: Environment ID or worker token not set" src/v8/flows/unified/UnifiedMFARegistrationFlowV8_Legacy.tsx; then
    echo "✅ Debug info display present"
else
    echo "❌ Debug info display missing"
    exit 1
fi

# Test 9: Check if debugging is added to SearchableDropdownV8
if grep -q "Debug: Log props to understand the issue" src/v8/components/SearchableDropdownV8.tsx; then
    echo "✅ SearchableDropdownV8 debugging present"
else
    echo "❌ SearchableDropdownV8 debugging missing"
    exit 1
fi

# Test 10: Check if debugging is added to MFA flow
if grep -q "Debug: Log environment and token status" src/v8/flows/unified/UnifiedMFARegistrationFlowV8_Legacy.tsx; then
    echo "✅ MFA flow debugging present"
else
    echo "❌ MFA flow debugging missing"
    exit 1
fi

# Test 11: Build verification
echo ""
echo "📋 Checking build..."
if npm run build > /dev/null 2>&1; then
    echo "✅ Build succeeds"
else
    echo "❌ Build fails"
    exit 1
fi

echo ""
echo "🎉 Username Dropdown Functionality Test Complete!"
echo "✅ All required imports and props present"
echo "✅ Debug fallback added for troubleshooting"
echo "✅ Debug logging added to both components"
echo "✅ Build successful"
echo ""
echo "🔍 Next steps to test the dropdown:"
echo "1. Start the development server: npm run dev"
echo "2. Visit: https://localhost:3000/v8/unified-mfa"
echo "3. Check browser console for debug logs"
echo "4. If debug mode appears, set environment ID and worker token"
echo "5. Test dropdown opening, searching, and selection"

exit 0
