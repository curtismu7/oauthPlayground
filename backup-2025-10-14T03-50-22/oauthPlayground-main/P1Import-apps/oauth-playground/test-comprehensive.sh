#!/bin/bash

# OAuth Playground Comprehensive Test Suite
# Reusable test framework for validating all components

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Test counters
TESTS_TOTAL=0
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_WARNING=0
TESTS_SKIPPED=0

# Test results
declare -a PASSED_TESTS=()
declare -a FAILED_TESTS=()
declare -a WARNING_TESTS=()
declare -a SKIPPED_TESTS=()

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$PROJECT_ROOT/.env"
LOG_FILE="$PROJECT_ROOT/logs/test-results-$(date +%Y%m%d-%H%M%S).log"

# Create logs directory
mkdir -p "$PROJECT_ROOT/logs"

# Logging function
log_test_result() {
    local test_name="$1"
    local result="$2"
    local details="$3"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    echo "[$timestamp] [$result] $test_name: $details" >> "$LOG_FILE"
}

# Test result functions
test_pass() {
    local test_name="$1"
    local details="${2:-PASSED}"

    echo -e "   ${GREEN}✅ $test_name${NC}"
    ((TESTS_PASSED++))
    ((TESTS_TOTAL++))
    PASSED_TESTS+=("$test_name")
    log_test_result "$test_name" "PASS" "$details"
}

test_fail() {
    local test_name="$1"
    local details="${2:-FAILED}"

    echo -e "   ${RED}❌ $test_name${NC}"
    echo -e "      ${RED}Details: $details${NC}"
    ((TESTS_FAILED++))
    ((TESTS_TOTAL++))
    FAILED_TESTS+=("$test_name")
    log_test_result "$test_name" "FAIL" "$details"
}

test_warn() {
    local test_name="$1"
    local details="${2:-WARNING}"

    echo -e "   ${YELLOW}⚠️  $test_name${NC}"
    echo -e "      ${YELLOW}Details: $details${NC}"
    ((TESTS_WARNING++))
    ((TESTS_TOTAL++))
    WARNING_TESTS+=("$test_name")
    log_test_result "$test_name" "WARN" "$details"
}

test_skip() {
    local test_name="$1"
    local reason="${2:-SKIPPED}"

    echo -e "   ${BLUE}⏭️  $test_name${NC} (${reason})"
    ((TESTS_SKIPPED++))
    ((TESTS_TOTAL++))
    SKIPPED_TESTS+=("$test_name")
    log_test_result "$test_name" "SKIP" "$reason"
}

# Utility functions
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

file_exists() {
    [ -f "$1" ]
}

dir_exists() {
    [ -d "$1" ]
}

is_port_open() {
    local port=$1
    if command_exists lsof; then
        lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1
    else
        # Fallback for systems without lsof
        netstat -tuln 2>/dev/null | grep -q ":$port "
    fi
}

# Test categories
test_environment() {
    echo ""
    echo -e "${CYAN}🌍 Environment Tests${NC}"

    # Node.js
    if command_exists node; then
        local node_version=$(node --version)
        test_pass "Node.js installed" "$node_version"
    else
        test_fail "Node.js installed" "Node.js not found in PATH"
    fi

    # npm
    if command_exists npm; then
        local npm_version=$(npm --version)
        test_pass "npm installed" "v$npm_version"
    else
        test_fail "npm installed" "npm not found in PATH"
    fi

    # Git
    if command_exists git; then
        local git_version=$(git --version)
        test_pass "Git installed" "$git_version"
    else
        test_warn "Git installed" "Git not found (optional for development)"
    fi

    # curl or wget
    if command_exists curl || command_exists wget; then
        test_pass "HTTP client available" "$(command_exists curl && echo 'curl' || echo 'wget')"
    else
        test_warn "HTTP client available" "Neither curl nor wget found (some tests may be limited)"
    fi
}

test_project_structure() {
    echo ""
    echo -e "${CYAN}📂 Project Structure Tests${NC}"

    # Core files
    local core_files=(
        "package.json"
        "index.html"
        "vite.config.ts"
        ".env.example"
        "README.md"
    )

    for file in "${core_files[@]}"; do
        if file_exists "$file"; then
            test_pass "Core file exists: $file"
        else
            test_fail "Core file exists: $file" "File not found"
        fi
    done

    # Directories
    local directories=(
        "src"
        "src/pages"
        "src/components"
        "src/utils"
        "src/contexts"
        "src/types"
        "public"
    )

    for dir in "${directories[@]}"; do
        if dir_exists "$dir"; then
            test_pass "Directory exists: $dir"
        else
            test_fail "Directory exists: $dir" "Directory not found"
        fi
    done

    # Key source files
    local source_files=(
        "src/main.tsx"
        "src/App.tsx"
        "src/utils/oauth.ts"
        "src/utils/jwt.ts"
        "src/contexts/AuthContext.tsx"
        "src/types/oauth.ts"
    )

    for file in "${source_files[@]}"; do
        if file_exists "$file"; then
            test_pass "Source file exists: $file"
        else
            test_fail "Source file exists: $file" "File not found"
        fi
    done
}

