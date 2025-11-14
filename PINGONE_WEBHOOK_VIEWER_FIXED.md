# PingOne Webhook Viewer - Fixed and Complete
<!-- markdownlint-disable -->

## What Was Fixed

### 1. Worker Token Detection Migration
Migrated from complex multi-candidate token resolution to the centralized `getAnyWorkerToken()` utility:

**Before:**
- Used `getValidWorkerToken()` with multiple token candidates
- Complex `ResolvedWorkerToken` type with storage keys
- Manual token resolution logic

**After:**
- Uses `getAnyWorkerToken()` from `src/utils/workerTokenDetection.ts`
- Simplified state management with single `workerToken` string
- Automatic detection of worker tokens from any source

### 2. Removed Unused Imports
- Removed `getValidWorkerToken` and `TokenCheckResult` imports
- Removed `WorkerTokenStatusLabel` component (replaced with simple badge)

### 3. Added Worker Token Event Listener
Added event listener to automatically update worker token when it changes:
```typescript
useEffect(() => {
  const handleTokenUpdate = () => {
    const token = getAnyWorkerToken() || '';
    setWorkerToken(token);
  };
  window.addEventListener('workerTokenUpdated', handleTokenUpdate);
  return () => window.removeEventListener('workerTokenUpdated', handleTokenUpdate);
}, []);
```

## Features

### Real-Time Webhook Monitoring
- Start/Stop monitoring with 3-second polling interval
- Displays webhook events from PingOne API or local cache
- Shows event type, timestamp, status, and full payload

### Webhook Configuration
- Displays webhook URL to configure in PingOne: `{origin}/api/webhooks/pingone`
- Copy URL button for easy configuration
- Instructions for setting up webhooks in PingOne

### Event Filtering
- Filter by status (success, error, pending)
- Filter by event type
- Filter by time range (1h, 24h, 7d, 30d, all time)
- Clear filters button

### Event Management
- Clear webhook history
- Export webhooks to JSON file
- View full event payloads with syntax highlighting

### Status Display
- Environment ID
- Region (NA, EU, CA, AP)
- Event source (PingOne API or local cache)
- Worker token status (detected/not found)

## Backend API Endpoints

### POST /api/webhooks/pingone
Receives webhook events from PingOne and stores them in memory.

### GET /api/webhooks/events
Retrieves webhook events from PingOne API (if worker token provided) or local cache.

Query parameters:
- `limit` - Max events to return (default: 100, max: 1000)
- `offset` - Pagination offset (default: 0)

Headers:
- `x-environment-id` - PingOne environment ID
- `x-region` - PingOne region (na, eu, ca, ap)
- `x-worker-token` - Worker token for API access

### DELETE /api/webhooks/events
Clears all stored webhook events from memory.

## Usage

1. **Prepare Worker Credentials**
   - Use any worker-token modal to store environment ID, region, client ID, and secret
   - Generate worker token with `p1:read:webhooks p1:manage:webhooks` scopes on any flow page

2. **Configure Webhook in PingOne**
   - Copy webhook URL from the page
   - In PingOne console, create a new webhook
   - Paste URL into "Destination URL" field
   - Select events to monitor

3. **Start Monitoring**
   - Click "Start Monitoring" button
   - Page polls for new events every 10 minutes (runs immediately on start)
   - Events appear as they are delivered or retrieved from PingOne

4. **Filter and Export**
   - Use filters to narrow down events
   - Export events to JSON for analysis
   - Clear history when needed

## Technical Details

- **Frontend**: React with TypeScript, styled-components
- **Backend**: Express.js with in-memory storage
- **Storage**: Up to 1000 most recent events (configurable)
- **Polling**: 3-second interval when monitoring is active
- **Worker Token**: Automatically detected from any source using centralized utility

## Status

✅ **Complete and Working**
- All TypeScript errors resolved
- Worker token detection migrated to centralized utility
- Backend API endpoints functional
- Real-time monitoring operational
- Filtering and export features working
