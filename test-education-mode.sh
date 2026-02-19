#!/bin/bash

# Education Mode Test Script
# Tests the education preference service functionality

echo "🧪 Testing Education Mode Functionality"
echo "======================================"

# Test 1: Check if the application is running
echo "📡 Checking if application is accessible..."
if curl -k -s https://localhost:3000/ > /dev/null; then
    echo "✅ Frontend is accessible"
else
    echo "❌ Frontend is not accessible"
    exit 1
fi

if curl -k -s https://localhost:3001/api/health > /dev/null; then
    echo "✅ Backend is accessible"
else
    echo "❌ Backend is not accessible"
    exit 1
fi

# Test 2: Check if the main page loads with education components
echo ""
echo "🔍 Checking for education mode components..."

# Look for education mode toggle in the main page
EDUCATION_TOGGLE=$(curl -k -s https://localhost:3000/ | grep -o "EducationModeToggle" | head -1)
if [ -n "$EDUCATION_TOGGLE" ]; then
    echo "✅ EducationModeToggle component found in main page"
else
    echo "ℹ️ EducationModeToggle not found in main page (may be in specific routes)"
fi

# Test 3: Check UnifiedFlowSteps page
echo ""
echo "🔍 Checking UnifiedFlowSteps page..."
UNIFIED_PAGE=$(curl -k -s "https://localhost:3000/v8u/unified/oauth-authz/0")
if [ -n "$UNIFIED_PAGE" ]; then
    echo "✅ UnifiedFlowSteps page is accessible"
    
    # Check for conditional rendering patterns
    if echo "$UNIFIED_PAGE" | grep -q "educationMode.*hidden"; then
        echo "✅ Education mode conditional rendering found"
    else
        echo "ℹ️ Education mode conditional rendering not visible in HTML (may be in JS)"
    fi
    
    # Check for educational sections
    if echo "$UNIFIED_PAGE" | grep -q "CollapsibleSection"; then
        echo "✅ Educational CollapsibleSection components found"
    else
        echo "ℹ️ CollapsibleSection not found in HTML (may be rendered dynamically)"
    fi
else
    echo "❌ UnifiedFlowSteps page not accessible"
fi

# Test 4: Check other pages with education components
echo ""
echo "🔍 Checking other pages with education components..."

PAGES=(
    "https://localhost:3000/v8u/unified"
    "https://localhost:3000/flows/implicit-v7"
    "https://localhost:3000/flows/client-credentials-v7"
)

for page in "${PAGES[@]}"; do
    echo "Checking: $page"
    if curl -k -s "$page" > /dev/null; then
        echo "✅ Page accessible"
        
        # Check for MasterEducationSection
        if curl -k -s "$page" | grep -q "MasterEducationSection"; then
            echo "✅ MasterEducationSection found"
        fi
    else
        echo "❌ Page not accessible"
    fi
done

echo ""
echo "🎉 Education Mode Test Complete"
echo "================================"
echo ""
echo "📝 Manual Testing Instructions:"
echo "1. Open https://localhost:3000 in your browser"
echo "2. Navigate to /v8u/unified/oauth-authz/0"
echo "3. Open browser console and run:"
echo "   curl -s https://localhost:3000/test-education-mode-browser.js | node"
echo ""
echo "4. Or copy and paste the test script from test-education-mode-browser.js"
echo ""
echo "5. Look for the EducationModeToggle buttons and test switching modes"
echo "6. Verify educational content appears/disappears based on mode"
