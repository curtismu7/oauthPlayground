# SQLite Backup Architecture

## Overview

All browser storage (credentials, PKCE codes, config, flow state) is now automatically backed up to **server-side SQLite database** for redundancy and cross-device access.

## Architecture

### Dual Storage Strategy

```
Browser (Fast)              Server (Persistent)
┌──────────────┐           ┌──────────────┐
│              │           │              │
│  IndexedDB   │ ◄────────►│   SQLite     │
│              │  Auto Sync│              │
│              │           │              │
└──────────────┘           └──────────────┘
       ↓                          ↓
   Fast Access            Backup & Restore
```

### What's Backed Up

| Data Type | Browser Storage | Server Backup | Purpose |
|-----------|-----------------|---------------|---------|
| **Credentials** | IndexedDB + localStorage | SQLite | Environment ID, Client ID, Secrets |
| **PKCE Codes** | IndexedDB + sessionStorage | SQLite | Code verifier/challenge |
| **Flow State** | sessionStorage | SQLite | Current step, tokens, etc. |
| **Config** | localStorage | SQLite | User preferences, settings |

### Storage Hierarchy

1. **Primary (Browser):**
   - IndexedDB: Most data (50MB+ capacity)
   - localStorage: Quick access items
   - sessionStorage: Temporary flow data

2. **Backup (Server):**
   - SQLite database: All browser data
   - Automatic sync on every save
   - Restore if browser cleared

3. **Fallback:**
   - Load from IndexedDB (fast)
   - If not found → Load from SQLite (slower)
   - Re-sync to IndexedDB after restore

## New Services

### 1. SQLiteBackupServiceV8 (Client-Side)

**File:** `src/v8/services/sqliteBackupServiceV8.ts`

**Methods:**
- `save(key, environmentId, dataType, data, options)` - Save to SQLite via API
- `load<T>(key, environmentId)` - Load from SQLite
- `delete(key, environmentId)` - Delete backup
- `clearEnvironment(environmentId)` - Clear all backups for env
- `listBackups(environmentId, dataType)` - List all backups

**Example:**
```typescript
// Save credentials to SQLite
await SQLiteBackupServiceV8.save(
  'oauth-authz-v8',
  'env-123',
  'credentials',
  { clientId: 'abc', clientSecret: 'xyz' }
);

// Load credentials from SQLite
const creds = await SQLiteBackupServiceV8.load('oauth-authz-v8', 'env-123');
```

### 2. DualBackupServiceV8 (Unified)

**File:** `src/v8/services/dualBackupServiceV8.ts`

**Methods:**
- `save(key, data, dataType, options)` - Save to BOTH IndexedDB and SQLite
- `load<T>(key, environmentId)` - Load from IndexedDB, fallback to SQLite
- `delete(key, environmentId)` - Delete from both
- `clearEnvironment(environmentId)` - Clear both storages

**Example:**
```typescript
import { DualBackupServiceV8 } from '@/v8/services/dualBackupServiceV8';

// Automatically saves to both IndexedDB and SQLite
await DualBackupServiceV8.save(
  'oauth-authz-v8',
  credentials,
  'credentials',
  { environmentId: 'env-123' }
);

// Tries IndexedDB first, then SQLite if not found
const creds = await DualBackupServiceV8.load('oauth-authz-v8', 'env-123');
```

### 3. BackupDatabaseService (Server-Side)

**File:** `src/server/services/backupDatabaseService.js`

**Database Schema:**
```sql
CREATE TABLE backups (
  key TEXT NOT NULL,
  environment_id TEXT NOT NULL,
  data_type TEXT NOT NULL,
  data TEXT NOT NULL,
  saved_at INTEGER NOT NULL,
  expires_at INTEGER,
  PRIMARY KEY (key, environment_id)
);
```

**Features:**
- Auto-expires old backups (default: 24 hours)
- Cleanup endpoint for maintenance
- Statistics and monitoring

## API Endpoints

### Save Backup
```http
POST /api/backup/save
Content-Type: application/json

{
  "key": "oauth-authz-v8",
  "environmentId": "env-123",
  "dataType": "credentials",
  "data": { "clientId": "abc", "clientSecret": "xyz" },
  "expiresAt": 1738396800000
}
```

### Load Backup
```http
POST /api/backup/load
Content-Type: application/json

{
  "key": "oauth-authz-v8",
  "environmentId": "env-123"
}
```

### List Backups
```http
POST /api/backup/list
Content-Type: application/json

{
  "environmentId": "env-123",
  "dataType": "credentials"  // optional filter
}
```

