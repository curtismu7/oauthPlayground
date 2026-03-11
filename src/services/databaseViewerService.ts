/**
 * @file databaseViewerService.ts
 * @description Service for viewing IndexedDB and SQLite database contents in the log viewer
 * @version 1.0.0
 * @since 2026-03-10
 *
 * Provides unified access to:
 * - IndexedDB (browser-side storage for tokens, credentials, etc.)
 * - SQLite (server-side storage for user cache, credentials, etc.)
 * - Search and filtering capabilities
 * - Export functionality
 */

import { logger } from '../utils/logger';

const MODULE_TAG = '[🗄️ DB-VIEWER]';

// ============================================================================
// INTERFACES
// ============================================================================

export interface DatabaseTable {
	name: string;
	rowCount: number;
	columns: DatabaseColumn[];
	sampleData: Record<string, unknown>[];
}

export interface DatabaseColumn {
	name: string;
	type: string;
	nullable: boolean;
	primaryKey?: boolean;
}

export interface DatabaseSchema {
	name: string;
	type: 'indexeddb' | 'sqlite';
	tables: DatabaseTable[];
	metadata: {
		size?: number;
		createdAt?: string;
		lastModified?: string;
		version?: string;
	};
}

export interface DatabaseQueryResult {
	data: Record<string, unknown>[];
	totalRows: number;
	columns: DatabaseColumn[];
	executionTime: number;
	query: string;
}

export interface DatabaseViewerOptions {
	limit?: number;
	offset?: number;
	where?: string;
	orderBy?: string;
	search?: string;
}

// ============================================================================
// INDEXEDDB SERVICE
// ============================================================================

class IndexedDBViewerService {
	private static readonly DB_NAME = 'OAuthPlaygroundTokenStorage';
	private static readonly DB_VERSION = 1;

	/**
	 * Get IndexedDB schema and table information
	 */
	static async getSchema(): Promise<DatabaseSchema> {
		try {
			const db = await IndexedDBViewerService.openDatabase();
			const tables: DatabaseTable[] = [];

			// Get all object stores
			const storeNames = Array.from(db.objectStoreNames);

			for (const storeName of storeNames) {
				const table = await IndexedDBViewerService.getTableInfo(db, storeName);
				tables.push(table);
			}

			// Get database metadata
			const metadata = await IndexedDBViewerService.getIndexedDBMetadata(db);

			db.close();

			return {
				name: IndexedDBViewerService.DB_NAME,
				type: 'indexeddb',
				tables,
				metadata,
			};
		} catch (error) {
			logger.error(`${MODULE_TAG} Failed to get IndexedDB schema:`, error);
			throw error;
		}
	}

	/**
	 * Query data from IndexedDB table
	 */
	static async queryTable(
		tableName: string,
		options: DatabaseViewerOptions = {}
	): Promise<DatabaseQueryResult> {
		const startTime = Date.now();

		try {
			const db = await IndexedDBViewerService.openDatabase();
			const transaction = db.transaction([tableName], 'readonly');
			const store = transaction.objectStore(tableName);

			const data: Record<string, unknown>[] = [];
			const limit = options.limit || 100;
			const offset = options.offset || 0;

			// Get all data with pagination
			let count = 0;
			let skipped = 0;

			return new Promise((resolve, reject) => {
				const request = store.openCursor();

				request.onsuccess = (event) => {
					const cursor = (event.target as IDBRequest).result;

					if (cursor) {
						if (skipped < offset) {
							skipped++;
							cursor.continue();
							return;
						}

						if (count < limit) {
							const record = cursor.value;

							// Apply search filter if provided
							if (options.search) {
								const searchLower = options.search.toLowerCase();
								const recordString = JSON.stringify(record).toLowerCase();
								if (recordString.includes(searchLower)) {
									data.push(record);
									count++;
								}
							} else {
								data.push(record);
								count++;
							}

							cursor.continue();
						} else {
							// Done
							const executionTime = Date.now() - startTime;
							const columns = IndexedDBViewerService.inferColumns(data);

							resolve({
								data,
								totalRows: await IndexedDBViewerService.getTableRowCount(store),
								columns,
								executionTime,
								query: `SELECT * FROM ${tableName} LIMIT ${limit} OFFSET ${offset}`,
							});
						}
					} else {
						// No more cursor
						const executionTime = Date.now() - startTime;
						const columns = IndexedDBViewerService.inferColumns(data);

						resolve({
							data,
							totalRows: await IndexedDBViewerService.getTableRowCount(store),
							columns,
							executionTime,
							query: `SELECT * FROM ${tableName} LIMIT ${limit} OFFSET ${offset}`,
						});
					}
				};

				request.onerror = () => {
					reject(new Error(`Failed to query IndexedDB table: ${tableName}`));
				};
			});
		} catch (error) {
			logger.error(`${MODULE_TAG} Failed to query IndexedDB table ${tableName}:`, error);
			throw error;
		}
	}

