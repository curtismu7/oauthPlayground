#!/bin/bash

# scripts/validation-dashboard.sh

clear
echo "🎯 MIGRATION VALIDATION DASHBOARD"
echo "=================================="

while true; do
  # Get current timestamp
  TIMESTAMP=$(date '+%H:%M:%S')
  
  # Check build status
  if npm run build > /dev/null 2>&1; then
    BUILD="✅ BUILD: OK"
  else
    BUILD="❌ BUILD: FAILED"
  fi
  
  # Check lint status
  if npx biome check src/ --max-diagnostics 1 > /dev/null 2>&1; then
    LINT="✅ LINT: CLEAN"
  else
    LINT_ERRORS=$(npx biome check src/ --max-diagnostics 1 2>&1 | grep -c "error" || echo "0")
    LINT="⚠️  LINT: $LINT_ERRORS errors"
  fi
  
  # Check TypeScript status
  if npx tsc --noEmit > /dev/null 2>&1; then
    TS="✅ TS: OK"
  else
    TS_ERRORS=$(npx tsc --noEmit 2>&1 | grep -c "error" || echo "0")
    TS="⚠️  TS: $TS_ERRORS errors"
  fi
  
  # Check dev server
  if pgrep -f "vite" > /dev/null; then
    DEV="✅ DEV: RUNNING"
  else
    DEV="❌ DEV: STOPPED"
  fi
  
  # Display status
  echo "[$TIMESTAMP] $BUILD | $LINT | $TS | $DEV"
  
  sleep 5
done
