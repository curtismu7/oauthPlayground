# PingOne Tools Documentation

**Comprehensive guide to PingOne integration tools and utilities**

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Available Tools](#available-tools)
3. [Tool Categories](#tool-categories)
4. [Setup & Configuration](#setup--configuration)
5. [Tool Details](#tool-details)
6. [Integration Patterns](#integration-patterns)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

---

## Overview

### What are PingOne Tools?

PingOne Tools are specialized utilities designed to interact with, monitor, and manage PingOne services. They provide:

- **API Integration** - Direct interaction with PingOne APIs
- **Real-time Monitoring** - Live data from PingOne services
- **Administrative Tools** - Management and configuration utilities
- **Educational Resources** - Learning materials and references
- **Debugging Tools** - Troubleshooting and diagnostics

### Key Benefits

| Benefit | Description |
|---------|-------------|
| **Simplified Integration** | Pre-built tools for common PingOne tasks |
| **Real-time Insights** | Live monitoring of PingOne services |
| **Educational Value** | Learn PingOne APIs hands-on |
| **Time Savings** | Ready-to-use tools vs building from scratch |
| **Best Practices** | Implementations follow Ping Identity standards |

---

## Available Tools

### Monitoring & Analytics (4 tools)
1. **PingOne Identity Metrics** - User identity statistics and counts
2. **PingOne Audit Activities** - Audit log viewer with filtering
3. **PingOne Webhook Viewer** - Real-time webhook event monitoring
4. **Performance Dashboard** - System performance metrics

### Authentication & Authorization (5 tools)
5. **PingOne Authentication** - Direct PingOne authentication flow
6. **PingOne User Profile** - User profile management
7. **Worker Token Tester** - Worker token validation
8. **Organization Licensing** - License and organization management
9. **Token Inspector** - Token analysis and validation

### Reference & Documentation (3 tools)
10. **PingOne Scopes Reference** - OAuth/OIDC scopes documentation
11. **JWKS Troubleshooting** - JWKS endpoint testing
12. **Service Discovery** - PingOne service endpoint discovery

### Development Tools (3 tools)
13. **URL Decoder** - OAuth URL parameter decoder
14. **Token Management** - Token lifecycle management
15. **Webhook Receiver** - Local webhook testing

---

## Tool Categories

### Category 1: Monitoring Tools

**Purpose**: Real-time monitoring and analytics

**Tools**:
- PingOne Identity Metrics
- PingOne Audit Activities
- PingOne Webhook Viewer
- Performance Dashboard

**Common Features**:
- Real-time data updates
- Filtering and search
- Export capabilities
- Visual dashboards

---

### Category 2: Authentication Tools

**Purpose**: User authentication and authorization

**Tools**:
- PingOne Authentication
- PingOne User Profile
- Worker Token Tester
- Organization Licensing

**Common Features**:
- OAuth/OIDC integration
- Token management
- User profile access
- Credential validation

---

### Category 3: Reference Tools

**Purpose**: Documentation and learning

**Tools**:
- PingOne Scopes Reference
- JWKS Troubleshooting
- Service Discovery

**Common Features**:
- Educational content
- Interactive examples
- API documentation
- Best practices

---

### Category 4: Development Tools

**Purpose**: Development and debugging

**Tools**:
- URL Decoder
- Token Management
- Webhook Receiver

**Common Features**:
- Debugging utilities
- Testing capabilities
- Development aids
- Local testing

---

## Setup & Configuration

### Prerequisites

1. **PingOne Environment**
   - Active PingOne account
   - Environment ID
   - Application credentials

2. **Application Configuration**
   - Client ID
   - Client Secret
   - Redirect URIs configured

3. **API Access**
   - Worker app credentials (for API tools)
   - Appropriate scopes enabled
   - API access configured

### Initial Setup

#### Step 1: Configure Credentials

```typescript
// Navigate to Configuration page
// Enter your PingOne credentials:
{
  environmentId: 'your-environment-id',
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  region: 'us' // or 'eu', 'ca', 'ap'
}
```

#### Step 2: Set Up Worker Token (for API tools)

```typescript
// For tools requiring API access:
// 1. Create worker application in PingOne
// 2. Grant necessary permissions
// 3. Configure in Organization Licensing page
```

#### Step 3: Configure Webhooks (optional)

```typescript
// For webhook monitoring:
// 1. Set up webhook in PingOne
// 2. Configure webhook URL
// 3. Start webhook viewer
```

---

## Tool Details

### 1. PingOne Identity Metrics

**File**: `PingOneIdentityMetrics.tsx`

**Purpose**: Visual explorer for PingOne identity statistics

**Features**:
- Total identity counts
- Active identity counts
- Time-based filtering
- Visual charts and graphs
- Export capabilities

**API Endpoints Used**:
```
GET /environments/{environmentId}/totalIdentities
GET /environments/{environmentId}/activeIdentityCounts
```

**Use Cases**:
- Monitor user growth
- Track active users
- Generate reports
- Capacity planning
- License management

**Example Usage**:
```typescript
// Fetch identity metrics
const response = await fetch(
  `https://api.pingone.com/v1/environments/${environmentId}/totalIdentities`,
  {
    headers: {
      'Authorization': `Bearer ${workerToken}`,
      'Content-Type': 'application/json'
    }
  }
);

const metrics = await response.json();
// { count: 1234, _links: {...} }
```

**Configuration**:
- Requires worker token
- Needs `p1:read:env` scope
- Supports all regions (US, EU, CA, AP)

---

### 2. PingOne Audit Activities

**File**: `PingOneAuditActivities.tsx`

**Purpose**: Audit log viewer with advanced filtering

**Features**:
- Real-time audit log viewing
- Filter by action type
- Filter by result status
- Time-based filtering
- JSON detail view
- Export audit logs

**API Endpoints Used**:
```
GET /environments/{environmentId}/activities
```

**Filters Available**:
- **Action Types**: Authentication, Authorization, User Management, etc.
- **Result Status**: Success, Failure
- **Time Range**: Last 24h, 7d, 30d, custom
- **Actor**: User or application

**Use Cases**:
- Security auditing
- Compliance reporting
- Troubleshooting issues
- User activity tracking
- Forensic analysis

**Example Usage**:
```typescript
// Fetch audit activities with filters
const filters = [
  'action.type eq "AUTHENTICATION"',
  'result.status eq "SUCCESS"'
].join(' and ');

const response = await fetch(
  `https://api.pingone.com/v1/environments/${environmentId}/activities?filter=${encodeURIComponent(filters)}&limit=100`,
  {
    headers: {
      'Authorization': `Bearer ${workerToken}`,
      'Content-Type': 'application/json'
    }
  }
);
```

**Configuration**:
- Requires worker token
- Needs `p1:read:env:activities` scope
- Supports pagination
- Regional endpoints

---

### 3. PingOne Webhook Viewer

**File**: `PingOneWebhookViewer.tsx`

**Purpose**: Real-time webhook event monitoring

**Features**:
- Live webhook event display
- Event type filtering
- Timestamp tracking
- JSON payload viewer
- Event history
- Export events

**Webhook Types Supported**:
- User events (create, update, delete)
- Authentication events
- Authorization events
- Session events
- Custom events

**Use Cases**:
- Webhook testing
- Event monitoring
- Integration debugging
- Real-time notifications
- Event-driven workflows

**Example Setup**:
```typescript
// 1. Configure webhook in PingOne
{
  name: "Development Webhook",
  url: "https://your-app.com/webhook",
  events: ["USER.CREATED", "USER.UPDATED", "AUTHENTICATION.SUCCESS"]
}

// 2. Receive webhook in app
app.post('/webhook', (req, res) => {
  const event = req.body;
  // Process webhook event
  res.status(200).send('OK');
});
```

**Configuration**:
- Webhook URL must be HTTPS
- Verify webhook signatures
- Handle retry logic
- Store events for viewing

---

### 4. PingOne Authentication

**File**: `PingOneAuthentication.tsx`

**Purpose**: Direct PingOne authentication flow

**Features**:
- OAuth 2.0 authorization code flow
- PKCE support
- Token management
- User profile retrieval
- Session management

**Flow Steps**:
1. Initiate authorization
2. User authenticates
3. Receive authorization code
4. Exchange for tokens
5. Access user profile

**Use Cases**:
- User login
- SSO integration
- Profile access
- Token acquisition
- Session management

**Example Flow**:
```typescript
// 1. Build authorization URL
const authUrl = new URL(`https://auth.pingone.com/${environmentId}/as/authorize`);
authUrl.searchParams.set('client_id', clientId);
authUrl.searchParams.set('redirect_uri', redirectUri);
authUrl.searchParams.set('response_type', 'code');
authUrl.searchParams.set('scope', 'openid profile email');
authUrl.searchParams.set('code_challenge', codeChallenge);
authUrl.searchParams.set('code_challenge_method', 'S256');

// 2. Redirect user
window.location.href = authUrl.toString();

// 3. Handle callback
const code = new URLSearchParams(window.location.search).get('code');

// 4. Exchange code for tokens
const tokenResponse = await fetch(tokenEndpoint, {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: clientId,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier
  })
});
```

---

### 5. PingOne User Profile

**File**: `PingOneUserProfile.tsx`

**Purpose**: User profile management and viewing

**Features**:
- View user profile
- Update profile information
- Manage user attributes
- View user groups
- Access user metadata

**Profile Attributes**:
- Basic info (name, email, phone)
- Custom attributes
- Group memberships
- Account status
- Last login

**Use Cases**:
- Profile management
- User administration
- Attribute updates
- Group management
- Account verification

**Example Usage**:
```typescript
// Fetch user profile
const response = await fetch(
  `https://api.pingone.com/v1/environments/${environmentId}/users/${userId}`,
  {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  }
);

const profile = await response.json();
// {
//   id: "user-id",
//   email: "user@example.com",
//   name: { given: "John", family: "Doe" },
//   ...
// }
```

---

### 6. Worker Token Tester

**File**: `WorkerTokenTester.tsx`

**Purpose**: Validate and test worker application tokens

**Features**:
- Token acquisition
- Token validation
- Scope verification
- Expiration checking
- Token refresh

**Worker Token Flow**:
```typescript
// 1. Request worker token
const response = await fetch(
  `https://auth.pingone.com/${environmentId}/as/token`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials'
    })
  }
);

