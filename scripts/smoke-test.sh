#!/bin/bash

# Smoke Testing Script
# Quick functional tests to ensure basic functionality works after each phase

set -e

echo "🔥 Running smoke tests..."

# Function to test if app can start
test_app_startup() {
    echo "🚀 Testing app startup..."
    
    # Start the app in background
    npm start &
    local app_pid=$!
    
    # Wait for app to start
    echo "⏳ Waiting for app to start..."
    sleep 10
    
    # Check if app is running
    if kill -0 $app_pid 2>/dev/null; then
        echo "✅ App started successfully"
        
        # Test basic endpoints
        echo "🔍 Testing basic endpoints..."
        
        # Test home page
        if curl -s http://localhost:3000 | grep -q "OAuth Playground"; then
            echo "✅ Home page loads"
        else
            echo "❌ Home page failed to load"
            kill $app_pid 2>/dev/null
            return 1
        fi
        
        # Test OAuth page
        if curl -s http://localhost:3000/flows/oauth | grep -q "OAuth"; then
            echo "✅ OAuth page loads"
        else
            echo "❌ OAuth page failed to load"
            kill $app_pid 2>/dev/null
            return 1
        fi
        
        # Test MFA page
        if curl -s http://localhost:3000/v8/unified-mfa | grep -q "MFA"; then
            echo "✅ MFA page loads"
        else
            echo "❌ MFA page failed to load"
            kill $app_pid 2>/dev/null
            return 1
        fi
        
        # Test Protect page
        if curl -s http://localhost:3000/v8/protect | grep -q "Protect"; then
            echo "✅ Protect page loads"
        else
            echo "❌ Protect page failed to load"
            kill $app_pid 2>/dev/null
            return 1
        fi
        
        # Stop the app
        kill $app_pid 2>/dev/null
        echo "✅ App stopped successfully"
        
        return 0
    else
        echo "❌ App failed to start"
        return 1
    fi
}

# Function to test critical user flows
test_critical_flows() {
    echo "🔄 Testing critical user flows..."
    
    # Test OAuth Authorization Code flow
    echo "🔐 Testing OAuth Authorization Code flow..."
    if curl -s http://localhost:3000/flows/oauth/authorization-code | grep -q "Authorization Code"; then
        echo "✅ OAuth Authorization Code flow accessible"
    else
        echo "❌ OAuth Authorization Code flow not accessible"
        return 1
    fi
    
    # Test MFA device registration
    echo "📱 Testing MFA device registration..."
    if curl -s http://localhost:3000/v8/mfa/register/mobile | grep -q "MFA"; then
        echo "✅ MFA device registration accessible"
    else
        echo "❌ MFA device registration not accessible"
        return 1
    fi
    
    # Test Protect portal
    echo "🛡️  Testing Protect portal..."
    if curl -s http://localhost:3000/protect | grep -q "Protect"; then
        echo "✅ Protect portal accessible"
    else
        echo "❌ Protect portal not accessible"
        return 1
    fi
    
    return 0
}

# Function to test navigation
test_navigation() {
    echo "🧭 Testing navigation..."
    
    # Test if navigation components are present
    if curl -s http://localhost:3000 | grep -q "sidebar\|navigation\|menu"; then
        echo "✅ Navigation elements present"
    else
        echo "❌ Navigation elements missing"
        return 1
    fi
    
    return 0
}

# Function to test API endpoints
test_api_endpoints() {
    echo "🔌 Testing API endpoints..."
    
    # Test token endpoint
    if curl -s http://localhost:3000/api/token | grep -q "error\|invalid\|missing"; then
        echo "✅ Token endpoint responds (expected error for missing params)"
    else
        echo "❌ Token endpoint not responding"
        return 1
    fi
    
    # Test discovery endpoint
    if curl -s http://localhost:3000/.well-known/openid_configuration | grep -q "issuer\|authorization_endpoint"; then
        echo "✅ Discovery endpoint working"
    else
        echo "❌ Discovery endpoint not working"
        return 1
    fi
    
    return 0
}

# Main smoke test function
main() {
    local phase=${1:-"current"}
    
    echo "=========================================="
    echo "🔥 SMOKE TESTING - Phase $phase"
    echo "=========================================="
    echo "Time: $(date)"
    echo ""
    
    # Run smoke tests
    local test_failed=0
    
    # 1. Test app startup
    if ! test_app_startup; then
        test_failed=1
    fi
    
    # 2. Test critical flows
    if ! test_critical_flows; then
        test_failed=1
    fi
    
    # 3. Test navigation
    if ! test_navigation; then
        test_failed=1
    fi
    
    # 4. Test API endpoints
    if ! test_api_endpoints; then
        test_failed=1
    fi
    
    # Summary
    echo ""
    echo "=========================================="
    echo "📊 SMOKE TEST SUMMARY - Phase $phase"
    echo "=========================================="
    
    if [[ $test_failed -eq 0 ]]; then
        echo "✅ ALL SMOKE TESTS PASSED"
        echo "🎉 Basic functionality is working"
        echo ""
        echo "📋 Test Results:"
        echo "  - App Startup: ✅"
        echo "  - Critical Flows: ✅"
        echo "  - Navigation: ✅"
        echo "  - API Endpoints: ✅"
        echo ""
        echo "🚀 Ready for more detailed testing"
        return 0
    else
        echo "❌ SOME SMOKE TESTS FAILED"
        echo "🛑 Basic functionality is broken"
        echo ""
        echo "📋 Failed Tests:"
        echo "  - Check the error messages above"
        echo "  - Fix critical issues immediately"
        echo "  - Re-run smoke tests before proceeding"
        echo ""
        echo "🔄 Recommended actions:"
        echo "  1. Fix app startup issues first"
        echo "  2. Check for missing components"
        echo "  3. Verify routing configuration"
        echo "  4. Test individual components"
        return 1
    fi
}

# Run main function with all arguments
main "$@"
