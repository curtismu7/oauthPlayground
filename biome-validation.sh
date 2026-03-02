#!/bin/bash

# Username Dropdown Consolidation - Biome Validation Script
# This script runs Biome checks on all updated components

echo "🔍 Running Biome validation on Username Dropdown Consolidation components..."

# Define the list of updated components
COMPONENTS=(
    "src/pages/protect-portal/components/BaseLoginForm.tsx"
    "src/pages/protect-portal/components/LoginPatterns/DropdownLogin.tsx"
    "src/pages/protect-portal/components/LoginPatterns/EmbeddedLogin.tsx"
    "src/components/password-reset/shared/UserLookupForm.tsx"
    "src/pages/flows/RedirectlessFlowV9_Real.tsx"
    "src/v8u/pages/UserManagementPage.tsx"
    "src/v8/components/UserSearchDropdownV8.tsx"
)

# Create results file
RESULTS_FILE="biome-validation-results.txt"
echo "Username Dropdown Consolidation - Biome Validation Results" > "$RESULTS_FILE"
echo "Generated: $(date)" >> "$RESULTS_FILE"
echo "=================================================" >> "$RESULTS_FILE"
echo "" >> "$RESULTS_FILE"

# Run Biome check on each component
echo "📋 Checking individual components..."
for component in "${COMPONENTS[@]}"; do
    echo "🔍 Checking: $component"
    echo "" >> "$RESULTS_FILE"
    echo "📁 Component: $component" >> "$RESULTS_FILE"
    echo "----------------------------------------" >> "$RESULTS_FILE"
    
    # Run Biome check and append results
    if npx biome check "$component" --write --no-errors-on-unmatched >> "$RESULTS_FILE" 2>&1; then
        echo "✅ PASSED: $component"
        echo "✅ Status: PASSED" >> "$RESULTS_FILE"
    else
        echo "❌ ISSUES FOUND: $component"
        echo "❌ Status: ISSUES FOUND" >> "$RESULTS_FILE"
    fi
    echo "" >> "$RESULTS_FILE"
done

echo "" >> "$RESULTS_FILE"
echo "=================================================" >> "$RESULTS_FILE"
echo "📊 SUMMARY" >> "$RESULTS_FILE"
echo "=================================================" >> "$RESULTS_FILE"

# Run Biome check on all components together
echo "" >> "$RESULTS_FILE"
echo "🔄 Running combined check on all components..." >> "$RESULTS_FILE"
echo "" >> "$RESULTS_FILE"

if npx biome check "${COMPONENTS[@]}" --write --no-errors-on-unmatched >> "$RESULTS_FILE" 2>&1; then
    echo "✅ ALL COMPONENTS PASSED COMBINED CHECK"
    echo "✅ Combined Status: ALL PASSED" >> "$RESULTS_FILE"
else
    echo "❌ COMBINED CHECK FOUND ISSUES"
    echo "❌ Combined Status: ISSUES FOUND" >> "$RESULTS_FILE"
fi

# Add final summary
echo "" >> "$RESULTS_FILE"
echo "=================================================" >> "$RESULTS_FILE"
echo "🎯 Username Dropdown Consolidation - Biome Validation Complete" >> "$RESULTS_FILE"
echo "📅 Completed: $(date)" >> "$RESULTS_FILE"
echo "📁 Results saved to: $RESULTS_FILE" >> "$RESULTS_FILE"

echo ""
echo "✅ Biome validation completed!"
echo "📄 Results saved to: $RESULTS_FILE"
echo "📊 Check the file for detailed results"

# Display summary
echo ""
echo "📋 Quick Summary:"
echo "-----------------"
echo "🔍 Components checked: ${#COMPONENTS[@]}"
echo "📄 Results file: $RESULTS_FILE"
echo "🎯 Status: See results file for details"
