/**
 * @file databaseApiRoutes.ts
 * @description API routes for database viewing functionality
 * @version 1.0.0
 * @since 2026-03-10
 *
 * Provides REST API endpoints for:
 * - SQLite database schema inspection
 * - Table data querying with pagination and search
 * - Database metadata and statistics
 */

import { Router } from 'express';
import { logger } from '../../utils/logger';

const MODULE_TAG = '[🗄️ DB-API]';

const router = Router();

// ============================================================================
// SQLITE DATABASE ACCESS
// ============================================================================

/**
 * Get SQLite database schema and metadata
 */
router.get('/sqlite/schema', async (req, res) => {
	try {
		const db = req.app.get('db'); // Get database connection from app

		if (!db) {
			return res.status(500).json({
				error: 'Database connection not available',
				message: 'SQLite database not initialized',
			});
		}

		// Get all table names
		const tablesQuery = `
			SELECT name as table_name 
			FROM sqlite_master 
			WHERE type='table' AND name NOT LIKE 'sqlite_%'
			ORDER BY name
		`;

		const tables = await new Promise<any[]>((resolve, reject) => {
			db.all(tablesQuery, (err, rows) => {
				if (err) reject(err);
				else resolve(rows);
			});
		});

		// Get detailed information for each table
		const tableDetails = await Promise.all(
			tables.map(async (table) => {
				// Get column information
				const columnsQuery = `PRAGMA table_info(${table.table_name})`;
				const columns = await new Promise<any[]>((resolve, reject) => {
					db.all(columnsQuery, (err, rows) => {
						if (err) reject(err);
						else resolve(rows);
					});
				});

				// Get row count
				const countQuery = `SELECT COUNT(*) as count FROM ${table.table_name}`;
				const countResult = await new Promise<{ count: number }>((resolve, reject) => {
					db.get(countQuery, (err, row) => {
						if (err) reject(err);
						else resolve(row);
					});
				});

				// Get sample data (first 5 rows)
				const sampleQuery = `SELECT * FROM ${table.table_name} LIMIT 5`;
				const sampleData = await new Promise<any[]>((resolve, reject) => {
					db.all(sampleQuery, (err, rows) => {
						if (err) reject(err);
						else resolve(rows);
					});
				});

				return {
					name: table.table_name,
					rowCount: countResult.count,
					columns: columns.map((col) => ({
						name: col.name,
						type: col.type || 'TEXT',
						nullable: !col.notnull,
						primaryKey: col.pk === 1,
						defaultValue: col.dflt_value,
					})),
					sampleData,
				};
			})
		);

		// Get database file size
		const dbPath = req.app.get('dbPath');
		let dbSize = 0;
		if (dbPath) {
			try {
				const fs = await import('fs');
				const stats = fs.statSync(dbPath);
				dbSize = stats.size;
			} catch (error) {
				logger.warn(`${MODULE_TAG} Could not get database file size:`, error);
			}
		}

		const schema = {
			name: 'PingOne Cache Database',
			type: 'sqlite',
			tables: tableDetails,
			metadata: {
				size: dbSize,
				version: '1.0.0',
				createdAt: new Date().toISOString(),
				lastModified: new Date().toISOString(),
			},
		};

		res.json(schema);
	} catch (error) {
		logger.error(`${MODULE_TAG} Failed to get SQLite schema:`, error);
		res.status(500).json({
			error: 'Failed to get database schema',
			message: error instanceof Error ? error.message : 'Unknown error',
		});
	}
});

/**
 * Get list of available tables
 */
router.get('/sqlite/tables', async (req, res) => {
	try {
		const db = req.app.get('db');

		if (!db) {
			return res.status(500).json({
				error: 'Database connection not available',
			});
		}

		const query = `
			SELECT name as table_name 
			FROM sqlite_master 
			WHERE type='table' AND name NOT LIKE 'sqlite_%'
			ORDER BY name
		`;

		const tables = await new Promise<any[]>((resolve, reject) => {
			db.all(query, (err, rows) => {
				if (err) reject(err);
				else resolve(rows);
			});
		});

		res.json({
			tables: tables.map((t) => t.table_name),
		});
	} catch (error) {
		logger.error(`${MODULE_TAG} Failed to get SQLite tables:`, error);
		res.status(500).json({
			error: 'Failed to get tables',
			message: error instanceof Error ? error.message : 'Unknown error',
		});
	}
});

/**
 * Query table data with pagination and search
 */