	/**
	 * Open IndexedDB connection
	 */
	private static async openDatabase(): Promise<IDBDatabase> {
		return new Promise((resolve, reject) => {
			const request = indexedDB.open(
				IndexedDBViewerService.DB_NAME,
				IndexedDBViewerService.DB_VERSION
			);

			request.onsuccess = () => {
				resolve(request.result);
			};

			request.onerror = () => {
				reject(new Error(`Failed to open IndexedDB: ${request.error}`));
			};
		});
	}

	/**
	 * Get table information for IndexedDB object store
	 */
	private static async getTableInfo(db: IDBDatabase, storeName: string): Promise<DatabaseTable> {
		const transaction = db.transaction([storeName], 'readonly');
		const store = transaction.objectStore(storeName);

		const rowCount = await IndexedDBViewerService.getTableRowCount(store);
		const sampleData = await IndexedDBViewerService.getSampleData(store, 5);
		const columns = IndexedDBViewerService.inferColumns(sampleData);

		return {
			name: storeName,
			rowCount,
			columns,
			sampleData,
		};
	}

	/**
	 * Get row count for IndexedDB object store
	 */
	private static async getTableRowCount(store: IDBObjectStore): Promise<number> {
		return new Promise((resolve, reject) => {
			const request = store.count();

			request.onsuccess = () => {
				resolve(request.result);
			};

			request.onerror = () => {
				reject(new Error(`Failed to count rows: ${request.error}`));
			};
		});
	}

	/**
	 * Get sample data from IndexedDB object store
	 */
	private static async getSampleData(
		store: IDBObjectStore,
		limit: number
	): Promise<Record<string, unknown>[]> {
		return new Promise((resolve, reject) => {
			const data: Record<string, unknown>[] = [];
			let count = 0;

			const request = store.openCursor();

			request.onsuccess = (event) => {
				const cursor = (event.target as IDBRequest).result;

				if (cursor && count < limit) {
					data.push(cursor.value);
					count++;
					cursor.continue();
				} else {
					resolve(data);
				}
			};

			request.onerror = () => {
				reject(new Error(`Failed to get sample data: ${request.error}`));
			};
		});
	}

	/**
	 * Infer column information from data
	 */
	private static inferColumns(data: Record<string, unknown>[]): DatabaseColumn[] {
		if (data.length === 0) return [];

		const columns: DatabaseColumn[] = [];
		const sampleRecord = data[0];

		for (const [key, value] of Object.entries(sampleRecord)) {
			const type = IndexedDBViewerService.getValueType(value);

			columns.push({
				name: key,
				type,
				nullable: data.some((record) => record[key] == null),
			});
		}

		return columns;
	}

	/**
	 * Get value type for database column inference
	 */
	private static getValueType(value: unknown): string {
		if (value === null) return 'null';
		if (value === undefined) return 'undefined';
		if (typeof value === 'string') return 'string';
		if (typeof value === 'number') return 'number';
		if (typeof value === 'boolean') return 'boolean';
		if (value instanceof Date) return 'date';
		if (Array.isArray(value)) return 'array';
		if (typeof value === 'object') return 'object';
		return 'unknown';
	}

	/**
	 * Get IndexedDB metadata
	 */
	private static async getIndexedDBMetadata(db: IDBDatabase): Promise<DatabaseSchema['metadata']> {
		// Try to get storage estimate
		let size: number | undefined;

		if ('storage' in navigator && 'estimate' in navigator.storage) {
			try {
				const estimate = await navigator.storage.estimate();
				size = estimate.usage;
			} catch (error) {
				logger.warn(`${MODULE_TAG} Failed to get storage estimate:`, error);
			}
		}

		return {
			size,
			version: db.version.toString(),
			createdAt: new Date().toISOString(), // IndexedDB doesn't store creation time
			lastModified: new Date().toISOString(),
		};
	}
}

