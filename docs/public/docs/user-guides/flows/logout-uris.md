# Logout URIs Reference

This document provides comprehensive information about logout URIs used in the OAuth Playground application. Each flow has its own unique logout URI to ensure proper logout handling and prevent conflicts.

## Why Flow-Specific Logout URIs?

### **Problem Solved**
- **Conflict Prevention**: Each flow has its own logout URI, preventing cross-flow interference
- **Proper Logout Handling**: Flow-specific logout processing ensures correct cleanup
- **Clear Identification**: Easy to identify which flow initiated the logout
- **Better Debugging**: Isolated logout handling makes troubleshooting easier

### **Benefits**
- ✅ **No Cross-Flow Contamination**: Logout from one flow won't affect another
- ✅ **Flow-Specific Cleanup**: Each flow can handle its own logout logic
- ✅ **Better User Experience**: Proper logout handling across all flows
- ✅ **Easier Maintenance**: Clear separation of concerns

## Base URL

**Development**: `https://localhost:3000`  
**Production**: `https://yourdomain.com` (replace with your actual domain)

## Flow-Specific Logout URIs

### 1. Authorization Code Flow Logout
- **URI**: `https://localhost:3000/authz-logout-callback`
- **Purpose**: Handles logout redirects for Authorization Code Flow
- **Used by**: OAuth Authorization Code Flow V7, OIDC Authorization Code Flow
- **PingOne Configuration**: Add this URI to your application's "Post Logout Redirect URIs" list
- **Flow Context**: Maintains authorization code flow state during logout

### 2. Implicit Flow Logout
- **URI**: `https://localhost:3000/implicit-logout-callback`
- **Purpose**: Handles logout redirects for Implicit Flow
- **Used by**: OAuth Implicit Flow V7, OIDC Implicit Flow
- **PingOne Configuration**: Add this URI to your application's "Post Logout Redirect URIs" list
- **Flow Context**: Maintains implicit flow state during logout

### 3. OIDC Hybrid Flow Logout
- **URI**: `https://localhost:3000/hybrid-logout-callback`
- **Purpose**: Handles logout redirects for OIDC Hybrid Flow
- **Used by**: OIDC Hybrid Flow V7
- **PingOne Configuration**: Add this URI to your application's "Post Logout Redirect URIs" list
- **Flow Context**: Maintains hybrid flow state during logout

### 4. Device Authorization Flow Logout
- **URI**: `https://localhost:3000/device-logout-callback`
- **Purpose**: Handles logout redirects for Device Authorization Flow
- **Used by**: Device Authorization Flow V7
- **PingOne Configuration**: Add this URI to your application's "Post Logout Redirect URIs" list
- **Flow Context**: Maintains device flow state during logout

### 5. Worker Token Flow Logout
- **URI**: `https://localhost:3000/worker-token-logout-callback`
- **Purpose**: Handles logout redirects for Worker Token Flow
- **Used by**: Worker Token Flow V7, Client Credentials Flow
- **PingOne Configuration**: Add this URI to your application's "Post Logout Redirect URIs" list
- **Flow Context**: Maintains worker token flow state during logout

### 6. PingOne Authentication Logout
- **URI**: `https://localhost:3000/p1auth-logout-callback`
- **Purpose**: Handles logout redirects for PingOne Authentication
- **Used by**: PingOne Authentication flows
- **PingOne Configuration**: Add this URI to your application's "Post Logout Redirect URIs" list
- **Flow Context**: Maintains PingOne authentication state during logout

### 7. Dashboard Login Logout
- **URI**: `https://localhost:3000/dashboard-logout-callback`
- **Purpose**: Handles logout redirects for Dashboard Login
- **Used by**: Dashboard login flows
- **PingOne Configuration**: Add this URI to your application's "Post Logout Redirect URIs" list
- **Flow Context**: Maintains dashboard login state during logout

### 8. Generic Logout (Legacy)
- **URI**: `https://localhost:3000/logout-callback`
- **Purpose**: Handles generic logout redirects (legacy support)
- **Used by**: Generic logout flows, fallback
- **PingOne Configuration**: Add this URI to your application's "Post Logout Redirect URIs" list
- **Flow Context**: Generic logout handling

## PingOne Application Configuration

### Complete Post Logout Redirect URIs List
For complete logout functionality across all flows, add these URIs to your PingOne application:

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

