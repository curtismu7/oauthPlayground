#!/bin/bash

###############################################################################
# Final script to fix all linting errors and show summary
###############################################################################

set -e  # Exit on error

echo "🔧 Final linting error fix..."

# Step 1: Run Biome with unsafe fixes on entire codebase
echo ""
echo "📝 Step 1: Running Biome with unsafe fixes..."
npx @biomejs/biome check --write --unsafe . > /tmp/biome-final-fix.log 2>&1 || true

FIXED_COUNT=$(grep -c "Fixed" /tmp/biome-final-fix.log 2>/dev/null || echo "0")
echo "  Files fixed: $FIXED_COUNT"

# Step 2: Run ESLint fixes
echo ""
echo "📝 Step 2: Running ESLint auto-fix..."
npm run lint:eslint:fix > /tmp/eslint-final-fix.log 2>&1 || true

# Step 3: Check remaining errors
echo ""
echo "🔍 Step 3: Checking remaining errors..."
npx @biomejs/biome check . --max-diagnostics=500 > /tmp/biome-final-errors.log 2>&1 || true

# Step 4: Extract summary
ERROR_COUNT=$(grep -c "Error" /tmp/biome-final-errors.log 2>/dev/null || echo "0")
WARNING_COUNT=$(grep -c "Warning" /tmp/biome-final-errors.log 2>/dev/null || echo "0")

echo ""
echo "📈 Final Summary:"
echo "  Errors: $ERROR_COUNT"
echo "  Warnings: $WARNING_COUNT"

# Step 5: Show error breakdown by type
echo ""
echo "🔍 Error breakdown:"
echo "  useConst: $(grep -c "useConst" /tmp/biome-final-errors.log 2>/dev/null || echo "0")"
echo "  useTemplate: $(grep -c "useTemplate" /tmp/biome-final-errors.log 2>/dev/null || echo "0")"
echo "  useExhaustiveDependencies: $(grep -c "useExhaustiveDependencies" /tmp/biome-final-errors.log 2>/dev/null || echo "0")"
echo "  noExplicitAny: $(grep -c "noExplicitAny" /tmp/biome-final-errors.log 2>/dev/null || echo "0")"

# Step 6: Show top 30 errors
if [ "$ERROR_COUNT" -gt 0 ]; then
    echo ""
    echo "📋 Top 30 errors:"
    grep "Error" /tmp/biome-final-errors.log | head -30
fi

# Step 7: Show files with most errors
echo ""
echo "📁 Files with errors (top 10):"
grep "^src/" /tmp/biome-final-errors.log | cut -d: -f1 | sort | uniq -c | sort -rn | head -10

if [ "$ERROR_COUNT" -eq 0 ]; then
    echo ""
    echo "✅ All ERRORS fixed! You can now commit."
    echo "   (Warnings won't block commits)"
else
    echo ""
    echo "⚠️  $ERROR_COUNT errors remain."
    echo "   Full details: /tmp/biome-final-errors.log"
    echo ""
    echo "💡 You can:"
    echo "   1. Fix remaining errors manually"
    echo "   2. Commit with --no-verify: git commit --no-verify"
fi

echo ""
echo "✅ Process complete!"

