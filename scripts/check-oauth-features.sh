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
    "device_code"
    "urn:ietf:params:oauth:grant-type:jwt-bearer"
)

for flow in "${OAUTH_FLOWS[@]}"; do
    if ! grep -r "$flow" src/ | grep -q .; then
        echo "❌ OAuth flow missing: $flow"
        exit 1
    fi
done

# Check for key OAuth functionality
echo "🔍 Checking OAuth functionality..."

# Check discovery endpoint
if ! grep -r "\.well-known/openid-configuration" src/ | grep -q .; then
    echo "❌ OAuth discovery endpoint missing"
    exit 1
fi

# Check token endpoint
if ! grep -r "/oauth/token" src/ | grep -q .; then
    echo "❌ OAuth token endpoint missing"
    exit 1
fi

# Check scopes handling
if ! grep -r "scope" src/ | grep -q .; then
    echo "❌ OAuth scope handling missing"
    exit 1
fi

echo "✅ All OAuth features present"
exit 0
