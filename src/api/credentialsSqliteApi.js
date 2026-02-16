/**
 * @file credentialsSqliteApi.js
 * @description Server-side API endpoints for enhanced credentials SQLite storage
 * @version 1.0.0
 * @since 2026-02-15
 *
 * Provides REST API endpoints for storing and retrieving enhanced credentials
 * with comprehensive user interaction tracking in SQLite database.
 */

import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import fs from 'fs';

const MODULE_TAG = '[🔐 CREDENTIALS-SQLITE-API]';

// Database configuration
const DB_PATH = path.join(process.cwd(), 'data', 'enhanced_credentials.db');
const DATA_DIR = path.dirname(DB_PATH);

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
	fs.mkdirSync(DATA_DIR, { recursive: true });
	console.log(`${MODULE_TAG} Created data directory: ${DATA_DIR}`);
}

// Database connection pool
let db = null;

/**
 * Initialize database connection and schema
 */
async function initializeDatabase() {
	try {
		if (db) return db;

		db = await open({
			filename: DB_PATH,
			driver: sqlite3.Database
		});

		// Create tables if they don't exist
		await db.exec(`
			CREATE TABLE IF NOT EXISTS enhanced_credentials (
				environment_id TEXT PRIMARY KEY,
				client_id TEXT NOT NULL,
				client_secret TEXT,
				issuer_url TEXT,
				redirect_uri TEXT,
				post_logout_redirect_uri TEXT,
				logout_uri TEXT,
				scopes TEXT,
				login_hint TEXT,
				client_auth_method TEXT,
				response_type TEXT,
				interaction_history TEXT, -- JSON array
				last_updated TEXT NOT NULL,
				created_at TEXT NOT NULL,
				storage_backends TEXT, -- JSON array
				sync_status TEXT DEFAULT 'pending',
				version INTEGER DEFAULT 1
			);

			CREATE TABLE IF NOT EXISTS user_interactions (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				environment_id TEXT NOT NULL,
				timestamp TEXT NOT NULL,
				username TEXT,
				app_name TEXT NOT NULL,
				flow_type TEXT NOT NULL,
				client_id TEXT,
				issuer_url TEXT,
				redirect_uri TEXT,
				scopes TEXT,
				client_auth_method TEXT,
				response_type TEXT,
				selections TEXT, -- JSON object
				field_interactions TEXT, -- JSON object
				session_info TEXT, -- JSON object
				performance TEXT, -- JSON object
				FOREIGN KEY (environment_id) REFERENCES enhanced_credentials(environment_id)
			);

			CREATE INDEX IF NOT EXISTS idx_environment_id ON enhanced_credentials(environment_id);
			CREATE INDEX IF NOT EXISTS idx_client_id ON enhanced_credentials(client_id);
			CREATE INDEX IF NOT EXISTS idx_last_updated ON enhanced_credentials(last_updated);
			CREATE INDEX IF NOT EXISTS idx_interactions_env_id ON user_interactions(environment_id);
			CREATE INDEX IF NOT EXISTS idx_interactions_timestamp ON user_interactions(timestamp);
		`);

		console.log(`${MODULE_TAG} Database initialized: ${DB_PATH}`);
		return db;
	} catch (error) {
		console.error(`${MODULE_TAG} Database initialization failed:`, error);
		throw error;
	}
}

/**
 * Express middleware for credentials SQLite API
 */
