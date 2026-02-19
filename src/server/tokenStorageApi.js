/**
 * @file tokenStorageApi.js
 * @description Backend API endpoints for unified token storage with SQLite
 * @version 1.0.0
 * @since 2026-02-15
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('node:path');

// Database file path
const DB_PATH = path.join(__dirname, '../server/data/tokens.db');

// Initialize SQLite database
function initializeDatabase() {
	return new Promise((resolve, reject) => {
		const db = new sqlite3.Database(DB_PATH, (err) => {
			if (err) {
				console.error('Error opening token database:', err);
				reject(err);
			} else {
				console.log('Connected to SQLite token database');

				// Create tokens table if it doesn't exist
				db.run(
					`
          CREATE TABLE IF NOT EXISTS tokens (
            id TEXT PRIMARY KEY,
            type TEXT NOT NULL,
            value TEXT NOT NULL,
            expiresAt INTEGER,
            issuedAt INTEGER NOT NULL,
            scope TEXT,
            source TEXT NOT NULL,
            flowType TEXT,
            flowName TEXT,
            environmentId TEXT,
            clientId TEXT,
            metadata TEXT,
            createdAt INTEGER NOT NULL,
            updatedAt INTEGER NOT NULL
          )
        `,
					(err) => {
						if (err) {
							console.error('Error creating tokens table:', err);
							reject(err);
						} else {
							console.log('Tokens table ready');

							// Create indexes for performance
							db.run('CREATE INDEX IF NOT EXISTS idx_tokens_type ON tokens(type)', (err) => {
								if (err) console.warn('Error creating type index:', err);
							});

							db.run('CREATE INDEX IF NOT EXISTS idx_tokens_source ON tokens(source)', (err) => {
								if (err) console.warn('Error creating source index:', err);
							});

							db.run(
								'CREATE INDEX IF NOT EXISTS idx_tokens_environmentId ON tokens(environmentId)',
								(err) => {
									if (err) console.warn('Error creating environmentId index:', err);
								}
							);

							db.run(
								'CREATE INDEX IF NOT EXISTS idx_tokens_expiresAt ON tokens(expiresAt)',
								(err) => {
									if (err) console.warn('Error creating expiresAt index:', err);
								}
							);

							resolve(db);
						}
					}
				);
			}
		});
	});
}

// Helper function to get database connection
async function getDb() {
	if (!getDb.db) {
		getDb.db = await initializeDatabase();
	}
	return getDb.db;
}

// Store token endpoint
async function storeToken(req, res) {
	try {
		const db = await getDb();
		const token = req.body;

		const stmt = db.prepare(`
      INSERT OR REPLACE INTO tokens (
        id, type, value, expiresAt, issuedAt, scope, source,
        flowType, flowName, environmentId, clientId, metadata,
        createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

		stmt.run(
			token.id,
			token.type,
			token.value,
			token.expiresAt,
			token.issuedAt,
			token.scope ? JSON.stringify(token.scope) : null,
			token.source,
			token.flowType || null,
			token.flowName || null,
			token.environmentId || null,
			token.clientId || null,
			token.metadata ? JSON.stringify(token.metadata) : null,
			token.createdAt,
			token.updatedAt
		);

		stmt.finalize();

		console.log(`[TOKEN-STORAGE] Token stored: ${token.id} (${token.type})`);

		res.json({ success: true, tokenId: token.id });
	} catch (error) {
		console.error('[TOKEN-STORAGE] Error storing token:', error);
		res.status(500).json({
			success: false,
			error: error.message,
		});
	}
}

// Query tokens endpoint
async function queryTokens(req, res) {
	try {
		const db = await getDb();
		const { type, source, environmentId, clientId, activeOnly, expiredOnly } = req.query;

		let query = 'SELECT * FROM tokens WHERE 1=1';
		const params = [];

		if (type) {
			query += ' AND type = ?';
			params.push(type);
		}

		if (source) {
			query += ' AND source = ?';
			params.push(source);
		}

		if (environmentId) {
			query += ' AND environmentId = ?';
			params.push(environmentId);
		}

		if (clientId) {
			query += ' AND clientId = ?';
			params.push(clientId);
		}

		const now = Date.now();
		if (activeOnly === 'true') {
			query += ' AND (expiresAt IS NULL OR expiresAt > ?)';
			params.push(now);
		}

		if (expiredOnly === 'true') {
			query += ' AND expiresAt IS NOT NULL AND expiresAt <= ?';
			params.push(now);
		}

		query += ' ORDER BY updatedAt DESC';

		db.all(query, params, (err, rows) => {
			if (err) {
				console.error('[TOKEN-STORAGE] Error querying tokens:', err);
				res.status(500).json({
					success: false,
					error: err.message,
				});
				return;
			}

			// Parse JSON fields
			const tokens = rows.map((row) => ({
				...row,
				scope: row.scope ? JSON.parse(row.scope) : [],
				metadata: row.metadata ? JSON.parse(row.metadata) : null,
			}));

			console.log(`[TOKEN-STORAGE] Queried ${tokens.length} tokens`);
			res.json(tokens);
		});
	} catch (error) {
		console.error('[TOKEN-STORAGE] Error in query endpoint:', error);
		res.status(500).json({
			success: false,
			error: error.message,
		});
	}
}

// Get specific token endpoint
async function getToken(req, res) {
	try {
		const db = await getDb();
		const { tokenId } = req.params;

		db.get('SELECT * FROM tokens WHERE id = ?', [tokenId], (err, row) => {
			if (err) {
				console.error('[TOKEN-STORAGE] Error getting token:', err);
				res.status(500).json({
					success: false,
					error: err.message,
				});
				return;
			}

			if (!row) {
				res.status(404).json({
					success: false,
					error: 'Token not found',
				});
				return;
			}

			// Parse JSON fields
			const token = {
				...row,
				scope: row.scope ? JSON.parse(row.scope) : [],
				metadata: row.metadata ? JSON.parse(row.metadata) : null,
			};

			console.log(`[TOKEN-STORAGE] Retrieved token: ${tokenId}`);
			res.json(token);
		});
	} catch (error) {
		console.error('[TOKEN-STORAGE] Error in get endpoint:', error);
		res.status(500).json({
			success: false,
			error: error.message,
		});
	}
}

// Delete token endpoint
async function deleteToken(req, res) {
	try {
		const db = await getDb();
		const { tokenId } = req.params;

		db.run('DELETE FROM tokens WHERE id = ?', [tokenId], function (err) {
			if (err) {
				console.error('[TOKEN-STORAGE] Error deleting token:', err);
				res.status(500).json({
					success: false,
					error: err.message,
				});
				return;
			}

			if (this.changes === 0) {
				res.status(404).json({
					success: false,
					error: 'Token not found',
				});
				return;
			}

			console.log(`[TOKEN-STORAGE] Deleted token: ${tokenId}`);
			res.json({ success: true });
		});
	} catch (error) {
		console.error('[TOKEN-STORAGE] Error in delete endpoint:', error);
		res.status(500).json({
			success: false,
			error: error.message,
		});
	}
}

// Clear all tokens endpoint
async function clearTokens(_req, res) {
	try {
		const db = await getDb();

		db.run('DELETE FROM tokens', function (err) {
			if (err) {
				console.error('[TOKEN-STORAGE] Error clearing tokens:', err);
				res.status(500).json({
					success: false,
					error: err.message,
				});
				return;
			}

			console.log(`[TOKEN-STORAGE] Cleared ${this.changes} tokens`);
			res.json({
				success: true,
				deletedCount: this.changes,
			});
		});
	} catch (error) {
		console.error('[TOKEN-STORAGE] Error in clear endpoint:', error);
		res.status(500).json({
			success: false,
			error: error.message,
		});
	}
}

// Cleanup expired tokens endpoint
async function cleanupExpiredTokens(_req, res) {
	try {
		const db = await getDb();
		const now = Date.now();

		db.run(
			'DELETE FROM tokens WHERE expiresAt IS NOT NULL AND expiresAt <= ?',
			[now],
			function (err) {
				if (err) {
					console.error('[TOKEN-STORAGE] Error cleaning up expired tokens:', err);
					res.status(500).json({
						success: false,
						error: err.message,
					});
					return;
				}

				console.log(`[TOKEN-STORAGE] Cleaned up ${this.changes} expired tokens`);
				res.json({
					success: true,
					deletedCount: this.changes,
				});
			}
		);
	} catch (error) {
		console.error('[TOKEN-STORAGE] Error in cleanup endpoint:', error);
		res.status(500).json({
			success: false,
			error: error.message,
		});
	}
}

// Get storage statistics endpoint
async function getStorageStats(_req, res) {
	try {
		const db = await getDb();
		const now = Date.now();

		// Get total count
		db.get('SELECT COUNT(*) as total FROM tokens', (err, totalResult) => {
			if (err) {
				res.status(500).json({ success: false, error: err.message });
				return;
			}

			// Get active count
			db.get(
				'SELECT COUNT(*) as active FROM tokens WHERE expiresAt IS NULL OR expiresAt > ?',
				[now],
				(err, activeResult) => {
					if (err) {
						res.status(500).json({ success: false, error: err.message });
						return;
					}

					// Get expired count
					db.get(
						'SELECT COUNT(*) as expired FROM tokens WHERE expiresAt IS NOT NULL AND expiresAt <= ?',
						[now],
						(err, expiredResult) => {
							if (err) {
								res.status(500).json({ success: false, error: err.message });
								return;
							}

							// Get count by type
							db.all(
								'SELECT type, COUNT(*) as count FROM tokens GROUP BY type',
								(err, typeResults) => {
									if (err) {
										res.status(500).json({ success: false, error: err.message });
										return;
									}

									const stats = {
										total: totalResult.total,
										active: activeResult.active,
										expired: expiredResult.expired,
										byType: typeResults.reduce((acc, row) => {
											acc[row.type] = row.count;
											return acc;
										}, {}),
									};

									res.json(stats);
								}
							);
						}
					);
				}
			);
		});
	} catch (error) {
		console.error('[TOKEN-STORAGE] Error in stats endpoint:', error);
		res.status(500).json({
			success: false,
			error: error.message,
		});
	}
}

// Register routes
function registerTokenStorageRoutes(app) {
	console.log('[TOKEN-STORAGE] Registering token storage API routes');

	// Store token
	app.post('/api/tokens/store', storeToken);

	// Query tokens
	app.get('/api/tokens/query', queryTokens);

	// Get specific token
	app.get('/api/tokens/:tokenId', getToken);

	// Delete token
	app.delete('/api/tokens/:tokenId', deleteToken);

	// Clear all tokens
	app.delete('/api/tokens/clear', clearTokens);

	// Cleanup expired tokens
	app.delete('/api/tokens/cleanup', cleanupExpiredTokens);

	// Get storage statistics
	app.get('/api/tokens/stats', getStorageStats);

	console.log('[TOKEN-STORAGE] Token storage API routes registered');
}

module.exports = {
	registerTokenStorageRoutes,
	initializeDatabase,
	getDb,
};
