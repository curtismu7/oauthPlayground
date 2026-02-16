# Enhanced Credentials System Guide

## Overview

The Enhanced Credentials System provides comprehensive multi-storage credentials management with detailed user interaction tracking across IndexedDB, SQLite, and localStorage backends.

## Features

### 🔐 Multi-Storage Backend Support
- **IndexedDB** (Primary): Client-side, high-performance, indexed storage
- **SQLite** (Server): Server-side persistent storage with analytics
- **localStorage** (Fallback): Universal browser storage fallback

### 📊 Comprehensive User Interaction Tracking
- Form field modifications and timing
- Dropdown selections and choices
- Session information and performance metrics
- Validation errors and success tracking
- Storage backend usage analytics

### 🚀 Performance & Reliability
- Automatic storage tier fallback
- Data synchronization across backends
- Performance monitoring and metrics
- Offline support with localStorage fallback
- Circuit breaker pattern for reliability

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   IndexedDB     │    │     SQLite       │    │  localStorage   │
│   (Primary)     │◄──►│   (Server)       │◄──►│   (Fallback)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │ Enhanced Service│
                    │     Layer       │
                    └─────────────────┘
                                 │
                    ┌─────────────────┐
                    │ Tracking Hook   │
                    │   & Components   │
                    └─────────────────┘
```

## Quick Start

### 1. Basic Usage

```typescript
import { EnhancedCredentialsServiceV8 } from './services/enhancedCredentialsServiceV8';

// Save credentials with tracking
const result = await EnhancedCredentialsServiceV8.save(
  'my-environment-id',
  {
    clientId: 'my-client-id',
    clientSecret: 'my-secret',
    issuerUrl: 'https://auth.pingone.com/',
    redirectUri: 'https://localhost:3000/callback',
    scopes: 'openid profile email'
  },
  {
    appName: 'OAuth Playground',
    flowType: 'authorization_code',
    selections: {
      authMethod: 'client_secret_post',
      flowVariant: 'standard'
    }
  }
);

console.log('Saved to:', result.backend); // 'indexeddb' | 'sqlite' | 'localStorage'
```

### 2. Load Credentials

```typescript
const credentials = await EnhancedCredentialsServiceV8.load('my-environment-id');

if (credentials) {
  console.log('Client ID:', credentials.clientId);
  console.log('Interaction History:', credentials.interactionHistory);
  console.log('Storage Backends:', credentials.metadata.storageBackends);
}
```

### 3. Using the Tracking Hook

```typescript
import { useEnhancedCredentialsTracking } from './hooks/useEnhancedCredentialsTracking';

function MyCredentialsForm() {
  const tracking = useEnhancedCredentialsTracking({
    environmentId: 'my-environment-id',
    appName: 'OAuth Playground',
    flowType: 'authorization_code',
    clientId: 'my-client-id',
    autoSave: true,
    autoSaveDelay: 2000,
    trackPerformance: true
  });

  const handleFieldChange = (field: string, value: string) => {
    // Track field interaction automatically
    tracking.trackFieldInteraction(field, 'change', value);
    
    // Auto-save will be triggered
  };

  const handleDropdownChange = (dropdownId: string, value: string, text: string) => {
    tracking.trackDropdownSelection(dropdownId, value, text);
  };

  return (
    <form>
      <input 
        onChange={(e) => handleFieldChange('clientId', e.target.value)}
        onFocus={() => tracking.trackFieldInteraction('clientId', 'focus')}
        onBlur={(e) => tracking.trackFieldInteraction('clientId', 'blur', e.target.value)}
      />
      
      <select 
        onChange={(e) => handleDropdownChange('authMethod', e.target.value, e.target.options[e.target.selectedIndex].text)}
      >
        <option value="client_secret_post">Client Secret Post</option>
        <option value="client_secret_basic">Client Secret Basic</option>
      </select>
      
      <button onClick={() => tracking.saveCredentials(credentials)}>
        Save
      </button>
    </form>
  );
}
```

## Data Structures

### EnhancedCredentials Interface

```typescript
interface EnhancedCredentials {
  // Basic credential fields
  environmentId?: string;
  clientId?: string;
  clientSecret?: string;
  issuerUrl?: string;
  redirectUri?: string;
  postLogoutRedirectUri?: string;
  logoutUri?: string;
  scopes?: string;
  loginHint?: string;
  clientAuthMethod?: 'none' | 'client_secret_basic' | 'client_secret_post' | 'client_secret_jwt' | 'private_key_jwt';
  responseType?: string;
  
