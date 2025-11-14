# Design Document: Foolproof Credential Storage System

## Overview

This design creates a robust, conflict-free credential storage system that eliminates credential bleeding between flows while providing shared Worker Token management. The system uses a three-tier storage architecture: in-memory cache, browser storage, and file storage, with clear isolation boundaries and explicit loading strategies.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Application Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Implicit Flow│  │  Auth Code   │  │ Device Flow  │          │
│  │              │  │    Flow      │  │              │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                  │                  │                  │
│         └──────────────────┼──────────────────┘                  │
│                            │                                     │
├────────────────────────────┼─────────────────────────────────────┤
│                            ▼                                     │
│              ┌─────────────────────────────┐                    │
│              │  Credential Storage Manager │                    │
│              │  (New Unified Service)      │                    │
│              └─────────────┬───────────────┘                    │
│                            │                                     │
│         ┌──────────────────┼──────────────────┐                 │
│         │                  │                  │                 │
│         ▼                  ▼                  ▼                 │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │Flow-Specific│  │Worker Token  │  │Worker Access │          │
│  │Credentials  │  │Credentials   │  │Token Manager │          │
│  │Storage      │  │Storage       │  │              │          │
│  └──────┬──────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                  │                  │
├─────────┼─────────────────┼──────────────────┼──────────────────┤
│         │                 │                  │                  │
│         ▼                 ▼                  ▼                  │
│  ┌──────────────────────────────────────────────────┐          │
│  │           Storage Layer (3-Tier)                 │          │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐      │          │
│  │  │ Memory   │  │ Browser  │  │   File   │      │          │
│  │  │  Cache   │  │ Storage  │  │ Storage  │      │          │
│  │  └──────────┘  └──────────┘  └──────────┘      │          │
│  └──────────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

### Storage Hierarchy

```
Priority Order (Read):
1. Memory Cache (fastest, session-only)
2. Browser Storage (fast, survives refresh)
3. File Storage (persistent, survives restart)

Write Strategy:
- Write to all three layers simultaneously
- Continue on partial failure (best-effort)
- Log all write operations for audit
```

## Components and Interfaces

### 1. Credential Storage Manager (New Unified Service)

**File:** `src/services/credentialStorageManager.ts` (NEW)

This is the single source of truth for all credential operations.