const { access_token, expires_in } = await response.json();

// 2. Use token for API calls
const apiResponse = await fetch(apiEndpoint, {
  headers: {
    'Authorization': `Bearer ${access_token}`
  }
});
```

**Use Cases**:
- API authentication
- Service-to-service auth
- Background jobs
- Automated tasks
- System integration

---

### 7. Organization Licensing

**File**: `OrganizationLicensing_V2.tsx`

**Purpose**: Organization and license management

**Features**:
- View organization details
- Check license status
- Monitor usage
- Manage environments
- Configure settings

**Information Displayed**:
- Organization ID
- License type
- User limits
- Feature access
- Expiration dates

**Use Cases**:
- License monitoring
- Usage tracking
- Capacity planning
- Compliance checking
- Renewal management

---

### 8. PingOne Scopes Reference

**File**: `PingOneScopesReference.tsx`

**Purpose**: Educational reference for OAuth/OIDC scopes

**Features**:
- Comprehensive scope documentation
- Scope descriptions
- Required permissions
- Use case examples
- Best practices

**Scope Categories**:

#### OIDC Standard Scopes
- `openid` - Required for OIDC
- `profile` - User profile information
- `email` - Email address
- `address` - Physical address
- `phone` - Phone number

#### PingOne Specific Scopes
- `p1:read:user` - Read user data
- `p1:update:user` - Update user data
- `p1:read:env` - Read environment data
- `p1:update:env` - Update environment data

**Use Cases**:
- Learning OAuth scopes
- Planning integrations
- Troubleshooting access
- Security auditing
- Documentation reference

---

### 9. JWKS Troubleshooting

**File**: `JWKSTroubleshooting.tsx`

**Purpose**: JWKS endpoint testing and validation

**Features**:
- Fetch JWKS from PingOne
- Validate JWKS format
- Test key retrieval
- Regional endpoint support
- Error diagnostics

**Endpoints Tested**:
```
US: https://auth.pingone.com/{environmentId}/as/jwks
EU: https://auth.pingone.eu/{environmentId}/as/jwks
CA: https://auth.pingone.ca/{environmentId}/as/jwks
AP: https://auth.pingone.asia/{environmentId}/as/jwks
```

**Use Cases**:
- Token validation setup
- Troubleshooting JWT errors
- Key rotation verification
- Regional configuration
- Integration testing

**Example Usage**:
```typescript
// Fetch JWKS
const response = await fetch(
  `https://auth.pingone.com/${environmentId}/as/jwks`
);