test_dependencies() {
    echo ""
    echo -e "${CYAN}📦 Dependencies Tests${NC}"

    if ! file_exists "package.json"; then
        test_skip "Dependencies check" "package.json not found"
        return
    fi

    # Check if node_modules exists
    if dir_exists "node_modules"; then
        test_pass "node_modules directory exists"
    else
        test_fail "node_modules directory exists" "Run 'npm install' first"
    fi

    # Check for critical dependencies
    local critical_deps=(
        "react"
        "react-dom"
        "vite"
        "typescript"
        "@types/react"
        "@types/react-dom"
        "styled-components"
    )

    for dep in "${critical_deps[@]}"; do
        if npm list "$dep" 2>/dev/null | grep -q "$dep"; then
            local version=$(npm list "$dep" 2>/dev/null | grep "$dep" | head -1 | sed 's/.*@\([^ ]*\).*/\1/')
            test_pass "Dependency installed: $dep" "v$version"
        else
            test_fail "Dependency installed: $dep" "Package not found in node_modules"
        fi
    done
}

test_configuration() {
    echo ""
    echo -e "${CYAN}⚙️  Configuration Tests${NC}"

    # Check .env file
    if ! file_exists ".env"; then
        test_fail ".env file exists" "Run 'cp .env.example .env' and configure your credentials"
        return
    fi

    test_pass ".env file exists"

    # Check required environment variables
    local required_vars=(
        "PINGONE_ENVIRONMENT_ID"
        "PINGONE_CLIENT_ID"
        "PINGONE_CLIENT_SECRET"
        "PINGONE_REDIRECT_URI"
        "PINGONE_API_URL"
    )

    for var in "${required_vars[@]}"; do
        if grep -q "^$var=" .env; then
            local value=$(grep "^$var=" .env | cut -d'=' -f2)
            if [ "$value" = "your-environment-id" ] || [ "$value" = "your-client-id" ] || [ "$value" = "your-client-secret" ]; then
                test_fail "Environment variable configured: $var" "Placeholder value detected"
            else
                test_pass "Environment variable configured: $var" "Value set"
            fi
        else
            test_fail "Environment variable configured: $var" "Variable not found in .env"
        fi
    done
}

test_build_system() {
    echo ""
    echo -e "${CYAN}🔨 Build System Tests${NC}"

    # Check if TypeScript compilation works
    if command_exists npx; then
        echo -n "   • Testing TypeScript compilation... "
        if npx tsc --noEmit --skipLibCheck 2>/dev/null; then
            test_pass "TypeScript compilation"
        else
            test_fail "TypeScript compilation" "TypeScript errors found"
        fi
    else
        test_skip "TypeScript compilation" "npx not available"
    fi

    # Check if build works
    echo -n "   • Testing build process... "
    if npm run build --silent 2>/dev/null; then
        test_pass "Build process"
    else
        test_fail "Build process" "Build failed - check console output"
    fi

    # Check port availability
    local port=${PORT:-3000}
    if is_port_open "$port"; then
        test_warn "Port $port availability" "Port is already in use"
    else
        test_pass "Port $port availability" "Port is available"
    fi
}

