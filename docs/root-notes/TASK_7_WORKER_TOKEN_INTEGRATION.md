# Task 7: Integrate Worker Token Manager in Feature Pages

## Overview
Update feature pages to use the centralized `WorkerTokenManager` instead of directly accessing `localStorage` for worker tokens.

## WorkerTokenManager API

### Primary Method
```typescript
import { workerTokenManager } from '../services/workerTokenManager';

// Get a valid worker token (auto-fetches if needed)
const token = await workerTokenManager.getWorkerToken();
// Returns: string (valid access token)
// Throws: Error if credentials not configured or fetch fails
```

### Status Method
```typescript
// Get token status information
const status = await workerTokenManager.getStatus();
// Returns: {
//   hasCredentials: boolean,
//   hasToken: boolean,
//   tokenValid: boolean,
//   tokenExpiresIn?: number (seconds),
//   lastFetchedAt?: number (timestamp)
// }
```

## Pages to Update

### 7.1 PingOne User Profile (`src/pages/PingOneUserProfile.tsx`)

**Current Implementation:**
```typescript
const [accessToken, setAccessToken] = useState(
  searchParams.get('accessToken') || 
  localStorage.getItem('worker_token') || 
  ''
);

// Used in API calls
const profileUrl = `http://localhost:3001/api/pingone/user/${targetUserId}?environmentId=${environmentId}&accessToken=${accessToken}`;
```

**Required Changes:**
1. Remove `accessToken` state variable
2. Import `workerTokenManager`
3. Create async function to get token before API calls
4. Add error handling for token fetch failures
5. Show token status in UI

**Updated Implementation:**
```typescript
import { workerTokenManager } from '../services/workerTokenManager';

// Remove: const [accessToken, setAccessToken] = useState(...)

// Add token status state
const [tokenStatus, setTokenStatus] = useState<{
  hasToken: boolean;
  tokenValid: boolean;
  expiresIn?: number;
} | null>(null);

// Load token status on mount
useEffect(() => {
  const loadTokenStatus = async () => {
    try {
      const status = await workerTokenManager.getStatus();
      setTokenStatus({
        hasToken: status.hasToken,
        tokenValid: status.tokenValid,
        expiresIn: status.tokenExpiresIn
      });
    } catch (error) {
      console.error('Failed to get token status:', error);
    }
  };
  loadTokenStatus();
}, []);

// Update API call function
const fetchUserBundle = useCallback(async (targetUserId: string): Promise<UserDataBundle> => {
  try {
    // Get valid worker token
    const accessToken = await workerTokenManager.getWorkerToken();
    
    const profileUrl = `http://localhost:3001/api/pingone/user/${targetUserId}?environmentId=${environmentId}&accessToken=${accessToken}`;
    
    // ... rest of API call logic
  } catch (error) {
    if (error.message.includes('Worker Token credentials not configured')) {
      setShowWorkerTokenModal(true);
      throw new Error('Please configure Worker Token credentials first');
    }
    throw error;
  }
}, [environmentId]);
```

**UI Changes:**
Add token status indicator:
```typescript
{tokenStatus && (
  <TokenStatus $variant={tokenStatus.tokenValid ? 'valid' : 'expired'}>
    {tokenStatus.tokenValid ? (
      <>
        <FiCheckCircle /> Token valid (expires in {Math.floor(tokenStatus.expiresIn / 60)}m)
      </>
    ) : (
      <>
        <FiAlertTriangle /> Token expired or missing
      </>
    )}
  </TokenStatus>
)}
```

---

### 7.2 Identity Metrics (`src/pages/PingOneIdentityMetrics.tsx`)

**Current Pattern:**
- Likely uses `localStorage.getItem('worker_token')`
- Makes API calls to PingOne metrics endpoints

**Required Changes:**
1. Import `workerTokenManager`
2. Replace direct localStorage access with `workerTokenManager.getWorkerToken()`
3. Add error handling for token failures
4. Show token status in UI
5. Handle token expiration gracefully

**Implementation Pattern:**
```typescript
import { workerTokenManager } from '../services/workerTokenManager';

