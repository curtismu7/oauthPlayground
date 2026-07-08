#!/bin/bash

# Test for WorkerTokenStatusService import regression
# This script checks that the import is properly included in CredentialsFormV8U.tsx

echo "🧪 Testing WorkerTokenStatusService Import Regression"
echo "=================================================="

# Test 1: Check if import exists in CredentialsFormV8U.tsx
echo "📋 Checking import in CredentialsFormV8U.tsx..."

if grep -q "import.*WorkerTokenStatusService.*from.*@/v8/services/workerTokenStatusService" src/lab/components/CredentialsFormV8U.tsx; then
    echo "✅ Import found in CredentialsFormV8U.tsx"
else
    echo "❌ Import NOT found in CredentialsFormV8U.tsx"
    echo "🔍 Searching for any WorkerTokenStatusService usage..."
    if grep -n "WorkerTokenStatusService" src/lab/components/CredentialsFormV8U.tsx; then
        echo "⚠️  Usage found but import missing - REGRESSION DETECTED"
        exit 1
    else
        echo "ℹ️  No usage found - may have been refactored"
    fi
fi

# Test 2: Check if the service file exists
echo ""
echo "📋 Checking if service file exists..."

if [ -f "src/mfa/services/workerTokenStatusService.ts" ]; then
    echo "✅ Service file exists: src/mfa/services/workerTokenStatusService.ts"
else
    echo "❌ Service file NOT found"
    exit 1
fi

# Test 3: Check if service exports correctly
echo ""
echo "📋 Checking service exports..."

if grep -q "export.*WorkerTokenStatusService" src/mfa/services/workerTokenStatusService.ts; then
    echo "✅ Service exports WorkerTokenStatusService"
else
    echo "❌ Service does NOT export WorkerTokenStatusService"
    exit 1
fi

# Test 4: Check if build succeeds
echo ""
echo "📋 Testing build..."

if npm run build > /dev/null 2>&1; then
    echo "✅ Build succeeds"
else
    echo "❌ Build FAILED - likely import issue"
    exit 1
fi

# Test 5: Check for import-related errors only
echo ""
echo "📋 Checking for import-related errors..."

# Check if there are any "is not defined" errors related to WorkerTokenStatusService
if grep -r "WorkerTokenStatusService.*is not defined" src/lab/components/ > /dev/null 2>&1; then
    echo "❌ 'WorkerTokenStatusService is not defined' errors found"
    exit 1
else
    echo "✅ No 'WorkerTokenStatusService is not defined' errors"
fi

echo ""
echo "🎉 All WorkerTokenStatusService import tests PASSED!"
echo "✅ No regression detected"

exit 0
