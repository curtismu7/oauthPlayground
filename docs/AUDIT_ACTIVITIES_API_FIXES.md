# PingOne Audit Activities - API Limitations & Fixes

## Critical API Limitations Discovered

### ❌ NOT SUPPORTED by PingOne Audit API

1. **`result.status` filtering**
   - Error: `Invalid Filter: Attribute 'result.status' is not supported in filter.`
   - Cannot filter by success/failure status
   - Field has been removed from UI

2. **`actors.user.username` filtering**
   - Error: `Invalid Filter: Attribute 'actors.user.username' is not supported in filter.`
   - Cannot filter by username, only by user ID

3. **`actors.user.email` filtering**
   - Cannot filter by email address, only by user ID

4. **`actors.system.id` filtering**
   - Error: `Invalid Filter: Attribute 'actors.system.id' is not supported in filter.`
   - System actor filtering not available

5. **`resources[id eq ...]` filtering**
   - Error: `Cannot invoke textValue() because getComparisonValue() is null`
   - Resource ID filtering causes backend error
   - Field has been removed from UI

6. **Time-based filtering**
   - `createdAt gt` operator not supported
   - Cannot filter by date ranges

7. **OR operator for actors**
   - Error: `Operator 'in' is not supported for attribute 'actors.client.id'`
   - Cannot filter multiple actor types simultaneously

### ✅ SUPPORTED Filters

The PingOne Audit API only supports these filters:
- `action.type eq "VALUE"` - Filter by action type
- `actors.user.id eq "UUID"` - Filter by user ID (UUID only)
- `actors.client.id eq "UUID"` - Filter by client/application ID (UUID only)
- `correlationId eq "VALUE"` - Filter by correlation ID
- `limit` - Number of results to return
- `order` - Sort order (e.g., `createdAt DESC`)

## Implementation Fixes

### Fix 1: Removed `result.status` Filtering
**Before**:
```typescript
if (resultStatus) {
    filters.push(`result.status eq "${resultStatus}"`);
}
```

**After**:
```typescript
// Note: result.status filtering is NOT supported by PingOne Audit API
// Causes error: "Attribute 'result.status' is not supported in filter"
// if (resultStatus) {
//     filters.push(`result.status eq "${resultStatus}"`);
// }
```

UI field and state variable have been removed entirely.

### Fix 2: Removed `resources` Filtering
**Before**:
```typescript
if (resourceId) {
    filters.push(`resources[id eq "${resourceId}"]`);
}
```

**After**:
```typescript
// Note: Resource ID filtering is not supported by PingOne API
// Causes backend error: "Cannot invoke textValue() because getComparisonValue() is null"
// if (resourceId) {
//     filters.push(`resources[id eq "${resourceId}"]`);
// }
```

UI field and state variable have been removed entirely.

### Fix 3: Actor Type Selection
Added dropdown to choose between user or client filtering (one at a time):
```typescript
if (actorId) {
    if (actorType === 'user') {
        filters.push(`actors.user.id eq "${actorId}"`);
    } else {
        filters.push(`actors.client.id eq "${actorId}"`);
    }
}
```

## UI Updates

### Removed Fields (Not Supported by API)
1. **Result Status** - Field removed entirely from UI
2. **Resource ID** - Field removed entirely from UI

### Working Fields
1. **Action Type** - Dropdown with common action types (USER.CREATED, SESSION.CREATED, etc.)
2. **Actor Type** - Choose User or Client (Application)
3. **Actor ID** - UUID input (user or client based on selection)
4. **Correlation ID** - Text input for correlation tracking
5. **Limit** - Number of results (10, 25, 50, 100, 500, 1000)
6. **View Mode** - List activities or get single activity by ID

## Testing Results

✅ API calls now succeed with supported filters
✅ No more 400 Bad Request errors
✅ Users are clearly informed about unsupported features
✅ Educational modal shows accurate filter documentation

## Documentation Updates

Updated educational notes in API request modal to reflect actual API capabilities:
- Removed mentions of result.status filtering
- Removed mentions of resource filtering
- Added warnings about unsupported attributes
- Clarified that only ID-based actor filtering is supported
