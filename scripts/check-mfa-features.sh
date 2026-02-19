#!/bin/bash

# MFA Feature Presence Check
# Prevent regressions in MFA functionality

set -e

echo "🔍 Checking MFA Feature Presence..."

# Check MFA pages exist
MFA_PAGES=(
    "/v8/unified-mfa"
    "/v8/mfa-config" 
    "/v8/mfa-device-management"
    "/v8/mfa/register/fido2"
    "/v8/mfa/register/mobile"
    "/flows/mfa"
    "/flows/mfa-v8"
)

for page in "${MFA_PAGES[@]}"; do
    if ! grep -r "path.*$page" src/ > /dev/null 2>&1; then
        echo "❌ MFA page route missing: $page"
        exit 1
    fi
done

# Check MFA components exist
MFA_COMPONENTS=(
    "WorkerTokenStatusDisplayV8"
    "MFAFlowBaseV8" 
    "UnifiedMFARegistrationFlowV8"
)

for component in "${MFA_COMPONENTS[@]}"; do
    if ! find src/ -name "*$component*" -type f | grep -q .; then
        echo "❌ MFA component missing: $component"
        exit 1
    fi
done

# Check MFA services exist
MFA_SERVICES=(
    "mfaServiceV8"
    "unifiedWorkerTokenService"
    "credentialsServiceV8"
)

for service in "${MFA_SERVICES[@]}"; do
    if ! find src/ -name "*$service*" -type f | grep -q .; then
        echo "❌ MFA service missing: $service"
        exit 1
    fi
done

# Check for key MFA functionality
echo "🔍 Checking MFA functionality..."

# Check worker token modal exists
if ! grep -r "WorkerTokenModalV8" src/ | grep -q .; then
    echo "❌ WorkerTokenModalV8 missing"
    exit 1
fi

# Check MFA device types
DEVICE_TYPES=("SMS" "EMAIL" "TOTP" "FIDO2")
for device in "${DEVICE_TYPES[@]}"; do
    if ! grep -r "\"$device\"" src/v8/flows/ | grep -q .; then
        echo "❌ MFA device type missing: $device"
        exit 1
    fi
done

echo "✅ All MFA features present"
exit 0
