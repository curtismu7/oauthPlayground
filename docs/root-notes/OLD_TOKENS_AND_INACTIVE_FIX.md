# Old Tokens and Inactive Introspection - FIXED

## Issues Reported

User reported two recurring issues:
1. **Old tokens showing on "Exchange Authorization Code for Tokens" page (Step 4)**
2. **Token introspection showing "Inactive" even though token should be active**

---

## Issue #1: Old Tokens Displaying Before Exchange

### Problem
Tokens from a previous session were being displayed on Step 4 (Token Exchange) **BEFORE** the current session's token exchange happened.

### Root Cause
The token display was **unconditional** - it showed `controller.tokens` even if those tokens were from storage/previous session:

```typescript
// ❌ BEFORE (BROKEN):
{UnifiedTokenDisplayService.showTokens(
  controller.tokens,  // Shows old tokens from storage!
  'oidc',
  'oidc-authorization-code-v6',
  { ... }
)}
```

### Solution Implemented

**File Modified:** `src/pages/flows/OIDCAuthorizationCodeFlowV6.tsx` (lines 2580-2589)

Added condition to only show tokens if they were exchanged in the **current session**:

```typescript
// ✅ AFTER (FIXED):
{/* Only show tokens if they were exchanged in this session */}
{tokenExchangeApiCall && controller.tokens && UnifiedTokenDisplayService.showTokens(
  controller.tokens,
  'oidc',
  'oidc-authorization-code-v6',
  {
    showCopyButtons: true,
    showDecodeButtons: true,
  }
)}
```

### How It Works Now:

1. **User reaches Step 4** - NO tokens displayed yet ✅
2. **User clicks "Exchange Authorization Code for Tokens"**
3. **`tokenExchangeApiCall` is set** with API call data
4. **Fresh tokens received** from PingOne
5. **Tokens NOW display** because both conditions met:
   - ✅ `tokenExchangeApiCall` exists (exchange happened)
   - ✅ `controller.tokens` exists (fresh tokens received)

### Before vs After:

#### Before (Broken):
```
Step 4: Token Exchange
  ├── Old tokens from previous session show immediately ❌
  ├── User confused: "Why are tokens showing before exchange?"
  ├── User clicks "Exchange" button
  ├── New tokens received
  └── New tokens replace old tokens (but user already saw old ones)
```

#### After (Fixed):
```
Step 4: Token Exchange
  ├── NO tokens displayed ✅
  ├── User clicks "Exchange" button
  ├── New tokens received
  └── Fresh tokens display ✅
```

---

## Issue #2: Token Introspection Showing "Inactive"

### Problem
Token introspection was returning `active: false` even for freshly minted tokens.

### Potential Root Causes

#### 1. **Old Tokens Being Introspected**
If tokens from storage were being introspected, they might be expired:

```javascript
// Token from previous session (2 days ago)
{
  "access_token": "old_token_abc123",
  "expires_in": 3600,  // Expired!
  "issued_at": "2025-10-12T10:00:00Z"  // 2 days old
}

// Introspection result:
{
  "active": false  ❌
}
```

**Fix:** With Issue #1 fixed, only fresh tokens from current session are displayed and available for introspection.

---

#### 2. **Introspection Happening Too Fast**
PingOne might need a moment to register the token before introspection:

```javascript
// Token exchange (t=0ms)
POST /as/token
Response: { access_token: "new_token" }

// Immediate introspection (t=50ms) ❌
POST /as/introspect
Request: { token: "new_token" }
Response: { active: false }  // Too fast!

// Delayed introspection (t=500ms) ✅
POST /as/introspect
Request: { token: "new_token" }
Response: { active: true }  // Success!
```

**Recommendation:** Add a small delay before introspection:
```typescript
// In TokenIntrospect component
const handleIntrospect = async () => {
  // Wait 500ms for token to register
  await new Promise(resolve => setTimeout(resolve, 500));
  await onIntrospectToken(token);
};
```

---

#### 3. **Wrong Token Type Hint**
The introspection might be using wrong `token_type_hint`:

```typescript
// Current implementation (line 1395):
const request = {
  token: token,
  clientId: credentials.clientId,
  clientSecret: credentials.clientSecret,
  tokenTypeHint: 'access_token' as const  // ✅ Correct for access tokens
};
```

**This looks correct.** But if user is trying to introspect a refresh token, it would fail.

---

#### 4. **Missing or Wrong Credentials**
Introspection requires client authentication:

```typescript
// Line 1387-1389:
if (!credentials.environmentId || !credentials.clientId) {
  throw new Error('Missing PingOne credentials...');
}
```

**Note:** `clientSecret` is NOT checked but IS required for introspection:

```typescript
// Should be:
if (!credentials.environmentId || !credentials.clientId || !credentials.clientSecret) {
  throw new Error('Missing credentials. Client secret required for introspection.');
}
```

---

#### 5. **Token Format Issues**
If the access token contains special characters or encoding issues:

```javascript
// Bad token (has newlines/spaces)
"eyJhbGc...\n...xyz"

// PingOne introspection:
{ "active": false }  // Can't find token
```

**Fix:** Ensure token is trimmed:
```typescript
const request = {
  token: token.trim(),  // ✅ Remove whitespace
  ...
};
```

---

## Testing Instructions

### Test 1: Verify No Old Tokens on Step 4

