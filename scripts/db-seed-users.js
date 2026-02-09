#!/usr/bin/env node

/**
 * @file db-seed-users.js
 * @description CLI tool to sync users from PingOne to SQLite database
 * @version 1.0.0
 * @since 2026-02-02
 *
 * Usage:
 *   npm run db:seed-users -- --envId ENV_ID --clientId CLIENT_ID --clientSecret SECRET
 *
 * Options:
 *   --envId          PingOne Environment ID (required)
 *   --clientId       Worker app Client ID (required)
 *   --clientSecret   Worker app Client Secret (required)
 *   --maxPages       Maximum pages to fetch (default: all)
 *   --batchSize      Users per batch (default: 200, max: 200)
 *   --region         PingOne region: na, eu, asia (default: na)
 *   --clear          Clear existing users for this environment first
 *   --authMethod     client_secret_post (default) or client_secret_basic
 *   --apiUrl         Base URL of OAuth Playground server (default: http://localhost:3001)
 */

import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
const getArg = (name) => {
	const index = args.indexOf(`--${name}`);
	return index !== -1 && args[index + 1] ? args[index + 1] : null;
};
const hasFlag = (name) => args.includes(`--${name}`);

const config = {
	envId: getArg('envId'),
	clientId: getArg('clientId'),
	clientSecret: getArg('clientSecret'),
	maxPages: parseInt(getArg('maxPages'), 10) || null,
	batchSize: Math.min(parseInt(getArg('batchSize'), 10) || 200, 200),
	region: getArg('region') || 'na',
	clear: hasFlag('clear'),
	authMethod:
		(getArg('authMethod') || 'client_secret_post').toLowerCase() === 'client_secret_basic'
			? 'client_secret_basic'
			: 'client_secret_post',
	apiUrl: (getArg('apiUrl') || 'http://localhost:3001').replace(/\/$/, ''),
};

// Validate required args
if (!config.envId || !config.clientId || !config.clientSecret) {
	console.error(`
❌ Missing required arguments

Usage:
  npm run db:seed-users -- --envId ENV_ID --clientId CLIENT_ID --clientSecret SECRET

Required:
  --envId          PingOne Environment ID
  --clientId       Worker app Client ID
  --clientSecret   Worker app Client Secret

Optional:
  --maxPages       Maximum pages to fetch (default: all)
  --batchSize      Users per batch (default: 200, max: 200)
  --region         PingOne region: na, eu, asia (default: na)
  --clear          Clear existing users for this environment first
  --authMethod     client_secret_post (default) or client_secret_basic
  --apiUrl         Server base URL (default: http://localhost:3001)

Example:
  npm run db:seed-users -- \\
    --envId b9817c16-9910-4415-b67e-4ac687da74d9 \\
    --clientId abc123 \\
    --clientSecret xyz789 \\
    --maxPages 50 \\
    --clear
`);
	process.exit(1);
}

console.log(`
🚀 PingOne → SQLite User Sync Tool
====================================
Environment ID: ${config.envId}
Client ID:      ${config.clientId}
Region:         ${config.region}
Batch Size:     ${config.batchSize}
Max Pages:      ${config.maxPages || 'unlimited'}
Clear first:    ${config.clear ? 'YES' : 'NO'}
Auth method:    ${config.authMethod}
API URL:        ${config.apiUrl}
====================================
`);

/**
 * Get worker token from PingOne
 */
async function getWorkerToken() {
	const regionMap = {
		na: 'auth.pingone.com',
		eu: 'auth.pingone.eu',
		asia: 'auth.pingone.asia',
	};

	const authDomain = regionMap[config.region] || regionMap.na;
	const tokenEndpoint = `https://${authDomain}/${config.envId}/as/token`;

	console.log('🔑 Getting worker token from PingOne...');

	const useBasic = config.authMethod === 'client_secret_basic';
	const body = useBasic
		? 'grant_type=client_credentials'
		: new URLSearchParams({
				grant_type: 'client_credentials',
				client_id: config.clientId,
				client_secret: config.clientSecret,
			}).toString();
	const headers = {
		'Content-Type': 'application/x-www-form-urlencoded',
	};
	if (useBasic) {
		headers['Authorization'] =
			`Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')}`;
	}

	try {
		const response = await fetch(tokenEndpoint, {
			method: 'POST',
			headers,
			body,
		});

		if (!response.ok) {
			const error = await response.text();
			throw new Error(`Token request failed: ${response.status} ${error}`);
		}

		const data = await response.json();
		console.log('✅ Worker token obtained');
		return data.access_token;
	} catch (error) {
		console.error('❌ Failed to get worker token:', error.message);
		throw error;
	}
}

/**
 * Fetch all users from PingOne
 */
