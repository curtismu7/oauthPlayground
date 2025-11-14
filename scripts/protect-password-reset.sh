#!/bin/bash
# scripts/protect-password-reset.sh
# Protection script for Password Reset Service

set -e

echo "🔒 Password Reset Service Protection Check"
echo "=========================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if service file exists
if [ ! -f "src/services/passwordResetService.ts" ]; then
    echo -e "${RED}❌ Password Reset Service file not found!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Service file exists${NC}"

# Check if version file exists
if [ ! -f "src/services/passwordResetService.version.ts" ]; then
    echo -e "${RED}❌ Version file not found!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Version file exists${NC}"

# Check version format
VERSION=$(grep "PASSWORD_RESET_SERVICE_VERSION = " src/services/passwordResetService.version.ts | cut -d "'" -f 2)
if ! [[ $VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo -e "${RED}❌ Invalid version format: $VERSION${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Version format valid: $VERSION${NC}"

# Check if test files exist
TEST_FILES=(
    "src/services/__tests__/passwordResetService.test.ts"
    "src/services/__tests__/passwordResetService.integration.test.ts"
    "src/services/__tests__/passwordResetService.contract.test.ts"
)

for file in "${TEST_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}❌ Test file missing: $file${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✅ All test files exist${NC}"

# Check TypeScript compilation
echo "🔍 Checking TypeScript compilation..."
if ! npx tsc --noEmit src/services/passwordResetService.ts 2>&1 | grep -q "error TS"; then
    echo -e "${GREEN}✅ TypeScript compilation successful${NC}"
else
    echo -e "${RED}❌ TypeScript compilation failed${NC}"
    npx tsc --noEmit src/services/passwordResetService.ts
    exit 1
fi

# Run unit tests
echo "🧪 Running unit tests..."
if npm run test -- src/services/__tests__/passwordResetService.test.ts --run > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Unit tests passed${NC}"
else
    echo -e "${RED}❌ Unit tests failed${NC}"
    npm run test -- src/services/__tests__/passwordResetService.test.ts --run
    exit 1
fi

# Run contract tests
echo "📋 Running contract tests..."
if npm run test -- src/services/__tests__/passwordResetService.contract.test.ts --run > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Contract tests passed${NC}"
else
    echo -e "${RED}❌ Contract tests failed${NC}"
    npm run test -- src/services/__tests__/passwordResetService.contract.test.ts --run
    exit 1
fi

# Check test coverage
echo "📊 Checking test coverage..."
COVERAGE_OUTPUT=$(npm run test:coverage -- src/services/passwordResetService.ts 2>&1 || true)
COVERAGE_PERCENT=$(echo "$COVERAGE_OUTPUT" | grep -oP 'All files.*?\|\s+\K[0-9.]+' | head -1 || echo "0")

if (( $(echo "$COVERAGE_PERCENT >= 80" | bc -l) )); then
    echo -e "${GREEN}✅ Test coverage: ${COVERAGE_PERCENT}%${NC}"
else
    echo -e "${YELLOW}⚠️  Test coverage: ${COVERAGE_PERCENT}% (target: 80%)${NC}"
fi

# Check for required exports
echo "🔍 Checking required exports..."
REQUIRED_EXPORTS=(
    "sendRecoveryCode"
    "recoverPassword"
    "checkPassword"
    "forcePasswordChange"
    "unlockPassword"
    "readPasswordState"
    "setPasswordAdmin"
    "setPassword"
    "setPasswordValue"
    "setPasswordLdapGateway"
)

for export in "${REQUIRED_EXPORTS[@]}"; do
    if ! grep -q "export async function $export" src/services/passwordResetService.ts; then
        echo -e "${RED}❌ Missing export: $export${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✅ All required exports present${NC}"

# Check for required interfaces
echo "🔍 Checking required interfaces..."
REQUIRED_INTERFACES=(
    "PasswordOperationResponse"
    "SendRecoveryCodeRequest"
    "SendRecoveryCodeResponse"
)

for interface in "${REQUIRED_INTERFACES[@]}"; do
    if ! grep -q "export interface $interface" src/services/passwordResetService.ts; then
        echo -e "${RED}❌ Missing interface: $interface${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✅ All required interfaces present${NC}"

# Check backend endpoints
echo "🔍 Checking backend endpoints..."
BACKEND_ENDPOINTS=(
    "/api/pingone/password/send-recovery-code"
    "/api/pingone/password/recover"
    "/api/pingone/password/check"
    "/api/pingone/password/force-change"
    "/api/pingone/password/unlock"
)

for endpoint in "${BACKEND_ENDPOINTS[@]}"; do
    if ! grep -q "app.post('$endpoint'" server.js && ! grep -q "app.get('$endpoint'" server.js && ! grep -q "app.put('$endpoint'" server.js; then
        echo -e "${RED}❌ Missing backend endpoint: $endpoint${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✅ All backend endpoints present${NC}"

# Summary
echo ""
echo "=========================================="
echo -e "${GREEN}✅ All protection checks passed!${NC}"
echo "=========================================="
echo ""
echo "Service Version: $VERSION"
echo "Test Coverage: ${COVERAGE_PERCENT}%"
echo ""
echo "The Password Reset Service is protected and ready for use."
