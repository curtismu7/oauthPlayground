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
    "PortalPageLayout"
    "RiskEvaluationDisplay"
)

for component in "${PROTECT_COMPONENTS[@]}"; do
    if ! find src/ -name "*$component*" -type f | grep -q .; then
        echo "❌ Protect component missing: $component"
        exit 1
    fi
done

# Check Protect Portal services exist
PROTECT_SERVICES=(
    "pingOneLoginService"
    "riskEvaluationService"
    "mfaAuthenticationService"
)

for service in "${PROTECT_SERVICES[@]}"; do
    if ! find src/ -name "*$service*" -type f | grep -q .; then
        echo "❌ Protect service missing: $service"
        exit 1
    fi
done

# Check for key Protect Portal functionality
echo "🔍 Checking Protect Portal functionality..."

# Check authentication functionality
if ! grep -r "authentication" src/apps/protect/ | grep -q .; then
    echo "❌ Protect authentication functionality missing"
    exit 1
fi

# Check risk evaluation functionality
if ! grep -r "risk" src/apps/protect/ | grep -q .; then
    echo "❌ Protect risk evaluation functionality missing"
    exit 1
fi

# Check theme functionality
if ! grep -r "theme" src/apps/protect/ | grep -q .; then
    echo "❌ Protect theme functionality missing"
    exit 1
fi

echo "✅ All Protect Portal features present"
exit 0