async function fetchUsersFromPingOne(workerToken) {
	const regionMap = {
		na: 'api.pingone.com',
		eu: 'api.pingone.eu',
		asia: 'api.pingone.asia',
	};

	const apiDomain = regionMap[config.region] || regionMap.na;
	const baseUrl = `https://${apiDomain}/v1/environments/${config.envId}/users`;

	let allUsers = [];
	let nextUrl = `${baseUrl}?limit=${config.batchSize}&offset=0`;
	let hasMore = true;
	let pageNum = 0;

	console.log('📥 Fetching users from PingOne...\n');

	while (hasMore) {
		pageNum++;

		if (config.maxPages && pageNum > config.maxPages) {
			console.log(`\n⚠️  Reached max pages limit (${config.maxPages})`);
			break;
		}

		try {
			const response = await fetch(nextUrl, {
				headers: {
					Authorization: `Bearer ${workerToken}`,
					'Content-Type': 'application/json',
				},
			});

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${await response.text()}`);
			}

			const data = await response.json();
			const users = data._embedded?.users || [];

			if (users.length === 0) {
				hasMore = false;
				break;
			}

			// Extract relevant fields
			const mappedUsers = users.map((u) => ({
				id: u.id,
				username: u.username,
				email: u.email,
				firstName: u.name?.given || null,
				lastName: u.name?.family || null,
				displayName: u.name?.formatted || u.username,
				enabled: u.enabled !== false,
				createdAt: u.createdAt || null,
				updatedAt: u.updatedAt || null,
				lifecycleStatus: u.lifecycle?.status || null,
				populationId: u.population?.id || null,
			}));

			allUsers = allUsers.concat(mappedUsers);

			// Show progress
			process.stdout.write(
				`\r  Page ${pageNum}: ${allUsers.length.toLocaleString()} users fetched...`
			);

			// Use PingOne's next link for the next request; otherwise stop. Following _links.next
			// ensures correct pagination (PingOne may not honor offset in a custom URL).
			const nextHref = data._links?.next?.href;
			const gotFullPage = users.length === config.batchSize;
			hasMore = gotFullPage && !!nextHref;
			if (hasMore) {
				nextUrl = nextHref;
			}

			// Small delay to avoid rate limiting
			if (hasMore) {
				await new Promise((resolve) => setTimeout(resolve, 100));
			}
		} catch (error) {
			console.error(`\n❌ Error fetching page ${pageNum}:`, error.message);
			throw error;
		}
	}

	// Deduplicate by id in case the API ever returned the same user on multiple pages
	const byId = new Map(allUsers.map((u) => [u.id, u]));
	const unique = Array.from(byId.values());
	if (unique.length !== allUsers.length) {
		console.log(
			`\n⚠️  Removed ${(allUsers.length - unique.length).toLocaleString()} duplicate(s) by id`
		);
	}
	console.log(`\n✅ Fetched ${unique.length.toLocaleString()} users from PingOne\n`);
	return unique;
}

/**
 * Save users to SQLite database via API
 */
async function saveUsersToSQLite(users) {
	const bulkInsertUrl = `${config.apiUrl}/api/users/bulk-insert`;
	console.log('💾 Saving users to SQLite database...');

	try {
		const response = await fetch(bulkInsertUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				environmentId: config.envId,
				users,
				clearFirst: config.clear,
			}),
		});

		if (!response.ok) {
			let errBody;
			try {
				errBody = await response.json();
			} catch {
				errBody = {};
			}
			const errMsg = errBody.error || `HTTP ${response.status}`;
			if (errBody.error === 'endpoint_not_found') {
				console.error(`
❌ Failed to save users: ${errMsg}

The server at ${config.apiUrl} does not have the /api/users/bulk-insert route.
• Ensure the OAuth Playground backend is running: npm run dev  (or  node server.js)
• Restart the server if you recently added the user-sync feature.
• If the server runs on a different port, use: --apiUrl http://localhost:PORT
`);
			}
			throw new Error(errMsg);
		}

		const result = await response.json();
		console.log(`✅ Saved ${result.insertedCount} users to SQLite`);

		if (result.updatedCount > 0) {
			console.log(`📝 Updated ${result.updatedCount} existing users`);
		}

		return result;
	} catch (error) {
		if (error.code === 'ECONNREFUSED' || error.cause?.code === 'ECONNREFUSED') {
			console.error(`
❌ Failed to save users: Cannot connect to ${config.apiUrl}

Start the OAuth Playground backend first, then run this script again:
  npm run dev   (or in another terminal: node server.js)

If the server runs on a different host/port, use: --apiUrl http://localhost:PORT
`);
		} else if (!error.message.includes('endpoint_not_found')) {
			console.error('❌ Failed to save users:', error.message);
		}
		throw error;
	}
}

/**
 * Main execution
 */
async function main() {
	const startTime = Date.now();

	try {
		// Step 1: Get worker token
		const workerToken = await getWorkerToken();

		// Step 2: Fetch all users from PingOne
		const users = await fetchUsersFromPingOne(workerToken);

		if (users.length === 0) {
			console.log('⚠️  No users found in environment');
			return;
		}

		// Step 3: Save to SQLite
		await saveUsersToSQLite(users);

		const duration = ((Date.now() - startTime) / 1000).toFixed(1);
		console.log(`
✨ Sync Complete!
  • Total users: ${users.length.toLocaleString()}
  • Duration: ${duration}s
		`);
	} catch (error) {
		console.error('\n❌ Sync failed:', error.message);
		process.exit(1);
	}
}

main();
