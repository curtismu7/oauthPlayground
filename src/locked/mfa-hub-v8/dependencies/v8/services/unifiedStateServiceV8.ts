/**
 * @file unifiedStateServiceV8.ts
 * @module v8/services
 * @description Unified MFA State Machine with canonical states, transitions, persistence
 * @version 8.0.0
 * @since 2025-01-20
 */

import { unifiedLoggerV8 } from './unifiedLoggerV8';

// Canonical states from spec
export type UnifiedMFAState =
	| 'INIT'
	| 'CONFIG'
	| 'DEVICE_DISCOVERY'
	| 'AUTH_INIT'
	| 'AUTH_VERIFY'
	| 'SUCCESS'
	| 'ERROR';

// Events that drive state transitions
export type UnifiedMFAEvent =
	| 'WORKER_TOKEN_LOADED'
	| 'CONFIG_COMPLETE'
	| 'FACTOR_SELECTED'
	| 'CHALLENGE_SENT'
	| 'VERIFICATION_SUCCESS'
	| 'VERIFICATION_FAILED'
	| 'ERROR_OCCURRED'
	| 'CANCEL'
	| 'RESET';

// MFA Factor types
export interface MFAFactor {
	id: string;
	type: 'sms' | 'email' | 'push' | 'webauthn';
	displayName: string;
	status: 'ACTIVE' | 'PENDING' | 'SUSPENDED';
	deviceId?: string;
	phoneNumber?: string;
	emailAddress?: string;
}

// Challenge data for different factor types
export interface ChallengeData {
	factorId: string;
	factorType: string;
	challengeId?: string;
	otpLength?: number;
	expiresAt?: number;
	pollingUrl?: string;
	publicKey?: {
		credentialId: string;
		challenge: string;
		user: {
			id: string;
			name: string;
			displayName: string;
		};
	};
}

// Main state interface
export interface UnifiedMFAStateData {
	runId: string;
	envId: string;
	userId?: string;
	transactionId: string;
	state: UnifiedMFAState;
	workerToken?: {
		token: string;
		expiresAt: number;
	};
	selectedFactor?: MFAFactor;
	challengeData?: ChallengeData;
	error?: {
		code: string;
		message: string;
		retryable: boolean;
	};
	createdAt: number;
	updatedAt: number;
}

// IndexedDB setup
const INDEXEDDB_DB_NAME = 'oauth_playground_v8';
const INDEXEDDB_STORE_NAME = 'unified_mfa_sessions';

class UnifiedStateServiceV8 {
	private currentState: UnifiedMFAStateData | null = null;
	private runId: string | null = null;
	private stateChangeListeners: Set<(state: UnifiedMFAStateData) => void> = new Set();
	private errorListeners: Set<(error: Error, state: UnifiedMFAStateData) => void> = new Set();

	// State transition matrix
	private readonly transitions: Record<
		UnifiedMFAState,
		Partial<Record<UnifiedMFAEvent, UnifiedMFAState>>
	> = {
		INIT: {
			WORKER_TOKEN_LOADED: 'CONFIG',
			ERROR_OCCURRED: 'ERROR',
			CANCEL: 'INIT',
			RESET: 'INIT',
		},
		CONFIG: {
			CONFIG_COMPLETE: 'DEVICE_DISCOVERY',
			ERROR_OCCURRED: 'ERROR',
			CANCEL: 'INIT',
			RESET: 'INIT',
		},
		DEVICE_DISCOVERY: {
			FACTOR_SELECTED: 'AUTH_INIT',
			ERROR_OCCURRED: 'ERROR',
			CANCEL: 'CONFIG',
			RESET: 'INIT',
		},
		AUTH_INIT: {
			CHALLENGE_SENT: 'AUTH_VERIFY',
			ERROR_OCCURRED: 'ERROR',
			CANCEL: 'CONFIG',
			RESET: 'INIT',
		},
		AUTH_VERIFY: {
			VERIFICATION_SUCCESS: 'SUCCESS',
			VERIFICATION_FAILED: 'AUTH_INIT', // Retry auth
			ERROR_OCCURRED: 'ERROR',
			CANCEL: 'CONFIG',
			RESET: 'INIT',
		},
		SUCCESS: {
			RESET: 'INIT',
			CANCEL: 'INIT',
		},
		ERROR: {
			RESET: 'INIT',
			CANCEL: 'INIT',
		},
	};

