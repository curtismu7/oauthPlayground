#!/bin/bash

# MFA Console Logging Migration Script
# Focuses on MFA-related files only

echo "🔐 MFA Console Logging Migration"
echo "=============================="

# Find all MFA-related files with console statements
MFA_FILES=$(find src -path "*/mfa*" -name "*.ts" -o -path "*/mfa*" -name "*.tsx" | xargs grep -l "console\.\(log\|warn\|error\|info\|debug\)" 2>/dev/null)

echo "📊 MFA Files Analysis:"
echo "Files with console statements: $(echo "$MFA_FILES" | wc -l)"
echo "Total console statements: $(find src -path "*/mfa*" -name "*.ts" -o -path "*/mfa*" -name "*.tsx" | xargs grep -c "console\.\(log\|warn\|error\|info\|debug\)" 2>/dev/null | awk -F: '{sum += $2} END {print sum}')"

# Create backup
BACKUP_DIR="mfa-console-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
echo "$MFA_FILES" | head -10 | xargs -I {} cp {} "$BACKUP_DIR"/ 2>/dev/null
echo "📦 Backup created: $BACKUP_DIR"

# Priority files for migration
echo ""
echo "🎯 Priority Files for Migration:"
echo "1. src/v8/services/mfaServiceV8.ts ($(grep -c "console\." src/v8/services/mfaServiceV8.ts | cut -d: -f2) statements)"
echo "2. src/v8/services/mfaAuthenticationServiceV8.ts ($(grep -c "console\." src/v8/services/mfaAuthenticationServiceV8.ts | cut -d: -f2) statements)"
echo "3. src/v8/services/mfaConfigurationServiceV8.ts ($(grep -c "console\." src/v8/services/mfaConfigurationServiceV8.ts | cut -d: -f2) statements)"

# Migration pattern
echo ""
echo "📝 Migration Pattern:"
echo "Add to each file:"
echo "  import { createModuleLogger } from '@/utils/consoleMigrationHelper';"
echo "  const log = createModuleLogger('src/path/to/file.tsx');"
echo ""
echo "Replace:"
echo "  console.error('message', data) → log.error('message', data)"
echo "  console.warn('message', data) → log.warn('message', data)"
echo "  console.log('message', data) → log.info('message', data)"
echo "  console.debug('message', data) → log.debug('message', data)"

echo ""
echo "✅ Ready for MFA migration!"
