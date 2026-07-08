#!/bin/bash
# check-token-gateway-usage.sh
# Ensures silent/automatic token acquisition logic goes through tokenGateway
#
# Run this in CI to prevent regressions
# Usage: ./scripts/check-token-gateway-usage.sh
#
# NOTE: This script checks for SILENT/AUTOMATIC token acquisition patterns.
# Interactive modals (WorkerTokenModal) and documentation are excluded.

set -e

echo "🔍 Checking for silent token acquisition patterns..."
echo "   (Interactive modals and documentation are excluded)"
echo ""

VIOLATIONS=0

# Check workerTokenModalHelper.ts - should delegate to tokenGateway
echo "  Checking workerTokenModalHelper.ts delegates to tokenGateway..."
if ! grep -q "tokenGateway" src/mfa/utils/workerTokenModalHelper.ts 2>/dev/null; then
    echo "❌ workerTokenModalHelper.ts should import and use tokenGateway"
    VIOLATIONS=$((VIOLATIONS + 1))
fi

# Check that workerTokenModalHelper.ts doesn't have direct fetch
DIRECT_FETCH=$(grep -n "fetch.*proxyEndpoint\|fetch.*\/api\/pingone" src/mfa/utils/workerTokenModalHelper.ts 2>/dev/null || true)
if [ -n "$DIRECT_FETCH" ]; then
    echo "❌ workerTokenModalHelper.ts has direct fetch instead of using tokenGateway:"
    echo "$DIRECT_FETCH"
    VIOLATIONS=$((VIOLATIONS + 1))
fi

# Check mfaTokenManager.ts - should delegate to tokenGateway
echo "  Checking mfaTokenManager.ts delegates to tokenGateway..."
if ! grep -q "tokenGateway" src/mfa/services/mfaTokenManager.ts 2>/dev/null; then
    echo "❌ mfaTokenManager.ts should import and use tokenGateway"
    VIOLATIONS=$((VIOLATIONS + 1))
fi

# Check that tokenGateway.ts exists and has key methods
echo "  Checking tokenGateway.ts exists and has required methods..."
if [ ! -f "src/mfa/services/auth/tokenGateway.ts" ]; then
    echo "❌ tokenGateway.ts does not exist!"
    VIOLATIONS=$((VIOLATIONS + 1))
else
    # Check for required methods
    if ! grep -q "getWorkerToken" src/mfa/services/auth/tokenGateway.ts; then
        echo "❌ tokenGateway.ts missing getWorkerToken method"
        VIOLATIONS=$((VIOLATIONS + 1))
    fi
    if ! grep -q "getWorkerTokenStatus" src/mfa/services/auth/tokenGateway.ts; then
        echo "❌ tokenGateway.ts missing getWorkerTokenStatus method"
        VIOLATIONS=$((VIOLATIONS + 1))
    fi
    if ! grep -q "subscribe" src/mfa/services/auth/tokenGateway.ts; then
        echo "❌ tokenGateway.ts missing subscribe method"
        VIOLATIONS=$((VIOLATIONS + 1))
    fi
fi

# Check that test file exists
echo "  Checking tokenGateway.test.ts exists..."
if [ ! -f "src/mfa/services/auth/__tests__/tokenGateway.test.ts" ]; then
    echo "⚠️  tokenGateway.test.ts does not exist (warning only)"
fi

if [ $VIOLATIONS -gt 0 ]; then
    echo ""
    echo "❌ FAILED: Found $VIOLATIONS violation(s)"
    echo ""
    echo "All SILENT token acquisition logic MUST go through tokenGateway."
    echo "Please update your code to use:"
    echo "  import { tokenGateway } from '@/v8/services/auth/tokenGateway';"
    echo "  const result = await tokenGateway.getWorkerToken({ mode: 'silent' });"
    exit 1
fi

echo ""
echo "✅ PASSED: Token gateway architecture is properly enforced"
exit 0
