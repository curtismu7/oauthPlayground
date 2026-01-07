#!/bin/bash
# Script to create MobileFlowV8.tsx and MobileOTPConfigurationPageV8.tsx from SMS versions
# Run: bash create-mobile-files-now.sh

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

# Create MobileFlowV8.tsx using Node.js for better string replacement
echo "Creating $MOBILE_FLOW..."
node -e "
const fs = require('fs');
let content = fs.readFileSync('$SMS_FLOW', 'utf8');
content = content
  .replace(/SMSFlowV8/g, 'MobileFlowV8')
  .replace(/SMS-FLOW-V8/g, 'MOBILE-FLOW-V8')
  .replace(/deviceType=\"SMS\"/g, 'deviceType=\"MOBILE\"')
  .replace(/deviceType: 'SMS'/g, \"deviceType: 'MOBILE'\")
  .replace(/SMSDeviceSelectionStep/g, 'MobileDeviceSelectionStep')
  .replace(/SMSFlowV8WithDeviceSelection/g, 'MobileFlowV8WithDeviceSelection')
  .replace(/SMSConfigureStep/g, 'MobileConfigureStep')
  .replace(/\/v8\/mfa\/register\/sms\/device/g, '/v8/mfa/register/mobile/device')
  .replace(/\/v8\/mfa\/register\/sms/g, '/v8/mfa/register/mobile');
fs.writeFileSync('$MOBILE_FLOW', content, 'utf8');
console.log('✓ Created $MOBILE_FLOW');
"

# Create MobileOTPConfigurationPageV8.tsx
echo "Creating $MOBILE_CONFIG..."
node -e "
const fs = require('fs');
let content = fs.readFileSync('$SMS_CONFIG', 'utf8');
content = content
  .replace(/SMSOTPConfigurationPageV8/g, 'MobileOTPConfigurationPageV8')
  .replace(/SMS-OTP-CONFIG-V8/g, 'MOBILE-OTP-CONFIG-V8')
  .replace(/deviceType: 'SMS'/g, \"deviceType: 'MOBILE'\")
  .replace(/deviceType=\"SMS\"/g, 'deviceType=\"MOBILE\"')
  .replace(/deviceTypeLabel=\"SMS\"/g, 'deviceTypeLabel=\"Mobile\"')
  .replace(/SMS \/ OTP Configuration/g, 'Mobile / OTP Configuration')
  .replace(/SMS\/OTP Configuration/g, 'Mobile\/OTP Configuration')
  .replace(/SMS device registration/g, 'Mobile device registration')
  .replace(/SMS MFA settings/g, 'Mobile MFA settings')
  .replace(/About SMS \/ OTP Authentication/g, 'About Mobile / OTP Authentication')
  .replace(/SMS-based OTP/g, 'Mobile-based OTP')
  .replace(/\/v8\/mfa\/register\/sms\/device/g, '/v8/mfa/register/mobile/device')
  .replace(/\/v8\/mfa\/register\/sms/g, '/v8/mfa/register/mobile');
fs.writeFileSync('$MOBILE_CONFIG', content, 'utf8');
console.log('✓ Created $MOBILE_CONFIG');
"

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

