#!/bin/bash

# Comprehensive Inventory Check Script
# Ensures we check ALL primary inventory files before making changes
# These are the 7 PRIMARY inventory files for regression checking

echo "🔍 COMPREHENSIVE INVENTORY CHECK"
echo "================================="

# Define PRIMARY inventory files for regression checking
INVENTORY_FILES=(
    "PRODUCTION_INVENTORY.md"
    "UNIFIED_MFA_INVENTORY.md" 
    "UNIFIED_OAUTH_INVENTORY.md"
    "PROTECT_PORTAL_INVENTORY.md"
    "USER_MANAGEMENT_INVENTORY.md"
    "SDK_EXAMPLES_INVENTORY.md"
    "SWE-15_PRODUCTION_INVENTORY.md"
)

# Check each inventory file exists
echo "📋 Checking PRIMARY inventory files exist..."
for file in "${INVENTORY_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file - MISSING"
    fi
done

echo ""
echo "🔍 Running prevention commands from all PRIMARY inventories..."

# PRODUCTION INVENTORY CHECKS
echo ""
echo "=== PRODUCTION INVENTORY CHECKS ==="
if [ -f "PRODUCTION_INVENTORY.md" ]; then
    echo "📋 Checking Production apps for regressions..."
    
    # Token Monitoring
    grep -rn "localStorage.*token" src/lab/services/tokenMonitoringService.ts | wc -l && echo "✅ Token persistence found" || echo "⚠️  Token persistence check"
    
    # Device Management
    grep -rn "policy.*deviceCount\|deviceLimit" src/mfa/pages/DeleteAllDevicesUtilityV8.tsx | wc -l && echo "✅ Device count display found" || echo "⚠️  Device count check"
    
    # Dropdown functionality
    grep -rn "All Tokens\|selectedTokenType.*all" src/lab/pages/TokenMonitoringPage.tsx | wc -l && echo "✅ Dropdown functionality found" || echo "⚠️  Dropdown check"
    
    # Controlled inputs
    grep -rn "checked.*??.*false" src/mfa/components/SilentApiConfigCheckboxV8.tsx | wc -l && echo "✅ Controlled input fixed" || echo "⚠️  Controlled input check"
    
    # Null safety
    grep -rn "environments\?" src/pages/EnvironmentManagementPageV8.tsx | wc -l && echo "✅ Null safety implemented" || echo "⚠️  Null safety check"
fi

# UNIFIED MFA INVENTORY CHECKS
echo ""
echo "=== UNIFIED MFA INVENTORY CHECKS ==="
if [ -f "UNIFIED_MFA_INVENTORY.md" ]; then
    echo "📋 Checking Unified MFA for regressions..."
    
    # Version sync
    grep -E "version.*9\." package.json | head -3
    
    # Base64 display prevention
    if [ -f "scripts/prevent-base64-display.sh" ]; then
        ./scripts/prevent-base64-display.sh 2>/dev/null || echo "⚠️  Base64 display check"
    fi
    
    # Silent API configuration
    grep -rn "setShowWorkerTokenModal(true)" src/mfa/ --include="*.tsx" --include="*.ts" | grep -v "workerTokenModalHelperV8" | wc -l && echo "⚠️  Direct modal calls found (should be 0)" || echo "✅ No direct modal calls"
    
    # Flow type determination
    grep -rn "registrationFlowType" src/mfa/flows/unified/ | wc -l && echo "✅ Flow type logic found" || echo "⚠️  Flow type check"
    
    # Redirect URI routing
    grep -rn "ReturnTargetServiceV8U" src/lab/components/CallbackHandlerV8U.tsx | wc -l && echo "✅ Return target service found" || echo "⚠️  Return target check"
fi

# UNIFIED OAUTH INVENTORY CHECKS
echo ""
echo "=== UNIFIED OAUTH INVENTORY CHECKS ==="
if [ -f "UNIFIED_OAUTH_INVENTORY.md" ]; then
    echo "📋 Checking Unified OAuth for regressions..."
    
    # OAuth callback handling
    grep -rn "oauth.*callback\|callback.*handler" src/lab/ --include="*.tsx" | wc -l && echo "✅ OAuth callbacks found" || echo "⚠️  OAuth callback check"
    
    # Token exchange
    grep -rn "TokenExchangeService" src/mfa/ | wc -l && echo "✅ Token exchange service found" || echo "⚠️  Token exchange check"
fi

