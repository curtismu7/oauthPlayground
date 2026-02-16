# Postman Collection Generator - User Guide

## Overview

The Postman Collection Generator is a powerful tool that creates ready-to-use Postman collections for testing and integrating with PingOne APIs. It generates collections with real API calls, automatic variable extraction, educational comments, and pre-configured scripts.

## What You Can Generate

The generator supports three main collection types:

### 1. Use Cases Collection
Complete customer identity flows with step-by-step API calls:
- **Sign-up (Registration):** Create account and collect profile attributes
- **Sign-in:** Primary authentication using OAuth/OIDC Authorization Code flow with PKCE
- **MFA Enrollment:** Add or register an additional factor after initial sign-in
- **MFA Challenge:** Prompt for additional factor during sign-in or sensitive actions
- **Step-up Authentication:** Re-authenticate for high-risk actions
- **Forgot Password / Password Reset:** Self-service password reset flow
- **Account Recovery:** Recover when user can't complete MFA
- **Change Password:** Change password with re-auth/step-up, admin force password change
- **Social Login:** Configure external identity providers (Facebook, LinkedIn) for social login
- **Partner / Enterprise Federation:** Configure Azure AD for enterprise federation
- **Risk-based Checks:** Get risk predictors and update risk evaluations using PingOne Protect API
- **Logout:** Complete logout workflow including session listing, session termination, token revocation
- **User Sessions:** Manage user sessions across devices
- **Transaction Approval:** Approve or deny transactions based on risk
- **PingOne Metadata:** Access PingOne system metadata

### 2. Unified OAuth/OIDC Flows Collection
Complete OAuth 2.0 and OpenID Connect flows organized by specification version:
- **OAuth 2.0 Authorization Framework (RFC 6749):** Baseline OAuth framework
- **OpenID Connect Core 1.0:** Authentication layer on top of OAuth 2.0
- **OAuth 2.1 Authorization Framework (draft):** Modern OAuth with PKCE required

**Flow Types Included:**
- Authorization Code Grant (7 variations with different authentication methods)
- Implicit Flow
- Client Credentials Flow
- Device Code Flow
- Hybrid Flow

### 3. MFA Flows Collection
Multi-factor authentication flows for all device types:
- **SMS:** SMS device registration and authentication
- **Email:** Email device registration and authentication
- **WhatsApp:** WhatsApp device registration and authentication
- **TOTP:** OATH TOTP (RFC 6238) device registration and authentication
- **FIDO2:** FIDO2 device registration and authentication
- **Mobile:** Mobile device registration and authentication

## How to Use

### Step 1: Access the Generator

1. Open the OAuth Playground application
2. Navigate to the **Postman Collection Generator** page
3. You'll see three main sections:
   - **Use Cases** (Customer Identity Flows)
   - **Unified OAuth/OIDC Flows**
   - **MFA Flows**

### Step 2: Select Collection Types

Check the boxes for the collection types you want to include:

- ✅ **Use Cases** - Customer identity flows
- ✅ **Unified OAuth/OIDC Flows** - OAuth and OIDC protocol flows
- ✅ **MFA Flows** - Multi-factor authentication flows

### Step 3: Configure Use Cases (if selected)

If you selected **Use Cases**, you can choose specific use cases:

- ✅ Sign-up
- ✅ Sign-in
- ✅ MFA Enrollment
- ✅ MFA Challenge
- ✅ Step-up Authentication
- ✅ Password Reset
- ✅ Account Recovery
- ✅ Change Password
- ✅ Social Login
- ✅ Federation
- ✅ OAuth Login
- ✅ Risk Checks
- ✅ Logout
- ✅ User Sessions
- ✅ Transaction Approval
- ✅ PingOne Metadata

**Tip:** By default, all use cases are selected. Uncheck any you don't need.

### Step 4: Configure Unified Flows (if selected)

If you selected **Unified OAuth/OIDC Flows**, choose specification versions:

- ✅ **OAuth 2.0** - Authorization Framework (RFC 6749)
- ✅ **OpenID Connect (OIDC)** - Core 1.0
- ✅ **OAuth 2.1** - Authorization Framework (draft)

**Tip:** Select all three to get complete coverage of all OAuth/OIDC variations.

### Step 5: Configure MFA Flows (if selected)

If you selected **MFA Flows**, choose device types:

- ✅ **SMS** - SMS-based MFA
- ✅ **Email** - Email-based MFA
- ✅ **WhatsApp** - WhatsApp-based MFA
- ✅ **TOTP** - Time-based One-Time Password
- ✅ **FIDO2** - FIDO2 WebAuthn
- ✅ **Mobile** - Mobile app-based MFA

**Tip:** Select all device types to test all MFA options.

### Step 6: Enter Credentials (Optional)

You can pre-fill environment variables with your credentials:

- **Environment ID:** Your PingOne environment ID
- **Client ID:** Your OAuth client ID
- **Client Secret:** Your OAuth client secret

**Note:** These are optional. You can fill them in later in Postman's environment variables.

### Step 7: Generate and Download

1. Click the **"Generate & Download Postman Collection"** button
2. Two files will be downloaded:
   - **Collection file:** `pingone-{type}-{date}-collection.json`
   - **Environment file:** `pingone-{type}-{date}-environment.json`

### Step 8: Import into Postman

1. Open Postman
2. Click **Import** button
3. Drag and drop both files (collection and environment)
4. Select the environment in Postman's environment dropdown
5. Start testing!

## Key Features

### Automatic Variable Extraction

