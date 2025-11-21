# Backend API Endpoints Required

## Overview

The V8 flows require backend proxy endpoints to avoid CORS issues when communicating with PingOne APIs. These endpoints should be implemented in your backend server.

## Required Endpoints

### 1. OIDC Discovery Proxy

**Endpoint**: `POST /api/pingone/oidc-discovery`

**Purpose**: Fetch OIDC well-known configuration from PingOne to avoid CORS issues

**Request Body**:
```json
{
  "issuerUrl": "https://auth.pingone.com/b9817c16-9910-4415-b67e-4ac687da74d9/as"
}
```

**Response** (Success - 200):
```json
{
  "issuer": "https://auth.pingone.com/b9817c16-9910-4415-b67e-4ac687da74d9/as",
  "authorization_endpoint": "https://auth.pingone.com/b9817c16-9910-4415-b67e-4ac687da74d9/as/authorize",
  "token_endpoint": "https://auth.pingone.com/b9817c16-9910-4415-b67e-4ac687da74d9/as/token",
  "userinfo_endpoint": "https://auth.pingone.com/b9817c16-9910-4415-b67e-4ac687da74d9/as/userinfo",
  "introspection_endpoint": "https://auth.pingone.com/b9817c16-9910-4415-b67e-4ac687da74d9/as/introspect",
  "jwks_uri": "https://auth.pingone.com/b9817c16-9910-4415-b67e-4ac687da74d9/as/jwks",
  "scopes_supported": ["openid", "profile", "email", "address", "phone"],
  "response_types_supported": ["code", "token", "id_token", "code token", "code id_token", "token id_token", "code token id_token"],
  "grant_types_supported": ["authorization_code", "implicit", "refresh_token", "client_credentials"]
}
```

**Response** (Error - 400/500):
```json
{
  "error": "Failed to fetch OIDC configuration",
  "message": "HTTP 404: Not Found"
}
```

**Implementation Example** (Node.js/Express):
```javascript
app.post('/api/pingone/oidc-discovery', async (req, res) => {
  try {
    const { issuerUrl } = req.body;
    
    if (!issuerUrl) {
      return res.status(400).json({ error: 'issuerUrl is required' });
    }
    
    const wellKnownUrl = `${issuerUrl}/.well-known/openid-configuration`;
    
    const response = await fetch(wellKnownUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('OIDC discovery failed:', error);
    res.status(500).json({
      error: 'Failed to fetch OIDC configuration',
      message: error.message,
    });
  }
});
```

---

### 2. UserInfo Proxy

**Endpoint**: `POST /api/pingone/userinfo`

**Purpose**: Fetch user information from PingOne UserInfo endpoint using access token

