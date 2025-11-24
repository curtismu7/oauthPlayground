# Redirect URIs Reference

This document provides a comprehensive list of all redirect URIs used in the OAuth Playground application. Use these URIs when configuring your PingOne applications.

> **⚠️ IMPORTANT**: Each flow has its own unique logout URI to prevent conflicts and ensure proper logout handling. See the [Logout URIs Documentation](./logout-uris.md) for complete details.

## Base URL

**Development**: `https://localhost:3000`  
**Production**: `https://yourdomain.com` (replace with your actual domain)

## Quick Reference: Logout URIs

> **🚨 CRITICAL**: Each flow requires its own unique logout URI for proper logout handling!

| Flow Type | Logout URI |
|-----------|------------|
| **Authorization Code** | `https://localhost:3000/authz-logout-callback` |
| **Implicit** | `https://localhost:3000/implicit-logout-callback` |
| **Hybrid** | `https://localhost:3000/hybrid-logout-callback` |
| **Device** | `https://localhost:3000/device-logout-callback` |
| **Worker Token** | `https://localhost:3000/worker-token-logout-callback` |
| **PingOne Auth** | `https://localhost:3000/p1auth-logout-callback` |
| **Dashboard** | `https://localhost:3000/dashboard-logout-callback` |

**📖 For complete logout URI documentation, see [Logout URIs Reference](./logout-uris.md)**

> **💡 TIP**: Use the Logout URI Reference component in the UI for interactive copy-to-clipboard functionality and detailed explanations.

## Redirect URIs by Flow

### 1. Authorization Code Flow
- **URI**: `https://localhost:3000/authz-callback`
- **Purpose**: Handles authorization code exchange for tokens
- **Used by**: OAuth Authorization Code Flow V7, OIDC Authorization Code Flow
- **PingOne Configuration**: Add this URI to your application's "Redirect URIs" list

### 2. Implicit Flow
- **URI**: `https://localhost:3000/implicit-callback`
- **Purpose**: Handles implicit flow token responses
- **Used by**: OAuth Implicit Flow V7, OIDC Implicit Flow
- **PingOne Configuration**: Add this URI to your application's "Redirect URIs" list

### 3. Hybrid Flow
- **URI**: `https://localhost:3000/hybrid-callback`
- **Purpose**: Handles OIDC hybrid flow responses
- **Used by**: OIDC Hybrid Flow V7
- **PingOne Configuration**: Add this URI to your application's "Redirect URIs" list

### 4. PingOne Authentication
- **URI**: `https://localhost:3000/p1auth-callback`
- **Purpose**: Handles PingOne Authentication playground callbacks
- **Used by**: PingOne Authentication page
- **PingOne Configuration**: Add this URI to your application's "Redirect URIs" list

### 5. Dashboard Login
- **URI**: `https://localhost:3000/dashboard-callback`
- **Purpose**: Handles dashboard login callbacks
- **Used by**: Dashboard login flows
- **PingOne Configuration**: Add this URI to your application's "Redirect URIs" list

### 6. Logout Callbacks
- **URI**: `https://localhost:3000/logout-callback`
- **Purpose**: Handles logout redirects (legacy/generic)
- **Used by**: Generic logout flows
- **PingOne Configuration**: Add this URI to your application's "Post Logout Redirect URIs" list

### 7. Flow-Specific Logout Callbacks

#### Authorization Code Flow Logout
- **URI**: `https://localhost:3000/authz-logout-callback`
- **Purpose**: Handles logout redirects for Authorization Code Flow
- **Used by**: OAuth Authorization Code Flow V7, OIDC Authorization Code Flow
- **PingOne Configuration**: Add this URI to your application's "Post Logout Redirect URIs" list

#### Implicit Flow Logout
- **URI**: `https://localhost:3000/implicit-logout-callback`
- **Purpose**: Handles logout redirects for Implicit Flow
- **Used by**: OAuth Implicit Flow V7, OIDC Implicit Flow
- **PingOne Configuration**: Add this URI to your application's "Post Logout Redirect URIs" list

#### Hybrid Flow Logout
- **URI**: `https://localhost:3000/hybrid-logout-callback`
- **Purpose**: Handles logout redirects for OIDC Hybrid Flow
- **Used by**: OIDC Hybrid Flow V7
- **PingOne Configuration**: Add this URI to your application's "Post Logout Redirect URIs" list

#### Device Authorization Flow Logout
- **URI**: `https://localhost:3000/device-logout-callback`
- **Purpose**: Handles logout redirects for Device Authorization Flow
- **Used by**: Device Authorization Flow V7
- **PingOne Configuration**: Add this URI to your application's "Post Logout Redirect URIs" list

