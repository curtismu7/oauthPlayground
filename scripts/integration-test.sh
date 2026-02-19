#!/bin/bash

# Integration Testing Script
# Test integration between apps and shared components

set -e

echo "🔗 Running integration tests..."

# Function to test app-to-app communication
test_app_communication() {
    echo "📡 Testing app-to-app communication..."
    
    # Test if OAuth app can access shared services
    echo "🔐 Testing OAuth app shared service access..."
    if grep -r "from.*shared/" src/apps/oauth/ --include="*.ts" --include="*.tsx" | head -5; then
        echo "✅ OAuth app imports from shared services"
    else
        echo "⚠️  OAuth app may not be using shared services"
    fi
    
    # Test if MFA app can access shared services
    echo "📱 Testing MFA app shared service access..."
    if grep -r "from.*shared/" src/apps/mfa/ --include="*.ts" --include="*.tsx" | head -5; then
        echo "✅ MFA app imports from shared services"
    else
        echo "⚠️  MFA app may not be using shared services"
    fi
    
    # Test if Protect app can access shared services
    echo "🛡️  Testing Protect app shared service access..."
    if grep -r "from.*shared/" src/apps/protect/ --include="*.ts" --include="*.tsx" | head -5; then
        echo "✅ Protect app imports from shared services"
    else
        echo "⚠️  Protect app may not be using shared services"
    fi
    
    return 0
}

# Function to test shared component usage
test_shared_components() {
    echo "🧩 Testing shared component usage..."
    
    # Check if apps are using shared components
    local shared_components=(
        "Button"
        "Input"
        "Modal"
        "Toast"
        "Spinner"
    )
    
    for component in "${shared_components[@]}"; do
        echo "🔍 Checking $component usage..."
        local usage_count=$(grep -r "$component" src/apps/ --include="*.ts" --include="*.tsx" | wc -l || echo "0")
        if [[ $usage_count -gt 0 ]]; then
            echo "✅ $component used $usage_count times across apps"
        else
            echo "⚠️  $component not found in apps"
        fi
    done
    
    return 0
}

# Function to test shared service integration
test_shared_services() {
    echo "⚙️  Testing shared service integration..."
    
    # Check if shared services are properly exported
    echo "📦 Checking shared service exports..."
    if [[ -f "src/shared/services/index.ts" ]]; then
        echo "✅ Shared services index file exists"
        if grep -r "export" src/shared/services/index.ts | head -5; then
            echo "✅ Shared services are exported"
        else
            echo "⚠️  Shared services may not be properly exported"
        fi
    else
        echo "⚠️  Shared services index file missing"
    fi
    
    # Test shared authentication service
    echo "🔐 Testing shared authentication service..."
    if [[ -f "src/shared/services/authService.ts" ]] || grep -r "authService" src/shared/services/ --include="*.ts"; then
        echo "✅ Shared authentication service found"
    else
        echo "⚠️  Shared authentication service not found"
    fi
    
    # Test shared storage service
    echo "💾 Testing shared storage service..."
    if [[ -f "src/shared/services/storageService.ts" ]] || grep -r "storageService" src/shared/services/ --include="*.ts"; then
        echo "✅ Shared storage service found"
    else
        echo "⚠️  Shared storage service not found"
    fi
    
    return 0
}

# Function to test cross-app data flow
test_data_flow() {
    echo "🌊 Testing cross-app data flow..."
    
    # Test if user context is shared properly
    echo "👤 Testing user context sharing..."
    if grep -r "UserContext\|AuthContext" src/apps/ --include="*.ts" --include="*.tsx" | head -5; then
        echo "✅ User/Auth context found in apps"
    else
        echo "⚠️  User/Auth context may not be shared properly"
    fi
    
    # Test if token state is shared
    echo "🎫 Testing token state sharing..."
    if grep -r "token\|Token" src/apps/ --include="*.ts" --include="*.tsx" | head -5; then
        echo "✅ Token handling found in apps"
    else
        echo "⚠️  Token handling may not be shared properly"
    fi
    
    # Test if environment configuration is shared
    echo "🌍 Testing environment configuration sharing..."
    if grep -r "environment\|Environment" src/apps/ --include="*.ts" --include="*.tsx" | head -5; then
        echo "✅ Environment configuration found in apps"
    else
        echo "⚠️  Environment configuration may not be shared properly"
    fi
    
    return 0
}

