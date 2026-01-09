# V8 Utility - Delete All Users Restore & Persistence Documentation

**Version:** 1.0  
**Last Updated:** 2025-01-27  
**Utility Type:** Delete All Users Utility  
**Component:** `DeleteAllUsersUtilityV8` (to be implemented)

## Table of Contents

1. [Overview](#overview)
2. [Storage Locations](#storage-locations)
3. [State Persistence](#state-persistence)
4. [State Restoration](#state-restoration)
5. [URL Parameter Handling](#url-parameter-handling)
6. [Reset Semantics](#reset-semantics)
7. [Session Management](#session-management)
8. [Data Flow](#data-flow)

---

## Overview

The Delete All Users Utility uses minimal persistence due to security considerations. This document details what is stored where, when, and how it's restored.

### Storage Strategy

The Delete All Users Utility uses a **minimal persistence strategy**:

1. **Configuration**: `localStorage` (persists across sessions) - Environment ID and filters only
2. **Worker Token**: Global storage (via worker token service) - persists across sessions
3. **User List**: Component state (NOT persisted) - lost on refresh (security)
4. **Deletion Results**: Component state (NOT persisted) - lost on refresh
5. **URL State**: Route parameters (ephemeral)

### Key Principles

- ✅ **Configuration persists** across browser sessions (localStorage)
- ✅ **Worker Token persists** via global worker token service
- ❌ **User data NOT persisted** (security - user data should not be stored)
- ❌ **Deletion results NOT persisted** (temporary, not needed across sessions)
- ✅ **URL state** is used for navigation

---

## Storage Locations

### 1. Configuration Storage (`localStorage`)

**Purpose**: Persist utility configuration across browser sessions.

**Storage Key**: `v8:delete-all-users`

**Stored Data Structure**:
```typescript
{
  environmentId: string;
  filters: {
    populationId?: string;
    userStatus: 'ALL' | 'ACTIVE' | 'LOCKED' | 'DISABLED';
    usernamePattern?: string;
    emailPattern?: string;
  };
  version: number;  // Storage version for migration
}
```

**Storage Triggers**:
- On environment ID change (debounced)
- On filter change (debounced)
- On form blur

**Retrieval**:
- On component mount
- When utility initializes

**Lifespan**: Persists until:
- User manually clears browser data
- User explicitly clears configuration
- Application uninstalls

---

### 2. Worker Token Storage (Global Storage)

**Purpose**: Persist worker token via global worker token service.

**Storage Location**: Global worker token service (localStorage/IndexedDB)

**Storage Key**: `v8:worker_token` (via `WorkerTokenServiceV8`)

**Stored Data Structure**:
```typescript
{
  token: string;
  environmentId: string;
  clientId: string;
  clientSecret: string;
  scopes: string[];
  region: string;
  tokenEndpointAuthMethod: string;
  savedAt: number;
}
```

**Storage Triggers**:
- When worker token is generated/saved
- Via worker token modal

**Retrieval**:
- On component mount
- Via `WorkerTokenStatusServiceV8.checkWorkerTokenStatus()`

**Lifespan**: Persists until:
- Token expires
- User explicitly clears token
- User manually clears browser data

---

### 3. User List (Component State - NOT Persisted)

**Purpose**: Temporary storage for user list during utility session.

**Storage Location**: React component state (in-memory)

**Stored Data Structure**:
```typescript
Array<{
  id: string;
  username: string;
  email: string;
  status: string;
  populationId?: string;
  createdAt: string;
  updatedAt: string;
}>
```

**Storage Triggers**:
- After "Load Users" API call succeeds
- When users are fetched

**Retrieval**:
- From component state (not from storage)
- Lost on page refresh or navigation away

**Lifespan**: Persists only during:
- Current component mount
- Page session (until refresh)

**Why Not Persisted**:
- **Security**: User data should not be persisted in browser storage
- **Privacy**: User information is sensitive
- **Best Practice**: Only persist configuration, not user data

---

### 4. Deletion Results (Component State - NOT Persisted)

**Purpose**: Temporary storage for deletion results during utility session.

**Storage Location**: React component state (in-memory)

**Stored Data Structure**:
```typescript
{
  success: number;
  failed: number;
  errors: Array<{
    userId: string;
    username: string;
    error: string;
  }>;
  totalProcessed: number;
  processingTime: number;  // milliseconds
}
```

**Storage Triggers**:
- After deletion operation completes
- When results are available

**Retrieval**:
- From component state (not from storage)
- Lost on page refresh or navigation away

**Lifespan**: Persists only during:
- Current component mount
- Page session (until refresh)

**Why Not Persisted**:
- **Temporary**: Results are only needed for current session
- **Security**: Results may contain user information
- **Best Practice**: Results are ephemeral, not needed across sessions

---

### 5. URL State (Route Parameters)

**Purpose**: Enable navigation and pre-filling.

**Route Format**:
```
/v8/delete-all-users
```

**Query Parameters**:
- `env`: Pre-fill environment ID
  - Example: `/v8/delete-all-users?env=12345678-1234-1234-1234-123456789012`

**URL State Restoration**:
- **Environment ID**: Query parameter pre-fills environment ID field
- **Navigation**: Route updates when needed

---

## State Persistence

### Saving Configuration

**Trigger**: User modifies configuration fields (environment ID, filters).

**Process**:
1. User changes a field (e.g., `environmentId`)
2. Field value is updated in React state
3. Change event triggers debounced save (500ms delay)
4. Configuration object serialized to JSON
5. Saved to `localStorage` under key: `v8:delete-all-users`

**Save Conditions**:
- ✅ Field value changed (debounced)
- ✅ Environment ID is valid (non-empty, UUID format)
- ✅ Filters are valid

**Save Exclusions**:
- ❌ User list (not stored, security)
- ❌ Deletion results (not stored, temporary)
- ❌ Selected user IDs (not stored, security)

### Loading Configuration

**Trigger**: Component mount, utility initialization.

**Process**:
1. Check `localStorage` for key: `v8:delete-all-users`
2. Deserialize JSON
3. Validate configuration structure
4. Merge with defaults
5. Update React state

**Load Priority**:
1. **Saved Configuration** (localStorage)
2. **Query Parameter** (URL `env` parameter)
3. **Global Environment ID** (from `EnvironmentIdServiceV8`)
4. **Default Values** (empty strings, defaults)

**Default Values**:
```typescript
{
  environmentId: '',
  filters: {
    userStatus: 'ALL',
    populationId: undefined,
    usernamePattern: undefined,
    emailPattern: undefined,
  }
}
```

---

## State Restoration

### Initial Load Restoration

**Scenario**: User navigates to `/v8/delete-all-users` or refreshes page.

**Restoration Process**:

1. **Route Detection**:
   - Parse URL route: `/v8/delete-all-users`
   - Extract query parameters

2. **Configuration Restoration**:
   - Load configuration from `localStorage`
   - Key: `v8:delete-all-users`
   - Merge with query parameters (if present)
   - Merge with global environment ID (if available)
   - Populate configuration form

3. **Worker Token Restoration**:
   - Check global worker token service
   - Load worker token if available
   - Update token status indicator

4. **User List Restoration**:
   - ❌ **NOT restored** (user data not persisted)
   - User must click "Load Users" again

5. **Deletion Results Restoration**:
   - ❌ **NOT restored** (results not persisted)
   - Results are lost on refresh

**Restoration Limitations**:
- ❌ **User List**: NOT restored (must reload)
- ❌ **Deletion Results**: NOT restored (lost on refresh)
- ❌ **Selected Users**: NOT restored (must reselect)

**Why Limited Restoration**:
- Security - user data should not be persisted
- Privacy - user information is sensitive
- Best Practice - only persist configuration

### Session Restoration

**Scenario**: User refreshes page or navigates back during utility session.

**Restoration Priority**:

1. **Configuration**:
   - Always restored from localStorage
   - Available across all sessions

2. **Worker Token**:
   - Restored from global worker token service
   - Available if token is still valid

3. **User List**:
   - ❌ NOT restored (must reload)
   - User must click "Load Users" again

4. **Deletion Results**:
   - ❌ NOT restored (lost on refresh)
   - Results are not available after refresh

**Restoration Failures**:
- **Missing Configuration**: Show defaults, prompt user to configure
- **Invalid Worker Token**: Show error, prompt to generate new token
- **Missing User List**: User must reload users

---

## URL Parameter Handling

### Route Parameters

**Route Structure**:
```
/v8/delete-all-users
```

**No Route Parameters**: This utility uses a single route with no path parameters.

### Query Parameters

**Supported Parameters**:
- `env`: Pre-fill environment ID
  - Example: `/v8/delete-all-users?env=12345678-1234-1234-1234-123456789012`
  - Format: UUID
  - Default: None (if not specified)

**Query Parameter Handling**:
```typescript
const [searchParams] = useSearchParams();
const envParam = searchParams.get('env');

if (envParam) {
  // Pre-fill environment ID
  setEnvironmentId(envParam);
}
```

**Query Parameter Updates**:
- Environment ID can be pre-filled from query parameter
- Query parameter does not update automatically (read-only)

---

## Reset Semantics

### Reset Utility Action

**Trigger**: User clicks "Reset" button or starts new operation.

**What Gets Reset**:
- ✅ **Component State**: All React state cleared
- ✅ **User List**: Cleared
- ✅ **Selected Users**: Cleared
- ✅ **Deletion Results**: Cleared
- ✅ **Error Messages**: Cleared
- ❌ **Configuration**: **NOT cleared** (preserved in localStorage)
- ❌ **Worker Token**: **NOT cleared** (preserved in global storage)

**Reset Process**:
```typescript
// Clear component state
setUsers([]);
setSelectedUserIds(new Set());
setDeletionResults(null);
setError(null);
setIsLoading(false);
setIsDeleting(false);

// Configuration and worker token are preserved
```

### Clear Configuration Action

**Trigger**: User explicitly clears configuration (if action available).

**What Gets Cleared**:
- ✅ **localStorage Configuration**: Removed
- ✅ **Component State**: All state cleared
- ✅ **User List**: Cleared
- ✅ **Deletion Results**: Cleared

**Clear Process**:
```typescript
// Clear localStorage
localStorage.removeItem('v8:delete-all-users');

// Clear component state
// Reset to defaults
```

### Partial Reset

**Scenario**: User wants to reload users or start a new deletion.

**What Gets Preserved**:
- ✅ **Configuration**: Preserved in localStorage
- ✅ **Worker Token**: Preserved in global storage

**What Gets Reset**:
- ✅ **User List**: Cleared (must reload)
- ✅ **Selected Users**: Cleared
- ✅ **Deletion Results**: Cleared
- ✅ **Error Messages**: Cleared

---

## Session Management

### Browser Session

**Session Boundaries**:
- **Start**: Browser tab/window opened
- **End**: Browser tab/window closed
- **Scope**: Per-tab (not shared across tabs)

**Component State Behavior**:
- ✅ Persists during tab lifetime
- ✅ Shared across same-tab navigations
- ❌ Lost on page refresh
- ❌ Lost on tab close
- ❌ Not shared across tabs

### Cross-Tab Behavior

**Isolation**:
- Each tab has its own component state
- User list in Tab A is not visible in Tab B
- Configuration (localStorage) is shared across tabs
- Worker token (global storage) is shared across tabs

**Shared State**:
- ✅ **Configuration**: Shared via localStorage
- ✅ **Worker Token**: Shared via global storage
- ❌ **User List**: Isolated per tab
- ❌ **Deletion Results**: Isolated per tab

**Conflict Resolution**:
- If user opens multiple tabs:
  - Each tab has independent user list and results
  - Configuration is shared (last save wins)
  - Worker token is shared

### Session Expiration

**Component State Expiration**:
- Component state is lost on:
  - Page refresh
  - Tab close
  - Navigation away from utility

**Configuration Expiration**:
- Configuration persists until:
  - User manually clears browser data
  - User explicitly clears configuration
  - Application uninstalls

**Worker Token Expiration**:
- Worker tokens expire after their lifetime (typically 1 hour)
- Expired tokens are detected and user is prompted to generate new token

---

## Data Flow

### Complete Utility Sequence

```
1. User Configures Utility
   ↓
   [localStorage] v8:delete-all-users
   [Global Storage] Worker Token (if available)
   
2. Load Users
   ↓
   [API] POST /api/pingone/users/list
   ↓
   [Component State] users array
   
3. Select Users
   ↓
   [Component State] selectedUserIds Set
   
4. Delete Selected Users
   ↓
   [API] DELETE /api/pingone/user/:userId (for each user)
   ↓
   [Component State] deletionResults
```

### Restoration Flow

```
Page Load / Navigation
   ↓
[Route Detection] /v8/delete-all-users
[Query Detection] ?env={environmentId}
   ↓
[localStorage] Load configuration
   ↓
[Global Storage] Load worker token
   ↓
[Restore UI] Populate configuration form
   ↓
[User Action] Load users (if needed)
```

### Error Recovery Flow

```
Error Detected (e.g., invalid token, API error)
   ↓
[Show Error Message] User notification
   ↓
[Offer Recovery Options]
   - Retry operation
   - Generate new worker token
   - Check configuration
   ↓
[User Action] → Recovery path
```

---

## Best Practices

### For Developers

1. ✅ **Don't Persist User Data**: Never store user lists or user data in browser storage
2. ✅ **Secure Configuration**: Only persist configuration, not sensitive data
3. ✅ **Clear State on Reset**: Always clear component state when resetting
4. ✅ **Handle Restoration Gracefully**: Support page refresh with limitations
5. ✅ **Validate Worker Token**: Always check worker token validity before operations

### For Users

1. ✅ **Complete Operations in One Session**: Avoid refreshing page mid-operation
2. ✅ **Reload Users After Refresh**: User list is not saved - reload after refresh
3. ✅ **Review Before Deleting**: Always review user list before confirming deletion
4. ✅ **Check Results**: Review deletion results to understand any failures
5. ✅ **Use Filters**: Use filters to narrow down user list before deletion

---

## Troubleshooting

### Configuration Lost After Refresh

**Problem**: Configuration lost after page refresh.

**Cause**: Configuration should persist, but may be lost if localStorage is disabled.

**Solution**: 
- Check browser localStorage settings
- Verify configuration is being saved (check browser DevTools)
- Re-enter configuration if needed

### User List Lost After Refresh

**Problem**: User list lost after page refresh.

**Cause**: User list is not persisted (by design, for security).

**Solution**:
- This is expected behavior
- Click "Load Users" again after refresh
- Complete operations in one session if possible

### Worker Token Not Restored

**Problem**: Worker token not loaded on page load.

**Causes**:
- No worker token saved in global storage
- Worker token expired
- Browser storage disabled

**Solutions**:
- Click "Get Worker Token" to generate a new token
- Check browser storage settings
- Verify worker token service is working

### Deletion Results Lost After Refresh

**Problem**: Deletion results lost after page refresh.

**Cause**: Results are not persisted (by design, temporary).

**Solution**:
- This is expected behavior
- Results are only available during current session
- Complete deletion and review results before refreshing

---

## References

- [MDN - Window.localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- [PingOne User Management API](https://apidocs.pingidentity.com/pingone/platform/v1/api/#users)
- [PingOne Worker Token Documentation](https://apidocs.pingidentity.com/pingone/platform/v1/api/#worker-tokens)