  // User interaction tracking
  interactionHistory: UserInteractionData[];
  
  // Metadata
  metadata: {
    lastUpdated: string;
    createdAt: string;
    storageBackends: ('indexeddb' | 'sqlite' | 'localStorage')[];
    syncStatus: 'synced' | 'pending' | 'failed';
    version: number;
  };
}
```

### UserInteractionData Interface

```typescript
interface UserInteractionData {
  timestamp: string;
  username?: string;
  appName: string;
  flowType: string;
  environmentId: string;
  clientId: string;
  issuerUrl?: string;
  redirectUri?: string;
  scopes?: string;
  clientAuthMethod?: string;
  responseType?: string;
  
  // Dropdown selections
  selections: {
    app?: string;
    environment?: string;
    authMethod?: string;
    flowVariant?: string;
    customChoices?: Record<string, string>;
  };
  
  // Form field interactions
  fieldInteractions: {
    modifiedFields: string[];
    validatedFields: string[];
    errorFields: string[];
    fieldTimeSpent?: Record<string, number>;
  };
  
  // Session information
  sessionInfo: {
    sessionStart: string;
    currentStep: string;
    sessionDuration: number;
    userAgent: string;
    pageUrl: string;
  };
  
  // Performance metrics
  performance: {
    loadTime: number;
    saveTime: number;
    storageBackend: 'indexeddb' | 'sqlite' | 'localStorage';
    cacheHit: boolean;
  };
}
```

## Storage Backend Details

### IndexedDB (Primary Storage)

**Advantages:**
- High performance for large datasets
- Supports indexing and complex queries
- Transactional operations
- Client-side only (fast access)

**Usage:**
```typescript
// Direct IndexedDB access (advanced)
import { IndexedDBStorage } from './services/enhancedCredentialsServiceV8';

await IndexedDBStorage.save('env-id', credentials);
const loaded = await IndexedDBStorage.load('env-id');
const all = await IndexedDBStorage.list();
```

### SQLite (Server Storage)

**Advantages:**
- Server-side persistence
- Advanced analytics and reporting
- Cross-device synchronization
- Backup and recovery capabilities

**API Endpoints:**
```typescript
// Health check
GET /api/credentials/sqlite/health

// Save credentials
POST /api/credentials/sqlite/save
{
  "environmentId": "env-id",
  "credentials": { ... },
  "timestamp": "2026-02-15T10:00:00Z"
}

// Load credentials
GET /api/credentials/sqlite/load?environmentId=env-id

// List all credentials
GET /api/credentials/sqlite/list

// Clear credentials
DELETE /api/credentials/sqlite/clear
{
  "environmentId": "env-id"
}

// Get analytics
GET /api/credentials/sqlite/analytics?environmentId=env-id&startDate=2026-02-01&endDate=2026-02-15

// Get storage statistics
GET /api/credentials/sqlite/stats
```

### localStorage (Fallback)

**Advantages:**
- Universal browser support
- No setup required
- Fast for small datasets
- Works offline

**Usage:**
```typescript
// Direct localStorage access (fallback)
import { LocalStorageFallback } from './services/enhancedCredentialsServiceV8';

LocalStorageFallback.save('env-id', credentials);
const loaded = LocalStorageFallback.load('env-id');
const all = LocalStorageFallback.loadAll();
```

## Advanced Features

### 1. Storage Backend Monitoring

```typescript
// Check available backends
const backends = await EnhancedCredentialsServiceV8.getBackendStatus();
console.log('Available backends:', backends);

// Get storage metrics
const metrics = EnhancedCredentialsServiceV8.getMetrics();
console.log('Storage metrics:', metrics);
/*
{
  operations: { reads: 45, writes: 23, errors: 2, syncs: 15 },
  performance: { avgReadTime: 12.5, avgWriteTime: 34.2, avgSyncTime: 156.7, cacheHitRate: 0.78 },
  backendUsage: { indexeddb: 38, sqlite: 15, localStorage: 7 },
  storageUsage: { indexedDB: 1024000, sqlite: 512000, localStorage: 256000 }
}
*/
```

### 2. Data Synchronization

```typescript
// Sync credentials across all backends
const syncResult = await EnhancedCredentialsServiceV8.sync('environment-id');

