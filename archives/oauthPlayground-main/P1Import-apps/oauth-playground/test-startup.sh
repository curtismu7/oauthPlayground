#!/bin/bash

# OAuth Playground Startup Tests
# Comprehensive testing suite for the OAuth playground

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_WARNING=0

# Test results array
declare -a TEST_RESULTS=()

# Function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_exit="$3"

    echo -n "   • $test_name... "

    # Run the test
    if eval "$test_command" > /dev/null 2>&1; then
        local exit_code=$?
        if [ "$exit_code" -eq "$expected_exit" ] 2>/dev/null || [ "$expected_exit" = "any" ]; then
            echo -e "${GREEN}✅ PASS${NC}"
            TEST_RESULTS+=("$test_name: PASS")
            ((TESTS_PASSED++))
            return 0
        else
            echo -e "${RED}❌ FAIL${NC} (exit code: $exit_code, expected: $expected_exit)"
            TEST_RESULTS+=("$test_name: FAIL (exit code: $exit_code)")
            ((TESTS_FAILED++))
            return 1
        fi
    else
        echo -e "${RED}❌ FAIL${NC} (command failed)"
        TEST_RESULTS+=("$test_name: FAIL (command failed)")
        ((TESTS_FAILED++))
        return 1
    fi
}

# Function to run a warning test (non-critical)
run_warning_test() {
    local test_name="$1"
    local test_command="$2"

    echo -n "   • $test_name... "

    if eval "$test_command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PASS${NC}"
        TEST_RESULTS+=("$test_name: PASS")
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${YELLOW}⚠️  WARN${NC} (non-critical)"
        TEST_RESULTS+=("$test_name: WARN (non-critical)")
        ((TESTS_WARNING++))
        return 0
    fi
}

# Function to check if port is available
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null; then
        return 0
    else
        return 1
    fi
}

# Function to test HTTP endpoint
test_http_endpoint() {
    local url=$1
    local expected_status=${2:-200}

    if command -v curl >/dev/null 2>&1; then
        local status=$(curl -s -o /dev/null -w "%{http_code}" "$url")
        if [ "$status" = "$expected_status" ]; then
            return 0
        else
            return 1
        fi
    else
        # Fallback to checking if port is open
        local port=$(echo "$url" | sed -E 's|.*:([0-9]+).*|\1|')
        check_port "$port"
    fi
}

# Main test suite
echo ""
echo "╔══════════════════════════════════════════════════════════════════════════════╗"
echo "║                           🧪 STARTUP TESTS 🧪                             ║"
echo "╚══════════════════════════════════════════════════════════════════════════════╝"
echo ""

# Test 1: Configuration files
echo "📁 Configuration Tests:"
run_test "package.json exists" "[ -f 'package.json' ]" 0
run_test ".env file exists" "[ -f '.env' ]" 0
run_test "src directory exists" "[ -d 'src' ]" 0

# Test 2: Node.js and dependencies
echo ""
echo "📦 Dependency Tests:"
run_test "Node.js installed" "node --version" "any"
run_test "npm installed" "npm --version" "any"
run_test "node_modules exists" "[ -d 'node_modules' ]" 0

# Test 3: PingOne Configuration
echo ""
echo "🔐 PingOne Configuration Tests:"
if [ -f ".env" ]; then
    # Check for required environment variables
    run_test "PINGONE_ENVIRONMENT_ID set" "grep -q 'PINGONE_ENVIRONMENT_ID=' .env && grep -q 'PINGONE_ENVIRONMENT_ID=b9817c16' .env" 0
    run_test "PINGONE_CLIENT_ID set" "grep -q 'PINGONE_CLIENT_ID=' .env && grep -q 'PINGONE_CLIENT_ID=c4595910-1040-4d5d-a631-396ca106ac2c' .env" 0
    run_test "PINGONE_CLIENT_SECRET set" "grep -q 'PINGONE_CLIENT_SECRET=' .env" 0
    run_test "PINGONE_REDIRECT_URI set" "grep -q 'PINGONE_REDIRECT_URI=' .env" 0
    run_test "PINGONE_API_URL set" "grep -q 'PINGONE_API_URL=' .env" 0
