#!/bin/bash
# File: scripts/prevent-base64-display.sh
# Purpose: Prevent base64 display issues in file uploads

echo "🔍 Running file upload base64 display prevention checks..."

# Check for problematic patterns
ISSUES_FOUND=0

# 1. Check for customLogoUrl being set with base64 data
if grep -r "setCustomLogoUrl.*base64Url" src/mfa/flows/unified/ --include="*.ts" --include="*.tsx"; then
    echo "❌ ERROR: Found setCustomLogoUrl being set with base64Url"
    echo "   This will cause base64 data to display instead of filename"
    echo "   Fix: Use only uploadedFileInfo state for file uploads"
    ISSUES_FOUND=1
fi

# 2. Check for localStorage loading setting customLogoUrl from upload data
if grep -r "setCustomLogoUrl.*uploadData" src/mfa/flows/unified/ --include="*.ts" --include="*.tsx"; then
    echo "❌ ERROR: Found localStorage loading setting customLogoUrl from upload data"
    echo "   This will cause base64 data to display on page reload"
    echo "   Fix: Only set uploadedFileInfo from localStorage for file uploads"
    ISSUES_FOUND=1
fi

# 3. Check for data: URLs being displayed as text
if grep -r "URL.*data:" src/mfa/flows/unified/ --include="*.ts" --include="*.tsx"; then
    echo "❌ ERROR: Found data: URLs being displayed as text"
    echo "   This will show raw base64 data to users"
    echo "   Fix: Use conditional rendering to separate file uploads from URLs"
    ISSUES_FOUND=1
fi

# 4. Check for missing uploadedFileInfo conditional logic
if ! grep -r "uploadedFileInfo.*?" src/mfa/flows/unified/ --include="*.ts" --include="*.tsx" >/dev/null; then
    echo "⚠️  WARNING: No uploadedFileInfo conditional rendering found"
    echo "   Ensure file uploads are properly distinguished from URL inputs"
fi

# 5. Check for proper state separation patterns
if grep -r "customLogoUrl.*uploadedFileInfo\|uploadedFileInfo.*customLogoUrl" src/mfa/flows/unified/ --include="*.ts" --include="*.tsx"; then
    echo "⚠️  WARNING: Found potential state mixing between customLogoUrl and uploadedFileInfo"
    echo "   Ensure these states are properly separated"
fi

if [ $ISSUES_FOUND -gt 0 ]; then
    echo "❌ PREVENTION CHECKS FAILED"
    echo "   Please fix the above issues before committing"
    exit 1
else
    echo "✅ PREVENTION CHECKS PASSED"
    exit 0
fi
