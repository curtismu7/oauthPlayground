#!/bin/bash

# Comprehensive App Feature Presence Check
# Prevent regressions in all app functionality

set -e

echo "🚀 Running comprehensive feature checks for all apps..."

# Run all individual app feature checks
echo ""
echo "📱 MFA App Features:"
./scripts/check-mfa-features.sh

echo ""
echo "🔐 OAuth App Features:"
./scripts/check-oauth-features.sh

echo ""
echo "🛡️  Protect Portal App Features:"
./scripts/check-protect-features.sh

echo ""
echo "👥 User Management App Features:"
./scripts/check-user-management-features.sh

echo ""
echo "⚙️  Admin App Features:"
./scripts/check-admin-features.sh

echo ""
echo "🧭 Navigation App Features:"
./scripts/check-navigation-features.sh

echo ""
echo "✅ All app feature checks completed successfully!"
echo ""
echo "📊 Summary:"
echo "  - MFA App: ✅ All features present"
echo "  - OAuth App: ✅ All features present"
echo "  - Protect Portal App: ✅ All features present"
echo "  - User Management App: ✅ All features present"
echo "  - Admin App: ✅ All features present"
echo "  - Navigation App: ✅ All features present (with optional items noted)"
echo ""
echo "🎯 Ready for Phase 2: Consolidate V8+ code by app"

exit 0
