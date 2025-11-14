# API Call Tracker - Display Actual PingOne URLs

## Issue
The API Call Tracker was showing proxy URLs (`/api/pingone/...`) instead of the actual PingOne API URLs in the main table view.

## Example
**Before:**
```
POST /api/pingone/password/check
POST /api/pingone/password/check  
POST /api/pingone/users/lookup
```

**After:**
```
POST https://api.pingone.com/v1/environments/{envId}/users/{userId}/password
POST https://api.pingone.com/v1/environments/{envId}/users/{userId}/password
POST https://api.pingone.com/v1/environments/{envId}/users/lookup
```

## Root Cause
The `ApiCallTable` component was displaying `call.url` (the proxy URL) in the main table row, while the actual PingOne URL (`call.actualPingOneUrl`) was only shown in the expanded details section.

## Solution

### 1. Main Table Display
Changed the URL display to prioritize the actual PingOne URL:

```typescript
// Before
{call.url}

// After
{call.actualPingOneUrl || call.url}
```

This ensures that:
- If `actualPingOneUrl` is provided, it's shown in the main table
- If not provided, falls back to the proxy URL
- Users see the real PingOne API endpoint at a glance

### 2. Expanded Details
Enhanced the expanded section to show both URLs when they differ:

```typescript
// Before
<SectionTitle>
  <FiExternalLink /> PingOne Endpoint
</SectionTitle>
<KeyValueList>
  <dt>URL:</dt>
  <dd>{call.actualPingOneUrl}</dd>
</KeyValueList>

// After
<SectionTitle>
  <FiExternalLink /> API Endpoints
</SectionTitle>
<KeyValueList>
  <dt>PingOne API:</dt>
  <dd>{call.actualPingOneUrl}</dd>
  <dt>Proxy URL:</dt>
  <dd>{call.url}</dd>
</KeyValueList>
```

This provides:
- Clear labeling of both URLs
- Understanding of the proxy architecture
- Full transparency of the API call flow

## How It Works

### trackedFetch Flow
1. Frontend calls `trackedFetch('/api/pingone/password/check', { actualPingOneUrl: 'https://api.pingone.com/...' })`
2. `trackedFetch` passes both URLs to `apiCallTrackerService.trackApiCall()`
3. `ApiCallTable` displays `actualPingOneUrl` in the main table
4. Expanded view shows both URLs for educational purposes

### Password Reset Service Example
```typescript
const response = await trackedFetch('/api/pingone/password/check', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ environmentId, userId, workerToken, password }),
  actualPingOneUrl: `https://api.pingone.com/v1/environments/${environmentId}/users/${userId}/password`,
});
```

## Benefits

### 1. Educational Value
Users can see the actual PingOne API endpoints being called, which helps them:
- Understand the PingOne API structure
- Learn the correct endpoint URLs
- Map proxy calls to real API calls

### 2. Debugging
Developers can:
- Verify the correct PingOne endpoint is being called
- See the full API URL with environment and user IDs
- Understand the request flow through the proxy

### 3. Documentation
The displayed URLs serve as:
- Live API documentation
- Examples of correct endpoint usage
- Reference for implementing direct API calls

## Files Modified

### src/components/ApiCallTable.tsx
- **Line ~479:** Changed URL display to use `actualPingOneUrl` first
- **Line ~504:** Enhanced expanded section to show both URLs

## Testing

### Manual Test
1. Navigate to Password Reset page
2. Perform any password operation (check, recover, etc.)
3. Observe the API Call Tracker
4. Verify actual PingOne URLs are shown in the main table
5. Expand a call to see both URLs

### Expected Results
- ✅ Main table shows PingOne API URLs
- ✅ Expanded view shows both PingOne and proxy URLs
- ✅ URLs are properly formatted and readable
- ✅ No console errors

## Backward Compatibility

The change is fully backward compatible:
- If `actualPingOneUrl` is not provided, falls back to `call.url`
- Existing code without `actualPingOneUrl` continues to work
- No breaking changes to the API

## Coverage

All password reset operations now show actual PingOne URLs:
- ✅ Send Recovery Code
- ✅ Recover Password
- ✅ Check Password
- ✅ Force Password Change
- ✅ Unlock Password
- ✅ Read Password State
- ✅ Set Password (all variants)

## Future Enhancements

Potential improvements:
- [ ] Add copy button for PingOne URLs
- [ ] Syntax highlighting for URLs
- [ ] Link to PingOne API documentation
- [ ] Show API version information
- [ ] Display rate limit information

## Related

- `src/utils/trackedFetch.ts` - Fetch wrapper with URL tracking
- `src/services/apiCallTrackerService.ts` - API call storage
- `src/services/passwordResetService.ts` - Example usage

## Summary

The API Call Tracker now correctly displays actual PingOne API URLs in the main table view, making it easier for users to understand which PingOne endpoints are being called and providing better educational value.

**Status:** ✅ Complete  
**Impact:** All API calls with `actualPingOneUrl` parameter  
**Breaking Changes:** None  
**Backward Compatible:** Yes
