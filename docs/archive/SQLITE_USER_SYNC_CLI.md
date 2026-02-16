# SQLite User Sync - CLI Tool & Architecture

## Overview

Users are now stored in **SQLite database (server-side)** for fast search and lookup. The cache is ONLY used for the search dropdown - all authentication operations use **live PingOne API calls**.

## CLI Command to Fill SQLite

### Basic Command:

```bash
npm run db:seed-users -- \
  --envId b9817c16-9910-4415-b67e-4ac687da74d9 \
  --clientId 66a4686b-9222-4ad2-91b6-03113711c9aa \
  --clientSecret 3D_ksu7589TfcVJm2fqEHjXuhc-DCRfoxEv0urEw8GIK7qiJe72n92WRQ0uaT2tC
```

### With Options:

```bash
npm run db:seed-users -- \
  --envId b9817c16-9910-4415-b67e-4ac687da74d9 \
  --clientId 66a4686b-9222-4ad2-91b6-03113711c9aa \
  --clientSecret 3D_ksu7589TfcVJm2fqEHjXuhc-DCRfoxEv0urEw8GIK7qiJe72n92WRQ0uaT2tC \
  --maxPages 50 \
  --clear
```

### Options:

| Option | Description | Default |
|--------|-------------|---------|
| `--envId` | PingOne Environment ID | **Required** |
| `--clientId` | Worker app Client ID | **Required** |
| `--clientSecret` | Worker app Client Secret | **Required** |
| `--maxPages` | Maximum pages to fetch (200 users/page) | All pages |
| `--batchSize` | Users per batch (max 200) | 200 |
| `--region` | PingOne region: `na`, `eu`, `asia` | `na` |
| `--clear` | Clear existing users first | false |
| `--authMethod` | `client_secret_post` (default) or `client_secret_basic` | `client_secret_post` |
| `--apiUrl` | Base URL of OAuth Playground backend | `http://localhost:3001` |

**Server must be running:** The script saves users to SQLite via the backend. Start the server first (`npm run dev` or `node server.js`), then run `db:seed-users`. If you get `endpoint_not_found`, restart the server so it loads the user API routes.

**Note:** If you get `401 Unsupported authentication method`, your PingOne worker app is likely configured for **Client Secret Post**. Run without `--authMethod` (default is `client_secret_post`) or use `--authMethod client_secret_basic` only if your app uses Client Secret Basic.

### Examples:

```bash
# Sync all users from North America region
npm run db:seed-users -- \
  --envId ENV_ID \
  --clientId CLIENT_ID \
  --clientSecret SECRET

# Sync first 10,000 users (50 pages × 200)
npm run db:seed-users -- \
  --envId ENV_ID \
  --clientId CLIENT_ID \
  --clientSecret SECRET \
  --maxPages 50

# Clear and re-sync (fresh import)
npm run db:seed-users -- \
  --envId ENV_ID \
  --clientId CLIENT_ID \
  --clientSecret SECRET \
  --clear

# Sync from EU region
npm run db:seed-users -- \
  --envId b9817c16-9910-4415-b67e-4ac687da74d9 \
  --clientId CLIENT_ID \
  --clientSecret SECRET \
  --region eu
```

## Pagination

The script follows PingOne’s `_links.next.href` for the next page instead of building URLs from `offset`, so each page is the correct slice of users (no duplicates). It stops when there is no `next` link or when it gets fewer than `batchSize` users. Results are deduplicated by user `id` before saving to SQLite.

## Architecture: Cache vs API

### ✅ Correct Usage:

| Operation | Uses | Why |
|-----------|------|-----|
| **User Search/Dropdown** | SQLite cache | Fast autocomplete across 10,000+ users |
| **User Lookup (once selected)** | PingOne API | Get fresh user ID and details |
| **Device Registration** | PingOne API | Live data, not cached |
| **MFA Challenge** | PingOne API | Real-time authentication |
| **Device Listing** | PingOne API | Current device state |

### ❌ What NOT to do:

- ❌ Don't use cache for user ID lookup during authentication
- ❌ Don't use cache for device operations
- ❌ Don't rely on cache for anything except search/dropdown

## Code Changes

### Fixed: UnifiedMFARegistrationFlowV8.tsx

**Before (WRONG):**
```typescript
// Get userId from the cached users - WRONG!
const user = users.find(u => u.username === username);
if (!user || !user.id) {
	throw new Error(`User not found in cache: ${username}`);
}
const userId = user.id;
```

**After (CORRECT):**
```typescript
// Get userId from PingOne API (not cache) by searching for username
const userLookupResult = await UserServiceV8.listUsers(environmentId, {
	search: username,
	limit: 10,
});

const user = userLookupResult.users.find(
	u => u.username.toLowerCase() === username.toLowerCase()
);

if (!user || !user.id) {
	throw new Error(`User "${username}" not found in PingOne. Please verify the username.`);
}

const userId = user.id;
```

## Files Created/Modified

### New Files:

1. **`scripts/db-seed-users.js`**
   - CLI tool to sync PingOne → SQLite
   - Fetches all users with pagination
   - Saves to SQLite via `/api/users/bulk-insert`

2. **`src/v8/services/sqliteStatsServiceV8.ts`**
   - Fetch SQLite user count
   - Fetch sync metadata
   - 30-second cache for performance

3. **`src/v8/hooks/useSQLiteStats.ts`**
   - React hook for SQLite stats
   - Auto-refresh support

4. **`src/v8/components/SQLiteStatsDisplayV8.tsx`**
   - UI component to show SQLite stats
   - Compact and full view modes

### Modified Files:

1. **`package.json`**
   - Added `db:seed-users` npm script

2. **`src/server/routes/userApiRoutes.js`**
   - Added `/api/users/bulk-insert` endpoint

3. **`src/v8/flows/unified/UnifiedMFARegistrationFlowV8.tsx`**
   - Fixed user lookup to use PingOne API (not cache)
   - Added SQLite stats display
   - Removed IndexedDB cache component

4. **`src/v8/pages/UserCacheSyncUtilityV8.tsx`**
   - Added prominent SQLite stats section
   - Demoted IndexedDB to "legacy" section

5. **`src/v8/hooks/useUserSearch.ts`**
   - Fixed to always return arrays (not objects)

## How to Use

### Step 1: Sync Users to SQLite

```bash
npm run db:seed-users -- \
  --envId YOUR_ENV_ID \
  --clientId YOUR_CLIENT_ID \
  --clientSecret YOUR_SECRET
```

### Step 2: Verify Sync

Visit: https://localhost:3000/production/user-cache-sync

You should see:
- SQLite section showing total users
- Last sync timestamp

### Step 3: Use in MFA Flow

Visit: https://localhost:3000/v8/mfa-unified

1. Enter environment ID
2. Get worker token
3. See SQLite stats (X users available)
4. Search for user in dropdown (uses SQLite)
5. Select user → **PingOne API** fetches user details
6. Select device → **PingOne API** initiates challenge
7. Complete authentication → **PingOne API** verifies

## Troubleshooting

### "User not found in cache" Error

**This error means the code is still trying to use cache instead of PingOne API.**

**Fix:** The code has been updated to call PingOne API directly. Make sure the server is restarted.

### "No users in SQLite"

**Run the CLI tool to sync users:**
```bash
npm run db:seed-users -- --envId YOUR_ENV --clientId YOUR_ID --clientSecret YOUR_SECRET
```

### "Failed to save users"

**Make sure the backend server is running:**
```bash
npm run start:backend
```

The CLI tool needs the server running at `http://localhost:3001`.

---

**Status:** ✅ Complete - SQLite architecture implemented
