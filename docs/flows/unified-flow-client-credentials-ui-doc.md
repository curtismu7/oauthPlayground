# Unified Flow - Client Credentials Flow UI Documentation

**Version:** 1.1  
**Last Updated:** 2025-01-27  
**Audience:** End Users  
**Flow Type:** Client Credentials Flow (OAuth 2.0 / OAuth 2.1)

## Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Step-by-Step Guide](#step-by-step-guide)
4. [Understanding the Results](#understanding-the-results)
5. [Troubleshooting](#troubleshooting)
6. [FAQ](#faq)

---

## Overview

The **Client Credentials Flow** is an OAuth 2.0 authentication method designed for server-to-server communication where there is no user involved. The application authenticates using its own credentials (client ID and client secret) to obtain an access token for API access.

### Key Characteristics

- ✅ **Server-to-Server**: No user interaction required
- ✅ **Machine-to-Machine**: Perfect for API-to-API communication
- ✅ **Confidential Client**: Requires client secret
- ✅ **No User Context**: Access tokens are not tied to a specific user
- ❌ **No Refresh Tokens**: Access tokens must be re-requested when expired
- ❌ **No ID Tokens**: Not part of OpenID Connect (no user identity)

### When to Use

- API-to-API communication
- Background jobs and scheduled tasks
- Service accounts
- Machine-to-machine authentication
- Microservices authentication
- Automated scripts and tools

### Spec Version Support

- ✅ **OAuth 2.0**: Fully supported (RFC 6749)
- ✅ **OAuth 2.1**: Fully supported
- ❌ **OpenID Connect (OIDC)**: Not supported (no user identity in client credentials flow)

---

## Getting Started

### Prerequisites

Before using the Client Credentials Flow, ensure you have:

1. **PingOne Account**: Access to PingOne Admin Console
2. **Application Configuration**: A PingOne application configured for Client Credentials grant type
3. **Environment ID**: Your PingOne Environment ID
4. **Client ID**: Your OAuth application's Client ID
5. **Client Secret**: Your OAuth application's Client Secret (required)
6. **Scopes**: Space-separated list of OAuth scopes (e.g., `api:read api:write`)

### Accessing the Flow

1. Navigate to the Unified Flow page
2. Select **Spec Version**: Choose "OAuth 2.0" or "OAuth 2.1"
3. Select **Flow Type**: Choose "Client Credentials"

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
   - **Required** for client credentials flow
   - Where to find: PingOne Admin Console → Applications → Your App → Configuration
   - ⚠️ **Security**: Keep your client secret secure - never expose it in client-side code

4. **Scopes** *(Required)*
   - Space-separated list of requested permissions
   - Examples: `api:read api:write`, `profile email`
   - **Note**: No `openid` scope needed (not OIDC flow)

5. **Client Authentication Method** *(Required)*
   - How to authenticate with the token endpoint
   - Options:
     - `client_secret_basic`: HTTP Basic Auth (Authorization header)
     - `client_secret_post`: Client secret in POST body
     - `client_secret_jwt`: Client secret used to sign JWT assertion (HS256)
     - `private_key_jwt`: Private key used to sign JWT assertion (RS256)

#### Optional Configuration

- **Audience**: Resource server identifier (if using resource-based scopes)
- **Resource**: Resource identifier for token audience

#### What Happens

- Your credentials are validated
- The form checks that all required fields are filled
- Credentials are saved automatically
- The "Next Step" button becomes enabled when ready

#### Tips

- 💡 Use the **App Picker** (if available) to auto-fill credentials from PingOne
- 💡 **Client secret is required** - this flow uses confidential clients
- 💡 Choose appropriate scopes for your API access needs
- 💡 `client_secret_basic` is most common, but JWT-based methods are more secure

---

### Step 1: Request Token

**Purpose**: Request an access token using your client credentials.

#### Pre-Flight Validation

Before requesting tokens, the system automatically validates your configuration against PingOne:

**What Happens:**
1. **Validation Starts**: A small spinner appears with the message "🔍 Validating Configuration against PingOne..."
2. **Configuration Checked**: The system verifies:
   - Client secret requirements
   - Token endpoint authentication method compatibility
   - Scope requirements
   - Client credentials flow compatibility

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

#### What You'll See

1. **Token Request Information**
   - Shows what will be sent to the token endpoint
   - Displays grant type, client ID, scopes, and authentication method

2. **Request Token Button**
   - "Request Token" button
   - Executes the token request

3. **Educational Content**
   - Explains what happens in the client credentials flow
   - Information about server-to-server authentication

#### What Happens When You Click "Request Token"

1. **Request Sent**: POST request to PingOne token endpoint
2. **Client Authentication**: Client ID and secret are authenticated using selected method
3. **Token Issued**: PingOne validates credentials and issues access token
4. **Response Received**: Access token with expiration and scopes

#### Token Request Details

**Endpoint**: `POST /api/token-exchange` (backend proxy)

**Request Body**:
```json
{
  "grant_type": "client_credentials",
  "client_id": "{client_id}",
  "client_secret": "{client_secret}",
  "scope": "{scopes}",
  "audience": "{audience}",  // Optional
  "resource": "{resource}",  // Optional
  "client_auth_method": "{auth_method}"
}
```

**Authentication Methods**:

1. **`client_secret_basic`** (HTTP Basic Auth):
   - Client ID and secret in `Authorization: Basic {base64(client_id:client_secret)}` header
   - Secret not in request body

2. **`client_secret_post`**:
   - Client ID and secret in POST body
   - Simpler but less secure than Basic Auth

3. **`client_secret_jwt`**:
   - Client secret used to sign JWT assertion
   - JWT assertion in `client_assertion` parameter
   - More secure (no secret in headers/body)

4. **`private_key_jwt`**:
   - Private key used to sign JWT assertion (RS256)
   - Most secure method (asymmetric cryptography)
   - Requires private key configuration

#### Token Response

**Success Response**:
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "api:read api:write"
}
```

**Note**: Client credentials flow does NOT return:
- ❌ Refresh tokens (must re-request when expired)
- ❌ ID tokens (no user identity)
- ❌ User information (no user context)

#### Success Indicators

- ✅ **Green Success Box**: "Access token received successfully!"
- ✅ **Token Display**: Shows access token, expiration, and scopes
- ✅ **Auto-Advance**: Automatically proceeds to Step 2 (Display Tokens)

#### Common Issues

**Problem**: "Invalid client credentials"
- **Solution**: Check that client ID and secret are correct
- **Solution**: Verify client authentication method matches PingOne configuration
- **Solution**: Ensure client secret hasn't been rotated/changed

**Problem**: "Invalid scope"
- **Solution**: Check that requested scopes are allowed for your application
- **Solution**: Verify scopes are registered in PingOne Admin Console
- **Solution**: Check scope format (space-separated, not comma-separated)

**Problem**: "Client authentication failed"
- **Solution**: Verify client authentication method is correct
- **Solution**: For JWT methods, check that JWT is properly signed
- **Solution**: For private_key_jwt, verify private key is correct

**Problem**: "Grant type not enabled"
- **Solution**: Enable "Client Credentials" grant type in PingOne application
- **Solution**: Check PingOne Admin Console → Applications → Your App → Grant Types

#### What's Stored

After successful token request:
- Access token (saved to browser session storage)
- Token expiration time
- Granted scopes
- Token type (always `Bearer`)

#### Next Steps

- Access token is received and validated
- Proceed to Step 2 to view the token details
- The system automatically saves the token for later use

---

### Step 2: Display Tokens

**Purpose**: View your received access token, decode it, and understand its contents.

#### What You'll See

1. **Access Token**
   - The full access token value
   - Token type (always `Bearer`)
   - Expiration time
   - **Actions**:
     - **Copy**: Copy token to clipboard
     - **Decode**: View JWT claims (if token is a JWT)

2. **Token Information**
   - Granted scopes
   - Expiration countdown
   - Token format (JWT or opaque)

3. **Educational Content**
   - Why refresh tokens aren't issued
   - Why ID tokens aren't available
   - How to use the access token

#### Understanding Access Tokens

- **Purpose**: Used to access protected resources (APIs)
- **Format**: Usually a JWT (JSON Web Token) or opaque string
- **Expiration**: Typically expires in 1 hour (3600 seconds)
- **Storage**: ⚠️ Never store in localStorage - use sessionStorage or memory
- **User Context**: ⚠️ No user identity - token is for the application, not a user

#### Token Decoding

When you click "Decode", you'll see:

**Access Token Claims** (if JWT):
- `aud` (Audience): Who the token is for (API/resource server)
- `iss` (Issuer): Who issued the token (PingOne)
- `exp` (Expiration): When the token expires
- `scope`: What permissions the token has
- `client_id`: Which application the token belongs to
- `sub` (Subject): Client ID (not user ID - no user in this flow)

#### Important Notes

- ⚠️ **No Refresh Tokens**: Must re-request token when it expires
- ⚠️ **No ID Tokens**: No user identity in client credentials flow
- ⚠️ **No User Context**: Token represents the application, not a user
- ⚠️ **Token Security**: Tokens are sensitive - don't share or log them
- ⚠️ **Token Expiration**: Access tokens expire - plan for re-authentication

#### Next Steps

- View token details and claims
- Copy token for use in your application
- Proceed to Step 3 for token introspection

---

### Step 3: Introspection & UserInfo

**Purpose**: Validate the access token and understand its properties.

#### Token Introspection

**What It Does**: Asks the authorization server to validate a token and return its properties.

**Available for**:
- ✅ **Access Token**: Can be introspected
- ❌ **Refresh Token**: Not available (not issued in client credentials flow)
- ❌ **ID Token**: Not available (not issued in client credentials flow)

**How to Use**:
1. Select "Access Token" (only option available)
2. Click "Introspect Token"
3. View the introspection results

**Introspection Results Include**:
- `active`: Whether the token is still valid
- `scope`: Permissions granted to the token
- `client_id`: Which application the token belongs to
- `sub` (Subject): Client ID (not user ID)
- `exp` (Expiration): When the token expires
- `iat` (Issued At): When the token was issued
- `aud` (Audience): Resource server identifier

**Important Note**: 
- ✅ Introspection requires client authentication (client secret)
- ✅ Client credentials flow uses confidential clients (has client secret)
- ✅ Introspection is fully supported

#### UserInfo Endpoint

**Availability**:
- ❌ **Not Available**: UserInfo endpoint requires user context
- ❌ **Client Credentials Flow**: No user involved, so no UserInfo

**Why Not Available**:
- Client credentials flow is for machine-to-machine authentication
- No user is authenticated, so there's no user information to retrieve
- UserInfo endpoint requires an access token tied to a user identity

#### Educational Content

This step also explains:
- Why refresh tokens aren't available (must re-request)
- Why ID tokens aren't available (no user identity)
- Why UserInfo isn't available (no user context)
- How to use introspection to validate tokens

#### Limitations

**Client Credentials Flow Limitations**:
- ❌ No refresh tokens (must re-request when expired)
- ❌ No ID tokens (no user identity)
- ❌ No UserInfo (no user context)
- ⚠️ Tokens expire and must be re-requested

#### Best Practices

1. ✅ **Cache Tokens**: Store tokens in memory/cache until expiration
2. ✅ **Monitor Expiration**: Track token expiration and re-request before expiry
3. ✅ **Use Appropriate Scopes**: Request only the scopes you need
4. ✅ **Secure Storage**: Never expose client secrets in client-side code
5. ✅ **Use JWT Auth Methods**: More secure than basic auth (no secret in headers)

---

## Understanding the Results

### What You Receive

#### Access Token
- **Purpose**: Access protected resources (APIs)
- **Lifetime**: Typically 1 hour (3600 seconds)
- **Format**: JWT or opaque string
- **Use**: Include in `Authorization: Bearer {token}` header
- **Context**: Application-level (not user-level)

#### No Refresh Token
- **Why**: Client credentials flow doesn't issue refresh tokens
- **Impact**: Must re-request token when it expires
- **Best Practice**: Cache token and re-request before expiration

#### No ID Token
- **Why**: No user is involved in client credentials flow
- **Impact**: No user identity information available
- **Note**: This is expected behavior for machine-to-machine flows

### Token Expiration

- Access tokens typically expire in **3600 seconds (1 hour)**
- When tokens expire, you must:
  1. Re-request token using client credentials
  2. Use new token for API calls
  3. No refresh token available for renewal

### Token Re-Request Strategy

**Recommended Approach**:
1. **Cache Token**: Store token in memory/cache
2. **Track Expiration**: Monitor `expires_in` value
3. **Proactive Renewal**: Re-request token before expiration (e.g., at 90% of lifetime)
4. **Error Handling**: Handle 401 errors by re-requesting token

---

## Troubleshooting

### Common Issues

#### "Client credentials grant type not enabled"

**Problem**: Error message about grant type not being enabled.

**Solution**: 
1. Go to PingOne Admin Console: https://admin.pingone.com
2. Navigate to: Applications → Your Application → Configuration
3. Under "Grant Types", check "Client Credentials" (or "CLIENT_CREDENTIALS")
4. Click "Save"
5. Try the request again

#### "Invalid client credentials"

**Problem**: Error when requesting token about invalid credentials.

**Solutions**:
1. Check that client ID is correct
2. Verify client secret is correct (check for typos)
3. Ensure client secret hasn't been rotated/changed
4. Verify client authentication method matches PingOne configuration

#### "Invalid scope"

**Problem**: Error about scope not being allowed.

**Solutions**:
1. Check that requested scopes are registered in PingOne
2. Verify scope format (space-separated, not comma-separated)
3. Check PingOne Admin Console → Applications → Your App → Scopes
4. Ensure scopes are allowed for client credentials grant type

#### "Client authentication failed"

**Problem**: Error about client authentication.

**Solutions**:
1. Verify client authentication method is correct
2. For `client_secret_basic`: Check Authorization header format
3. For `client_secret_post`: Check POST body format
4. For JWT methods: Verify JWT is properly signed
5. For `private_key_jwt`: Verify private key is correct

#### "Token introspection not working"

**Problem**: Can't introspect access token.

**Solutions**:
1. Check if your application is configured for introspection
2. Verify client authentication is set up correctly
3. Check error message for specific issue
4. Note: Client credentials flow uses confidential clients, so introspection should work

#### "No refresh token received"

**Problem**: Refresh token not present after token request.

**Solution**: 
- This is expected - client credentials flow does NOT issue refresh tokens
- You must re-request the token when it expires
- This is normal behavior for machine-to-machine flows

#### "UserInfo not available"

**Problem**: UserInfo button is disabled or not shown.

**Solution**:
- This is expected - client credentials flow has no user context
- UserInfo endpoint requires user identity, which doesn't exist in this flow
- This is normal behavior for machine-to-machine authentication

---

## FAQ

### General Questions

**Q: What's the difference between Client Credentials and Authorization Code flow?**  
A: Client Credentials is for machine-to-machine (no user), while Authorization Code is for user authentication. Client Credentials doesn't involve a user login.

**Q: Can I use Client Credentials flow for user authentication?**  
A: No, Client Credentials flow is specifically for machine-to-machine authentication. Use Authorization Code flow for user authentication.

**Q: Do I need a redirect URI for Client Credentials flow?**  
A: No, redirect URIs are not used in client credentials flow (no user redirect).

**Q: Can I get refresh tokens in Client Credentials flow?**  
A: No, refresh tokens are not issued. You must re-request the token when it expires.

**Q: Can I get ID tokens in Client Credentials flow?**  
A: No, ID tokens require user authentication. Client Credentials flow has no user context.

### Technical Questions

**Q: What authentication method should I use?**  
A: `client_secret_basic` is most common. `client_secret_jwt` or `private_key_jwt` are more secure (no secret in headers/body).

**Q: How do I handle token expiration?**  
A: Cache the token, track expiration time, and re-request before it expires. Handle 401 errors by re-requesting.

**Q: Can I use PKCE with Client Credentials flow?**  
A: No, PKCE is for authorization code flows with public clients. Client Credentials uses confidential clients.

**Q: How long do tokens last?**  
A: Typically 3600 seconds (1 hour), but this is configurable in PingOne.

**Q: What scopes should I use?**  
A: Use scopes appropriate for your API access needs. Examples: `api:read api:write`, `profile email`.

### Security Questions

**Q: Is it safe to store client secret in my application?**  
A: For server-side applications, yes (keep it secure). For client-side applications (browsers, mobile apps), never expose the secret - use a different flow.

**Q: Should I use JWT-based authentication methods?**  
A: Yes, JWT-based methods (`client_secret_jwt`, `private_key_jwt`) are more secure as they don't send the secret in headers or body.

**Q: How do I rotate client secrets?**  
A: Rotate secrets in PingOne Admin Console, then update your application configuration. Old tokens will continue to work until expiration.

**Q: Can I use Client Credentials flow in a browser?**  
A: Not recommended - client secrets should not be exposed in browser code. Use Authorization Code + PKCE for browser-based applications.

---

## Additional Resources

- [OAuth 2.0 Specification (RFC 6749)](https://tools.ietf.org/html/rfc6749)
- [OAuth 2.1 Best Current Practices](https://oauth.net/2.1/)
- [PingOne API Documentation](https://apidocs.pingidentity.com/pingone/main/v1/api/)
- [Client Credentials Grant (RFC 6749 Section 4.4)](https://tools.ietf.org/html/rfc6749#section-4.4)
- [PingOne Postman Collections](https://apidocs.pingidentity.com/pingone/platform/v1/api/#the-pingone-postman-collections)
- [PingOne Postman Environment Template](https://apidocs.pingidentity.com/pingone/platform/v1/api/#the-pingone-postman-environment-template)

---

## Support

If you encounter issues not covered in this documentation:

1. Check the **Troubleshooting** section above
2. Review PingOne Admin Console configuration
3. Check browser console for error messages
4. Verify all prerequisites are met
5. Contact PingOne support if configuration issues persist


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

**✅ Pre-flight Validation** (if enabled)
- **Configuration Checks**: Validate client credentials, auth method

**🔄 OAuth Flow** (always tracked)
- **Token Request**: Exchange client credentials for access token
- **Token Introspection**: Validate token status (optional)

### How to Access

1. Complete any step in the flow
2. Click **"View API Documentation"** button at the bottom
3. View detailed request/response for each call
4. Download as Postman collection for testing