function credentialsSqliteApi(app) {
	// Health check endpoint
	app.get('/api/credentials/sqlite/health', async (req, res) => {
		try {
			await initializeDatabase();
			res.status(200).json({ status: 'healthy', database: DB_PATH });
		} catch (error) {
			console.error(`${MODULE_TAG} Health check failed:`, error);
			res.status(500).json({ error: 'Database unavailable' });
		}
	});

	// Save credentials
	app.post('/api/credentials/sqlite/save', async (req, res) => {
		try {
			await initializeDatabase();

			const { environmentId, credentials, timestamp } = req.body;

			if (!environmentId || !credentials) {
				return res.status(400).json({ 
					error: 'Missing required fields: environmentId, credentials' 
				});
			}

			// Check if credentials already exist
			const existing = await db.get(
				'SELECT environment_id FROM enhanced_credentials WHERE environment_id = ?',
				[environmentId]
			);

			if (existing) {
				// Update existing credentials
				await db.run(`
					UPDATE enhanced_credentials SET
						client_id = ?,
						client_secret = ?,
						issuer_url = ?,
						redirect_uri = ?,
						post_logout_redirect_uri = ?,
						logout_uri = ?,
						scopes = ?,
						login_hint = ?,
						client_auth_method = ?,
						response_type = ?,
						interaction_history = ?,
						last_updated = ?,
						storage_backends = ?,
						sync_status = ?,
						version = version + 1
					WHERE environment_id = ?
				`, [
					credentials.clientId || null,
					credentials.clientSecret || null,
					credentials.issuerUrl || null,
					credentials.redirectUri || null,
					credentials.postLogoutRedirectUri || null,
					credentials.logoutUri || null,
					credentials.scopes || null,
					credentials.loginHint || null,
					credentials.clientAuthMethod || null,
					credentials.responseType || null,
					JSON.stringify(credentials.interactionHistory || []),
					timestamp || new Date().toISOString(),
					JSON.stringify(credentials.metadata?.storageBackends || []),
					credentials.metadata?.syncStatus || 'synced',
					environmentId
				]);
			} else {
				// Insert new credentials
				await db.run(`
					INSERT INTO enhanced_credentials (
						environment_id, client_id, client_secret, issuer_url, redirect_uri,
						post_logout_redirect_uri, logout_uri, scopes, login_hint,
						client_auth_method, response_type, interaction_history,
						last_updated, created_at, storage_backends, sync_status, version
					) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
				`, [
					environmentId,
					credentials.clientId || null,
					credentials.clientSecret || null,
					credentials.issuerUrl || null,
					credentials.redirectUri || null,
					credentials.postLogoutRedirectUri || null,
					credentials.logoutUri || null,
					credentials.scopes || null,
					credentials.loginHint || null,
					credentials.clientAuthMethod || null,
					credentials.responseType || null,
					JSON.stringify(credentials.interactionHistory || []),
					timestamp || new Date().toISOString(),
					credentials.metadata?.createdAt || new Date().toISOString(),
					JSON.stringify(credentials.metadata?.storageBackends || []),
					credentials.metadata?.syncStatus || 'synced',
					credentials.metadata?.version || 1
				]);
			}

			// Store individual interactions for better querying
			if (credentials.interactionHistory && Array.isArray(credentials.interactionHistory)) {
				for (const interaction of credentials.interactionHistory) {
					await db.run(`
						INSERT OR REPLACE INTO user_interactions (
							environment_id, timestamp, username, app_name, flow_type,
							client_id, issuer_url, redirect_uri, scopes, client_auth_method,
							response_type, selections, field_interactions, session_info, performance
						) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
					`, [
						environmentId,
						interaction.timestamp,
						interaction.username || null,
						interaction.appName,
						interaction.flowType,
						interaction.clientId || null,
						interaction.issuerUrl || null,
						interaction.redirectUri || null,
						interaction.scopes || null,
						interaction.clientAuthMethod || null,
						interaction.responseType || null,
						JSON.stringify(interaction.selections || {}),
						JSON.stringify(interaction.fieldInteractions || {}),
						JSON.stringify(interaction.sessionInfo || {}),
						JSON.stringify(interaction.performance || {})
					]);
				}
			}

			console.log(`${MODULE_TAG} Credentials saved: ${environmentId}`);
			res.json({ success: true, environmentId });

		} catch (error) {
			console.error(`${MODULE_TAG} Save failed:`, error);
			res.status(500).json({ error: 'Failed to save credentials' });
		}
	});

	// Load credentials
	app.get('/api/credentials/sqlite/load', async (req, res) => {
		try {
			await initializeDatabase();

			const { environmentId } = req.query;

			if (!environmentId) {
				return res.status(400).json({ error: 'Missing environmentId parameter' });
			}

			const row = await db.get(
				'SELECT * FROM enhanced_credentials WHERE environment_id = ?',
				[environmentId]
			);

			if (!row) {
				return res.json({ credentials: null });
			}

			// Parse JSON fields
			const credentials = {
				environmentId: row.environment_id,
				clientId: row.client_id,
				clientSecret: row.client_secret,
				issuerUrl: row.issuer_url,
				redirectUri: row.redirect_uri,
				postLogoutRedirectUri: row.post_logout_redirect_uri,
				logoutUri: row.logout_uri,
				scopes: row.scopes,
				loginHint: row.login_hint,
				clientAuthMethod: row.client_auth_method,
				responseType: row.response_type,
				interactionHistory: JSON.parse(row.interaction_history || '[]'),
				metadata: {
					lastUpdated: row.last_updated,
					createdAt: row.created_at,
					storageBackends: JSON.parse(row.storage_backends || '[]'),
					syncStatus: row.sync_status,
					version: row.version
				}
			};

			console.log(`${MODULE_TAG} Credentials loaded: ${environmentId}`);
			res.json({ credentials });

		} catch (error) {
			console.error(`${MODULE_TAG} Load failed:`, error);
			res.status(500).json({ error: 'Failed to load credentials' });
		}
	});

	// List all credentials
	app.get('/api/credentials/sqlite/list', async (req, res) => {
		try {
			await initializeDatabase();

			const rows = await db.all('SELECT * FROM enhanced_credentials ORDER BY last_updated DESC');

			const credentials = rows.map(row => ({
				environmentId: row.environment_id,
				clientId: row.client_id,
				clientSecret: row.client_secret,
				issuerUrl: row.issuer_url,
				redirectUri: row.redirect_uri,
				postLogoutRedirectUri: row.post_logout_redirect_uri,
				logoutUri: row.logout_uri,
				scopes: row.scopes,
				loginHint: row.login_hint,
				clientAuthMethod: row.client_auth_method,
				responseType: row.response_type,
				interactionHistory: JSON.parse(row.interaction_history || '[]'),
				metadata: {
					lastUpdated: row.last_updated,
					createdAt: row.created_at,
					storageBackends: JSON.parse(row.storage_backends || '[]'),
					syncStatus: row.sync_status,
					version: row.version
				}
			}));

			console.log(`${MODULE_TAG} Listed ${credentials.length} credentials`);
			res.json({ credentials });

		} catch (error) {
			console.error(`${MODULE_TAG} List failed:`, error);
			res.status(500).json({ error: 'Failed to list credentials' });
		}
	});

	// Clear credentials
	app.delete('/api/credentials/sqlite/clear', async (req, res) => {
		try {
			await initializeDatabase();

			const { environmentId } = req.body;

			if (!environmentId) {
				return res.status(400).json({ error: 'Missing environmentId in request body' });
			}

			// Delete credentials and interactions
			await db.run('DELETE FROM enhanced_credentials WHERE environment_id = ?', [environmentId]);
			await db.run('DELETE FROM user_interactions WHERE environment_id = ?', [environmentId]);

			console.log(`${MODULE_TAG} Credentials cleared: ${environmentId}`);
			res.json({ success: true, environmentId });

		} catch (error) {
			console.error(`${MODULE_TAG} Clear failed:`, error);
			res.status(500).json({ error: 'Failed to clear credentials' });
		}
	});

	// Get interaction analytics
	app.get('/api/credentials/sqlite/analytics', async (req, res) => {
		try {
			await initializeDatabase();

			const { environmentId, startDate, endDate } = req.query;

			let query = `
				SELECT 
					app_name,
					flow_type,
					COUNT(*) as interaction_count,
					AVG(JSON_EXTRACT(performance, '$.saveTime')) as avg_save_time,
					AVG(JSON_EXTRACT(performance, '$.loadTime')) as avg_load_time,
					MIN(timestamp) as first_interaction,
					MAX(timestamp) as last_interaction
				FROM user_interactions
			`;

			const params = [];
			const conditions = [];

			if (environmentId) {
				conditions.push('environment_id = ?');
				params.push(environmentId);
			}

			if (startDate) {
				conditions.push('timestamp >= ?');
				params.push(startDate);
			}

			if (endDate) {
				conditions.push('timestamp <= ?');
				params.push(endDate);
			}

			if (conditions.length > 0) {
				query += ' WHERE ' + conditions.join(' AND ');
			}

			query += ' GROUP BY app_name, flow_type ORDER BY interaction_count DESC';

			const analytics = await db.all(query, params);

			console.log(`${MODULE_TAG} Analytics retrieved: ${analytics.length} records`);
			res.json({ analytics });

		} catch (error) {
			console.error(`${MODULE_TAG} Analytics failed:`, error);
			res.status(500).json({ error: 'Failed to get analytics' });
		}
	});

	// Get storage usage statistics
	app.get('/api/credentials/sqlite/stats', async (req, res) => {
		try {
			await initializeDatabase();

			const stats = await db.get(`
				SELECT 
					COUNT(*) as total_credentials,
					COUNT(DISTINCT client_id) as unique_clients,
					COUNT(DISTINCT environment_id) as unique_environments,
					AVG(JSON_ARRAY_LENGTH(interaction_history)) as avg_interaction_count,
					SUM(CASE WHEN client_secret IS NOT NULL THEN 1 ELSE 0 END) as credentials_with_secrets
				FROM enhanced_credentials
			`);

			const interactionStats = await db.get(`
				SELECT 
					COUNT(*) as total_interactions,
					COUNT(DISTINCT app_name) as unique_apps,
					COUNT(DISTINCT flow_type) as unique_flow_types,
					COUNT(DISTINCT username) as unique_users
				FROM user_interactions
			`);

			const combinedStats = {
				...stats,
				...interactionStats,
				databasePath: DB_PATH,
				databaseSize: fs.statSync(DB_PATH).size
			};

			console.log(`${MODULE_TAG} Stats retrieved`);
			res.json({ stats: combinedStats });

		} catch (error) {
			console.error(`${MODULE_TAG} Stats failed:`, error);
			res.status(500).json({ error: 'Failed to get stats' });
		}
	});

	console.log(`${MODULE_TAG} API endpoints registered`);
}

/**
 * Graceful shutdown
 */
async function shutdown() {
	if (db) {
		await db.close();
		console.log(`${MODULE_TAG} Database connection closed`);
	}
}

// Register shutdown handler
process.on('SIGINT', async () => {
	await shutdown();
	process.exit(0);
});

process.on('SIGTERM', async () => {
	await shutdown();
	process.exit(0);
});

export { credentialsSqliteApi, initializeDatabase, shutdown };
