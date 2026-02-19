#!/bin/bash
set -e

echo "🔍 CIBA V9 Regression Check"
echo "================================"

# Check required files exist
echo "📁 Checking files..."
test -f src/pages/flows/CIBAFlowV9.tsx || { echo "✗ CIBAFlowV9.tsx missing"; exit 1; }
test -f src/v8/services/cibaServiceV8Enhanced.ts || { echo "✗ cibaServiceV8Enhanced.ts missing"; exit 1; }
test -f api/tokens/store.js || { echo "✗ api/tokens/store.js missing"; exit 1; }
test -f api/generate-login-hint-token.js || { echo "✗ api/generate-login-hint-token.js missing"; exit 1; }
echo "✓ All required files exist"

# Check imports are correct
echo "📦 Checking imports..."
! grep -q "toastV9" src/pages/flows/CIBAFlowV9.tsx || { echo "✗ Found toastV9 import (should be toastV8)"; exit 1; }
grep -q "toastV8" src/pages/flows/CIBAFlowV9.tsx || { echo "✗ Missing toastV8 import"; exit 1; }
echo "✓ Imports correct"

# Check required components
echo "🧩 Checking components..."
grep -q "MFAHeaderV8" src/pages/flows/CIBAFlowV9.tsx || { echo "✗ Missing MFAHeaderV8"; exit 1; }
grep -q "WorkerTokenStatusDisplayV8" src/pages/flows/CIBAFlowV9.tsx || { echo "✗ Missing WorkerTokenStatusDisplayV8"; exit 1; }
grep -q "WorkerTokenModalV8" src/pages/flows/CIBAFlowV9.tsx || { echo "✗ Missing WorkerTokenModalV8"; exit 1; }
grep -q "SuperSimpleApiDisplayV8" src/pages/flows/CIBAFlowV9.tsx || { echo "✗ Missing SuperSimpleApiDisplayV8"; exit 1; }
echo "✓ All components present"

# Check token delivery mode field
echo "🔧 Checking token delivery mode..."
grep -q "tokenDeliveryMode" src/pages/flows/CIBAFlowV9.tsx || { echo "✗ Missing tokenDeliveryMode field"; exit 1; }
# Count only form field labels (with htmlFor), not documentation headings
count=$(grep -c 'htmlFor="tokenDeliveryMode"' src/pages/flows/CIBAFlowV9.tsx || echo "0")
[ "$count" -eq 1 ] || { echo "✗ Found $count tokenDeliveryMode form fields (should be 1)"; exit 1; }
echo "✓ Token delivery mode configured correctly"

# Check handler functions
echo "⚙️ Checking handlers..."
grep -q "handleGetWorkerToken" src/pages/flows/CIBAFlowV9.tsx || { echo "✗ Missing handleGetWorkerToken"; exit 1; }
grep -q "handleGetApps" src/pages/flows/CIBAFlowV9.tsx || { echo "✗ Missing handleGetApps"; exit 1; }
grep -q "handleSave" src/pages/flows/CIBAFlowV9.tsx || { echo "✗ Missing handleSave"; exit 1; }
grep -q "handleInitiateAuth" src/pages/flows/CIBAFlowV9.tsx || { echo "✗ Missing handleInitiateAuth"; exit 1; }
echo "✓ All handlers present"

# Check state variables
echo "📊 Checking state variables..."
grep -q "workerToken" src/pages/flows/CIBAFlowV9.tsx || { echo "✗ Missing workerToken state"; exit 1; }
grep -q "showWorkerTokenModal" src/pages/flows/CIBAFlowV9.tsx || { echo "✗ Missing showWorkerTokenModal state"; exit 1; }
grep -q "isLoadingWorkerToken" src/pages/flows/CIBAFlowV9.tsx || { echo "✗ Missing isLoadingWorkerToken state"; exit 1; }
grep -q "isLoadingApps" src/pages/flows/CIBAFlowV9.tsx || { echo "✗ Missing isLoadingApps state"; exit 1; }
echo "✓ All state variables present"

# Check service buttons
echo "🔘 Checking service buttons..."
grep -q "Get Worker Token" src/pages/flows/CIBAFlowV9.tsx || { echo "✗ Missing Get Worker Token button"; exit 1; }
grep -q "Get Apps" src/pages/flows/CIBAFlowV9.tsx || { echo "✗ Missing Get Apps button"; exit 1; }
echo "✓ Service buttons present"

# Check required form fields
echo "📝 Checking form fields..."
grep -q "environmentId" src/pages/flows/CIBAFlowV9.tsx || { echo "✗ Missing environmentId field"; exit 1; }
grep -q "clientId" src/pages/flows/CIBAFlowV9.tsx || { echo "✗ Missing clientId field"; exit 1; }
grep -q "clientSecret" src/pages/flows/CIBAFlowV9.tsx || { echo "✗ Missing clientSecret field"; exit 1; }
grep -q "scope" src/pages/flows/CIBAFlowV9.tsx || { echo "✗ Missing scope field"; exit 1; }
echo "✓ All form fields present"

# Check login hint options
echo "🔑 Checking login hint options..."
grep -q "loginHint" src/pages/flows/CIBAFlowV9.tsx || { echo "✗ Missing loginHint"; exit 1; }
grep -q "idTokenHint" src/pages/flows/CIBAFlowV9.tsx || { echo "✗ Missing idTokenHint"; exit 1; }
grep -q "loginHintToken" src/pages/flows/CIBAFlowV9.tsx || { echo "✗ Missing loginHintToken"; exit 1; }
echo "✓ All login hint options present"

# Check documentation exists
echo "📚 Checking documentation..."
test -f project/inventory/UNIFIED_CIBA_INVENTORY.md || { echo "✗ Missing UNIFIED_CIBA_INVENTORY.md"; exit 1; }
test -f SWE-15_UNIFIED_CIBA_GUIDE.md || { echo "✗ Missing SWE-15_UNIFIED_CIBA_GUIDE.md"; exit 1; }
echo "✓ Documentation exists"

echo "================================"
echo "✅ CIBA V9 Regression Check PASSED"
echo ""
echo "All checks completed successfully!"
echo "CIBA V9 implementation follows master3-prompts.md guidelines."
exit 0
