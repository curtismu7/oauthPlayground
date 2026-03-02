#!/bin/bash

# scripts/test-inventory-all-flows.sh

echo "🔍 COMPREHENSIVE FLOW INVENTORY"
echo "==============================="

FLOW_DIR="src/pages/flows"
V9_FLOW_DIR="src/pages/flows/v9"

echo "📋 Analyzing flow migration status..."
echo ""

# Count V7 flows
V7_FLOWS=$(find "$FLOW_DIR" -maxdepth 1 -name "*V7.tsx" | grep -v v9 | sort)
V7_COUNT=$(echo "$V7_FLOWS" | wc -l)

# Count V9 flows  
V9_FLOWS=$(find "$V9_FLOW_DIR" -name "*FlowV9.tsx" | sort)
V9_COUNT=$(echo "$V9_FLOWS" | wc -l)

# Count other flows
OTHER_FLOWS=$(find "$FLOW_DIR" -maxdepth 1 -name "*.tsx" | grep -v V7 | grep -v v9 | sort)
OTHER_COUNT=$(echo "$OTHER_FLOWS" | wc -l)

echo "📊 FLOW INVENTORY SUMMARY"
echo "======================="
echo "V7 Flows: $V7_COUNT"
echo "V9 Flows: $V9_COUNT"
echo "Other Flows: $OTHER_COUNT"
echo "Total Flows: $((V7_COUNT + V9_COUNT + OTHER_COUNT))"
echo ""

echo "📋 V7 FLOWS (Source - Need Migration)"
echo "===================================="
if [ -n "$V7_FLOWS" ]; then
  for flow in $V7_FLOWS; do
    flow_name=$(basename "$flow" .tsx)
    lines=$(wc -l < "$flow")
    echo "   $flow_name ($lines lines)"
  done
else
  echo "   No V7 flows found"
fi
echo ""

echo "📋 V9 FLOWS (Target - Should Be Validated)"
echo "======================================"
if [ -n "$V9_FLOWS" ]; then
  for flow in $V9_FLOWS; do
    flow_name=$(basename "$flow" .tsx)
    lines=$(wc -l < "$flow")
    echo "   $flow_name ($lines lines)"
  done
else
  echo "   No V9 flows found"
fi
echo ""

echo "📋 OTHER FLOWS (Legacy/Utility)"
echo "============================"
if [ -n "$OTHER_FLOWS" ]; then
  for flow in $OTHER_FLOWS; do
    flow_name=$(basename "$flow" .tsx)
    lines=$(wc -l < "$flow")
    echo "   $flow_name ($lines lines)"
  done
else
  echo "   No other flows found"
fi
echo ""

# Migration analysis
echo "🔍 MIGRATION ANALYSIS"
echo "=================="

MIGRATED_COUNT=0
UNMIGRATED_COUNT=0

echo "📋 Migration Status:"
for flow in $V7_FLOWS; do
  flow_name=$(basename "$flow" .tsx)
  v9_name="${flow_name/V7/V9}"
  
  if [ -f "$V9_FLOW_DIR/$v9_name.tsx" ]; then
    echo "   ✅ $flow_name → $v9_name (MIGRATED)"
    MIGRATED_COUNT=$((MIGRATED_COUNT + 1))
  else
    echo "   ❌ $flow_name → $v9_name (NEEDS MIGRATION)"
    UNMIGRATED_COUNT=$((UNMIGRATED_COUNT + 1))
  fi
done

echo ""
echo "📊 MIGRATION STATISTICS"
echo "===================="
echo "V7 Flows Total: $V7_COUNT"
echo "Migrated: $MIGRATED_COUNT"
echo "Unmigrated: $UNMIGRATED_COUNT"
echo "Migration Rate: $(( MIGRATED_COUNT * 100 / V7_COUNT ))%"
echo ""

# Framework validation status
echo "🔍 FRAMEWORK VALIDATION STATUS"
echo "============================"

VALIDATED_COUNT=0
UNVALIDATED_COUNT=0

echo "📋 V9 Flow Validation Status:"
for flow in $V9_FLOWS; do
  flow_name=$(basename "$flow" .tsx)
  
  # Check if flow has been validated with framework
  if npm run migrate:verify "$flow_name" > /dev/null 2>&1; then
    echo "   ✅ $flow_name (VALIDATED)"
    VALIDATED_COUNT=$((VALIDATED_COUNT + 1))
  else
    echo "   ❌ $flow_name (NEEDS VALIDATION)"
    UNVALIDATED_COUNT=$((UNVALIDATED_COUNT + 1))
  fi
done

echo ""
echo "📊 VALIDATION STATISTICS"
echo "===================="
echo "V9 Flows Total: $V9_COUNT"
echo "Validated: $VALIDATED_COUNT"
echo "Unvalidated: $UNVALIDATED_COUNT"
echo "Validation Rate: $(( VALIDATED_COUNT * 100 / V9_COUNT ))%"
echo ""

# Overall assessment
echo "🎯 OVERALL ASSESSMENT"
echo "=================="

if [ $UNMIGRATED_COUNT -eq 0 ] && [ $UNVALIDATED_COUNT -eq 0 ]; then
  echo "🎉 EXCELLENT: All flows migrated and validated"
elif [ $UNMIGRATED_COUNT -eq 0 ]; then
  echo "⚠️  GOOD: All flows migrated, but some need validation"
elif [ $UNVALIDATED_COUNT -eq 0 ]; then
  echo "⚠️  GOOD: All validated flows, but some migrations missing"
else
  echo "❌ NEEDS WORK: Both migrations and validations incomplete"
fi

echo ""
echo "📋 PRIORITY ACTIONS:"
echo "=================="

if [ $UNMIGRATED_COUNT -gt 0 ]; then
  echo "1. Complete $UNMIGRATED_COUNT pending V7→V9 migrations"
fi

if [ $UNVALIDATED_COUNT -gt 0 ]; then
  echo "2. Validate $UNVALIDATED_COUNT V9 flows with framework"
fi

if [ $UNMIGRATED_COUNT -gt 0 ] || [ $UNVALIDATED_COUNT -gt 0 ]; then
  echo "3. Update migration documentation with framework results"
  echo "4. Run bulk validation: npm run test:validate-all-v9-flows"
fi

if [ $UNMIGRATED_COUNT -eq 0 ] && [ $UNVALIDATED_COUNT -eq 0 ]; then
  echo "✅ All migration tasks complete!"
  echo "✅ Framework coverage: 100%"
  echo "✅ Ready for production"
fi
