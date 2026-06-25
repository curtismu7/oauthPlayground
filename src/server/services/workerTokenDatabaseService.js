/**
 * @file workerTokenDatabaseService.js
 * @description Manage worker tokens: generate, retrieve, revoke, list history
 * Stores to SQLite with 1-hour TTL, auto-cleanup of expired tokens
 */

import Database from 'better-sqlite3';
import path from 'path';
import os from 'os';
import { randomUUID } from 'crypto';

const DB_PATH = path.join(os.homedir(), '.pingone-playground', 'worker-tokens.db');

let db = null;

function initDB() {
	if (db) return db;

	try {
		db = new Database(DB_PATH);
		db.pragma('journal_mode = WAL');

		// Create table if not exists
		db.exec(`
			CREATE TABLE IF NOT EXISTS worker_tokens (
				id TEXT PRIMARY KEY,
				token TEXT NOT NULL UNIQUE,
				expires_at INTEGER NOT NULL,
				created_at INTEGER NOT NULL,
				revoked_at INTEGER,
				roles TEXT,
				name TEXT,
				metadata TEXT
			)
		`);

		// Create index on expires_at for cleanup queries
		db.exec(`
			CREATE INDEX IF NOT EXISTS idx_expires_at ON worker_tokens(expires_at)
		`);

		console.log('[WorkerTokenDB] Initialized at', DB_PATH);
		return db;
	} catch (err) {
		console.error('[WorkerTokenDB] Failed to initialize:', err.message);
		throw err;
	}
}

function cleanupExpired() {
	try {
		const db_ = initDB();
		const now = Date.now();
		const stmt = db_.prepare(`
			DELETE FROM worker_tokens
			WHERE expires_at < ? AND revoked_at IS NULL
		`);
		const result = stmt.run(now);
		if (result.changes > 0) {
			console.log(`[WorkerTokenDB] Cleaned up ${result.changes} expired tokens`);
		}
	} catch (err) {
		console.error('[WorkerTokenDB] Cleanup failed:', err.message);
	}
}

export const workerTokenDatabaseService = {
	/**
	 * Create and store a new worker token
	 */
	createToken(token, expiresAt, roles, name, metadata = {}) {
		try {
			const db_ = initDB();
			const id = randomUUID();
			const now = Date.now();

			const stmt = db_.prepare(`
				INSERT INTO worker_tokens (id, token, expires_at, created_at, roles, name, metadata)
				VALUES (?, ?, ?, ?, ?, ?, ?)
			`);

			stmt.run(
				id,
				token,
				expiresAt || now + 3600000, // Default 1 hour
				now,
				roles ? JSON.stringify(roles) : null,
				name || null,
				metadata ? JSON.stringify(metadata) : null
			);

			console.log('[WorkerTokenDB] Created token:', id);
			return { id, created_at: now };
		} catch (err) {
			console.error('[WorkerTokenDB] Failed to create token:', err.message);
			throw err;
		}
	},

	/**
	 * Get current active token
	 */
	getActiveToken() {
		try {
			const db_ = initDB();
			const now = Date.now();

			const stmt = db_.prepare(`
				SELECT id, token, expires_at, created_at, roles, name
				FROM worker_tokens
				WHERE expires_at > ? AND revoked_at IS NULL
				ORDER BY created_at DESC
				LIMIT 1
			`);

			const result = stmt.get(now);
			if (result && result.roles) {
				result.roles = JSON.parse(result.roles);
			}
			return result || null;
		} catch (err) {
			console.error('[WorkerTokenDB] Failed to get active token:', err.message);
			return null;
		}
	},

	/**
	 * Get token by ID with status
	 */
	getTokenById(id) {
		try {
			const db_ = initDB();
			const now = Date.now();

			const stmt = db_.prepare(`
				SELECT id, token, expires_at, created_at, revoked_at, roles, name
				FROM worker_tokens
				WHERE id = ?
			`);

			const result = stmt.get(id);
			if (!result) return null;

			if (result.roles) {
				result.roles = JSON.parse(result.roles);
			}

			// Calculate status
			if (result.revoked_at) {
				result.status = 'revoked';
			} else if (result.expires_at < now) {
				result.status = 'expired';
			} else if (result.expires_at - now < 5 * 60 * 1000) {
				// Less than 5 minutes left
				result.status = 'expiring';
			} else {
				result.status = 'active';
			}

			result.expiresIn = Math.max(0, result.expires_at - now);
			return result;
		} catch (err) {
			console.error('[WorkerTokenDB] Failed to get token:', err.message);
			return null;
		}
	},

	/**
	 * Revoke a token by ID
	 */
	revokeToken(id) {
		try {
			const db_ = initDB();
			const now = Date.now();

			const stmt = db_.prepare(`
				UPDATE worker_tokens
				SET revoked_at = ?
				WHERE id = ? AND revoked_at IS NULL
			`);

			const result = stmt.run(now, id);
			console.log('[WorkerTokenDB] Revoked token:', id);
			return result.changes > 0;
		} catch (err) {
			console.error('[WorkerTokenDB] Failed to revoke token:', err.message);
			throw err;
		}
	},

	/**
	 * Get token history (active, revoked, expired)
	 */
	getHistory(limit = 50) {
		try {
			const db_ = initDB();
			const now = Date.now();

			const stmt = db_.prepare(`
				SELECT id, token, expires_at, created_at, revoked_at, roles, name
				FROM worker_tokens
				ORDER BY created_at DESC
				LIMIT ?
			`);

			const results = stmt.all(limit);
			return results.map(r => {
				if (r.roles) {
					r.roles = JSON.parse(r.roles);
				}
				if (r.revoked_at) {
					r.status = 'revoked';
				} else if (r.expires_at < now) {
					r.status = 'expired';
				} else {
					r.status = 'active';
				}
				r.expiresIn = Math.max(0, r.expires_at - now);
				return r;
			});
		} catch (err) {
			console.error('[WorkerTokenDB] Failed to get history:', err.message);
			return [];
		}
	},

	/**
	 * Delete token by ID (permanent)
	 */
	deleteToken(id) {
		try {
			const db_ = initDB();
			const stmt = db_.prepare('DELETE FROM worker_tokens WHERE id = ?');
			const result = stmt.run(id);
			return result.changes > 0;
		} catch (err) {
			console.error('[WorkerTokenDB] Failed to delete token:', err.message);
			throw err;
		}
	},

	/**
	 * Run cleanup every 5 minutes
	 */
	startCleanupInterval() {
		setInterval(() => cleanupExpired(), 5 * 60 * 1000);
		console.log('[WorkerTokenDB] Started cleanup interval (5 min)');
	},
};
