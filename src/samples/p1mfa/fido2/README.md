# FIDO2 MFA Sample Application

This sample application demonstrates complete FIDO2/WebAuthn device registration and authentication flows using the P1MFA SDK.

## Prerequisites

1. **PingOne Environment Setup**
   - PingOne environment with MFA enabled
   - Device Authentication Policy configured for FIDO2
   - Worker token credentials (Client ID and Secret)

2. **Browser Support**
   - Modern browser with WebAuthn support:
     - Chrome 67+ (Windows, macOS, Android)
     - Firefox 60+ (Windows, macOS, Android)
     - Safari 13+ (macOS, iOS)
     - Edge 18+ (Windows, macOS)
   - HTTPS or localhost (required for WebAuthn)

3. **Hardware/Platform Support**
   - Platform authenticators: TouchID (macOS/iOS), FaceID (iOS), Windows Hello (Windows)
   - Security keys: YubiKey, Titan Security Key, etc.

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

### 2. Register FIDO2 Device

1. Navigate to the **Registration** tab
2. Enter required information:
   - **User ID**: The PingOne user ID to register the device for
   - **Policy ID**: Device Authentication Policy ID for FIDO2
3. Click **Register Device**
4. When prompted by your browser, complete the WebAuthn credential creation:
   - For platform authenticators: Use TouchID, FaceID, or Windows Hello
   - For security keys: Insert and activate your security key
5. The device will be automatically activated after credential creation

### 3. Authenticate with FIDO2 Device

1. Navigate to the **Authentication** tab
2. Enter required information:
   - **User ID**: The PingOne user ID to authenticate
   - **Policy ID**: Device Authentication Policy ID for FIDO2
   - **Device ID** (optional): Specific device to use, or leave blank to select from available devices
3. Click **Initialize Authentication**
4. When prompted by your browser, complete the WebAuthn assertion:
   - For platform authenticators: Use TouchID, FaceID, or Windows Hello
   - For security keys: Insert and activate your security key
5. Authentication will complete automatically

### 4. Manage Devices

1. Navigate to the **Devices** tab
2. Enter **User ID** and click **Load Devices**
3. View all registered devices for the user
4. Delete devices as needed

## Troubleshooting

### WebAuthn Not Supported

**Error**: "WebAuthn is not supported in this browser"

**Solution**:
- Use a modern browser (Chrome, Firefox, Safari, Edge)
- Ensure you're using HTTPS or localhost
- Check browser settings for WebAuthn/security key support

### Credential Creation Failed

**Error**: "Failed to create WebAuthn credential"

**Possible Causes**:
- User cancelled the WebAuthn prompt
- Hardware authenticator not available
- Browser security restrictions

**Solution**:
- Ensure platform authenticator is enabled (TouchID, FaceID, Windows Hello)
- For security keys, ensure the key is inserted and activated
- Check browser console for detailed error messages

### Device Registration Failed

**Error**: "Device registration failed"

**Possible Causes**:
- Invalid User ID
- Invalid Policy ID
- Policy not configured for FIDO2
- Worker token expired or invalid

**Solution**:
- Verify User ID exists in PingOne
- Verify Policy ID is correct and configured for FIDO2
- Re-initialize SDK with fresh credentials
- Check backend logs for detailed error messages

### Authentication Failed

**Error**: "Authentication failed"

**Possible Causes**:
- No registered devices for user
- Device not activated
- Wrong device selected
- WebAuthn assertion failed

**Solution**:
- Ensure user has at least one registered and activated FIDO2 device
- Verify Device ID is correct (or leave blank to select from available devices)
- Ensure you're using the same authenticator used during registration
- Check browser console for detailed error messages

## API Flow

### Registration Flow

1. **Register Device** → `POST /api/pingone/mfa/register-device`
   - Creates device record in PingOne
   - Returns `publicKeyCredentialCreationOptions`

2. **Create WebAuthn Credential** → `navigator.credentials.create()`
   - Browser WebAuthn API call
   - User authenticates with platform authenticator or security key

3. **Activate Device** → `POST /api/pingone/mfa/activate-device`
   - Sends WebAuthn credential to PingOne
   - Device status changes to `ACTIVE`

### Authentication Flow

1. **Initialize Authentication** → `POST /api/pingone/mfa/initialize-device-authentication`
   - Creates authentication challenge in PingOne
   - Returns authentication ID and challenge options

2. **Get WebAuthn Assertion** → `navigator.credentials.get()`
   - Browser WebAuthn API call
   - User authenticates with platform authenticator or security key

3. **Complete Authentication** → `POST /api/pingone/mfa/complete`
   - Sends WebAuthn assertion to PingOne
   - Returns authentication result (access token, etc.)

## Related Documentation

- [P1MFA SDK README](../../../sdk/p1mfa/README.md)
- [PingOne MFA API Documentation](https://apidocs.pingidentity.com/pingone/mfa/v1/api/)
- [WebAuthn Specification](https://www.w3.org/TR/webauthn-2/)
