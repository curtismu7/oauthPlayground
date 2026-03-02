#!/bin/bash

# scripts/test-baseline-health.sh

echo "🔍 BASELINE HEALTH CHECK"

# Check if app builds successfully
echo "📦 Testing current build..."
npm run build > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "✅ Current build: HEALTHY"
else
  echo "❌ Current build: BROKEN"
  exit 1
fi

# Check linting
echo "🧹 Testing linting..."
npx biome check src/ --max-diagnostics 5 > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "✅ Linting: CLEAN"
else
  echo "⚠️  Linting: ISSUES FOUND"
  npx biome check src/ --max-diagnostics 5
fi

# Check TypeScript
echo "📝 Testing TypeScript..."
npx tsc --noEmit > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "✅ TypeScript: VALID"
else
  echo "⚠️  TypeScript: ERRORS FOUND"
  npx tsc --noEmit
fi

# Check development server
echo "🌐 Testing development server..."
if pgrep -f "vite" > /dev/null; then
  echo "✅ Dev server: RUNNING"
else
  echo "⚠️  Dev server: NOT RUNNING"
fi

echo "🎯 BASELINE HEALTH CHECK COMPLETE"
