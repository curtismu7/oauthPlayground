#!/bin/bash

###############################################################################
# Script to verify and commit changes including run.sh
###############################################################################

set -e  # Exit on error

echo "🔍 Verifying repository state..."

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Error: Not in a git repository"
    exit 1
fi

# Check if run.sh exists
if [ ! -f "run.sh" ]; then
    echo "❌ Error: run.sh not found in current directory"
    exit 1
fi

echo "✅ run.sh exists"

# Check if run.sh is tracked
if git ls-files --error-unmatch run.sh > /dev/null 2>&1; then
    echo "✅ run.sh is already tracked in git"
else
    echo "⚠️  run.sh is NOT tracked in git - will add it"
    git add run.sh
    echo "✅ Added run.sh to staging"
fi

# Check for uncommitted changes
echo ""
echo "📋 Checking for uncommitted changes..."
git status --short

# Check if there are any changes to commit
if [ -z "$(git status --porcelain)" ]; then
    echo ""
    echo "✅ No uncommitted changes - repository is clean"
    exit 0
fi

# Show what will be committed
echo ""
echo "📦 Files to be committed:"
git diff --cached --name-only 2>/dev/null || echo "  (no staged changes)"
git diff --name-only 2>/dev/null || echo "  (no unstaged changes)"

# Ask for confirmation (if running interactively)
if [ -t 0 ]; then
    echo ""
    read -p "🤔 Do you want to commit these changes? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Commit cancelled"
        exit 0
    fi
fi

# Stage all changes
echo ""
echo "📝 Staging all changes..."
git add -A

# Commit with descriptive message
echo ""
echo "💾 Committing changes..."
git commit -m "Fix: Extract publicKeyCredentialRequestOptions from ASSERTION_REQUIRED + Add run.sh

- Extract and store publicKeyCredentialRequestOptions when initializeDeviceAuthentication returns ASSERTION_REQUIRED
- Ensures navigator.credentials.get() uses PingOne's generated options
- Add run.sh to repository (critical startup script)"

echo "✅ Commit successful"

# Show commit details
echo ""
echo "📊 Latest commit:"
git log -1 --stat

# Ask about pushing (if running interactively)
if [ -t 0 ]; then
    echo ""
    read -p "🚀 Do you want to push to GitHub? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        echo "⬆️  Pushing to GitHub..."
        git push origin HEAD
        echo "✅ Push successful"
    else
        echo "ℹ️  Skipping push - you can push manually with: git push origin HEAD"
    fi
else
    echo ""
    echo "ℹ️  Non-interactive mode - skipping push"
    echo "   Run 'git push origin HEAD' manually to push to GitHub"
fi

echo ""
echo "✅ All done!"

