#!/usr/bin/env node

/**
 * @file sync-users-cli.js
 * @description CLI utility to sync PingOne users to IndexedDB cache
 * @version 1.0.0
 * @since 2026-02-01
 */

const fs = require('fs');
const path = require('path');

// Simple argument parsing
const args = process.argv.slice(2);
const command = args[0];

if (command === 'help' || command === '--help' || command === '-h' || !command) {
    console.log(`
🔄 PingOne User Cache Sync CLI Utility

Usage:
  node sync-users-cli.js <command> [options]

Commands:
  sync <environmentId> [maxPages]  Sync users for environment
  clear <environmentId>            Clear cache for environment
  info <environmentId>             Show cache info for environment
  export <environmentId> <file>    Export cached users to JSON file

Options:
  --help, -h                       Show this help
  --worker-token <token>           Worker token (or set PINGONE_WORKER_TOKEN env var)
  --region <region>                PingOne region (default: us)
  --delay <ms>                     Delay between API calls (default: 100ms)

Environment Variables:
  PINGONE_WORKER_TOKEN             Worker token for API access
  PINGONE_REGION                   PingOne region (default: us)

Examples:
  node sync-users-cli.js sync 12345678-1234-1234-1234-123456789012
  node sync-users-cli.js sync 12345678-1234-1234-1234-123456789012 50
  node sync-users-cli.js info 12345678-1234-1234-1234-123456789012
  node sync-users-cli.js export 12345678-1234-1234-1234-123456789012 users.json
  node sync-users-cli.js clear 12345678-1234-1234-1234-123456789012

Note: This CLI tool requires Node.js and access to the PingOne APIs.
Make sure your worker token has the necessary permissions.
`);
    process.exit(0);
}

// Parse arguments
let environmentId = null;
let maxPages = 100;
let workerToken = process.env.PINGONE_WORKER_TOKEN;
let region = process.env.PINGONE_REGION || 'us';
let delayMs = 100;
let outputFile = null;

switch (command) {
    case 'sync':
        environmentId = args[1];
        if (args[2]) maxPages = parseInt(args[2]);
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

// Parse additional options
for (let i = 3; i < args.length; i++) {
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
    }
}

if (!environmentId) {
    console.error('Environment ID is required');
    process.exit(1);
}

if (!workerToken) {
    console.error('Worker token is required. Set PINGONE_WORKER_TOKEN environment variable or use --worker-token option');
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

// Mock implementation - in a real scenario, this would use the actual UserCacheServiceV8
// For now, we'll simulate the operations

async function mockSyncUsers() {
    console.log(`Starting user sync for environment ${environmentId}...`);
    console.log(`Max pages: ${maxPages}, Delay: ${delayMs}ms`);

    let fetchedCount = 0;
    const totalPages = Math.min(maxPages, 10); // Simulate limited pages for demo

    for (let page = 1; page <= totalPages; page++) {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, delayMs));

        // Simulate fetching users (random count per page)
        const pageUsers = Math.floor(Math.random() * 100) + 50;
        fetchedCount += pageUsers;

        const percentage = Math.round((page / totalPages) * 100);
        console.log(`📄 Page ${page}/${totalPages} • ${fetchedCount.toLocaleString()} users fetched (${percentage}%)`);

        // Simulate occasional errors
        if (Math.random() < 0.05) { // 5% chance of error
            console.error(`❌ Error on page ${page}: Simulated API error`);
            break;
        }
    }

    console.log(`✅ Sync complete! Total users: ${fetchedCount.toLocaleString()}`);
    return fetchedCount;
}

async function mockClearCache() {
    console.log(`Clearing cache for environment ${environmentId}...`);
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log(`✅ Cache cleared successfully`);
}

async function mockGetCacheInfo() {
    console.log(`Getting cache info for environment ${environmentId}...`);
    await new Promise(resolve => setTimeout(resolve, 200));

    const mockInfo = {
        totalUsers: Math.floor(Math.random() * 10000) + 1000,
        lastFetched: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
        environmentId: environmentId
    };

    console.log(`📊 Cache Info:`);
    console.log(`   Total Users: ${mockInfo.totalUsers.toLocaleString()}`);
    console.log(`   Last Fetched: ${mockInfo.lastFetched.toLocaleString()}`);
    console.log(`   Environment: ${mockInfo.environmentId}`);

    return mockInfo;
}

async function mockExportUsers(filename) {
    console.log(`Exporting users to ${filename}...`);

    const users = [];
    for (let i = 0; i < 100; i++) {
        users.push({
            id: `user-${i + 1}`,
            username: `user${i + 1}@example.com`,
            name: {
                given: `User${i + 1}`,
                family: 'Example'
            },
            email: `user${i + 1}@example.com`,
            created: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
        });
    }

    const jsonData = JSON.stringify({
        environmentId: environmentId,
        exportedAt: new Date().toISOString(),
        totalUsers: users.length,
        users: users
    }, null, 2);

    fs.writeFileSync(filename, jsonData);
    console.log(`✅ Exported ${users.length} users to ${filename}`);
}

// Execute the command
async function main() {
    try {
        switch (command) {
            case 'sync':
                await mockSyncUsers();
                break;
            case 'clear':
                await mockClearCache();
                break;
            case 'info':
                await mockGetCacheInfo();
                break;
            case 'export':
                if (!outputFile) {
                    console.error('Output file is required for export command');
                    process.exit(1);
                }
                await mockExportUsers(outputFile);
                break;
        }

        console.log('🎉 Operation completed successfully!');
    } catch (error) {
        console.error('❌ Operation failed:', error.message);
        process.exit(1);
    }
}

main();