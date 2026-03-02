#!/bin/bash

# scripts/test-migration-parity.sh

FEATURE_NAME=$1

if [ -z "$FEATURE_NAME" ]; then
  echo "❌ Usage: $0 [feature-name]"
  exit 1
fi

echo "🔍 Testing migration parity for: $FEATURE_NAME"

# Check if V9 file exists
if [ ! -f "src/pages/flows/v9/${FEATURE_NAME}.tsx" ]; then
  echo "❌ V9 file not found: src/pages/flows/v9/${FEATURE_NAME}.tsx"
  exit 1
fi

# Check if source file exists
if [ -f "src/pages/flows/v7/${FEATURE_NAME}V7.tsx" ]; then
  SOURCE_FILE="src/pages/flows/v7/${FEATURE_NAME}V7.tsx"
elif [ -f "src/v8/flows/${FEATURE_NAME}V8.tsx" ]; then
  SOURCE_FILE="src/v8/flows/${FEATURE_NAME}V8.tsx"
elif [ -f "src/pages/flows/${FEATURE_NAME}V7.tsx" ]; then
  SOURCE_FILE="src/pages/flows/${FEATURE_NAME}V7.tsx"
elif [ -f "src/pages/flows/JWTBearerTokenFlowV7.tsx" ] && [ "$FEATURE_NAME" = "JWTBearerTokenFlowV9" ]; then
  SOURCE_FILE="src/pages/flows/JWTBearerTokenFlowV7.tsx"
elif [ -f "src/pages/flows/OAuthROPCFlowV7.tsx" ] && [ "$FEATURE_NAME" = "MFALoginHintFlowV9" ]; then
  SOURCE_FILE="src/pages/flows/MFALoginHintFlowV7.tsx"
elif [ -f "src/pages/flows/OAuthROPCFlowV7.tsx" ] && [ "$FEATURE_NAME" = "OAuthROPCFlowV9" ]; then
  SOURCE_FILE="src/pages/flows/OAuthROPCFlowV7.tsx"
else
  echo "❌ Source file not found"
  exit 1
fi

V9_FILE="src/pages/flows/v9/${FEATURE_NAME}.tsx"

echo "📊 Comparing implementations..."

# Compare basic metrics
SOURCE_LINES=$(wc -l < "$SOURCE_FILE")
V9_LINES=$(wc -l < "$V9_FILE")

SOURCE_IMPORTS=$(grep -c "^import" "$SOURCE_FILE")
V9_IMPORTS=$(grep -c "^import" "$V9_FILE")

SOURCE_FUNCTIONS=$(grep -c "const.*=" "$SOURCE_FILE")
V9_FUNCTIONS=$(grep -c "const.*=" "$V9_FILE")

echo "📈 Comparison Metrics:"
echo "   Lines: $SOURCE_LINES → $V9_LINES ($((V9_LINES * 100 / SOURCE_LINES))% of original)"
echo "   Imports: $SOURCE_IMPORTS → $V9_IMPORTS"
echo "   Functions: $SOURCE_FUNCTIONS → $V9_FUNCTIONS"

# Check for critical patterns
echo "🔍 Checking parity..."

# Check if V9 uses modern messaging
if grep -q "modernMessaging" "$V9_FILE"; then
  echo "   ✅ Uses V9 modern messaging"
else
  echo "   ⚠️  Missing V9 modern messaging"
fi

# Check if V9 has proper imports
if grep -q "V9FlowHeader" "$V9_FILE"; then
  echo "   ✅ Uses V9 flow header"
else
  echo "   ⚠️  Missing V9 flow header"
fi

# Check for accessibility
if grep -q "onKeyDown\|aria-" "$V9_FILE"; then
  echo "   ✅ Has accessibility features"
else
  echo "   ⚠️  May need accessibility improvements"
fi

# Test build
echo "📦 Testing build..."
if npm run build > /dev/null 2>&1; then
  echo "   ✅ Build successful"
else
  echo "   ❌ Build failed"
  exit 1
fi

# Test linting
echo "🧹 Testing linting..."
if npx biome check "$V9_FILE" --max-diagnostics 5 > /dev/null 2>&1; then
  echo "   ✅ Linting clean"
else
  echo "   ⚠️  Linting issues found"
  npx biome check "$V9_FILE" --max-diagnostics 5
fi

echo "🎯 MIGRATION PARITY TEST COMPLETE"