### Flow-Specific Configuration
If you're only using specific flows, you can add only the relevant logout URIs:

#### For Authorization Code Flow Only
```
https://localhost:3000/authz-logout-callback
```

#### For Implicit Flow Only
```
https://localhost:3000/implicit-logout-callback
```

#### For Multiple Flows
```
https://localhost:3000/authz-logout-callback
https://localhost:3000/implicit-logout-callback
https://localhost:3000/hybrid-logout-callback
```

## Environment-Specific URIs

### Development
All URIs use `https://localhost:3000` as the base URL.

### Staging
Replace `localhost:3000` with your staging domain:
```
https://staging.yourdomain.com/authz-logout-callback
https://staging.yourdomain.com/implicit-logout-callback
# ... etc
```

### Production
Replace `localhost:3000` with your production domain:
```
https://yourdomain.com/authz-logout-callback
https://yourdomain.com/implicit-logout-callback
# ... etc
```

## UI Integration

### Credential Forms
The OAuth Playground credential forms automatically show the correct logout URI for each flow:

1. **Flow Detection**: The form detects which flow you're configuring
2. **Automatic URI**: Shows the appropriate logout URI for that flow
3. **Visual Indicators**: Clear styling and warnings about PingOne configuration
4. **Copy Functionality**: Easy copy-to-clipboard for the logout URI

### Visual Indicators
- 🚪 **Logout Icon**: Clear visual indicator for logout URIs
- ⚠️ **Warning Messages**: Reminders to add URIs to PingOne
- 🎨 **Color Coding**: Yellow styling for logout URI information boxes
- 📋 **Flow-Specific Labels**: Clear identification of which flow the URI is for

## Troubleshooting

### Common Issues

1. **"Invalid post_logout_redirect_uri" Error**
   - Ensure the exact URI is added to your PingOne application
   - Check for typos in the URI
   - Verify the protocol (https vs http)

2. **"Post logout redirect URI mismatch" Error**
   - The URI in your logout request must exactly match one in your PingOne application
   - Check for trailing slashes
   - Verify the port number

3. **Logout Not Working**
   - Ensure the logout URI is added to PingOne
   - Check that the flow is using the correct logout URI
   - Verify the logout endpoint is properly configured

4. **Cross-Flow Logout Issues**
   - Each flow should use its own logout URI
   - Don't mix logout URIs between different flows
   - Ensure proper flow isolation

### Verification Steps

1. **Check PingOne Configuration**
   - Verify all required logout URIs are added
   - Ensure URIs match exactly (no typos)
   - Check that URIs are in the correct section (Post Logout Redirect URIs)

2. **Test Logout Flow**
   - Test logout from each flow individually
   - Verify proper redirect to logout URI
   - Check that logout completes successfully

3. **Check Browser Developer Tools**
   - Look for any redirect errors
   - Verify logout requests are using correct URIs
   - Check for any JavaScript errors

## Security Considerations

### Best Practices
- **HTTPS Required**: All logout URIs must use HTTPS in production
- **Exact Match**: URIs must match exactly (no wildcards)
- **Regular Audit**: Periodically review and clean up unused logout URIs
- **Environment Separation**: Use different URIs for different environments

### Security Notes
- Never expose production logout URIs in public repositories
- Use environment variables for different environments
- Regularly audit your logout URI configurations
- Remove unused logout URIs from your PingOne applications

## Implementation Details

### Technical Architecture
- **Flow Isolation**: Each flow maintains its own logout state
- **Callback Handling**: Dedicated callback components for each flow
- **State Management**: Flow-specific state cleanup during logout
- **Error Handling**: Flow-specific error handling for logout failures

### Code Organization
```
src/
├── pages/
│   ├── LogoutCallback.tsx          # Generic logout handler
│   └── flows/                       # Flow-specific components
├── services/
│   └── callbackUriService.ts       # URI management service
└── components/
    └── CredentialsInput.tsx        # UI components with logout URI info
```

## Support and Resources

### Documentation Links
- [Main Redirect URIs Documentation](./redirect-uris.md)
- [OAuth Playground User Guide](./user-guide.md)
- [PingOne Integration Guide](./pingone-integration.md)

### Getting Help
- Check the troubleshooting section above
- Review PingOne application configuration
- Test with individual flows first
- Use browser developer tools for debugging

---

**Last Updated**: October 28, 2025  
**Version**: 1.0  
**Compatibility**: OAuth Playground v7.3.0+