### Get Stats
```http
GET /api/backup/stats/:environmentId
```

### Cleanup Expired
```http
POST /api/backup/cleanup
```

## Migration Guide

### Before (IndexedDB Only):

```typescript
// Old way - IndexedDB only
import { IndexedDBBackupServiceV8U } from '@/v8u/services/indexedDBBackupServiceV8U';

await IndexedDBBackupServiceV8U.save('key', data, 'credentials');
const data = await IndexedDBBackupServiceV8U.load('key');
```

### After (Dual Storage):

```typescript
// New way - Both IndexedDB and SQLite
import { DualBackupServiceV8 } from '@/v8/services/dualBackupServiceV8';

await DualBackupServiceV8.save('key', data, 'credentials', {
  environmentId: 'env-123'  // Required for SQLite backup
});

const data = await DualBackupServiceV8.load('key', 'env-123');
```

## Usage in Services

### CredentialsServiceV8

**Update saveCredentials:**

```typescript
// Before
localStorage.setItem(`credentials_${flowKey}`, JSON.stringify(credentials));

// After
localStorage.setItem(`credentials_${flowKey}`, JSON.stringify(credentials));
await DualBackupServiceV8.save(
  `credentials_${flowKey}`,
  credentials,
  'credentials',
  { environmentId: credentials.environmentId }
);
```

### PKCEStorageServiceV8U

**Update savePKCECodes:**

```typescript
// Before
await IndexedDBBackupServiceV8U.save(flowKey, codes, 'pkce');

// After
await DualBackupServiceV8.save(
  flowKey,
  codes,
  'pkce',
  { environmentId }
);
```

### MFAConfigurationServiceV8

**Update saveConfiguration:**

```typescript
// Before
localStorage.setItem('mfa_configuration_v8', JSON.stringify(config));

// After
localStorage.setItem('mfa_configuration_v8', JSON.stringify(config));
await DualBackupServiceV8.save(
  'mfa_configuration_v8',
  config,
  'config',
  { environmentId }
);
```

## Benefits

### 1. Redundancy
- Browser cleared? ✅ Restore from SQLite
- Server down? ✅ Use IndexedDB
- Both fail? Show clear error message

### 2. Cross-Device
- Save credentials on laptop
- Access same credentials on desktop
- Shared via server SQLite database

### 3. Automatic
- No manual sync needed
- Saves to both on every write
- Transparent to developers

### 4. Performance
- IndexedDB for fast reads (primary)
- SQLite for backup (secondary)
- Async operations don't block UI

## Monitoring

### Check Backup Status:

```bash
# Browser console
IndexedDBBackupServiceV8U.getStats()

# Returns: { total: 15, byType: { credentials: 5, pkce: 8, config: 2 } }
```

### Check Server Backups:

```bash
curl http://localhost:3001/api/backup/stats/env-123
```

### Cleanup Expired:

```bash
curl -X POST http://localhost:3001/api/backup/cleanup
```

## Security Considerations

### What's Stored:

✅ **Safe to store:**
- Client IDs
- Environment IDs
- Redirect URIs
- Scopes
- Response types
- PKCE codes (temporary)
- Configuration preferences

⚠️ **Sensitive (encrypted):**
- Client secrets (should be encrypted before backup)
- Worker tokens (short TTL)

❌ **Never stored:**
- User passwords
- Access tokens (only in memory/sessionStorage)
- Refresh tokens (sessionStorage only)

### Recommendations:

1. **Encrypt Client Secrets** before saving to SQLite
2. **Use TTL** for temporary data (PKCE: 10 min, tokens: 1 hour)
3. **Regular cleanup** of expired backups
4. **Access control** on backup API endpoints (add auth)

## Database Locations

- **Users DB:** `src/server/data/users.db`
- **Backups DB:** `src/server/data/backups.db`
- **Browser IndexedDB:** Browser dev tools → Application → IndexedDB

## Troubleshooting

### "Failed to backup to SQLite"

**Check:**
1. Is server running? `npm run start:backend`
2. Is SQLite writable? Check permissions on `src/server/data/`
3. Check server logs: `tail -f logs/server.log`

### "Backup not found"

**Recovery:**
1. Check IndexedDB: `IndexedDBBackupServiceV8U.getStats()`
2. Check SQLite: `curl http://localhost:3001/api/backup/stats/ENV_ID`
3. If both empty: User needs to re-enter credentials

### "Credentials lost after browser clear"

✅ **This is now fixed!** Credentials restore from SQLite automatically.

---

**Status:** ✅ SQLite backup architecture implemented
**Version:** 1.0.0
**Date:** 2026-02-02
