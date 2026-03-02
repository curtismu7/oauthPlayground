#!/bin/bash

# scripts/test-pre-migration-inventory.sh

FEATURE_NAME=$1

if [ -z "$FEATURE_NAME" ]; then
  echo "❌ Usage: $0 [feature-name]"
  exit 1
fi

echo "🔍 Running pre-migration inventory for: $FEATURE_NAME"

# Check if source file exists (handle different naming patterns)
if [ -f "src/pages/flows/v7/${FEATURE_NAME}V7.tsx" ]; then
  SOURCE_FILE="src/pages/flows/v7/${FEATURE_NAME}V7.tsx"
elif [ -f "src/v8/flows/${FEATURE_NAME}V8.tsx" ]; then
  SOURCE_FILE="src/v8/flows/${FEATURE_NAME}V8.tsx"
elif [ -f "src/pages/flows/${FEATURE_NAME}V7.tsx" ]; then
  SOURCE_FILE="src/pages/flows/${FEATURE_NAME}V7.tsx"
elif [ -f "src/pages/flows/JWTBearerTokenFlowV7.tsx" ] && [ "$FEATURE_NAME" = "JWTBearerTokenFlowV9" ]; then
  SOURCE_FILE="src/pages/flows/JWTBearerTokenFlowV7.tsx"
elif [ -f "src/pages/flows/MFALoginHintFlowV7.tsx" ] && [ "$FEATURE_NAME" = "MFALoginHintFlowV9" ]; then
  SOURCE_FILE="src/pages/flows/MFALoginHintFlowV7.tsx"
elif [ -f "src/pages/flows/OAuthROPCFlowV7.tsx" ] && [ "$FEATURE_NAME" = "OAuthROPCFlowV9" ]; then
  SOURCE_FILE="src/pages/flows/OAuthROPCFlowV7.tsx"
else
  echo "❌ Source file not found"
  echo "   Looking for: src/pages/flows/v7/${FEATURE_NAME}V7.tsx"
  echo "   Or: src/v8/flows/${FEATURE_NAME}V8.tsx"
  echo "   Or: src/pages/flows/${FEATURE_NAME}V7.tsx"
  echo "   Or: src/pages/flows/JWTBearerTokenFlowV7.tsx (for JWTBearerTokenFlowV9)"
  echo "   Or: src/pages/flows/MFALoginHintFlowV7.tsx (for MFALoginHintFlowV9)"
  echo "   Or: src/pages/flows/OAuthROPCFlowV7.tsx (for OAuthROPCFlowV9)"
  exit 1
fi

# Analyze source features
echo "📊 Analyzing source features..."

LINES=$(wc -l < "$SOURCE_FILE")
IMPORTS=$(grep -c "^import" "$SOURCE_FILE")
FUNCTIONS=$(grep -c "const.*=" "$SOURCE_FILE")
STATE_VARS=$(grep -c "useState\|useReducer" "$SOURCE_FILE")

echo "📈 Source Metrics:"
echo "   File: $SOURCE_FILE"
echo "   Lines: $LINES"
echo "   Imports: $IMPORTS"
echo "   Functions: $FUNCTIONS"
echo "   State Variables: $STATE_VARS"

# Check for complex patterns
echo "🔍 Checking patterns..."
if grep -q "useEffect" "$SOURCE_FILE"; then
  echo "   ✅ Has effects"
fi

if grep -q "useCallback" "$SOURCE_FILE"; then
  echo "   ✅ Has callbacks"
fi

if grep -q "Service" "$SOURCE_FILE"; then
  echo "   ⚠️  Uses services (may need V9 equivalents)"
fi

echo "🎯 PRE-MIGRATION INVENTORY COMPLETE"
