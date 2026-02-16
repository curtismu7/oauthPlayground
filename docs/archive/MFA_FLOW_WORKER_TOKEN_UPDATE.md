# MFA Flow - Worker Token Integration

## Changes Made

### 1. Updated MFA Service (`src/v8/services/mfaServiceV8.ts`)

**Key Changes:**
- ✅ Now uses `WorkerTokenServiceV8` for authentication instead of requiring client credentials per flow
- ✅ Changed from `userId` to `username` - service now looks up users by username
- ✅ Added `lookupUserByUsername()` method to search for users via PingOne Management API
- ✅ Worker token is cached and reused across all MFA operations
- ✅ Automatic token refresh when expired

**New Flow:**
1. Get worker token from `WorkerTokenServiceV8` (cached or fetch new)
2. Look up user by username using Management API filter: `username eq "john.doe"`
3. Use the resolved user ID for device registration and OTP operations

**API Calls:**
```typescript
// User lookup
GET /v1/environments/{envId}/users?filter=username eq "john.doe"
Authorization: Bearer {worker_token}

// Device registration
POST /v1/environments/{envId}/users/{userId}/devices
Authorization: Bearer {worker_token}

// Send OTP
POST /v1/environments/{envId}/users/{userId}/devices/{deviceId}/otp
Authorization: Bearer {worker_token}

// Validate OTP
POST /v1/environments/{envId}/users/{userId}/devices/{deviceId}/otp/check
Authorization: Bearer {worker_token}
```

### 2. Updated MFA Flow UI (`src/v8/flows/MFAFlowV8.tsx`)

**Key Changes:**
- ✅ Removed client ID and client secret fields (now uses worker token)
- ✅ Changed "User ID" field to "Username" field
- ✅ Added info box explaining worker token requirement
- ✅ Simplified credentials interface - only needs:
  - Environment ID
  - Username
  - Phone Number

**Before:**
```typescript
interface Credentials {
  environmentId: string;
  clientId: string;        // ❌ Removed
  clientSecret: string;    // ❌ Removed
  userId: string;          // ❌ Changed to username
  phoneNumber: string;
}
```

**After:**
```typescript
interface Credentials {
  environmentId: string;
  username: string;        // ✅ Now uses username
  phoneNumber: string;
}
```

### 3. Storage Integration

**Credentials Storage:**
- Uses `CredentialsServiceV8` for flow-specific credentials (environment, username, phone)
- Credentials are saved to localStorage with key: `v8_credentials_mfa-flow-v8`

**Worker Token Storage:**
- Uses `WorkerTokenServiceV8` for global worker token credentials
- Worker token is stored in:
  - Memory cache (fast)
  - localStorage: `v8:worker_token` (primary)
  - IndexedDB: `oauth_playground_v8` database (backup)

## Prerequisites

### Configure Worker Token First

Users must configure their worker token credentials before using the MFA flow:

1. Navigate to any flow that has worker token configuration
2. Enter worker token credentials:
   - Environment ID
   - Client ID (worker app)
   - Client Secret (worker app)
3. These credentials are saved globally and reused across all flows

**Worker App Requirements:**
- Grant type: `client_credentials`
- Scopes: Management API scopes for user and device management
- Permissions:
  - `p1:read:user`
  - `p1:update:user`
  - `p1:read:device`
  - `p1:create:device`
  - `p1:update:device`

## Benefits

### For Users:
- ✅ **Simpler UI** - Only 3 fields instead of 5
- ✅ **Username-based** - More intuitive than remembering user IDs
- ✅ **Reusable credentials** - Worker token configured once, used everywhere
- ✅ **Automatic token management** - No manual token refresh needed

### For Developers:
- ✅ **Centralized auth** - Single source of truth for worker tokens
- ✅ **Better caching** - Token reused across all API calls
- ✅ **Cleaner code** - No credential passing through every function
- ✅ **Consistent pattern** - Same approach across all V8 flows

## Testing

### Test the MFA Flow:

1. **Configure Worker Token** (one-time setup)
   - Use a worker app with Management API permissions
   - Save credentials in worker token service

2. **Run MFA Flow**
   - Step 0: Enter environment ID, username, phone number
   - Step 1: Register SMS device (looks up user automatically)
   - Step 2: Send OTP to phone
   - Step 3: Enter OTP code
   - Step 4: Success!

### Expected Console Logs:

```
[📱 MFA-FLOW-V8] Initializing MFA flow
[📱 MFA-FLOW-V8] Credentials changed, validating and saving
[📱 MFA-FLOW-V8] Credentials saved to localStorage
[📱 MFA-FLOW-V8] Registering SMS device
[🔑 WORKER-TOKEN-V8] Getting worker token from WorkerTokenServiceV8
[🔑 WORKER-TOKEN-V8] Using cached worker token
[📱 MFA-SERVICE-V8] Looking up user by username { username: 'john.doe' }
[📱 MFA-SERVICE-V8] User found { userId: 'xxx-xxx-xxx', username: 'john.doe' }
[📱 MFA-SERVICE-V8] Device registered successfully
```

## Error Handling

### Common Errors:

**"No worker token credentials found"**
- Solution: Configure worker token first

**"User not found: john.doe"**
- Solution: Verify username exists in PingOne environment

**"Failed to get worker token: invalid_client"**
- Solution: Check worker app client ID and secret

**"Device registration failed: insufficient_scope"**
- Solution: Add required Management API scopes to worker app

## Migration Notes

### If you have existing MFA flow data:

Old credentials with `userId` will need to be updated to use `username` instead. The flow will prompt for new credentials on first load.

### Backward Compatibility:

The old MFA service interface is completely replaced. Any code calling the old service will need to be updated to:
1. Remove client credentials parameters
2. Change `userId` to `username`
3. Ensure worker token is configured

---

**Last Updated:** 2024-11-19  
**Version:** 8.0.0  
**Status:** Active - MFA flow now uses WorkerTokenServiceV8