const fetchMetrics = useCallback(async () => {
  setLoading(true);
  setError(null);
  
  try {
    // Get valid worker token
    const accessToken = await workerTokenManager.getWorkerToken();
    
    // Make API call with token
    const response = await fetch(`/api/pingone/metrics?environmentId=${environmentId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    setMetrics(data);
  } catch (error) {
    if (error.message.includes('Worker Token credentials not configured')) {
      setError('Please configure Worker Token credentials in the Configuration page');
      setShowWorkerTokenModal(true);
    } else {
      setError(error.message);
    }
  } finally {
    setLoading(false);
  }
}, [environmentId]);
```

---

### 7.3 Audit Activities (`src/pages/PingOneAuditActivities.tsx`)

**Current Pattern:**
- Uses worker token for audit log API calls
- Likely has pagination and filtering

**Required Changes:**
1. Import `workerTokenManager`
2. Replace token retrieval with `workerTokenManager.getWorkerToken()`
3. Add retry logic for token expiration during long sessions
4. Show token status
5. Handle token refresh for paginated requests

**Implementation Pattern:**
```typescript
import { workerTokenManager } from '../services/workerTokenManager';

const fetchAuditLogs = useCallback(async (page: number = 1) => {
  try {
    // Get fresh token for each request (handles expiration automatically)
    const accessToken = await workerTokenManager.getWorkerToken();
    
    const response = await fetch(
      `/api/pingone/audit?environmentId=${environmentId}&page=${page}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch audit logs: ${response.statusText}`);
    }
    
    const data = await response.json();
    setAuditLogs(data.logs);
    setTotalPages(data.totalPages);
  } catch (error) {
    handleTokenError(error);
  }
}, [environmentId]);

const handleTokenError = (error: Error) => {
  if (error.message.includes('Worker Token credentials not configured')) {
    setError('Worker Token not configured. Please set up credentials.');
    setShowWorkerTokenModal(true);
  } else if (error.message.includes('expired')) {
    // Token manager should auto-refresh, but handle edge cases
    setError('Token expired. Retrying...');
    setTimeout(() => fetchAuditLogs(), 1000);
  } else {
    setError(error.message);
  }
};
```

---

### 7.4 Bulk User Lookup (`src/pages/BulkUserLookup.tsx`)

**Note:** This page doesn't exist yet based on the file search. It may need to be created or the task refers to a different page.

**If Creating New Page:**
```typescript
import { workerTokenManager } from '../services/workerTokenManager';

const BulkUserLookup: React.FC = () => {
  const [userIds, setUserIds] = useState<string[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const lookupUsers = useCallback(async () => {
    setLoading(true);
    try {
      // Get valid worker token
      const accessToken = await workerTokenManager.getWorkerToken();
      
      // Batch lookup users
      const promises = userIds.map(userId =>
        fetch(`/api/pingone/users/${userId}?environmentId=${environmentId}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }).then(r => r.json())
      );
      
      const results = await Promise.all(promises);
      setResults(results);
    } catch (error) {
      handleTokenError(error);
    } finally {
      setLoading(false);
    }
  }, [userIds, environmentId]);
  
  // ... rest of component
};
```

---

### 7.5 Organization Licensing (`src/pages/OrganizationLicensing.tsx`)

**Current Pattern:**
- Uses worker token for organization/licensing API calls
- May have complex data fetching

**Required Changes:**
1. Import `workerTokenManager`
2. Replace token retrieval
3. Add token status display
4. Handle token errors gracefully

**Implementation Pattern:**
```typescript
import { workerTokenManager } from '../services/workerTokenManager';

