#!/usr/bin/env node

/**
 * @file sync-users-cli.mjs
 * @description CLI utility to sync PingOne users to IndexedDB cache
 * @version 1.0.0
 * @since 2026-02-01
 *
 * This is an ES module version that can import the actual service classes
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the database service
import { userDatabaseService } from './src/server/services/userDatabaseService.js';

// Simple argument parsing
const args = process.argv.slice(2);
const command = args[0];

if (command === 'help' || command === '--help' || command === '-h' || !command) {
    console.log(`
🔄 PingOne User Cache Sync CLI Utility

Usage:
  node sync-users-cli.mjs <command> [options]

Commands:
  sync <environmentId> [maxPages]  Sync users for environment (incremental by default)
  clear <environmentId>            Clear cache for environment
  info <environmentId>             Show cache info for environment
  export <environmentId> <file>    Export cached users to JSON file

Options:
  --help, -h                       Show this help
  --worker-token <token>           Worker token (or set PINGONE_WORKER_TOKEN env var)
  --region <region>                PingOne region (default: us)
  --delay <ms>                     Delay between API calls (default: 100ms)
  --incremental                    Perform incremental sync (only changed users) [default]
  --full                           Perform full sync (all users)

Environment Variables:
  PINGONE_WORKER_TOKEN             Worker token for API access
  PINGONE_REGION                   PingOne region (default: us)

Examples:
  node sync-users-cli.mjs sync 12345678-1234-1234-1234-123456789012
  node sync-users-cli.mjs sync 12345678-1234-1234-1234-123456789012 50 --full
  node sync-users-cli.mjs sync 12345678-1234-1234-1234-123456789012 --incremental
  node sync-users-cli.mjs info 12345678-1234-1234-1234-123456789012
  node sync-users-cli.mjs export 12345678-1234-1234-1234-123456789012 users.json
  node sync-users-cli.mjs clear 12345678-1234-1234-1234-123456789012

Note: Incremental sync only fetches users updated since the last sync, making it much faster for regular updates.
`);
    process.exit(0);
}

// Parse arguments
let environmentId = null;
let maxPages = 100;
let workerToken = process.env.PINGONE_WORKER_TOKEN;
let region = process.env.PINGONE_REGION || 'us';
let delayMs = 100;
let incremental = true; // Default to incremental sync
let outputFile = null;

switch (command) {
    case 'sync':
        environmentId = args[1];
        // Check if args[2] is a number (maxPages) or a flag
        if (args[2] && !args[2].startsWith('--')) {
            maxPages = parseInt(args[2]);
        }
        break;
    case 'clear':
        environmentId = args[1];
        break;
    case 'info':
        environmentId = args[1];
        break;
    case 'export':
        environmentId = args[1];
        outputFile = args[2];
        break;
    default:
        console.error(`Unknown command: ${command}`);
        console.log('Run with --help for usage information');
        process.exit(1);
}

// Parse additional options - start from index 2 to catch all flags
for (let i = 2; i < args.length; i++) {
    switch (args[i]) {
        case '--worker-token':
            workerToken = args[++i];
            break;
        case '--region':
            region = args[++i];
            break;
        case '--delay':
            delayMs = parseInt(args[++i]);
            break;
        case '--full':
            incremental = false;
            break;
        case '--incremental':
            incremental = true;
            break;
    }
}

if (!environmentId) {
    console.error('Environment ID is required');
    process.exit(1);
}

// Worker token is not required for info and clear commands (they just read/modify local database)
if (command !== 'info' && command !== 'clear' && !workerToken) {
    console.error('Worker token is required for this command. Set PINGONE_WORKER_TOKEN environment variable or use --worker-token option');
    process.exit(1);
}

// Validate UUID format
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
if (!uuidRegex.test(environmentId)) {
    console.error('Invalid environment ID format. Must be a valid UUID.');
    process.exit(1);
}

console.log(`🔄 PingOne User Cache Sync CLI`);
console.log(`Environment: ${environmentId}`);
console.log(`Region: ${region}`);
console.log(`Command: ${command}`);
console.log('---');

// Mock IndexedDB for Node.js environment
class MockIndexedDB {
    constructor() {
        this.stores = new Map();
    }

    createObjectStore(name) {
        this.stores.set(name, new Map());
        return {
            createIndex: () => {},
            put: (value, key) => this.stores.get(name).set(key, value),
            get: (key) => this.stores.get(name).get(key),
            getAll: () => Array.from(this.stores.get(name).values()),
            delete: (key) => this.stores.get(name).delete(key),
            clear: () => this.stores.get(name).clear()
        };
    }

    transaction(stores, mode) {
        return {
            objectStore: (name) => this.stores.get(name) || this.createObjectStore(name)
        };
    }
}

// Mock UserCacheServiceV8 for CLI usage
class MockUserCacheServiceV8 {
    static getCacheDir() {
        const cacheDir = path.join(__dirname, 'user-cache');
        if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir, { recursive: true });
        }
        return cacheDir;
    }

    static getCacheFile(environmentId) {
        return path.join(this.getCacheDir(), `${environmentId}.json`);
    }

    static async saveUsers(environmentId, users) {
        console.log(`💾 Saving ${users.length} users to cache for environment ${environmentId}`);
        const cacheFile = this.getCacheFile(environmentId);
        const cacheData = {
            environmentId,
            users,
            totalUsers: users.length,
            lastFetchedAt: Date.now(),
            fetchComplete: true
        };

        try {
            fs.writeFileSync(cacheFile, JSON.stringify(cacheData, null, 2));
            return true;
        } catch (error) {
            console.error(`❌ Failed to save cache:`, error.message);
            return false;
        }
    }

    static async getCacheInfo(environmentId) {
        const cacheFile = this.getCacheFile(environmentId);
        if (!fs.existsSync(cacheFile)) {
            return null;
        }

        try {
            const data = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
            return {
                environmentId: data.environmentId,
                totalUsers: data.totalUsers || 0,
                lastFetchedAt: data.lastFetchedAt,
                fetchComplete: data.fetchComplete || false
            };
        } catch (error) {
            console.error(`❌ Failed to read cache info:`, error.message);
            return null;
        }
    }

    static async clearCache(environmentId) {
        console.log(`🗑️ Clearing cache for environment ${environmentId}`);
        const cacheFile = this.getCacheFile(environmentId);
        if (fs.existsSync(cacheFile)) {
            fs.unlinkSync(cacheFile);
        }
        return true;
    }

    static async loadUsers(environmentId) {
        console.log(`📖 Loading users from cache for environment ${environmentId}`);
        const cacheFile = this.getCacheFile(environmentId);
        if (!fs.existsSync(cacheFile)) {
            return [];
        }

        try {
            const data = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
            return data.users || [];
        } catch (error) {
            console.error(`❌ Failed to load users from cache:`, error.message);
            return [];
        }
    }
}

// Mock UserServiceV8 for CLI usage
class MockUserServiceV8 {
    static async fetchUsersPaginated(params) {
        const { environmentId, page = 1, pageSize = 100, workerToken } = params;

        console.log(`🌐 Fetching users page ${page} (size: ${pageSize}) for environment ${environmentId}`);

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 100));

        // Mock user data
        const users = [];
        for (let i = 0; i < pageSize; i++) {
            const userId = ((page - 1) * pageSize) + i + 1;
            users.push({
                id: `user-${userId.toString().padStart(6, '0')}`,
                username: `user${userId}@example.com`,
                name: {
                    given: `User${userId}`,
                    family: 'Example'
                },
                email: `user${userId}@example.com`,
                created: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
                enabled: Math.random() > 0.1 // 90% enabled
            });
        }

        // Simulate pagination end
        const hasMore = page < maxPages && users.length === pageSize;

        return {
            users,
            hasMore,
            totalCount: hasMore ? undefined : (page * pageSize) + Math.floor(Math.random() * 50)
        };
    }
}

/**
 * Real PingOne User Service for CLI
 * Makes direct API calls to PingOne (similar to backend implementation)
 */
