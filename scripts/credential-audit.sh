#!/bin/bash

echo "🔍 Credential Storage Security Audit"
echo "=================================="

echo ""
echo "📋 Checking for Environment Variable Credentials (PP-008):"

# Check for VITE environment variables in config files
echo "1. Checking for VITE_ environment variables..."
if grep -r "VITE_" src/pages/protect-portal/config/ 2>/dev/null; then
    echo "❌ FOUND: Environment variables used for credentials"
    grep -r "VITE_" src/pages/protect-portal/config/ 2>/dev/null
else
    echo "✅ No VITE_ environment variables found"
fi

echo ""
echo "2. Checking for import.meta.env usage..."
if grep -r "import\.meta\.env" src/pages/protect-portal/config/ 2>/dev/null; then
    echo "❌ FOUND: import.meta.env used for credentials"
    grep -r "import\.meta\.env" src/pages/protect-portal/config/ 2>/dev/null
else
    echo "✅ No import.meta.env usage found"
fi

echo ""
echo "3. Checking for hardcoded credentials..."
if grep -r "your-.*-id\|your-.*-secret\|your-.*-token" src/pages/protect-portal/ 2>/dev/null; then
    echo "❌ FOUND: Hardcoded credential placeholders"
    grep -r "your-.*-id\|your-.*-secret\|your-.*-token" src/pages/protect-portal/ 2>/dev/null
else
    echo "✅ No hardcoded credentials found"
fi

echo ""
echo "📋 Checking for Secure Storage Implementation:"

echo "4. Checking for IndexedDB usage..."
if grep -r "indexedDB\|IndexedDB" src/pages/protect-portal/services/ 2>/dev/null; then
    echo "✅ IndexedDB implementation found"
else
    echo "❌ MISSING: IndexedDB not implemented"
fi

echo ""
echo "5. Checking for SQLite usage..."
if grep -r "sqlite\|SQLite" src/pages/protect-portal/services/ 2>/dev/null; then
    echo "✅ SQLite implementation found"
else
    echo "❌ MISSING: SQLite not implemented"
fi

echo ""
echo "6. Checking for encryption implementation..."
if grep -r "encrypt\|decrypt\|crypto" src/pages/protect-portal/services/ 2>/dev/null; then
    echo "✅ Encryption implementation found"
else
    echo "❌ MISSING: Encryption not implemented"
fi

echo ""
echo "📊 Summary:"
echo "- Environment variables for credentials: ❌ SECURITY RISK"
echo "- Secure storage (IndexedDB/SQLite): ❌ NOT IMPLEMENTED"
echo "- Encryption: ❌ NOT IMPLEMENTED"
echo ""
echo "🔴 CRITICAL: Issue PP-008 confirmed - Credential storage architecture violation"
