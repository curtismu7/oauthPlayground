/**
 * @file userStore.js
 * @module server/lmdb
 * @description LMDB-based user storage with in-memory search
 * @version 1.0.0
 */

import { getDb } from './openEnv.js';

const MODULE_TAG = '[👥 USER-STORE]';

/**
 * Save or update users for an environment
 * @param {string} environmentId
 * @param {Array} users - Array of user objects
 */
export function saveUsers(environmentId, users) {
	const usersDb = getDb('users');

	// Store (upsert) each user individually. The `users` DB is the single source of
	// truth; searchUsers() reads from it directly, so there is no separate search
	// index to keep in sync — that index used to be overwritten with only the current
	// batch, dropping every previously-synced user on incremental / >500-user syncs.
	for (const user of users) {
		const key = `${environmentId}|${user.id}`;
		const userData = {
			id: user.id,
			username: user.username,
			email: user.email || null,
			name: {
				given: user.name?.given || null,
				family: user.name?.family || null,
				formatted: user.name?.formatted || user.username,
			},
			userType: user.userType || null,
			lifecycle: { status: user.lifecycle?.status || null },
			createdAt: user.createdAt || null,
			updatedAt: user.updatedAt || new Date().toISOString(),
			lastSignOn: user.lastSignOn?.at ? { at: user.lastSignOn.at } : null,
		};

		usersDb.put(key, userData);
	}

	// Update metadata
	const metadataDb = getDb('user_metadata');
	const metaKey = environmentId;
	const current = metadataDb.get(metaKey) || {};
	const totalUsers = getUserCount(environmentId);

	metadataDb.put(metaKey, {
		...current,
		total_users: totalUsers,
		last_sync_completed: new Date().toISOString(),
		last_sync_status: 'success',
	});
}

/**
 * Search users for an environment
 * Client-side search implementation: filter all users in-memory
 * @param {string} environmentId
 * @param {string} query - Search query
 * @param {number} limit - Results limit
 * @param {number} offset - Results offset
 * @returns {Array} Matching user objects
 */
export function searchUsers(environmentId, query, limit = 100, offset = 0) {
	if (!query || !query.trim()) {
		return getRecentUsers(environmentId, limit);
	}

	// Read straight from the users DB (single source of truth) rather than a
	// separate, drift-prone index copy.
	const usersDb = getDb('users');
	const prefix = `${environmentId}|`;
	const allUsers = [];
	for (const [key, value] of usersDb.entries()) {
		if (key.startsWith(prefix) && key !== prefix) {
			allUsers.push(value);
		}
	}

	const queryLower = query.toLowerCase();

	// Filter by username, email, first_name, last_name, display_name (case-insensitive)
	const filtered = allUsers.filter((user) => {
		const username = (user.username || '').toLowerCase();
		const email = (user.email || '').toLowerCase();
		const givenName = (user.name?.given || '').toLowerCase();
		const familyName = (user.name?.family || '').toLowerCase();
		const displayName = (user.name?.formatted || '').toLowerCase();

		return (
			username.includes(queryLower) ||
			email.includes(queryLower) ||
			givenName.includes(queryLower) ||
			familyName.includes(queryLower) ||
			displayName.includes(queryLower)
		);
	});

	// Sort by username
	filtered.sort((a, b) => (a.username || '').localeCompare(b.username || ''));

	// Apply pagination
	return filtered.slice(offset, offset + limit);
}

/**
 * Get recent users for an environment
 * @param {string} environmentId
 * @param {number} limit - Number of users to return
 * @returns {Array} User objects
 */
export function getRecentUsers(environmentId, limit = 100) {
	const usersDb = getDb('users');
	const recentUsers = [];

	// Iterate through all keys starting with environmentId|
	const prefix = `${environmentId}|`;
	for (const [key, value] of usersDb.entries()) {
		if (key.startsWith(prefix) && key !== prefix) {
			recentUsers.push(value);
		}
	}

	// Sort by updatedAt descending (most recent first)
	recentUsers.sort(
		(a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)
	);

	return recentUsers.slice(0, limit);
}

/**
 * Get total user count for an environment
 * @param {string} environmentId
 * @returns {number} Total user count
 */
export function getUserCount(environmentId) {
	const usersDb = getDb('users');
	let count = 0;

	// Iterate through all keys starting with environmentId|
	const prefix = `${environmentId}|`;
	for (const key of usersDb.keys()) {
		if (key.startsWith(prefix) && key !== prefix) {
			count++;
		}
	}

	return count;
}

/**
 * Get sync metadata for an environment
 * @param {string} environmentId
 * @returns {Object} Metadata object
 */
export function getSyncMetadata(environmentId) {
	const metadataDb = getDb('user_metadata');
	const metaKey = environmentId;

	return (
		metadataDb.get(metaKey) || {
			total_users: 0,
			last_sync_completed: null,
			last_sync_status: null,
			sync_in_progress: 0,
		}
	);
}

/**
 * Update sync metadata for an environment
 * @param {string} environmentId
 * @param {Object} updates - Partial metadata updates
 */
export function updateSyncMetadata(environmentId, updates) {
	const metadataDb = getDb('user_metadata');
	const metaKey = environmentId;
	const current = getSyncMetadata(environmentId);

	const updated = {
		...current,
		...updates,
	};

	metadataDb.put(metaKey, updated);
}

