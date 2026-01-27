/**
 * @file unifiedStorageManager.ts
 * @description High-performance storage manager for unified worker token service
 * @version 2.0.0
 *
 * Features:
 * - Batch operations to reduce I/O
 * - Write debouncing
 * - Memory cache with TTL
 * - Circuit breaker pattern
 * - Retry logic with exponential backoff
 */

const MODULE_TAG = '[🔧 UNIFIED-STORAGE]';

// Storage configuration
const MEMORY_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const WRITE_DEBOUNCE_DELAY = 100; // 100ms
const MAX_RETRY_ATTEMPTS = 3;
const BASE_RETRY_DELAY = 1000;

// Circuit breaker configuration
const CIRCUIT_BREAKER_THRESHOLD = 5;
const CIRCUIT_BREAKER_TIMEOUT = 30000; // 30 seconds

export interface StorageOperation<T = any> {
	key: string;
	data?: T;
	operation: 'save' | 'load' | 'clear';
	resolve?: (value: T) => void;
	reject?: (error: Error) => void;
}

export interface StorageMetrics {
	operations: {
		reads: number;
		writes: number;
		errors: number;
	};
	performance: {
		avgReadTime: number;
		avgWriteTime: number;
		cacheHitRate: number;
	};
}

enum CircuitBreakerState {
	CLOSED = 'CLOSED',
	OPEN = 'OPEN',
	HALF_OPEN = 'HALF_OPEN',
}

class CircuitBreaker {
	private failures = 0;
	private lastFailureTime = 0;
	private state: CircuitBreakerState = CircuitBreakerState.CLOSED;

	async execute<T>(operation: () => Promise<T>): Promise<T> {
		if (this.state === CircuitBreakerState.OPEN) {
			if (Date.now() - this.lastFailureTime > CIRCUIT_BREAKER_TIMEOUT) {
				this.state = CircuitBreakerState.HALF_OPEN;
			} else {
				throw new Error('Storage circuit breaker is OPEN');
			}
		}

		try {
			const result = await operation();
			this.onSuccess();
			return result;
		} catch (error) {
			this.onFailure();
			throw error;
		}
	}

	private onSuccess(): void {
		this.failures = 0;
		this.state = CircuitBreakerState.CLOSED;
	}

	private onFailure(): void {
		this.failures++;
		this.lastFailureTime = Date.now();

		if (this.failures >= CIRCUIT_BREAKER_THRESHOLD) {
			this.state = CircuitBreakerState.OPEN;
		}
	}
}

class MemoryCache<K, V> {
	private cache = new Map<K, { value: V; expiresAt: number }>();
	private maxSize = 100;
	private hits = 0;
	private misses = 0;

	set(key: K, value: V, ttl: number = MEMORY_CACHE_TTL): void {
		if (this.cache.size >= this.maxSize) {
			this.evictOldest();
		}

		this.cache.set(key, {
			value,
			expiresAt: Date.now() + ttl,
		});
	}

	get(key: K): V | null {
		const entry = this.cache.get(key);
		if (!entry) {
			this.misses++;
			return null;
		}

		if (Date.now() > entry.expiresAt) {
			this.cache.delete(key);
			this.misses++;
			return null;
		}

		this.hits++;
		return entry.value;
	}

	delete(key: K): boolean {
		return this.cache.delete(key);
	}

	clear(): void {
		this.cache.clear();
	}

	getHitRate(): number {
		const total = this.hits + this.misses;
		return total > 0 ? this.hits / total : 0;
	}

	private evictOldest(): void {
		const oldestKey = this.cache.keys().next().value;
		if (oldestKey) this.cache.delete(oldestKey);
	}
}

export class UnifiedStorageManager {
	private static instance: UnifiedStorageManager;
	private memoryCache = new MemoryCache<string, any>();
	private writeQueue = new Map<string, any>();
	private writeTimeout: NodeJS.Timeout | null = null;
	private circuitBreaker = new CircuitBreaker();
	private metrics: StorageMetrics = {
		operations: { reads: 0, writes: 0, errors: 0 },
		performance: { avgReadTime: 0, avgWriteTime: 0, cacheHitRate: 0 },
	};

	private constructor() {}

	static getInstance(): UnifiedStorageManager {
		if (!UnifiedStorageManager.instance) {
			UnifiedStorageManager.instance = new UnifiedStorageManager();
		}
		return UnifiedStorageManager.instance;
	}

	/**
	 * Save data with debouncing and batch operations
	 */
	async save(key: string, data: any): Promise<void> {
		const startTime = Date.now();

		try {
			// Update memory cache immediately
			this.memoryCache.set(key, data);

			// Queue for batch write
			this.writeQueue.set(key, data);
			this.scheduleWrite();

			this.metrics.operations.writes++;
			this.updatePerformanceMetrics('write', Date.now() - startTime);
		} catch (error) {
			this.metrics.operations.errors++;
			throw error;
		}
	}

