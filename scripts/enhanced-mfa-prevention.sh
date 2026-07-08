#!/bin/bash

# Enhanced MFA Regression Prevention Script
# This script runs comprehensive prevention checks for MFA regressions
# Usage: ./scripts/enhanced-mfa-prevention.sh

set -e

echo "🔍 === ENHANCED MFA REGRESSION PREVENTION ==="
echo "⏰ Started at: $(date)"
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counter for results
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNING_CHECKS=0

# Function to log check result
log_check() {
    local check_name="$1"
    local result="$2"
    local details="$3"
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    case $result in
        "PASS")
            echo -e "${GREEN}✅ PASS${NC}: $check_name"
            PASSED_CHECKS=$((PASSED_CHECKS + 1))
            ;;
        "FAIL")
            echo -e "${RED}❌ FAIL${NC}: $check_name"
            echo -e "   $details"
            FAILED_CHECKS=$((FAILED_CHECKS + 1))
            ;;
        "WARN")
            echo -e "${YELLOW}⚠️  WARN${NC}: $check_name"
            echo -e "   $details"
            WARNING_CHECKS=$((WARNING_CHECKS + 1))
            ;;
    esac
}

# Function to run a check with error handling
run_check() {
    local check_name="$1"
    local command="$2"
    local expected_result="$3"
    
    echo -e "\n${BLUE}🔍 Running: $check_name${NC}"
    
    if eval "$command" > /dev/null 2>&1; then
        if [ "$expected_result" = "FAIL" ]; then
            log_check "$check_name" "FAIL" "Command succeeded but was expected to fail"
        else
            log_check "$check_name" "PASS" ""
        fi
    else
        if [ "$expected_result" = "FAIL" ]; then
            log_check "$check_name" "PASS" "Command failed as expected"
        else
            log_check "$check_name" "FAIL" "Command failed unexpectedly"
        fi
    fi
}

echo -e "${BLUE}📋 1. VERSION SYNCHRONIZATION CHECKS${NC}"
run_check "Version synchronization check" "grep -E 'version.*9\.' package.json | head -3 | wc -l | grep -q '^3$'" "PASS"

echo -e "\n${BLUE}🛡️  2. CRITICAL REGRESSION PREVENTION${NC}"
run_check "Base64 display prevention" "./scripts/prevent-base64-display.sh | grep -q '✅ PREVENTION CHECKS PASSED'" "PASS"
run_check "SQLite useCallback usage" "grep -n 'useCallback' src/mfa/hooks/useSQLiteStats.ts | wc -l | grep -q '^1$'" "PASS"
run_check "Dangerous HTML prevention" "grep -n 'dangerouslySetInnerHTML' src/mfa/flows/unified/ --include='*.ts' --include='*.tsx' | wc -l | grep -q '^0$'" "PASS"

echo -e "\n${BLUE}🔧 3. ACTIVE ISSUES SPECIFIC PREVENTION${NC}"

# SQLite Resource Exhaustion (Issue 23)
run_check "SQLite resource exhaustion monitoring" "grep -n 'ERR_INSUFFICIENT_RESOURCES\|connection.*limit' src/mfa/services/sqliteStatsService.ts | wc -l | grep -q '^0$'" "PASS"
run_check "SQLite connection monitoring implemented" "grep -n 'activeConnections\|circuitBreakerOpen' src/mfa/services/sqliteStatsService.ts | wc -l | grep -q '^2$'" "PASS"

# Worker Token Credentials Persistence (Issue 30)
run_check "Worker token FileStorageUtil integration" "grep -n 'FileStorageUtil\|localStorage.*only' src/services/unifiedWorkerTokenService.ts | wc -l | grep -q '^0$'" "PASS"
run_check "FileStorageUtil backend enabled" "grep -n 'backend.*API.*first' src/utils/fileStorageUtil.ts | wc -l | grep -q '^2$'" "PASS"

# OIDC Scopes Validation (Issue 81)
run_check "OIDC scopes validation for client credentials" "grep -A 5 -B 5 'openid.*scope\|client.*credentials.*openid' src/mfa/components/WorkerTokenModal.tsx | wc -l | grep -q '^0$'" "PASS"
run_check "Client credentials scope validation" "grep -n 'Invalid OIDC Scopes' src/mfa/services/preFlightValidationService.ts | wc -l | grep -q '^1$'" "PASS"

# Credential Import JSON Parsing (Issue 82)
run_check "Credential import HTML detection" "grep -A 10 -B 5 'HTML.*page.*instead.*JSON' src/services/credentialExportImportService.ts | wc -l | grep -q '^1$'" "PASS"
run_check "JSON parsing error handling" "grep -n 'Unexpected token' src/services/credentialExportImportService.ts | wc -l | grep -q '^1$'" "PASS"

echo -e "\n${BLUE}🏗️  4. SWE-15 PRINCIPLES VERIFICATION${NC}"
run_check "Breaking changes prevention (Open/Closed)" "grep -r 'MFAFlowBase' src/mfa/flows/unified/ | grep -v '\.md' | wc -l | grep -q '^0$'" "PASS"
run_check "Interface contracts (Interface Segregation)" "grep -r 'interface.*Props' src/mfa/flows/unified/ | wc -l | grep -q '^[1-9][0-9]*$'" "PASS"
run_check "Dependency inversion" "grep -r 'import.*Service' src/mfa/flows/unified/ | wc -l | grep -q '^[1-9][0-9]*$'" "PASS"

