# Task 7 Implementation Status

## Overview
Task 7 requires integrating WorkerTokenManager into 5 feature pages that currently use direct localStorage access for worker tokens.

## Current Status

### ✅ Completed
- Enhanced CredentialStorageManager with extended capabilities
- Created comprehensive documentation (TASK_7_WORKER_TOKEN_INTEGRATION.md)
- Analyzed all 5 pages and documented their current token usage patterns

### ⏳ In Progress
- Actual code updates for the 5 pages

## Pages Analysis

### 7.1 PingOne User Profile (`src/pages/PingOneUserProfile.tsx`) ✅ ANALYZED
**Current Implementation:**
```typescript
const [accessToken, setAccessToken] = useState(
  searchParams.get('accessToken') || 
  localStorage.getItem('worker_token') || 
  ''
);
```

**Lines to Update:** ~730, ~1228
**Complexity:** HIGH (2607 lines, multiple API calls)
**Token Usage:** Direct localStorage access, used in multiple fetch calls

---

### 7.2 Identity Metrics (`src/pages/PingOneIdentityMetrics.tsx`) ✅ ANALYZED
**Current Implementation:**
```typescript
const effectiveWorkerToken = localStorage.getItem('worker_token_metrics') || '';
```

**Lines to Update:** ~480, ~520, ~560
**Complexity:** MEDIUM (1062 lines)
**Token Usage:** Uses metrics-specific token key `worker_token_metrics`
**Special Note:** Has its own token modal and management, uses region-specific API URLs

**Key Functions:**
- `handleGetWorkerToken()` - Opens worker token modal
- `handleClearWorkerToken()` - Clears metrics token
- `executeApiCall()` - Makes API call with token

---

### 7.3 Audit Activities (`src/pages/PingOneAuditActivities.tsx`) ⏳ TO ANALYZE
**Expected Pattern:**
- Uses worker token for audit log API calls
- Likely has pagination
- May have filtering/search functionality

**Required Changes:**
1. Import `workerTokenManager`
2. Replace `localStorage.getItem('worker_token')` with `await workerTokenManager.getWorkerToken()`
3. Add error handling for token failures
4. Add token status display

---

### 7.4 Bulk User Lookup ⚠️ DOES NOT EXIST
**Status:** This page doesn't exist in the codebase
**Action:** Either:
- Skip this subtask (mark as N/A)
- Create the page from scratch
- Identify if it refers to a different page

---

### 7.5 Organization Licensing (`src/pages/OrganizationLicensing.tsx`) ⏳ TO ANALYZE
**Expected Pattern:**
- Uses worker token for organization/licensing API calls
- May have complex data fetching

**Required Changes:**
1. Import `workerTokenManager`
2. Replace token retrieval
3. Add token status display
4. Handle token errors gracefully

---

## Implementation Challenges

### 1. Metrics-Specific Token Storage
Identity Metrics uses `worker_token_metrics` instead of `worker_token`. This suggests:
- It may need its own token separate from the global worker token
- OR it should be migrated to use the global WorkerTokenManager

**Decision Needed:** Should Identity Metrics:
- A) Use the global WorkerTokenManager (recommended for consistency)
- B) Keep its own token storage but use WorkerTokenManager pattern

### 2. Large File Sizes
- PingOneUserProfile.tsx: 2607 lines
- PingOneIdentityMetrics.tsx: 1062 lines

These files are complex with multiple API calls and state management.

### 3. Different Token Storage Keys
Found different localStorage keys:
- `worker_token` - Global worker token
- `worker_token_metrics` - Metrics-specific token
- `worker_token_expires_at` - Token expiration
- `worker_credentials` - Worker credentials

**Recommendation:** Consolidate to use WorkerTokenManager which handles all of this internally.

---

## Recommended Implementation Approach

### Phase 1: Update Identity Metrics (Simplest)
1. Import `workerTokenManager`
2. Replace `localStorage.getItem('worker_token_metrics')` with `await workerTokenManager.getWorkerToken()`
3. Remove custom token expiration logic (WorkerTokenManager handles this)
4. Update `handleGetWorkerToken()` to use WorkerTokenManager
5. Test thoroughly

### Phase 2: Update User Profile
1. Remove `accessToken` state variable
2. Import `workerTokenManager`
3. Update `fetchUserBundle()` to get token via WorkerTokenManager
4. Add token status display
5. Update error handling
6. Test all API calls

