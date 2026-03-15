# OAuth Authentication Scripts for Banking API Postman Collections

This directory contains reusable JavaScript utilities for handling OAuth authentication in Postman collections for the Banking API.

## Files Overview

### 1. `oauth-token-manager.js`
Core OAuth token management utilities including:
- Token validity checking
- JWT decoding and validation
- Scope validation
- User information extraction
- PKCE code generation
- Authorization URL building

### 2. `token-refresh-handler.js`
Automatic token refresh functionality:
- Refresh token validation
- Automatic token renewal
- Token cleanup utilities
- Request authorization validation
- Authorization header management

### 3. `pre-request-template.js`
Ready-to-use pre-request script template that can be copied directly into Postman:
- Complete authentication flow
- Configurable scope requirements
- Automatic token refresh
- Detailed logging and error handling
- Usage instructions and examples

### 4. `jwt-utilities.js`
Advanced JWT token handling:
- Complete JWT decoding (header, payload, signature)
- Banking API specific claim extraction
- Comprehensive token validation
- Endpoint-specific authorization checking
- User permission analysis
- Admin privilege detection

## Usage Instructions

### Quick Start
1. Copy the contents of `pre-request-template.js` into your Postman collection or request pre-request script
2. Update the `OAUTH_CONFIG` section with your environment-specific values
3. Modify the `requiredScopes` array based on the endpoint you're testing

### Environment Variables Required
Set these variables in your Postman environment:

```json
{
  "oauth_auth_url": "https://auth.pingone.com/{{oauth_tenant}}/as/authorize",
  "oauth_token_url": "https://auth.pingone.com/{{oauth_tenant}}/as/token",
  "oauth_tenant": "your-tenant-id",
  "client_id": "your-client-id",
  "client_secret": "your-client-secret",
  "redirect_uri": "https://oauth.pstmn.io/v1/callback"
}
```

### Scope Requirements by Endpoint

#### End User Endpoints
- `GET /api/accounts` (own accounts): `["banking:read"]`
- `GET /api/transactions` (own): `["banking:read"]`
- `POST /api/transactions`: `["banking:write"]`
- `GET /api/users/me`: `["banking:read"]`
- `PUT /api/users/me`: `["banking:write"]`

#### Admin Endpoints
- `GET /api/admin/users`: `["banking:admin"]`
- `POST /api/admin/users`: `["banking:admin"]`
- `GET /api/admin/accounts`: `["banking:admin"]`
- `GET /api/admin/transactions`: `["banking:admin"]`
- `GET /api/admin/activity-logs`: `["banking:admin"]`

## Advanced Usage

### Custom Token Validation
```javascript
// Include the utilities
eval(pm.globals.get("oauth-token-manager"));

// Check if token is valid
if (!isTokenValid()) {
    console.log("Token needs refresh");
}

// Validate specific scopes
const token = pm.environment.get("access_token");
if (!validateTokenScopes(token, ["banking:admin"])) {
    console.log("Insufficient privileges");
}
```

### JWT Token Analysis
```javascript
// Include JWT utilities
eval(pm.globals.get("jwt-utilities"));

const token = pm.environment.get("access_token");

// Get complete token information
const tokenInfo = formatTokenInfo(token);
console.log(tokenInfo);

// Check endpoint authorization
const authResult = validateTokenForEndpoint(token, "/api/admin/users", "GET");
if (!authResult.isAuthorized) {
    console.log("Access denied:", authResult.reason);
}
```

### Automatic Token Refresh
```javascript
// Include refresh handler
eval(pm.globals.get("token-refresh-handler"));

// Ensure valid token before request
const config = {
    tokenUrl: pm.environment.get("oauth_token_url"),
    clientId: pm.environment.get("client_id"),
    clientSecret: pm.environment.get("client_secret")
};

if (ensureValidToken(config)) {
    setAuthorizationHeader();
}
```

## Integration with Collections

### Collection-Level Pre-Request Script
Add this to your collection's pre-request script to apply authentication to all requests:

```javascript
// Load utilities from global variables or copy directly
eval(pm.globals.get("pre-request-template"));
```

### Request-Level Customization
For specific requests, modify the `OAUTH_CONFIG.requiredScopes` array:

```javascript
// For admin endpoints
OAUTH_CONFIG.requiredScopes = ["banking:admin"];

// For read-only endpoints
OAUTH_CONFIG.requiredScopes = ["banking:read"];

// For write operations
OAUTH_CONFIG.requiredScopes = ["banking:write"];
```

## Error Handling

The scripts provide comprehensive error handling and logging:

- ✅ Success indicators with green checkmarks
- ❌ Error indicators with red X marks
- 🔄 Process indicators for ongoing operations
- ⚠️ Warning indicators for potential issues
- 📋 Instruction indicators for manual steps

## Testing and Validation

### Token Validation Tests
Add these to your request test scripts:

```javascript
pm.test("Token is valid", function () {
    const token = pm.environment.get("access_token");
    pm.expect(token).to.not.be.empty;
    
    // Validate token structure
    const validation = validateJWTStructure(token);
    pm.expect(validation.isValid).to.be.true;
});

pm.test("Token has required scopes", function () {
    const token = pm.environment.get("access_token");
    const scopeValidation = validateScopes(token, ["banking:read"]);
    pm.expect(scopeValidation.hasAllScopes).to.be.true;
});
```

### Response Authorization Tests
```javascript
pm.test("Request is properly authorized", function () {
    pm.response.to.have.status(200);
    pm.response.to.not.have.status(401);
    pm.response.to.not.have.status(403);
});
```

## Troubleshooting

### Common Issues

1. **"No access token found"**
   - Run the OAuth Login Flow request first
   - Check that environment variables are set correctly

2. **"Token is expired or will expire soon"**
   - The script will automatically attempt to refresh
   - If refresh fails, re-run the OAuth Login Flow

3. **"Missing required scopes"**
   - Check that your OAuth client has the necessary scopes configured
   - Verify the `requiredScopes` array matches the endpoint requirements

4. **"Token refresh failed"**
   - Check client credentials in environment variables
   - Verify the token URL is correct
   - Ensure refresh token hasn't expired

### Debug Mode
Enable detailed logging by adding this to your pre-request script:

```javascript
// Enable debug logging
pm.globals.set("oauth_debug", "true");
```

## Security Considerations

- Never hardcode client secrets in collection files
- Use environment variables for all sensitive data
- Regularly rotate client credentials
- Clear tokens after testing in production environments
- Use HTTPS for all OAuth endpoints
- Validate token expiration before each request

## Contributing

When modifying these scripts:
1. Maintain backward compatibility
2. Add comprehensive error handling
3. Include detailed logging
4. Update documentation
5. Test with both admin and end-user scenarios