```typescript
export interface CredentialStorageConfig {
  enableFileStorage: boolean;
  enableMemoryCache: boolean;
  fileStoragePath: string;
  encryptSecrets: boolean;
}

export interface StorageResult<T> {
  success: boolean;
  data: T | null;
  source: 'memory' | 'browser' | 'file' | 'none';
  error?: string;
  timestamp?: number;
}

export class CredentialStorageManager {
  private memoryCache: Map<string, any> = new Map();
  private config: CredentialStorageConfig;
  
  constructor(config?: Partial<CredentialStorageConfig>) {
    this.config = {
      enableFileStorage: true,
      enableMemoryCache: true,
      fileStoragePath: '~/.pingone-playground/credentials',
      encryptSecrets: true,
      ...config
    };
  }

  /**
   * Load credentials with explicit flow key (no fallback)
   */
  async loadFlowCredentials(flowKey: string): Promise<StorageResult<FlowCredentials>> {
    console.group(`🔍 [CredentialStorageManager] Loading credentials for: ${flowKey}`);
    
    // 1. Check memory cache first
    if (this.config.enableMemoryCache && this.memoryCache.has(flowKey)) {
      const cached = this.memoryCache.get(flowKey);
      console.log(`✅ Found in memory cache`);
      console.groupEnd();
      return {
        success: true,
        data: cached,
        source: 'memory',
        timestamp: Date.now()
      };
    }

    // 2. Check browser storage
    const browserResult = this.loadFromBrowser(flowKey);
    if (browserResult.success && browserResult.data) {
      // Cache in memory
      if (this.config.enableMemoryCache) {
        this.memoryCache.set(flowKey, browserResult.data);
      }
      console.log(`✅ Found in browser storage`);
      console.groupEnd();
      return browserResult;
    }

    // 3. Check file storage
    if (this.config.enableFileStorage) {
      const fileResult = await this.loadFromFile(flowKey);
      if (fileResult.success && fileResult.data) {
        // Cache in memory and browser
        if (this.config.enableMemoryCache) {
          this.memoryCache.set(flowKey, fileResult.data);
        }
        this.saveToBrowser(flowKey, fileResult.data);
        console.log(`✅ Found in file storage`);
        console.groupEnd();
        return fileResult;
      }
    }

    // 4. No credentials found
    console.log(`❌ No credentials found for ${flowKey}`);
    console.groupEnd();
    return {
      success: false,
      data: null,
      source: 'none'
    };
  }

  /**
   * Save credentials to all storage layers
   */
  async saveFlowCredentials(
    flowKey: string, 
    credentials: FlowCredentials
  ): Promise<StorageResult<void>> {
    console.group(`💾 [CredentialStorageManager] Saving credentials for: ${flowKey}`);
    
    const results = {
      memory: false,
      browser: false,
      file: false
    };

    // 1. Save to memory cache
    if (this.config.enableMemoryCache) {
      try {
        this.memoryCache.set(flowKey, credentials);
        results.memory = true;
        console.log(`✅ Saved to memory cache`);
      } catch (error) {
        console.error(`❌ Failed to save to memory:`, error);
      }
    }

    // 2. Save to browser storage
    try {
      this.saveToBrowser(flowKey, credentials);
      results.browser = true;
      console.log(`✅ Saved to browser storage`);
    } catch (error) {
      console.error(`❌ Failed to save to browser:`, error);
    }

    // 3. Save to file storage
    if (this.config.enableFileStorage) {
      try {
        await this.saveToFile(flowKey, credentials);
        results.file = true;
        console.log(`✅ Saved to file storage`);
      } catch (error) {
        console.error(`❌ Failed to save to file:`, error);
      }
    }

    const success = results.browser || results.file;
    console.log(`📊 Save results:`, results);
    console.groupEnd();

    return {
      success,
      data: null,
      source: 'browser',
      timestamp: Date.now()
    };
  }

  /**
   * Clear credentials from all storage layers
   */
  async clearFlowCredentials(flowKey: string): Promise<void> {
    console.log(`🗑️ [CredentialStorageManager] Clearing credentials for: ${flowKey}`);
    
    // Clear from memory
    this.memoryCache.delete(flowKey);
    
    // Clear from browser
    localStorage.removeItem(`flow_credentials_${flowKey}`);
    
    // Clear from file
    if (this.config.enableFileStorage) {
      await this.deleteFile(flowKey);
    }
  }

  // Private helper methods
  private loadFromBrowser(flowKey: string): StorageResult<FlowCredentials> {
    // Implementation
  }

  private saveToBrowser(flowKey: string, credentials: FlowCredentials): void {
    // Implementation
  }

  private async loadFromFile(flowKey: string): Promise<StorageResult<FlowCredentials>> {
    // Implementation
  }

  private async saveToFile(flowKey: string, credentials: FlowCredentials): Promise<void> {
    // Implementation
  }

  private async deleteFile(flowKey: string): Promise<void> {
    // Implementation
  }
}
```

### 2. Worker Token Manager (New Specialized Service)

**File:** `src/services/workerTokenManager.ts` (NEW)

Manages Worker Token credentials AND access tokens with automatic lifecycle management.