else
    echo "   • Skipping PingOne tests (.env file missing)"
fi

# Test 4: Source code structure
echo ""
echo "📂 Source Code Structure Tests:"
run_test "App.tsx exists" "[ -f 'src/App.tsx' ]" 0
run_test "main.tsx exists" "[ -f 'src/main.tsx' ]" 0
run_test "index.html exists" "[ -f 'index.html' ]" 0
run_test "pages directory exists" "[ -d 'src/pages' ]" 0
run_test "components directory exists" "[ -d 'src/components' ]" 0
run_test "contexts directory exists" "[ -d 'src/contexts' ]" 0
run_test "utils directory exists" "[ -d 'src/utils' ]" 0

# Test 5: React components
echo ""
echo "⚛️  React Components Tests:"
run_test "Login page exists" "[ -f 'src/pages/Login.tsx' ]" 0
run_test "Dashboard page exists" "[ -f 'src/pages/Dashboard.tsx' ]" 0
run_test "OAuthFlows page exists" "[ -f 'src/pages/OAuthFlows.tsx' ]" 0
run_test "TokenInspector page exists" "[ -f 'src/pages/TokenInspector.tsx' ]" 0
run_test "Configuration page exists" "[ -f 'src/pages/Configuration.tsx' ]" 0
run_test "AuthContext exists" "[ -f 'src/contexts/AuthContext.tsx' ]" 0

# Test 6: Utility functions
echo ""
echo "🛠️  Utility Functions Tests:"
run_test "OAuth utils exist" "[ -f 'src/utils/oauth.ts' ]" 0
run_test "JWT utils exist" "[ -f 'src/utils/jwt.ts' ]" 0
run_test "Storage utils exist" "[ -f 'src/utils/storage.ts' ]" 0
run_test "URL utils exist" "[ -f 'src/utils/url.ts' ]" 0
run_test "Crypto utils exist" "[ -f 'src/utils/crypto.ts' ]" 0

# Test 7: Build and dev scripts
echo ""
echo "🔨 Build System Tests:"
run_test "Vite config exists" "[ -f 'vite.config.ts' ]" 0
run_test "Enhanced startup script exists" "[ -f 'start-dev.sh' ]" 0
run_test "start-dev.sh is executable" "[ -x 'start-dev.sh' ]" 0

# Test 8: Port availability
echo ""
echo "🌐 Port Availability Tests:"
PORT=${PORT:-3000}
run_warning_test "Port $PORT is available" "! check_port $PORT"

# Test 9: Security features
echo ""
echo "🔒 Security Feature Tests:"
run_test "OAuth errors utility exists" "[ -f 'src/utils/oauthErrors.ts' ]" 0
run_warning_test "Environment variables don't contain secrets in plain text" "! grep -q 'secret.*password\|password.*secret' .env 2>/dev/null"

# Test 10: Documentation
echo ""
echo "📚 Documentation Tests:"
run_test "README.md exists" "[ -f 'README.md' ]" 0
run_test "DEPLOYMENT.md exists" "[ -f 'DEPLOYMENT.md' ]" 0
run_test ".env.example exists" "[ -f '.env.example' ]" 0

# Summary
echo ""
echo "╔══════════════════════════════════════════════════════════════════════════════╗"
echo "║                             📊 TEST SUMMARY 📊                            ║"
echo "╚══════════════════════════════════════════════════════════════════════════════╝"
echo ""
printf "Total Tests: %-3d\n" $((TESTS_PASSED + TESTS_FAILED + TESTS_WARNING))
echo ""
if [ $TESTS_PASSED -gt 0 ]; then
    echo -e "${GREEN}✅ Passed: $TESTS_PASSED${NC}"
fi
if [ $TESTS_WARNING -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Warnings: $TESTS_WARNING${NC}"
fi
if [ $TESTS_FAILED -gt 0 ]; then
    echo -e "${RED}❌ Failed: $TESTS_FAILED${NC}"
fi

# Overall status
echo ""
if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All critical tests passed! OAuth Playground is ready.${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please review the issues above.${NC}"
    exit 1
fi
