#!/bin/bash
# Script to migrate files to use getAnyWorkerToken()

echo "🔄 Worker Token Detection Migration Script"
echo "=========================================="
echo ""

# List of files to migrate (Priority 1 & 2)
FILES=(
    "src/pages/PingOneAuditActivities.tsx"
    "src/pages/flows/CIBAFlowV7.tsx"
    "src/pages/flows/ClientCredentialsFlowV7_Complete.tsx"
    "src/pages/flows/DeviceAuthorizationFlowV7.tsx"
    "src/pages/flows/ImplicitFlowV7.tsx"
    "src/pages/flows/PingOnePARFlowV7.tsx"
    "src/pages/flows/RARFlowV7.tsx"
    "src/pages/flows/WorkerTokenFlowV7.tsx"
)

echo "📋 Files to migrate: ${#FILES[@]}"
echo ""

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✓ Found: $file"
        # Check if it needs migration
        if grep -q "localStorage.getItem.*worker" "$file"; then
            echo "  → Needs migration"
        else
            echo "  → Already migrated or no worker token checks"
        fi
    else
        echo "✗ Not found: $file"
    fi
done

echo ""
echo "📝 Manual migration required for each file:"
echo "1. Add import: import { getAnyWorkerToken } from '../utils/workerTokenDetection';"
echo "2. Replace: localStorage.getItem('worker_token') → getAnyWorkerToken()"
echo "3. Replace: localStorage.getItem('worker_token_*') → getAnyWorkerToken()"
echo "4. Test the page to ensure worker token is detected"
echo ""
echo "✅ Migration plan created in WORKER_TOKEN_MIGRATION_PLAN.md"
