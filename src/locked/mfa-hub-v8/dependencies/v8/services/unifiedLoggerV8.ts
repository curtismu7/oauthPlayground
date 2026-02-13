/**
 * @file unifiedLoggerV8.ts
 * @module v8/services
 * @description Unified MFA Logger with runId threading, batch shipping, SQLite fallback
 * @version 8.0.0
 * @since 2025-01-20
 */

import { logger } from '../../utils/logger';

// Record types matching spec
export interface ApiCallRecord {
	runId: string;
	transactionId: string;
	timestamp: number;
	method: string;
	url: string;
	headers: Record<string, string>;
	body?: Record<string, unknown> | undefined;
	response: {
		status: number;
		headers?: Record<string, string>;
		data?: Record<string, unknown>;
	};
	duration: number;
	error?: string;
}

export interface ClientEventRecord {
	runId: string;
	transactionId: string;
	timestamp: number;
	type: 'state_change' | 'user_action' | 'ui_event' | 'error';
	data: Record<string, unknown>;
}

export interface UnifiedLogEntry {
	runId: string;
	timestamp: number;
	type: 'api_call' | 'client_event';
	data: ApiCallRecord | ClientEventRecord;
}

// IndexedDB setup
const INDEXEDDB_DB_NAME = 'oauth_playground_v8';
const INDEXEDDB_STORE_NAME = 'unified_mfa_logs';
const BATCH_SIZE = 100;
const BATCH_INTERVAL = 5000; // 5 seconds

class UnifiedLoggerV8 {
	private runId: string | null = null;
	private logQueue: UnifiedLogEntry[] = [];
	private batchTimer: NodeJS.Timeout | null = null;
	private isShipping = false;
	private consecutiveFailures = 0;
	private maxFailures = 5;

	/**
	 * Initialize logger with runId
	 */
	async initialize(runId: string): Promise<void> {
		this.runId = runId;
		await this.initIndexedDB();
		this.startBatchTimer();
		logger.info('UNIFIED_LOGGER', 'Logger initialized', { runId });
	}

	/**
	 * Set current transaction ID
	 */
	setTransactionId(transactionId: string): void {
		this.transactionId = transactionId;
	}

	/**
	 * Log API call with runId threading
	 */
	async logApiCall(record: Omit<ApiCallRecord, 'runId' | 'timestamp'>): Promise<void> {
		if (!this.runId) {
			logger.error('UNIFIED_LOGGER', 'Cannot log API call: runId not set');
			return;
		}

		const apiRecord: ApiCallRecord = {
			...record,
			runId: this.runId,
			timestamp: Date.now(),
			headers: this.redactHeaders(record.headers),
			body: this.redactBody(record.body),
		};

		const entry: UnifiedLogEntry = {
			runId: this.runId,
			timestamp: Date.now(),
			type: 'api_call',
			data: apiRecord,
		};

		await this.queueEntry(entry);
		logger.api('UNIFIED_LOGGER', 'API call logged', {
			runId: this.runId,
			method: record.method,
			url: record.url,
		});
	}

	/**
	 * Log client event with runId threading
	 */
	async logClientEvent(record: Omit<ClientEventRecord, 'runId' | 'timestamp'>): Promise<void> {
		if (!this.runId) {
			logger.error('UNIFIED_LOGGER', 'Cannot log client event: runId not set');
			return;
		}

		const eventRecord: ClientEventRecord = {
			...record,
			runId: this.runId,
			timestamp: Date.now(),
		};

		const entry: UnifiedLogEntry = {
			runId: this.runId,
			timestamp: Date.now(),
			type: 'client_event',
			data: eventRecord,
		};

		await this.queueEntry(entry);
		logger.ui('UNIFIED_LOGGER', 'Client event logged', {
			runId: this.runId,
			type: record.type,
		});
	}

	/**
	 * Queue entry and trigger batch processing
	 */
	private async queueEntry(entry: UnifiedLogEntry): Promise<void> {
		this.logQueue.push(entry);

		// Immediate flush for critical events
		if (
			entry.type === 'api_call' ||
			(entry.type === 'client_event' && (entry.data as ClientEventRecord).type === 'state_change')
		) {
			await this.flushQueue();
		}
	}

	/**
	 * Initialize IndexedDB for log storage
	 */
	private async initIndexedDB(): Promise<void> {
		return new Promise((resolve, reject) => {
			const request = indexedDB.open(INDEXEDDB_DB_NAME, 1);

			request.onerror = () => {
				logger.error('UNIFIED_LOGGER', 'Failed to open IndexedDB', request.error);
				reject(request.error);
			};

			request.onsuccess = () => {
				logger.info('UNIFIED_LOGGER', 'IndexedDB opened successfully');
				resolve();
			};

			request.onupgradeneeded = (event) => {
				const db = (event.target as IDBOpenDBRequest).result;

				if (!db.objectStoreNames.contains(INDEXEDDB_STORE_NAME)) {
					const store = db.createObjectStore(INDEXEDDB_STORE_NAME, {
						keyPath: 'id',
						autoIncrement: true,
					});
					store.createIndex('runId', 'runId', { unique: false });
					store.createIndex('timestamp', 'timestamp', { unique: false });
				}
			};
		});
	}

	/**
	 * Start batch timer for periodic shipping
	 */
	private startBatchTimer(): void {
		if (this.batchTimer) {
			clearInterval(this.batchTimer);
		}

		this.batchTimer = setInterval(() => {
			if (this.logQueue.length > 0) {
				this.flushQueue();
			}
		}, BATCH_INTERVAL);
	}