// ============================================================================
// SQLITE SERVICE
// ============================================================================

class SQLiteViewerService {
	/**
	 * Get SQLite database schema
	 */
	static async getSchema(): Promise<DatabaseSchema> {
		try {
			const response = await fetch('/api/database/sqlite/schema');

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}

			const data = await response.json();

			return {
				name: 'PingOne Cache',
				type: 'sqlite',
				tables: data.tables,
				metadata: data.metadata,
			};
		} catch (error) {
			logger.error(`${MODULE_TAG} Failed to get SQLite schema:`, error);
			throw error;
		}
	}

	/**
	 * Query SQLite database
	 */
	static async queryTable(
		tableName: string,
		options: DatabaseViewerOptions = {}
	): Promise<DatabaseQueryResult> {
		try {
			const params = new URLSearchParams({
				table: tableName,
				limit: (options.limit || 100).toString(),
				offset: (options.offset || 0).toString(),
			});

			if (options.where) params.append('where', options.where);
			if (options.orderBy) params.append('orderBy', options.orderBy);
			if (options.search) params.append('search', options.search);

			const response = await fetch(`/api/database/sqlite/query?${params}`);

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}

			const data = await response.json();

			return {
				data: data.rows,
				totalRows: data.totalRows,
				columns: data.columns,
				executionTime: data.executionTime,
				query: data.query,
			};
		} catch (error) {
			logger.error(`${MODULE_TAG} Failed to query SQLite table ${tableName}:`, error);
			throw error;
		}
	}

	/**
	 * Get available SQLite tables
	 */
	static async getTables(): Promise<string[]> {
		try {
			const response = await fetch('/api/database/sqlite/tables');

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}

			const data = await response.json();
			return data.tables;
		} catch (error) {
			logger.error(`${MODULE_TAG} Failed to get SQLite tables:`, error);
			throw error;
		}
	}
}

// ============================================================================
// MAIN SERVICE
// ============================================================================

export class DatabaseViewerService {
	/**
	 * Get all available databases
	 */
	static async getAvailableDatabases(): Promise<DatabaseSchema[]> {
		const databases: DatabaseSchema[] = [];

		try {
			// Get IndexedDB schema
			const indexedDbSchema = await IndexedDBViewerService.getSchema();
			databases.push(indexedDbSchema);
		} catch (error) {
			logger.warn(`${MODULE_TAG} Failed to get IndexedDB schema:`, error);
		}

		try {
			// Get SQLite schema
			const sqliteSchema = await SQLiteViewerService.getSchema();
			databases.push(sqliteSchema);
		} catch (error) {
			logger.warn(`${MODULE_TAG} Failed to get SQLite schema:`, error);
		}

		return databases;
	}

	/**
	 * Query database table
	 */
	static async queryTable(
		databaseType: 'indexeddb' | 'sqlite',
		tableName: string,
		options?: DatabaseViewerOptions
	): Promise<DatabaseQueryResult> {
		if (databaseType === 'indexeddb') {
			return IndexedDBViewerService.queryTable(tableName, options);
		} else {
			return SQLiteViewerService.queryTable(tableName, options);
		}
	}

	/**
	 * Export table data to JSON
	 */
	static async exportTable(
		databaseType: 'indexeddb' | 'sqlite',
		tableName: string,
		format: 'json' | 'csv' = 'json'
	): Promise<string> {
		const result = await DatabaseViewerService.queryTable(databaseType, tableName, {
			limit: 10000,
		});

		if (format === 'json') {
			return JSON.stringify(result.data, null, 2);
		} else if (format === 'csv') {
			return DatabaseViewerService.convertToCSV(result.data, result.columns);
		}

		throw new Error(`Unsupported export format: ${format}`);
	}

	/**
	 * Convert data to CSV format
	 */
	private static convertToCSV(data: Record<string, unknown>[], columns: DatabaseColumn[]): string {
		if (data.length === 0) return '';

		// Header row
		const headers = columns.map((col) => col.name).join(',');

		// Data rows
		const rows = data.map((record) => {
			return columns
				.map((col) => {
					const value = record[col.name];
					if (value === null || value === undefined) return '';
					if (typeof value === 'string' && value.includes(',')) {
						return `"${value.replace(/"/g, '""')}"`;
					}
					return String(value);
				})
				.join(',');
		});

		return [headers, ...rows].join('\n');
	}
}

export default DatabaseViewerService;
