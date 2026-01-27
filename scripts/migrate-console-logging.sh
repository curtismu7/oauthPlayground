#!/bin/bash

# Console Logging Migration Script
# This script helps migrate console.* statements to the new logging service

echo "🚀 Starting Console Logging Migration..."
echo "=================================="

# Create a backup of the current state
echo "📦 Creating backup..."
BACKUP_DIR="console-migration-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
find src -name "*.ts" -o -name "*.tsx" | head -50 | xargs -I {} cp {} "$BACKUP_DIR/"

# Count total console statements
TOTAL_CONSOLE=$(find src -name "*.ts" -o -name "*.tsx" | xargs grep -c "console\.\(log\|warn\|error\|info\|debug\)" | awk -F: '{sum += $2} END {print sum}')
echo "📊 Found $TOTAL_CONSOLE console statements to migrate"

# Create migration report
echo "📋 Generating migration report..."
REPORT_FILE="migration-report-$(date +%Y%m%d-%H%M%S).md"
cat > "$REPORT_FILE" << EOF
# Console Logging Migration Report

## Summary
- **Total Console Statements**: $TOTAL_CONSOLE
- **Files Affected**: $(find src -name "*.ts" -o -name "*.tsx" | xargs grep -l "console\.\(log\|warn\|error\|info\|debug\)" | wc -l)
- **Migration Date**: $(date)

## Files with Most Console Statements
EOF

# List top 20 files with most console statements
find src -name "*.ts" -o -name "*.tsx" | xargs grep -c "console\.(log|warn|error|info|debug)" | sort -t: -k2 -nr | head -20 >> "$REPORT_FILE"

echo "" >> "$REPORT_FILE"
echo "## Migration Pattern" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "### Before:" >> "$REPORT_FILE"
echo '```typescript' >> "$REPORT_FILE"
echo 'console.log("Module message", data);' >> "$REPORT_FILE"
echo 'console.error("Error message", error);' >> "$REPORT_FILE"
echo '```' >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "### After:" >> "$REPORT_FILE"
echo '```typescript' >> "$REPORT_FILE"
echo 'import { createModuleLogger } from "@/utils/consoleMigrationHelper";' >> "$REPORT_FILE"
echo 'const log = createModuleLogger("src/path/to/module.tsx");' >> "$REPORT_FILE"
echo 'log.info("Module message", data);' >> "$REPORT_FILE"
echo 'log.error("Error message", error);' >> "$REPORT_FILE"
echo '```' >> "$REPORT_FILE"

echo "✅ Migration report saved to: $REPORT_FILE"

# Show next steps
echo ""
echo "📝 Next Steps:"
echo "1. Review the migration report: $REPORT_FILE"
echo "2. Use the consoleMigrationHelper.ts utility to replace console statements"
echo "3. Test the logging system with: npm run test:logging"
echo "4. Verify no console output in production"
echo ""
echo "🔧 Migration Tools Available:"
echo "- createModuleLogger() - Creates module-specific logger"
echo "- replaceConsoleStatements() - Batch replacement utility"
echo "- LogViewer component - Debug and monitor logs"
echo ""
echo "⚠️  Important Notes:"
echo "- Error logs should be preserved for debugging"
echo "- Debug logs can be removed or set to DEBUG level"
echo "- Use logger.configure() to adjust log levels"
echo "- Check for any remaining console statements with:"
echo "  find src -name '*.ts' -o -name '*.tsx' | xargs grep 'console\.'"
echo ""
echo "🎯 Migration Complete!"