	/**
	 * Flush queue to storage and ship to server
	 */
	private async flushQueue(): Promise<void> {
		if (this.logQueue.length === 0 || this.isShipping) {
			return;
		}

		this.isShipping = true;
		const batch = this.logQueue.splice(0, BATCH_SIZE);

		try {
			// Store in IndexedDB first
			await this.storeInIndexedDB(batch);

			// Then ship to server
			await this.shipToServer(batch);

			this.consecutiveFailures = 0;
			logger.info('UNIFIED_LOGGER', 'Batch shipped successfully', {
				batchSize: batch.length,
				runId: this.runId,
			});
		} catch (error) {
			this.consecutiveFailures++;
			logger.error('UNIFIED_LOGGER', 'Batch shipment failed', {
				error: error instanceof Error ? error.message : String(error),
				consecutiveFailures: this.consecutiveFailures,
				batchSize: batch.length,
			});

			// Re-queue failed batch for retry
			this.logQueue.unshift(...batch);

			// Circuit breaker: stop shipping after max failures
			if (this.consecutiveFailures >= this.maxFailures) {
				logger.error('UNIFIED_LOGGER', 'Circuit breaker triggered - stopping shipments');
				this.stopShipping();
			}
		} finally {
			this.isShipping = false;
		}
	}

	/**
	 * Store batch in IndexedDB
	 */
	private async storeInIndexedDB(batch: UnifiedLogEntry[]): Promise<void> {
		return new Promise((resolve, reject) => {
			const request = indexedDB.open(INDEXEDDB_DB_NAME, 1);

			request.onsuccess = () => {
				const db = request.result;
				const transaction = db.transaction([INDEXEDDB_STORE_NAME], 'readwrite');
				const store = transaction.objectStore(INDEXEDDB_STORE_NAME);

				batch.forEach((entry) => {
					store.add({
						...entry,
						id: `${entry.runId}-${entry.timestamp}-${Math.random()}`,
					});
				});

				transaction.oncomplete = () => resolve();
				transaction.onerror = () => reject(transaction.error);
			};

			request.onerror = () => reject(request.error);
		});
	}

	/**
	 * Ship batch to server
	 */
	private async shipToServer(batch: UnifiedLogEntry[]): Promise<void> {
		const batchId = `${this.runId}-${Date.now()}`;
		const records = JSON.stringify(batch);
		const checksum = await this.sha256(records);

		const payload = {
			batchId,
			checksum,
			records: batch,
			timestamp: Date.now(),
		};

		const response = await fetch('/api/logs', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(payload),
		});

		if (!response.ok) {
			throw new Error(`Server responded: ${response.status} ${response.statusText}`);
		}

		return response.json();
	}

	/**
	 * Calculate SHA256 checksum
	 */
	private async sha256(message: string): Promise<string> {
		const msgBuffer = new TextEncoder().encode(message);
		const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
		const hashArray = Array.from(new Uint8Array(hashBuffer));
		return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
	}

	/**
	 * Redact sensitive headers
	 */
	private redactHeaders(headers: Record<string, string>): Record<string, string> {
		const redacted = { ...headers };

		// Redact sensitive headers
		if (redacted.Authorization) {
			redacted.Authorization = '[REDACTED]';
		}
		if (redacted['client-secret']) {
			redacted['client-secret'] = '[REDACTED]';
		}

		return redacted;
	}

	/**
	 * Redact sensitive body data
	 */
	private redactBody(body?: Record<string, unknown>): Record<string, unknown> | undefined {
		if (!body) return body;

		const redacted = { ...body };

		// Redact client secrets
		if ('client_secret' in redacted) {
			redacted.client_secret = '[REDACTED]';
		}
		if ('password' in redacted) {
			redacted.password = '[REDACTED]';
		}

		return redacted;
	}

	/**
	 * Stop shipping (circuit breaker)
	 */
	private stopShipping(): void {
		if (this.batchTimer) {
			clearInterval(this.batchTimer);
			this.batchTimer = null;
		}
	}

	/**
	 * Cleanup resources
	 */
	cleanup(): void {
		this.stopShipping();
		this.runId = null;
		this.transactionId = null;
		this.logQueue = [];
	}

	/**
	 * Get logs for verification
	 */
	async getLogs(runId?: string): Promise<UnifiedLogEntry[]> {
		return new Promise((resolve, reject) => {
			const openRequest = indexedDB.open(INDEXEDDB_DB_NAME, 1);

			openRequest.onsuccess = () => {
				const db = openRequest.result;
				const transaction = db.transaction([INDEXEDDB_STORE_NAME], 'readonly');
				const store = transaction.objectStore(INDEXEDDB_STORE_NAME);
				const index = runId ? store.index('runId') : store;
				const results: UnifiedLogEntry[] = [];

				const cursorRequest = runId
					? index.openCursor(IDBKeyRange.only(runId))
					: store.openCursor();

				cursorRequest.onsuccess = (event: Event) => {
					const cursor = (event.target as IDBRequest).result;
					if (cursor) {
						results.push(cursor.value);
						cursor.continue();
					} else {
						resolve(results);
					}
				};

				cursorRequest.onerror = () => reject(cursorRequest.error);
			};

			openRequest.onerror = () => reject(openRequest.error);
		});
	}
}

// Singleton instance
export const unifiedLoggerV8 = new UnifiedLoggerV8();
export default unifiedLoggerV8;
