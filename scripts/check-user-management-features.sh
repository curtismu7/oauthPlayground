#!/bin/bash

# User Management Feature Presence Check
# Prevent regressions in User Management functionality

set -e

echo "🔍 Checking User Management Feature Presence..."

# Check User Management pages exist
USER_MGMT_PAGES=(
    "/user-management"
    "/user-management/pages"
)

for page in "${USER_MGMT_PAGES[@]}"; do
    if ! grep -r "UserManagement" src/ | grep -q .; then
        echo "❌ User Management page missing: $page"
        exit 1
    fi
done

# Check User Management components exist
USER_MGMT_COMPONENTS=(
    "UserManagementApp"
    "UserManagementPage"
    "UserInfoSuccessModalV8U"
    "UserTokenStatusDisplayV8U"
    "UserManagementContext"
)

for component in "${USER_MGMT_COMPONENTS[@]}"; do
    if ! find src/apps/user-management/ -name "*$component*" -type f | grep -q .; then
        echo "❌ User Management component missing: $component"
        exit 1
    fi
done

# Check User Management contexts exist
USER_MGMT_CONTEXTS=(
    "UserManagementContext"
)

for context in "${USER_MGMT_CONTEXTS[@]}"; do
    if ! find src/apps/user-management/contexts/ -name "*$context*" -type f | grep -q .; then
        echo "❌ User Management context missing: $context"
        exit 1
    fi
done

# Check for key User Management functionality
echo "🔍 Checking User Management functionality..."

# Check user info display functionality
if ! grep -r "UserInfo" src/apps/user-management/ | grep -q .; then
    echo "❌ User info functionality missing"
    exit 1
fi

# Check token status functionality
if ! grep -r "TokenStatus" src/apps/user-management/ | grep -q .; then
    echo "❌ Token status functionality missing"
    exit 1
fi

# Check user management context usage
if ! grep -r "UserManagementContext" src/apps/user-management/ | grep -q .; then
    echo "❌ User management context usage missing"
    exit 1
fi

echo "✅ All User Management features present"
exit 0
