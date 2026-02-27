# PingOne User Cache Sync Utility

This utility provides both a web interface and a command-line interface for syncing PingOne users to a local IndexedDB cache for offline access.

## Web Interface

Access the utility at `/production/user-cache-sync` in the PingOne OAuth Playground application.

### Features
- Sync users from PingOne environment to IndexedDB cache
- View cache statistics and last sync time
- Export cached users to JSON file
- Clear cache data
- Progress tracking during sync operations

## Command Line Interface

The CLI version allows you to run sync operations from the terminal without the web interface.

### Installation

No installation required - run directly with Node.js:

```bash
node sync-users-cli.mjs --help
```

### Usage

```bash
# Sync users for an environment (default max 100 pages = ~10,000 users)
node sync-users-cli.mjs sync <environmentId> [maxPages]

# Get cache information
node sync-users-cli.mjs info <environmentId>

# Export cached users to JSON file
node sync-users-cli.mjs export <environmentId> <outputFile>

# Clear cache for an environment
node sync-users-cli.mjs clear <environmentId>
```

### Environment Variables

Set these environment variables for convenience:

```bash
export PINGONE_WORKER_TOKEN="your-worker-token-here"
export PINGONE_REGION="us"  # or "eu", "au", etc.
```

### Examples

```bash
# Basic sync with environment variable
export PINGONE_WORKER_TOKEN="abc123..."
node sync-users-cli.mjs sync 12345678-1234-1234-1234-123456789012

# Sync with custom page limit
node sync-users-cli.mjs sync 12345678-1234-1234-1234-123456789012 50

# Get cache info
node sync-users-cli.mjs info 12345678-1234-1234-1234-123456789012

# Export to file
node sync-users-cli.mjs export 12345678-1234-1234-1234-123456789012 users.json

# Clear cache
node sync-users-cli.mjs clear 12345678-1234-1234-1234-123456789012

# Using command-line options instead of environment variables
node sync-users-cli.mjs sync 12345678-1234-1234-1234-123456789012 \
  --worker-token "abc123..." \
  --region "eu" \
  --delay 200
```

### CLI Options

- `--worker-token <token>`: PingOne worker token
- `--region <region>`: PingOne region (us, eu, au, etc.)
- `--delay <ms>`: Delay between API calls (default: 100ms)
- `--help, -h`: Show help information

## Technical Details

### Web Version
- React component with hooks for state management
- Uses UserCacheServiceV8 for IndexedDB operations
- UserServiceV8 for PingOne API calls
- Progress tracking and error handling
- Toast notifications for user feedback

### CLI Version
- ES module Node.js script
- Mock implementations for browser-specific features
- Command-line argument parsing
- Progress output to console
- JSON export functionality

### Cache Structure
- IndexedDB database with user and metadata stores
- 30-minute TTL for cached data
- Environment-specific caching
- Automatic cleanup of expired data

## Security Notes

- Worker tokens are required for API access
- Ensure your worker token has appropriate PingOne permissions
- Cache data is stored locally in IndexedDB (web) or simulated (CLI)
- No sensitive data is transmitted except to PingOne APIs