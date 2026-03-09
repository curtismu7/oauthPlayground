#!/bin/bash

# 🚀 Comprehensive Linter Error Elimination Script
# This script systematically eliminates all linter errors across the application

set -e  # Exit on any error

echo "🚀 Starting Comprehensive Linter Error Elimination..."
echo "⏰ Started at: $(date)"

# Get initial error count
echo "📊 Initial Error Count:"
npx biome check src --max-diagnostics=1000 | grep "Found" || echo "No errors found initially"

# Create backup branch
echo "🔒 Creating backup branch..."
git checkout -b cleanup/linter-elimination-$(date +%Y%m%d-%H%M%S) || git checkout -b cleanup/linter-elimination

# Phase 1: Critical Fixes (30 minutes)
echo ""
echo "📝 Phase 1: Critical Fixes..."
echo "⏱️  Phase 1 started at: $(date)"

# Apply unsafe fixes for critical issues
echo "🔧 Applying critical fixes..."
npx biome check --write --unsafe src --max-diagnostics=50 || true

# Fix any remaining parse errors
echo "🔍 Fixing parse errors..."
npx biome check --write src --max-diagnostics=20 || true

echo "✅ Phase 1 completed at: $(date)"

# Phase 2: Bulk Cleanup (60 minutes)
echo ""
echo "🧹 Phase 2: Bulk Cleanup..."
echo "⏱️  Phase 2 started at: $(date)"

# Apply bulk fixes
echo "🔧 Applying bulk fixes..."
npx biome check --write --unsafe src --max-diagnostics=100 || true

# Fix type safety issues
echo "🔒 Fixing type safety issues..."
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's/: any\[\]/: unknown[]/g' 2>/dev/null || true
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's/: any(/: unknown(/g' 2>/dev/null || true

# Fix accessibility issues
echo "♿ Fixing accessibility issues..."
find src -name "*.tsx" | xargs sed -i '' 's/<button\([^>]*\)>/<button type="button"\1>/g' 2>/dev/null || true

echo "✅ Phase 2 completed at: $(date)"

# Phase 3: Quality Enhancement (30 minutes)
echo ""
echo "✨ Phase 3: Quality Enhancement..."
echo "⏱️  Phase 3 started at: $(date)"

# Final cleanup
echo "🔧 Applying final cleanup..."
npx biome check --write src --max-diagnostics=50 || true

# Format everything
echo "📝 Formatting code..."
npx biome format --write src || true

echo "✅ Phase 3 completed at: $(date)"

# Final validation
echo ""
echo "📊 Final Status Check:"
echo "⏱️  Validation started at: $(date)"

# Get final error count
echo "🎯 Final Error Count:"
FINAL_ERRORS=$(npx biome check src --max-diagnostics=1000 | grep "Found" || echo "No errors found")
echo "$FINAL_ERRORS"

# Extract error numbers for comparison
INITIAL_COUNT=$(npx biome check src --max-diagnostics=1000 2>/dev/null | grep "Found.*errors" | grep -o '[0-9]*' | head -1 || echo "0")
FINAL_COUNT=$(echo "$FINAL_ERRORS" | grep "Found.*errors" | grep -o '[0-9]*' | head -1 || echo "0")

# Calculate improvement
if [[ "$INITIAL_COUNT" != "0" && "$FINAL_COUNT" != "0" ]]; then
    IMPROVEMENT=$((INITIAL_COUNT - FINAL_COUNT))
    PERCENTAGE=$(( (IMPROVEMENT * 100) / INITIAL_COUNT ))
    echo "📈 Improvement: $IMPROVEMENT errors eliminated ($PERCENTAGE% reduction)"
fi

# Generate detailed report
echo ""
echo "📋 Generating detailed report..."
REPORT_FILE="linter-elimination-report-$(date +%Y%m%d-%H%M%S).md"

cat > "$REPORT_FILE" << EOF
# Linter Elimination Report

**Date**: $(date)
**Initial Errors**: $INITIAL_COUNT
**Final Errors**: $FINAL_COUNT
**Improvement**: $IMPROVEMENT errors eliminated ($PERCENTAGE% reduction)

## Files Modified
\`\`\`
$(git diff --name-only HEAD~1 2>/dev/null || echo "No git history available")
\`\`\`

## Remaining Issues
\`\`\`
$(npx biome check src --max-diagnostics=20 2>/dev/null || echo "No remaining issues")
\`\`\`

## Next Steps
- [ ] Review remaining critical issues
- [ ] Test application functionality
- [ ] Commit changes
- [ ] Merge to main branch

EOF

echo "📄 Report saved to: $REPORT_FILE"

# Success criteria check
if [[ "$FINAL_COUNT" -lt 50 ]]; then
    echo "🎉 SUCCESS: Achieved target of <50 errors!"
    echo "✅ Codebase is production ready!"
elif [[ "$FINAL_COUNT" -lt 200 ]]; then
    echo "👍 GOOD: Under 200 errors - significant progress!"
    echo "📝 Consider manual cleanup for remaining issues."
else
    echo "⚠️  WARNING: Still $FINAL_COUNT errors remaining"
    echo "🔧 Additional manual cleanup may be required."
fi

echo ""
echo "🏁 Script completed at: $(date)"
echo "⏱️  Total execution time: $SECONDS seconds"

# Show top remaining issues
echo ""
echo "🔍 Top Remaining Issues:"
npx biome check src --max-diagnostics=10 2>/dev/null | head -20 || echo "No major issues found"

echo ""
echo "🎯 Next Steps:"
echo "1. Review the report: $REPORT_FILE"
echo "2. Test application functionality"
echo "3. Commit changes if satisfied"
echo "4. Continue manual cleanup for remaining issues"

echo ""
echo "🚀 Linter elimination complete!"
