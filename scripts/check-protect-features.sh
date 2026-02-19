#!/bin/bash

# Protect Portal Feature Presence Check
# Prevent regressions in Protect Portal functionality

set -e

echo "🔍 Checking Protect Portal Feature Presence..."

# Check Protect Portal pages exist
PROTECT_PAGES=(
    "/v8/protect"
    "/protect"
)

for page in "${PROTECT_PAGES[@]}"; do
    if ! grep -r "path.*$page" src/ > /dev/null 2>&1; then
        echo "❌ Protect page route missing: $page"
        exit 1
    fi
done

# Check Protect Portal components exist
PROTECT_COMPONENTS=(
    "ProtectPortalApp"
    "AmericanAirlinesHero"
    "BankOfAmericaHero"
    "CorporateFooter"
)

for component in "${PROTECT_COMPONENTS[@]}"; do
    if ! find src/ -name "*$component*" -type f | grep -q .; then
        echo "❌ Protect component missing: $component"
        exit 1
    fi
done

# Check for key Protect functionality
echo "🔍 Checking Protect Portal functionality..."

# Check for authentication
if ! grep -r "authentication" src/pages/protect-portal/ | grep -q .; then
    echo "❌ Protect authentication missing"
    exit 1
fi

# Check for hero components
if ! find src/pages/protect-portal/components/ -name "*Hero*" -type f | grep -q .; then
    echo "❌ Protect hero components missing"
    exit 1
fi

# Check for footer
if ! grep -r "CorporateFooter" src/pages/protect-portal/ | grep -q .; then
    echo "❌ Protect footer missing"
    exit 1
fi

echo "✅ All Protect Portal features present"
exit 0