console.log('Sync result:', syncResult);
/*
{
  success: true,
  syncedBackends: ['indexeddb', 'sqlite'],
  errors: []
}
*/
```

### 3. Migration from Old Format

```typescript
// Migrate from old sharedCredentialsServiceV8 format
const migrationResult = await EnhancedCredentialsServiceV8.migrateFromOldFormat();

console.log('Migration result:', migrationResult);
/*
{
  success: true,
  migrated: 5,
  errors: []
}
*/
```

### 4. Analytics and Reporting

```typescript
// Get interaction analytics from SQLite
const response = await fetch('/api/credentials/sqlite/analytics?' + 
  'environmentId=my-env&startDate=2026-02-01&endDate=2026-02-15');
const analytics = await response.json();

console.log('Analytics:', analytics.analytics);
/*
[
  {
    app_name: "OAuth Playground",
    flow_type: "authorization_code",
    interaction_count: 25,
    avg_save_time: 45.2,
    avg_load_time: 12.8,
    first_interaction: "2026-02-01T10:00:00Z",
    last_interaction: "2026-02-15T15:30:00Z"
  }
]
*/
```

## Integration Examples

### 1. Integrating with Existing Forms

```typescript
// Wrap existing form with tracking
function ExistingCredentialsForm({ initialCredentials }) {
  const tracking = useEnhancedCredentialsTracking({
    environmentId: initialCredentials.environmentId,
    appName: 'My App',
    flowType: 'oauth',
    clientId: initialCredentials.clientId
  });

  // Track existing form changes
  const handleExistingFormChange = useCallback((fieldName, value) => {
    tracking.trackFieldInteraction(fieldName, 'change', value);
    tracking.trackValidation(fieldName, validateField(fieldName, value));
  }, [tracking]);

  return (
    <ExistingFormComponent 
      onFieldChange={handleExistingFormChange}
      onDropdownChange={(id, value, text) => tracking.trackDropdownSelection(id, value, text)}
      onSave={() => tracking.saveCredentials(getFormData())}
    />
  );
}
```

### 2. Server-Side Analytics Dashboard

```typescript
// Analytics dashboard component
function CredentialsAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      const [analyticsResponse, statsResponse] = await Promise.all([
        fetch('/api/credentials/sqlite/analytics'),
        fetch('/api/credentials/sqlite/stats')
      ]);

      setAnalytics(await analyticsResponse.json());
      setStats(await statsResponse.json());
    };

    loadData();
  }, []);

  return (
    <div>
      <h2>Credentials Analytics</h2>
      
      {/* Storage Statistics */}
      <div>
        <h3>Storage Statistics</h3>
        <p>Total Credentials: {stats?.stats?.total_credentials}</p>
        <p>Unique Clients: {stats?.stats?.unique_clients}</p>
        <p>Total Interactions: {stats?.stats?.total_interactions}</p>
        <p>Database Size: {formatBytes(stats?.stats?.databaseSize)}</p>
      </div>

      {/* Interaction Analytics */}
      <div>
        <h3>Interaction Analytics</h3>
        {analytics?.analytics?.map(item => (
          <div key={item.app_name}>
            <h4>{item.app_name} - {item.flow_type}</h4>
            <p>Interactions: {item.interaction_count}</p>
            <p>Avg Save Time: {item.avg_save_time}ms</p>
            <p>Avg Load Time: {item.avg_load_time}ms</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 3. Custom Storage Backend

```typescript
// Implement custom storage backend
class CustomStorageBackend {
  static async save(environmentId: string, credentials: EnhancedCredentials): Promise<boolean> {
    // Custom storage logic
    return true;
  }

  static async load(environmentId: string): Promise<EnhancedCredentials | null> {
    // Custom loading logic
    return null;
  }

  static async isAvailable(): Promise<boolean> {
    // Check availability
    return true;
  }
}

// Register with enhanced service (extend the service)
```

## Security Considerations

### 1. Client Secrets
- Client secrets are stored in IndexedDB and localStorage (client-side)
- For server-side SQLite, secrets are encrypted at rest
- Consider using server-side only storage for highly sensitive credentials

### 2. Data Privacy
- User interaction data includes URLs and user agent strings
- Consider anonymizing data for analytics
- Implement data retention policies

### 3. Access Control
- Implement proper authentication for SQLite API endpoints
- Use environment-specific encryption keys
- Regular security audits of stored data

## Performance Optimization

### 1. IndexedDB Optimization
```typescript
// Use transactions for batch operations
const db = await IndexedDBStorage.initDB();
const transaction = db.transaction(['enhanced_credentials'], 'readwrite');
const store = transaction.objectStore('enhanced_credentials');

// Batch operations
const promises = credentials.map(cred => store.put(cred));
await Promise.all(promises);
```

### 2. Caching Strategy
```typescript
// Implement intelligent caching
const cache = new Map<string, { data: EnhancedCredentials; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCached(environmentId: string): EnhancedCredentials | null {
  const cached = cache.get(environmentId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}
```

### 3. Lazy Loading
```typescript
// Load interaction history on demand
const credentials = await EnhancedCredentialsServiceV8.load(environmentId);
// interactionHistory is loaded separately when needed
const interactions = await loadInteractionHistory(environmentId);
```

## Troubleshooting

### Common Issues

1. **IndexedDB Not Available**
   - Check browser compatibility
   - Ensure sufficient storage quota
   - Handle private browsing mode

2. **SQLite Connection Failed**
   - Verify server is running
   - Check database permissions
   - Ensure SQLite dependencies are installed

3. **localStorage Quota Exceeded**
   - Implement data cleanup
   - Use compression for large datasets
   - Fallback to IndexedDB

### Debug Logging

```typescript
// Enable debug logging
localStorage.setItem('enhanced-credentials-debug', 'true');

// Check storage backend status
const status = await EnhancedCredentialsServiceV8.getBackendStatus();
console.table(status);

// Monitor performance
const metrics = EnhancedCredentialsServiceV8.getMetrics();
console.log('Performance metrics:', metrics);
```

## Migration Guide

### From sharedCredentialsServiceV8

```typescript
// Old format
const oldCredentials = {
  environmentId: 'env-id',
  clientId: 'client-id',
  clientSecret: 'secret',
  issuerUrl: 'https://auth.pingone.com/'
};

// New format with tracking
const newCredentials = {
  ...oldCredentials,
  interactionHistory: [], // Will be populated automatically
  metadata: {
    lastUpdated: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    storageBackends: [],
    syncStatus: 'synced',
    version: 1
  }
};

// Use migration helper
await EnhancedCredentialsServiceV8.migrateFromOldFormat();
```

## Best Practices

1. **Always track user interactions** - Provides valuable analytics
2. **Use auto-save for better UX** - Reduces data loss
3. **Monitor storage metrics** - Identify performance issues
4. **Implement proper error handling** - Graceful fallbacks
5. **Regular data cleanup** - Prevent storage bloat
6. **Security-first approach** - Protect sensitive data
7. **Test all storage backends** - Ensure compatibility

## API Reference

### EnhancedCredentialsServiceV8

#### Methods
- `save(environmentId, credentials, interactionData?)` - Save credentials
- `load(environmentId)` - Load credentials
- `list()` - List all credentials
- `clear(environmentId)` - Clear credentials
- `sync(environmentId)` - Sync across backends
- `getMetrics()` - Get storage metrics
- `getBackendStatus()` - Get backend availability
- `migrateFromOldFormat()` - Migrate from old format

### useEnhancedCredentialsTracking Hook

#### Returns
- `trackFieldInteraction(field, type, value?, validationResult?)` - Track field interaction
- `trackDropdownSelection(dropdownId, value, text, context?)` - Track dropdown selection
- `trackValidation(field, isValid, errorMessage?)` - Track validation
- `trackStepChange(newStep)` - Track step change
- `saveCredentials(credentials, interactionData?)` - Save with tracking
- `loadCredentials()` - Load with performance tracking
- `resetSession()` - Reset tracking session
- `sessionStats` - Current session statistics
- `isLoading` - Loading state
- `saveError` - Last save error
- `lastSaveTime` - Last successful save time

---

This enhanced credentials system provides a comprehensive solution for managing OAuth credentials with detailed user interaction tracking, multi-storage support, and advanced analytics capabilities.
