#!/bin/bash

# OAuth Feature Presence Check
# Prevent regressions in OAuth functionality

set -e

echo "🔍 Checking OAuth Feature Presence..."

# Check OAuth pages exist
OAUTH_PAGES=(
    "/flows/oauth"
    "/flows/oauth-implicit"
    "/v7m/oauth/authorization-code"
    "/v7m/oauth/ropc"
    "/v7m/oauth/device"
    "/flows/par"
)

for page in "${OAUTH_PAGES[@]}"; do
    if ! grep -r "path.*$page" src/ > /dev/null 2>&1; then
        echo "❌ OAuth page route missing: $page"
        exit 1
    fi
done

# Check OAuth components exist
OAUTH_COMPONENTS=(
    "OAuthAuthorizationCodeFlow"
    "OAuthImplicitFlow"
    "OAuthROPCFlow"
    "DeviceAuthorizationFlowV7"
    "PARFlow"
)

for component in "${OAUTH_COMPONENTS[@]}"; do
    if ! find src/ -name "*$component*" -type f | grep -q .; then
        echo "❌ OAuth component missing: $component"
        exit 1
    fi
done

# Check OAuth flows/grants
OAUTH_FLOWS=(
    "authorization_code"
    "implicit"
    "client_credentials"
    "device_authorization"
    "ropc"
    "pushed_authorization_request"
)

for flow in "${OAUTH_FLOWS[@]}"; do
    if ! grep -r "$flow" src/ | grep -q .; then
        echo "❌ OAuth flow missing: $flow"
        exit 1
    fi
done

# Check for key OAuth functionality
echo "🔍 Checking OAuth functionality..."

# Check token endpoint functionality
if ! grep -r "token.*endpoint" src/ | grep -q .; then
    echo "❌ Token endpoint functionality missing"
    exit 1
fi

# Check authorization endpoint functionality
if ! grep -r "authorization.*endpoint" src/ | grep -q .; then
    echo "❌ Authorization endpoint functionality missing"
    exit 1
fi

# Check scope handling
if ! grep -r "scope" src/ | grep -q .; then
    echo "❌ Scope handling missing"
    exit 1
fi

echo "✅ All OAuth features present"
exit 0
