/**
 * @file userDatabaseService.js
 * @module server/services
 * @description SQLite-based user database service for large user directories
 * @version 1.0.0
 * @since 2026-02-02
 *
 * Provides disk-based storage for user data with:
 * - SQLite database for persistence
 * - Full-text search capabilities
 * - Efficient querying for large datasets
 * - Environment-specific data isolation
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fetch from 'node-fetch';
import sqlite3 from 'sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MODULE_TAG = '[💾 USER-DB]';

// Database file location
const DB_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DB_DIR, 'users.db');

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
	fs.mkdirSync(DB_DIR, { recursive: true });
}

class UserDatabaseService {
	constructor() {
		this.db = null;
		this.initialized = false;
	}

	/**
	 * Initialize the database and create tables
	 */
	async init() {
		if (this.initialized) return;

		return new Promise((resolve, reject) => {
			this.db = new sqlite3.Database(DB_PATH, (err) => {
				if (err) {
					console.error(`${MODULE_TAG} Failed to open database:`, err);
					reject(err);
					return;
				}

				// Enable WAL mode and other optimizations
				this.db.run('PRAGMA journal_mode = WAL', (err) => {
					if (err) console.warn(`${MODULE_TAG} Failed to set WAL mode:`, err);
				});
				this.db.run('PRAGMA synchronous = NORMAL', (err) => {
					if (err) console.warn(`${MODULE_TAG} Failed to set synchronous mode:`, err);
				});
				this.db.run('PRAGMA cache_size = 1000000', (err) => {
					if (err) console.warn(`${MODULE_TAG} Failed to set cache size:`, err);
				});
				this.db.run('PRAGMA temp_store = memory', (err) => {
					if (err) console.warn(`${MODULE_TAG} Failed to set temp store:`, err);
				});

				this.createTables()
					.then(() => {
						return this.createIndexes();
					})
					.then(() => {
						this.initialized = true;
						console.log(`${MODULE_TAG} Database initialized at ${DB_PATH}`);
						resolve();
					})
					.catch(reject);
			});
		});
	}

	/**
	 * Create database tables
	 */
	async createTables() {
		const tables = [
			`CREATE TABLE IF NOT EXISTS users (
				id TEXT PRIMARY KEY,
				environment_id TEXT NOT NULL,
				username TEXT NOT NULL,
				email TEXT,
				first_name TEXT,
				last_name TEXT,
				display_name TEXT,
				user_type TEXT,
				enabled INTEGER DEFAULT 1,
				created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
				updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
				last_login DATETIME,
				population_id TEXT,
				lifecycle_status TEXT,
				UNIQUE(environment_id, username)
			)`,
			`CREATE TABLE IF NOT EXISTS sync_metadata (
				environment_id TEXT PRIMARY KEY,
				total_users INTEGER DEFAULT 0,
				last_sync_started DATETIME,
				last_sync_completed DATETIME,
				last_sync_status TEXT,
				sync_in_progress INTEGER DEFAULT 0,
				current_page INTEGER DEFAULT 0,
				total_pages INTEGER DEFAULT 0,
				fetched_count INTEGER DEFAULT 0
			)`,
			`CREATE VIRTUAL TABLE IF NOT EXISTS user_search USING fts5(
				user_id UNINDEXED,
				environment_id UNINDEXED,
				search_text,
				tokenize = 'porter ascii'
			)`,
		];

		for (const sql of tables) {
			await this.run(sql);
		}

		console.log(`${MODULE_TAG} Tables created successfully`);
	}

	/**
	 * Create database indexes
	 */
	async createIndexes() {
		const indexes = [
			'CREATE INDEX IF NOT EXISTS idx_users_environment ON users(environment_id)',
			'CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)',
			'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
			'CREATE INDEX IF NOT EXISTS idx_users_updated ON users(updated_at)',
			'CREATE INDEX IF NOT EXISTS idx_users_created ON users(created_at)',
			`CREATE TRIGGER IF NOT EXISTS user_search_insert AFTER INSERT ON users BEGIN 
				INSERT INTO user_search(user_id, environment_id, search_text) 
				VALUES (new.id, new.environment_id, new.username || ' ' || COALESCE(new.email, '') || ' ' || COALESCE(new.first_name, '') || ' ' || COALESCE(new.last_name, '') || ' ' || COALESCE(new.display_name, '')); 
			END`,
			`CREATE TRIGGER IF NOT EXISTS user_search_delete AFTER DELETE ON users BEGIN 
				DELETE FROM user_search WHERE user_id = old.id; 
			END`,
			`CREATE TRIGGER IF NOT EXISTS user_search_update AFTER UPDATE ON users BEGIN 
				UPDATE user_search 
				SET search_text = new.username || ' ' || COALESCE(new.email, '') || ' ' || COALESCE(new.first_name, '') || ' ' || COALESCE(new.last_name, '') || ' ' || COALESCE(new.display_name, '')
				WHERE user_id = new.id; 
			END`,
		];

		for (const sql of indexes) {
			await this.run(sql);
		}

		console.log(`${MODULE_TAG} Indexes created successfully`);
	}

	/**
	 * Run a SQL statement
	 */
	run(sql, params = []) {
		return new Promise((resolve, reject) => {
			this.db.run(sql, params, function (err) {
				if (err) {
					reject(err);
				} else {
					resolve({ lastID: this.lastID, changes: this.changes });
				}
			});
		});
	}

	/**
	 * Get a single row
	 */
	getRow(sql, params = []) {
		return new Promise((resolve, reject) => {
			this.db.get(sql, params, (err, row) => {
				if (err) {
					reject(err);
				} else {
					resolve(row);
				}
			});
		});
	}

	/**
	 * Get all rows
	 */
	all(sql, params = []) {
		return new Promise((resolve, reject) => {
			this.db.all(sql, params, (err, rows) => {
				if (err) {
					reject(err);
				} else {
					resolve(rows);
				}
			});
		});
	}

	/**
	 * Create performance indexes
	 */
	createIndexes() {
		this.db.exec(`
			CREATE INDEX IF NOT EXISTS idx_users_env_username ON users(environment_id, username);
			CREATE INDEX IF NOT EXISTS idx_users_env_email ON users(environment_id, email);
			CREATE INDEX IF NOT EXISTS idx_users_env_enabled ON users(environment_id, enabled);
			CREATE INDEX IF NOT EXISTS idx_users_updated ON users(updated_at);
		`);

		console.log(`${MODULE_TAG} Indexes created successfully`);
	}

	/**
	 * Save or update users in batch
	 */
	async saveUsers(environmentId, users) {
		await this.init();

		return new Promise(async (resolve, reject) => {
			this.db.serialize(async () => {
				try {
					await this.run('BEGIN TRANSACTION');

					for (const user of users) {
						// Insert/update user
						await this.run(
							`
							INSERT OR REPLACE INTO users (
								id, environment_id, username, email, first_name, last_name,
								display_name, user_type, lifecycle_status, created_at, updated_at,
								last_login, population_id, enabled
							) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
						`,
							[
								user.id,
								environmentId,
								user.username,
								user.email || null,
								user.name?.given || null,
								user.name?.family || null,
								user.name?.formatted || user.username,
								user.userType || null,
								user.lifecycle?.status || null,
								user.createdAt || null,
								user.updatedAt || null,
								user.lastSignOn?.at || null,
								user.population?.id || null,
								user.enabled !== undefined ? (user.enabled ? 1 : 0) : 1,
							]
						);
					}

					// Update metadata
					const totalUsers = await this.getUserCount(environmentId);
					await this.run(
						`
						INSERT OR REPLACE INTO sync_metadata (
							environment_id, total_users, last_sync_completed, last_sync_status
						) VALUES (?, ?, ?, ?)
					`,
						[environmentId, totalUsers, new Date().toISOString(), 'success']
					);

					await this.run('COMMIT');
					console.log(`${MODULE_TAG} Saved ${users.length} users for environment ${environmentId}`);
					resolve();
				} catch (error) {
					await this.run('ROLLBACK');
					console.error(`${MODULE_TAG} Failed to save users:`, error);
					reject(error);
				}
			});
		});
	}

	/**
	 * Search users with full-text search
	 */
	async searchUsers(environmentId, query, limit = 100, offset = 0) {
		await this.init();

		if (!query || !query.trim()) {
			// Return recent users if no query
			return this.getRecentUsers(environmentId, limit);
		}

		try {
			// Use prefix matching for FTS (append *) and LIKE fallback for comprehensive results
			const ftsQuery = `${query.trim()}*`;
			const likePattern = `%${query}%`;

			const results = await this.all(
				`
				SELECT DISTINCT u.*, bm25(user_search) as rank
				FROM user_search
				JOIN users u ON user_search.user_id = u.id
				WHERE user_search MATCH ?
				AND u.environment_id = ?
				
				UNION
				
				SELECT DISTINCT u.*, 0 as rank
				FROM users u
				WHERE u.environment_id = ?
				AND u.id NOT IN (
					SELECT u2.id FROM user_search
					JOIN users u2 ON user_search.user_id = u2.id
					WHERE user_search MATCH ? AND u2.environment_id = ?
				)
				AND (
					u.username LIKE ?
					OR u.email LIKE ?
					OR u.first_name LIKE ?
					OR u.last_name LIKE ?
					OR u.display_name LIKE ?
				)
				
				ORDER BY rank
				LIMIT ? OFFSET ?
			`,
				[
					ftsQuery,
					environmentId,
					environmentId,
					ftsQuery,
					environmentId,
					likePattern,
					likePattern,
					likePattern,
					likePattern,
					likePattern,
					limit,
					offset,
				]
			);

			return results.map((row) => ({
				id: row.id,
				username: row.username,
				email: row.email,
				name: {
					given: row.first_name,
					family: row.last_name,
					formatted: row.display_name,
				},
				userType: row.user_type,
				lifecycle: { status: row.lifecycle_status },
				createdAt: row.created_at,
				updatedAt: row.updated_at,
				lastSignOn: row.last_sign_on ? { at: row.last_sign_on } : null,
			}));
		} catch (error) {
			console.error(`${MODULE_TAG} Search failed:`, error);
			return [];
		}
	}

	/**
	 * Get recent users for dropdown display
	 */
	async getRecentUsers(environmentId, limit = 100) {
		await this.init();

		const results = await this.all(
			`
			SELECT * FROM users
			WHERE environment_id = ?
			ORDER BY updated_at DESC
			LIMIT ?
		`,
			[environmentId, limit]
		);

		return results.map((row) => ({
			id: row.id,
			username: row.username,
			email: row.email,
			name: {
				given: row.first_name,
				family: row.last_name,
				formatted: row.display_name,
			},
			userType: row.user_type,
			lifecycle: { status: row.lifecycle_status },
			createdAt: row.created_at,
			updatedAt: row.updated_at,
			lastSignOn: row.last_sign_on ? { at: row.last_sign_on } : null,
		}));
	}

	/**
	 * Get user count for environment
	 */
	async getUserCount(environmentId) {
		await this.init();

		const result = await this.getRow(
			`
			SELECT COUNT(*) as count FROM users WHERE environment_id = ?
		`,
			[environmentId]
		);

		return result ? result.count || 0 : 0;
	}

	/**
	 * Get sync metadata
	 */
	async getSyncMetadata(environmentId) {
		await this.init();

		const result = await this.getRow(
			`
			SELECT * FROM sync_metadata WHERE environment_id = ?
		`,
			[environmentId]
		);

		return (
			result || {
				environment_id: environmentId,
				total_users: 0,
				last_sync_completed: null,
				last_sync_status: null,
				sync_in_progress: 0,
			}
		);
	}

	/**
	 * Clear all data for environment
	 */
	async clearEnvironmentData(environmentId) {
		await this.init();

		return new Promise(async (resolve, reject) => {
			try {
				await this.run('BEGIN TRANSACTION');
				await this.run('DELETE FROM users WHERE environment_id = ?', [environmentId]);
				await this.run('DELETE FROM sync_metadata WHERE environment_id = ?', [environmentId]);
				await this.run('COMMIT');

				console.log(`${MODULE_TAG} Cleared data for environment ${environmentId}`);
				resolve();
			} catch (error) {
				await this.run('ROLLBACK');
				console.error(`${MODULE_TAG} Failed to clear environment data:`, error);
				reject(error);
			}
		});
	}

	/**
	 * Export all users for an environment (admin/debugging)
	 */
	async exportAllUsers(environmentId) {
		await this.init();

		const results = await this.all(
			`
			SELECT * FROM users WHERE environment_id = ? ORDER BY username
		`,
			[environmentId]
		);

		return results.map((row) => ({
			id: row.id,
			username: row.username,
			email: row.email,
			name: {
				given: row.first_name,
				family: row.last_name,
				formatted: row.display_name,
			},
			userType: row.user_type,
			lifecycle: { status: row.lifecycle_status },
			createdAt: row.created_at,
			updatedAt: row.updated_at,
			lastSignOn: row.last_sign_on ? { at: row.last_sign_on } : null,
		}));
	}

	/**
	 * Perform incremental sync - only fetch users updated since last sync
	 */
	async incrementalSync(environmentId, options = {}) {
		await this.init();

		const { workerToken, maxPages = 100, delayMs = 100, onProgress } = options;

		console.log(`${MODULE_TAG} Starting incremental sync for environment ${environmentId}`);

		// Get last sync timestamp
		const metadata = await this.getSyncMetadata(environmentId);
		const lastSyncTime = metadata.last_sync_completed;

		if (!lastSyncTime) {
			console.log(`${MODULE_TAG} No previous sync found, performing full sync`);
			return this.fullSync(environmentId, options);
		}

		console.log(`${MODULE_TAG} Last sync completed: ${lastSyncTime}`);
		console.log(`${MODULE_TAG} Syncing users updated since: ${lastSyncTime}`);

		// Update sync status to in progress
		await this.updateSyncMetadata(environmentId, {
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
				const result = await this.fetchUsersFromAPI(environmentId, {
					workerToken,
					limit,
					offset,
					updatedSince: lastSyncTime,
				});

				const fetchedCount = result.users.length;
				if (fetchedCount > 0) {
					allUsers.push(...result.users);
					totalFetched += fetchedCount;
					offset += limit;
					fetchedPages++;

					if (onProgress) {
						onProgress(totalFetched, fetchedPages, result.users);
					}

					// Add delay between requests to be respectful to the API
					if (delayMs > 0) {
						await new Promise((resolve) => setTimeout(resolve, delayMs));
					}
				} else {
					hasMore = false;
				}

				// Check if we've reached the total count
				if (result.totalCount && offset >= result.totalCount) {
					hasMore = false;
				}
			}

			// Save all users to database
			if (allUsers.length > 0) {
				await this.saveUsers(environmentId, allUsers);
			}

			// Update sync metadata
			await this.updateSyncMetadata(environmentId, {
				sync_in_progress: 0,
				last_sync_completed: new Date().toISOString(),
				last_sync_status: 'success',
			});

			console.log(`${MODULE_TAG} Incremental sync completed! Updated ${totalFetched} users`);
			return { success: true, totalUsers: totalFetched, incremental: true };
		} catch (error) {
			console.error(`${MODULE_TAG} Incremental sync failed:`, error);
			console.error(`${MODULE_TAG} Error message:`, error.message);
			console.error(`${MODULE_TAG} Error stack:`, error.stack);

			await this.updateSyncMetadata(environmentId, {
				sync_in_progress: 0,
				last_sync_status: 'failed',
			});

			throw error;
		}
	}

	/**
	 * Perform full sync - fetch all users
	 */
	async fullSync(environmentId, options = {}) {
		await this.init();

		const { workerToken, maxPages = 100, delayMs = 100, onProgress } = options;

		console.log(`${MODULE_TAG} Starting full sync for environment ${environmentId}`);

		// Update sync status to in progress
		await this.updateSyncMetadata(environmentId, {
			sync_in_progress: 1,
			last_sync_started: new Date().toISOString(),
		});

		try {
			const allUsers = [];
			let offset = 0;
			const limit = 200;
			let hasMore = true;
			let fetchedPages = 0;
			let totalFetched = 0;

			while (hasMore && fetchedPages < maxPages) {
				const result = await this.fetchUsersFromAPI(environmentId, { workerToken, limit, offset });
				const fetchedCount = result.users.length;

				if (fetchedCount > 0) {
					allUsers.push(...result.users);
					totalFetched += fetchedCount;
					offset += limit;
					fetchedPages++;

					console.log(
						`${MODULE_TAG} Full sync page ${fetchedPages} - fetched ${fetchedCount} users. Total: ${totalFetched}`
					);

					if (onProgress) {
						onProgress(totalFetched, fetchedPages, result.users);
					}
				} else {
					hasMore = false;
				}

				// Check if we've reached the total count
				if (result.totalCount && offset >= result.totalCount) {
					hasMore = false;
				}

				// Add delay between requests to be respectful to the API
				if (hasMore && delayMs > 0) {
					await new Promise((resolve) => setTimeout(resolve, delayMs));
				}
			}

			// Save all users to database
			if (allUsers.length > 0) {
				await this.saveUsers(environmentId, allUsers);
			}

			// Update sync metadata
			await this.updateSyncMetadata(environmentId, {
				sync_in_progress: 0,
				last_sync_completed: new Date().toISOString(),
				last_sync_status: 'success',
			});

			console.log(`${MODULE_TAG} Full sync completed! Total users: ${totalFetched}`);
			return { success: true, totalUsers: totalFetched, incremental: false };
		} catch (error) {
			console.error(`${MODULE_TAG} Full sync failed:`, error);
			console.error(`${MODULE_TAG} Error message:`, error.message);
			console.error(`${MODULE_TAG} Error stack:`, error.stack);

			await this.updateSyncMetadata(environmentId, {
				sync_in_progress: 0,
				last_sync_status: 'failed',
			});

			throw error;
		}
	}

	/**
	 * Fetch users from PingOne API
	 */
	async fetchUsersFromAPI(environmentId, options = {}) {
		const { limit = 200, offset = 0, updatedSince, workerToken } = options;

		if (!workerToken) {
			throw new Error('Worker token is required to fetch users from PingOne API');
		}

		// Call the server's internal API endpoint
		const response = await fetch('http://localhost:3001/api/pingone/mfa/list-users', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				environmentId,
				workerToken,
				limit,
				offset,
				updatedSince,
			}),
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(
				`Failed to fetch users from PingOne API: ${response.statusText} - ${errorData.error || ''}`
			);
		}

		const data = await response.json();
		return data;
	}

	/**
	 * Update sync metadata
	 */
	async updateSyncMetadata(environmentId, updates) {
		await this.init();

		const current = await this.getSyncMetadata(environmentId);
		const updated = { ...current, ...updates };

		await this.run(
			`
			INSERT OR REPLACE INTO sync_metadata (
				environment_id, total_users, last_sync_started, last_sync_completed,
				last_sync_status, sync_in_progress
			) VALUES (?, ?, ?, ?, ?, ?)
		`,
			[
				updated.environment_id || environmentId,
				updated.total_users || 0,
				updated.last_sync_started || null,
				updated.last_sync_completed || null,
				updated.last_sync_status || null,
				updated.sync_in_progress || 0,
			]
		);
	}

	/**
	 * Close database connection
	 */
	close() {
		if (this.db) {
			this.db.close();
			this.db = null;
			this.initialized = false;
			console.log(`${MODULE_TAG} Database connection closed`);
		}
	}
}

// Export singleton instance
export const userDatabaseService = new UserDatabaseService();