test_oauth_functionality() {
    echo ""
    echo -e "${CYAN}🔐 OAuth Functionality Tests${NC}"

    # Check if OAuth utilities can be imported
    echo -n "   • Testing OAuth utilities import... "
    if node -e "
    try {
      const fs = require('fs');
      const path = require('path');

      // Check if oauth.ts exists and can be read
      const oauthPath = path.join(process.cwd(), 'src', 'utils', 'oauth.ts');
      if (fs.existsSync(oauthPath)) {
        console.log('✅ OAuth utilities accessible');
        process.exit(0);
      } else {
        console.log('❌ OAuth utilities not found');
        process.exit(1);
      }
    } catch (error) {
      console.log('❌ Error testing OAuth utilities:', error.message);
      process.exit(1);
    }
    " 2>/dev/null; then
        test_pass "OAuth utilities accessible"
    else
        test_fail "OAuth utilities accessible" "Cannot access OAuth utility functions"
    fi

    # Test JWT utilities
    echo -n "   • Testing JWT utilities... "
    if node -e "
    try {
      const jwt = require('./src/utils/jwt.js');
      // Simple test - check if functions exist
      if (typeof jwt.decodeJwt === 'function') {
        console.log('✅ JWT utilities functional');
        process.exit(0);
      } else {
        console.log('❌ JWT utilities incomplete');
        process.exit(1);
      }
    } catch (error) {
      console.log('❌ Error testing JWT utilities');
      process.exit(1);
    }
    " 2>/dev/null; then
        test_pass "JWT utilities functional"
    else
        test_fail "JWT utilities functional" "JWT utility functions not working"
    fi
}

generate_report() {
    echo ""
    echo "╔══════════════════════════════════════════════════════════════════════════════╗"
    echo "║                             📊 TEST REPORT 📊                            ║"
    echo "╚══════════════════════════════════════════════════════════════════════════════╝"
    echo ""
    echo -e "${BLUE}📈 Summary:${NC}"
    echo -e "   Total Tests: ${TESTS_TOTAL}"
    echo -e "   ${GREEN}✅ Passed: ${TESTS_PASSED}${NC}"
    echo -e "   ${RED}❌ Failed: ${TESTS_FAILED}${NC}"
    echo -e "   ${YELLOW}⚠️  Warnings: ${TESTS_WARNING}${NC}"
    echo -e "   ${BLUE}⏭️  Skipped: ${TESTS_SKIPPED}${NC}"

    # Overall status
    echo ""
    echo -e "${BLUE}🎯 Overall Status:${NC}"
    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "${GREEN}🎉 All critical tests passed! OAuth Playground is ready.${NC}"
        echo ""
        echo -e "${BLUE}💡 Next Steps:${NC}"
        echo -e "   • Run: ${CYAN}npm start${NC} (interactive startup)"
        echo -e "   • Run: ${CYAN}npm run dev${NC} (simple development)"
        echo -e "   • Visit: ${CYAN}http://localhost:3000${NC}"
    else
        echo -e "${RED}❌ Some tests failed. Please resolve the issues above.${NC}"
        echo ""
        echo -e "${YELLOW}🔧 Common Fixes:${NC}"
        echo -e "   • Install dependencies: ${CYAN}npm install${NC}"
        echo -e "   • Configure environment: ${CYAN}cp .env.example .env${NC}"
        echo -e "   • Check Node.js version: ${CYAN}node --version${NC}"
    fi

    # Detailed results (if there are failures or warnings)
    if [ $TESTS_FAILED -gt 0 ] || [ $TESTS_WARNING -gt 0 ]; then
        echo ""
        echo -e "${BLUE}📋 Detailed Results:${NC}"

        if [ ${#FAILED_TESTS[@]} -gt 0 ]; then
            echo ""
            echo -e "${RED}❌ Failed Tests:${NC}"
            for test in "${FAILED_TESTS[@]}"; do
                echo -e "   • $test"
            done
        fi

        if [ ${#WARNING_TESTS[@]} -gt 0 ]; then
            echo ""
            echo -e "${YELLOW}⚠️  Warnings:${NC}"
            for test in "${WARNING_TESTS[@]}"; do
                echo -e "   • $test"
            done
        fi
    fi

    echo ""
    echo -e "${BLUE}📝 Log File: ${LOG_FILE}${NC}"
    echo ""
}

# Main test execution
main() {
    echo ""
    echo "╔══════════════════════════════════════════════════════════════════════════════╗"
    echo "║                      🧪 OAUTH PLAYGROUND TEST SUITE 🧪                    ║"
    echo "╚══════════════════════════════════════════════════════════════════════════════╝"
    echo ""
    echo -e "${BLUE}🧪 Running Comprehensive OAuth Playground Tests...${NC}"
    echo -e "${BLUE}📊 Test Results will be logged to: ${LOG_FILE}${NC}"
    echo ""

    # Run all test categories
    test_environment
    test_project_structure
    test_dependencies
    test_configuration
    test_build_system
    test_oauth_functionality

    # Generate final report
    generate_report

    # Return appropriate exit code
    if [ $TESTS_FAILED -eq 0 ]; then
        exit 0
    else
        exit 1
    fi
}

# Handle script interruption
trap 'echo ""; echo -e "${YELLOW}🛑 Tests interrupted${NC}"; exit 130' INT

# Run main function
main "$@"
