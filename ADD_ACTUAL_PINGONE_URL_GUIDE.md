# Guide: Adding actualPingOneUrl to All Backend API Calls

## Goal
Ensure all backend API calls that proxy to PingOne display the actual PingOne API URL in the API Call Tracker for educational purposes.

## Services to Update

### ✅ Already Complete
1. **passwordResetService.ts** - All password operations have `actualPingOneUrl`
2. **pingOneUserProfileService.ts** - User lookup has `actualPingOneUrl`
3. **organizationLicensingService.ts** - Organization licensing has `actualPingOneUrl`

### 🔄 Need to Update

#### High Priority (Direct PingOne API Calls)

1. **pingOneApplicationService.ts**
   - `fetchApplications()` - GET applications
   - Actual URL: `https://api.pingone.com/v1/environments/{envId}/applications`

2. **pingOneMfaService.ts** (if exists)
   - MFA operations
   - Actual URL: `https://api.pingone.com/v1/environments/{envId}/users/{userId}/mfaSettings`

3. **Any service calling `/api/pingone/*` endpoints**

#### Medium Priority (OAuth/Token Operations)

1. **Token Exchange** (`/api/token-exchange`)
   - Actual URL: `https://auth.pingone.com/{envId}/as/token`
   - Note: This is an OAuth endpoint, not Management API

2. **UserInfo** (`/api/userinfo`)
   - Actual URL: `https://auth.pingone.com/{envId}/as/userinfo`

#### Low Priority (Non-PingOne)

1. **Health checks** (`/api/health`) - Internal, no PingOne URL
2. **Server status** - Internal, no PingOne URL

## Implementation Pattern

### Step 1: Import trackedFetch
```typescript
import { trackedFetch } from '../utils/trackedFetch';
```

### Step 2: Construct actualPingOneUrl
```typescript
// For Management API
const actualPingOneUrl = `https://api.pingone.com/v1/environments/${environmentId}/resource`;

// For Auth API
const actualPingOneUrl = `https://auth.pingone.com/${environmentId}/as/endpoint`;

// For Organizations API
const actualPingOneUrl = `https://api.pingone.com/v1/organizations/${orgId}`;
```

### Step 3: Replace fetch with trackedFetch
```typescript
// Before
const response = await fetch('/api/pingone/endpoint', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
});

// After
const actualPingOneUrl = `https://api.pingone.com/v1/environments/${envId}/resource`;
const response = await trackedFetch('/api/pingone/endpoint', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
  actualPingOneUrl,
});
```

## PingOne API URL Patterns

### Management API (api.pingone.com)
```
Base: https://api.pingone.com/v1

Users:
  GET    /environments/{envId}/users
  GET    /environments/{envId}/users/{userId}
  POST   /environments/{envId}/users
  PUT    /environments/{envId}/users/{userId}
  DELETE /environments/{envId}/users/{userId}

Passwords:
  GET    /environments/{envId}/users/{userId}/password
  POST   /environments/{envId}/users/{userId}/password
  PUT    /environments/{envId}/users/{userId}/password

Applications:
  GET    /environments/{envId}/applications
  GET    /environments/{envId}/applications/{appId}

Organizations:
  GET    /organizations
  GET    /organizations/{orgId}
  GET    /organizations/{orgId}/licenses

Environments:
  GET    /environments
  GET    /environments/{envId}
```

### Auth API (auth.pingone.com)
```
Base: https://auth.pingone.com/{envId}/as

Token:
  POST   /token

UserInfo:
  GET    /userinfo
  POST   /userinfo

Authorize:
  GET    /authorize

JWKS:
  GET    /jwks

Discovery:
  GET    /.well-known/openid-configuration
```

### Regional Variations
- **North America:** api.pingone.com, auth.pingone.com
- **Europe:** api.pingone.eu, auth.pingone.eu
- **Asia Pacific:** api.pingone.asia, auth.pingone.asia
- **Canada:** api.pingone.ca, auth.pingone.ca

## Testing Checklist

For each updated service:
- [ ] Import `trackedFetch` added
- [ ] `actualPingOneUrl` constructed correctly
- [ ] `actualPingOneUrl` passed to `trackedFetch`
- [ ] TypeScript compiles without errors
- [ ] API call appears in tracker with PingOne URL
- [ ] Expanded view shows both URLs
- [ ] Functionality still works correctly

## Example: Complete Update

### Before
```typescript
// src/services/exampleService.ts
export async function getResource(envId: string, token: string) {
  const response = await fetch('/api/pingone/resource', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to get resource');
  }
  
  return response.json();
}
```

### After
```typescript
// src/services/exampleService.ts
import { trackedFetch } from '../utils/trackedFetch';

export async function getResource(envId: string, token: string) {
  const actualPingOneUrl = `https://api.pingone.com/v1/environments/${envId}/resource`;
  
  const response = await trackedFetch('/api/pingone/resource', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    actualPingOneUrl,
  });
  
  if (!response.ok) {
    throw new Error('Failed to get resource');
  }
  
  return response.json();
}
```

## Benefits

### Educational Value
- Users see actual PingOne API endpoints
- Learn correct URL structure
- Understand API organization

### Debugging
- Verify correct endpoints are called
- See full API URLs with IDs
- Map proxy calls to real APIs

### Documentation
- Live API examples
- Reference for direct API calls
- Understanding of API patterns

## Automation Script

To find all services that need updating:

```bash
# Find all fetch calls to /api/ endpoints
grep -r "fetch('/api/" src/services/ --include="*.ts"

# Find all services not using trackedFetch
grep -r "fetch(" src/services/ --include="*.ts" | grep -v "trackedFetch"

# Check which services import trackedFetch
grep -r "import.*trackedFetch" src/services/ --include="*.ts"
```

## Priority Order

1. **Password operations** ✅ Complete
2. **User operations** ✅ Complete
3. **Organization licensing** ✅ Complete
4. **Application management** 🔄 In Progress
5. **MFA operations** 🔄 Pending
6. **Environment operations** 🔄 Pending
7. **Token operations** 🔄 Pending

## Notes

- Not all `/api/` calls are PingOne APIs (e.g., `/api/health`)
- Some endpoints are OAuth, not Management API
- Regional URLs may vary based on environment
- Some services may need backend updates too

## Completion Criteria

✅ All PingOne API calls show actual URLs in tracker
✅ No proxy URLs visible in main table
✅ Educational value maximized
✅ Debugging clarity improved
✅ No functionality broken
