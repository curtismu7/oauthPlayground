# API Call Tracking Audit

## Pages Currently Tracking API Calls Properly

### ✅ PingOneUserProfile.tsx
**Status:** FIXED - Now tracking all API calls
- User profile fetch
- User groups fetch
- User roles fetch  
- User MFA devices fetch
- User consents fetch

All calls include:
- Proxy URL (localhost:3001)
- Actual PingOne URL (api.pingone.com)
- Authorization headers
- Response tracking with duration

### ✅ PingOneIdentityMetrics.tsx
**Status:** GOOD - Already tracking properly
- Identity metrics API call
- Includes actualPingOneUrl
- Tracks response and duration

### ✅ HelioMartPasswordReset.tsx
**Status:** GOOD - Uses trackedFetch utility
- All password-related API calls use `trackedFetch()`
- Automatic tracking with actualPingOneUrl support

## Pages That Display API Calls

### 1. PingOneUserProfile.tsx
- **Component:** `<ApiCallList />`
- **Tracking:** ✅ Complete (5 API calls tracked)

### 2. PingOneIdentityMetrics.tsx
- **Component:** `<ApiCallList />`
- **Tracking:** ✅ Complete (1 API call tracked)

### 3. HelioMartPasswordReset.tsx
- **Component:** `<ApiCallTable />`
- **Tracking:** ✅ Complete (uses trackedFetch)

### 4. PingOneAuthentication.tsx
- **Component:** `<ApiCallTable />`
- **Tracking:** ⚠️ Uses custom flow log system
- **Note:** This page has its own flow logging system and doesn't use apiCallTrackerService. This is intentional for educational purposes to show the complete OAuth flow.

## Pages Making PingOne API Calls (No Display)

These pages make API calls but don't display them in the UI. They don't need tracking unless we want to add API call display to them:

### PingOneAuditActivities.tsx
- Makes direct fetch to `/environments/{envId}/activities`
- No API call display component
- **Recommendation:** Add tracking if we want to show API calls

### PingOneWebhookViewer.tsx
- Makes fetch to `/api/webhooks/events`
- No API call display component
- **Recommendation:** No tracking needed (internal API)

### TokenManagement.tsx
- Makes fetch to `/api/introspect-token`
- No API call display component
- **Recommendation:** Add tracking if we want to show API calls

## Utility Functions

### trackedFetch.ts
**Status:** ✅ GOOD
- Automatically tracks all API calls
- Supports `actualPingOneUrl` parameter
- Includes retry logic for 404 errors
- Tracks request and response details

**Usage:**
```typescript
await trackedFetch('/api/pingone/user/123', {
  actualPingOneUrl: 'https://api.pingone.com/v1/environments/env-id/users/123',
  method: 'GET',
  headers: { 'Authorization': 'Bearer token' }
});
```

## Recommendations

### High Priority
1. ✅ **DONE:** Fix PingOneUserProfile to track all API calls
2. ✅ **DONE:** Ensure actualPingOneUrl is displayed in compact mode

### Medium Priority
3. **Consider:** Add API call tracking to PingOneAuditActivities if we want to show the API calls
4. **Consider:** Add API call tracking to TokenManagement if we want to show introspection calls

### Low Priority
5. **Optional:** Standardize PingOneAuthentication to use apiCallTrackerService instead of custom flow log (but current approach is fine for educational purposes)

## Testing Checklist

For each page that displays API calls:

- [ ] Navigate to the page
- [ ] Perform an action that makes API calls
- [ ] Verify API calls appear in the display
- [ ] Verify URLs show full PingOne endpoints (not localhost)
- [ ] Verify call types are correctly identified
- [ ] Verify response data is captured
- [ ] Verify duration is displayed

### PingOneUserProfile Testing
- [x] User profile fetch shows full URL
- [x] Groups fetch is tracked
- [x] Roles fetch is tracked
- [x] MFA fetch is tracked
- [x] Consents fetch is tracked
- [x] All show as "PingOne API" not "Proxy"

### PingOneIdentityMetrics Testing
- [x] Metrics fetch shows full URL
- [x] Shows as "PingOne API"

### HelioMartPasswordReset Testing
- [ ] Password operations tracked via trackedFetch
- [ ] Shows full PingOne URLs

## Summary

**Current Status:** 
- ✅ Main pages with API display are properly tracking calls
- ✅ All tracked calls include actualPingOneUrl
- ✅ Call type detection working correctly
- ✅ trackedFetch utility provides automatic tracking

**No Action Required** unless we want to add API call display to additional pages.
