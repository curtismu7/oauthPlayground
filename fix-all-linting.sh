#!/bin/bash

###############################################################################
# Script to fix all linting errors including unsafe fixes
###############################################################################

set -e  # Exit on error

echo "🔧 Fixing all linting errors (including unsafe fixes)..."

# Step 1: Run Biome with unsafe fixes
echo ""
echo "📝 Step 1: Running Biome with unsafe fixes..."
npx @biomejs/biome check --write --unsafe . 2>&1 | tee /tmp/biome-unsafe-fix.log

echo ""
echo "📊 Biome unsafe fix results:"
grep -E "(Fixed|Error|Warning|Found|Checked)" /tmp/biome-unsafe-fix.log | tail -30

# Step 2: Run ESLint auto-fix
echo ""
echo "📝 Step 2: Running ESLint auto-fix..."
npm run lint:eslint:fix 2>&1 | tee /tmp/eslint-fix.log

echo ""
echo "📊 ESLint fix results:"
grep -E "(Fixed|Error|Warning|problems)" /tmp/eslint-fix.log | tail -20 || echo "  (checking...)"

# Step 3: Check remaining errors
echo ""
echo "🔍 Step 3: Checking remaining errors..."
npx @biomejs/biome check . --max-diagnostics=300 2>&1 | tee /tmp/biome-check.log

ERROR_COUNT=$(grep -c "Error" /tmp/biome-check.log 2>/dev/null || echo "0")
WARNING_COUNT=$(grep -c "Warning" /tmp/biome-check.log 2>/dev/null || echo "0")
INFO_COUNT=$(grep -c "Info" /tmp/biome-check.log 2>/dev/null || echo "0")

echo ""
echo "📈 Summary:"
echo "  Errors: $ERROR_COUNT"
echo "  Warnings: $WARNING_COUNT"
echo "  Info: $INFO_COUNT"

if [ "$ERROR_COUNT" -eq 0 ]; then
    echo ""
    echo "✅ All linting ERRORS fixed! (Warnings may remain)"
    echo ""
    echo "💡 You can now commit. Warnings won't block the pre-commit hook."
else
    echo ""
    echo "⚠️  Some ERRORS remain. These will block the pre-commit hook."
    echo ""
    echo "Top errors (first 30):"
    grep "Error" /tmp/biome-check.log | head -30
    echo ""
    echo "💡 Check /tmp/biome-check.log for full details"
fi

echo ""
echo "✅ Linting fix process complete!"

