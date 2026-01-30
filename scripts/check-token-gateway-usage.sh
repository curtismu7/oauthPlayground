#!/bin/bash
# check-token-gateway-usage.sh
# Ensures silent/automatic token acquisition logic goes through tokenGatewayV8
#
# Run this in CI to prevent regressions
# Usage: ./scripts/check-token-gateway-usage.sh
#
# NOTE: This script checks for SILENT/AUTOMATIC token acquisition patterns.
# Interactive modals (WorkerTokenModalV8) and documentation are excluded.

set -e

echo "🔍 Checking for silent token acquisition patterns..."
echo "   (Interactive modals and documentation are excluded)"
echo ""

VIOLATIONS=0

# Check workerTokenModalHelperV8.ts - should delegate to tokenGatewayV8
echo "  Checking workerTokenModalHelperV8.ts delegates to tokenGatewayV8..."
if ! grep -q "tokenGatewayV8" src/v8/utils/workerTokenModalHelperV8.ts 2>/dev/null; then
    echo "❌ workerTokenModalHelperV8.ts should import and use tokenGatewayV8"
    VIOLATIONS=$((VIOLATIONS + 1))
fi

# Check that workerTokenModalHelperV8.ts doesn't have direct fetch
DIRECT_FETCH=$(grep -n "fetch.*proxyEndpoint\|fetch.*\/api\/pingone" src/v8/utils/workerTokenModalHelperV8.ts 2>/dev/null || true)
if [ -n "$DIRECT_FETCH" ]; then
    echo "❌ workerTokenModalHelperV8.ts has direct fetch instead of using tokenGatewayV8:"
    echo "$DIRECT_FETCH"
    VIOLATIONS=$((VIOLATIONS + 1))
fi

# Check mfaTokenManagerV8.ts - should delegate to tokenGatewayV8
echo "  Checking mfaTokenManagerV8.ts delegates to tokenGatewayV8..."
if ! grep -q "tokenGatewayV8" src/v8/services/mfaTokenManagerV8.ts 2>/dev/null; then
    echo "❌ mfaTokenManagerV8.ts should import and use tokenGatewayV8"
    VIOLATIONS=$((VIOLATIONS + 1))
fi

# Check that tokenGatewayV8.ts exists and has key methods
echo "  Checking tokenGatewayV8.ts exists and has required methods..."
if [ ! -f "src/v8/services/auth/tokenGatewayV8.ts" ]; then
    echo "❌ tokenGatewayV8.ts does not exist!"
    VIOLATIONS=$((VIOLATIONS + 1))
else
    # Check for required methods
    if ! grep -q "getWorkerToken" src/v8/services/auth/tokenGatewayV8.ts; then
        echo "❌ tokenGatewayV8.ts missing getWorkerToken method"
        VIOLATIONS=$((VIOLATIONS + 1))
    fi
    if ! grep -q "getWorkerTokenStatus" src/v8/services/auth/tokenGatewayV8.ts; then
        echo "❌ tokenGatewayV8.ts missing getWorkerTokenStatus method"
        VIOLATIONS=$((VIOLATIONS + 1))
    fi
    if ! grep -q "subscribe" src/v8/services/auth/tokenGatewayV8.ts; then
        echo "❌ tokenGatewayV8.ts missing subscribe method"
        VIOLATIONS=$((VIOLATIONS + 1))
    fi
fi

# Check that test file exists
echo "  Checking tokenGatewayV8.test.ts exists..."
if [ ! -f "src/v8/services/auth/__tests__/tokenGatewayV8.test.ts" ]; then
    echo "⚠️  tokenGatewayV8.test.ts does not exist (warning only)"
fi

if [ $VIOLATIONS -gt 0 ]; then
    echo ""
    echo "❌ FAILED: Found $VIOLATIONS violation(s)"
    echo ""
    echo "All SILENT token acquisition logic MUST go through tokenGatewayV8."
    echo "Please update your code to use:"
    echo "  import { tokenGatewayV8 } from '@/v8/services/auth/tokenGatewayV8';"
    echo "  const result = await tokenGatewayV8.getWorkerToken({ mode: 'silent' });"
    exit 1
fi

echo ""
echo "✅ PASSED: Token gateway architecture is properly enforced"
exit 0
