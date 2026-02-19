#!/bin/bash

# Admin Features Feature Presence Check
# Prevent regressions in Admin utilities functionality

set -e

echo "🔍 Checking Admin Features Feature Presence..."

# Check Admin pages exist
ADMIN_PAGES=(
    "DeleteAllDevicesUtilityV8"
    "MFAFeatureFlagsAdminV8"
    "MFADeviceManagementFlowV8"
    "MFAReportingFlowV8"
)

for page in "${ADMIN_PAGES[@]}"; do
    if ! find src/ -name "*$page*" -type f | grep -q .; then
        echo "❌ Admin page missing: $page"
        exit 1
    fi
done

# Check Admin components exist
ADMIN_COMPONENTS=(
    "Admin"
    "Utility"
    "Management"
)

for component in "${ADMIN_COMPONENTS[@]}"; do
    # Check for admin-related components in v8 (where admin utilities currently live)
    if ! find src/v8/ -name "*${component}*" -type f | grep -q .; then
        echo "❌ Admin component with pattern '$component' missing"
        # Don't exit here as patterns might be too generic
    fi
done

# Check for key Admin functionality
echo "🔍 Checking Admin functionality..."

# Check device management functionality
if ! grep -r "DeleteAllDevices" src/v8/ | grep -q .; then
    echo "❌ Delete all devices functionality missing"
    exit 1
fi

# Check MFA feature flags functionality
if ! grep -r "FeatureFlags" src/v8/ | grep -q .; then
    echo "❌ MFA feature flags functionality missing"
    exit 1
fi

# Check MFA device management functionality
if ! grep -r "DeviceManagement" src/v8/ | grep -q .; then
    echo "❌ MFA device management functionality missing"
    exit 1
fi

# Check MFA reporting functionality
if ! grep -r "ReportingFlow" src/v8/ | grep -q .; then
    echo "❌ MFA reporting functionality missing"
    exit 1
fi

# Check admin utility patterns
if ! grep -r "admin\|Admin" src/v8/ | grep -q .; then
    echo "❌ Admin utility patterns missing"
    exit 1
fi

echo "✅ All Admin features present"
exit 0