class PingOneUserServiceV8 {
    static async fetchUsersPaginated(params) {
        const { environmentId, page = 1, pageSize = 100, workerToken, region = 'us' } = params;

        console.log(`🌐 Fetching users page ${page} (size: ${pageSize}) for environment ${environmentId}`);

        // Clean and validate token
        let cleanToken = String(workerToken).trim();
        cleanToken = cleanToken.replace(/^Bearer\s+/i, '');
        cleanToken = cleanToken.replace(/\s+/g, '').trim();

        if (cleanToken.length === 0) {
            throw new Error('Worker token is empty');
        }

        const tokenParts = cleanToken.split('.');
        if (tokenParts.length !== 3 || tokenParts.some((part) => part.length === 0)) {
            throw new Error('Invalid worker token format');
        }

        // Determine API base URL
        const apiBase = region === 'eu'
            ? 'https://api.pingone.eu'
            : region === 'asia'
                ? 'https://api.pingone.asia'
                : 'https://api.pingone.com';

        // Calculate offset from page
        const offset = (page - 1) * pageSize;

        // Build query parameters
        const queryParams = new URLSearchParams();
        queryParams.append('limit', String(pageSize));
        if (offset > 0) {
            queryParams.append('offset', String(offset));
        }

        const usersEndpoint = `${apiBase}/v1/environments/${environmentId}/users?${queryParams.toString()}`;

        try {
            const response = await fetch(usersEndpoint, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${cleanToken}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(`API request failed: ${errorData.error || response.statusText}`);
            }

            const data = await response.json();

            // Extract users from response
            const users = data._embedded?.users || data.Resources || data.items || [];

            // Transform to our format
            const transformedUsers = users.map(user => ({
                id: user.id,
                username: user.username || user.userName || '',
                email: user.emails?.[0]?.value || '',
                name: user.name || {},
                created: user.created || new Date().toISOString(),
                enabled: user.enabled !== false
            }));

            // Check if there are more pages
            const totalCount = data.count || data.totalResults || 0;
            const hasMore = transformedUsers.length === pageSize && (totalCount === 0 || offset + pageSize < totalCount);

            return {
                users: transformedUsers,
                hasMore,
                totalCount: totalCount || undefined
            };

        } catch (error) {
            console.error(`❌ API call failed:`, error.message);
            throw error;
        }
    }
}