**Request Body**:
```json
{
  "userInfoEndpoint": "https://auth.pingone.com/b9817c16-9910-4415-b67e-4ac687da74d9/as/userinfo",
  "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response** (Success - 200):
```json
{
  "sub": "1234567890",
  "name": "John Doe",
  "given_name": "John",
  "family_name": "Doe",
  "email": "john.doe@example.com",
  "email_verified": true,
  "preferred_username": "johndoe"
}
```

**Response** (Error - 400/401/500):
```json
{
  "error": "Failed to fetch user information",
  "message": "Invalid access token"
}
```

**Implementation Example** (Node.js/Express):
```javascript
app.post('/api/pingone/userinfo', async (req, res) => {
  try {
    const { userInfoEndpoint, accessToken } = req.body;
    
    if (!userInfoEndpoint || !accessToken) {
      return res.status(400).json({ 
        error: 'userInfoEndpoint and accessToken are required' 
      });
    }
    
    const response = await fetch(userInfoEndpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const userInfo = await response.json();
    res.json(userInfo);
  } catch (error) {
    console.error('UserInfo fetch failed:', error);
    res.status(500).json({
      error: 'Failed to fetch user information',
      message: error.message,
    });
  }
});
```

---

## Existing Endpoints (Already Implemented)

These endpoints are already being used by the application and should continue to work:

### 3. Redirectless Authorization

**Endpoint**: `POST /api/pingone/redirectless/authorize`

**Purpose**: Start redirectless authorization flow with PingOne

**Request Body**:
```json
{
  "environmentId": "b9817c16-9910-4415-b67e-4ac687da74d9",
  "clientId": "a4f963ea-0736-456a-be72-b1fa4f63f81f",
  "clientSecret": "secret123",
  "scopes": "openid profile email",
  "state": "redirectless-oauth-authz-v8-1234567890",
  "responseMode": "pi.flow",
  "responseType": "code",
  "codeChallenge": "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM",
  "codeChallengeMethod": "S256",
  "redirectUri": "http://localhost:3000/callback"
}
```

---

### 4. Username/Password Check

**Endpoint**: `POST /api/pingone/flows/check-username-password`

**Purpose**: Submit username/password for redirectless authentication

**Request Body**:
```json
{
  "environmentId": "b9817c16-9910-4415-b67e-4ac687da74d9",
  "flowUrl": "https://auth.pingone.com/b9817c16-9910-4415-b67e-4ac687da74d9/flows/abc123",
  "username": "user@example.com",
  "password": "password123",
  "sessionId": "session123",
  "clientId": "a4f963ea-0736-456a-be72-b1fa4f63f81f",
  "clientSecret": "secret123"
}
```

---

### 5. Flow Resume

**Endpoint**: `POST /api/pingone/resume`

**Purpose**: Resume redirectless flow to get authorization code or tokens

**Request Body**:
```json
{
  "resumeUrl": "https://auth.pingone.com/b9817c16-9910-4415-b67e-4ac687da74d9/flows/abc123",
  "flowId": "abc123",
  "clientId": "a4f963ea-0736-456a-be72-b1fa4f63f81f",
  "clientSecret": "secret123",
  "flowState": "redirectless-oauth-authz-v8-1234567890",
  "sessionId": "session123"
}
```

---

## Security Considerations

### 1. CORS Configuration

Your backend should have proper CORS configuration to allow requests from your frontend:

```javascript
app.use(cors({
  origin: ['http://localhost:3000', 'https://localhost:3000'],
  credentials: true,
}));
```

### 2. Rate Limiting

Implement rate limiting to prevent abuse:

```javascript
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

app.use('/api/', apiLimiter);
```

### 3. Input Validation

Always validate and sanitize input:

```javascript
const { body, validationResult } = require('express-validator');

app.post('/api/pingone/oidc-discovery',
  body('issuerUrl').isURL().withMessage('Invalid issuer URL'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // ... rest of implementation
  }
);
```

### 4. Error Handling

Don't expose sensitive information in error messages:

```javascript
try {
  // ... implementation
} catch (error) {
  console.error('Internal error:', error); // Log full error
  res.status(500).json({
    error: 'Internal server error', // Generic message to client
    message: 'An error occurred while processing your request',
  });
}
```

---

## Testing

### Test OIDC Discovery

```bash
curl -X POST http://localhost:3000/api/pingone/oidc-discovery \
  -H "Content-Type: application/json" \
  -d '{
    "issuerUrl": "https://auth.pingone.com/b9817c16-9910-4415-b67e-4ac687da74d9/as"
  }'
```

### Test UserInfo

```bash
curl -X POST http://localhost:3000/api/pingone/userinfo \
  -H "Content-Type: application/json" \
  -d '{
    "userInfoEndpoint": "https://auth.pingone.com/b9817c16-9910-4415-b67e-4ac687da74d9/as/userinfo",
    "accessToken": "YOUR_ACCESS_TOKEN_HERE"
  }'
```

---

## Troubleshooting

### CORS Errors

If you see CORS errors in the browser console:
1. Verify your backend CORS configuration allows your frontend origin
2. Check that credentials are enabled in CORS config
3. Ensure preflight OPTIONS requests are handled

### 401 Unauthorized

If UserInfo endpoint returns 401:
1. Verify the access token is valid and not expired
2. Check that the token has the required scopes (openid, profile, email)
3. Ensure the token is being sent in the Authorization header correctly

### 404 Not Found

If OIDC discovery returns 404:
1. Verify the issuer URL is correct
2. Check that the environment ID is valid
3. Ensure the well-known endpoint exists at `{issuerUrl}/.well-known/openid-configuration`

---

## Summary

**New Endpoints to Implement**:
1. ✅ `POST /api/pingone/oidc-discovery` - OIDC discovery proxy
2. ✅ `POST /api/pingone/userinfo` - UserInfo proxy

**Existing Endpoints** (should already work):
3. `POST /api/pingone/redirectless/authorize` - Redirectless authorization
4. `POST /api/pingone/flows/check-username-password` - Username/password check
5. `POST /api/pingone/resume` - Flow resume

Once these two new endpoints are implemented, the CORS errors will be resolved and UserInfo fetching will work correctly.

---

**Last Updated**: 2024-11-19  
**Version**: 1.0.0
