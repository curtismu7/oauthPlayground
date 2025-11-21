# Scope Defaults Implementation

## Summary

Implemented proper scope defaults and validation for all OAuth/OIDC flows to prevent common user errors.

**Implementation Date**: 2024-11-19

---

## Changes Made

### 1. User Authentication Flows (OAuth/OIDC)

**Flows Updated**:
- Authorization Code Flow (`oauthIntegrationServiceV8.ts`)
- Implicit Flow (`implicitFlowIntegrationServiceV8.ts`)
- Hybrid Flow (`hybridFlowIntegrationServiceV8.ts`)

**Default Scopes**: `openid profile email`

**Behavior**:
- If no scopes provided → defaults to `openid profile email`
- If scopes provided but missing `openid` → automatically adds `openid` and warns
- If scopes provided with `openid` → uses as-is

**Why `openid` is Required**:
- `openid` scope is **mandatory** for OIDC flows
- Without it, you won't get an ID token
- It enables user authentication (not just authorization)

**Example**:
```typescript
// User provides empty scopes
credentials.scopes = '';
// Result: 'openid profile email'

// User provides scopes without 'openid'
credentials.scopes = 'profile email';
// Result: 'openid profile email' (with warning)

// User provides scopes with 'openid'
credentials.scopes = 'openid profile email address';
// Result: 'openid profile email address' (no change)
```

---

### 2. Machine-to-Machine Flow (Client Credentials)

**Flow Updated**: Client Credentials (`clientCredentialsIntegrationServiceV8.ts`)

**Default Scopes**: **NONE** (scopes are required but no default)

**Behavior**:
- If no scopes provided → throws error with helpful message
- If `openid` scope detected → warns that it's incorrect
- Scopes must be Management API scopes (e.g., `p1:read:user`)

**Why NO Default**:
- Client credentials is for **machine-to-machine** authentication
- There's no user involved, so `openid` makes no sense
- Scopes should be API/resource scopes, not user identity scopes
- Different apps need different API scopes

**Error Message**:
```
Scopes are required for client credentials flow. 
Use Management API scopes (e.g., p1:read:user, p1:read:environment). 
Do NOT use "openid" - that is for user authentication flows only.
```

**Warning if `openid` Used**:
```
WARNING: 'openid' scope detected in client credentials flow. 
This is incorrect - openid is for user authentication. 
Use Management API scopes instead (p1:read:user, p1:read:environment, etc.)
```

**Example**:
```typescript
// User provides empty scopes
credentials.scopes = '';
// Result: Error thrown

// User mistakenly uses 'openid'
credentials.scopes = 'openid';
// Result: Warning logged, request sent (will likely fail at PingOne)

// User provides correct scopes
credentials.scopes = 'p1:read:user p1:read:environment';
// Result: Request sent successfully
```

---

## Scope Types Explained

### User Authentication Scopes (OIDC)

Used in: Authorization Code, Implicit, Hybrid flows

| Scope | Purpose | Returns |
|-------|---------|---------|
| `openid` | **Required** for OIDC | Enables ID token |
| `profile` | User profile info | name, given_name, family_name, etc. |
| `email` | User email | email, email_verified |
| `address` | User address | address object |
| `phone` | User phone | phone_number, phone_number_verified |
| `offline_access` | Refresh token | Enables refresh token issuance |

### Management API Scopes (PingOne)

Used in: Client Credentials flow

| Scope | Purpose |
|-------|---------|
| `p1:read:user` | Read user information |
| `p1:update:user` | Update user information |
| `p1:create:user` | Create users |
| `p1:delete:user` | Delete users |
| `p1:read:environment` | Read environment configuration |
| `p1:update:environment` | Update environment configuration |
| `p1:read:sessions` | Read user sessions |
| `p1:delete:sessions` | Delete user sessions |

---

## Console Warnings

### User Flows - Missing `openid`

```
[🔐 OAUTH-INTEGRATION-V8] WARNING: 'openid' scope is missing. 
For user authentication flows, 'openid' scope is required for OIDC. 
Adding it automatically.
```

### Client Credentials - Using `openid`

```
[🔑 CLIENT-CREDENTIALS-V8] WARNING: 'openid' scope detected in client credentials flow. 
This is incorrect - openid is for user authentication. 
Use Management API scopes instead (p1:read:user, p1:read:environment, etc.)
```

---

## Testing

### Test User Flows (Should Default to `openid`)

1. Navigate to Authorization Code Flow V8
2. Leave scopes field empty
3. Generate authorization URL
4. Check console - should see scopes: `openid profile email`
5. Check authorization URL - should include `scope=openid+profile+email`

### Test Client Credentials (Should Require Scopes)

1. Navigate to Client Credentials Flow
2. Leave scopes field empty
3. Click "Request Token"
4. Should see error: "Scopes are required for client credentials flow..."
5. Enter `p1:read:user`
6. Click "Request Token"
7. Should succeed (if credentials are valid)

---

## Migration Guide

### If You Were Using Empty Scopes

**Before**:
```typescript
// Authorization Code Flow
credentials.scopes = ''; // Would fail at PingOne
```

**After**:
```typescript
// Authorization Code Flow
credentials.scopes = ''; // Automatically becomes 'openid profile email'
```

### If You Were Using `openid` in Client Credentials

**Before**:
```typescript
// Client Credentials Flow
credentials.scopes = 'openid'; // Would fail at PingOne
```

**After**:
```typescript
// Client Credentials Flow
credentials.scopes = 'p1:read:user p1:read:environment'; // Correct scopes
```

---

## Benefits

✅ **Prevents Common Errors**: Users can't accidentally omit `openid` from user flows  
✅ **Better Error Messages**: Clear guidance when scopes are missing or incorrect  
✅ **Automatic Correction**: Adds `openid` automatically if missing in user flows  
✅ **Warnings**: Alerts users when they're using wrong scope types  
✅ **Consistent Behavior**: All user flows handle scopes the same way  
✅ **Educational**: Error messages teach users about correct scope usage  

---

## Files Modified

1. `src/v8/services/oauthIntegrationServiceV8.ts` - Authorization Code Flow
2. `src/v8/services/implicitFlowIntegrationServiceV8.ts` - Implicit Flow
3. `src/v8/services/hybridFlowIntegrationServiceV8.ts` - Hybrid Flow
4. `src/v8/services/clientCredentialsIntegrationServiceV8.ts` - Client Credentials

---

## Related Documentation

- [OAuth 2.0 Scopes](https://oauth.net/2/scope/)
- [OpenID Connect Scopes](https://openid.net/specs/openid-connect-core-1_0.html#ScopeClaims)
- [PingOne Management API Scopes](https://apidocs.pingidentity.com/pingone/platform/v1/api/#scopes)

---

**Status**: ✅ Complete  
**Last Updated**: 2024-11-19  
**Version**: 1.0.0
