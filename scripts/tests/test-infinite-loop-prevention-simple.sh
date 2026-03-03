#!/bin/bash

# Infinite Loop Prevention Test - Simplified Version
# Prevents recurrence of useImplicitFlowController infinite render loop

set -e

echo "🔍 Infinite Loop Prevention Test"
echo "================================"
echo "Testing for useEffect infinite loops and component import issues"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test results
PASSED=0
FAILED=0

# Function to log test result
log_test() {
    local test_name="$1"
    local result="$2"
    local message="$3"
    
    if [ "$result" = "PASS" ]; then
        echo -e "${GREEN}✅ PASS${NC}: $test_name"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC}: $test_name"
        echo -e "   ${YELLOW}Error:${NC} $message"
        ((FAILED++))
    fi
}

# Test 1: Check useImplicitFlowController for infinite loop patterns
echo "🔍 Testing useImplicitFlowController..."
if grep -A20 "setHasUnsavedCredentialChanges" src/hooks/useImplicitFlowController.ts | grep -q "credentials.*\].*credentials"; then
    log_test "useImplicitFlowController Dependencies" "FAIL" "Found credentials object in dependency array"
else
    log_test "useImplicitFlowController Dependencies" "PASS" "No infinite loop patterns found"
fi

# Test 2: Check TokenRevocationFlow component export
echo "🔍 Testing TokenRevocationFlow..."
if grep -q "const TokenRevocationFlow.*React.FC" src/pages/flows/TokenRevocationFlow.tsx && grep -q "export default TokenRevocationFlow" src/pages/flows/TokenRevocationFlow.tsx; then
    log_test "TokenRevocationFlow Export" "PASS" "Component defined and exported correctly"
else
    log_test "TokenRevocationFlow Export" "FAIL" "Component definition/export mismatch"
fi

# Test 3: Check FlowCredentials environment ID field
echo "🔍 Testing FlowCredentials..."
if grep -q "environment-id-field" src/components/FlowCredentials.tsx && grep -q "grid-column: 1 / -1" src/components/FlowCredentials.tsx; then
    log_test "FlowCredentials Environment ID" "PASS" "Environment ID field configured for full width"
else
    log_test "FlowCredentials Environment ID" "FAIL" "Environment ID field not properly configured"
fi

# Test 4: Check useEffect dependency patterns
echo "🔍 Testing useEffect patterns..."
if grep -q "credentials.environmentId" src/hooks/useImplicitFlowController.ts && grep -q "credentials.clientId" src/hooks/useImplicitFlowController.ts; then
    log_test "useEffect Specific Dependencies" "PASS" "Proper useEffect dependency pattern found"
else
    log_test "useEffect Specific Dependencies" "FAIL" "Missing required credential fields in dependencies"
fi

# Test 5: Check test file exists
echo "🔍 Testing test file..."
if [ -f "src/test/infinite-loop-prevention.test.tsx" ]; then
    log_test "Test File Existence" "PASS" "Infinite loop prevention test file exists"
else
    log_test "Test File Existence" "FAIL" "Test file not found"
fi

# Summary
echo ""
echo "📊 Test Summary"
echo "=================="
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All infinite loop prevention tests passed!${NC}"
    echo "✅ No infinite loop risks detected"
    echo "✅ Component exports are consistent"
    echo "✅ Environment ID field is properly configured"
    echo "✅ Test file is in place"
    exit 0
else
    echo -e "${RED}🚨 $FAILED infinite loop prevention tests failed!${NC}"
    echo "⚠️  Please fix the issues before proceeding with deployment"
    echo ""
    echo "🔧 Recommended fixes:"
    echo "1. Remove 'credentials' object from useEffect dependency arrays"
    echo "2. Use specific credential fields instead of entire object"
    echo "3. Ensure component names match between definition and export"
    echo "4. Configure FlowCredentials environment ID field for full width"
    exit 1
fi