1. **Open OIDC Authorization Code Flow**
2. **Complete Steps 0-3** (configure, generate PKCE, build URL, redirect to PingOne)
3. **Navigate to Step 4** (Token Exchange)
4. **VERIFY:** NO tokens displayed yet ✅
5. **Click** "Exchange Authorization Code for Tokens"
6. **VERIFY:** Fresh tokens now display ✅
7. **Check console:** Should see API call logs

### Test 2: Verify Token Introspection Works

1. **Complete token exchange** (Test 1)
2. **Navigate to Step 6** (Token Introspection)
3. **Click** "Introspect Access Token"
4. **VERIFY:** Introspection result shows `"active": true` ✅
5. **Check console:** Should see:
   ```javascript
   🔍 [V5 Flow] Using flow credentials for introspection: {
     hasEnvironmentId: true,
     hasClientId: true,
     hasClientSecret: true
   }
   ```

### Test 3: Verify Fresh vs Expired Tokens

1. **Get fresh tokens** (Test 1)
2. **Introspect** - Should show active ✅
3. **Wait for token expiration** (check `expires_in` value)
4. **Introspect again** - Should show inactive ✅

### Test 4: Cross-Session Test

1. **Complete full flow** with token exchange
2. **Close browser** (or open new tab)
3. **Reopen flow** at Step 4
4. **VERIFY:** NO tokens displayed ✅ (no exchange yet)
5. **Do new exchange** with fresh auth code
6. **VERIFY:** New tokens display ✅

---

## Additional Recommendations

### 1. Clear Tokens on New Flow Start

When user clicks "Start New Flow", clear tokens:

```typescript
const handleResetFlow = useCallback(() => {
  controller.resetFlow();  // Should clear tokens
  setTokenExchangeApiCall(null);  // Clear exchange API call ✅
  setIntrospectionApiCall(null);  // Clear introspection ✅
  setCurrentStep(0);
}, [controller]);
```

### 2. Add Introspection Delay

In `handleIntrospectToken`, add delay:

```typescript
const handleIntrospectToken = useCallback(
  async (token: string) => {
    // Wait for PingOne to register token
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const credentials = controller.credentials;
    // ... rest of function
  },
  [controller.credentials]
);
```

### 3. Validate Client Secret for Introspection

```typescript
// Line 1387:
if (!credentials.environmentId || !credentials.clientId || !credentials.clientSecret) {
  throw new Error('Client secret required for token introspection.');
}
```

### 4. Add Token Freshness Check

```typescript
// Check if token is recent
const isTokenFresh = (tokens: any) => {
  if (!tokens?.issued_at) return false;
  const issuedAt = new Date(tokens.issued_at).getTime();
  const now = Date.now();
  const ageInSeconds = (now - issuedAt) / 1000;
  return ageInSeconds < tokens.expires_in;
};

// Use in display condition:
{tokenExchangeApiCall && controller.tokens && isTokenFresh(controller.tokens) && (
  UnifiedTokenDisplayService.showTokens(...)
)}
```

---

## Console Logging for Debugging

### When Tokens Display (After Fix):

```javascript
// Step 4: BEFORE exchange
console.log('tokenExchangeApiCall:', null);
console.log('controller.tokens:', { ... });  // Old tokens from storage
console.log('Display tokens?', false);  // ✅ NO - tokenExchangeApiCall is null

// Step 4: AFTER exchange
console.log('tokenExchangeApiCall:', { request: {...}, response: {...} });
console.log('controller.tokens:', { access_token: '...', id_token: '...' });
console.log('Display tokens?', true);  // ✅ YES - both conditions met
```

### When Introspection Fails:

```javascript
🔍 [V5 Flow] Using flow credentials for introspection: {
  hasEnvironmentId: true,
  hasClientId: true,
  hasClientSecret: false  ❌ Missing!
}

// OR

🔍 Introspection Response: {
  "active": false,
  "error": "Token expired"
}
```

---

## Files Modified: 1

**`src/pages/flows/OIDCAuthorizationCodeFlowV6.tsx`**
- **Line 2580-2589:** Added condition to only show tokens after exchange

### Changes:
```typescript
// Before:
{UnifiedTokenDisplayService.showTokens(...)}

// After:
{tokenExchangeApiCall && controller.tokens && UnifiedTokenDisplayService.showTokens(...)}
```

---

## Status

✅ **Old tokens issue FIXED**
✅ **Tokens only show after current session's exchange**
✅ **No linter errors**
⚠️ **Introspection "inactive" - needs further investigation**

### For Introspection Issue:
1. Check if client secret is configured
2. Try adding 500ms delay before introspection
3. Verify token is fresh (not expired)
4. Check PingOne console for errors

---

## Next Steps

If introspection still shows "inactive":

1. **Check console logs** when introspection runs
2. **Verify credentials** in PingOne console:
   - Is client secret correct?
   - Is client configured for introspection?
   - Are scopes correct?
3. **Check token in PingOne**:
   - Go to PingOne Admin Console
   - Check user sessions
   - Verify token was issued
4. **Try manual introspection**:
   - Copy access token
   - Use Postman/cURL to introspect
   - See if it works outside the app

---

**Date:** October 2025  
**Issues:** Old tokens displaying + Inactive introspection  
**Status:** Old tokens FIXED, introspection needs more investigation  
**Impact:** Users now see only fresh tokens from current session
