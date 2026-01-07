#!/bin/bash

###############################################################################
# Script to fix linting errors in modified files
###############################################################################

set -e  # Exit on error

echo "🔧 Fixing linting errors in modified files..."

# List of modified files (from git status)
MODIFIED_FILES=(
    "server.js"
    "src/services/apiCallTrackerService.ts"
    "src/v8/components/MFADocumentationPageV8.tsx"
    "src/v8/components/SuperSimpleApiDisplayV8.tsx"
    "src/v8/flows/MFAAuthenticationMainPageV8.tsx"
    "src/v8/flows/MFAConfigurationPageV8.tsx"
    "src/v8/flows/MFAReportingFlowV8.tsx"
    "src/v8/flows/components/MFAOTPInput.tsx"
    "src/v8/flows/controllers/FIDO2FlowController.ts"
    "src/v8/flows/controllers/MFAFlowController.ts"
    "src/v8/flows/shared/MFAFlowBaseV8.tsx"
    "src/v8/flows/types/EmailFlowV8.tsx"
    "src/v8/flows/types/FIDO2ConfigurationPageV8.tsx"
    "src/v8/flows/types/FIDO2FlowV8.tsx"
    "src/v8/flows/types/SMSFlowV8.tsx"
    "src/v8/flows/types/TOTPFlowV8.tsx"
    "src/v8/flows/types/WhatsAppFlowV8.tsx"
    "src/v8/services/mfaAuthenticationServiceV8.ts"
    "src/v8/services/mfaConfigurationServiceV8.ts"
    "src/v8/services/mfaReportingServiceV8.ts"
    "src/v8/services/mfaServiceV8.ts"
    "src/v8/utils/analyticsLoggerV8.ts"
)

# Step 1: Run Biome with unsafe fixes on all modified files
echo ""
echo "📝 Step 1: Running Biome with unsafe fixes on modified files..."
npx @biomejs/biome check --write --unsafe "${MODIFIED_FILES[@]}" 2>&1 | tee /tmp/biome-modified-fix.log

echo ""
echo "📊 Biome fix results:"
grep -E "(Fixed|Error|Warning|Checked)" /tmp/biome-modified-fix.log | tail -20

# Step 2: Check remaining errors in modified files
echo ""
echo "🔍 Step 2: Checking remaining errors in modified files..."
npx @biomejs/biome check --max-diagnostics=500 "${MODIFIED_FILES[@]}" 2>&1 | tee /tmp/biome-modified-errors.log

# Step 3: Extract error summary
ERROR_COUNT=$(grep -c "Error" /tmp/biome-modified-errors.log 2>/dev/null || echo "0")
WARNING_COUNT=$(grep -c "Warning" /tmp/biome-modified-errors.log 2>/dev/null || echo "0")

echo ""
echo "📈 Summary for modified files:"
echo "  Errors: $ERROR_COUNT"
echo "  Warnings: $WARNING_COUNT"

# Step 4: Show errors by file
echo ""
echo "📁 Errors by file:"
for file in "${MODIFIED_FILES[@]}"; do
    if [ -f "$file" ]; then
        ERROR_COUNT_FILE=$(grep -c "$file.*Error" /tmp/biome-modified-errors.log 2>/dev/null || echo "0")
        if [ "$ERROR_COUNT_FILE" -gt 0 ]; then
            echo "  $file: $ERROR_COUNT_FILE errors"
            grep "$file.*Error" /tmp/biome-modified-errors.log | head -5
        fi
    fi
done

# Step 5: Show common error types
echo ""
echo "🔍 Common error types in modified files:"
echo "  useConst: $(grep -c "useConst" /tmp/biome-modified-errors.log 2>/dev/null || echo "0")"
echo "  useTemplate: $(grep -c "useTemplate" /tmp/biome-modified-errors.log 2>/dev/null || echo "0")"
echo "  useExhaustiveDependencies: $(grep -c "useExhaustiveDependencies" /tmp/biome-modified-errors.log 2>/dev/null || echo "0")"
echo "  noExplicitAny: $(grep -c "noExplicitAny" /tmp/biome-modified-errors.log 2>/dev/null || echo "0")"

if [ "$ERROR_COUNT" -eq 0 ]; then
    echo ""
    echo "✅ All ERRORS in modified files fixed!"
else
    echo ""
    echo "⚠️  $ERROR_COUNT errors remain in modified files."
    echo "   Full details in: /tmp/biome-modified-errors.log"
fi

echo ""
echo "✅ Error check complete!"

