# V8 Utility - Delete All Users UI Contract

**Version:** 1.0  
**Last Updated:** 2025-01-27  
**Utility Type:** Delete All Users Utility  
**Component:** `DeleteAllUsersUtilityV8` (to be implemented)

## Overview

The Delete All Users Utility is a management tool that allows administrators to delete multiple users from a PingOne environment. This utility provides filtering options, bulk deletion capabilities, and detailed results reporting.

### Key Characteristics

- ✅ **Bulk Operations**: Delete multiple users in a single operation
- ✅ **Filtering**: Filter users by attributes (status, population, etc.)
- ✅ **Worker Token Required**: Uses worker token for authentication
- ✅ **Confirmation Required**: Requires explicit confirmation before deletion
- ✅ **Results Reporting**: Shows success/failure counts and error details

## Utility Structure

The Delete All Users Utility consists of **3 main sections**:

1. **Configuration Section**: Environment ID, worker token, and filter options
2. **User List Section**: Display and select users to delete
3. **Results Section**: Deletion results and error reporting

## Section-by-Section Contract

### Section 1: Configuration

**Component:** Configuration form  
**Purpose:** Configure environment, authentication, and filtering options

#### Required Fields

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| `environmentId` | `string` | PingOne Environment ID | Required, non-empty, UUID format |
| `workerToken` | `string` | Worker token for API authentication | Required, valid JWT format |

#### Optional Filter Fields

| Field | Type | Description | Default | Notes |
|-------|------|-------------|---------|-------|
| `populationId` | `string` | Filter by population ID | `undefined` | Optional, UUID format |
| `userStatus` | `'ALL' \| 'ACTIVE' \| 'LOCKED' \| 'DISABLED'` | Filter by user status | `'ALL'` | Optional filter |
| `usernamePattern` | `string` | Filter by username pattern | `undefined` | Optional, supports wildcards |
| `emailPattern` | `string` | Filter by email pattern | `undefined` | Optional, supports wildcards |

#### Field Visibility Rules

- **Environment ID**: Always visible, auto-loaded from global storage
- **Worker Token**: Always visible, managed via worker token modal
- **Filter Options**: Collapsible section, visible when expanded
- **Population Filter**: Visible when population management is enabled

#### Validation Rules

```typescript
const isValid = 
  environmentId?.trim() &&
  workerToken?.trim() &&
  tokenStatus.isValid; // Worker token must be valid
```

#### Output

- **State**: Updated configuration object
- **Persistence**: Saved to `localStorage` under key: `v8:delete-all-users`
- **Next Action**: "Load Users" button enabled when valid

---

### Section 2: User List

**Component:** User list with selection  
**Purpose:** Display users matching filters and allow selection for deletion

#### Inputs

- `environmentId`: Environment ID from Section 1
- `workerToken`: Worker token from Section 1
- `filters`: Filter options from Section 1

#### API Endpoint

**Backend Proxy:** `POST /api/pingone/users/list`

**Request Body:**
```json
{
  "environmentId": "{environment_id}",
  "workerToken": "{worker_token}",
  "populationId": "{population_id}",  // Optional
  "status": "{user_status}",  // Optional
  "usernamePattern": "{pattern}",  // Optional
  "emailPattern": "{pattern}"  // Optional
}
```

**Response (Success - 200 OK):**
```json
{
  "users": [
    {
      "id": "string",
      "username": "string",
      "email": "string",
      "status": "ACTIVE" | "LOCKED" | "DISABLED",
      "populationId": "string",
      "createdAt": "string",
      "updatedAt": "string"
    }
  ],
  "totalCount": 0,
  "filteredCount": 0
}
```

#### Display Fields

| Field | Display | Sort | Filter | Notes |
|-------|---------|------|--------|-------|
| Username | ✅ | ✅ | ✅ | Primary identifier |
| Email | ✅ | ✅ | ✅ | Secondary identifier |
| Status | ✅ | ✅ | ✅ | ACTIVE, LOCKED, DISABLED |
| Population | ✅ | ✅ | ✅ | Population name/ID |
| Created At | ✅ | ✅ | ❌ | ISO 8601 timestamp |
| User ID | ✅ | ❌ | ❌ | UUID (for reference) |

#### Selection Features

- **Select All**: Select all users in current list
- **Select None**: Clear all selections
- **Individual Selection**: Toggle individual users
- **Selection Count**: Display count of selected users

#### User Actions

- **Load Users**: Fetch users matching filters
- **Refresh List**: Reload current user list
- **Clear Selection**: Clear all selections

---

### Section 3: Deletion Results

**Component:** Results display  
**Purpose:** Show deletion progress and results

#### Deletion Process

1. **Confirmation**: User confirms deletion via modal
2. **Bulk Deletion**: Delete users one by one via API
3. **Progress Tracking**: Track success/failure for each user
4. **Results Display**: Show summary and detailed results

#### API Endpoint

**Backend Proxy:** `DELETE /api/pingone/user/:userId`

**Request Headers:**
```
Authorization: Bearer {worker_token}
```

**Response (Success - 204 No Content or 200 OK):**
- 204: User deleted successfully
- 200: Deletion confirmation with details

#### Results Structure

```typescript
interface DeletionResults {
  success: number;        // Count of successful deletions
  failed: number;         // Count of failed deletions
  errors: Array<{         // Detailed error information
    userId: string;
    username: string;
    error: string;
  }>;
  totalProcessed: number; // Total users processed
}
```

#### Display Fields

