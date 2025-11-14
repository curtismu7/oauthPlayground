# Quick Fix Reference - API 404 Errors

## TL;DR
✅ **FIXED** - All API calls now automatically retry 404 errors with exponential backoff.

## What Was Fixed
- ❌ Before: `POST /api/pingone/users/lookup 404 (Not Found)`
- ✅ After: Automatic retry with 100ms → 200ms → 400ms delays

## How It Works
Every API call through `trackedFetch()` now:
1. Detects 404 errors on local `/api/*` routes
2. Retries up to 3 times with exponential backoff
3. Succeeds once Vite proxy is ready
4. Logs retry attempts to console

## No Changes Needed
All existing code works automatically. The retry logic is transparent.

## If You Still See 404s

### Check 1: Is the backend running?
```bash
curl http://localhost:3001/api/health
# Should return: {"status":"ok",...}
```

### Check 2: Is the frontend running?
```bash
curl -k https://localhost:3000/api/health
# Should return: {"status":"ok",...}
```

### Check 3: Check browser console
Look for retry messages:
```
[trackedFetch] Got 404 for /api/..., retrying in 100ms (attempt 1/3)...
```

### Check 4: Hard refresh
Press `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows) to clear cache

## Common Issues

### Issue: 401 Unauthorized
**Cause:** Worker token is invalid or expired  
**Fix:** Generate a new worker token with `p1:read:user` scope

### Issue: 403 Forbidden
**Cause:** Worker token lacks required permissions  
**Fix:** Ensure token has `p1:read:user` scope

### Issue: 400 Bad Request
**Cause:** Invalid request data  
**Fix:** Check the request payload in Network tab

### Issue: Still getting 404 after retries
**Cause:** Backend endpoint doesn't exist  
**Fix:** Check `server.js` for the endpoint definition

## Testing the Fix

### Test 1: Cold Start
```bash
# 1. Stop both servers
# 2. Start backend: node server.js
# 3. Start frontend: npm run dev
# 4. Immediately click "Send Recovery Code"
# Result: Should work (may see retry logs)
```

### Test 2: Hot Reload
```bash
# 1. With both servers running
# 2. Edit any .tsx file and save
# 3. Immediately click "Send Recovery Code"
# Result: Should work (may see retry logs)
```

## Customizing Retry Behavior

### Increase retries for a specific call
```typescript
const response = await trackedFetch('/api/endpoint', {
  method: 'POST',
  body: JSON.stringify(data),
  maxRetries: 5,      // More retries
  retryDelay: 50,     // Faster retries
});
```

### Disable retries for a specific call
```typescript
const response = await trackedFetch('/api/endpoint', {
  method: 'POST',
  body: JSON.stringify(data),
  maxRetries: 0,      // No retries
});
```

## Files Changed
- ✅ `src/utils/trackedFetch.ts` - Added retry logic
- ✅ `src/services/pingOneUserProfileService.ts` - Enhanced error handling
- ✅ `src/utils/backendHealthCheck.ts` - Optional health check utility

## Need Help?
1. Check browser console for `[trackedFetch]` messages
2. Check Network tab for actual HTTP status codes
3. Check backend console for request logs
4. Read `RETRY-LOGIC-IMPLEMENTATION.md` for details