#### Worker Token Flow Logout
- **URI**: `https://localhost:3000/worker-token-logout-callback`
- **Purpose**: Handles logout redirects for Worker Token Flow
- **Used by**: Worker Token Flow V7, Client Credentials Flow
- **PingOne Configuration**: Add this URI to your application's "Post Logout Redirect URIs" list

#### PingOne Authentication Logout
- **URI**: `https://localhost:3000/p1auth-logout-callback`
- **Purpose**: Handles logout redirects for PingOne Authentication
- **Used by**: PingOne Authentication flows
- **PingOne Configuration**: Add this URI to your application's "Post Logout Redirect URIs" list

#### Dashboard Logout
- **URI**: `https://localhost:3000/dashboard-logout-callback`
- **Purpose**: Handles logout redirects for Dashboard Login
- **Used by**: Dashboard login flows
- **PingOne Configuration**: Add this URI to your application's "Post Logout Redirect URIs" list

### 8. Worker Token Callback
- **URI**: `https://localhost:3000/worker-token-callback`
- **Purpose**: Handles worker token flow callbacks
- **Used by**: Worker Token Flow V7, Client Credentials Flow
- **PingOne Configuration**: Add this URI to your application's "Redirect URIs" list

### 9. Device Code Status
- **URI**: `https://localhost:3000/device-code-status`
- **Purpose**: Handles device authorization flow status updates
- **Used by**: Device Authorization Flow V7
- **PingOne Configuration**: Add this URI to your application's "Redirect URIs" list

### 10. OAuth V3 Callback
- **URI**: `https://localhost:3000/oauth-v3-callback`
- **Purpose**: Handles OAuth V3 flow callbacks
- **Used by**: OAuth V3 flows
- **PingOne Configuration**: Add this URI to your application's "Redirect URIs" list

## PingOne Application Configuration

### Required Redirect URIs
For a complete OAuth Playground setup, add these URIs to your PingOne application:

```
https://localhost:3000/authz-callback
https://localhost:3000/implicit-callback
https://localhost:3000/hybrid-callback
https://localhost:3000/p1auth-callback
https://localhost:3000/dashboard-callback
https://localhost:3000/worker-token-callback
https://localhost:3000/device-code-status
https://localhost:3000/oauth-v3-callback
```

### Required Post Logout Redirect URIs
For complete logout functionality, add these URIs to your PingOne application:

```
https://localhost:3000/logout-callback
https://localhost:3000/authz-logout-callback
https://localhost:3000/implicit-logout-callback
https://localhost:3000/hybrid-logout-callback
https://localhost:3000/device-logout-callback
https://localhost:3000/worker-token-logout-callback
https://localhost:3000/p1auth-logout-callback
https://localhost:3000/dashboard-logout-callback
```

## Environment-Specific URIs

### Development
All URIs use `https://localhost:3000` as the base URL.

### Staging
Replace `localhost:3000` with your staging domain:
```
https://staging.yourdomain.com/authz-callback
https://staging.yourdomain.com/implicit-callback
# ... etc
```

### Production
Replace `localhost:3000` with your production domain:
```
https://yourdomain.com/authz-callback
https://yourdomain.com/implicit-callback
# ... etc
```

## Flow-Specific Recommendations

### For Authorization Code Flow Testing
- Primary: `https://localhost:3000/authz-callback`
- Logout: `https://localhost:3000/logout-callback`

### For Implicit Flow Testing
- Primary: `https://localhost:3000/implicit-callback`
- Logout: `https://localhost:3000/logout-callback`

### For PingOne Authentication Testing
- Primary: `https://localhost:3000/p1auth-callback`
- Logout: `https://localhost:3000/logout-callback`

### For Complete Testing
Add all URIs listed in the "Required Redirect URIs" section above.

## Troubleshooting

### Common Issues

1. **"Invalid redirect_uri" Error**
   - Ensure the exact URI is added to your PingOne application
   - Check for typos in the URI
   - Verify the protocol (https vs http)

2. **"Redirect URI mismatch" Error**
   - The URI in your request must exactly match one in your PingOne application
   - Check for trailing slashes
   - Verify the port number

3. **HTTPS Required**
   - All redirect URIs must use HTTPS in production
   - Development can use HTTP, but HTTPS is recommended

### Verification Steps

1. Check your PingOne application configuration
2. Verify the redirect URI is exactly as listed above
3. Test with the OAuth Playground flows
4. Check browser developer tools for any redirect errors

## Security Notes

- Never expose production redirect URIs in public repositories
- Use environment variables for different environments
- Regularly audit your redirect URI configurations
- Remove unused redirect URIs from your PingOne applications