```typescript
export interface WorkerTokenCredentials {
  environmentId: string;
  clientId: string;
  clientSecret: string;
  scopes: string[];
  region: 'us' | 'eu' | 'ap' | 'ca';
  tokenEndpoint: string;
}

export interface WorkerAccessToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  // Computed fields
  fetchedAt: number;
  expiresAt: number;
}

export interface WorkerTokenStatus {
  hasCredentials: boolean;
  hasToken: boolean;
  tokenValid: boolean;
  tokenExpiresIn?: number; // seconds
  lastFetchedAt?: number;
}

export class WorkerTokenManager {
  private static instance: WorkerTokenManager;
  private credentialStorage: CredentialStorageManager;
  private tokenCache: WorkerAccessToken | null = null;
  private fetchPromise: Promise<WorkerAccessToken> | null = null;

  private constructor() {
    this.credentialStorage = new CredentialStorageManager();
  }

  static getInstance(): WorkerTokenManager {
    if (!WorkerTokenManager.instance) {
      WorkerTokenManager.instance = new WorkerTokenManager();
    }
    return WorkerTokenManager.instance;
  }

  /**
   * Get a valid Worker Access Token (auto-fetch if needed)
   * This is the primary method that all features should use
   */
  async getWorkerToken(): Promise<string> {
    console.log(`🎫 [WorkerTokenManager] Getting worker token...`);

    // Check if we have a valid cached token
    if (this.tokenCache && this.isTokenValid(this.tokenCache)) {
      console.log(`✅ Using cached token (expires in ${this.getTokenExpiresIn(this.tokenCache)}s)`);
      return this.tokenCache.access_token;
    }

    // Check if we have a stored token
    const storedToken = await this.loadStoredToken();
    if (storedToken && this.isTokenValid(storedToken)) {
      console.log(`✅ Using stored token (expires in ${this.getTokenExpiresIn(storedToken)}s)`);
      this.tokenCache = storedToken;
      return storedToken.access_token;
    }

    // Need to fetch a new token
    console.log(`🔄 Token expired or missing, fetching new token...`);
    return await this.fetchNewToken();
  }

  /**
   * Fetch a new Worker Access Token
   */
  private async fetchNewToken(): Promise<string> {
    // Prevent concurrent fetches
    if (this.fetchPromise) {
      console.log(`⏳ Token fetch already in progress, waiting...`);
      const token = await this.fetchPromise;
      return token.access_token;
    }

    this.fetchPromise = this.performTokenFetch();
    
    try {
      const token = await this.fetchPromise;
      return token.access_token;
    } finally {
      this.fetchPromise = null;
    }
  }

  /**
   * Perform the actual token fetch with retry logic
   */
  private async performTokenFetch(): Promise<WorkerAccessToken> {
    const credentials = await this.loadCredentials();
    if (!credentials) {
      throw new Error('Worker Token credentials not configured');
    }

    let lastError: Error | null = null;
    const maxRetries = 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Token fetch attempt ${attempt}/${maxRetries}`);
        
        const response = await fetch(credentials.tokenEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: credentials.clientId,
            client_secret: credentials.clientSecret,
            scope: credentials.scopes.join(' ')
          })
        });

        if (!response.ok) {
          throw new Error(`Token fetch failed: ${response.status} ${response.statusText}`);
        }

        const tokenData = await response.json();
        const token: WorkerAccessToken = {
          ...tokenData,
          fetchedAt: Date.now(),
          expiresAt: Date.now() + (tokenData.expires_in * 1000)
        };

        // Cache and store the token
        this.tokenCache = token;
        await this.saveToken(token);

        console.log(`✅ Token fetched successfully (expires in ${tokenData.expires_in}s)`);
        
        // Broadcast token refresh event
        this.broadcastTokenRefresh(token);

        return token;

      } catch (error) {
        lastError = error as Error;
        console.error(`❌ Token fetch attempt ${attempt} failed:`, error);
        
        if (attempt < maxRetries) {
          // Exponential backoff: 1s, 2s, 4s
          const delay = Math.pow(2, attempt - 1) * 1000;
          console.log(`⏳ Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(`Failed to fetch Worker Token after ${maxRetries} attempts: ${lastError?.message}`);
  }

  /**
   * Check if a token is valid (not expired)
   */
  private isTokenValid(token: WorkerAccessToken): boolean {
    const now = Date.now();
    const bufferTime = 5 * 60 * 1000; // 5 minutes buffer
    return token.expiresAt > (now + bufferTime);
  }

  /**
   * Get seconds until token expires
   */
  private getTokenExpiresIn(token: WorkerAccessToken): number {
    return Math.floor((token.expiresAt - Date.now()) / 1000);
  }

  /**
   * Get Worker Token status
   */
  async getStatus(): Promise<WorkerTokenStatus> {
    const credentials = await this.loadCredentials();
    const token = this.tokenCache || await this.loadStoredToken();

    return {
      hasCredentials: !!credentials,
      hasToken: !!token,
      tokenValid: token ? this.isTokenValid(token) : false,
      tokenExpiresIn: token ? this.getTokenExpiresIn(token) : undefined,
      lastFetchedAt: token?.fetchedAt
    };
  }

  /**
   * Save Worker Token credentials
   */
  async saveCredentials(credentials: WorkerTokenCredentials): Promise<void> {
    await this.credentialStorage.saveFlowCredentials('worker-token-credentials', credentials);
    
    // Invalidate cached token when credentials change
    this.tokenCache = null;
    await this.clearStoredToken();
    
    console.log(`✅ Worker Token credentials saved`);
  }

  /**
   * Load Worker Token credentials
   */
  async loadCredentials(): Promise<WorkerTokenCredentials | null> {
    const result = await this.credentialStorage.loadFlowCredentials('worker-token-credentials');
    return result.data as WorkerTokenCredentials | null;
  }

  /**
   * Manually refresh the Worker Token
   */
  async refreshToken(): Promise<string> {
    console.log(`🔄 [WorkerTokenManager] Manual token refresh requested`);
    this.tokenCache = null;
    return await this.fetchNewToken();
  }

  /**
   * Invalidate the current token
   */
  invalidateToken(): void {
    console.log(`🗑️ [WorkerTokenManager] Invalidating token`);
    this.tokenCache = null;
  }

  // Private storage methods
  private async saveToken(token: WorkerAccessToken): Promise<void> {
    await this.credentialStorage.saveFlowCredentials('worker-access-token', token);
  }

  private async loadStoredToken(): Promise<WorkerAccessToken | null> {
    const result = await this.credentialStorage.loadFlowCredentials('worker-access-token');
    return result.data as WorkerAccessToken | null;
  }

  private async clearStoredToken(): Promise<void> {
    await this.credentialStorage.clearFlowCredentials('worker-access-token');
  }

  private broadcastTokenRefresh(token: WorkerAccessToken): void {
    window.dispatchEvent(new CustomEvent('worker-token-refreshed', {
      detail: {
        expiresAt: token.expiresAt,
        expiresIn: this.getTokenExpiresIn(token)
      }
    }));
  }
}

// Export singleton instance
export const workerTokenManager = WorkerTokenManager.getInstance();
```

### 3. Flow Credentials Interface

**File:** `src/types/credentials.ts` (NEW)

```typescript
export interface FlowCredentials {
  environmentId: string;
  clientId: string;
  clientSecret?: string;
  redirectUri?: string;
  scopes?: string[];
  
  // Optional endpoints (from discovery)
  authorizationEndpoint?: string;
  tokenEndpoint?: string;
  userInfoEndpoint?: string;
  endSessionEndpoint?: string;
  
  // Flow-specific settings
  clientAuthMethod?: string;
  responseType?: string;
  responseMode?: string;
  
  // Metadata
  savedAt?: number;
  lastUsedAt?: number;
}

export interface CredentialMetadata {
  flowKey: string;
  hasCredentials: boolean;
  savedAt?: number;
  lastUsedAt?: number;
  source?: 'memory' | 'browser' | 'file';
}
```

## Data Models

### Storage Key Patterns

```typescript
// Flow-specific credentials
const FLOW_CREDENTIAL_KEY = (flowKey: string) => `flow_credentials_${flowKey}`;

// Examples:
// - flow_credentials_oauth-implicit-v7
// - flow_credentials_oauth-authorization-code-v7
// - flow_credentials_device-authorization-v7

// Worker Token credentials (shared)
const WORKER_CREDENTIALS_KEY = 'worker_token_credentials';

// Worker Access Token (shared)
const WORKER_TOKEN_KEY = 'worker_access_token';

// File paths
const FLOW_CREDENTIAL_FILE = (flowKey: string) => 
  `~/.pingone-playground/credentials/${flowKey}.json`;

const WORKER_CREDENTIALS_FILE = 
  `~/.pingone-playground/credentials/worker-token-credentials.json`;

const WORKER_TOKEN_FILE = 
  `~/.pingone-playground/credentials/worker-access-token.json`;
```

### Storage Schema

```typescript
// Browser Storage (localStorage)
interface BrowserStorageSchema {
  // Flow-specific
  'flow_credentials_oauth-implicit-v7': FlowCredentials;
  'flow_credentials_oauth-authorization-code-v7': FlowCredentials;
  // ... one key per flow
  
  // Worker Token (shared)
  'worker_token_credentials': WorkerTokenCredentials;
  'worker_access_token': WorkerAccessToken;
}

// File Storage
interface FileStorageSchema {
  // Flow-specific files
  '~/.pingone-playground/credentials/oauth-implicit-v7.json': FlowCredentials;
  '~/.pingone-playground/credentials/oauth-authorization-code-v7.json': FlowCredentials;
  // ... one file per flow
  
  // Worker Token files (shared)
  '~/.pingone-playground/credentials/worker-token-credentials.json': WorkerTokenCredentials;
  '~/.pingone-playground/credentials/worker-access-token.json': WorkerAccessToken;
}
```

## Error Handling

### Credential Load Errors

```typescript
enum CredentialLoadError {
  NOT_FOUND = 'CREDENTIALS_NOT_FOUND',
  PARSE_ERROR = 'CREDENTIALS_PARSE_ERROR',
  FILE_READ_ERROR = 'FILE_READ_ERROR',
  PERMISSION_DENIED = 'PERMISSION_DENIED'
}

interface CredentialError {
  code: CredentialLoadError;
  message: string;
  flowKey: string;
  source: 'browser' | 'file';
  recoverable: boolean;
}
```

### Worker Token Errors

```typescript
enum WorkerTokenError {
  NO_CREDENTIALS = 'NO_WORKER_CREDENTIALS',
  INVALID_CREDENTIALS = 'INVALID_WORKER_CREDENTIALS',
  FETCH_FAILED = 'TOKEN_FETCH_FAILED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED'
}

interface WorkerTokenErrorDetails {
  code: WorkerTokenError;
  message: string;
  retryable: boolean;
  retryAfter?: number; // seconds
}
```

## Testing Strategy

### Unit Tests

1. **CredentialStorageManager Tests**
   ```typescript
   describe('CredentialStorageManager', () => {
     test('loads from memory cache first', async () => {
       // Test memory cache priority
     });

     test('falls back to browser storage', async () => {
       // Test browser storage fallback
     });

     test('falls back to file storage', async () => {
       // Test file storage fallback
     });

     test('saves to all storage layers', async () => {
       // Test multi-layer save
     });

     test('handles partial save failures gracefully', async () => {
       // Test resilience
     });
   });
   ```

2. **WorkerTokenManager Tests**
   ```typescript
   describe('WorkerTokenManager', () => {
     test('returns cached token if valid', async () => {
       // Test cache hit
     });

     test('fetches new token if expired', async () => {
       // Test auto-refresh
     });

     test('retries on fetch failure', async () => {
       // Test retry logic
     });

     test('prevents concurrent fetches', async () => {
       // Test deduplication
     });

     test('invalidates token on credential change', async () => {
       // Test invalidation
     });
   });
   ```

### Integration Tests

1. **Flow Isolation Tests**
   - Save credentials in Flow A
   - Navigate to Flow B
   - Verify Flow B has no credentials
   - Return to Flow A
   - Verify Flow A credentials intact

2. **Worker Token Sharing Tests**
   - Save Worker Token credentials
   - Use from multiple flows simultaneously
   - Verify all flows get same token
   - Refresh token
   - Verify all flows get new token

3. **Persistence Tests**
   - Save credentials
   - Clear browser storage
   - Reload app
   - Verify credentials loaded from file

## Implementation Notes

### Phase 1: Core Infrastructure
1. Create `CredentialStorageManager` service
2. Create `WorkerTokenManager` service
3. Implement 3-tier storage (memory, browser, file)
4. Add comprehensive logging

### Phase 2: Migration
1. Create migration utility
2. Detect old credential storage
3. Migrate to new system
4. Backup old credentials
5. Provide rollback option

### Phase 3: Integration
1. Update all flows to use new system
2. Remove old credential services
3. Update UI components
4. Add credential management page

### Phase 4: Polish
1. Add credential export/import
2. Add credential validation UI
3. Add Worker Token status indicator
4. Performance optimization

## Design Decisions

### Why 3-Tier Storage?
- **Memory**: Fastest access, no I/O overhead
- **Browser**: Survives page refresh, good for active sessions
- **File**: Survives browser restart, true persistence

### Why Explicit Loading (No Fallback)?
- Prevents mysterious credential sources
- Makes debugging easier
- Forces intentional credential management
- Eliminates credential bleeding

### Why Singleton for Worker Token?
- Ensures single source of truth
- Prevents duplicate token fetches
- Enables global token lifecycle management
- Simplifies cross-component usage

### Why Automatic Token Refresh?
- Better developer experience
- Reduces manual intervention
- Prevents token expiration errors
- Maintains app reliability

## Security Considerations

1. **Client Secret Encryption**
   - Encrypt before storing in browser
   - Use Web Crypto API
   - Key derived from session

2. **File Permissions**
   - Set 0600 (owner read/write only)
   - Verify permissions on read
   - Warn if permissions too open

3. **Logging**
   - Never log full secrets
   - Only log first/last 4 characters
   - Sanitize error messages

4. **Token Exposure**
   - Keep tokens in memory when possible
   - Clear tokens on logout
   - Implement token rotation