router.get('/sqlite/query', async (req, res) => {
	try {
		const { table, limit = '100', offset = '0', where, orderBy, search } = req.query;

		if (!table || typeof table !== 'string') {
			return res.status(400).json({
				error: 'Table name is required',
			});
		}

		const db = req.app.get('db');

		if (!db) {
			return res.status(500).json({
				error: 'Database connection not available',
			});
		}

		const startTime = Date.now();

		// Validate table name to prevent SQL injection
		const tableRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
		if (!tableRegex.test(table)) {
			return res.status(400).json({
				error: 'Invalid table name',
			});
		}

		// Build WHERE clause
		let whereClause = '';
		const params: any[] = [];

		if (where && typeof where === 'string') {
			whereClause = `WHERE ${where}`;
		} else if (search && typeof search === 'string') {
			// Get table columns to build search clause
			const columnsQuery = `PRAGMA table_info(${table})`;
			const columns = await new Promise<any[]>((resolve, reject) => {
				db.all(columnsQuery, (err, rows) => {
					if (err) reject(err);
					else resolve(rows);
				});
			});

			const searchConditions = columns
				.filter(
					(col) =>
						col.type?.toUpperCase().includes('TEXT') || col.type?.toUpperCase().includes('CHAR')
				)
				.map((col) => `${col.name} LIKE ?`)
				.join(' OR ');

			if (searchConditions) {
				whereClause = `WHERE ${searchConditions}`;
				const searchTerm = `%${search}%`;
				columns.forEach((col) => {
					if (
						col.type?.toUpperCase().includes('TEXT') ||
						col.type?.toUpperCase().includes('CHAR')
					) {
						params.push(searchTerm);
					}
				});
			}
		}

		// Build ORDER BY clause
		let orderByClause = '';
		if (orderBy && typeof orderBy === 'string') {
			orderByClause = `ORDER BY ${orderBy}`;
		}

		// Get total row count
		const countQuery = `SELECT COUNT(*) as total FROM ${table} ${whereClause}`;
		const totalResult = await new Promise<{ total: number }>((resolve, reject) => {
			db.get(countQuery, params, (err, row) => {
				if (err) reject(err);
				else resolve(row);
			});
		});

		// Get data with pagination
		const limitNum = Math.min(parseInt(limit) || 100, 1000); // Max 1000 rows
		const offsetNum = Math.max(parseInt(offset) || 0, 0);

		const dataQuery = `SELECT * FROM ${table} ${whereClause} ${orderByClause} LIMIT ? OFFSET ?`;
		const dataParams = [...params, limitNum, offsetNum];

		const rows = await new Promise<any[]>((resolve, reject) => {
			db.all(dataQuery, dataParams, (err, rows) => {
				if (err) reject(err);
				else resolve(rows);
			});
		});

		// Get column information
		const columnsQuery = `PRAGMA table_info(${table})`;
		const columns = await new Promise<any[]>((resolve, reject) => {
			db.all(columnsQuery, (err, rows) => {
				if (err) reject(err);
				else resolve(rows);
			});
		});

		const executionTime = Date.now() - startTime;

		const result = {
			data: rows,
			totalRows: totalResult.total,
			columns: columns.map((col) => ({
				name: col.name,
				type: col.type || 'TEXT',
				nullable: !col.notnull,
				primaryKey: col.pk === 1,
			})),
			executionTime,
			query: dataQuery,
		};

		res.json(result);
	} catch (error) {
		logger.error(`${MODULE_TAG} Failed to query SQLite table:`, error);
		res.status(500).json({
			error: 'Failed to query table',
			message: error instanceof Error ? error.message : 'Unknown error',
		});
	}
});

/**
 * Get database statistics
 */
router.get('/sqlite/stats', async (req, res) => {
	try {
		const db = req.app.get('db');

		if (!db) {
			return res.status(500).json({
				error: 'Database connection not available',
			});
		}

		// Get table counts
		const tableCountQuery = `
			SELECT COUNT(*) as count 
			FROM sqlite_master 
			WHERE type='table' AND name NOT LIKE 'sqlite_%'
		`;

		const tableCount = await new Promise<{ count: number }>((resolve, reject) => {
			db.get(tableCountQuery, (err, row) => {
				if (err) reject(err);
				else resolve(row);
			});
		});

		// Get total row counts across all tables
		const tablesQuery = `
			SELECT name FROM sqlite_master 
			WHERE type='table' AND name NOT LIKE 'sqlite_%'
		`;

		const tables = await new Promise<any[]>((resolve, reject) => {
			db.all(tablesQuery, (err, rows) => {
				if (err) reject(err);
				else resolve(rows);
			});
		});

		let totalRows = 0;
		const tableStats = await Promise.all(
			tables.map(async (table) => {
				const countQuery = `SELECT COUNT(*) as count FROM ${table.name}`;
				const countResult = await new Promise<{ count: number }>((resolve, reject) => {
					db.get(countQuery, (err, row) => {
						if (err) reject(err);
						else resolve(row);
					});
				});

				totalRows += countResult.count;

				return {
					name: table.name,
					rowCount: countResult.count,
				};
			})
		);

		// Get database file size
		const dbPath = req.app.get('dbPath');
		let dbSize = 0;
		if (dbPath) {
			try {
				const fs = await import('fs');
				const stats = fs.statSync(dbPath);
				dbSize = stats.size;
			} catch (error) {
				logger.warn(`${MODULE_TAG} Could not get database file size:`, error);
			}
		}

		const stats = {
			tableCount: tableCount.count,
			totalRows,
			dbSize,
			tableStats,
			lastUpdated: new Date().toISOString(),
		};

		res.json(stats);
	} catch (error) {
		logger.error(`${MODULE_TAG} Failed to get SQLite stats:`, error);
		res.status(500).json({
			error: 'Failed to get database statistics',
			message: error instanceof Error ? error.message : 'Unknown error',
		});
	}
});

export default router;
