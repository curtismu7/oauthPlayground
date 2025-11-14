# PKCE Mismatch Fix ✅

## Issue
**Error:** "Token exchange failed: Invalid authorization code or PKCE mismatch"

This occurred because the PKCE `code_verifier` was not being retrieved correctly after the redirect from PingOne.

## Root Cause
There was a **mismatch between storage and retrieval logic** for PKCE codes:

### Storage (Correct)
```javascript
// Line 250: Stored as full JSON object
const pkceStorageKey = `${persistKey}-pkce-codes`;
sessionStorage.setItem(pkceStorageKey, JSON.stringify(pkceCodes));
```

### Retrieval (Incorrect)
```javascript
// Lines 914-932: Looking for WRONG keys!
const possibleKeys = [
    'code_verifier',               // ❌ Wrong
    'oauth_v3_code_verifier',      // ❌ Wrong  
    `${flowKey}_code_verifier`,    // ❌ Wrong
];
```

**The retrieval logic was looking for individual string keys, but the storage was saving the entire object under a different key!**

## Solution
Fixed the retrieval logic to:
1. **FIRST** look for the correct key: `${persistKey}-pkce-codes`
2. Parse the JSON to get the full PKCECodes object
3. Extract `codeVerifier` from the parsed object
4. FALLBACK to legacy keys (for backwards compatibility)

### Fixed Code
```typescript
// Try to get code verifier from multiple possible storage locations
let codeVerifier = pkceCodes.codeVerifier;
if (!codeVerifier) {
    // FIRST: Try the correct key where we actually store PKCE codes
    const pkceStorageKey = `${persistKey}-pkce-codes`;
    const storedPkceCodes = safeSessionStorageParse<PKCECodes>(pkceStorageKey, null);
    if (storedPkceCodes?.codeVerifier) {
        codeVerifier = storedPkceCodes.codeVerifier;
        console.log(`✅ Retrieved code_verifier from ${pkceStorageKey}`);
    } else {
        // FALLBACK: Try legacy keys from older flow versions
        const possibleKeys = [
            'code_verifier',
            'oauth_v3_code_verifier', 
            `${flowKey}_code_verifier`,
            `${flowKey}_v3_code_verifier`,
            'oauth_code_verifier'
        ];
        
        for (const key of possibleKeys) {
            const stored = sessionStorage.getItem(key);
            if (stored) {
                codeVerifier = stored;
                console.log(`🔧 Retrieved code_verifier from legacy key: ${key}`);
                break;
            }
        }
    }
}
```

## Files Modified
- ✅ `src/hooks/useAuthorizationCodeFlowController.ts` - Fixed PKCE retrieval logic

## How PKCE Flow Works

### Step 1: Generate PKCE Codes
```
1. Generate random code_verifier (43-128 chars)
2. Create code_challenge = BASE64URL(SHA256(code_verifier))
3. Store both in sessionStorage: `${persistKey}-pkce-codes`
```

### Step 2: Authorization Request
```
1. Build authorization URL with:
   - client_id
   - redirect_uri
   - scope
   - code_challenge
   - code_challenge_method=S256
2. Redirect to PingOne
```

### Step 3: Token Exchange (After Redirect)
```
1. PingOne redirects back with authorization code
2. Retrieve code_verifier from sessionStorage ✅ NOW FIXED!
3. Exchange code for tokens with:
   - code
   - code_verifier
   - redirect_uri
   - client_id
   - client_secret
```

## Why This Matters
PKCE (Proof Key for Code Exchange) is a security mechanism to prevent authorization code interception attacks. The `code_verifier` and `code_challenge` MUST match:

- **code_challenge** sent in auth request = SHA256(code_verifier)
- **code_verifier** sent in token exchange = original verifier

If they don't match → PKCE mismatch error!

## Testing
To verify the fix:

1. Clear storage: `sessionStorage.clear(); localStorage.clear();`
2. Navigate to OAuth Authorization Code V6 flow
3. Enter credentials and save
4. Click "Step 2: Redirect to PingOne"
5. Log in to PingOne
6. After redirect, check console for:
   ```
   ✅ Retrieved code_verifier from oauth-authorization-code-v6-pkce-codes
   ```
7. Verify token exchange succeeds
8. Verify you get access_token and id_token

## Status
✅ **FIXED** - PKCE retrieval now uses the correct storage key

---

**Date:** October 12, 2025  
**Issue:** PKCE Mismatch  
**Resolution:** Fixed storage/retrieval key mismatch  
**File:** `src/hooks/useAuthorizationCodeFlowController.ts`