// Execute the command
async function main() {
    try {
        switch (command) {
            case 'sync':
                console.log(`${incremental ? '🔄 Starting incremental sync...' : '🔄 Starting full sync...'}`);
                
                // Worker token is required for sync
                if (!workerToken) {
                    console.error('❌ Worker token is required for sync. Set PINGONE_WORKER_TOKEN or use --worker-token');
                    process.exit(1);
                }
                
                // Call the sync API endpoint
                const syncResponse = await fetch(`http://localhost:3001/api/users/sync/${environmentId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        workerToken,
                        incremental,
                        maxPages,
                        delayMs
                    })
                });

                if (!syncResponse.ok) {
                    const errorData = await syncResponse.json();
                    throw new Error(`Sync API error: ${errorData.error || syncResponse.statusText}`);
                }

                const syncResult = await syncResponse.json();
                console.log(`🎉 ${syncResult.message}`);
                console.log(`📊 ${syncResult.totalUsers} users ${syncResult.incremental ? 'updated' : 'synced'}`);
                break;

            case 'clear':
                userDatabaseService.clearEnvironmentData(environmentId);
                console.log(`🎉 Database cleared successfully!`);
                break;

            case 'info':
                // Get sync status from API
                const statusResponse = await fetch(`http://localhost:3001/api/users/sync-status/${environmentId}`);
                if (!statusResponse.ok) {
                    const errorData = await statusResponse.json();
                    throw new Error(`Status API error: ${errorData.error || statusResponse.statusText}`);
                }
                
                const statusData = await statusResponse.json();
                console.log(`📊 Database Info for ${environmentId}:`);
                console.log(`   Total Users: ${statusData.totalUsers.toLocaleString()}`);
                if (statusData.last_sync_completed) {
                    console.log(`   Last Synced: ${new Date(statusData.last_sync_completed).toLocaleString()}`);
                }
                if (statusData.last_sync_started && statusData.isSyncing) {
                    console.log(`   Sync Started: ${new Date(statusData.last_sync_started).toLocaleString()}`);
                }
                console.log(`   Status: ${statusData.last_sync_status || 'Unknown'}`);
                console.log(`   Currently Syncing: ${statusData.isSyncing ? 'Yes' : 'No'}`);
                break;

            case 'export':
                if (!outputFile) {
                    console.error('Output file is required for export command');
                    process.exit(1);
                }

                const users = userDatabaseService.exportAllUsers(environmentId);
                if (!users || users.length === 0) {
                    console.log(`📭 No users found in database for environment ${environmentId}`);
                    console.log(`💡 Try running 'sync' command first to populate the database`);
                    process.exit(1);
                }

                const exportData = {
                    environmentId,
                    exportedAt: new Date().toISOString(),
                    totalUsers: users.length,
                    users
                };

                fs.writeFileSync(outputFile, JSON.stringify(exportData, null, 2));
                console.log(`📤 Exported ${users.length.toLocaleString()} users to ${outputFile}`);
                console.log(`🎉 Export completed successfully!`);
                break;
        }

    } catch (error) {
        console.error('❌ Operation failed:', error.message);
        process.exit(1);
    }
}

main();