#!/bin/bash

# scripts/test-quick-check.sh

echo "⚡ QUICK VALIDATION CHECK"

# Test build
echo "📦 Testing build..."
npm run build > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "✅ Build: SUCCESS"
else
  echo "❌ Build: FAILED"
  exit 1
fi

# Test linting
echo "🧹 Testing linting..."
npx biome check src/ --max-diagnostics 5 > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "✅ Linting: CLEAN"
else
  echo "⚠️  Linting: ISSUES FOUND"
  npx biome check src/ --max-diagnostics 5
fi

# Test TypeScript
echo "📝 Testing TypeScript..."
npx tsc --noEmit > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "✅ TypeScript: VALID"
else
  echo "⚠️  TypeScript: ERRORS FOUND"
  npx tsc --noEmit
fi

echo "🎯 QUICK CHECK COMPLETE"
