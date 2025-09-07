#!/bin/bash

# Phase 3 Comprehensive Testing Suite
# Tests all Phase 3 features including performance, accessibility, UX, and flow comparison

set -e

echo "🧪 Phase 3 Comprehensive Testing Suite"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to run a test and track results
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    echo -e "\n${BLUE}Running: $test_name${NC}"
    echo "Command: $test_command"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if eval "$test_command"; then
        echo -e "${GREEN}✅ PASSED: $test_name${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}❌ FAILED: $test_name${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

echo -e "\n${YELLOW}🔍 Checking Prerequisites${NC}"

# Check if Node.js is installed
if ! command_exists node; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi

# Check if npm is installed
if ! command_exists npm; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${YELLOW}⚠️  Node.js version 18+ recommended (current: $(node --version))${NC}"
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"

echo -e "\n${YELLOW}📦 Installing Dependencies${NC}"
npm install

echo -e "\n${YELLOW}🔧 Building Application${NC}"
run_test "Application Build" "npm run build"

echo -e "\n${YELLOW}🧪 Running Unit Tests${NC}"
run_test "Phase 3 Features Tests" "npm run test src/tests/Phase3Features.test.tsx"
run_test "Accessibility Tests" "npm run test src/tests/accessibility.test.ts"
run_test "Service Worker Tests" "npm run test src/tests/serviceWorker.test.ts"
run_test "Flow Analysis Tests" "npm run test src/tests/flowAnalysis.test.ts"

echo -e "\n${YELLOW}🔍 Running Linting${NC}"
run_test "ESLint Check" "npm run lint"
run_test "TypeScript Check" "npx tsc --noEmit"

echo -e "\n${YELLOW}📊 Performance Testing${NC}"

# Test bundle size
echo -e "\n${BLUE}Checking Bundle Size${NC}"
BUNDLE_SIZE=$(du -sh dist/ | cut -f1)
echo "Bundle size: $BUNDLE_SIZE"

# Check if bundle size is reasonable (less than 2MB)
BUNDLE_SIZE_BYTES=$(du -sb dist/ | cut -f1)
if [ "$BUNDLE_SIZE_BYTES" -lt 2097152 ]; then
    echo -e "${GREEN}✅ Bundle size is reasonable (< 2MB)${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${YELLOW}⚠️  Bundle size is large (> 2MB)${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# Test service worker generation
echo -e "\n${BLUE}Checking Service Worker${NC}"
if [ -f "dist/sw.js" ]; then
    echo -e "${GREEN}✅ Service worker generated${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}❌ Service worker not generated${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# Test PWA manifest
echo -e "\n${BLUE}Checking PWA Manifest${NC}"
if [ -f "dist/manifest.webmanifest" ]; then
    echo -e "${GREEN}✅ PWA manifest generated${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}❌ PWA manifest not generated${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo -e "\n${YELLOW}♿ Accessibility Testing${NC}"

# Test for accessibility attributes in built files
echo -e "\n${BLUE}Checking Accessibility Features${NC}"
if grep -q "aria-label" dist/index.html; then
    echo -e "${GREEN}✅ ARIA labels found in HTML${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${YELLOW}⚠️  No ARIA labels found in HTML${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo -e "\n${YELLOW}📱 Mobile Responsiveness Testing${NC}"

# Test for responsive CSS
echo -e "\n${BLUE}Checking Responsive Design${NC}"
if grep -q "@media" dist/assets/*.css 2>/dev/null; then
    echo -e "${GREEN}✅ Responsive CSS found${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${YELLOW}⚠️  No responsive CSS found${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo -e "\n${YELLOW}🔒 Security Testing${NC}"

# Test for security headers in service worker
echo -e "\n${BLUE}Checking Security Features${NC}"
if grep -q "Content-Security-Policy" dist/sw.js; then
    echo -e "${GREEN}✅ Security headers found in service worker${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${YELLOW}⚠️  No security headers found in service worker${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo -e "\n${YELLOW}📈 Code Quality Testing${NC}"

# Test for console.log statements (should be removed in production)
echo -e "\n${BLUE}Checking for Debug Code${NC}"
if grep -r "console\.log" dist/ 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Console.log statements found in production build${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
else
    echo -e "${GREEN}✅ No console.log statements in production build${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# Test for TODO comments
echo -e "\n${BLUE}Checking for TODO Comments${NC}"
TODO_COUNT=$(grep -r "TODO:" src/ | wc -l)
if [ "$TODO_COUNT" -eq 0 ]; then
    echo -e "${GREEN}✅ No TODO comments found${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${YELLOW}⚠️  $TODO_COUNT TODO comments found${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo -e "\n${YELLOW}🚀 Integration Testing${NC}"

# Test development server startup
echo -e "\n${BLUE}Testing Development Server${NC}"
timeout 10s npm run dev > /dev/null 2>&1 &
DEV_PID=$!
sleep 5
if kill -0 $DEV_PID 2>/dev/null; then
    echo -e "${GREEN}✅ Development server started successfully${NC}"
    kill $DEV_PID 2>/dev/null
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}❌ Development server failed to start${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo -e "\n${YELLOW}📋 Test Summary${NC}"
echo "======================================"
echo -e "Total Tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "${RED}Failed: $FAILED_TESTS${NC}"

# Calculate success rate
SUCCESS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))
echo -e "Success Rate: $SUCCESS_RATE%"

if [ "$FAILED_TESTS" -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All tests passed! Phase 3 features are working correctly.${NC}"
    exit 0
elif [ "$SUCCESS_RATE" -ge 80 ]; then
    echo -e "\n${YELLOW}⚠️  Most tests passed ($SUCCESS_RATE%). Some issues need attention.${NC}"
    exit 1
else
    echo -e "\n${RED}❌ Many tests failed ($SUCCESS_RATE%). Phase 3 features need significant work.${NC}"
    exit 2
fi
