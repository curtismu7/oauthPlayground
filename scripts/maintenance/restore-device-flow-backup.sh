#!/bin/bash
# Restore Device Authorization Flow from Backup
# Created: $(date)

BACKUP_DIR="backup-20251027-085857-before-rfc8628-improvements"

echo "🔄 Restoring Device Authorization Flow from backup..."
echo "📁 Backup Directory: $BACKUP_DIR"
echo ""

if [ ! -d "$BACKUP_DIR" ]; then
    echo "❌ Error: Backup directory not found!"
    echo "   Expected: $BACKUP_DIR"
    exit 1
fi

echo "⚠️  WARNING: This will overwrite current files with backup versions!"
echo "   Press Ctrl+C to cancel, or wait 5 seconds to continue..."
sleep 5

echo ""
echo "📦 Restoring files..."

# Restore main flow files
if [ -f "$BACKUP_DIR/src/pages/flows/DeviceAuthorizationFlowV7.tsx" ]; then
    cp "$BACKUP_DIR/src/pages/flows/DeviceAuthorizationFlowV7.tsx" src/pages/flows/
    echo "✅ Restored: DeviceAuthorizationFlowV7.tsx"
fi

# Restore hook
if [ -f "$BACKUP_DIR/src/hooks/useDeviceAuthorizationFlow.ts" ]; then
    cp "$BACKUP_DIR/src/hooks/useDeviceAuthorizationFlow.ts" src/hooks/
    echo "✅ Restored: useDeviceAuthorizationFlow.ts"
fi

# Restore service
if [ -f "$BACKUP_DIR/src/services/deviceFlowService.ts" ]; then
    cp "$BACKUP_DIR/src/services/deviceFlowService.ts" src/services/
    echo "✅ Restored: deviceFlowService.ts"
fi

# Restore all device flow components
echo ""
echo "📦 Restoring device flow components..."
for file in "$BACKUP_DIR"/src/components/*DeviceFlow*.tsx "$BACKUP_DIR"/src/components/*.tsx; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        cp "$file" src/components/
        echo "✅ Restored: $filename"
    fi
done

echo ""
echo "✅ Restore complete!"
echo ""
echo "📝 To check what changed, run:"
echo "   git diff src/"
echo ""
echo "🔙 To revert to backup:"
echo "   ./restore-device-flow-backup.sh"
