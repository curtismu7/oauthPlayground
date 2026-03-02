#!/bin/bash

# scripts/test-validate-all-v9-flows.sh

echo "🔍 BULK VALIDATION OF ALL V9 FLOWS"
echo "=================================="

V9_FLOW_DIR="src/pages/flows/v9"
VALIDATION_RESULTS=()
TOTAL_FLOWS=0
PASSED_FLOWS=0
FAILED_FLOWS=0

echo "📋 Discovering V9 flows..."

# Find all V9 flow files
V9_FLOWS=$(find "$V9_FLOW_DIR" -name "*FlowV9.tsx" -o -name "*FlowV9_*.tsx" | sort)

if [ -z "$V9_FLOWS" ]; then
  echo "❌ No V9 flows found in $V9_FLOW_DIR"
  exit 1
fi

echo "🎯 Found $(echo "$V9_FLOWS" | wc -l) V9 flows to validate"
echo ""

# Test each V9 flow
for flow_file in $V9_FLOWS; do
  flow_name=$(basename "$flow_file" .tsx)
  TOTAL_FLOWS=$((TOTAL_FLOWS + 1))
  
  echo "🔍 Testing: $flow_name"
  echo "   File: $flow_file"
  
  # Check if file exists
  if [ ! -f "$flow_file" ]; then
    echo "   ❌ File not found"
    VALIDATION_RESULTS+=("$flow_name:FAILED:File not found")
    FAILED_FLOWS=$((FAILED_FLOWS + 1))
    continue
  fi
  
  # Run migration verification
  if npm run migrate:verify "$flow_name" > /dev/null 2>&1; then
    echo "   ✅ PASSED"
    VALIDATION_RESULTS+=("$flow_name:PASSED:All checks passed")
    PASSED_FLOWS=$((PASSED_FLOWS + 1))
  else
    echo "   ❌ FAILED"
    VALIDATION_RESULTS+=("$flow_name:FAILED:Validation errors")
    FAILED_FLOWS=$((FAILED_FLOWS + 1))
  fi
  
  echo ""
done

# Summary
echo "📊 VALIDATION SUMMARY"
echo "===================="
echo "Total Flows Tested: $TOTAL_FLOWS"
echo "Passed: $PASSED_FLOWS"
echo "Failed: $FAILED_FLOWS"
echo "Success Rate: $(( PASSED_FLOWS * 100 / TOTAL_FLOWS ))%"
echo ""

# Detailed results
echo "📋 DETAILED RESULTS"
echo "=================="

for result in "${VALIDATION_RESULTS[@]}"; do
  IFS=':' read -r flow_name status message <<< "$result"
  if [ "$status" = "PASSED" ]; then
    echo "✅ $flow_name: $message"
  else
    echo "❌ $flow_name: $message"
  fi
done

echo ""

# Overall status
if [ $FAILED_FLOWS -eq 0 ]; then
  echo "🎉 ALL V9 FLOWS PASSED VALIDATION"
  echo "✅ Migration framework coverage: COMPLETE"
  exit 0
else
  echo "⚠️  SOME V9 FLOWS FAILED VALIDATION"
  echo "❌ Migration framework coverage: INCOMPLETE"
  echo ""
  echo "🔧 Next steps:"
  echo "   1. Fix failed flows"
  echo "   2. Re-run validation"
  echo "   3. Update migration documentation"
  exit 1
fi
