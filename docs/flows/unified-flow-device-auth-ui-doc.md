# Unified Flow - Device Authorization Flow UI Documentation

**Version:** 1.0  
**Last Updated:** 2025-01-27  
**Audience:** End Users  
**Flow Type:** Device Authorization Flow (RFC 8628)

## Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Step-by-Step Guide](#step-by-step-guide)
4. [Understanding the Results](#understanding-the-results)
5. [Troubleshooting](#troubleshooting)
6. [FAQ](#faq)

---

## Overview

The **Device Authorization Flow** (RFC 8628) is an OAuth 2.0 / OpenID Connect authentication method designed for devices with limited input capabilities. This flow allows users to authorize devices (like smart TVs, IoT devices, or command-line tools) by completing authentication on a separate device with a browser.

### Key Characteristics

- ✅ **Device-Friendly**: Designed for devices that can't easily display login forms
- ✅ **Two-Device Flow**: User authorizes on one device while the constrained device polls for tokens
- ✅ **User Code**: Short, easy-to-enter code displayed to the user
- ✅ **QR Code Support**: Scan QR code with mobile device for quick authorization
- ⚠️ **Polling Required**: Device must poll token endpoint until user authorizes
- ⚠️ **Time-Limited**: Device codes expire (typically 15 minutes)

### When to Use

- Smart TVs and set-top boxes
- IoT devices and sensors
- Command-line tools and scripts
- Gaming consoles
- Printers and other embedded devices
- Any device without a browser or keyboard

### Spec Version Support

- ✅ **OAuth 2.0**: Fully supported
- ✅ **OAuth 2.1**: Fully supported
- ✅ **OpenID Connect (OIDC)**: Fully supported (with `openid` scope)

---

## Getting Started

### Prerequisites

Before using the Device Authorization Flow, ensure you have:

1. **PingOne Account**: Access to PingOne Admin Console
2. **PingOne Application**: Application configured with Device Code grant type enabled
3. **Client Credentials**: Environment ID, Client ID, and optionally Client Secret
4. **Scopes**: Space-separated list of OAuth scopes (e.g., `openid profile email` for OIDC)

### Flow Overview

The Device Authorization Flow consists of 5 steps:

1. **Configure Credentials**: Enter your PingOne application credentials
2. **Request Device Authorization**: Get device code and user code
3. **Poll for Tokens**: Device polls token endpoint while user authorizes
4. **Display Tokens**: View received access tokens and ID tokens
5. **Introspection & UserInfo**: Examine tokens and fetch user information

---

## Step-by-Step Guide

### Step 0: Configure Credentials

**Purpose:** Enter your PingOne application credentials

#### Required Information

1. **Environment ID**: Your PingOne environment ID
   - Example: `your-environment-id`
   - Found in: PingOne Admin Console → Environment settings

2. **Client ID**: Your OAuth application client ID
   - Example: `your-client-id`
   - Found in: PingOne Admin Console → Applications → Your Application → Configuration

3. **Scopes**: Space-separated list of OAuth scopes
   - Example: `openid profile email offline_access`
   - Common scopes:
     - `openid`: Required for OIDC (to receive ID token)
     - `profile`: User profile information
     - `email`: User email address
     - `offline_access`: Refresh token (for long-lived sessions)

#### Optional Information

- **Client Secret**: Required if your application uses client authentication
  - Found in: PingOne Admin Console → Applications → Your Application → Configuration
  - **Note**: Public clients (no secret) are also supported

- **Client Authentication Method**: How to authenticate with token endpoint
  - `client_secret_basic`: HTTP Basic Auth (default if secret provided)
  - `client_secret_post`: Client secret in POST body
  - `none`: No authentication (public clients)

#### What to Expect

After entering credentials:
- ✅ Credentials are validated
- ✅ Next step button becomes enabled
- ✅ Credentials are saved for future use

---

### Step 1: Request Device Authorization

**Purpose:** Request device authorization and receive device code, user code, and verification URI

#### Pre-Flight Validation

Before requesting device authorization, the system automatically validates your configuration against PingOne:

**What Happens:**
1. **Validation Starts**: A small spinner appears with the message "🔍 Validating Configuration against PingOne..."
2. **Configuration Checked**: The system verifies:
   - Client secret requirements
   - Token endpoint authentication method compatibility
   - Scope requirements
   - Device code flow compatibility

**Validation Results:**
- ✅ **Success**: Toast message "Pre-flight validation passed!" - You can proceed
- ⚠️ **Warnings**: Toast message "Pre-flight validation warnings" - You can proceed, but review warnings
- ❌ **Errors**: Toast message "Pre-flight validation failed" - Must fix errors before proceeding

**Auto-Fix Available:**
- If fixable errors are detected, you'll be prompted: "Would you like to automatically fix all fixable errors?"
- Click **"Yes, Fix All"** to automatically correct:
  - Auth method mismatch (updates to match PingOne)
- After auto-fix, validation runs again automatically
- Success toast shows: "Fixed {count} error(s): {list of fixes}"

**Note:** The spinner does not block the UI during device authorization. Once the QR code is displayed, the spinner is hidden to allow you to scan the QR code.

#### What Happens

When you click **"Request Device Authorization"**:

1. **Request Sent**: The application sends a POST request to PingOne's device authorization endpoint
2. **Response Received**: PingOne returns:
   - **Device Code**: Long code used for polling (hidden from user)
   - **User Code**: Short, easy-to-enter code (e.g., `ABC-123`)
   - **Verification URI**: URL where user enters user code
   - **Verification URI Complete**: Full URL with user code pre-filled (for QR codes)
   - **Expires In**: How long device code is valid (typically 900 seconds = 15 minutes)
   - **Interval**: How often to poll token endpoint (typically 5 seconds)

3. **Display Results**: The UI displays:
   - ✅ User code prominently
   - ✅ Verification URI with copy button
   - ✅ QR code (if `verification_uri_complete` provided)
   - ✅ Expiration countdown timer
   - ✅ Polling interval information

#### QR Code Display

If the server provides `verification_uri_complete`, a QR code is automatically displayed. You can:
- **Scan with Mobile Device**: Open your phone's camera or QR code reader app
- **Tap/Click to Open**: QR code opens the verification page directly
- **Copy Verification URI**: Copy the URL manually if QR code isn't available

#### What to Do Next

1. **On a Separate Device**: Open the verification URI on a device with a browser (phone, tablet, computer)
2. **Enter User Code**: Type the user code displayed (e.g., `ABC-123`)
3. **Authenticate**: Log in with your PingOne credentials
4. **Authorize**: Approve the device authorization request
5. **Return to This Page**: Click "Next Step" to start polling for tokens

#### Important Notes

- ⏱️ **Device Code Expires**: The device code expires in 15 minutes (900 seconds) by default
- 🔄 **You Can Request New Code**: Click "Refresh Code" to request a new device code at any time
- 🔒 **Keep User Code Secure**: Don't share the user code with unauthorized users

---

### Step 2: Poll for Tokens

**Purpose:** Poll the token endpoint until user authorizes the device

#### What Happens

When you click **"Start Polling for Tokens"** (or when you navigate to this step):

1. **Auto-Start Polling**: The application automatically starts polling the token endpoint
2. **Polling Interval**: Polls every **N seconds** (where N is the `interval` from Step 1, typically 5 seconds)
3. **Real-Time Status**: Displays:
   - ✅ Current poll attempt number
   - ✅ Last poll timestamp
   - ✅ Current polling interval
   - ✅ Time until device code expires

#### Polling Behavior

- **First Poll**: Happens immediately (no wait)
- **Subsequent Polls**: Wait `interval` seconds between polls (RFC 8628 compliance)
- **On `slow_down`**: Server requests slower polling, interval increases automatically
- **On Success**: Polling stops, tokens are received
- **On Error**: Polling stops, error message displayed

#### Understanding Poll Responses

| Response | Meaning | Action |
|----------|---------|--------|
| ✅ **Success (200 OK)** | User authorized the device | Tokens received, polling stops |
| ⏳ **authorization_pending (400)** | User hasn't authorized yet | Continue polling (normal) |
| 🐌 **slow_down (400)** | Server requests slower polling | Increase interval, continue polling |
| ❌ **expired_token (400)** | Device code expired | Stop polling, request new code |
| 🚫 **access_denied (400)** | User denied authorization | Stop polling, show error |

#### What You See

**While Polling:**
- ⏳ "Polling token endpoint..." message
- 📊 Poll attempt counter (e.g., "Poll attempt #5")
- 🕐 Last poll timestamp (e.g., "Last poll: 3:45:23 PM")
- ⏱️ Polling interval display (e.g., "Polling interval: 5s")
- ⏰ Countdown timer showing time until device code expires

**Action Buttons:**
- **⏹️ Stop Polling**: Manually stop polling (useful for testing or if you need to request a new code)
- **🔄 Request New Code**: Request a new device code (invalidates old code)

#### When Tokens Are Received

Once the user authorizes the device on the verification page:
1. ✅ Next poll receives tokens (200 OK response)
2. ✅ Polling stops automatically
3. ✅ Success message displayed
4. ✅ Next step button becomes enabled
5. ✅ Tokens are stored for viewing in Step 3

#### Troubleshooting Polling

**Problem**: Polling continues but never receives tokens
- ✅ **Check**: Did you complete authorization on the verification page?
- ✅ **Check**: Is the device code expired? (Look at countdown timer)
- ✅ **Check**: Did you authorize with the correct user code?
- ✅ **Solution**: Request a new device code and try again

**Problem**: Polling stops with "slow_down" error
- ✅ **This is Normal**: Server is rate-limiting your polling
- ✅ **What Happens**: Polling interval increases automatically (e.g., from 5s to 10s)
- ✅ **Action**: No action needed, polling continues with adjusted interval

**Problem**: Polling stops with "expired_token" error
- ✅ **Cause**: Device code expired (typically after 15 minutes)
- ✅ **Solution**: Click "Request New Code" to get a new device code and start over

---

### Step 3: Display Tokens

**Purpose:** View received access tokens, ID tokens, and refresh tokens

#### What You See

After successful authorization, you'll see:

1. **Access Token**:
   - Token value (masked for security)
   - Copy button (copies full token to clipboard)
   - Decode button (decodes JWT and shows payload)
   - Token type (typically "Bearer")
   - Expiration time (seconds until token expires)

2. **ID Token** (OIDC only):
   - Token value (masked for security)
   - Copy button
   - Decode button
   - Contains user information (sub, email, name, etc.)

3. **Refresh Token** (if `offline_access` scope was included):
   - Token value (masked for security)
   - Copy button
   - Decode button
   - Used to get new access tokens without re-authentication

#### Token Filtering by Spec Version

| Spec Version | Access Token | ID Token | Refresh Token |
|--------------|--------------|----------|---------------|
| **OAuth 2.0** | ✅ | ❌ | ✅ (if `offline_access` scope) |
| **OAuth 2.1** | ✅ | ❌ | ✅ (if `offline_access` scope) |
| **OIDC** | ✅ | ✅ (if `openid` scope) | ✅ (if `offline_access` scope) |

#### Understanding Token Types

**Access Token:**
- Used to access protected resources (APIs)
- Short-lived (typically 1 hour)
- Contains scopes and permissions

**ID Token (OIDC):**
- Contains user identity information
- Signed JWT that can be validated locally
- Contains claims like `sub` (subject), `email`, `name`, etc.

**Refresh Token:**
- Used to get new access tokens
- Long-lived (can be days or months)
- Should be stored securely
- Revoked when user logs out or token expires

#### Decoding Tokens

Click the **"Decode"** button to view the token's payload:
- **Header**: Token algorithm and type
- **Payload**: Claims (scopes, expiration, user info, etc.)
- **Signature**: Token signature (not displayed, used for validation)

#### Copying Tokens

Click the **"Copy"** button to copy the full token to your clipboard. Useful for:
- Testing API calls
- Manual token validation
- Debugging authentication issues

---

### Step 4: Introspection & UserInfo

**Purpose:** Examine tokens and fetch user information

#### Available Operations

**1. Token Introspection**

Token introspection allows you to check if a token is valid and view its metadata:

- **Access Token Introspection**: Check if access token is active and view scopes
- **Refresh Token Introspection**: Check if refresh token is active
- **ID Token Introspection**: ❌ **Not Available** (ID tokens should be validated locally, not introspected)

**How to Use:**
1. Select token type (Access Token or Refresh Token)
2. Click **"Introspect Token"**
3. View introspection result:
   - ✅ **Active**: Token is valid and can be used
   - ❌ **Inactive**: Token is expired, revoked, or invalid
   - **Metadata**: Scopes, expiration, issued time, etc.

**2. UserInfo Endpoint (OIDC Only)**

The UserInfo endpoint returns user profile information:

- **Requires**: `openid` scope and valid access token
- **Returns**: User claims (sub, email, name, profile, etc.)

**How to Use:**
1. Ensure you're using OIDC spec version and `openid` scope
2. Click **"Fetch UserInfo"**
3. View user information:
   - Subject ID (`sub`)
   - Email address
   - Full name
   - Profile picture URL
   - Other claims

**3. ID Token Local Validation (OIDC Only)**

**Purpose**: Validate ID tokens locally without calling the introspection endpoint.

**Why Local Validation?**
- ID tokens are JWTs designed for local validation by your application
- The introspection endpoint is NOT meant for ID tokens
- Local validation follows OIDC Core 1.0 specification

**How to Use**:
1. Ensure you're using OIDC spec version and `openid` scope
2. After receiving your ID token, navigate to the Introspection step
3. Find the "What can be introspected" section
4. Click **"🔐 Validate ID Token Locally"** button
5. Review validation results:
   - ✅ JWT Signature verification
   - ✅ Claims validation (iss, aud, exp, iat, nonce)
   - Any errors or warnings

**What Gets Validated**:
- **JWT Signature**: Verified using JWKS from PingOne
- **Issuer (iss)**: Matches your PingOne environment
- **Audience (aud)**: Matches your client ID
- **Expiration (exp)**: Token hasn't expired
- **Issued At (iat)**: Valid timestamp
- **Nonce**: Matches authorization request (if provided)

**Learn More**:
- [OIDC ID Token Validation Spec](https://openid.net/specs/openid-connect-core-1_0.html#IDTokenValidation)

#### Understanding Results

**Introspection Results:**
- ✅ **Active**: Token is valid and can be used
- ❌ **Inactive**: Token cannot be used (expired, revoked, or invalid)
- **Expiration**: When the token expires
- **Scopes**: What permissions the token has
- **Issued At**: When the token was issued

**UserInfo Results:**
- **Sub**: Unique user identifier
- **Email**: User's email address
- **Name**: User's full name
- **Profile**: User profile information
- **Other Claims**: Additional user attributes

---

## Understanding the Results

### Success Indicators

✅ **Device Authorization Successful:**
- Device code and user code received
- Verification URI displayed
- QR code displayed (if supported)

✅ **User Authorization Successful:**
- Polling receives 200 OK response
- Tokens displayed in Step 3
- Access token, ID token (OIDC), and refresh token (if applicable) received

✅ **Token Validation Successful:**
- Introspection shows token is active
- UserInfo returns user profile (OIDC)
- All operations complete without errors

### Common States

**Polling State:**
- ⏳ **Polling**: Waiting for user authorization
- ✅ **Success**: Tokens received
- ❌ **Error**: Polling failed (expired, denied, etc.)

**Token State:**
- ✅ **Valid**: Token is active and can be used
- ❌ **Expired**: Token has expired
- ❌ **Invalid**: Token is malformed or revoked

---

## Troubleshooting

### Common Issues

#### Issue 1: "403 Forbidden" or "Grant type not enabled"

**Problem:** Device Code grant type not enabled in PingOne application

**Solution:**
1. Go to PingOne Admin Console: https://admin.pingone.com
2. Navigate to: Applications → Your Application → Configuration
3. Under "Grant Types", check "Device Code" (or "DEVICE_CODE")
4. Click "Save"
5. Try requesting device authorization again

#### Issue 2: "User code not found" or "Invalid user code"

**Problem:** User entered wrong user code or code expired

**Solution:**
1. Check that you're entering the exact user code (case-sensitive)
2. Verify the device code hasn't expired (check countdown timer)
3. Request a new device code and try again

#### Issue 3: Polling never receives tokens

**Problem:** User hasn't completed authorization or authorization failed

**Solution:**
1. Verify you completed authorization on the verification page
2. Check that you used the correct user code
3. Verify you approved the authorization request (didn't deny it)
4. Check if device code expired (look at countdown timer)
5. Request a new device code and start over

#### Issue 4: Device code expires too quickly

**Problem:** Device code expired before user could authorize

**Solution:**
1. Request a new device code
2. Complete authorization more quickly (within 15 minutes)
3. Ensure you have all credentials ready before requesting device authorization

#### Issue 5: "slow_down" error during polling

**Problem:** Server is rate-limiting polling requests

**Solution:**
- ✅ **This is Normal**: Server requests slower polling to prevent overload
- ✅ **No Action Needed**: Polling interval increases automatically
- ✅ **Polling Continues**: Just wait longer between polls

#### Issue 6: No ID token received (OIDC)

**Problem:** Missing `openid` scope or not using OIDC spec version

**Solution:**
1. Ensure you're using OIDC spec version (not OAuth 2.0 or 2.1)
2. Include `openid` scope in your scopes (e.g., `openid profile email`)
3. Verify your PingOne application supports OIDC

#### Issue 7: No refresh token received

**Problem:** Missing `offline_access` scope

**Solution:**
1. Include `offline_access` scope in your scopes (e.g., `openid profile email offline_access`)
2. Verify your PingOne application allows refresh tokens

---

## FAQ

### Q: How long does a device code last?

**A:** Device codes typically expire after 15 minutes (900 seconds). You can check the expiration time in Step 1 after requesting device authorization.

### Q: Can I use the same device code multiple times?

**A:** No, device codes are single-use. Once a device code is used (authorized or expired), you must request a new code.

### Q: What happens if I lose my device code or user code?

**A:** You can request a new device code at any time by clicking "Request New Code" in Step 1. The old code will be invalidated.

### Q: Why does polling show "authorization_pending"?

**A:** This is normal! "authorization_pending" means the user hasn't completed authorization yet. Polling will continue until the user authorizes or the device code expires.

### Q: How often does the device poll for tokens?

**A:** The polling interval is determined by the server (typically 5 seconds). You can see the current interval in Step 2. If the server requests slower polling (via `slow_down`), the interval increases automatically.

### Q: Can I stop polling manually?

**A:** Yes, click the "Stop Polling" button in Step 2. You can restart polling or request a new device code at any time.

### Q: What's the difference between `verification_uri` and `verification_uri_complete`?

**A:**
- **`verification_uri`**: Base URL where user enters the user code manually
- **`verification_uri_complete`**: Full URL with user code pre-filled (for QR codes and direct links)

### Q: Do I need a client secret for device authorization?

**A:** It depends on your PingOne application configuration:
- **Confidential Client**: Requires client secret
- **Public Client**: No client secret needed (set Client Auth Method to "none")

### Q: Can I use device authorization flow for web applications?

**A:** Device authorization flow is designed for input-constrained devices. For web applications, use Authorization Code flow with PKCE instead.

### Q: What scopes should I use?

**A:** Depends on what you need:
- **OIDC**: `openid profile email offline_access` (ID token + user info + refresh token)
- **OAuth 2.0/2.1**: `profile email offline_access` (no ID token, but refresh token)
- **Minimal**: `openid` (just ID token) or `profile` (just basic info)

### Q: How do I know if my device code is expired?

**A:** Check the countdown timer in Step 1 or Step 2. When it reaches 0, the device code has expired. You'll also see an "expired_token" error if you try to poll after expiration.

---

## Downloading API Documentation

The documentation page (final step) provides three download options:

### 1. Download as Markdown

- **Format**: Markdown (.md) file
- **Content**: Complete API documentation with all API calls, request/response examples, and notes
- **Use Case**: Documentation, sharing with team, version control

### 2. Download as PDF

- **Format**: PDF file
- **Content**: Same as Markdown, formatted for printing
- **Use Case**: Printing, offline reference, formal documentation

### 3. Download Postman Collection

- **Format**: Postman Collection JSON file
- **Content**: Complete Postman collection with all API calls from the flow
- **Use Case**: Import into Postman for testing, API exploration, team sharing

#### Postman Collection Features

The generated Postman collection includes:

- **All API Calls**: Every API call made during the flow
- **Pre-configured Variables**: 
  - `authPath`: `https://auth.pingone.com` (includes protocol)
  - `envID`: Your environment ID (pre-filled from credentials)
  - `client_id`: Your client ID (pre-filled from credentials)
  - `workerToken`: Empty (fill in after obtaining token)
- **URL Format**: Matches PingOne documentation format: `{{authPath}}/{{envID}}/as/device_authorization`, `{{authPath}}/{{envID}}/as/token`
- **Headers**: Automatically configured (Content-Type, Authorization)
- **Request Bodies**: Pre-filled with example data

#### Using the Postman Collection

1. **Download**: Click "Download Postman Collection" button. This downloads two files:
    -   **Collection file** (`*-collection.json`) - Contains all API requests
    -   **Environment file** (`*-environment.json`) - Contains all variables with pre-filled values
2. **Import Collection**: Open Postman → Import → Select the collection file (`*-collection.json`)
3. **Import Environment**: Open Postman → Import → Select the environment file (`*-environment.json`)
4. **Select Environment**: In Postman, select the imported environment from the dropdown (top right)
5. **Update Variables**: Edit environment variables with your actual values:
    -   `envID`, `client_id` are pre-filled from your flow credentials
    -   `workerToken` will be empty; fill in after obtaining a worker token
    -   `device_code` will be empty; fill in after device authorization
    -   Other variables have default values
6. **Test**: Run requests directly in Postman. All variables are automatically substituted from the environment.

**Reference**: [PingOne Postman Collections Documentation](https://apidocs.pingidentity.com/pingone/platform/v1/api/#the-pingone-postman-collections)

---

## Additional Resources

- **RFC 8628**: OAuth 2.0 Device Authorization Grant - https://datatracker.ietf.org/doc/html/rfc8628
- **PingOne Documentation**: https://apidocs.pingidentity.com/pingone/main/v1/api/
- **PingOne Postman Collections**: https://apidocs.pingidentity.com/pingone/platform/v1/api/#the-pingone-postman-collections
- **PingOne Postman Environment Template**: https://apidocs.pingidentity.com/pingone/platform/v1/api/#the-pingone-postman-environment-template
- **OAuth 2.0 Specification**: https://datatracker.ietf.org/doc/html/rfc6749
- **OpenID Connect Specification**: https://openid.net/specs/openid-connect-core-1_0.html

---

## Security Best Practices

1. **Keep User Codes Secure**: Don't share user codes with unauthorized users
2. **Expire Device Codes Quickly**: Device codes should expire within 15 minutes
3. **Use HTTPS**: Always use HTTPS for verification URIs
4. **Validate Tokens**: Always validate ID tokens locally (don't introspect)
5. **Store Refresh Tokens Securely**: Refresh tokens should be stored securely (encrypted, not in localStorage for web apps)
6. **Revoke Tokens on Logout**: Always revoke refresh tokens when user logs out
7. **Use Least Privilege**: Request only the scopes you need

---

## When to Use Device Authorization Flow

✅ **Use Device Authorization Flow For:**
- Smart TVs and set-top boxes
- IoT devices and sensors
- Command-line tools and scripts
- Gaming consoles
- Printers and embedded devices
- Any device without a browser or keyboard

❌ **Don't Use Device Authorization Flow For:**
- Web applications (use Authorization Code + PKCE)
- Mobile apps (use Authorization Code + PKCE)
- Server-to-server communication (use Client Credentials)
- Single Page Applications (use Authorization Code + PKCE)

---

**Note:** This documentation is for the Unified Flow implementation of Device Authorization Flow. For other implementations, refer to their specific documentation.


---

## API Calls Documentation

All API calls made during this flow are automatically tracked and documented. You can view complete request/response details on the **API Documentation** page.

### API Call Categories

**🔐 Management API** (if Worker Token is configured)
- **Worker Token Retrieval**: Obtain access token for PingOne Management API
- **Application Discovery**: List applications in environment  
- **Application Details**: Fetch app configuration and credentials

**📋 OIDC Metadata** (if OIDC Discovery is used)
- **OIDC Discovery**: Fetch `/.well-known/openid-configuration`
- **JWKS Fetching**: Retrieve signing keys for ID token validation

**✅ Pre-flight Validation** (if enabled)
- **Configuration Checks**: Validate redirect URI, auth method, PKCE settings

**🔄 OAuth Flow** (always tracked)
- **Device Authorization Request**: Request device code and user code (RFC 8628)
- **Token Polling**: Poll token endpoint for authorization status
- **Token Introspection**: Validate token status
- **UserInfo**: Retrieve user profile (OIDC only)

### How to Access

1. Complete any step in the flow
2. Click **"View API Documentation"** button at the bottom
3. View detailed request/response for each call
4. Download as Postman collection for testing
