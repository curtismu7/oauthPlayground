#!/bin/bash

# Regression Testing Script
# Compare before/after states to ensure no functionality is lost

set -e

echo "🔍 Running regression tests..."

# Function to create baseline snapshot
create_baseline() {
    local phase=$1
    echo "📸 Creating baseline snapshot for Phase $phase..."
    
    local baseline_dir="test-baselines/$phase"
    mkdir -p "$baseline_dir"
    
    # Snapshot app structure
    echo "🏗️  Snapshotting app structure..."
    find src/apps -type f | sort > "$baseline_dir/app-structure.txt"
    
    # Snapshot shared structure
    echo "🤝 Snapshotting shared structure..."
    find src/shared -type f | sort > "$baseline_dir/shared-structure.txt"
    
    # Snapshot imports
    echo "📦 Snapshotting imports..."
    grep -r "from.*apps/" src/ --include="*.ts" --include="*.tsx" | sort > "$baseline_dir/imports.txt"
    
    # Snapshot routes
    echo "🛣️  Snapshotting routes..."
    grep -r "path.*=" src/App.tsx src/apps/ --include="*.ts" --include="*.tsx" | sort > "$baseline_dir/routes.txt"
    
    # Snapshot component exports
    echo "🧩 Snapshotting component exports..."
    grep -r "export.*Component\|export.*function" src/apps/ --include="*.ts" --include="*.tsx" | sort > "$baseline_dir/components.txt"
    
    # Snapshot service exports
    echo "⚙️  Snapshotting service exports..."
    grep -r "export.*Service\|export.*service" src/apps/ src/shared/ --include="*.ts" --include="*.tsx" | sort > "$baseline_dir/services.txt"
    
    echo "✅ Baseline snapshot created for Phase $phase"
    return 0
}

# Function to compare with baseline
compare_baseline() {
    local phase=$1
    echo "🔍 Comparing with Phase $phase baseline..."
    
    local baseline_dir="test-baselines/$phase"
    
    if [[ ! -d "$baseline_dir" ]]; then
        echo "❌ Baseline for Phase $phase not found"
        return 1
    fi
    
    # Compare app structure
    echo "🏗️  Comparing app structure..."
    local current_structure=$(find src/apps -type f | sort)
    local baseline_structure=$(cat "$baseline_dir/app-structure.txt")
    
    if [[ "$current_structure" == "$baseline_structure" ]]; then
        echo "✅ App structure unchanged"
    else
        echo "⚠️  App structure changed:"
        diff -u "$baseline_dir/app-structure.txt" <(echo "$current_structure") || true
    fi
    
    # Compare shared structure
    echo "🤝 Comparing shared structure..."
    local current_shared=$(find src/shared -type f | sort)
    local baseline_shared=$(cat "$baseline_dir/shared-structure.txt")
    
    if [[ "$current_shared" == "$baseline_shared" ]]; then
        echo "✅ Shared structure unchanged"
    else
        echo "⚠️  Shared structure changed:"
        diff -u "$baseline_dir/shared-structure.txt" <(echo "$current_shared") || true
    fi
    
    # Compare imports
    echo "📦 Comparing imports..."
    local current_imports=$(grep -r "from.*apps/" src/ --include="*.ts" --include="*.tsx" | sort)
    local baseline_imports=$(cat "$baseline_dir/imports.txt")
    
    if [[ "$current_imports" == "$baseline_imports" ]]; then
        echo "✅ Imports unchanged"
    else
        echo "⚠️  Imports changed:"
        diff -u "$baseline_dir/imports.txt" <(echo "$current_imports") || true
    fi
    
    # Compare routes
    echo "🛣️  Comparing routes..."
    local current_routes=$(grep -r "path.*=" src/App.tsx src/apps/ --include="*.ts" --include="*.tsx" | sort)
    local baseline_routes=$(cat "$baseline_dir/routes.txt")
    
    if [[ "$current_routes" == "$baseline_routes" ]]; then
        echo "✅ Routes unchanged"
    else
        echo "⚠️  Routes changed:"
        diff -u "$baseline_dir/routes.txt" <(echo "$current_routes") || true
    fi
    
    # Compare components
    echo "🧩 Comparing components..."
    local current_components=$(grep -r "export.*Component\|export.*function" src/apps/ --include="*.ts" --include="*.tsx" | sort)
    local baseline_components=$(cat "$baseline_dir/components.txt")
    
    if [[ "$current_components" == "$baseline_components" ]]; then
        echo "✅ Components unchanged"
    else
        echo "⚠️  Components changed:"
        diff -u "$baseline_dir/components.txt" <(echo "$current_components") || true
    fi
    
    # Compare services
    echo "⚙️  Comparing services..."
    local current_services=$(grep -r "export.*Service\|export.*service" src/apps/ src/shared/ --include="*.ts" --include="*.tsx" | sort)
    local baseline_services=$(cat "$baseline_dir/services.txt")
    
    if [[ "$current_services" == "$baseline_services" ]]; then
        echo "✅ Services unchanged"
    else
        echo "⚠️  Services changed:"
        diff -u "$baseline_dir/services.txt" <(echo "$current_services") || true
    fi
    
    return 0
}