const jwks = await response.json();
// {
//   keys: [
//     {
//       kty: "RSA",
//       use: "sig",
//       kid: "key-id",
//       n: "...",
//       e: "AQAB"
//     }
//   ]
// }
```

---

### 10. Service Discovery

**File**: `ServiceDiscovery.tsx`

**Purpose**: Discover PingOne service endpoints

**Features**:
- OIDC discovery
- Endpoint listing
- Configuration retrieval
- Regional support
- Metadata viewing

**Discovery Endpoint**:
```
https://auth.pingone.com/{environmentId}/as/.well-known/openid-configuration
```

**Information Retrieved**:
- Authorization endpoint
- Token endpoint
- UserInfo endpoint
- JWKS URI
- Supported scopes
- Supported grant types
- Supported response types

**Use Cases**:
- Dynamic configuration
- Endpoint discovery
- Integration setup
- Multi-region support
- Automated configuration

---

### 11. URL Decoder

**File**: `URLDecoder.tsx`

**Purpose**: Decode and analyze OAuth URLs

**Features**:
- URL parameter extraction
- Parameter validation
- Pretty formatting
- Copy to clipboard
- Sample URLs

**Parameters Decoded**:
- `client_id`
- `redirect_uri`
- `response_type`
- `scope`
- `state`
- `nonce`
- `code_challenge`
- `code_challenge_method`

**Use Cases**:
- Debugging OAuth flows
- Understanding parameters
- Troubleshooting redirects
- Learning OAuth
- Documentation

---

### 12. Token Management

**File**: `TokenManagement.tsx`

**Purpose**: Comprehensive token lifecycle management

**Features**:
- Token storage
- Token inspection
- Token refresh
- Token revocation
- Token history
- Introspection

**Token Operations**:
```typescript
// Store token
storeToken(token, 'access', 'Authorization Code Flow');