const fetchLicensingData = useCallback(async () => {
  setLoading(true);
  setError(null);
  
  try {
    // Get valid worker token
    const accessToken = await workerTokenManager.getWorkerToken();
    
    // Fetch organization data
    const orgResponse = await fetch(
      `/api/pingone/organizations/${organizationId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!orgResponse.ok) {
      throw new Error(`Failed to fetch organization: ${orgResponse.statusText}`);
    }
    
    const orgData = await orgResponse.json();
    
    // Fetch licensing data
    const licenseResponse = await fetch(
      `/api/pingone/organizations/${organizationId}/licenses`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!licenseResponse.ok) {
      throw new Error(`Failed to fetch licenses: ${licenseResponse.statusText}`);
    }
    
    const licenseData = await licenseResponse.json();
    
    setOrganization(orgData);
    setLicenses(licenseData);
  } catch (error) {
    if (error.message.includes('Worker Token credentials not configured')) {
      setError('Please configure Worker Token credentials');
      setShowWorkerTokenModal(true);
    } else {
      setError(error.message);
    }
  } finally {
    setLoading(false);
  }
}, [organizationId]);
```

---

## Common Patterns

### 1. Token Status Display Component
```typescript
const TokenStatusBadge: React.FC = () => {
  const [status, setStatus] = useState<WorkerTokenStatus | null>(null);
  
  useEffect(() => {
    const loadStatus = async () => {
      const tokenStatus = await workerTokenManager.getStatus();
      setStatus(tokenStatus);
    };
    loadStatus();
    
    // Refresh status every minute
    const interval = setInterval(loadStatus, 60000);
    return () => clearInterval(interval);
  }, []);
  
  if (!status) return null;
  
  return (
    <StatusBadge $variant={status.tokenValid ? 'valid' : 'expired'}>
      {status.tokenValid ? (
        <>
          <FiCheckCircle /> Token Valid ({Math.floor(status.tokenExpiresIn! / 60)}m)
        </>
      ) : (
        <>
          <FiAlertTriangle /> Token Expired
        </>
      )}
    </StatusBadge>
  );
};
```

### 2. Error Handling Pattern
```typescript
const handleTokenError = (error: Error) => {
  if (error.message.includes('Worker Token credentials not configured')) {
    v4ToastManager.showError('Worker Token not configured');
    setShowWorkerTokenModal(true);
  } else if (error.message.includes('Failed to fetch Worker Token')) {
    v4ToastManager.showError('Failed to fetch token. Check credentials.');
  } else if (error.message.includes('unauthorized') || error.message.includes('401')) {
    v4ToastManager.showError('Token unauthorized. Generate new token.');
    setShowWorkerTokenModal(true);
  } else {
    v4ToastManager.showError(error.message);
  }
};
```

### 3. Retry Pattern for Long-Running Operations
```typescript
const fetchWithRetry = async (url: string, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Get fresh token for each attempt
      const accessToken = await workerTokenManager.getWorkerToken();
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        return await response.json();
      }
      
      if (response.status === 401 && attempt < maxRetries) {
        // Token might have expired, retry with fresh token
        console.log(`Token expired, retrying (${attempt}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }
      
      throw new Error(`API call failed: ${response.statusText}`);
    } catch (error) {
      if (attempt === maxRetries) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
};
```

---

## Benefits of Migration

1. **Automatic Token Management**: No manual token refresh logic needed
2. **Consistent Error Handling**: Centralized error messages
3. **Token Expiration Handling**: Automatic refresh before expiration
4. **Retry Logic**: Built-in retry with exponential backoff
5. **Cross-Tab Sync**: Token updates broadcast to all tabs
6. **Type Safety**: TypeScript interfaces for all token operations
7. **Logging**: Comprehensive logging for debugging
8. **No Credential Bleeding**: Worker token isolated from flow credentials

---

## Testing Checklist

- [ ] Token fetched successfully on page load
- [ ] Token status displayed correctly
- [ ] API calls work with fetched token
- [ ] Token expiration handled gracefully
- [ ] Error messages shown for missing credentials
- [ ] Worker Token Modal opens when credentials missing
- [ ] Token refresh works during long sessions
- [ ] Multiple API calls use same cached token
- [ ] Token status updates in real-time
- [ ] Cross-tab token updates work correctly

---

## Migration Priority

1. **High Priority** (User-facing features):
   - 7.1 User Profile ✓
   - 7.2 Identity Metrics
   - 7.3 Audit Activities

2. **Medium Priority**:
   - 7.5 Organization Licensing

3. **Low Priority** (May not exist yet):
   - 7.4 Bulk User Lookup

---

## Next Steps

1. Update PingOne User Profile page (7.1)
2. Update Identity Metrics page (7.2)
3. Update Audit Activities page (7.3)
4. Check if Bulk User Lookup exists, create or update (7.4)
5. Update Organization Licensing page (7.5)
6. Test all pages thoroughly
7. Update documentation
8. Mark task 7 as complete
