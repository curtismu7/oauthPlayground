#!/bin/bash

###############################################################################
# Script to fix all linting errors
###############################################################################

set -e  # Exit on error

echo "🔧 Fixing linting errors..."

# Run biome with auto-fix
echo ""
echo "📝 Running Biome auto-fix..."
npx @biomejs/biome check --write --unsafe . 2>&1 | tee /tmp/biome-fix.log

echo ""
echo "📊 Biome fix results:"
grep -E "(Fixed|Error|Warning|Found)" /tmp/biome-fix.log | tail -20 || echo "  (checking...)"

# Run ESLint with auto-fix
echo ""
echo "📝 Running ESLint auto-fix..."
npm run lint:eslint:fix 2>&1 | tee /tmp/eslint-fix.log

echo ""
echo "📊 ESLint fix results:"
grep -E "(Fixed|Error|Warning|problems)" /tmp/eslint-fix.log | tail -20 || echo "  (checking...)"

# Check remaining errors
echo ""
echo "🔍 Checking remaining errors..."
npx @biomejs/biome check . --max-diagnostics=100 2>&1 | tee /tmp/biome-check.log

ERROR_COUNT=$(grep -c "Error" /tmp/biome-check.log || echo "0")
WARNING_COUNT=$(grep -c "Warning" /tmp/biome-check.log || echo "0")

echo ""
echo "📈 Summary:"
echo "  Errors: $ERROR_COUNT"
echo "  Warnings: $WARNING_COUNT"

if [ "$ERROR_COUNT" -eq 0 ] && [ "$WARNING_COUNT" -eq 0 ]; then
    echo ""
    echo "✅ All linting errors fixed!"
else
    echo ""
    echo "⚠️  Some errors remain. Check /tmp/biome-check.log for details"
    echo ""
    echo "Top errors:"
    grep "Error" /tmp/biome-check.log | head -20
fi

echo ""
echo "✅ Linting fix complete!"

