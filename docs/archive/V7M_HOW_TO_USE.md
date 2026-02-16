# How To Use V7M Educational Mock Flows

This guide explains how to use the V7M (Version 7 Mock) educational OAuth/OIDC flows for learning OAuth 2.0 and OpenID Connect concepts without connecting to real APIs.

## Prerequisites

- An active OAuth Playground application instance
- Basic understanding of OAuth 2.0 concepts
- Internet connection (for accessing the application)

## What is V7M?

V7M flows are educational mock implementations that simulate OAuth/OIDC endpoints entirely within your browser. They:

- Generate realistic-looking tokens based on your settings
- Validate PKCE, client authentication, and OAuth parameters
- Provide detailed educational tooltips and modals
- Require no external API connections
- Use deterministic token generation (same settings = same tokens until expiry)

## Steps

### 1. Access V7M Flows

1. Open your web browser and navigate to the OAuth Playground application.
2. In the sidebar menu, find the **"Mock OAuth and OIDC flows"** group.
3. Click on **"OAuth Authorization Code (V7M)"** or **"OIDC Authorization Code (V7M)"** to open a mock flow.

### 2. Configure Settings

The V7M flow page displays an educational banner explaining that no external APIs are called. Configure the following fields:

- **Client ID**: Your application's unique identifier (e.g., `v7m-client`)
- **Redirect URI**: Where the authorization server redirects after consent (e.g., `/callback`)
- **Scope**: Requested permissions (e.g., `read write` for OAuth, `openid profile email offline_access` for OIDC)
- **State**: CSRF protection value (click the info icon to learn more)
- **Nonce**: Replay protection for ID tokens (OIDC only - click the info icon to learn more)
- **Code Challenge Method**: PKCE method (`S256` recommended or `plain`)
- **Code Verifier**: PKCE verifier value
- **User Email**: Email used for user info and ID token claims (mock only)
- **Client Secret**: Secret used for token endpoint authentication

**Tip**: Click the info icons (ℹ️) next to any field to learn about that parameter.

### 3. Build Authorization Request

1. Click the **"Build & Issue Code"** button.
2. The flow simulates an authorization request and generates an authorization code.
3. View the **Authorization URL** and **Authorization Code** displayed below the button.
4. Click the **"About Consent"** info icon to learn about the authorization consent step.

### 4. Exchange Authorization Code for Tokens

1. Ensure you have an authorization code from step 3.
2. Click the **"Exchange Code for Tokens"** button.
3. The flow simulates a token exchange with PKCE and client authentication validation.
4. View the **Token Response** JSON showing:
   - `access_token`: JWT-like access token
   - `id_token`: ID token (OIDC only)
   - `refresh_token`: Refresh token (if `offline_access` scope requested)
   - `expires_in`: Token lifetime in seconds
   - `token_type`: Usually `"Bearer"`

### 5. Inspect Tokens

After exchanging tokens, you can:

- **Inspect ID Token**: Click the button to open a modal showing the decoded JWT header, payload, and signature
- **Inspect Access Token**: Click the button to view access token details
- **Call UserInfo**: Click to simulate a UserInfo endpoint call and view user profile data
- **Introspect Token**: Click to simulate token introspection and see token metadata

**Tip**: Click the **"UserInfo vs ID Token"** and **"Introspection"** info icons to learn about these endpoints.

### 6. Explore Educational Content

Throughout the flow, click info icons to open educational modals covering:

- **PKCE**: Proof Key for Code Exchange explanation
- **Scopes and Claims**: How scopes map to token claims
- **Client Authentication**: Basic vs POST authentication methods
- **Authorization Consent**: How users approve permissions
- **State Parameter**: CSRF protection
- **Nonce Parameter**: ID token replay protection (OIDC)
- **UserInfo vs ID Token**: When to use each
- **Token Introspection**: How resource servers validate tokens

## Troubleshooting

- **No authorization code available**: Ensure you clicked "Build & Issue Code" first.
- **Token exchange fails**: Check that your `code_verifier` matches the PKCE method you selected, and that your `client_secret` is correct.
- **Missing ID token**: Ensure you selected the OIDC variant and included `openid` in scopes.
- **Code expired**: Authorization codes expire after a short time. Click "Build & Issue Code" again to generate a new code.

## Expected Results

When successful, you should see:

1. **Authorization Code**: A short-lived code string
2. **Token Response**: JSON with access token, optional ID token, and refresh token
3. **UserInfo Response**: JSON with user profile data (if you called UserInfo)
4. **Introspection Response**: JSON with token metadata including `active` status (if you introspected)

All responses use realistic OAuth/OIDC structure and JWT formatting, making them suitable for learning and testing your OAuth integration logic.

## Additional Information

- **Settings Page**: Navigate to **"V7M Settings"** in the sidebar to enable/disable mock mode globally
- **V7 vs V7M**: Real V7 flows call PingOne APIs. V7M flows are educational mocks that work entirely offline
- **Deterministic Tokens**: Same settings produce the same tokens (until expiry), making demos and testing predictable
- **No Data Storage**: V7M codes and tokens are stored in browser session storage only and cleared on page refresh

## Related Features

After learning with V7M flows, try the real V7 Authorization Code flows for production API integration. The concepts learned in V7M directly apply to real OAuth implementations.

