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
git add src/mfa/components/MFADocumentationPageV8.tsx
git add src/mfa/components/SuperSimpleApiDisplayV8.tsx
git add src/mfa/flows/MFAAuthenticationMainPageV8.tsx
git add src/mfa/flows/MFAConfigurationPageV8.tsx
git add src/mfa/flows/MFAReportingFlowV8.tsx
git add src/mfa/flows/components/MFAOTPInput.tsx
git add src/mfa/flows/controllers/FIDO2FlowController.ts
git add src/mfa/flows/controllers/MFAFlowController.ts
git add src/mfa/flows/shared/MFAFlowBaseV8.tsx
git add src/mfa/flows/types/EmailFlowV8.tsx
git add src/mfa/flows/types/FIDO2ConfigurationPageV8.tsx
git add src/mfa/flows/types/FIDO2FlowV8.tsx
git add src/mfa/flows/types/SMSFlowV8.tsx
git add src/mfa/flows/types/TOTPFlowV8.tsx
git add src/mfa/flows/types/WhatsAppFlowV8.tsx
git add src/mfa/services/mfaAuthenticationServiceV8.ts
git add src/mfa/services/mfaConfigurationServiceV8.ts
git add src/mfa/services/mfaReportingServiceV8.ts
git add src/mfa/services/mfaServiceV8.ts
git add src/mfa/utils/analyticsLoggerV8.ts

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

