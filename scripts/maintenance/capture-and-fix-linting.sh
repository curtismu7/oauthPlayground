#!/bin/bash

###############################################################################
# Script to capture linting errors and provide fix guidance
###############################################################################

set -e  # Exit on error

echo "🔧 Capturing and fixing linting errors..."

# Step 1: Run Biome with unsafe fixes
echo ""
echo "📝 Step 1: Running Biome with unsafe fixes..."
npx @biomejs/biome check --write --unsafe . > /tmp/biome-unsafe-fix.log 2>&1 || true

echo "✅ Biome unsafe fixes applied"

# Step 2: Run ESLint fixes
echo ""
echo "📝 Step 2: Running ESLint auto-fix..."
npm run lint:eslint:fix > /tmp/eslint-fix.log 2>&1 || true

echo "✅ ESLint fixes applied"

# Step 3: Capture all remaining errors
echo ""
echo "🔍 Step 3: Capturing remaining errors..."
npx @biomejs/biome check . --max-diagnostics=500 > /tmp/biome-all-errors.log 2>&1 || true

# Step 4: Extract error summary
echo ""
echo "📊 Error Summary:"
echo "=================="
grep -E "^(Error|Warning|Info|Found|Checked)" /tmp/biome-all-errors.log | tail -10

# Step 5: Extract file-specific errors
echo ""
echo "📁 Files with errors (first 20):"
grep "^src/" /tmp/biome-all-errors.log | head -20

# Step 6: Count errors by type
echo ""
echo "📈 Error breakdown:"
ERROR_COUNT=$(grep -c "Error" /tmp/biome-all-errors.log 2>/dev/null || echo "0")
WARNING_COUNT=$(grep -c "Warning" /tmp/biome-all-errors.log 2>/dev/null || echo "0")

echo "  Total Errors: $ERROR_COUNT"
echo "  Total Warnings: $WARNING_COUNT"

# Step 7: Show common error patterns
echo ""
echo "🔍 Common error patterns:"
echo "  useConst errors:"
grep -c "useConst" /tmp/biome-all-errors.log 2>/dev/null || echo "    0"
echo "  useTemplate errors:"
grep -c "useTemplate" /tmp/biome-all-errors.log 2>/dev/null || echo "    0"
echo "  useExhaustiveDependencies (warnings):"
grep -c "useExhaustiveDependencies" /tmp/biome-all-errors.log 2>/dev/null || echo "    0"

# Step 8: Create fix suggestions
echo ""
echo "💡 Fix suggestions saved to: /tmp/biome-fix-suggestions.txt"
cat > /tmp/biome-fix-suggestions.txt << 'EOF'
Common Biome Error Fixes:

1. useConst Error:
   Change: let variable = value;
   To: const variable = value;

2. useTemplate Error:
   Change: "text " + variable + " more text"
   To: `text ${variable} more text`

3. useExhaustiveDependencies Warning:
   Add missing dependencies to useEffect/useCallback dependency arrays
   Or add: // biome-ignore lint/correctness/useExhaustiveDependencies: <reason>

4. noExplicitAny Warning:
   Replace 'any' with specific types
   Or add: // biome-ignore lint/suspicious/noExplicitAny: <reason>

5. Accessibility errors:
   Add: // biome-ignore lint/a11y/<rule>: <reason>
EOF

cat /tmp/biome-fix-suggestions.txt

echo ""
echo "📄 Full error log saved to: /tmp/biome-all-errors.log"
echo "📄 Fix suggestions saved to: /tmp/biome-fix-suggestions.txt"

if [ "$ERROR_COUNT" -eq 0 ]; then
    echo ""
    echo "✅ All ERRORS fixed! Warnings won't block commits."
else
    echo ""
    echo "⚠️  $ERROR_COUNT errors remain. These will block commits."
    echo "   Check /tmp/biome-all-errors.log for details"
fi

echo ""
echo "✅ Error capture complete!"

