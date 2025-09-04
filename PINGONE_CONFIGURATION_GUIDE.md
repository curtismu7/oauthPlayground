# PingOne Application Configuration Guide

## Current Issue
The Authorization Code Flow with PKCE is failing with the error:
```
"Request denied: Invalid client credentials"
```

## Root Cause
Your PingOne application is configured as a confidential client, but it should be a **public client** for browser-based SPAs with PKCE.

## Required Configuration Changes

### 1. Update Application Type and Authentication Method

**Current Setting (WRONG):**
- Application Type: Confidential Client
- Token Auth Method: `Client Secret Basic`

**Required Setting (CORRECT):**
- Application Type: `Single-Page Application (SPA)` or `Public Client`
- Token Auth Method: `NONE`

### 2. Steps to Fix in PingOne Admin Console

1. **Log into PingOne Admin Console**
   - Go to your PingOne environment
   - Navigate to Applications

2. **Find Your Application**
   - Look for the application with Client ID: `a4f963ea-0736-456a-be72-b1fa4f63f81f`

3. **Edit Application Settings**
   - Click on the application to edit it
   - Go to the "Configuration" or "Settings" tab

4. **Update Application Type**
   - Change "Application Type" to "Single-Page Application (SPA)" or "Public Client"
   - This will automatically set the Token Endpoint Authentication Method to "NONE"

5. **Verify Other Settings**
   - Ensure "Grant Types" includes "Authorization Code"
   - Ensure "PKCE Enforcement" is set to "REQUIRED" (not S256_REQUIRED)
   - Ensure "Redirect URIs" includes: `https://localhost:3000/callback`

### 3. Expected Application Configuration

```
Application Type: Single-Page Application (SPA)
Grant Types: Authorization Code
Token Endpoint Authentication Method: NONE
PKCE Enforcement: REQUIRED
Redirect URIs: https://localhost:3000/callback
```

## Why This Change is Required

For browser-based SPAs with PKCE (Proof Key for Code Exchange):
- **Public clients** cannot securely store client secrets in the browser
- Security comes from the `code_verifier` and `code_challenge` parameters
- No client secret is needed or should be used
- The `tokenEndpointAuthMethod` must be `NONE` for public clients

## After Making the Change

1. **Save the configuration** in PingOne
2. **Test the Authorization Code Flow** again
3. The token exchange should now work correctly

## Verification

After updating the configuration, the token request will include:
- `grant_type=authorization_code`
- `client_id=a4f963ea-0736-456a-be72-b1fa4f63f81f`
- `redirect_uri=https://localhost:3000/callback`
- `code=<authorization_code>`
- `code_verifier=<pkce_code_verifier>`

And will NOT include:
- `client_secret` (not used for public clients)
- `Authorization` header (not needed for public clients)

## Troubleshooting

If you still get errors after making this change:
1. Wait a few minutes for the configuration to propagate
2. Clear your browser cache and cookies
3. Try the flow again
4. Check the browser console for the exact request being sent
