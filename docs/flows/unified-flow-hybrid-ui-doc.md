# Unified Flow - Hybrid Flow UI Documentation

**Version:** 1.0  
**Last Updated:** 2025-01-27  
**Audience:** End Users  
**Flow Type:** Hybrid Flow (OAuth 2.0 / OIDC)

## Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Step-by-Step Guide](#step-by-step-guide)
4. [Understanding the Results](#understanding-the-results)
5. [Troubleshooting](#troubleshooting)
6. [FAQ](#faq)

---

## Overview

The **Hybrid Flow** is an OpenID Connect authentication method that combines the Authorization Code flow with the Implicit flow. It returns both an authorization code (for secure token exchange) and tokens directly in the URL fragment (for immediate use). This flow provides the security of authorization code exchange while also providing immediate access to tokens.

### Key Characteristics

- ✅ **Combines Best of Both**: Authorization code for security + immediate tokens for convenience
- ✅ **Multiple Response Types**: Supports `code id_token`, `code token`, or `code token id_token`
- ✅ **PKCE Support**: Can use PKCE for additional security
- ✅ **Refresh Tokens**: Available when using authorization code exchange
- ⚠️ **OIDC Only**: Primarily used with OpenID Connect (not pure OAuth 2.0)
- ⚠️ **Not in OAuth 2.1**: Hybrid flow is not part of OAuth 2.1 specification

### When to Use

- OpenID Connect applications needing immediate ID tokens
- Applications requiring both secure token exchange and immediate token access
- Scenarios where you need user identity immediately but also want refresh tokens
- **Note**: For new applications, Authorization Code + PKCE is often simpler and more secure

### Spec Version Support

- ✅ **OAuth 2.0**: Supported (with OIDC extensions)
- ❌ **OAuth 2.1**: Not supported (hybrid flow not in OAuth 2.1)
- ✅ **OpenID Connect (OIDC)**: Fully supported (recommended)

---

## Getting Started

### Prerequisites

Before using the Hybrid Flow, ensure you have:

1. **PingOne Account**: Access to PingOne Admin Console
2. **Application Configuration**: A PingOne application configured for Hybrid flow
3. **Environment ID**: Your PingOne Environment ID
4. **Client ID**: Your OAuth application's Client ID
5. **Client Secret**: Required for token exchange (confidential client)
6. **Redirect URI**: A registered redirect URI (e.g., `http://localhost:3000/unified-callback`)

### Accessing the Flow

1. Navigate to the Unified Flow page
2. Select **Spec Version**: Choose "OpenID Connect" (recommended) or "OAuth 2.0"
3. Select **Flow Type**: Choose "Hybrid" (Note: Not available in OAuth 2.1)

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

3. **Client Secret** *(Required)*
   - Your OAuth application's Client Secret
   - Required for token exchange step
   - Where to find: PingOne Admin Console → Applications → Your App → Configuration

4. **Scopes** *(Required)*
   - Space-separated list of requested permissions
   - **Must include `openid`** for OIDC hybrid flow
   - Example: `openid profile email offline_access`

5. **Redirect URI** *(Required)*
   - The URL where PingOne will redirect after authorization
   - Default: `http://localhost:3000/unified-callback`
   - **Must match** the URI registered in your PingOne application

#### Optional Configuration

- **Response Type**: Choose what to receive in the callback
  - `code id_token`: Authorization code + ID token (most common)
  - `code token`: Authorization code + access token
  - `code token id_token`: Authorization code + access token + ID token
- **Response Mode**: How tokens are returned (`fragment`, `query`, `form_post`, `pi.flow`)
- **PKCE**: Enable PKCE for additional security (recommended)
- **Prompt**: Control authentication prompts (`login`, `consent`, `none`)
- **Login Hint**: Pre-fill username/email for login
- **Max Age**: Maximum authentication age in seconds
- **Display**: UI display mode (`page`, `popup`, `touch`, `wap`)

#### What Happens

- Your credentials are validated
- The form checks that all required fields are filled
- Credentials are saved automatically
- The "Next Step" button becomes enabled when ready

#### Tips

- 💡 Use the **App Picker** (if available) to auto-fill credentials from PingOne
- 💡 **Must include `openid` scope** for hybrid flow
- 💡 Enable **PKCE** for better security
- 💡 The redirect URI must be **exactly** registered in PingOne

---

### Step 1: Generate Authorization URL

**Purpose**: Create and open the authorization URL that will start the authentication process.

#### Pre-Flight Validation

Before generating the authorization URL, the system automatically validates your configuration against PingOne:

**What Happens:**
1. **Validation Starts**: A small spinner appears with the message "🔍 Validating Configuration against PingOne..."
2. **Configuration Checked**: The system verifies:
   - Redirect URI matches PingOne configuration
   - PKCE requirements (if applicable)
   - Client authentication method compatibility
   - Response type validity (must be valid hybrid response type)
   - Scope requirements (OIDC requires `openid` scope)

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

#### What You'll See

1. **Authorization URL** (read-only)
   - The full URL that will be sent to PingOne
   - Contains all your configuration parameters
   - Example: `https://auth.pingone.com/{env}/as/authorize?client_id=...&response_type=code id_token&...`

2. **Educational Content**
   - Explanation of what happens in the hybrid flow
   - Information about receiving both code and tokens

3. **Action Buttons**
   - **Open in New Tab**: Opens the authorization URL in a new browser tab
   - **Copy URL**: Copies the URL to your clipboard

#### What Happens When You Click "Open in New Tab"

1. A new browser tab/window opens
2. You're redirected to PingOne's login page
3. You enter your credentials and authorize the application
4. PingOne redirects back to your redirect URI
5. **Both authorization code AND tokens are included** in the callback URL:
   - Authorization code in query string: `?code=...`
   - Tokens in URL fragment: `#access_token=...&id_token=...`

#### Understanding the URL Parameters

The generated URL includes:

- `client_id`: Your application's Client ID
- `response_type`: `code id_token`, `code token`, or `code token id_token`
- `redirect_uri`: Where to send the user after authorization
- `scope`: Requested permissions (must include `openid`)
- `state`: A random value to prevent CSRF attacks
- `nonce`: A random value to prevent replay attacks (OIDC)
- `code_challenge`: PKCE code challenge (if PKCE enabled)
- `code_challenge_method`: PKCE method (`S256` or `plain`)
- `response_mode`: How tokens are returned (`fragment`, `query`, etc.)

#### Important Notes

- ⚠️ **Keep the tab open**: The redirect will happen in the same tab
- ⚠️ **Don't close the tab**: You'll need to see the callback URL
- ⚠️ **Security**: The `state` parameter prevents CSRF attacks - it's automatically validated
- ⚠️ **PKCE**: If enabled, `code_verifier` is stored securely for token exchange

#### Next Steps

After authorization:
- The new tab redirects to your callback URL
- Authorization code is in the query string
- Tokens are in the URL fragment (if `response_type` includes tokens)
- Return to Step 2 to handle the callback

---

### Step 2: Handle Callback

**Purpose**: Extract the authorization code and tokens from the callback URL.

#### What You'll See

1. **Auto-Detection Status**
   - If a callback URL is detected, you'll see: "Callback detected in URL"
   - The system will automatically extract the authorization code
   - If tokens are in the fragment, they'll also be extracted automatically

2. **Callback URL Input** (if needed)
   - If auto-detection doesn't work, you can paste the full callback URL
   - Format: `http://localhost:3000/unified-callback?code=...&state=...#access_token=...&id_token=...`

3. **Parse Callback Button**
   - Click to manually extract authorization code and tokens
   - Only shown if extraction hasn't happened yet

#### What Happens During Parsing

1. **Extract Query Parameters**: Reads authorization code from query string (`?code=...`)
2. **Extract Fragment**: Reads tokens from URL fragment (`#access_token=...`)
3. **Validate State**: Ensures the `state` matches what was sent (security check)
4. **Validate Nonce** (OIDC): Ensures the nonce in the ID token matches (security check)
5. **Extract Both**: Saves authorization code AND tokens (if present in fragment)

#### Callback URL Format

The callback URL contains:

**Query String** (authorization code):
```
?code=abc123...
&state=v8u-hybrid-1234567890
```

**URL Fragment** (tokens, if `response_type` includes tokens):
```
#access_token=eyJhbGciOiJSUzI1NiIs...  (if code token or code token id_token)
&token_type=Bearer
&expires_in=3600
&id_token=eyJhbGciOiJSUzI1NiIs...  (if code id_token or code token id_token)
&scope=openid profile email
&state=v8u-hybrid-1234567890
&session_state=abc123...  (OIDC only)
```

#### Response Type Variations

**`code id_token`** (most common):
- ✅ Authorization code in query string
- ✅ ID token in fragment
- ⚠️ Access token NOT in fragment (must exchange code)

**`code token`**:
- ✅ Authorization code in query string
- ✅ Access token in fragment
- ⚠️ ID token NOT in fragment

**`code token id_token`**:
- ✅ Authorization code in query string
- ✅ Access token in fragment
- ✅ ID token in fragment

#### Success Indicators

- ✅ **Green Success Box**: "Authorization code extracted successfully!"
- ✅ **Token Count**: Shows number of tokens extracted (if in fragment)
- ✅ **Auto-Advance**: Automatically proceeds to Step 3 (if code exchange needed) or Step 4 (if tokens already received)

#### Common Issues

**Problem**: "No callback detected in URL"
- **Solution**: Make sure you completed authorization and were redirected back
- **Solution**: Check that the redirect URI matches what's configured

**Problem**: "State mismatch"
- **Solution**: This is a security check - try starting from Step 1 again
- **Solution**: Don't manually edit the URL

**Problem**: "Missing authorization code"
- **Solution**: Check that your PingOne application is configured for Hybrid flow
- **Solution**: Verify that the correct grant type is enabled

**Problem**: "Tokens not in fragment"
- **Solution**: Check your `response_type` setting
- **Solution**: For `code id_token`, only ID token is in fragment (access token requires exchange)

#### What's Stored

After successful parsing:
- Authorization code (saved to component state)
- Access token (if in fragment, saved to browser session storage)
- ID token (if in fragment, saved to browser session storage)
- State parameter (for validation)
- Nonce (for validation)

#### Next Steps

- If tokens are in fragment: Proceed to Step 4 (Display Tokens)
- If only code is present: Proceed to Step 3 (Exchange Code for Tokens)

---

### Step 3: Exchange Code for Tokens

**Purpose**: Exchange the authorization code for access token and refresh token (if requested).

#### When This Step Appears

This step appears when:
- `response_type` is `code id_token` (ID token in fragment, but access token needs exchange)
- `response_type` is `code` (no tokens in fragment, all tokens via exchange)
- You want to get a refresh token (requires code exchange)

#### What You'll See

1. **Authorization Code Display**
   - Shows the authorization code that was extracted
   - Read-only (for security)

2. **Token Exchange Button**
   - "Exchange Code for Tokens" button
   - Executes the token exchange request

3. **Educational Content**
   - Explains what happens during token exchange
   - Information about refresh tokens

#### What Happens When You Click "Exchange Code for Tokens"

1. **Request Sent**: POST request to PingOne token endpoint
2. **Client Authentication**: Client ID and secret are authenticated
3. **Code Exchange**: Authorization code is exchanged for tokens
4. **Response Received**: Access token, refresh token (if requested), and optionally ID token

#### Token Exchange Request

**Endpoint**: `POST /api/token-exchange` (backend proxy)

**Request Body**:
```json
{
  "grant_type": "authorization_code",
  "code": "{authorization_code}",
  "redirect_uri": "{redirect_uri}",
  "client_id": "{client_id}",
  "client_secret": "{client_secret}",
  "code_verifier": "{code_verifier}"  // If PKCE enabled
}
```

#### Token Exchange Response

**Success Response**:
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "eyJhbGciOiJSUzI1NiIs...",  // If offline_access scope
  "id_token": "eyJhbGciOiJSUzI1NiIs...",  // If openid scope
  "scope": "openid profile email offline_access"
}
```

#### PKCE Support

If PKCE is enabled:
- `code_verifier` is automatically included in the request
- `code_challenge_method` must match what was sent in Step 1
- PKCE provides additional security for public clients

#### Success Indicators

- ✅ **Green Success Box**: "Tokens received successfully!"
- ✅ **Token Count**: Shows access token, refresh token (if present), ID token (if present)
- ✅ **Auto-Advance**: Automatically proceeds to Step 4 (Display Tokens)

#### Common Issues

**Problem**: "Invalid authorization code"
- **Solution**: Authorization codes are single-use and expire quickly
- **Solution**: Make sure you're using the code from the most recent authorization
- **Solution**: Don't manually edit the code

**Problem**: "Client authentication failed"
- **Solution**: Check that client secret is correct
- **Solution**: Verify client authentication method matches PingOne configuration

**Problem**: "Code verifier mismatch" (PKCE)
- **Solution**: PKCE code verifier must match the code challenge sent in Step 1
- **Solution**: Don't start a new flow mid-way (code verifier is stored per flow)

**Problem**: "No refresh token received"
- **Solution**: Ensure `offline_access` scope is included
- **Solution**: Check PingOne application configuration allows refresh tokens

#### What's Stored

After successful exchange:
- Access token (saved to browser session storage)
- Refresh token (if present, saved to browser session storage)
- ID token (if present, saved to browser session storage)
- Token expiration time
- Granted scopes

#### Next Steps

- Tokens are received and validated
- Proceed to Step 4 to view the tokens
- The system automatically saves tokens for later use

---

### Step 4: Display Tokens

**Purpose**: View your received tokens, decode them, and understand their contents.

#### What You'll See

1. **Access Token**
   - The full access token value
   - Token type (always `Bearer`)
   - Expiration time
   - **Actions**:
     - **Copy**: Copy token to clipboard
     - **Decode**: View JWT claims (if token is a JWT)

2. **ID Token** (OIDC)
   - The full ID token value
   - Contains user identity information
   - **Actions**:
     - **Copy**: Copy token to clipboard
     - **Decode**: View JWT payload (claims like `sub`, `email`, `name`)

3. **Refresh Token** (if `offline_access` scope)
   - The full refresh token value
   - Used to obtain new access tokens
   - **Actions**:
     - **Copy**: Copy token to clipboard
     - **Decode**: View JWT claims (if token is a JWT)

4. **Educational Content**
   - Token expiration information
   - Security best practices
   - How to use refresh tokens

#### Understanding Access Tokens

- **Purpose**: Used to access protected resources (APIs)
- **Format**: Usually a JWT (JSON Web Token) or opaque string
- **Expiration**: Typically expires in 1 hour (3600 seconds)
- **Storage**: ⚠️ Never store in localStorage - use sessionStorage or memory

#### Understanding ID Tokens (OIDC)

- **Purpose**: Contains user identity information
- **Format**: Always a JWT
- **Claims**: Includes `sub` (user ID), `email`, `name`, `nonce`, `aud`, `iss`, `exp`
- **Validation**: Should be validated locally (not via introspection)

#### Understanding Refresh Tokens

- **Purpose**: Obtain new access tokens without re-authentication
- **Format**: Usually a JWT or opaque string
- **Lifetime**: Typically long-lived (days or weeks)
- **Storage**: ⚠️ Store securely (encrypted, not in localStorage for web apps)

#### Token Decoding

When you click "Decode", you'll see:

**Access Token Claims** (if JWT):
- `aud` (Audience): Who the token is for
- `iss` (Issuer): Who issued the token
- `exp` (Expiration): When the token expires
- `scope`: What permissions the token has
- `sub` (Subject): User ID

**ID Token Claims**:
- `sub` (Subject): Unique user identifier
- `email`: User's email address
- `name`: User's full name
- `nonce`: Random value (matches what was sent)
- `aud` (Audience): Must match your Client ID
- `iss` (Issuer): PingOne issuer URL
- `exp` (Expiration): Token expiration time
- `iat` (Issued At): When token was issued

**Refresh Token Claims** (if JWT):
- `sub` (Subject): User ID
- `aud` (Audience): Client ID
- `iss` (Issuer): PingOne issuer URL
- `exp` (Expiration): Token expiration time

#### Important Notes

- ✅ **Refresh Tokens**: Available when using `offline_access` scope
- ⚠️ **Token Security**: Tokens are sensitive - don't share or log them
- ⚠️ **Token Expiration**: Access tokens expire - use refresh tokens to renew
- ✅ **ID Token Validation**: ID tokens should be validated locally using JWT verification

#### Next Steps

- View token details and claims
- Copy tokens for use in your application
- Proceed to Step 5 for introspection and UserInfo

---

### Step 5: Introspection & UserInfo

**Purpose**: Validate tokens and retrieve additional user information.

#### Token Introspection

**What It Does**: Asks the authorization server to validate a token and return its properties.

**Available for**:
- ✅ **Access Token**: Can be introspected
- ✅ **Refresh Token**: Can be introspected (if available)
- ❌ **ID Token**: Should be validated locally, not introspected

**How to Use**:
1. Select token type (Access Token or Refresh Token)
2. Click "Introspect Token"
3. View the introspection results

**Introspection Results Include**:
- `active`: Whether the token is still valid
- `scope`: Permissions granted to the token
- `client_id`: Which application the token belongs to
- `sub` (Subject): User ID
- `exp` (Expiration): When the token expires
- `iat` (Issued At): When the token was issued

**Important Note**: 
- ⚠️ Introspection requires client authentication (client secret)
- ✅ Hybrid flow uses confidential clients (has client secret)
- ✅ Introspection is fully supported

#### UserInfo Endpoint (OIDC Only)

**What It Does**: Retrieves additional user profile information using the access token.

**Availability**:
- ✅ **OIDC with `openid` scope**: Available
- ❌ **Pure OAuth 2.0**: Not available

**How to Use**:
1. Ensure you're using OIDC (not pure OAuth 2.0)
2. Ensure your scopes include `openid`
3. Click "Fetch UserInfo"
4. View the user profile information

**UserInfo Response Includes**:
- `sub` (Subject): Unique user identifier
- `email`: User's email address
- `email_verified`: Whether email is verified
- `name`: User's full name
- `given_name`: First name
- `family_name`: Last name
- `picture`: Profile picture URL
- Additional claims based on requested scopes

#### ID Token Local Validation

**Purpose**: Validate ID tokens locally without calling the introspection endpoint.

**Why Local Validation?**
- ID tokens are JWTs designed for local validation by your application
- The introspection endpoint is NOT meant for ID tokens
- Local validation follows OIDC Core 1.0 specification
- Validates the ID token received immediately in the URL fragment

**How to Use**:
1. After receiving your ID token (from the fragment), navigate to the Introspection step
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
- **Nonce**: Matches authorization request (CRITICAL for hybrid flow security)

**Learn More**:
- [OIDC ID Token Validation Spec](https://openid.net/specs/openid-connect-core-1_0.html#IDTokenValidation)

#### Educational Content

This step also explains:
- Why refresh tokens are available (hybrid flow advantage)
- Why ID tokens should be validated locally (security best practice)
- When UserInfo is available (OIDC flows only)

#### Advantages of Hybrid Flow

**Hybrid Flow Benefits**:
- ✅ Immediate ID token (from fragment)
- ✅ Secure token exchange (via authorization code)
- ✅ Refresh tokens available (via code exchange)
- ✅ Best of both worlds (immediate + secure)

#### Best Practices

1. ✅ **Validate ID Tokens Locally**: Use JWT verification libraries
2. ✅ **Use Refresh Tokens**: Renew access tokens without re-authentication
3. ✅ **Use HTTPS**: Always use HTTPS in production
4. ✅ **Store Tokens Securely**: Use sessionStorage or encrypted storage
5. ✅ **Enable PKCE**: Additional security for hybrid flow

---

## Understanding the Results

### What You Receive

#### Access Token
- **Purpose**: Access protected resources (APIs)
- **Lifetime**: Typically 1 hour
- **Format**: JWT or opaque string
- **Use**: Include in `Authorization: Bearer {token}` header

#### ID Token (OIDC)
- **Purpose**: User identity information
- **Lifetime**: Typically 1 hour
- **Format**: Always JWT
- **Use**: Extract user information, validate authentication
- **Source**: Can come from fragment (immediate) or token exchange

#### Refresh Token
- **Purpose**: Obtain new access tokens without re-authentication
- **Lifetime**: Typically long-lived (days or weeks)
- **Format**: JWT or opaque string
- **Use**: Exchange for new access tokens when current token expires
- **Requirement**: Requires `offline_access` scope

### Response Type Variations

**`code id_token`**:
- ✅ Authorization code (for secure exchange)
- ✅ ID token in fragment (immediate)
- ⚠️ Access token via exchange (secure)

**`code token`**:
- ✅ Authorization code (for secure exchange)
- ✅ Access token in fragment (immediate)
- ⚠️ ID token via exchange (if `openid` scope)

**`code token id_token`**:
- ✅ Authorization code (for secure exchange)
- ✅ Access token in fragment (immediate)
- ✅ ID token in fragment (immediate)

### Token Expiration

- Access tokens typically expire in **3600 seconds (1 hour)**
- ID tokens typically expire in **3600 seconds (1 hour)**
- Refresh tokens typically expire in **days or weeks** (configurable)
- When access tokens expire, use refresh tokens to obtain new ones

---

## Troubleshooting

### Common Issues

#### "Hybrid flow not available" in OAuth 2.1

**Problem**: You selected OAuth 2.1 but don't see Hybrid flow.

**Solution**: 
- Hybrid flow is not part of OAuth 2.1 specification
- Use "OAuth 2.0" or "OpenID Connect" instead
- Or use Authorization Code + PKCE flow (recommended for new apps)

#### "Invalid redirect URI"

**Problem**: Error message about redirect URI not matching.

**Solutions**:
1. Check that the redirect URI in the form matches exactly what's registered in PingOne
2. Ensure no trailing slashes or extra characters
3. Check HTTP vs HTTPS
4. Verify the redirect URI is registered in PingOne Admin Console

#### "State mismatch" error

**Problem**: Error when parsing callback about state not matching.

**Solutions**:
1. Don't manually edit the URL
2. Don't use browser back button
3. Start from Step 1 again to generate a new state
4. Complete authorization in one session

#### "Missing authorization code"

**Problem**: Callback doesn't contain authorization code.

**Solutions**:
1. Verify PingOne application has Hybrid grant type enabled
2. Check application configuration in PingOne Admin Console
3. Ensure `response_type` includes `code`
4. Verify user authorized the application

#### "Tokens not in fragment"

**Problem**: Fragment doesn't contain expected tokens.

**Solutions**:
1. Check your `response_type` setting
2. For `code id_token`: Only ID token is in fragment (access token via exchange)
3. For `code token`: Only access token is in fragment
4. For `code token id_token`: Both tokens are in fragment

#### "Code exchange failed"

**Problem**: Token exchange returns an error.

**Solutions**:
1. Check that authorization code hasn't expired (codes expire quickly)
2. Verify client secret is correct
3. Check PKCE code verifier matches (if PKCE enabled)
4. Ensure redirect URI matches exactly
5. Verify grant type is enabled in PingOne

#### "No refresh token received"

**Problem**: Refresh token not present after code exchange.

**Solutions**:
1. Verify `offline_access` scope is included
2. Check PingOne application configuration allows refresh tokens
3. Ensure you're using code exchange (not just fragment tokens)

#### "Introspection not working"

**Problem**: Can't introspect access token.

**Solutions**:
1. Check if your application is configured for introspection
2. Verify client authentication is set up correctly
3. Check error message for specific issue
4. Note: Hybrid flow uses confidential clients, so introspection should work

#### "UserInfo not available"

**Problem**: UserInfo button is disabled.

**Solutions**:
1. Verify you're using OpenID Connect (not pure OAuth 2.0)
2. Check that `openid` scope is included
3. Ensure access token is valid
4. Verify PingOne UserInfo endpoint is accessible

---

## FAQ

### General Questions

**Q: What's the difference between Hybrid flow and Authorization Code flow?**  
A: Hybrid flow returns both authorization code AND tokens in the callback. Authorization Code flow only returns the code (tokens via exchange). Hybrid provides immediate tokens while maintaining secure exchange.

**Q: What's the difference between Hybrid flow and Implicit flow?**  
A: Hybrid flow returns both code and tokens, supports refresh tokens, and uses confidential clients. Implicit flow only returns tokens (no code), no refresh tokens, and uses public clients.

**Q: Should I use hybrid flow for my new application?**  
A: For most cases, Authorization Code + PKCE is simpler and more secure. Use Hybrid flow if you specifically need immediate ID tokens while also wanting refresh tokens.

**Q: Can I get refresh tokens in hybrid flow?**  
A: Yes, refresh tokens are available when you exchange the authorization code and include `offline_access` scope.

**Q: What response type should I use?**  
A: `code id_token` is most common - you get immediate ID token and can exchange code for access/refresh tokens securely.

### Technical Questions

**Q: Why are tokens in the URL fragment?**  
A: URL fragments (after `#`) are not sent to the server, providing some protection. However, they're still visible in browser history.

**Q: How do I validate an ID token?**  
A: Use a JWT library to:
1. Verify the signature (using issuer's public key)
2. Check `aud` matches your Client ID
3. Check `iss` matches the issuer
4. Check `exp` hasn't passed
5. Verify `nonce` matches what you sent

**Q: Can I use PKCE with hybrid flow?**  
A: Yes, PKCE is supported and recommended for hybrid flow, especially for public clients or additional security.

**Q: How long do tokens last?**  
A: Access tokens typically 3600 seconds (1 hour), ID tokens typically 3600 seconds (1 hour), refresh tokens typically days or weeks (configurable in PingOne).

### Security Questions

**Q: Are tokens secure in the URL fragment?**  
A: Fragments are more secure than query parameters (not sent to server), but still visible in:
- Browser history
- Server referrer logs (if links are followed)
- Browser developer tools

**Q: Should I store tokens in localStorage?**  
A: No, use `sessionStorage` or memory. `localStorage` persists across sessions and is accessible to any script on the page.

**Q: How do I protect against CSRF attacks?**  
A: The `state` parameter is automatically validated. Never skip this validation.

**Q: How do I protect against replay attacks (OIDC)?**  
A: The `nonce` parameter is validated in the ID token. The system does this automatically.

**Q: Why use code exchange if tokens are in fragment?**  
A: Code exchange provides:
- Refresh tokens (not in fragment)
- More secure token delivery
- Better for confidential clients
- Standard OAuth 2.0 best practice

---

## Additional Resources

- [OAuth 2.0 Specification (RFC 6749)](https://tools.ietf.org/html/rfc6749)
- [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html)
- [OAuth 2.0 for Native Apps (RFC 8252)](https://tools.ietf.org/html/rfc8252)
- [PingOne Documentation](https://documentation.pingidentity.com/)

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
  - `client_secret`: Your client secret (pre-filled, marked as secret)
  - `workerToken`: Empty (fill in after obtaining token)
- **URL Format**: Matches PingOne documentation format: `{{authPath}}/{{envID}}/as/authorize`, `{{authPath}}/{{envID}}/as/token`
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
    -   `envID`, `client_id`, `client_secret` are pre-filled from your flow credentials
    -   `workerToken` will be empty; fill in after obtaining a worker token
    -   Other variables have default values
6. **Test**: Run requests directly in Postman. All variables are automatically substituted from the environment.

**Reference**: [PingOne Postman Collections Documentation](https://apidocs.pingidentity.com/pingone/platform/v1/api/#the-pingone-postman-collections)

---

## Support

If you encounter issues not covered in this documentation:

1. Check the **Troubleshooting** section above
2. Review PingOne Admin Console configuration
3. Check browser console for error messages
4. Verify all prerequisites are met
5. Contact PingOne support if configuration issues persist