All IDs, tokens, and values are automatically extracted and saved to environment variables:
- User IDs
- Device IDs
- Access tokens
- Refresh tokens
- Authorization codes
- Session IDs
- And more...

### Educational Comments

Each request includes detailed educational context:
- What the endpoint does
- Why it's needed
- How it fits into the flow
- Links to PingOne API documentation

### Pre-Request Scripts

Many requests include pre-request scripts that:
- Generate random usernames (historical baseball players)
- Generate passwords (default: "2Federate!" with random suffix)
- Create JWT assertions for client authentication
- Generate PKCE codes
- Set up required variables

### Test Scripts

Every request includes test scripts that:
- Validate response status codes
- Extract and save variables automatically
- Provide helpful console messages
- Handle errors gracefully

### Random Data Generation

- **Usernames:** Randomly selected from historical baseball players (Babe Ruth, Jackie Robinson, etc.)
- **Emails:** Format: `cmuir+{firstName}@pingone.com`
- **Passwords:** Default "2Federate!" with random 4-digit suffix

## Collection Structure

### Use Cases Collection Structure

```
PingOne Customer Identity Use Cases
├── Worker Token
│   ├── Get Worker Token (Client Secret Post)
│   ├── Get Worker Token (Client Secret Basic)
│   ├── Get Worker Token (Client Secret JWT)
│   └── Get Worker Token (Private Key JWT)
├── 1. Sign-up (Registration)
│   ├── Environment Configuration
│   ├── Configure Your Test User
│   └── Test The Workflow
├── 2. Sign-in
│   ├── Environment Configuration
│   ├── Configure Your Test User
│   └── Test The Workflow
├── 3. MFA Enrollment
├── 4. MFA Challenge
├── 5. Step-up Authentication
├── 6. Forgot Password / Password Reset
├── 7. Account Recovery
├── 8. Change Password
├── 9. Social Login
├── 10. Partner / Enterprise Federation
├── 11. Risk-based Checks
└── 12. Logout
```

### Unified Flows Collection Structure

```
PingOne Complete Collection - Unified & MFA
├── Worker Token
├── OAuth 2.0 Authorization Framework (RFC 6749)
│   ├── Authorization Code Grant
│   ├── Implicit Flow
│   ├── Client Credentials Flow
│   └── Device Code Flow
├── OpenID Connect Core 1.0
│   ├── Authorization Code Grant (with PKCE)
│   ├── Implicit Flow
│   ├── Hybrid Flow
│   └── Device Code Flow
└── OAuth 2.1 Authorization Framework (draft)
    ├── Authorization Code Grant (PKCE Required)
    └── Device Code Flow
```

### MFA Flows Collection Structure

```
PingOne MFA Flows
├── Worker Token
├── SMS Device Registration & Authentication
├── Email Device Registration & Authentication
├── WhatsApp Device Registration & Authentication
├── OATH TOTP Device Registration & Authentication
├── FIDO2 Device Registration & Authentication
└── Mobile Device Registration & Authentication
```

## Environment Variables

The generated environment file includes all necessary variables:

### Required Variables (User Must Fill)
- `envID` - Your PingOne environment ID
- `worker_client_id` - Worker client ID (default provided)
- `worker_client_secret` - Worker client secret (default provided)
- `user_client_id` - OAuth client ID
- `user_client_secret` - OAuth client secret
- `redirect_uri` - OAuth redirect URI

### Auto-Generated Variables
These are set automatically by scripts:
- `workerToken` - Worker token for API calls
- `access_token` - User access token
- `id_token` - ID token (OIDC flows)
- `refresh_token` - Refresh token
- `code_verifier` - PKCE code verifier
- `code_challenge` - PKCE code challenge
- `SignUpUserID` - User ID from sign-up
- `SignInUserID` - User ID from sign-in
- `deviceId` - MFA device ID
- And many more...

## Troubleshooting

### Collection Won't Import

**Problem:** Postman shows import errors

**Solutions:**
- Ensure both collection and environment files are imported
- Check that file format is valid JSON
- Try importing files one at a time

### Variables Not Working

**Problem:** Variables show as `{{variableName}}` instead of values

**Solutions:**
- Ensure environment is selected in Postman's environment dropdown
- Check that environment variables are set
- Verify variable names match exactly (case-sensitive)

### Worker Token Errors

**Problem:** "401 Unauthorized" when getting worker token

**Solutions:**
- Verify `worker_client_id` and `worker_client_secret` are correct
- Check that `envID` is set correctly
- Ensure credentials have proper permissions

### Request Fails with "INVALID_REQUEST"

**Problem:** API returns INVALID_REQUEST error

**Solutions:**
- Check Content-Type header is correct
- Verify endpoint URL is correct
- Ensure request body format matches API requirements
- Check that all required fields are present

## Best Practices

1. **Start with Worker Token:** Always get a worker token first before running other requests
2. **Follow the Flow:** Run requests in order as they depend on previous steps
3. **Check Console:** Postman's console provides helpful messages and variable values
4. **Read Comments:** Each request includes educational context explaining what it does
5. **Use Environment Variables:** Don't hardcode values - use environment variables
6. **Test Incrementally:** Test one use case at a time to isolate issues

## Related Documentation

- [PingOne API Documentation](https://apidocs.pingidentity.com/pingone/platform/v1/api/)
- [Postman Collection Structure Reference](./POSTMAN_COLLECTION_STRUCTURE_REFERENCE.md)
- [Verify User Documentation](./VERIFY_USER_UI_DOC.md)

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review the educational comments in each request
3. Verify your PingOne environment configuration
4. Check PingOne API documentation for endpoint-specific requirements
