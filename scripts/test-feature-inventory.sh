#!/bin/bash

# scripts/test-feature-inventory.sh

FEATURE_NAME=$1

if [ -z "$FEATURE_NAME" ]; then
  echo "❌ Usage: $0 [feature-name]"
  exit 1
fi

echo "🔍 FEATURE INVENTORY: $FEATURE_NAME"

# Check if feature file exists
if [ ! -f "src/pages/flows/v9/${FEATURE_NAME}.tsx" ]; then
  echo "❌ Feature file not found"
  exit 1
fi

# Analyze feature complexity
echo "📊 Analyzing feature complexity..."
LINES=$(wc -l < "src/pages/flows/v9/${FEATURE_NAME}.tsx")
IMPORTS=$(grep -c "^import" "src/pages/flows/v9/${FEATURE_NAME}.tsx")
STATE_VARS=$(grep -c "useState\|useReducer" "src/pages/flows/v9/${FEATURE_NAME}.tsx")
FUNCTIONS=$(grep -c "const.*=" "src/pages/flows/v9/${FEATURE_NAME}.tsx")

echo "📈 Feature Metrics:"
echo "   Lines: $LINES"
echo "   Imports: $IMPORTS"  
echo "   State Variables: $STATE_VARS"
echo "   Functions: $FUNCTIONS"

# Check for common patterns
echo "🔍 Checking patterns..."
if grep -q "useEffect" "src/pages/flows/v9/${FEATURE_NAME}.tsx"; then
  echo "   ✅ Has effects"
fi

if grep -q "useCallback" "src/pages/flows/v9/${FEATURE_NAME}.tsx"; then
  echo "   ✅ Has callbacks"
fi

if grep -q "modernMessaging" "src/pages/flows/v9/${FEATURE_NAME}.tsx"; then
  echo "   ✅ Uses V9 messaging"
fi

echo "🎯 FEATURE INVENTORY COMPLETE"
