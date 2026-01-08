# Unified Flow - Implicit Flow UI Documentation

**Version:** 1.0  
**Last Updated:** 2025-01-27  
**Audience:** End Users  
**Flow Type:** Implicit Flow (OAuth 2.0 / OIDC)

## Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Step-by-Step Guide](#step-by-step-guide)
4. [Understanding the Results](#understanding-the-results)
5. [Troubleshooting](#troubleshooting)
6. [FAQ](#faq)

---

## Overview

The **Implicit Flow** is an OAuth 2.0 / OpenID Connect authentication method where tokens are returned directly in the URL after user authorization. This flow is designed for public clients (applications that cannot securely store a client secret, like Single Page Applications running in a browser).

### Key Characteristics

- ✅ **Public Client**: No client secret required
- ✅ **Direct Token Response**: Tokens come in the URL fragment (the part after `#`)
- ⚠️ **No Refresh Tokens**: You must re-authenticate when tokens expire
- ⚠️ **Deprecated in OAuth 2.1**: Consider using Authorization Code + PKCE instead

### When to Use

- Single Page Applications (SPAs)
- Mobile applications
- Desktop applications
- **Note**: For new applications, Authorization Code + PKCE is recommended for better security

### Spec Version Support

- ✅ **OAuth 2.0**: Fully supported
- ❌ **OAuth 2.1**: Not supported (deprecated)
- ✅ **OpenID Connect (OIDC)**: Fully supported (with `openid` scope)

---

## Getting Started

### Prerequisites

Before using the Implicit Flow, ensure you have:

1. **PingOne Account**: Access to PingOne Admin Console
2. **Application Configuration**: A PingOne application configured for Implicit flow
3. **Environment ID**: Your PingOne Environment ID
4. **Client ID**: Your OAuth application's Client ID
5. **Redirect URI**: A registered redirect URI (e.g., `http://localhost:3000/unified-callback`)

### Accessing the Flow

1. Navigate to the Unified Flow page
2. Select **Spec Version**: Choose "OAuth 2.0" or "OpenID Connect"
3. Select **Flow Type**: Choose "Implicit" (Note: Not available in OAuth 2.1)

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

3. **Scopes** *(Required)*
   - Space-separated list of requested permissions
   - Examples:
     - OAuth 2.0: `profile email`
     - OIDC: `openid profile email`
   - **Important for OIDC**: Must include `openid` scope

4. **Redirect URI** *(Required)*
   - The URL where PingOne will redirect after authorization
   - Default: `http://localhost:3000/unified-callback`
   - **Must match** the URI registered in your PingOne application

#### Optional Configuration

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
- 💡 For OIDC, include the `openid` scope to receive an ID token
- 💡 The redirect URI must be **exactly** registered in PingOne

---

### Step 1: Generate Authorization URL

**Purpose**: Create and open the authorization URL that will start the authentication process.

#### What You'll See

1. **Authorization URL** (read-only)
   - The full URL that will be sent to PingOne
   - Contains all your configuration parameters
   - Example: `https://auth.pingone.com/{env}/as/authorize?client_id=...&response_type=token id_token&...`

2. **Educational Content**
   - Explanation of what happens in the implicit flow
   - Information about tokens in the URL fragment

3. **Action Buttons**
   - **Open in New Tab**: Opens the authorization URL in a new browser tab
   - **Copy URL**: Copies the URL to your clipboard

#### What Happens When You Click "Open in New Tab"

1. A new browser tab/window opens
2. You're redirected to PingOne's login page
3. You enter your credentials and authorize the application
4. PingOne redirects back to your redirect URI
5. **Tokens are included in the URL fragment** (after `#`)

#### Understanding the URL Parameters

The generated URL includes:

- `client_id`: Your application's Client ID
- `response_type`: `token id_token` (tokens and ID token)
- `redirect_uri`: Where to send the user after authorization
- `scope`: Requested permissions
- `state`: A random value to prevent CSRF attacks
- `nonce`: A random value to prevent replay attacks (OIDC only)
- `response_mode`: `fragment` (tokens in URL fragment)

#### Important Notes

- ⚠️ **Keep the tab open**: The redirect will happen in the same tab
- ⚠️ **Don't close the tab**: You'll need to see the callback URL
- ⚠️ **Security**: The `state` parameter prevents CSRF attacks - it's automatically validated

#### Next Steps

After authorization:
- The new tab redirects to your callback URL
- Tokens are in the URL fragment (after `#`)
- Return to Step 2 to parse the tokens

---

### Step 2: Parse Callback Fragment

**Purpose**: Extract tokens from the URL fragment after PingOne redirects back.

#### What You'll See

1. **Auto-Detection Status**
   - If a fragment is detected in the URL, you'll see: "Fragment detected in URL"
   - The system will automatically extract tokens

2. **Callback URL Input** (if needed)
   - If auto-detection doesn't work, you can paste the full callback URL
   - Format: `http://localhost:3000/unified-callback#access_token=...&id_token=...`

3. **Parse Fragment Button**
   - Click to manually extract tokens
   - Only shown if tokens haven't been extracted yet

#### What Happens During Parsing

1. **Extract Fragment**: The system reads everything after `#` in the URL
2. **Parse Parameters**: Separates `access_token`, `id_token`, `state`, etc.
3. **Validate State**: Ensures the `state` matches what was sent (security check)
4. **Validate Nonce** (OIDC): Ensures the nonce in the ID token matches (security check)
5. **Extract Tokens**: Saves access token and ID token (if present)

#### Fragment Format

The URL fragment contains:

```
#access_token=eyJhbGciOiJSUzI1NiIs...
&token_type=Bearer
&expires_in=3600
&id_token=eyJhbGciOiJSUzI1NiIs...  (OIDC only)
&scope=openid profile email
&state=v8u-implicit-1234567890
&session_state=abc123...  (OIDC only)
```

#### Success Indicators

- ✅ **Green Success Box**: "Tokens Extracted Successfully!"
- ✅ **Token Count**: Shows number of tokens extracted
- ✅ **Auto-Advance**: Automatically proceeds to Step 3

#### Common Issues

**Problem**: "No fragment detected in URL"
- **Solution**: Make sure you completed authorization and were redirected back
- **Solution**: Check that the redirect URI matches what's configured

**Problem**: "State mismatch"
- **Solution**: This is a security check - try starting from Step 1 again
- **Solution**: Don't manually edit the URL

**Problem**: "Missing access token"
- **Solution**: Check that your PingOne application is configured for Implicit flow
- **Solution**: Verify that the correct grant type is enabled

#### What's Stored

After successful parsing:
- Access token (saved to browser session storage)
- ID token (OIDC only, saved to browser session storage)
- Token expiration time
- State parameter (for validation)

#### Next Steps

- Tokens are extracted and validated
- You can proceed to Step 3 to view the tokens
- The system automatically saves tokens for later use

---

### Step 3: Display Tokens

**Purpose**: View your received tokens, decode them, and understand their contents.

#### What You'll See

1. **Access Token**
   - The full access token value
   - Token type (always `Bearer`)
   - Expiration time
   - **Actions**:
     - **Copy**: Copy token to clipboard
     - **Decode**: View JWT claims (if token is a JWT)

2. **ID Token** (OIDC only)
   - The full ID token value
   - Contains user identity information
   - **Actions**:
     - **Copy**: Copy token to clipboard
     - **Decode**: View JWT payload (claims like `sub`, `email`, `name`)

3. **Educational Content**
   - Why refresh tokens aren't issued (implicit flow limitation)
   - Token expiration information
   - Security best practices

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

#### Important Notes

- ⚠️ **Refresh Tokens**: Not issued in implicit flow - you must re-authenticate when tokens expire
- ⚠️ **Token Security**: Tokens are sensitive - don't share or log them
- ⚠️ **Token Expiration**: Access tokens expire - plan for re-authentication
- ✅ **ID Token Validation**: ID tokens should be validated locally using JWT verification

#### Next Steps

- View token details and claims
- Copy tokens for use in your application
- Proceed to Step 4 for introspection and UserInfo

---

### Step 4: Introspection & UserInfo

**Purpose**: Validate tokens and retrieve additional user information.

#### Token Introspection

**What It Does**: Asks the authorization server to validate a token and return its properties.

**Available for**:
- ✅ **Access Token**: Can be introspected
- ❌ **Refresh Token**: Not available (not issued in implicit flow)
- ❌ **ID Token**: Should be validated locally, not introspected

**How to Use**:
1. Select "Access Token" (only option available)
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
- ⚠️ Implicit flow uses **public clients** (no secret)
- ⚠️ Your application must be configured to allow introspection for public clients, or you won't be able to introspect tokens

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

#### Educational Content

This step also explains:
- Why refresh tokens aren't available (implicit flow limitation)
- Why ID tokens should be validated locally (security best practice)
- When UserInfo is available (OIDC flows only)

#### Limitations

**Implicit Flow Limitations**:
- ❌ No refresh tokens (must re-authenticate when tokens expire)
- ⚠️ Tokens visible in browser history
- ⚠️ Limited introspection capability (public clients)
- ⚠️ Less secure than Authorization Code + PKCE

#### Best Practices

1. ✅ **Validate ID Tokens Locally**: Use JWT verification libraries
2. ✅ **Clear Fragment After Extraction**: Remove tokens from URL after parsing
3. ✅ **Use HTTPS**: Always use HTTPS in production
4. ✅ **Set Short Expiration**: Use shorter token expiration times
5. ⚠️ **Consider Authorization Code + PKCE**: More secure alternative for new applications

---

## Understanding the Results

### What You Receive

#### Access Token
- **Purpose**: Access protected resources (APIs)
- **Lifetime**: Typically 1 hour
- **Format**: JWT or opaque string
- **Use**: Include in `Authorization: Bearer {token}` header

#### ID Token (OIDC Only)
- **Purpose**: User identity information
- **Lifetime**: Typically 1 hour
- **Format**: Always JWT
- **Use**: Extract user information, validate authentication

#### No Refresh Token
- **Why**: Implicit flow is for public clients that can't securely store secrets
- **Impact**: Must re-authenticate when tokens expire
- **Alternative**: Use Authorization Code + PKCE flow for refresh tokens

### Token Expiration

- Access tokens typically expire in **3600 seconds (1 hour)**
- ID tokens typically expire in **3600 seconds (1 hour)**
- When tokens expire, you must:
  1. Redirect user to authorization URL again
  2. User re-authorizes (may be automatic if session exists)
  3. Receive new tokens in fragment

---

## Troubleshooting

### Common Issues

#### "Implicit flow not available" in OAuth 2.1

**Problem**: You selected OAuth 2.1 but don't see Implicit flow.

**Solution**: 
- Implicit flow is deprecated in OAuth 2.1
- Use "OAuth 2.0" or "OpenID Connect" instead
- Or use Authorization Code + PKCE flow (recommended)

#### "Invalid redirect URI"

**Problem**: Error message about redirect URI not matching.

**Solutions**:
1. Check that the redirect URI in the form matches exactly what's registered in PingOne
2. Ensure no trailing slashes or extra characters
3. Check HTTP vs HTTPS
4. Verify the redirect URI is registered in PingOne Admin Console

#### "State mismatch" error

**Problem**: Error when parsing fragment about state not matching.

**Solutions**:
1. Don't manually edit the URL
2. Don't use browser back button
3. Start from Step 1 again to generate a new state
4. Complete authorization in one session

#### "No fragment detected"

**Problem**: Step 2 doesn't detect tokens in URL.

**Solutions**:
1. Make sure you completed authorization and were redirected
2. Check the URL - fragment should be after `#`
3. Look for `access_token` in the URL
4. If needed, manually paste the full callback URL

#### "Missing access token"

**Problem**: Fragment doesn't contain access token.

**Solutions**:
1. Verify PingOne application has Implicit grant type enabled
2. Check application configuration in PingOne Admin Console
3. Ensure `response_type=token id_token` is correct
4. Verify user authorized the application

#### "ID token not available" (OIDC)

**Problem**: ID token not present even though using OIDC.

**Solutions**:
1. Verify `openid` scope is included in request
2. Check that you selected "OpenID Connect" spec version
3. Ensure PingOne application supports OIDC
4. Verify `response_type` includes `id_token`

#### "Introspection not working"

**Problem**: Can't introspect access token.

**Solutions**:
1. Check if your application is configured for introspection
2. Verify client authentication is set up (introspection requires auth)
3. Note: Public clients (implicit flow) may not support introspection
4. Check error message for specific issue

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

**Q: Why is implicit flow deprecated in OAuth 2.1?**  
A: OAuth 2.1 recommends Authorization Code + PKCE for better security. Implicit flow has security concerns (tokens in URL, no refresh tokens).

**Q: Should I use implicit flow for my new application?**  
A: No, use Authorization Code + PKCE instead. It provides refresh tokens and better security.

**Q: Can I get refresh tokens in implicit flow?**  
A: No, refresh tokens are not issued in implicit flow. You must re-authenticate when tokens expire.

**Q: What's the difference between OAuth 2.0 and OIDC implicit flow?**  
A: OIDC adds ID tokens (with user info) and UserInfo endpoint access. Both return tokens in the URL fragment.

### Technical Questions

**Q: Why are tokens in the URL fragment instead of query parameters?**  
A: URL fragments (after `#`) are not sent to the server, providing some protection. However, they're still visible in browser history.

**Q: How do I validate an ID token?**  
A: Use a JWT library to:
1. Verify the signature (using issuer's public key)
2. Check `aud` matches your Client ID
3. Check `iss` matches the issuer
4. Check `exp` hasn't passed
5. Verify `nonce` matches what you sent

**Q: Can I introspect tokens with implicit flow?**  
A: It depends on your PingOne configuration. Introspection requires client authentication, which public clients (implicit flow) typically don't have. Some configurations allow introspection for public clients.

**Q: How long do tokens last?**  
A: Typically 3600 seconds (1 hour), but this is configurable in PingOne.

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

---

## Additional Resources

- [OAuth 2.0 Specification (RFC 6749)](https://tools.ietf.org/html/rfc6749)
- [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html)
- [PingOne Documentation](https://documentation.pingidentity.com/)
- [OAuth 2.1 Best Current Practices](https://oauth.net/2.1/)

---

## Support

If you encounter issues not covered in this documentation:

1. Check the **Troubleshooting** section above
2. Review PingOne Admin Console configuration
3. Check browser console for error messages
4. Verify all prerequisites are met
5. Contact PingOne support if configuration issues persist