/**
 * Base URL for the server's own PingOne proxy endpoint. Overridable via env so the
 * self-call isn't pinned to https://localhost:3001 (which fails on a self-signed
 * cert in HTTPS dev mode).
 */
function internalApiBase() {
	if (process.env.PLAYGROUND_INTERNAL_API) return process.env.PLAYGROUND_INTERNAL_API;
	const port = process.env.BACKEND_PORT || 3001;
	return `https://localhost:${port}`;
}

/**
 * Fetch a page of users from PingOne via the server's own proxy endpoint.
 * @param {string} environmentId
 * @param {{workerToken?: string, limit?: number, offset?: number, updatedSince?: string}} options
 * @returns {Promise<{users: Array, totalCount?: number}>}
 */
export async function fetchUsersFromAPI(environmentId, options = {}) {
	const { limit = 200, offset = 0, updatedSince, workerToken } = options;

	if (!workerToken) {
		throw new Error('Worker token is required to fetch users from PingOne API');
	}

	const response = await fetch(`${internalApiBase()}/api/pingone/mfa/list-users`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ environmentId, workerToken, limit, offset, updatedSince }),
	});

	if (!response.ok) {
		const errorData = await response.json().catch(() => ({}));
		throw new Error(
			`Failed to fetch users from PingOne API: ${response.statusText} - ${errorData.error || ''}`
		);
	}

	return response.json();
}

/**
 * Page through PingOne users and persist them. Shared by full and incremental sync.
 * @param {string} environmentId
 * @param {object} options
 * @param {string|null} updatedSince - only fetch users changed since this ISO time (incremental)
 * @returns {Promise<number>} total users fetched
 */
async function runSync(environmentId, options, updatedSince) {
	const { workerToken, maxPages = 100, delayMs = 100, onProgress } = options;

	// Mark sync as in progress so /api/users/sync-status reports it correctly.
	updateSyncMetadata(environmentId, {
		sync_in_progress: 1,
		last_sync_started: new Date().toISOString(),
	});

	try {
		const allUsers = [];
		let offset = 0;
		const limit = 200; // PingOne max per request
		let hasMore = true;
		let fetchedPages = 0;
		let totalFetched = 0;

		while (hasMore && fetchedPages < maxPages) {
			const result = await fetchUsersFromAPI(environmentId, {
				workerToken,
				limit,
				offset,
				updatedSince: updatedSince || undefined,
			});

			const fetchedCount = result.users?.length || 0;
			if (fetchedCount > 0) {
				allUsers.push(...result.users);
				totalFetched += fetchedCount;
				offset += limit;
				fetchedPages++;
				onProgress?.(totalFetched, fetchedPages, result.users);
				if (delayMs > 0) {
					await new Promise((resolve) => setTimeout(resolve, delayMs));
				}
			} else {
				hasMore = false;
			}

			if (result.totalCount && offset >= result.totalCount) {
				hasMore = false;
			}
		}

		if (allUsers.length > 0) {
			saveUsers(environmentId, allUsers);
		}

		// saveUsers already writes last_sync_completed/status:'success'; clear the flag.
		updateSyncMetadata(environmentId, {
			sync_in_progress: 0,
			last_sync_completed: new Date().toISOString(),
			last_sync_status: 'success',
		});

		return totalFetched;
	} catch (error) {
		updateSyncMetadata(environmentId, {
			sync_in_progress: 0,
			last_sync_status: 'failed',
		});
		throw error;
	}
}

/**
 * Full sync — fetch every user for the environment.
 * @returns {Promise<{success: boolean, totalUsers: number, incremental: boolean}>}
 */
export async function fullSync(environmentId, options = {}) {
	const totalUsers = await runSync(environmentId, options, null);
	return { success: true, totalUsers, incremental: false };
}

/**
 * Incremental sync — only users changed since the last completed sync. Falls back
 * to a full sync when there is no prior sync timestamp.
 * @returns {Promise<{success: boolean, totalUsers: number, incremental: boolean}>}
 */
export async function incrementalSync(environmentId, options = {}) {
	const lastSyncTime = getSyncMetadata(environmentId).last_sync_completed;
	if (!lastSyncTime) {
		return fullSync(environmentId, options);
	}
	const totalUsers = await runSync(environmentId, options, lastSyncTime);
	return { success: true, totalUsers, incremental: true };
}

/**
 * Clear all data for an environment
 * @param {string} environmentId
 */
export function clearEnvironmentData(environmentId) {
	const usersDb = getDb('users');
	const metadataDb = getDb('user_metadata');

	// Delete all users for this environment
	const prefix = `${environmentId}|`;
	const keysToDelete = [];
	for (const key of usersDb.keys()) {
		if (key.startsWith(prefix)) {
			keysToDelete.push(key);
		}
	}
	for (const key of keysToDelete) {
		usersDb.del(key);
	}

	// Delete metadata for this environment
	metadataDb.del(environmentId);
}

/**
 * Export all users for an environment (admin/debugging)
 * @param {string} environmentId
 * @returns {Array} All users for the environment
 */
export function exportAllUsers(environmentId) {
	const usersDb = getDb('users');
	const users = [];

	// Iterate through all keys starting with environmentId|
	const prefix = `${environmentId}|`;
	for (const [key, value] of usersDb.entries()) {
		if (key.startsWith(prefix) && key !== prefix) {
			users.push(value);
		}
	}

	// Sort by username
	users.sort((a, b) => (a.username || '').localeCompare(b.username || ''));

	return users;
}