	/**
	 * Load data with cache-first approach
	 */
	async load<T>(key: string): Promise<T | null> {
		const startTime = Date.now();

		try {
			// Try memory cache first
			const cached = this.memoryCache.get<T>(key);
			if (cached !== null) {
				this.metrics.operations.reads++;
				this.updatePerformanceMetrics('read', Date.now() - startTime);
				this.metrics.performance.cacheHitRate = this.memoryCache.getHitRate();
				return cached;
			}

			// Load from storage with circuit breaker
			const data = await this.circuitBreaker.execute(async () => {
				return this.loadFromStorage<T>(key);
			});

			if (data) {
				this.memoryCache.set(key, data);
			}

			this.metrics.operations.reads++;
			this.updatePerformanceMetrics('read', Date.now() - startTime);
			this.metrics.performance.cacheHitRate = this.memoryCache.getHitRate();

			return data;
		} catch (error) {
			this.metrics.operations.errors++;
			throw error;
		}
	}

	/**
	 * Clear data from all storage layers
	 */
	async clear(key: string): Promise<void> {
		try {
			this.memoryCache.delete(key);
			this.writeQueue.delete(key);

			await this.circuitBreaker.execute(async () => {
				await this.clearFromStorage(key);
			});
		} catch (error) {
			this.metrics.operations.errors++;
			throw error;
		}
	}

	/**
	 * Get performance metrics
	 */
	getMetrics(): StorageMetrics {
		return { ...this.metrics };
	}

	/**
	 * Reset metrics
	 */
	resetMetrics(): void {
		this.metrics = {
			operations: { reads: 0, writes: 0, errors: 0 },
			performance: { avgReadTime: 0, avgWriteTime: 0, cacheHitRate: 0 },
		};
	}

	/**
	 * Schedule batch write with debouncing
	 */
	private scheduleWrite(): void {
		if (this.writeTimeout) {
			clearTimeout(this.writeTimeout);
		}

		this.writeTimeout = setTimeout(async () => {
			await this.flushWriteQueue();
		}, WRITE_DEBOUNCE_DELAY);
	}

	/**
	 * Flush write queue to storage
	 */
	private async flushWriteQueue(): Promise<void> {
		if (this.writeQueue.size === 0) return;

		const operations = Array.from(this.writeQueue.entries());
		this.writeQueue.clear();

		try {
			await this.circuitBreaker.execute(async () => {
				await this.batchWriteToStorage(operations);
			});
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to flush write queue:`, error);
			// Re-queue failed operations
			operations.forEach(([key, data]) => {
				this.writeQueue.set(key, data);
			});
		}
	}

	/**
	 * Load from localStorage with retry logic
	 */
	private async loadFromStorage<T>(key: string): Promise<T | null> {
		return this.withRetry(async () => {
			try {
				const stored = localStorage.getItem(key);
				return stored ? JSON.parse(stored) : null;
			} catch (error) {
				console.error(`${MODULE_TAG} Failed to load from localStorage:`, error);
				return null;
			}
		});
	}

	/**
	 * Batch write to localStorage
	 */
	private async batchWriteToStorage(operations: Array<[string, any]>): Promise<void> {
		operations.forEach(([key, data]) => {
			try {
				localStorage.setItem(key, JSON.stringify(data));
			} catch (error) {
				console.error(`${MODULE_TAG} Failed to save ${key} to localStorage:`, error);
				throw error;
			}
		});
	}

	/**
	 * Clear from localStorage
	 */
	private async clearFromStorage(key: string): Promise<void> {
		return this.withRetry(async () => {
			try {
				localStorage.removeItem(key);
			} catch (error) {
				console.error(`${MODULE_TAG} Failed to clear ${key} from localStorage:`, error);
				throw error;
			}
		});
	}

	/**
	 * Retry logic with exponential backoff
	 */
	private async withRetry<T>(
		operation: () => Promise<T>,
		maxRetries: number = MAX_RETRY_ATTEMPTS,
		baseDelay: number = BASE_RETRY_DELAY
	): Promise<T> {
		for (let attempt = 1; attempt <= maxRetries; attempt++) {
			try {
				return await operation();
			} catch (error) {
				if (attempt === maxRetries) throw error;

				const delay = baseDelay * 2 ** (attempt - 1);
				await new Promise((resolve) => setTimeout(resolve, delay));
			}
		}
		throw new Error('Max retries exceeded');
	}

	/**
	 * Update performance metrics
	 */
	private updatePerformanceMetrics(operation: 'read' | 'write', duration: number): void {
		const key = operation === 'read' ? 'avgReadTime' : 'avgWriteTime';
		const current = this.metrics.performance[key];
		this.metrics.performance[key] = this.updateAverage(current, duration);
	}

	/**
	 * Calculate running average
	 */
	private updateAverage(current: number, newValue: number): number {
		if (current === 0) return newValue;
		return (current + newValue) / 2;
	}
}

// Export singleton instance
export const unifiedStorageManager = UnifiedStorageManager.getInstance();

export default unifiedStorageManager;
