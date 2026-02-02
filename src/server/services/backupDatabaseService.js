/**
 * @file backupDatabaseService.js
 * @module server/services
 * @description SQLite backup service for credentials, config, and flow state
 * @version 1.0.0
 * @since 2026-02-02
 *
 * Provides server-side backup for browser storage data.
 */

import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MODULE_TAG = '[💾 BACKUP-DB]';

// Database file location
const DB_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DB_DIR, 'backups.db');

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
	fs.mkdirSync(DB_DIR, { recursive: true });
}

class BackupDatabaseService {
	constructor() {
		this.db = null;
		this.initialized = false;
	}

	/**
	 * Initialize the database
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

				this.createTables().then(() => {
					this.initialized = true;
					console.log(`${MODULE_TAG} Backup database initialized at ${DB_PATH}`);
					resolve();
				}).catch(reject);
			});
		});
	}

	/**
	 * Create backup table
	 */
	async createTables() {
		const sql = `
			CREATE TABLE IF NOT EXISTS backups (
				key TEXT NOT NULL,
				environment_id TEXT NOT NULL,
				data_type TEXT NOT NULL,
				data TEXT NOT NULL,
				saved_at INTEGER NOT NULL,
				expires_at INTEGER,
				PRIMARY KEY (key, environment_id)
			);
			
			CREATE INDEX IF NOT EXISTS idx_backups_env ON backups(environment_id);
			CREATE INDEX IF NOT EXISTS idx_backups_type ON backups(data_type);
			CREATE INDEX IF NOT EXISTS idx_backups_expires ON backups(expires_at);
		`;

		await this.run(sql);
		console.log(`${MODULE_TAG} Backup tables created`);
	}

	/**
	 * Execute SQL query
	 */
	async run(sql, params = []) {
		if (!this.db) await this.init();

		return new Promise((resolve, reject) => {
			this.db.run(sql, params, function(err) {
				if (err) reject(err);
				else resolve({ lastID: this.lastID, changes: this.changes });
			});
		});
	}

	/**
	 * Get single row
	 */
	async get(sql, params = []) {
		if (!this.db) await this.init();

		return new Promise((resolve, reject) => {
			this.db.get(sql, params, (err, row) => {
				if (err) reject(err);
				else resolve(row);
			});
		});
	}

	/**
	 * Get all rows
	 */
	async all(sql, params = []) {
		if (!this.db) await this.init();

		return new Promise((resolve, reject) => {
			this.db.all(sql, params, (err, rows) => {
				if (err) reject(err);
				else resolve(rows || []);
			});
		});
	}

	/**
	 * Save backup
	 */
	async saveBackup(key, environmentId, dataType, data, expiresAt = null) {
		const sql = `
			INSERT OR REPLACE INTO backups (key, environment_id, data_type, data, saved_at, expires_at)
			VALUES (?, ?, ?, ?, ?, ?)
		`;

		await this.run(sql, [
			key,
			environmentId,
			dataType,
			JSON.stringify(data),
			Date.now(),
			expiresAt
		]);

		console.log(`${MODULE_TAG} Saved backup: ${key} (type: ${dataType})`);
	}

	/**
	 * Load backup
	 */
	async loadBackup(key, environmentId) {
		const sql = `
			SELECT * FROM backups
			WHERE key = ? AND environment_id = ?
			AND (expires_at IS NULL OR expires_at > ?)
		`;

		const row = await this.get(sql, [key, environmentId, Date.now()]);
		
		if (!row) {
			return null;
		}

		try {
			return {
				key: row.key,
				environmentId: row.environment_id,
				dataType: row.data_type,
				data: JSON.parse(row.data),
				savedAt: row.saved_at,
				expiresAt: row.expires_at,
				expired: false,
			};
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to parse backup data:`, error);
			return null;
		}
	}

	/**
	 * Delete backup
	 */
	async deleteBackup(key, environmentId) {
		const sql = `DELETE FROM backups WHERE key = ? AND environment_id = ?`;
		await this.run(sql, [key, environmentId]);
		console.log(`${MODULE_TAG} Deleted backup: ${key}`);
	}

	/**
	 * List all backups for environment
	 */
	async listBackups(environmentId, dataType = null) {
		let sql = `
			SELECT key, environment_id, data_type, saved_at, expires_at
			FROM backups
			WHERE environment_id = ?
			AND (expires_at IS NULL OR expires_at > ?)
		`;
		const params = [environmentId, Date.now()];

		if (dataType) {
			sql += ' AND data_type = ?';
			params.push(dataType);
		}

		sql += ' ORDER BY saved_at DESC';

		const rows = await this.all(sql, params);
		return rows.map(row => ({
			key: row.key,
			environmentId: row.environment_id,
			dataType: row.data_type,
			savedAt: row.saved_at,
			expiresAt: row.expires_at,
		}));
	}

	/**
	 * Clear all backups for environment
	 */
	async clearEnvironment(environmentId) {
		const sql = `DELETE FROM backups WHERE environment_id = ?`;
		const result = await this.run(sql, [environmentId]);
		console.log(`${MODULE_TAG} Cleared ${result.changes} backups for environment ${environmentId}`);
		return result.changes;
	}

	/**
	 * Clean up expired backups
	 */
	async cleanupExpired() {
		const sql = `DELETE FROM backups WHERE expires_at IS NOT NULL AND expires_at <= ?`;
		const result = await this.run(sql, [Date.now()]);
		console.log(`${MODULE_TAG} Cleaned up ${result.changes} expired backups`);
		return result.changes;
	}

	/**
	 * Get backup statistics
	 */
	async getStats(environmentId = null) {
		let sql = `
			SELECT 
				COUNT(*) as total,
				data_type,
				COUNT(CASE WHEN expires_at IS NOT NULL AND expires_at <= ? THEN 1 END) as expired
			FROM backups
		`;
		const params = [Date.now()];

		if (environmentId) {
			sql += ' WHERE environment_id = ?';
			params.push(environmentId);
		}

		sql += ' GROUP BY data_type';

		const rows = await this.all(sql, params);
		
		const stats = {
			total: 0,
			byType: {},
			expired: 0,
		};

		rows.forEach(row => {
			stats.total += row.total;
			stats.byType[row.data_type] = row.total;
			stats.expired += row.expired || 0;
		});

		return stats;
	}
}

// Create singleton instance
export const backupDatabaseService = new BackupDatabaseService();

// Initialize on module load
backupDatabaseService.init().catch(err => {
	console.error(`${MODULE_TAG} Failed to initialize:`, err);
});

export default backupDatabaseService;