| Field | Display | Notes |
|-------|---------|-------|
| Success Count | ✅ | Number of successfully deleted users |
| Failed Count | ✅ | Number of failed deletions |
| Error Details | ✅ | Expandable list of errors |
| Processing Time | ✅ | Total time taken for deletion |

#### Error Handling

- **Individual Failures**: Continue processing other users
- **API Errors**: Capture and display error messages
- **Network Errors**: Retry logic (if implemented)
- **Permission Errors**: Clear error message about insufficient permissions

---

## State Management

### Utility State Interface

```typescript
interface DeleteAllUsersState {
  environmentId: string;
  workerToken: string;
  filters: {
    populationId?: string;
    userStatus: 'ALL' | 'ACTIVE' | 'LOCKED' | 'DISABLED';
    usernamePattern?: string;
    emailPattern?: string;
  };
  users: Array<{
    id: string;
    username: string;
    email: string;
    status: string;
    populationId?: string;
    createdAt: string;
    updatedAt: string;
  }>;
  selectedUserIds: Set<string>;
  isLoading: boolean;
  isDeleting: boolean;
  deletionResults: DeletionResults | null;
  error: string | null;
}
```

### Persistence

#### Configuration Storage

- **Location**: `localStorage`
- **Key**: `v8:delete-all-users`
- **Storage Trigger**: On field change (debounced)
- **Restoration**: Auto-restored on component mount

#### User List Storage

- **Location**: Component state (NOT persisted)
- **Reason**: Security - user data should not be persisted
- **Lifespan**: Lost on page refresh

#### Deletion Results Storage

- **Location**: Component state (NOT persisted)
- **Reason**: Results are temporary, not needed across sessions
- **Lifespan**: Lost on page refresh

---

## URL Parameters

### Route

```
/v8/delete-all-users
```

### Query Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `env` | `string` | No | Pre-fill environment ID | `?env=12345678-1234-1234-1234-123456789012` |

---

## Error Handling

### Configuration Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| Missing Environment ID | Required field empty | Enter Environment ID |
| Invalid Worker Token | Token invalid or expired | Generate new worker token |
| Invalid Environment ID | Not a valid UUID | Check format |

### User Loading Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| `unauthorized` | Worker token invalid | Generate new worker token |
| `forbidden` | Insufficient permissions | Check worker token scopes |
| `not_found` | Environment not found | Check Environment ID |
| `server_error` | PingOne server error | Retry or check status |

### Deletion Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| `unauthorized` | Worker token invalid | Generate new worker token |
| `forbidden` | Insufficient permissions | Check worker token has `p1:delete:user` scope |
| `not_found` | User not found | User may have been deleted already |
| `conflict` | User cannot be deleted | Check user dependencies |
| `server_error` | PingOne server error | Retry deletion |

---

## API Endpoints Used

### PingOne Endpoints

1. **List Users**:
   ```
   GET https://api.pingone.com/v1/environments/{environmentId}/users
   ```

2. **Delete User**:
   ```
   DELETE https://api.pingone.com/v1/environments/{environmentId}/users/{userId}
   ```

### Backend Proxy Endpoints

1. **List Users Proxy**:
   ```
   POST /api/pingone/users/list
   Body: {
     environmentId: string,
     workerToken: string,
     populationId?: string,
     status?: string,
     usernamePattern?: string,
     emailPattern?: string
   }
   ```

2. **Delete User Proxy**:
   ```
   DELETE /api/pingone/user/:userId
   Query: {
     environmentId: string,
     workerToken: string
   }
   ```

---

## Testing Checklist

### Configuration Section

- [ ] Environment ID field accepts valid UUID format
- [ ] Worker token field validates JWT format
- [ ] Filter options are optional and work correctly
- [ ] Configuration persists to localStorage
- [ ] Configuration restores on page load

### User List Section

- [ ] "Load Users" button fetches users successfully
- [ ] User list displays all required fields
- [ ] Selection (all/none/individual) works correctly
- [ ] Filtering by status works
- [ ] Filtering by population works
- [ ] Filtering by username pattern works
- [ ] Filtering by email pattern works
- [ ] Empty state shown when no users found

### Deletion Section

- [ ] Confirmation modal appears before deletion
- [ ] Deletion processes users sequentially
- [ ] Success count is accurate
- [ ] Failed count is accurate
- [ ] Error details are displayed correctly
- [ ] Partial failures don't stop entire operation
- [ ] Results are displayed clearly

---

## Implementation Notes

### Key Characteristics

1. **Bulk Operations**: Designed for deleting multiple users efficiently
2. **Safety First**: Requires explicit confirmation before deletion
3. **Error Resilience**: Continues processing even if individual deletions fail
4. **Worker Token**: Uses worker token for all API calls
5. **Filtering**: Supports multiple filter options for targeted deletion

### Security Considerations

1. **Worker Token Security**: Worker token must have `p1:delete:user` scope
2. **Confirmation Required**: Always requires user confirmation
3. **No Persistence**: User data not persisted (security)
4. **Error Messages**: Don't expose sensitive information in errors

### Best Practices

1. ✅ Use worker tokens with appropriate scopes
2. ✅ Always confirm before bulk deletion
3. ✅ Show progress during deletion
4. ✅ Provide detailed error reporting
5. ✅ Allow partial success (continue on individual failures)

---

## References

- [PingOne User Management API](https://apidocs.pingidentity.com/pingone/platform/v1/api/#users)
- [PingOne Worker Token Documentation](https://apidocs.pingidentity.com/pingone/platform/v1/api/#worker-tokens)