	/**
	 * Initialize state machine with runId
	 */
	async initialize(runId: string, envId: string): Promise<UnifiedMFAStateData> {
		this.runId = runId;

		// Try to resume existing session
		const existingState = await this.loadState(runId);
		if (existingState && this.canResume(existingState)) {
			this.currentState = existingState;
			await this.logStateChange('INIT', existingState.state, 'Resumed existing session');
			return existingState;
		}

		// Create new state
		const newState: UnifiedMFAStateData = {
			runId,
			envId,
			transactionId: this.generateTransactionId(),
			state: 'INIT',
			createdAt: Date.now(),
			updatedAt: Date.now(),
		};

		this.currentState = newState;
		await this.saveState(newState);
		await this.logStateChange('INIT', 'INIT', 'New session created');

		return newState;
	}

	/**
	 * Process event and transition state
	 */
	async processEvent(
		event: UnifiedMFAEvent,
		data?: Partial<UnifiedMFAStateData>
	): Promise<UnifiedMFAStateData> {
		if (!this.currentState) {
			throw new Error('State machine not initialized');
		}

		const currentState = this.currentState.state;
		const validTransitions = this.transitions[currentState];
		const nextState = validTransitions?.[event];

		if (!nextState) {
			throw new Error(`Invalid transition: ${currentState} + ${event}`);
		}

		const newState: UnifiedMFAStateData = {
			...this.currentState,
			state: nextState,
			transactionId: this.generateTransactionId(),
			updatedAt: Date.now(),
			...data,
		};

		// Handle special cases
		if (event === 'ERROR_OCCURRED' && data?.error) {
			newState.error = data.error;
		}

		// Write-ahead logging before state change
		await this.logStateChange(currentState, newState.state, `Event: ${event}`);

		// Save new state
		this.currentState = newState;
		await this.saveState(newState);

		// Notify listeners
		this.notifyStateChange(newState);

		return newState;
	}

	/**
	 * Get current state
	 */
	getCurrentState(): UnifiedMFAStateData | null {
		return this.currentState;
	}

	/**
	 * Check if state can be resumed
	 */
	private canResume(state: UnifiedMFAStateData): boolean {
		// Don't resume completed or error states
		if (state.state === 'SUCCESS' || state.state === 'ERROR') {
			return false;
		}

		// Check if worker token is still valid (if present)
		if (state.workerToken && state.workerToken.expiresAt < Date.now()) {
			return false;
		}

		// Check if session is too old (7 days for active sessions)
		const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
		if (Date.now() - state.updatedAt > maxAge) {
			return false;
		}

		return true;
	}

	/**
	 * Save state to IndexedDB
	 */
	private async saveState(state: UnifiedMFAStateData): Promise<void> {
		return new Promise((resolve, reject) => {
			const request = indexedDB.open(INDEXEDDB_DB_NAME, 1);

			request.onsuccess = () => {
				const db = request.result;

				// Create store if not exists
				if (!db.objectStoreNames.contains(INDEXEDDB_STORE_NAME)) {
					const transaction = db.createObjectStore(INDEXEDDB_STORE_NAME, { keyPath: 'runId' });
					transaction.createIndex('envId', 'envId', { unique: false });
					transaction.createIndex('userId', 'userId', { unique: false });
					transaction.createIndex('updatedAt', 'updatedAt', { unique: false });
				}

				const transaction = db.transaction([INDEXEDDB_STORE_NAME], 'readwrite');
				const store = transaction.objectStore(INDEXEDDB_STORE_NAME);

				const putRequest = store.put(state);
				putRequest.onsuccess = () => resolve();
				putRequest.onerror = () => reject(putRequest.error);
			};

			request.onerror = () => reject(request.error);
		});
	}

	/**
	 * Load state from IndexedDB
	 */
	private async loadState(runId: string): Promise<UnifiedMFAStateData | null> {
		return new Promise((resolve, reject) => {
			const request = indexedDB.open(INDEXEDDB_DB_NAME, 1);

			request.onsuccess = () => {
				const db = request.result;
				const transaction = db.transaction([INDEXEDDB_STORE_NAME], 'readonly');
				const store = transaction.objectStore(INDEXEDDB_STORE_NAME);

				const getRequest = store.get(runId);
				getRequest.onsuccess = () => resolve(getRequest.result || null);
				getRequest.onerror = () => reject(getRequest.error);
			};

			request.onerror = () => reject(request.error);
		});
	}

