# Unified Flow - Authorization Code Flow UI Documentation

**Version:** 1.0  
**Last Updated:** 2025-01-27  
**Audience:** End Users  
**Flow Type:** Authorization Code Flow (OAuth 2.0 / OIDC Core 1.0 / OAuth 2.1)

## Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Step-by-Step Guide](#step-by-step-guide)
4. [Understanding the Results](#understanding-the-results)
5. [Troubleshooting](#troubleshooting)
6. [FAQ](#faq)

---

## Overview

The **Authorization Code Flow** is the most secure and recommended OAuth 2.0 flow for web applications. It uses a two-step process: first obtaining an authorization code, then exchanging it for tokens. This flow supports PKCE (Proof Key for Code Exchange) for enhanced security, especially for public clients.

### Key Characteristics

- ✅ **Most Secure**: Recommended flow for web applications
- ✅ **PKCE Support**: Enhanced security for public clients
- ✅ **Refresh Tokens**: Can obtain refresh tokens for long-lived sessions
- ✅ **ID Tokens**: Supports OpenID Connect (OIDC) for user identity
- ✅ **User Context**: Tokens are tied to a specific user
- ✅ **Backend Exchange**: Token exchange happens on secure backend

### When to Use

- Web applications with secure backends
- Single Page Applications (SPAs) using PKCE
- Mobile applications
- Applications needing refresh tokens
- Applications requiring user identity (OIDC)

### Spec Version Support

- ✅ **OAuth 2.0**: Fully supported (RFC 6749)
- ✅ **OIDC Core 1.0**: Fully supported (adds ID token and UserInfo)
- ✅ **OAuth 2.1**: Fully supported (PKCE recommended/required)

---

## Getting Started

### Prerequisites

Before using the Authorization Code Flow, ensure you have:

1. **PingOne Account**: Access to PingOne Admin Console
2. **Application Configuration**: A PingOne application configured for Authorization Code grant type
3. **Environment ID**: Your PingOne Environment ID
4. **Client ID**: Your OAuth application's Client ID
5. **Client Secret**: Your OAuth application's Client Secret (if using confidential client)
6. **Redirect URI**: A registered redirect URI in PingOne (must match exactly)
7. **Scopes**: Space-separated list of OAuth scopes (e.g., `openid profile email`)

### Accessing the Flow

1. Navigate to the Unified Flow page
2. Select **Spec Version**: Choose "OAuth 2.0", "OIDC Core 1.0", or "OAuth 2.1"
3. Select **Flow Type**: Choose "Authorization Code"

---

## Step-by-Step Guide

### Step 0: Configure Credentials

**Purpose**: Enter your OAuth application credentials and configuration.

#### Required Information

1. **Environment ID** *(Required)*
   - Your PingOne Environment ID
   - Format: UUID (e.g., `12345678-1234-1234-1234-123456789012`)
   - Where to find: PingOne Admin Console → Environments

2. **Client ID** *(Required)*
   - Your OAuth application's Client ID
   - Format: Alphanumeric string
   - Where to find: PingOne Admin Console → Applications → Your App → Configuration
   - 💡 **Tip**: Use the app lookup feature (🔍 icon) to find and auto-fill your app

3. **Redirect URI** *(Required)*
   - The callback URL where PingOne will redirect after authentication
   - Must **exactly match** a redirect URI registered in PingOne
   - Examples: `https://localhost:3000/callback`, `https://myapp.com/oauth/callback`
   - ⚠️ **Important**: The redirect URI must match exactly (including protocol, domain, path, and trailing slashes)

4. **Scopes** *(Required)*
   - Space-separated list of requested permissions
   - Examples: `openid profile email`, `api:read api:write`
   - **Note**: For OIDC, include `openid` scope to get ID token

5. **Client Secret** *(Conditional)*
   - Required for confidential clients
   - Not required for public clients (when using PKCE)
   - Where to find: PingOne Admin Console → Applications → Your App → Configuration
   - ⚠️ **Security**: Keep your client secret secure - never expose it in client-side code

#### Optional Configuration (Advanced Options)

1. **PKCE (Proof Key for Code Exchange)**
   - **Recommended** for public clients (SPAs, mobile apps)
   - **Required** in OAuth 2.1 for public clients
   - Enhances security by preventing authorization code interception
   - Can be enabled/disabled in Advanced Options

2. **Client Authentication Method**
   - How your application authenticates with the token endpoint
   - Options:
     - **Client Secret Post**: Client ID and secret in POST body (most common)
     - **Client Secret Basic**: HTTP Basic Authentication header
     - **Client Secret JWT**: JWT assertion signed with client secret
     - **Private Key JWT**: JWT assertion signed with private key (most secure)
     - **None**: No client authentication (public clients with PKCE)

3. **Response Mode**
   - How the authorization response is returned
   - Options:
     - **Query**: Parameters in URL query string (default)
     - **Fragment**: Parameters in URL fragment
     - **Form POST**: Parameters in POST body
     - **PingOne Flow (pi.flow)**: Redirectless authentication

4. **Additional Parameters**
   - **Prompt**: Force re-authentication (`login`) or consent (`consent`)
   - **Login Hint**: Pre-fill username/email in login form
   - **Max Age**: Maximum authentication age in seconds

#### What Happens

- Credentials are validated
- Configuration is saved automatically
- "Next" button becomes enabled when all required fields are filled

---

### Step 1: Generate PKCE Codes (If PKCE Enabled)

**Purpose**: Generate PKCE code verifier and challenge for enhanced security.

#### When This Step Appears

- Only shown when PKCE is enabled in Step 0 Advanced Options
- Skipped if PKCE is disabled

#### What Happens

1. **Code Verifier Generated**: Random 43-128 character URL-safe string
2. **Code Challenge Computed**: SHA256 hash of code verifier, base64url encoded
3. **Codes Stored**: Both codes stored in component state (not persisted for security)

#### What You'll See

- Code verifier (displayed, can be copied)
- Code challenge (displayed, will be sent to PingOne)
- "Next" button to proceed

#### Important Notes

- ⚠️ **Code Verifier**: Keep this secure - it's needed for token exchange
- ⚠️ **Not Persisted**: Codes are not saved to storage (security best practice)
- ✅ **Automatic**: Codes are generated automatically when step loads

---

### Step 2: Generate Authorization URL

**Purpose**: Generate the authorization URL to redirect the user to PingOne for authentication.

#### Pre-Flight Validation

Before generating the authorization URL, the system automatically validates your configuration against PingOne:

**What Happens:**
1. **Validation Starts**: A small spinner appears with the message "🔍 Validating Configuration against PingOne..."
2. **Configuration Checked**: The system verifies:
   - Redirect URI matches PingOne configuration
   - PKCE requirements (if applicable)
   - Client authentication method compatibility
   - Scope requirements (OIDC requires `openid` scope)
   - Other configuration settings

**Validation Results:**
- ✅ **Success**: Toast message "Pre-flight validation passed!" - You can proceed
- ⚠️ **Warnings**: Toast message "Pre-flight validation warnings" - You can proceed, but review warnings
- ❌ **Errors**: Toast message "Pre-flight validation failed" - Must fix errors before proceeding

**Auto-Fix Available:**
- If fixable errors are detected, you'll be prompted: "Would you like to automatically fix all fixable errors?"
- Click **"Yes, Fix All"** to automatically correct:
  - Redirect URI mismatch (updates to match PingOne)
  - Missing PKCE (enables if required)
  - Auth method mismatch (updates to match PingOne)
  - Missing `openid` scope (adds automatically)
  - Invalid response type (corrects automatically)
- After auto-fix, validation runs again automatically
- Success toast shows: "Fixed {count} error(s): {list of fixes}"

#### What Happens

1. **Click "Generate Authorization URL"**:
   - Pre-flight validation runs automatically (see above)
   - Authorization URL is generated
   - State parameter is created (CSRF protection)
   - Nonce is generated (if OIDC mode)
   - PKCE challenge is included (if PKCE enabled)

2. **Authorization URL is Displayed**:
   - Full URL shown with syntax highlighting
   - Copy button available
   - URL parameters explained

3. **Click "Authenticate on PingOne"**:
   - Opens PingOne login page in new window/tab
   - User authenticates with PingOne
   - User grants permissions (if consent required)

#### What You'll See

- **Authorization URL**: Full URL with all parameters
- **State Parameter**: Random value for CSRF protection
- **PKCE Challenge**: Code challenge (if PKCE enabled)
- **Educational Content**: Explanation of authorization URL and parameters

#### After Authentication

- User is redirected back to your redirect URI
- Authorization code is in the callback URL
- Flow automatically proceeds to Step 3

---

### Step 3: Handle Callback

**Purpose**: Extract the authorization code from the callback URL after PingOne redirects back.

#### What Happens Automatically

1. **URL Parsing**: Callback URL is parsed for `code` and `state` parameters
2. **State Validation**: State parameter is validated (CSRF protection)
3. **Code Extraction**: Authorization code is extracted
4. **Code Storage**: Code is stored in component state

#### What You'll See

- **Authorization Code**: The code received from PingOne
- **State Match**: Confirmation that state matches (security check)
- **Educational Content**: Explanation of authorization code and next steps

#### If Something Goes Wrong

- **State Mismatch**: Error message - possible CSRF attack, restart flow
- **Missing Code**: Error message - check callback URL
- **Invalid Callback**: Error message - verify redirect URI matches PingOne config

---

### Step 4: Exchange Code for Tokens

**Purpose**: Exchange the authorization code for access token, ID token, and refresh token.

#### What Happens

1. **Click "Exchange Code for Tokens"**:
   - Authorization code is sent to token endpoint
   - Client credentials are authenticated
   - PKCE code verifier is included (if PKCE enabled)
   - Tokens are received from PingOne

2. **Tokens Received**:
   - **Access Token**: For API authorization
   - **ID Token**: User identity (if OIDC mode)
   - **Refresh Token**: For obtaining new access tokens (if enabled)

#### What You'll See

- **API Call Display**: Request and response details
- **Success Message**: Confirmation that tokens were received
- **Token Summary**: Brief overview of received tokens

#### Token Types

- **Access Token**: Used to access protected resources
- **ID Token** (OIDC only): Contains user identity information
- **Refresh Token**: Used to obtain new access tokens without re-authentication

---

### Step 5: Display Tokens

**Purpose**: View and manage the received tokens.

#### What You'll See

- **Access Token**:
  - Full token value (truncated for display)
  - "Copy" button
  - "Decode" button (if JWT)
  - Token type (Bearer)
  - Expiration time
  - Granted scopes

- **ID Token** (OIDC only):
  - Full JWT token
  - "Copy" button
  - "Decode" button (always available)
  - Decoded claims (sub, iss, aud, exp, iat, etc.)

- **Refresh Token** (if enabled):
  - Full token value
  - "Copy" button
  - Usage instructions

#### Token Actions

- **Copy Token**: Copy token to clipboard
- **Decode Token**: Decode JWT token to view claims
- **View Expiration**: See when token expires
- **View Scopes**: See granted permissions

---

### Step 6: Introspection & UserInfo

**Purpose**: Validate tokens and retrieve user information.

#### Token Introspection

**What It Does**:
- Validates token is still active
- Shows token metadata (scope, client_id, expiration, etc.)
- Verifies token hasn't been revoked

**How to Use**:
1. Select token type (Access Token or Refresh Token)
2. Click "Introspect Token"
3. View results (active, scope, expiration, etc.)

#### UserInfo Endpoint (OIDC only)

**What It Does**:
- Retrieves user information using access token
- Returns user claims (sub, name, email, etc.)

**How to Use**:
1. Click "Get UserInfo"
2. View user information returned from PingOne

#### ID Token Local Validation

**Purpose**: Validate ID tokens locally without calling the introspection endpoint.

**Why Local Validation?**
- ID tokens are JWTs designed for local validation by your application
- The introspection endpoint is NOT meant for ID tokens
- Local validation follows OIDC Core 1.0 specification

**How to Use**:
1. After receiving your ID token, navigate to the Introspection step
2. Find the "What can be introspected" section
3. Click **"🔐 Validate ID Token Locally"** button
4. Review validation results:
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

---

## Understanding the Results

### Access Token

- **Purpose**: Authorize API requests
- **Format**: JWT or opaque string
- **Usage**: Include in `Authorization: Bearer {token}` header
- **Expiration**: Typically 1 hour (configurable in PingOne)

### ID Token (OIDC)

- **Purpose**: User identity information
- **Format**: Always JWT
- **Contains**: User ID (sub), issuer, audience, expiration, etc.
- **Usage**: Verify user identity, extract user claims

### Refresh Token

- **Purpose**: Obtain new access tokens without re-authentication
- **Format**: Opaque string
- **Usage**: Exchange for new access token when current one expires
- **Expiration**: Typically longer than access token (configurable)

---

## Troubleshooting

### "Invalid Redirect URI" Error

**Problem**: Redirect URI doesn't match PingOne configuration.

**Solution**:
1. Check redirect URI in PingOne Admin Console
2. Ensure exact match (including protocol, domain, path, trailing slashes)
3. Update redirect URI in Step 0 to match PingOne config

### "State Mismatch" Error

**Problem**: State parameter doesn't match (possible CSRF attack).

**Solution**:
1. Restart the flow from Step 0
2. Ensure you're using the same browser session
3. Don't share authorization URLs between sessions

### "Authorization Code Not Found" Error

**Problem**: Authorization code not in callback URL.

**Solution**:
1. Check callback URL for `code` parameter
2. Verify redirect URI matches PingOne config
3. Ensure you completed authentication on PingOne

### "Token Exchange Failed" Error

**Problem**: Token exchange request failed.

**Common Causes**:
- Authorization code expired (codes expire quickly)
- Authorization code already used (codes are single-use)
- Client secret incorrect
- PKCE code verifier doesn't match challenge
- Redirect URI mismatch

**Solution**:
1. Check error message for specific cause
2. Verify client ID and secret are correct
3. Ensure PKCE code verifier matches (if PKCE enabled)
4. Restart flow if code expired or was used

### "Unsupported Authentication Method" Error

**Problem**: Client authentication method doesn't match PingOne configuration.

**Solution**:
1. Check PingOne app configuration for "Token Endpoint Authentication Method"
2. Update Step 0 to match PingOne configuration
3. Use app lookup feature to auto-sync configuration

---

## FAQ

### Q: Do I need PKCE?

**A**: PKCE is **recommended** for all clients, especially public clients (SPAs, mobile apps). It's **required** in OAuth 2.1 for public clients. Even confidential clients benefit from PKCE's additional security.

### Q: What's the difference between OAuth 2.0 and OIDC?

**A**: 
- **OAuth 2.0**: Authorization only - you get an access token for API access
- **OIDC Core 1.0**: Adds identity layer - you get an ID token with user identity information

### Q: Can I use this flow without a backend?

**A**: No. The authorization code must be exchanged for tokens on a secure backend. The client secret (if used) must never be exposed in client-side code.

### Q: How long is the authorization code valid?

**A**: Authorization codes expire quickly (typically 10 minutes). Exchange the code for tokens immediately after receiving it.

### Q: Can I reuse an authorization code?

**A**: No. Authorization codes are single-use. Once exchanged, they cannot be used again.

### Q: What if my access token expires?

**A**: Use the refresh token (if available) to obtain a new access token without re-authentication. If no refresh token, restart the flow.

### Q: What scopes should I request?

**A**: 
- For OAuth 2.0: Request only the scopes you need (e.g., `api:read api:write`)
- For OIDC: Include `openid` scope to get ID token, plus any other scopes (e.g., `openid profile email`)

---

## Related Documentation

- [UI Contract](./unified-flow-authorization-code-ui-contract.md) - Technical specification for developers
- [Restore Documentation](./unified-flow-authorization-code-restore.md) - Implementation details for restoration
- [Unified Flow Main Page](./unified-flow-main-page-ui-doc.md) - Main page documentation

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
- **Authorization URL Generation**: Build OAuth/OIDC authorization request
- **Authorization Callback**: Handle redirect with code
- **Token Exchange**: Exchange authorization code for tokens
- **Token Introspection**: Validate token status
- **UserInfo**: Retrieve user profile (OIDC only)
- **Token Refresh**: Obtain new access tokens (if refresh token available)

### How to Access

1. Complete any step in the flow
2. Click **"View API Documentation"** button at the bottom
3. View detailed request/response for each call
4. Download as Postman collection for testing
