# OAuth Playground - Per-Flow Callback URLs

This document lists all the callback URLs for each OAuth flow in the OAuth Playground application.

## Base URL
- **Development**: `https://localhost:3000`
- **Production**: `https://your-domain.com` (replace with actual domain)

## Per-Flow Callback URLs

### 1. Authorization Code Flow (PKCE)
- **URL**: `https://localhost:3000/authz-callback`
- **Purpose**: Receives authorization code for token exchange
- **Flow Type**: `authorization-code`, `authz`, `pkce`
- **Description**: Authorization Code flow callback - receives authorization code for token exchange

### 2. Hybrid Flow
- **URL**: `https://localhost:3000/hybrid-callback`
- **Purpose**: Receives authorization code and ID token
- **Flow Type**: `hybrid`
- **Description**: Hybrid flow callback - receives authorization code and ID token

### 3. Implicit Grant Flow (Deprecated)
- **URL**: `https://localhost:3000/implicit-callback`
- **Purpose**: Receives access token directly (deprecated)
- **Flow Type**: `implicit`, `implicit-grant`
- **Description**: Implicit Grant flow callback - receives access token directly (deprecated)
- **⚠️ Warning**: This flow is deprecated and should not be used in new applications

### 4. Worker Token Flow
- **URL**: `https://localhost:3000/worker-token-callback`
- **Purpose**: Receives authorization code for worker token exchange
- **Flow Type**: `worker-token`, `worker`
- **Description**: Worker Token flow callback - receives authorization code for worker token exchange

### 5. Device Code Flow
- **URL**: `https://localhost:3000/device-code-status`
- **Purpose**: Informational status page (no browser redirect in spec)
- **Flow Type**: `device-code`, `device`
- **Description**: Device Code flow status page - informational only (no browser redirect in spec)
- **Note**: This is not a traditional callback URL as Device Code flow doesn't use browser redirects

### 6. JWT Bearer Flow (Assertion)
- **URL**: `https://localhost:3000/assertion-callback`
- **Purpose**: Receives authorization code for assertion-based token exchange
- **Flow Type**: `jwt-bearer`, `assertion`
- **Description**: JWT Bearer flow callback - receives authorization code for assertion-based token exchange
- **Note**: Falls back to authorization code callback if assertion callback not available

### 7. Client Credentials Flow
- **URL**: `N/A` (No redirect URI required)
- **Purpose**: No redirect URI required - uses direct token endpoint communication
- **Flow Type**: `client-credentials`
- **Description**: No redirect URI required - Client Credentials flow uses direct token endpoint

### 8. Dashboard Login
- **URL**: `https://localhost:3000/dashboard-callback`
- **Purpose**: Receives authorization code for dashboard authentication
- **Flow Type**: `dashboard`, `dashboard-login`
- **Description**: Dashboard login callback - receives authorization code for dashboard authentication

## Configuration Instructions

### For PingOne Applications:

1. **Copy the appropriate callback URL** for your flow type
2. **Go to your PingOne application settings**
3. **Navigate to "Redirect URIs" section**
4. **Add the copied URI to your allowed redirect URIs**
5. **Save your configuration**

### Example PingOne Configuration:

```
Allowed Redirect URIs:
- https://localhost:3000/authz-callback
- https://localhost:3000/hybrid-callback
- https://localhost:3000/implicit-callback
- https://localhost:3000/worker-token-callback
- https://localhost:3000/assertion-callback
- https://localhost:3000/dashboard-callback
```

## Flow Requirements

| Flow Type | Requires Redirect URI | Callback URL |
|-----------|----------------------|--------------|
| Authorization Code | ✅ Yes | `/authz-callback` |
| PKCE | ✅ Yes | `/authz-callback` |
| Hybrid | ✅ Yes | `/hybrid-callback` |
| Implicit Grant | ✅ Yes | `/implicit-callback` |
| Worker Token | ✅ Yes | `/worker-token-callback` |
| Device Code | ❌ No | `/device-code-status` (info only) |
| JWT Bearer | ✅ Yes | `/assertion-callback` |
| Client Credentials | ❌ No | N/A |
| Dashboard Login | ✅ Yes | `/dashboard-callback` |

## Development vs Production

### Development URLs:
```
https://localhost:3000/authz-callback
https://localhost:3000/hybrid-callback
https://localhost:3000/implicit-callback
https://localhost:3000/worker-token-callback
https://localhost:3000/device-code-status
https://localhost:3000/assertion-callback
https://localhost:3000/dashboard-callback
```

### Production URLs (replace with your domain):
```
https://your-domain.com/authz-callback
https://your-domain.com/hybrid-callback
https://your-domain.com/implicit-callback
https://your-domain.com/worker-token-callback
https://your-domain.com/device-code-status
https://your-domain.com/assertion-callback
https://your-domain.com/dashboard-callback
```

## Security Notes

1. **Exact Match Required**: PingOne requires exact redirect URI matching
2. **HTTPS Required**: All production callback URLs must use HTTPS
3. **State Parameter**: Always use state parameter for CSRF protection
4. **PKCE Recommended**: Use PKCE for all authorization code flows
5. **Deprecated Flows**: Avoid Implicit Grant flow in new applications

## Troubleshooting

### Common Issues:

1. **404 Error**: Make sure the callback URL is registered in PingOne
2. **Mismatch Error**: Ensure exact URL match (including trailing slashes)
3. **HTTPS Error**: Use HTTPS in production environments
4. **State Error**: Include state parameter in authorization requests

### Debug Steps:

1. Check browser console for callback processing logs
2. Verify PingOne application redirect URI configuration
3. Test callback URL accessibility
4. Validate state parameter handling

## Related Files

- **Callback Components**: `/src/components/callbacks/`
- **Callback Utilities**: `/src/utils/callbackUrls.ts`
- **Route Configuration**: `/src/App.tsx`
- **Flow Pages**: `/src/pages/flows/`

---

*Last Updated: September 7, 2025*
*Version: 4.7.0*
