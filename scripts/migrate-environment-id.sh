#!/bin/bash

# Global Environment ID Migration Script
# Helps transition from scattered environmentId usage to centralized environmentService

echo "🌍 Global Environment ID Migration"
echo "================================="

# Statistics
echo "📊 Current Usage Analysis:"
echo "Files with environmentId: $(find src -name "*.ts" -o -name "*.tsx" | xargs grep -l "environmentId" | wc -l)"
echo "Total environmentId references: $(find src -name "*.ts" -o -name "*.tsx" | xargs grep -c "environmentId" | awk -F: '{sum += $2} END {print sum}')"

# Common patterns to replace
echo ""
echo "🔄 Migration Patterns:"
echo ""
echo "1. Direct localStorage access:"
echo "   Before: const envId = localStorage.getItem('environmentId');"
echo "   After:  const envId = environmentService.getEnvironmentId();"
echo ""
echo "2. Component state initialization:"
echo "   Before: const [environmentId, setEnvironmentId] = useState('');"
echo "   After:  const { environmentId, setEnvironmentId } = useEnvironment();"
echo ""
echo "3. Setting environment ID:"
echo "   Before: localStorage.setItem('environmentId', envId);"
echo "   After:  environmentService.setEnvironmentId(envId);"
echo ""
echo "4. Checking if environment exists:"
echo "   Before: if (environmentId?.trim()) { ... }"
echo "   After:  if (environmentService.hasEnvironment()) { ... }"
echo ""
echo "5. Getting PingOne domain:"
echo "   Before: const domain = 'https://auth.pingone.com';"
echo "   After:  const domain = environmentService.getPingOneDomain();"

# High priority files to migrate
echo ""
echo "🎯 Priority Files for Migration:"
echo ""
echo "1. WorkerTokenModalV8.tsx - ✅ Already migrated"
echo "2. MFAAuthenticationMainPageV8.tsx - ✅ Already migrated"
echo "3. AppPickerV8.tsx - Uses environmentId for app discovery"
echo "4. PingOneIdentityMetrics.tsx - Uses environmentId for API calls"
echo "5. SessionTerminationService.ts - Uses environmentId for logout URLs"

# Example migration for a file
echo ""
echo "💡 Example Migration Steps:"
echo ""
echo "1. Add import:"
echo "   import { environmentService } from '@/services/environmentService';"
echo ""
echo "2. Replace useState with useEnvironment hook:"
echo "   const { environmentId, setEnvironmentId, hasEnvironment } = useEnvironment();"
echo ""
echo "3. Replace localStorage calls:"
echo "   - Remove: localStorage.getItem('environmentId')"
echo "   - Remove: localStorage.setItem('environmentId', value)"
echo "   - Use: environmentService.getEnvironmentId()"
echo "   - Use: environmentService.setEnvironmentId(value)"
echo ""
echo "4. Test the migration:"
echo "   - Environment ID should persist across page refreshes"
echo "   - All components should get the same environment ID"
echo "   - Worker token modal should update global environment"

# Create backup
BACKUP_DIR="environment-migration-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
echo ""
echo "📦 Creating backup in: $BACKUP_DIR"

# Find top 10 files with most environmentId usage
echo ""
echo "🔍 Top 10 Files by environmentId Usage:"
find src -name "*.ts" -o -name "*.tsx" | xargs grep -c "environmentId" | sort -t: -k2 -nr | head -10 | while IFS=: read -r file count; do
    echo "   $count: $file"
    # Copy to backup
    cp "$file" "$BACKUP_DIR/" 2>/dev/null
done

echo ""
echo "✅ Migration script ready!"
echo ""
echo "📝 Next Steps:"
echo "1. Update high-priority files to use environmentService"
echo "2. Test that environment ID persists correctly"
echo "3. Verify all components get the same environment ID"
echo "4. Remove old localStorage usage patterns"
echo ""
echo "🔧 Tools Available:"
echo "- environmentService.getEnvironmentId() - Get current environment ID"
echo "- environmentService.setEnvironmentId(id) - Set environment ID"
echo "- environmentService.hasEnvironment() - Check if environment exists"
echo "- useEnvironment() - React hook for components"
echo "- environmentService.getPingOneDomain() - Get auth domain"
echo "- environmentService.getPingOneApiDomain() - Get API domain"
