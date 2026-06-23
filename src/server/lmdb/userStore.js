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
	const searchIndexDb = getDb('user_search_index');

	// Store each user individually
	const searchIndexUsers = [];

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

		usersDb.putSync(key, userData);
		searchIndexUsers.push(userData);
	}

	// Update search index for environment
	const searchKey = `${environmentId}|search`;
	searchIndexDb.putSync(searchKey, searchIndexUsers);

	// Update metadata
	const metadataDb = getDb('user_metadata');
	const metaKey = environmentId;
	const current = metadataDb.getSync(metaKey) || {};
	const totalUsers = getUserCount(environmentId);

	metadataDb.putSync(metaKey, {
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

	const searchIndexDb = getDb('user_search_index');
	const searchKey = `${environmentId}|search`;
	const allUsers = searchIndexDb.getSync(searchKey) || [];

	if (!query) {
		return [];
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
	for (const { key, value } of usersDb.getRange()) {
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
	for (const { key } of usersDb.getRange()) {
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
		metadataDb.getSync(metaKey) || {
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

	metadataDb.putSync(metaKey, updated);
}

/**
 * Clear all data for an environment
 * @param {string} environmentId
 */
export function clearEnvironmentData(environmentId) {
	const usersDb = getDb('users');
	const searchIndexDb = getDb('user_search_index');
	const metadataDb = getDb('user_metadata');

	// Delete all users for this environment
	const prefix = `${environmentId}|`;
	const keysToDelete = [];
	for (const { key } of usersDb.getRange()) {
		if (key.startsWith(prefix)) {
			keysToDelete.push(key);
		}
	}
	for (const key of keysToDelete) {
		usersDb.removeSync(key);
	}

	// Delete search index for this environment
	const searchKey = `${environmentId}|search`;
	searchIndexDb.removeSync(searchKey);

	// Delete metadata for this environment
	metadataDb.removeSync(environmentId);
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
	for (const { key, value } of usersDb.getRange()) {
		if (key.startsWith(prefix) && key !== prefix) {
			users.push(value);
		}
	}

	// Sort by username
	users.sort((a, b) => (a.username || '').localeCompare(b.username || ''));

	return users;
}

/**
 * Full sync - fetch and save all users from API
 * @param {string} environmentId
 * @param {Object} options - { workerToken, maxPages, delayMs, onProgress }
 * @returns {Promise<Object>} { success, totalUsers, incremental }
 */
export async function fullSync(environmentId, options = {}) {
	const { workerToken, maxPages = 100, delayMs = 100, onProgress } = options;

	if (!workerToken) {
		throw new Error('Worker token is required');
	}

	let allUsers = [];
	let offset = 0;
	let pageNum = 0;

	while (pageNum < maxPages) {
		try {
			const response = await fetch('https://localhost:3001/api/pingone/mfa/list-users', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					environmentId,
					workerToken,
					limit: 200,
					offset,
				}),
			});

			if (!response.ok) throw new Error(`API error: ${response.statusText}`);

			const data = await response.json();
			const users = data.users || [];

			if (users.length === 0) break;

			allUsers.push(...users);
			pageNum++;
			offset += users.length;

			if (onProgress) {
				onProgress(allUsers.length, pageNum, users);
			}

			if (delayMs > 0) {
				await new Promise((r) => setTimeout(r, delayMs));
			}
		} catch (err) {
			console.error('Sync error:', err);
			throw err;
		}
	}

	if (allUsers.length > 0) {
		saveUsers(environmentId, allUsers);
	}

	return { success: true, totalUsers: allUsers.length, incremental: false };
}

/**
 * Incremental sync - fetch and save only updated users since last sync
 * @param {string} environmentId
 * @param {Object} options - { workerToken, maxPages, delayMs, onProgress }
 * @returns {Promise<Object>} { success, totalUsers, incremental }
 */
export async function incrementalSync(environmentId, options = {}) {
	const { workerToken, maxPages = 100, delayMs = 100, onProgress } = options;

	if (!workerToken) {
		throw new Error('Worker token is required');
	}

	const metadata = getSyncMetadata(environmentId);
	const lastSyncTime = metadata.last_sync_completed;

	if (!lastSyncTime) {
		return fullSync(environmentId, options);
	}

	let allUsers = [];
	let offset = 0;
	let pageNum = 0;

	while (pageNum < maxPages) {
		try {
			const response = await fetch('https://localhost:3001/api/pingone/mfa/list-users', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					environmentId,
					workerToken,
					limit: 200,
					offset,
					updatedSince: lastSyncTime,
				}),
			});

			if (!response.ok) throw new Error(`API error: ${response.statusText}`);

			const data = await response.json();
			const users = data.users || [];

			if (users.length === 0) break;

			allUsers.push(...users);
			pageNum++;
			offset += users.length;

			if (onProgress) {
				onProgress(allUsers.length, pageNum, users);
			}

			if (delayMs > 0) {
				await new Promise((r) => setTimeout(r, delayMs));
			}
		} catch (err) {
			console.error('Sync error:', err);
			throw err;
		}
	}

	if (allUsers.length > 0) {
		saveUsers(environmentId, allUsers);
	}

	return { success: true, totalUsers: allUsers.length, incremental: true };
}