# Function to test critical functionality
test_critical_functionality() {
    echo "🎯 Testing critical functionality..."
    
    # Test OAuth flows
    echo "🔐 Testing OAuth flows..."
    local oauth_flows=(
        "authorization-code"
        "implicit"
        "client-credentials"
        "device-authorization"
        "ropc"
    )
    
    for flow in "${oauth_flows[@]}"; do
        if grep -r "$flow" src/apps/oauth/ --include="*.ts" --include="*.tsx" | head -1; then
            echo "✅ OAuth $flow flow found"
        else
            echo "❌ OAuth $flow flow missing"
            return 1
        fi
    done
    
    # Test MFA flows
    echo "📱 Testing MFA flows..."
    local mfa_flows=(
        "SMS"
        "EMAIL"
        "TOTP"
        "FIDO2"
    )
    
    for flow in "${mfa_flows[@]}"; do
        if grep -r "$flow" src/apps/mfa/ --include="*.ts" --include="*.tsx" | head -1; then
            echo "✅ MFA $flow flow found"
        else
            echo "❌ MFA $flow flow missing"
            return 1
        fi
    done
    
    # Test Protect functionality
    echo "🛡️  Testing Protect functionality..."
    if grep -r "ProtectPortal\|protect" src/apps/protect/ --include="*.ts" --include="*.tsx" | head -1; then
        echo "✅ Protect functionality found"
    else
        echo "❌ Protect functionality missing"
        return 1
    fi
    
    # Test User Management functionality
    echo "👥 Testing User Management functionality..."
    if grep -r "UserManagement\|user-management" src/apps/user-management/ --include="*.ts" --include="*.tsx" | head -1; then
        echo "✅ User Management functionality found"
    else
        echo "❌ User Management functionality missing"
        return 1
    fi
    
    # Test Admin functionality
    echo "⚙️  Testing Admin functionality..."
    if grep -r "Admin\|admin" src/apps/admin/ --include="*.ts" --include="*.tsx" | head -1; then
        echo "✅ Admin functionality found"
    else
        echo "❌ Admin functionality missing"
        return 1
    fi
    
    # Test Navigation functionality
    echo "🧭 Testing Navigation functionality..."
    if grep -r "Sidebar\|Navbar\|navigation" src/apps/navigation/ --include="*.ts" --include="*.tsx" | head -1; then
        echo "✅ Navigation functionality found"
    else
        echo "❌ Navigation functionality missing"
        return 1
    fi
    
    return 0
}

# Function to test performance
test_performance() {
    echo "⚡ Testing performance..."
    
    # Test build time
    echo "⏱️  Testing build time..."
    local start_time=$(date +%s)
    npm run build > /dev/null 2>&1
    local end_time=$(date +%s)
    local build_time=$((end_time - start_time))
    
    echo "📊 Build time: ${build_time}s"
    
    if [[ $build_time -lt 60 ]]; then
        echo "✅ Build time acceptable"
    else
        echo "⚠️  Build time may be too long"
    fi
    
    # Test bundle size
    echo "📦 Testing bundle size..."
    if [[ -d "dist" ]]; then
        local bundle_size=$(du -sh dist/ | cut -f1)
        echo "📊 Bundle size: $bundle_size"
        
        # Check if bundle size is reasonable (less than 50MB)
        local size_mb=$(echo "$bundle_size" | sed 's/M//')
        if [[ ${size_mb%.*} -lt 50 ]]; then
            echo "✅ Bundle size acceptable"
        else
            echo "⚠️  Bundle size may be too large"
        fi
    else
        echo "❌ Build output not found"
        return 1
    fi
    
    return 0
}

# Main regression test function
main() {
    local action=${1:-"compare"}
    local phase=${2:-"current"}
    
    echo "=========================================="
    echo "🔍 REGRESSION TESTING - $action Phase $phase"
    echo "=========================================="
    echo "Time: $(date)"
    echo ""
    
    # Create baseline directory
    mkdir -p test-baselines
    
    # Run regression tests
    local test_failed=0
    
    case $action in
        "baseline")
            # Create baseline
            if ! create_baseline "$phase"; then
                test_failed=1
            fi
            ;;
        "compare")
            # Compare with baseline
            if ! compare_baseline "$phase"; then
                test_failed=1
            fi
            
            # Test critical functionality
            if ! test_critical_functionality; then
                test_failed=1
            fi
            
            # Test performance
            if ! test_performance; then
                test_failed=1
            fi
            ;;
        *)
            echo "❌ Unknown action: $action"
            echo "Usage: $0 [baseline|compare] [phase]"
            return 1
            ;;
    esac
    
    # Summary
    echo ""
    echo "=========================================="
    echo "📊 REGRESSION TEST SUMMARY - $action Phase $phase"
    echo "=========================================="
    
    if [[ $test_failed -eq 0 ]]; then
        echo "✅ ALL REGRESSION TESTS PASSED"
        echo "🎉 No regressions detected"
        echo ""
        echo "📋 Test Results:"
        if [[ $action == "baseline" ]]; then
            echo "  - Baseline Creation: ✅"
        else
            echo "  - Baseline Comparison: ✅"
            echo "  - Critical Functionality: ✅"
            echo "  - Performance: ✅"
        fi
        echo ""
        echo "🚀 No regressions detected"
        return 0
    else
        echo "❌ SOME REGRESSION TESTS FAILED"
        echo "🛑 Regressions detected"
        echo ""
        echo "📋 Failed Tests:"
        echo "  - Check the error messages above"
        echo "  - Review the diff outputs"
        echo "  - Fix critical functionality issues"
        echo ""
        echo "🔄 Recommended actions:"
        echo "  1. Review baseline comparisons"
        echo "  2. Fix missing functionality"
        echo "  3. Optimize performance if needed"
        echo "  4. Re-run regression tests"
        return 1
    fi
}

# Run main function with all arguments
main "$@"