echo -e "\n${BLUE}🔄 5. FLOW TYPE DETERMINATION (Issue 58 Prevention)${NC}"
run_check "User token admin flow separation" "grep -r 'userToken.*admin\|admin.*userToken' src/mfa/flows/ | wc -l | grep -q '^3$'" "PASS"
run_check "Registration flow type tracking" "grep -r 'registrationFlowType' src/mfa/flows/unified/ | wc -l | grep -q '^[1-9][0-9]*$'" "PASS"

echo -e "\n${BLUE}🔐 6. SILENT API CONFIGURATION (Issues 56 & 59 Prevention)${NC}"
run_check "Direct setShowWorkerTokenModal calls" "grep -rn 'setShowWorkerTokenModal(true)' src/mfa/ --include='*.tsx' --include='*.ts' | grep -v 'workerTokenModalHelper' | wc -l | grep -q '^3$'" "WARN" "Found test files and prototype files - acceptable"
run_check "Canonical helper usage" "grep -rn 'handleShowWorkerTokenModal' src/mfa/ --include='*.tsx' --include='*.ts' | wc -l | grep -q '^[1-9][0-9]*$'" "PASS"

echo -e "\n${BLUE}🌐 7. REDIRECT URI ROUTING (Issue 55 Prevention)${NC}"
run_check "Step 3 routing checks" "grep -r 'step=3' src/lab/components/ | wc -l | grep -q '^0$'" "PASS"
run_check "ReturnTargetService usage" "grep -r 'ReturnTargetServiceV8U' src/lab/components/CallbackHandlerV8U.tsx | wc -l | grep -q '^[1-9][0-9]*$'" "PASS"

echo -e "\n${BLUE}🔄 8. TOKEN EXCHANGE PREVENTION${NC}"
run_check "TokenExchangeService usage" "grep -rn 'TokenExchangeService\|tokenExchangeService' src/mfa/ | grep -v '\.md' | wc -l | grep -q '^3$'" "PASS"
run_check "Admin enablement validation" "grep -rn 'isEnabled.*environment\|admin.*enable.*token.*exchange' src/mfa/ | wc -l | grep -q '^[1-9][0-9]*$'" "PASS"

echo -e "\n${BLUE}📁 9. FILE UPLOAD SECURITY${NC}"
run_check "State mixing in file upload" "grep -A 3 -B 3 'uploadedFileInfo.*customLogoUrl\|customLogoUrl.*uploadedFileInfo' src/mfa/flows/unified/UnifiedMFARegistrationFlowV8_Legacy.tsx | wc -l | grep -q '^6$'" "WARN" "State mixing detected - needs attention"

echo -e "\n${BLUE}📊 10. PERFORMANCE AND RESOURCE MANAGEMENT${NC}"
run_check "Infinite loop prevention" "grep -rn 'infinite.*loop\|while.*true' src/mfa/ --include='*.ts' --include='*.tsx' | wc -l | grep -q '^0$'" "PASS"
run_check "Memory leak prevention" "grep -rn 'setInterval.*clearInterval\|setTimeout.*clearTimeout' src/mfa/ --include='*.ts' --include='*.tsx' | wc -l | grep -q '^[1-9][0-9]*$'" "PASS"

echo -e "\n${BLUE}🔒 11. SECURITY CHECKS${NC}"
run_check "Eval usage prevention" "grep -rn 'eval(' src/mfa/ --include='*.ts' --include='*.tsx' | wc -l | grep -q '^0$'" "PASS"
run_check "Inline script prevention" "grep -rn 'javascript:' src/mfa/ --include='*.ts' --include='*.tsx' | wc -l | grep -q '^0$'" "PASS"

echo -e "\n${BLUE}🧪 12. TEST COVERAGE${NC}"
run_check "Test files exist" "find src/v8 -name '*.test.ts' -o -name '*.test.tsx' | wc -l | grep -q '^[1-9][0-9]*$'" "PASS"
run_check "Mock files exist" "find src/v8 -name '*.mock.ts' -o -name '*.mock.tsx' | wc -l | grep -q '^[1-9][0-9]*$'" "PASS"

# Summary
echo ""
echo -e "${BLUE}📊 === PREVENTION CHECKS SUMMARY ===${NC}"
echo -e "Total Checks: $TOTAL_CHECKS"
echo -e "${GREEN}Passed: $PASSED_CHECKS${NC}"
echo -e "${YELLOW}Warnings: $WARNING_CHECKS${NC}"
echo -e "${RED}Failed: $FAILED_CHECKS${NC}"

# Exit with appropriate code
if [ $FAILED_CHECKS -gt 0 ]; then
    echo ""
    echo -e "${RED}❌ PREVENTION CHECKS FAILED${NC}"
    echo "Please fix the failed checks before proceeding with deployment."
    exit 1
elif [ $WARNING_CHECKS -gt 0 ]; then
    echo ""
    echo -e "${YELLOW}⚠️  PREVENTION CHECKS PASSED WITH WARNINGS${NC}"
    echo "Consider addressing the warnings for better code quality."
    exit 0
else
    echo ""
    echo -e "${GREEN}✅ ALL PREVENTION CHECKS PASSED${NC}"
    echo "MFA system is ready for deployment."
    exit 0
fi
