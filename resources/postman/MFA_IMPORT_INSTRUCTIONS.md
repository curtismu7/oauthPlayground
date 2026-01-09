# PingOne MFA Postman Collection - Import Instructions

This directory contains example Postman files for testing all PingOne MFA device types.

## Files

1. **`pingone-mfa-complete-collection.json`** - Complete Postman collection with all MFA API calls
   - All device types: SMS, Email, WhatsApp, TOTP, FIDO2, Mobile
   - Grouped by: Registration and Authentication
   - Ready to import into Postman

2. **`pingone-mfa-environment-example.json`** - Example environment file with all variables
   - Pre-configured variables for all MFA flows
   - Includes placeholders for your actual values

## Quick Start

### Step 1: Import Collection

1. Open Postman
2. Click **Import** button (top left)
3. Select **File** tab
4. Click **Upload Files**
5. Select `pingone-mfa-complete-collection.json`
6. Click **Import**

You should now see:
- **PingOne MFA - Complete Collection** in your Collections sidebar
- Three main folders:
  - **Get Worker Token** (required first step)
  - **Registration** (with subfolders for each device type)
  - **Authentication** (with subfolders for each device type)

### Step 2: Import Environment

1. In Postman, click **Import** again
2. Select **File** tab
3. Click **Upload Files**
4. Select `pingone-mfa-environment-example.json`
5. Click **Import**

You should now see:
- **PingOne MFA - Example Environment** in your Environments sidebar

### Step 3: Select Environment

1. In Postman, click the **Environments** dropdown (top right)
2. Select **PingOne MFA - Example Environment**

### Step 4: Update Variables

1. Click the **eye icon** (👁️) next to the environment dropdown
2. Click **Edit** (pencil icon)
3. Update the following variables with your actual values:

#### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `authPath` | PingOne auth server URL | `https://auth.pingone.com` |
| `envID` | Your PingOne Environment ID | `b9817c16-1234-5678-9abc-def012345678` |
| `client_id` | OAuth Client ID for Client Credentials grant | `your-client-id` |
| `client_secret` | OAuth Client Secret for Client Credentials grant | `your-client-secret` |
| `username` | Username for MFA operations | `user@example.com` |
| `deviceAuthenticationPolicyId` | Your MFA policy ID | `policy-1234-5678-9abc-def012345678` |

**Note:** `workerToken` is automatically extracted from the "Get Worker Token" request - you don't need to set it manually!

#### Optional Variables (filled during flow)

| Variable | Description | When to Fill |
|----------|-------------|--------------|
| `userId` | User ID (UUID) | After user lookup |
| `deviceId` | Device ID (UUID) | After device registration |
| `deviceAuthenticationId` | Authentication ID (UUID) | After initializing authentication |
| `otp_code` | OTP code | When received via SMS/Email/WhatsApp |
| `phone` | Phone number | For SMS/WhatsApp/Mobile devices |
| `email` | Email address | For Email devices |
| `deviceName` | Device nickname | When creating device |

#### FIDO2-Specific Variables

| Variable | Description | When to Fill |
|----------|-------------|--------------|
| `credentialId` | FIDO2 credential ID | From WebAuthn registration |
| `rawId` | Raw credential ID | From WebAuthn registration |
| `clientDataJSON` | Client data JSON | From WebAuthn assertion |
| `authenticatorData` | Authenticator data | From WebAuthn assertion |
| `signature` | Assertion signature | From WebAuthn assertion |
| `userHandle` | User handle | From WebAuthn assertion |

4. Click **Save**

## Collection Structure

### Get Worker Token Folder

**Required First Step** - Run this before any other operations:

1. **Get Worker Token (Client Credentials)** - Obtain worker token using Client Credentials grant
   - Requires: `client_id`, `client_secret`, `envID`
   - Automatically saves: `workerToken` to environment
   - This token is required for all MFA API calls
   - **Note**: Permissions are controlled by roles assigned to the client application in PingOne, not by scopes

### Registration Folder

Each device type has its own subfolder with registration steps:

#### SMS / Email / WhatsApp / Mobile
1. **Get User ID** - Look up user by username
2. **Create Device** - Register new device
3. **Activate Device** - Activate using OTP code

#### TOTP
1. **Get User ID** - Look up user by username
2. **Create TOTP Device** - Register new TOTP device (returns QR code)
3. **Activate TOTP Device** - Activate using OTP from authenticator app

#### FIDO2
1. **Get User ID** - Look up user by username
2. **Create FIDO2 Device** - Register new FIDO2 device (returns WebAuthn options)
3. **Complete FIDO2 Registration** - Submit WebAuthn credential

### Authentication Folder

Each device type has its own subfolder with authentication steps:

#### SMS / Email / WhatsApp / TOTP / Mobile
1. **Initialize Device Authentication** - Start authentication session
2. **Check OTP** - Validate OTP code
3. **Complete Authentication** - Finish authentication

#### FIDO2
1. **Initialize Device Authentication** - Start authentication session
2. **Select Device** (if multiple) - Choose specific FIDO2 device
3. **Check Assertion** - Validate WebAuthn assertion
4. **Complete Authentication** - Finish authentication

