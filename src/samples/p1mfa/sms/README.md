# SMS MFA Sample Application

This sample application demonstrates complete SMS device registration and authentication flows using the P1MFA SDK.

## Prerequisites

1. **PingOne Environment Setup**
   - PingOne environment with MFA enabled
   - Device Authentication Policy configured for SMS
   - SMS provider configured in PingOne
   - Worker token credentials (Client ID and Secret)

2. **Phone Number**
   - Valid phone number that can receive SMS messages
   - Phone number format: `+1.5125201234` (country code + area code + number)

## Step-by-Step Guide

### 1. Configure Credentials

1. Navigate to the **Credentials** tab
2. Enter your PingOne configuration:
   - **Environment ID**: Your PingOne environment ID
   - **Client ID**: Worker token client ID
   - **Client Secret**: Worker token client secret
   - **Region**: PingOne region (us, eu, ap, ca)
   - **Token Endpoint Auth Method**: Authentication method (default: client_secret_post)
3. Click **Initialize SDK**

### 2. Register SMS Device

1. Navigate to the **Registration** tab
2. Enter required information:
   - **User ID**: The PingOne user ID to register the device for
   - **Phone Number**: Phone number in format `+1.5125201234` or `15125201234`
3. Click **Register Device**
4. Wait for OTP code to be sent to your phone (automatic)
5. Enter the OTP code received via SMS
6. Click **Activate Device**
7. Device will be activated and ready for authentication

### 3. Authenticate with SMS Device

1. Navigate to the **Authentication** tab
2. Enter required information:
   - **User ID**: The PingOne user ID to authenticate
   - **Policy ID**: Device Authentication Policy ID for SMS
   - **Device ID** (optional): Specific device to use, or leave blank to select from available devices
3. Click **Initialize Authentication**
4. OTP code will be automatically sent to your registered phone number
5. Enter the OTP code received via SMS
6. Click **Complete Authentication**
7. Authentication will complete and return access token

### 4. Manage Devices

1. Navigate to the **Devices** tab
2. Enter **User ID** and click **Load Devices**
3. View all registered devices for the user
4. Delete devices as needed

## Troubleshooting

### Phone Number Format

**Error**: "Invalid phone number format"

**Solution**:
- Use format: `+1.5125201234` (country code + area code + number)
- Or format: `15125201234` (will be normalized automatically)
- Ensure country code is included

### OTP Not Received

**Error**: "OTP code not received"

**Possible Causes**:
- SMS provider not configured in PingOne
- Invalid phone number
- SMS delivery delay
- Phone number not verified

**Solution**:
- Verify SMS provider is configured in PingOne Admin Console
- Verify phone number is correct and can receive SMS
- Wait a few moments for SMS delivery (can take 30-60 seconds)
- Check PingOne logs for SMS delivery status
- Try resending OTP if available

### Device Registration Failed

**Error**: "Device registration failed"

**Possible Causes**:
- Invalid User ID
- Invalid phone number
- SMS provider not configured
- Worker token expired or invalid

**Solution**:
- Verify User ID exists in PingOne
- Verify phone number format is correct
- Verify SMS provider is configured in PingOne
- Re-initialize SDK with fresh credentials
- Check backend logs for detailed error messages

### Authentication Failed

**Error**: "Authentication failed" or "Invalid OTP"

**Possible Causes**:
- No registered devices for user
- Device not activated
- Wrong OTP code entered
- OTP code expired

**Solution**:
- Ensure user has at least one registered and activated SMS device
- Verify OTP code is correct (check for typos)
- OTP codes typically expire after 5-10 minutes
- Request a new OTP code if expired
- Verify Device ID is correct (or leave blank to select from available devices)

### OTP Resend

If you need to resend the OTP code:
- During registration: Re-register the device (will send new OTP)
- During authentication: Re-initialize authentication (will send new OTP)

## API Flow

### Registration Flow

1. **Register Device** → `POST /api/pingone/mfa/register-device`
   - Creates device record in PingOne with phone number
   - Device status: `ACTIVATION_REQUIRED`
   - OTP is automatically sent to phone number

2. **Activate Device** → `POST /api/pingone/mfa/activate-device`
   - Sends OTP code to PingOne
   - Device status changes to `ACTIVE`

### Authentication Flow

1. **Initialize Authentication** → `POST /api/pingone/mfa/initialize-device-authentication`
   - Creates authentication challenge in PingOne
   - OTP is automatically sent to registered phone number
   - Returns authentication ID

2. **Complete Authentication** → `POST /api/pingone/mfa/complete`
   - Sends OTP code to PingOne
   - Returns authentication result (access token, etc.)

## Phone Number Normalization

The SDK automatically normalizes phone numbers to PingOne format:
- Input: `15125201234` → Output: `+1.5125201234`
- Input: `+15125201234` → Output: `+1.5125201234`
- Input: `(512) 520-1234` → Output: `+1.5125201234`

## Related Documentation

- [P1MFA SDK README](../../../sdk/p1mfa/README.md)
- [PingOne MFA API Documentation](https://apidocs.pingidentity.com/pingone/mfa/v1/api/)
- [PingOne SMS Configuration Guide](https://docs.pingidentity.com/)
