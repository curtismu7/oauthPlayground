# User Lookup API URL Fix

## Issue
The user lookup API calls were showing the proxy URL (`/api/pingone/users/lookup`) instead of the actual PingOne API URL in the API Call Tracker.

## Example

**Before:**
```
POST /api/pingone/users/lookup
```

**After:**
```
POST https://api.pingone.com/v1/environments/{envId}/users
```

## Root Cause
The `lookupPingOneUser` function in `pingOneUserProfileService.ts` was not passing the `actualPingOneUrl` parameter to `trackedFetch`, so the API Call Tracker only had the proxy URL to display.

## Solution

Added the `actualPingOneUrl` parameter to the `trackedFetch` call:

```typescript
// Construct the actual PingOne API URL for display purposes
const actualPingOneUrl = `https://api.pingone.com/v1/environments/${environmentId}/users`;

const response = await trackedFetch('/api/pingone/users/lookup', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ environmentId, accessToken, identifier }),
  actualPingOneUrl, // Show the actual PingOne API endpoint
  maxRetries: 3,
  retryDelay: 100,
});
```

## How It Works

### Backend Behavior
The backend `/api/pingone/users/lookup` endpoint makes different PingOne API calls depending on the identifier:

1. **UUID (Direct ID Lookup)**
   ```
   GET https://api.pingone.com/v1/environments/{envId}/users/{userId}
   ```

2. **Email (Filter Search)**
   ```
   GET https://api.pingone.com/v1/environments/{envId}/users?filter=email eq "user@example.com"
   ```

3. **Username (Filter Search)**
   ```
   GET https://api.pingone.com/v1/environments/{envId}/users?filter=username eq "username"
   ```

### Display URL
Since the backend can make different calls, we show the base users endpoint:
```
https://api.pingone.com/v1/environments/{envId}/users
```

This accurately represents that the backend is calling the PingOne Users API, even though the specific endpoint varies based on the lookup type.

## Benefits

### 1. Consistency
All API calls now show actual PingOne URLs in the tracker, not proxy URLs.

### 2. Educational Value
Users can see:
- The PingOne Users API endpoint
- How to construct the URL with environment ID
- The base path for user operations

### 3. Debugging
Developers can:
- Verify the correct PingOne API is being called
- Understand the API structure
- Map proxy calls to real endpoints

### 4. Documentation
The displayed URL serves as:
- Live API documentation
- Example of correct endpoint usage
- Reference for direct API calls

## Files Modified

### src/services/pingOneUserProfileService.ts
- **Line ~30:** Added `actualPingOneUrl` construction
- **Line ~37:** Passed `actualPingOneUrl` to `trackedFetch`

## Testing

### Manual Test
1. Navigate to Password Reset page
2. Use User Lookup to find a user
3. Check the API Call Tracker
4. Verify it shows: `https://api.pingone.com/v1/environments/{envId}/users`

### Expected Results
- ✅ API Call Tracker shows PingOne URL
- ✅ URL includes environment ID
- ✅ No console errors
- ✅ User lookup still works correctly

## Coverage

All user lookup operations now show the actual PingOne URL:
- ✅ Lookup by User ID (UUID)
- ✅ Lookup by Username
- ✅ Lookup by Email
- ✅ Used in Password Reset tabs
- ✅ Used in other user operations

## Expanded Details

When you expand the API call in the tracker, you'll see:

```
API Endpoints
  PingOne API: https://api.pingone.com/v1/environments/{envId}/users
  Proxy URL: /api/pingone/users/lookup
```

This shows both:
- The actual PingOne API being called
- The frontend proxy endpoint

## Related Changes

This fix complements the earlier fix for password operations:
- Password operations: Show actual PingOne password endpoints
- User lookup: Show actual PingOne users endpoint
- Both: Provide educational value and debugging clarity

## API Call Tracker Display

### Main Table
Shows the actual PingOne URL immediately:
```
Method | URL                                                      | Status | Time
-------|----------------------------------------------------------|--------|------
POST   | https://api.pingone.com/v1/environments/{envId}/users   | 200    | 300ms
```

### Expanded View
Shows both URLs for complete context:
```
API Endpoints
  PingOne API: https://api.pingone.com/v1/environments/{envId}/users
  Proxy URL: /api/pingone/users/lookup

Request Headers
  Content-Type: application/json
  Authorization: Bearer [token]

Request Body
  {
    "environmentId": "...",
    "accessToken": "...",
    "identifier": "curtis7"
  }

Response (200 OK)
  {
    "user": { ... },
    "matchType": "username"
  }
```

## Why Show Base URL?

The backend makes different calls based on identifier type:
- Direct ID: `/users/{id}`
- Filter: `/users?filter=...`

We show the base `/users` endpoint because:
1. It's accurate - all calls go to the users API
2. It's educational - shows the base endpoint structure
3. It's consistent - same URL regardless of lookup type
4. It's useful - developers can build on this base URL

## Future Enhancements

Potential improvements:
- [ ] Show the specific endpoint in expanded view (with filter)
- [ ] Indicate lookup type (ID, username, email)
- [ ] Show the actual filter used
- [ ] Display query parameters separately

## Summary

The user lookup service now correctly displays the actual PingOne API URL in the API Call Tracker, providing consistency with other API operations and better educational value for users learning the PingOne API.

**Status:** ✅ Complete  
**Impact:** All user lookup operations  
**Breaking Changes:** None  
**Backward Compatible:** Yes
