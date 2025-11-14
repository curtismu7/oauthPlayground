# PingOne URL Tracking Status

## Goal
Display actual PingOne API URLs in the API Call Tracker for all backend API calls.

## Current Status

### ✅ Complete (3 services)

1. **passwordResetService.ts** - All 10 password operations
   - Send Recovery Code
   - Recover Password
   - Force Password Change
   - Change Password
   - Check Password
   - Unlock Password
   - Read Password State
   - Set Password (Admin)
   - Set Password (General)
   - Set Password (LDAP Gateway)

2. **pingOneUserProfileService.ts** - User lookup
   - Lookup by ID, username, or email
   - Shows: `https://api.pingone.com/v1/environments/{envId}/users`

3. **organizationLicensingService.ts** - Organization licensing
   - Get organization info
   - Shows: `https://api.pingone.com/v1/organizations/{orgId}`

### 🔄 In Progress (2 services)

4. **clientCredentialsSharedService.ts** - Token exchange
   - Uses regular `fetch`, not `trackedFetch`
   - Would show: `https://auth.pingone.com/{envId}/as/token`
   - **Decision needed:** Convert to `trackedFetch` or leave as-is?

5. **pingOneApplicationService.ts** - Application management
   - Get worker token
   - Fetch applications
   - Would show: `https://api.pingone.com/v1/environments/{envId}/applications`
   - **Decision needed:** Convert to `trackedFetch`?

### ⏸️ Skipped (Internal APIs)

- **serverRestartHistoryService.ts** - `/api/health` (internal, not PingOne)

## Services Using trackedFetch

Currently only 3 services use `trackedFetch`:
1. passwordResetService.ts ✅
2. pingOneUserProfileService.ts ✅
3. organizationLicensingService.ts ✅

## Services Using Regular fetch

Many services use regular `fetch` for various reasons:
- Token exchange operations
- Application management
- Health checks
- Other internal APIs

## Decision Points

### Should We Convert All to trackedFetch?

**Pros:**
- Consistent API tracking
- Educational value for all PingOne calls
- Better debugging visibility
- Complete API call history

**Cons:**
- Some services are complex and well-tested
- Risk of breaking existing functionality
- Not all `/api/` calls are PingOne APIs
- Some calls are OAuth, not Management API

### Recommended Approach

**Phase 1: High-Value, Low-Risk** ✅ COMPLETE
- Password operations ✅
- User lookup ✅
- Organization licensing ✅

**Phase 2: Medium-Value, Medium-Risk** 🔄 CURRENT
- Application management
- Token exchange (if educational value is high)

**Phase 3: Low-Priority**
- Internal health checks (skip)
- Other non-PingOne APIs (skip)

## Implementation Strategy

### For New Services
Always use `trackedFetch` for PingOne API calls:
```typescript
import { trackedFetch } from '../utils/trackedFetch';

const actualPingOneUrl = `https://api.pingone.com/v1/...`;
const response = await trackedFetch('/api/pingone/...', {
  ...options,
  actualPingOneUrl,
});
```

### For Existing Services
Evaluate case-by-case:
1. Is it a PingOne API call?
2. Is it frequently used?
3. Is it educational?
4. Is it low-risk to change?

If yes to all, convert to `trackedFetch`.

## Current Coverage

### API Calls Tracked
- ✅ Password operations (10 endpoints)
- ✅ User lookup (1 endpoint)
- ✅ Organization licensing (1 endpoint)
- **Total: 12 PingOne API endpoints tracked**

### API Calls Not Tracked
- ❌ Token exchange
- ❌ Application management
- ❌ MFA operations (if any)
- ❌ Environment operations (if any)
- ❌ Other Management API calls

## Benefits Achieved

### Educational Value
Users can now see actual PingOne API URLs for:
- All password management operations
- User lookup operations
- Organization licensing

### Debugging
Clear visibility into:
- Which PingOne endpoints are called
- Request/response data
- API call timing
- Error responses

### Documentation
Live examples of:
- Password API usage
- User API usage
- Organization API usage

## Next Steps

### Option A: Complete Coverage (Aggressive)
1. Convert all PingOne API calls to `trackedFetch`
2. Add `actualPingOneUrl` to every call
3. Maximum educational value
4. Higher risk of breaking changes

### Option B: Selective Coverage (Conservative) ✅ RECOMMENDED
1. Keep current 3 services with tracking
2. Add tracking only for new services
3. Convert existing services only if:
   - High educational value
   - Low risk
   - Frequently used
4. Lower risk, still good coverage

### Option C: Current State (Minimal)
1. Stop here with 3 services
2. Good coverage of password operations
3. Lowest risk
4. Still provides significant value

## Recommendation

**Proceed with Option B (Selective Coverage)**

Reasons:
1. Current coverage is already valuable (password + user operations)
2. These are the most commonly used educational features
3. Low risk of breaking existing functionality
4. Can add more services incrementally as needed

## Testing Checklist

For each service with tracking:
- [x] Password operations - All working
- [x] User lookup - Working
- [x] Organization licensing - Working
- [ ] Token exchange - Not yet tracked
- [ ] Application management - Not yet tracked

## Summary

We have successfully added PingOne URL tracking to the 3 most important services:
1. **Password operations** - Complete API visibility
2. **User lookup** - Shows user API endpoints
3. **Organization licensing** - Shows org API endpoints

This provides significant educational value while maintaining system stability. Additional services can be converted on a case-by-case basis as needed.

**Status:** Phase 1 Complete ✅  
**Coverage:** 12 PingOne API endpoints tracked  
**Risk:** Low (only updated well-tested services)  
**Value:** High (covers most common operations)