	/**
	 * Generate unique transaction ID
	 */
	private generateTransactionId(): string {
		return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
	}

	/**
	 * Log state change to unified logger
	 */
	private async logStateChange(
		from: UnifiedMFAState,
		to: UnifiedMFAState,
		reason: string
	): Promise<void> {
		if (!this.runId) return;

		await unifiedLoggerV8.logClientEvent({
			transactionId: this.currentState?.transactionId || 'unknown',
			type: 'state_change',
			data: {
				from,
				to,
				reason,
				timestamp: Date.now(),
			},
		});
	}

	/**
	 * Notify state change listeners
	 */
	private notifyStateChange(state: UnifiedMFAStateData): void {
		this.stateChangeListeners.forEach((listener) => {
			try {
				listener(state);
			} catch (error) {
				console.error('State change listener error:', error);
			}
		});
	}

	/**
	 * Add state change listener
	 */
	onStateChange(listener: (state: UnifiedMFAStateData) => void): () => void {
		this.stateChangeListeners.add(listener);
		return () => this.stateChangeListeners.delete(listener);
	}

	/**
	 * Add error listener
	 */
	onError(listener: (error: Error, state: UnifiedMFAStateData) => void): () => void {
		this.errorListeners.add(listener);
		return () => this.errorListeners.delete(listener);
	}

	/**
	 * Clear all state (for testing or reset)
	 */
	async clearState(): Promise<void> {
		if (!this.runId) return;

		return new Promise((resolve, reject) => {
			const request = indexedDB.open(INDEXEDDB_DB_NAME, 1);

			request.onsuccess = () => {
				const db = request.result;
				const transaction = db.transaction([INDEXEDDB_STORE_NAME], 'readwrite');
				const store = transaction.objectStore(INDEXEDDB_STORE_NAME);

				const deleteRequest = store.delete(this.runId!);
				deleteRequest.onsuccess = () => {
					this.currentState = null;
					resolve();
				};
				deleteRequest.onerror = () => reject(deleteRequest.error);
			};

			request.onerror = () => reject(request.error);
		});
	}

	/**
	 * Get all sessions for cleanup
	 */
	async getAllSessions(): Promise<UnifiedMFAStateData[]> {
		return new Promise((resolve, reject) => {
			const request = indexedDB.open(INDEXEDDB_DB_NAME, 1);

			request.onsuccess = () => {
				const db = request.result;
				const transaction = db.transaction([INDEXEDDB_STORE_NAME], 'readonly');
				const store = transaction.objectStore(INDEXEDDB_STORE_NAME);
				const results: UnifiedMFAStateData[] = [];

				const cursorRequest = store.openCursor();
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

			request.onerror = () => reject(request.error);
		});
	}

	/**
	 * Cleanup old sessions
	 */
	async cleanupOldSessions(): Promise<void> {
		const sessions = await this.getAllSessions();
		const now = Date.now();

		const retentionPeriods: Record<string, number> = {
			SUCCESS: 30 * 24 * 60 * 60 * 1000, // 30 days
			ERROR: 3 * 24 * 60 * 60 * 1000, // 3 days
			default: 7 * 24 * 60 * 60 * 1000, // 7 days
		};

		for (const session of sessions) {
			const retention = retentionPeriods[session.state] || retentionPeriods.default;
			if (now - session.updatedAt > retention) {
				await this.deleteSession(session.runId);
			}
		}
	}

	/**
	 * Delete specific session
	 */
	private async deleteSession(runId: string): Promise<void> {
		return new Promise((resolve, reject) => {
			const request = indexedDB.open(INDEXEDDB_DB_NAME, 1);

			request.onsuccess = () => {
				const db = request.result;
				const transaction = db.transaction([INDEXEDDB_STORE_NAME], 'readwrite');
				const store = transaction.objectStore(INDEXEDDB_STORE_NAME);

				const deleteRequest = store.delete(runId);
				deleteRequest.onsuccess = () => resolve();
				deleteRequest.onerror = () => reject(deleteRequest.error);
			};

			request.onerror = () => reject(request.error);
		});
	}
}

// Singleton instance
export const unifiedStateServiceV8 = new UnifiedStateServiceV8();
export default unifiedStateServiceV8;
