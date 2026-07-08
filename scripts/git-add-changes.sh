#!/bin/bash

###############################################################################
# Script to add all relevant changes to git staging area
# Excludes: PID files, log files, and other ignored files
###############################################################################

set -e  # Exit on error

echo "📦 Adding changes to git staging area..."

# Explicitly exclude PID and log files
echo ""
echo "🚫 Excluding PID and log files..."
git restore --staged .backend.pid .frontend.pid logs/server.log 2>/dev/null || true
git restore .backend.pid .frontend.pid logs/server.log 2>/dev/null || true

# Add all modified source files (excluding PID and log files)
echo ""
echo "📝 Adding modified source files..."

# Source files that were modified
git add server.js
git add src/services/apiCallTrackerService.ts
git add src/mfa/components/MFADocumentationPage.tsx
git add src/mfa/components/SuperSimpleApiDisplay.tsx
git add src/mfa/flows/MFAAuthenticationMainPage.tsx
git add src/mfa/flows/MFAConfigurationPage.tsx
git add src/mfa/flows/MFAReportingFlow.tsx
git add src/mfa/flows/components/MFAOTPInput.tsx
git add src/mfa/flows/controllers/FIDO2FlowController.ts
git add src/mfa/flows/controllers/MFAFlowController.ts
git add src/mfa/flows/shared/MFAFlowBase.tsx
git add src/mfa/flows/types/EmailFlow.tsx
git add src/mfa/flows/types/FIDO2ConfigurationPage.tsx
git add src/mfa/flows/types/FIDO2Flow.tsx
git add src/mfa/flows/types/SMSFlow.tsx
git add src/mfa/flows/types/TOTPFlow.tsx
git add src/mfa/flows/types/WhatsAppFlow.tsx
git add src/mfa/services/mfaAuthenticationService.ts
git add src/mfa/services/mfaConfigurationService.ts
git add src/mfa/services/mfaReportingService.ts
git add src/mfa/services/mfaService.ts
git add src/mfa/utils/analyticsLogger.ts

echo "✅ Source files added"

# Add all new documentation and script files
echo ""
echo "📚 Adding new documentation and script files..."

git add SETUP_NEW_MACHINE.md
git add docs/MFA_API_REFERENCE.md
git add docs/MFA_FIDO2_MASTER.md
git add docs/MFA_FIDO2_UI_CONTRACT.md
git add docs/MFA_FIDO2_UI_DOC.md
git add docs/MFA_OTP_TOTP_MASTER.md
git add fix-linting.sh
git add verify-and-commit.sh

echo "✅ Documentation and scripts added"

# Verify PID and log files are NOT staged
echo ""
echo "🔍 Verifying PID and log files are NOT staged..."
if git diff --cached --name-only | grep -E "(\.pid|\.log|logs/)" > /dev/null; then
    echo "⚠️  WARNING: PID or log files found in staging area! Removing them..."
    git restore --staged .backend.pid .frontend.pid logs/server.log 2>/dev/null || true
    echo "✅ Removed PID and log files from staging"
else
    echo "✅ Confirmed: No PID or log files in staging area"
fi

# Show what's staged
echo ""
echo "📋 Files staged for commit:"
git status --short | grep "^[AM]" | head -30

# Show what's NOT staged (should only be PID and log files)
echo ""
echo "⚠️  Files NOT staged (intentionally excluded - PID and log files):"
git status --short | grep "^ M" | grep -E "(\.pid|\.log|logs/)" || echo "  (none - all excluded files are properly ignored)"

# Summary
echo ""
echo "✅ All relevant files added to staging area!"
echo ""
echo "📊 Summary:"
STAGED_COUNT=$(git diff --cached --name-only | wc -l | tr -d ' ')
echo "  Files staged: $STAGED_COUNT"
echo ""
echo "💡 Next steps:"
echo "  1. Review changes: git diff --cached"
echo "  2. Commit: git commit -m 'Your commit message'"
echo "  3. Push: git push origin HEAD"

