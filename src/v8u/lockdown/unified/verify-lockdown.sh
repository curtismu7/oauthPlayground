#!/bin/bash

# Unified OAuth Flow Lockdown Verification Script
# This script verifies that the Unified OAuth flow remains locked and unchanged

echo "🔒 Unified OAuth Flow Lockdown Verification"
echo "=========================================="

# Check if lockdown directory exists
if [ ! -d "src/v8u/lockdown/unified" ]; then
    echo "❌ ERROR: Lockdown directory not found"
    exit 1
fi

# Check if manifest exists
if [ ! -f "src/v8u/lockdown/unified/manifest.json" ]; then
    echo "❌ ERROR: Lockdown manifest not found"
    exit 1
fi

# Check if snapshot exists
if [ ! -d "src/v8u/lockdown/unified/snapshot" ]; then
    echo "❌ ERROR: Lockdown snapshot not found"
    exit 1
fi

echo "✅ Lockdown structure verified"

# Check key files exist in snapshot
KEY_FILES=(
    "src/v8u/flows/UnifiedOAuthFlowV8U.tsx"
    "src/v8u/components/UnifiedFlowSteps"
    "src/v8u/components/UnifiedFlowDocumentationPageV8U.tsx"
    "src/v8u/components/UnifiedFlowErrorBoundary.tsx"
    "src/v8u/components/UnifiedFlowHelperPageV8U.tsx"
    "src/v8u/components/UnifiedFlowSuccessStepV8U.tsx"
    "src/v8u/services/UnifiedFlowStateManager.ts"
)

echo "🔍 Checking key files in snapshot..."
for file in "${KEY_FILES[@]}"; do
    if [ -f "src/v8u/lockdown/unified/snapshot/${file#src/v8u/}" ] || [ -d "src/v8u/lockdown/unified/snapshot/${file#src/v8u/}" ]; then
        echo "✅ $file"
    else
        echo "❌ Missing: $file"
    fi
done

# Compare current files with snapshot (basic checksum check)
echo ""
echo "🔍 Comparing current files with snapshot..."

# Check main flow file
if [ -f "src/v8u/flows/UnifiedOAuthFlowV8U.tsx" ] && [ -f "src/v8u/lockdown/unified/snapshot/flows/UnifiedOAuthFlowV8U.tsx" ]; then
    CURRENT_CHECKSUM=$(md5sum "src/v8u/flows/UnifiedOAuthFlowV8U.tsx" | cut -d' ' -f1)
    SNAPSHOT_CHECKSUM=$(md5sum "src/v8u/lockdown/unified/snapshot/flows/UnifiedOAuthFlowV8U.tsx" | cut -d' ' -f1)
    
    if [ "$CURRENT_CHECKSUM" = "$SNAPSHOT_CHECKSUM" ]; then
        echo "✅ UnifiedOAuthFlowV8U.tsx - UNCHANGED"
    else
        echo "⚠️  UnifiedOAuthFlowV8U.tsx - MODIFIED"
        echo "   Current:  $CURRENT_CHECKSUM"
        echo "   Snapshot: $SNAPSHOT_CHECKSUM"
    fi
fi

# Display manifest info
echo ""
echo "📋 Lockdown Manifest:"
cat src/v8u/lockdown/unified/manifest.json | jq -r '["Name: " + .name, "Version: " + .version, "Status: " + .status, "Locked: " + .lockedAt, "Path: " + .path][]'

echo ""
echo "🔒 Unified OAuth Flow Lockdown Verification Complete"
echo "================================================="
