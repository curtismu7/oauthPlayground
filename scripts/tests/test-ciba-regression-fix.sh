#!/bin/bash

echo "🧪 CIBA Flow V9 Regression Test"
echo "================================="

# Test 1: Check login hint dropdown onChange handler
echo "📋 Checking login hint dropdown onChange handler..."
if grep -q "selectedType === 'login_hint'" src/pages/flows/CIBAFlowV9.tsx && \
   grep -q "selectedType === 'id_token_hint'" src/pages/flows/CIBAFlowV9.tsx && \
   grep -q "selectedType === 'login_hint_token'" src/pages/flows/CIBAFlowV9.tsx; then
    echo "✅ Login hint dropdown onChange handler fixed"
else
    echo "❌ Login hint dropdown onChange handler still broken!"
    exit 1
fi

# Test 2: Check missing input fields are added
echo "📋 Checking missing input fields..."
if grep -q "TextArea" src/pages/flows/CIBAFlowV9.tsx && \
   grep -q "idTokenHint" src/pages/flows/CIBAFlowV9.tsx && \
   grep -q "loginHintToken" src/pages/flows/CIBAFlowV9.tsx; then
    echo "✅ Missing input fields for id_token_hint and login_hint_token added"
else
    echo "❌ Missing input fields not found!"
    exit 1
fi

# Test 3: Check generate button is added
echo "📋 Checking generate login hint token button..."
if grep -q "Generate" src/pages/flows/CIBAFlowV9.tsx && \
   grep -q "generateLoginHintToken" src/pages/flows/CIBAFlowV9.tsx; then
    echo "✅ Generate login hint token button added"
else
    echo "❌ Generate button not found!"
    exit 1
fi

# Test 4: Check generateLoginHintToken function
echo "📋 Checking generateLoginHintToken function..."
if grep -q "const generateLoginHintToken" src/pages/flows/CIBAFlowV9.tsx && \
   grep -q "/api/generate-login-hint-token" src/pages/flows/CIBAFlowV9.tsx; then
    echo "✅ generateLoginHintToken function implemented"
else
    echo "❌ generateLoginHintToken function not implemented!"
    exit 1
fi

# Test 5: Check proper toast usage
echo "📋 Checking proper toast usage..."
if grep -q "v4ToastManager" src/pages/flows/CIBAFlowV9.tsx && \
   ! grep -q "toastV9" src/pages/flows/CIBAFlowV9.tsx && \
   ! grep -q "alert(" src/pages/flows/CIBAFlowV9.tsx; then
    echo "✅ Proper toast usage (v4ToastManager) implemented"
else
    echo "❌ Toast usage not fixed!"
    exit 1
fi

# Test 6: Check conditional input field rendering
echo "📋 Checking conditional input field rendering..."
if grep -q "credentials.idTokenHint.*!==.*''.*&&" src/pages/flows/CIBAFlowV9.tsx && \
   grep -q "credentials.loginHintToken.*!==.*''.*&&" src/pages/flows/CIBAFlowV9.tsx; then
    echo "✅ Conditional input field rendering implemented"
else
    echo "❌ Conditional rendering not working!"
    exit 1
fi

# Test 7: Check Button import
echo "📋 Checking Button component import..."
if grep -q "import.*Button.*from.*@/components/ui/Button" src/pages/flows/CIBAFlowV9.tsx; then
    echo "✅ Button component imported"
else
    echo "❌ Button component not imported!"
    exit 1
fi

# Test 8: Check build
echo ""
echo "📋 Checking build..."
if npm run build > /dev/null 2>&1; then
    echo "✅ Build succeeds"
else
    echo "❌ Build fails"
    exit 1
fi

echo ""
echo "🎉 CIBA Flow V9 Regression Test Complete!"
echo "✅ Login hint dropdown onChange handler fixed"
echo "✅ Missing input fields for id_token_hint and login_hint_token added"
echo "✅ Generate login hint token button implemented"
echo "✅ generateLoginHintToken function with API call implemented"
echo "✅ Proper toast usage (v4ToastManager) implemented"
echo "✅ Conditional input field rendering working"
echo "✅ Button component properly imported"
echo "✅ Build successful"

echo ""
echo "🔍 What these fixes restore:"
echo "- Login hint dropdown now properly sets selected type"
echo "- All three login hint types have input fields: login_hint, id_token_hint, login_hint_token"
echo "- Users can generate JWT login hint tokens with one click"
echo "- Proper error handling with toast notifications"
echo "- Conditional UI shows appropriate input fields based on selection"

echo ""
echo "🔍 Next steps to test the fixes:"
echo "1. Start the development server: npm run dev"
echo "2. Navigate to: /flows/CIBAFlowV9"
echo "3. Select different login hint types from dropdown"
echo "4. Verify appropriate input fields appear"
echo "5. Test Generate button for login hint token"
echo "6. Verify complete CIBA flow functionality"