// Retrieve token
const token = getToken('access');

// Refresh token
const newToken = await refreshToken(refreshToken);

// Revoke token
await revokeToken(token);

// Introspect token
const info = await introspectToken(token);
```

**Use Cases**:
- Token lifecycle management
- Security testing
- Token validation
- Debugging
- Audit trails

---

### 13. Webhook Receiver

**File**: `WebhookReceiver.tsx`

**Purpose**: Local webhook testing and development

**Features**:
- Receive webhooks locally
- Display webhook payloads
- Validate signatures
- Test webhook handling
- Debug webhook issues

**Setup**:
```typescript
// 1. Start local server
// 2. Use ngrok or similar for HTTPS tunnel
// 3. Configure webhook URL in PingOne
// 4. Receive and view webhooks
```

**Use Cases**:
- Local development
- Webhook testing
- Integration debugging
- Event handling
- Development workflow

---

## Integration Patterns

### Pattern 1: API Integration with Worker Token

```typescript
// 1. Acquire worker token
const getWorkerToken = async () => {
  const response = await fetch(
    `https://auth.pingone.com/${environmentId}/as/token`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials'
      })
    }
  );
  
  const { access_token } = await response.json();
  return access_token;
};

// 2. Use token for API calls
const callPingOneAPI = async (endpoint) => {
  const token = await getWorkerToken();
  
  const response = await fetch(endpoint, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  return response.json();
};

// 3. Example: Fetch identity metrics
const metrics = await callPingOneAPI(
  `https://api.pingone.com/v1/environments/${environmentId}/totalIdentities`
);
```

### Pattern 2: User Authentication Flow

```typescript
// 1. Initiate authentication
const initiateAuth = () => {
  const authUrl = buildAuthorizationUrl({
    environmentId,
    clientId,
    redirectUri,
    scope: 'openid profile email',
    responseType: 'code',
    codeChallenge,
    codeChallengeMethod: 'S256'
  });
  
  window.location.href = authUrl;
};

// 2. Handle callback
const handleCallback = async (code) => {
  const tokens = await exchangeCodeForTokens({
    code,
    clientId,
    redirectUri,
    codeVerifier
  });
  
  return tokens;
};

// 3. Access user profile
const getUserProfile = async (accessToken) => {
  const response = await fetch(
    `https://api.pingone.com/v1/environments/${environmentId}/users/me`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  );
  
  return response.json();
};
```

### Pattern 3: Webhook Integration

```typescript
// 1. Configure webhook endpoint
app.post('/webhook', async (req, res) => {
  const event = req.body;
  const signature = req.headers['x-pingone-signature'];
  
  // 2. Verify signature
  const isValid = verifyWebhookSignature(event, signature, webhookSecret);
  
  if (!isValid) {
    return res.status(401).send('Invalid signature');
  }
  
  // 3. Process event
  await processWebhookEvent(event);
  
  // 4. Acknowledge receipt
  res.status(200).send('OK');
});

// 5. Process different event types
const processWebhookEvent = async (event) => {
  switch (event.type) {
    case 'USER.CREATED':
      await handleUserCreated(event.data);
      break;
    case 'AUTHENTICATION.SUCCESS':
      await handleAuthSuccess(event.data);
      break;
    default:
      console.log('Unknown event type:', event.type);
  }
};
```

---

## Best Practices

### 1. Security

✅ **DO**:
- Store credentials securely
- Use HTTPS for all requests
- Validate webhook signatures
- Implement token refresh
- Use appropriate scopes

❌ **DON'T**:
- Expose credentials in code
- Skip signature verification
- Use overly broad scopes
- Store tokens insecurely
- Ignore token expiration

### 2. Error Handling

✅ **DO**:
```typescript
try {
  const response = await callPingOneAPI(endpoint);
  return response;
} catch (error) {
  if (error.status === 401) {
    // Token expired, refresh
    await refreshToken();
    return callPingOneAPI(endpoint);
  }
  
  // Log and handle error
  console.error('API call failed:', error);
  throw error;
}
```

❌ **DON'T**:
```typescript
// Don't ignore errors
const response = await callPingOneAPI(endpoint);
// No error handling!
```

### 3. Token Management

✅ **DO**:
- Refresh tokens before expiration
- Store tokens securely
- Clear tokens on logout
- Validate token scopes
- Handle token revocation

❌ **DON'T**:
- Use expired tokens
- Store tokens in localStorage without encryption
- Forget to clear tokens
- Ignore token validation
- Skip revocation on logout

### 4. API Usage

✅ **DO**:
- Use pagination for large datasets
- Implement rate limiting
- Cache responses when appropriate
- Use filters to reduce data
- Handle regional endpoints

❌ **DON'T**:
- Fetch all data at once
- Ignore rate limits
- Make unnecessary API calls
- Ignore pagination
- Hardcode endpoints

---

## Troubleshooting

### Common Issues

#### Issue: Worker Token Not Working

**Symptoms**: 401 Unauthorized errors

**Solutions**:
1. Verify client credentials
2. Check application type (must be Worker)
3. Verify granted scopes
4. Check token expiration
5. Validate environment ID

#### Issue: Webhook Not Receiving Events

**Symptoms**: No webhook events appearing

**Solutions**:
1. Verify webhook URL is HTTPS
2. Check webhook is enabled in PingOne
3. Verify event types are configured
4. Check firewall/network settings
5. Validate webhook signature verification

#### Issue: JWKS Validation Failing

**Symptoms**: Token signature validation errors

**Solutions**:
1. Verify correct JWKS endpoint
2. Check regional endpoint (US/EU/CA/AP)
3. Verify environment ID
4. Check key rotation
5. Validate token issuer

#### Issue: API Rate Limiting

**Symptoms**: 429 Too Many Requests errors

**Solutions**:
1. Implement exponential backoff
2. Cache responses
3. Use pagination
4. Reduce request frequency
5. Contact support for limits

---

## Regional Endpoints

### API Endpoints by Region

| Region | API Base URL | Auth Base URL |
|--------|--------------|---------------|
| **US/NA** | `https://api.pingone.com` | `https://auth.pingone.com` |
| **EU** | `https://api.pingone.eu` | `https://auth.pingone.eu` |
| **CA** | `https://api.pingone.ca` | `https://auth.pingone.ca` |
| **AP** | `https://api.pingone.asia` | `https://auth.pingone.asia` |

### Configuration

```typescript
const getRegionalEndpoints = (region: string) => {
  const domains = {
    us: { api: 'api.pingone.com', auth: 'auth.pingone.com' },
    eu: { api: 'api.pingone.eu', auth: 'auth.pingone.eu' },
    ca: { api: 'api.pingone.ca', auth: 'auth.pingone.ca' },
    ap: { api: 'api.pingone.asia', auth: 'auth.pingone.asia' }
  };
  
  return domains[region] || domains.us;
};
```

---

## Resources

### Official Documentation
- [PingOne API Documentation](https://apidocs.pingidentity.com/pingone/platform/v1/api/)
- [PingOne Developer Portal](https://developer.pingidentity.com/)
- [OAuth 2.0 Specification](https://oauth.net/2/)
- [OpenID Connect Specification](https://openid.net/connect/)

### Tool Files
- Monitoring: `src/pages/PingOne*.tsx`
- Authentication: `src/pages/PingOneAuthentication*.tsx`
- Reference: `src/pages/PingOneScopes*.tsx`
- Development: `src/pages/Token*.tsx`, `src/pages/URL*.tsx`

---

## Summary

PingOne Tools provide comprehensive utilities for:

- ✅ **Monitoring** - Real-time insights into PingOne services
- ✅ **Authentication** - User and application authentication
- ✅ **Reference** - Educational resources and documentation
- ✅ **Development** - Debugging and testing utilities
- ✅ **Integration** - Simplified PingOne API integration

**All tools follow Ping Identity best practices and security standards.**

---

*PingOne Tools Documentation v1.0.0 - November 2025*