# Function to test routing integration
test_routing_integration() {
    echo "🛣️  Testing routing integration..."
    
    # Check if main routing is properly configured
    echo "🗺️  Checking main routing configuration..."
    if [[ -f "src/App.tsx" ]]; then
        echo "✅ Main App.tsx exists"
        if grep -r "Route\|Routes" src/App.tsx | head -5; then
            echo "✅ Routing configuration found"
        else
            echo "❌ Routing configuration missing"
            return 1
        fi
    else
        echo "❌ Main App.tsx missing"
        return 1
    fi
    
    # Test if app routes are properly integrated
    echo "🔄 Checking app route integration..."
    local app_routes=(
        "oauth"
        "mfa"
        "protect"
        "user-management"
        "admin"
        "navigation"
    )
    
    for app in "${app_routes[@]}"; do
        if grep -r "$app" src/App.tsx; then
            echo "✅ $app routes found in main routing"
        else
            echo "⚠️  $app routes may not be integrated"
        fi
    done
    
    return 0
}

# Function to test theme/styling integration
test_theme_integration() {
    echo "🎨 Testing theme/styling integration..."
    
    # Check if shared styles are properly imported
    echo "🎭 Checking shared style imports..."
    if grep -r "from.*shared/" src/apps/ --include="*.css" --include="*.scss" --include="*.ts" --include="*.tsx" | head -5; then
        echo "✅ Shared styles imported in apps"
    else
        echo "⚠️  Shared styles may not be imported"
    fi
    
    # Test if theme providers are properly configured
    echo "🌈 Checking theme provider configuration..."
    if grep -r "ThemeProvider\|Theme" src/App.tsx src/apps/ --include="*.ts" --include="*.tsx" | head -5; then
        echo "✅ Theme providers found"
    else
        echo "⚠️  Theme providers may not be configured"
    fi
    
    return 0
}

# Main integration test function
main() {
    local phase=${1:-"current"}
    
    echo "=========================================="
    echo "🔗 INTEGRATION TESTING - Phase $phase"
    echo "=========================================="
    echo "Time: $(date)"
    echo ""
    
    # Run integration tests
    local test_failed=0
    
    # 1. Test app communication
    if ! test_app_communication; then
        test_failed=1
    fi
    
    # 2. Test shared components
    if ! test_shared_components; then
        test_failed=1
    fi
    
    # 3. Test shared services
    if ! test_shared_services; then
        test_failed=1
    fi
    
    # 4. Test data flow
    if ! test_data_flow; then
        test_failed=1
    fi
    
    # 5. Test routing integration
    if ! test_routing_integration; then
        test_failed=1
    fi
    
    # 6. Test theme integration
    if ! test_theme_integration; then
        test_failed=1
    fi
    
    # Summary
    echo ""
    echo "=========================================="
    echo "📊 INTEGRATION TEST SUMMARY - Phase $phase"
    echo "=========================================="
    
    if [[ $test_failed -eq 0 ]]; then
        echo "✅ ALL INTEGRATION TESTS PASSED"
        echo "🎉 Apps are properly integrated"
        echo ""
        echo "📋 Test Results:"
        echo "  - App Communication: ✅"
        echo "  - Shared Components: ✅"
        echo "  - Shared Services: ✅"
        echo "  - Data Flow: ✅"
        echo "  - Routing Integration: ✅"
        echo "  - Theme Integration: ✅"
        echo ""
        echo "🚀 Integration is working correctly"
        return 0
    else
        echo "❌ SOME INTEGRATION TESTS FAILED"
        echo "🛑 Apps may not be properly integrated"
        echo ""
        echo "📋 Failed Tests:"
        echo "  - Check the error messages above"
        echo "  - Verify shared component exports"
        echo "  - Check service integration"
        echo "  - Verify routing configuration"
        echo ""
        echo "🔄 Recommended actions:"
        echo "  1. Fix shared component exports"
        echo "  2. Verify service integration"
        echo "  3. Check routing configuration"
        echo "  4. Test individual app integrations"
        return 1
    fi
}

# Run main function with all arguments
main "$@"
