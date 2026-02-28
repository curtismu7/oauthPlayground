#!/bin/bash

# Script to create MobileFlowV8.tsx and MobileOTPConfigurationPageV8.tsx from SMS versions
# Run this script from the project root: bash create-mobile-files.sh

set -e

SRC_DIR="src/v8/flows/types"
SMS_FLOW="$SRC_DIR/SMSFlowV8.tsx"
SMS_CONFIG="$SRC_DIR/SMSOTPConfigurationPageV8.tsx"
MOBILE_FLOW="$SRC_DIR/MobileFlowV8.tsx"
MOBILE_CONFIG="$SRC_DIR/MobileOTPConfigurationPageV8.tsx"

echo "Creating Mobile flow files from SMS versions..."

# Check if source files exist
if [ ! -f "$SMS_FLOW" ]; then
    echo "ERROR: $SMS_FLOW not found"
    exit 1
fi

if [ ! -f "$SMS_CONFIG" ]; then
    echo "ERROR: $SMS_CONFIG not found"
    exit 1
fi

# Create MobileFlowV8.tsx
echo "Creating $MOBILE_FLOW..."
sed -e 's/SMSFlowV8/MobileFlowV8/g' \
    -e 's/SMS-FLOW-V8/MOBILE-FLOW-V8/g' \
    -e 's/deviceType="SMS"/deviceType="MOBILE"/g' \
    -e "s/deviceType: 'SMS'/deviceType: 'MOBILE'/g" \
    -e 's/SMSDeviceSelectionStep/MobileDeviceSelectionStep/g' \
    -e 's/SMSFlowV8WithDeviceSelection/MobileFlowV8WithDeviceSelection/g' \
    -e 's|/v8/mfa/register/sms/device|/v8/mfa/register/mobile/device|g' \
    -e 's|/v8/mfa/register/sms|/v8/mfa/register/mobile|g' \
    "$SMS_FLOW" > "$MOBILE_FLOW"

echo "✓ Created $MOBILE_FLOW"

# Create MobileOTPConfigurationPageV8.tsx
echo "Creating $MOBILE_CONFIG..."
sed -e 's/SMSOTPConfigurationPageV8/MobileOTPConfigurationPageV8/g' \
    -e 's/SMS-OTP-CONFIG-V8/MOBILE-OTP-CONFIG-V8/g' \
    -e "s/deviceType: 'SMS'/deviceType: 'MOBILE'/g" \
    -e 's/deviceType="SMS"/deviceType="MOBILE"/g' \
    -e 's/deviceTypeLabel="SMS"/deviceTypeLabel="Mobile"/g' \
    -e 's/SMS \/ OTP Configuration/Mobile \/ OTP Configuration/g' \
    -e 's/SMS\/OTP Configuration/Mobile\/OTP Configuration/g' \
    -e 's/SMS device registration/Mobile device registration/g' \
    -e 's/SMS MFA settings/Mobile MFA settings/g' \
    -e 's/About SMS \/ OTP Authentication/About Mobile \/ OTP Authentication/g' \
    -e 's/SMS-based OTP/Mobile-based OTP/g' \
    -e 's|/v8/mfa/register/sms/device|/v8/mfa/register/mobile/device|g' \
    -e 's|/v8/mfa/register/sms|/v8/mfa/register/mobile|g' \
    "$SMS_CONFIG" > "$MOBILE_CONFIG"

echo "✓ Created $MOBILE_CONFIG"

echo ""
echo "✅ All Mobile files created successfully!"
echo ""
echo "Files created:"
echo "  - $MOBILE_FLOW"
echo "  - $MOBILE_CONFIG"
echo ""
echo "Please verify the exports match what App.tsx expects:"
echo "  - export const MobileFlowV8"
echo "  - export const MobileOTPConfigurationPageV8"

