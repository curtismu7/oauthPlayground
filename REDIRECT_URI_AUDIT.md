# Redirect URI Mismatch - Root Cause Analysis

## Error Reported
```
code: INVALID_DATA
details:
  code: INVALID_VALUE
  target: redirect_uri
  message: Redirect URI mismatch
```

## Root Cause Analysis

### 1. **Common Redirect URI Issues**

#### **Problem 1: Trailing Slashes**
- PingOne: `https://localhost:3000/authz-callback`
- App sends: `https://localhost:3000/authz-callback/`
- **Result**: Mismatch ❌

#### **Problem 2: URL Encoding**
- Current code uses `URLSearchParams.toString()` which auto-encodes
- BUT... if redirect URI has special chars, they must match PingOne exactly
- Example: `https://localhost:3000/callback?test=1` vs `https://localhost:3000/callback%3Ftest%3D1`

#### **Problem 3: Port Consistency**
- Browser shows: `https://localhost:3000`
- Code might generate: `https://localhost:3001` 
- Window.location.origin at runtime might differ from hardcoded values

#### **Problem 4: Protocol Mismatch**
- PingOne configured with: `https://localhost:3000/authz-callback`
- App might be running on: `http://localhost:3000/authz-callback`

### 2. **Checked Code Patterns**

#### **Pattern 1: Direct trim() usage** ✅ SAFE
```typescript
redirect_uri: credentials.redirectUri.trim()
```

#### **Pattern 2: URLSearchParams.set()** ✅ SAFE (auto-encodes)
```typescript
params.set('redirect_uri', credentials.redirectUri)
```

#### **Pattern 3: Generation from flowRedirectUriService** ⚠️ NEEDS VERIFICATION
```typescript
FlowRedirectUriService.getDefaultRedirectUri('oauth-authorization-code-v6')
// Returns: `${window.location.origin}/authz-callback`
```

**ISSUE**: If `window.location.origin` at flow initialization differs from authorization request time, we get a mismatch!

### 3. **Identified Issue**

The `flowRedirectUriService` generates redirect URIs using `window.location.origin` at component mount time. If the user:
1. Opens app at `http://localhost:3000` (initializes with http)
2. Navigates to flow (credentials get `http://localhost:3000/authz-callback`)
3. Browser upgrades to `https://localhost:3000` (via HSTS or redirect)
4. Authorization request sends `http://localhost:3000/authz-callback`
5. BUT PingOne has `https://localhost:3000/authz-callback` configured
6. **MISMATCH** ❌

## Solution

### Fix 1: Always Use Runtime Origin
```typescript
// BEFORE (flowRedirectUriMapping.ts line 237)
const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://localhost:3000');

// AFTER - Always get fresh origin at authorization request time
const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://localhost:3000');
```

### Fix 2: Log Redirect URI at Every Step
```typescript
console.log('🔍 [REDIRECT URI AUDIT]', {
  flowType: 'oauth-authorization-code-v6',
  credentialsRedirectUri: credentials.redirectUri,
  windowLocationOrigin: window.location.origin,
  fullUrl: authUrl,
  extractedRedirectUri: new URL(authUrl).searchParams.get('redirect_uri')
});
```

### Fix 3: Add Redirect URI Validation Utility
```typescript
export function validateRedirectUriMatch(
  pingOneConfigured: string,
  appGenerated: string
): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  // Normalize both URIs
  const normalize = (uri: string) => uri.trim().toLowerCase().replace(/\/$/, '');
  const p1 = normalize(pingOneConfigured);
  const a1 = normalize(appGenerated);
  
  if (p1 !== a1) {
    issues.push(`Mismatch: PingOne="${p1}" vs App="${a1}"`);
  }
  
  return {
    valid: issues.length === 0,
    issues
  };
}
```

## Files Updated

### Priority 1 - Core Service
- [x] `src/utils/flowRedirectUriMapping.ts` (line 237)
  - ✅ Already uses fresh `window.location.origin` (not cached)
  - ✅ No changes needed - code is correct

### Priority 2 - Authorization Flows
- [x] `src/hooks/useAuthorizationCodeFlowController.ts` (line 468-476, 593-598)
  - ✅ Added redirect URI audit logging for authorization request
  - ✅ Logs protocol, origin, trailing slash detection

- [ ] `src/hooks/useImplicitFlowController.ts` (line 353)
  - ⏳ TODO: Add redirect URI audit logging

- [ ] `src/hooks/useHybridFlowController.ts`
  - ⏳ TODO: Add redirect URI audit logging

### Priority 3 - Token Exchange
- [x] `src/hooks/useAuthorizationCodeFlowController.ts` (line 814-820)
  - ✅ Added redirect URI audit logging for token exchange
  - ✅ Validates trimming matches authorization request
  - ✅ Uses EXACT SAME redirect_uri as authorization

## Testing Checklist

- [ ] Test with http://localhost:3000
- [ ] Test with https://localhost:3000
- [ ] Test after protocol upgrade (http -> https)
- [ ] Test with trailing slash in PingOne config
- [ ] Test with no trailing slash in PingOne config
- [ ] Test authorization URL generation
- [ ] Test token exchange request
- [ ] Verify redirect_uri in both requests matches exactly

## PingOne Configuration Check

User should verify in PingOne:
1. Go to Application -> Configuration -> Redirect URIs
2. Check exact URI configured (including protocol, port, path)
3. Verify no trailing slashes unless intentional
4. Ensure protocol matches (https vs http)

**Expected Config**: `https://localhost:3000/authz-callback`

---

## Status Update (Current)

### ✅ Completed
1. ✅ Root cause analysis documented
2. ✅ Audit logging added to Authorization Code Flow
3. ✅ Token exchange logging added
4. ✅ PingOne config verified: `https://localhost:3000/authz-callback`
5. ✅ Code generation logic verified as correct

### ⏳ Pending User Action
1. **Test the flow** and check console for `🔍 [REDIRECT URI AUDIT]` logs
2. **Verify protocol**: Ensure accessing `https://localhost:3000` (not http)
3. **Share audit logs** from browser console for analysis

### ✅ ACTUAL CAUSE - RESOLVED
**User had wrong Client ID configured!**

When PingOne receives a request with an invalid/wrong Client ID:
1. ❌ Can't find the application in the environment
2. ❌ Can't validate the redirect_uri (no app = no registered URIs)
3. ❌ Returns error: `INVALID_DATA` → `INVALID_VALUE` → `target: redirect_uri`

**Error is misleading** - It says "Redirect URI mismatch" but the real issue is invalid Client ID.

**Solution**: Update credentials with correct Client ID from PingOne Console:
- Navigate to: `Applications → [Your App] → Configuration → Client ID`
- Copy the Client ID
- Update in flow credentials

**Note**: The redirect URI (`https://localhost:3000/authz-callback`) was correct all along! ✅

