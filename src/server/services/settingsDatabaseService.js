/**
 * @file settingsDatabaseService.js
 * @module server/services
 * @description SQLite-based settings database service for persisting user preferences
 * @version 1.0.0
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sqlite3 from 'sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database file location
const DB_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DB_DIR, 'settings.db');

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
	fs.mkdirSync(DB_DIR, { recursive: true });
}

class SettingsDatabaseService {
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
					console.error('[SettingsDB] Failed to open database:', err);
					reject(err);
					return;
				}

				// Create settings table
				this.db.run(`
					CREATE TABLE IF NOT EXISTS settings (
						key TEXT PRIMARY KEY,
						value TEXT,
						updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
					)
				`, (err) => {
					if (err) {
						console.error('[SettingsDB] Failed to create table:', err);
						reject(err);
						return;
					}

					this.initialized = true;
					resolve();
				});
			});
		});
	}

	/**
	 * Get a setting value
	 */
	async get(key) {
		if (!this.initialized) await this.init();

		return new Promise((resolve, reject) => {
			this.db.get(
				'SELECT value FROM settings WHERE key = ?',
				[key],
				(err, row) => {
					if (err) {
						reject(err);
						return;
					}
					resolve(row ? row.value : null);
				}
			);
		});
	}

	/**
	 * Set a setting value
	 */
	async set(key, value) {
		if (!this.initialized) await this.init();

		return new Promise((resolve, reject) => {
			this.db.run(
				'INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
				[key, JSON.stringify(value)],
				(err) => {
					if (err) {
						reject(err);
						return;
					}
					resolve();
				}
			);
		});
	}

	/**
	 * Close the database connection
	 */
	close() {
		if (this.db) {
			this.db.close();
			this.db = null;
			this.initialized = false;
		}
	}
}

// Export singleton instance
export const settingsDB = new SettingsDatabaseService();