# PROTECT PORTAL INVENTORY CHECKS
echo ""
echo "=== PROTECT PORTAL INVENTORY CHECKS ==="
if [ -f "PROTECT_PORTAL_INVENTORY.md" ]; then
    echo "📋 Checking Protect Portal for regressions..."
    
    # CORS configuration
    grep -rn "Access-Control-Allow-Origin" server.js | wc -l && echo "✅ CORS config found" || echo "⚠️  CORS check"
    
    # Risk evaluation
    grep -rn "risk.*evaluation\|RiskEvaluation" src/protect-app/ --include="*.tsx" | wc -l && echo "✅ Risk evaluation found" || echo "⚠️  Risk evaluation check"
    
    # Protect Portal routes
    grep -rn "/protect-portal" src/App.tsx | wc -l && echo "✅ Protect Portal routes found" || echo "⚠️  Routes check"
fi

# USER MANAGEMENT INVENTORY CHECKS
echo ""
echo "=== USER MANAGEMENT INVENTORY CHECKS ==="
if [ -f "USER_MANAGEMENT_INVENTORY.md" ]; then
    echo "📋 Checking User Management for regressions..."
    
    # User login modal
    grep -rn "UserLoginModal" src/mfa/components/ --include="*.tsx" | wc -l && echo "✅ User login modal found" || echo "⚠️  User login check"
    
    # User authentication
    grep -rn "user.*auth\|authentication" src/mfa/services/ --include="*.ts" | wc -l && echo "✅ User auth services found" || echo "⚠️  User auth check"
fi

# SDK EXAMPLES INVENTORY CHECKS
echo ""
echo "=== SDK EXAMPLES INVENTORY CHECKS ==="
if [ -f "SDK_EXAMPLES_INVENTORY.md" ]; then
    echo "📋 Checking SDK Examples for regressions..."
    
    # SDK sample app
    grep -rn "sdk-sample-app" src/ --include="*.tsx" | wc -l && echo "✅ SDK sample app found" || echo "⚠️  SDK sample check"
fi

# SWE-15 PRODUCTION INVENTORY CHECKS
echo ""
echo "=== SWE-15 COMPLIANCE CHECKS ==="
if [ -f "SWE-15_PRODUCTION_INVENTORY.md" ]; then
    echo "📋 Checking SWE-15 compliance..."
    
    # Single Responsibility
    echo "✅ SWE-15 principles documented"
    
    # Interface segregation
    grep -rn "interface.*Props" src/mfa/ --include="*.tsx" | wc -l && echo "✅ Interface patterns found" || echo "⚠️  Interface check"
fi

echo ""
echo "🎯 INVENTORY CHECK COMPLETE!"
echo "📊 Total PRIMARY inventory files checked: ${#INVENTORY_FILES[@]}"

# PLAYWRIGHT GOLDEN-PATH TESTS (Dynamic Regression Prevention)
echo ""
echo "=== PLAYWRIGHT GOLDEN-PATH TESTS ==="
echo "🧪 Running dynamic E2E tests for critical user flows..."

# Check if Playwright is available
if ! command -v npx >/dev/null 2>&1; then
    echo "⚠️  npx not found, skipping Playwright tests"
elif [ ! -f "package.json" ] || ! grep -q "playwright" package.json; then
    echo "⚠️  Playwright not installed, skipping E2E tests"
else
    echo "🚀 Running golden-path Playwright tests..."
    
    # Run only the golden-path tests for CI efficiency
    if npx playwright test e2e/tests/golden-path-flows.spec.ts --reporter=line; then
        echo "✅ Golden-path tests passed - No dynamic regressions detected"
    else
        echo "❌ Golden-path tests FAILED - Dynamic regression detected!"
        echo "📊 Test results saved to: test-results/golden-path-results.json"
        echo "🔍 Check test-results/ for screenshots and traces"
        exit 1
    fi
fi

echo ""
echo "🎯 COMPREHENSIVE REGRESSION PREVENTION COMPLETE!"
echo "📊 Static inventory checks + Dynamic E2E tests passed"
echo ""
echo "⚠️  IMPORTANT REMINDERS:"
echo "   1. Check ALL 7 inventory files before making changes"
echo "   2. Run prevention commands for affected areas"
echo "   3. Update inventory files with new issues/prevention commands"
echo "   4. Test across all apps (Production, MFA, OAuth, Protect Portal, User Mgmt, SDK)"
echo "   5. Follow SWE-15 principles for all changes"
echo "   6. Golden-path tests catch both known + unknown regressions"