## Automatic Variable Extraction

**🎉 All requests include automatic test scripts that extract and save variables!**

The collection includes Postman test scripts that automatically:
- Extract `userId` from "Get User ID" responses → Saves to `userId` variable
- Extract `deviceId` from "Create Device" responses → Saves to `deviceId` variable
- Extract `deviceAuthenticationId` from "Initialize Device Authentication" responses → Saves to `deviceAuthenticationId` variable
- Extract `workerToken` from token responses → Saves to `workerToken` variable

**No manual copying needed!** Variables are automatically saved and used in subsequent requests.

### How It Works

1. Run a request (e.g., "1. Get User ID")
2. Postman automatically runs the test script after the response
3. Script extracts the value from the JSON response
4. Value is saved to the environment variable
5. Next request automatically uses the saved variable

You can see the extraction in the **Test Results** tab after each request.

## Testing a Flow

### Example: SMS Registration

1. **Set Initial Variables**:
   - `envID`: Your environment ID
   - `client_id`: Your OAuth Client ID
   - `client_secret`: Your OAuth Client Secret
   - `username`: User to register device for
   - `phone`: Phone number for SMS
   - `deviceName`: Device nickname

2. **Get Worker Token First** (required):
   - Open **Get Worker Token** folder
   - Run **Get Worker Token (Client Credentials)** → `workerToken` is automatically saved ✅

3. **Run Registration Requests** (variables are auto-saved):
   - Open **Registration → SMS** folder
   - Run **1. Get User ID** → `userId` is automatically saved ✅
   - Run **2. Create SMS Device** → `deviceId` is automatically saved ✅
   - Check SMS for OTP code → Manually update `otp_code` variable
   - Run **3. Activate SMS Device** → Uses saved `userId` and `deviceId` automatically

### Example: FIDO2 Authentication

1. **Set Initial Variables**:
   - `envID`: Your environment ID
   - `workerToken`: Your worker token
   - `userId`: User ID (or run "Get User ID" first to auto-save)
   - `deviceId`: FIDO2 device ID
   - `deviceAuthenticationPolicyId`: Your policy ID

2. **Run Requests in Order** (variables are auto-saved):
   - Open **Authentication → FIDO2** folder
   - Run **1. Initialize Device Authentication** → `deviceAuthenticationId` is automatically saved ✅
   - Perform WebAuthn ceremony in browser → Get assertion data
   - Manually update FIDO2 variables (`credentialId`, `rawId`, `clientDataJSON`, etc.)
   - Run **3. Check Assertion** → Uses saved `deviceAuthenticationId` automatically
   - Run **4. Complete Authentication** → Uses saved `deviceAuthenticationId` automatically

## Tips

1. **Variable Substitution**: All requests use `{{variableName}}` syntax. Variables are automatically substituted from the selected environment.

2. **Automatic Variable Extraction**: Most variables are automatically extracted and saved:
   - ✅ `userId` - Auto-extracted from "Get User ID" responses
   - ✅ `deviceId` - Auto-extracted from "Create Device" responses
   - ✅ `deviceAuthenticationId` - Auto-extracted from "Initialize Device Authentication" responses
   - ✅ `workerToken` - Auto-extracted from token responses
   - ⚠️ `otp_code` - Must be manually updated (received via SMS/Email/WhatsApp/TOTP app)

3. **Viewing Extracted Variables**: 
   - Check the **Test Results** tab after each request
   - Look for console.log messages like "✅ Saved userId: ..."
   - Variables are immediately available for subsequent requests

4. **OTP Codes**: For OTP-based devices, you'll need to:
   - Check SMS/Email/WhatsApp for the code
   - Or use TOTP authenticator app
   - Manually update `otp_code` variable before running activation/check requests

4. **FIDO2**: FIDO2 requires browser-based WebAuthn ceremony. The collection shows the API structure, but actual WebAuthn calls happen in the browser.

5. **Worker Token**: Get a worker token first using the **Get Worker Token** folder:
   - Open **Get Worker Token** folder
   - Run **Get Worker Token (Client Credentials)** request
   - `workerToken` is automatically extracted and saved ✅
   - No manual copying needed!

## Troubleshooting

### "Invalid token" errors
- Check that `workerToken` is valid and not expired
- Re-request worker token if needed

### "User not found" errors
- Verify `username` is correct
- Check that user exists in your PingOne environment

### "Device not found" errors
- Verify `deviceId` is correct
- Check that device exists for the user

### "Invalid OTP" errors
- Verify OTP code is correct
- Check that OTP hasn't expired (typically 5-10 minutes)
- For TOTP, ensure time sync is correct

### Variable not substituting
- Ensure environment is selected (top right dropdown)
- Check variable name spelling (case-sensitive)
- Verify variable is enabled in environment

## Reference

- [PingOne MFA API Documentation](https://apidocs.pingidentity.com/pingone/mfa/v1/api/)
- [PingOne Postman Collections](https://apidocs.pingidentity.com/pingone/platform/v1/api/#the-pingone-postman-collections)
- [PingOne Postman Environment Template](https://apidocs.pingidentity.com/pingone/platform/v1/api/#the-pingone-postman-environment-template)