### Phase 3: Update Audit Activities
1. Analyze current implementation
2. Follow same pattern as Identity Metrics
3. Test pagination with token refresh

### Phase 4: Update Organization Licensing
1. Analyze current implementation
2. Follow same pattern
3. Test complex data fetching scenarios

### Phase 5: Handle Bulk User Lookup
1. Determine if page exists or needs creation
2. If creating, use WorkerTokenManager from the start
3. If skipping, document why

---

## Code Template for Updates

### Step 1: Add Import
```typescript
import { workerTokenManager } from '../services/workerTokenManager';
```

### Step 2: Remove Direct localStorage Access
```typescript
// REMOVE:
const [accessToken, setAccessToken] = useState(
  localStorage.getItem('worker_token') || ''
);

// REMOVE:
const effectiveWorkerToken = localStorage.getItem('worker_token_metrics') || '';
```

### Step 3: Update API Call Functions
```typescript
// BEFORE:
const fetchData = async () => {
  const token = localStorage.getItem('worker_token');
  if (!token) {
    setError('No token found');
    return;
  }
  
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  // ...
};

// AFTER:
const fetchData = async () => {
  try {
    // Get valid token (auto-refreshes if needed)
    const token = await workerTokenManager.getWorkerToken();
    
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    // ...
  } catch (error) {
    if (error.message.includes('Worker Token credentials not configured')) {
      setError('Please configure Worker Token credentials');
      setShowWorkerTokenModal(true);
    } else {
      setError(error.message);
    }
  }
};
```

### Step 4: Add Token Status Display (Optional)
```typescript
const [tokenStatus, setTokenStatus] = useState<{
  hasToken: boolean;
  tokenValid: boolean;
  expiresIn?: number;
} | null>(null);

useEffect(() => {
  const loadStatus = async () => {
    const status = await workerTokenManager.getStatus();
    setTokenStatus({
      hasToken: status.hasToken,
      tokenValid: status.tokenValid,
      expiresIn: status.tokenExpiresIn
    });
  };
  loadStatus();
  
  // Refresh every minute
  const interval = setInterval(loadStatus, 60000);
  return () => clearInterval(interval);
}, []);

// In JSX:
{tokenStatus && tokenStatus.tokenValid && (
  <TokenBadge>
    <FiCheckCircle /> Token valid ({Math.floor(tokenStatus.expiresIn! / 60)}m)
  </TokenBadge>
)}
```

---

## Testing Checklist

For each updated page:

- [ ] Page loads without errors
- [ ] Token fetched successfully on first API call
- [ ] API calls work with fetched token
- [ ] Token expiration handled gracefully (auto-refresh)
- [ ] Error shown when credentials missing
- [ ] Worker Token Modal opens when needed
- [ ] Token status displayed correctly (if implemented)
- [ ] Multiple API calls use same cached token
- [ ] Token refresh works during long sessions
- [ ] No console errors related to token management

---

## Estimated Effort

| Page | Lines | Complexity | Estimated Time |
|------|-------|------------|----------------|
| Identity Metrics | 1062 | Medium | 2-3 hours |
| User Profile | 2607 | High | 4-5 hours |
| Audit Activities | TBD | Medium | 2-3 hours |
| Organization Licensing | TBD | Medium | 2-3 hours |
| Bulk User Lookup | N/A | N/A | Skip or 4-6 hours (new page) |
| **Total** | | | **10-20 hours** |

---

## Next Steps

1. **Immediate:** Update Identity Metrics (simplest, good test case)
2. **Short-term:** Update User Profile (most complex, highest impact)
3. **Medium-term:** Update Audit Activities and Organization Licensing
4. **Long-term:** Decide on Bulk User Lookup (skip or create)

---

## Benefits After Completion

1. ✅ Centralized token management
2. ✅ Automatic token refresh
3. ✅ Consistent error handling
4. ✅ Better user experience (no manual token refresh)
5. ✅ Reduced code duplication
6. ✅ Type-safe token operations
7. ✅ Comprehensive logging for debugging
8. ✅ Cross-tab token synchronization

---

## Documentation References

- Full implementation guide: `TASK_7_WORKER_TOKEN_INTEGRATION.md`
- Storage enhancements: `CREDENTIAL_STORAGE_ENHANCEMENT.md`
- WorkerTokenManager API: `src/services/workerTokenManager.ts`
- Design document: `.kiro/specs/credential-storage-redesign/design.md`
