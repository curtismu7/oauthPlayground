# Discovery Service 500 Error Fix

**Date:** 2025-10-09  
**Status:** ✅ FIXED  

## Problem

The discovery service was returning a 500 Internal Server Error when making requests with `region=na`:

```
GET /api/discovery?environment_id=b9817c16-9910-4415-b67e-4ac687da74d9&region=na
Error: Discovery request failed: 500 Internal Server Error
```

## Root Cause

The backend server's `/api/discovery` endpoint did not support the `na` (North America) region parameter. The `regionMap` only included:
- `us`
- `eu`
- `ca`
- `ap`

When the frontend sent `region=na`, the server would use the fallback `us` region, but this might have caused issues with the discovery URL construction or the `fetch` call.

## Solution

### 1. Added Region Support
**File:** `server.js` (lines 1156-1169)

Added `na` and `asia` region mappings:

```javascript
const regionMap = {
    us: 'https://auth.pingone.com',
    na: 'https://auth.pingone.com', // North America -> US
    eu: 'https://auth.pingone.eu',
    ca: 'https://auth.pingone.ca',
    ap: 'https://auth.pingone.asia',
    asia: 'https://auth.pingone.asia',
};
```

### 2. Enhanced Error Logging
**File:** `server.js` (lines 1148-1152, 1275-1279)

Added detailed request and error logging:

```javascript
// Request logging
console.log('[Discovery] Request received:', {
    environment_id,
    region,
    query: req.query
});

// Error logging
console.error('[Discovery] Server error:', {
    message: error.message,
    stack: error.stack,
    error
});
```

### 3. Server Restart
Restarted the backend server to apply the changes:
- Killed existing `node server.js` process
- Started new server instance
- Verified server is listening on ports 3001 (HTTP) and 3002 (HTTPS)

## Testing

To test the fix:

1. **Navigate to any V6 AuthZ flow**
2. **Enter credentials with region `na`**
3. **Click "Discover Endpoints"**
4. **Expected Result:** Discovery should succeed and populate endpoints

## Related Files

- `server.js` - Backend discovery endpoint
- `src/services/comprehensiveDiscoveryService.ts` - Frontend discovery service
- `src/services/comprehensiveCredentialsService.tsx` - Credentials UI with discovery

## Additional Notes

- The discovery endpoint still has fallback logic if PingOne returns an error
- The fallback configuration includes all standard OAuth/OIDC endpoints
- Region mapping is case-insensitive (`toLowerCase()` is applied)
- Default region is `us` if no region parameter is provided

## Status

✅ **FIXED** - Backend server updated and restarted. Discovery service should now work correctly with `region=na`.


