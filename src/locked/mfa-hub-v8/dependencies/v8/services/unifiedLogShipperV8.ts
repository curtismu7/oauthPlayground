/**
 * @file unifiedLogShipperV8.ts
 * @module v8/services
 * @description Log shipper service for reliable delivery to server.log
 * @version 8.0.0
 * @since 2025-01-20
 *
 * Features:
 * - Batch shipping with retry logic
 * - Circuit breaker for server failures
 * - IndexedDB persistence for failed batches
 * - Automatic cleanup of old logs
 * - Server.log integration with checksum verification
 */

import { unifiedLoggerV8, type UnifiedLogEntry } from './unifiedLoggerV8';
import { logger } from '../../utils/logger';

// Shipper configuration
const SHIPPER_BATCH_SIZE = 50;
const SHIPPER_INTERVAL = 3000; // 3 seconds
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_BASE = 1000; // 1 second base delay
const CIRCUIT_BREAKER_THRESHOLD = 5;
const CIRCUIT_BREAKER_TIMEOUT = 30000; // 30 seconds

// IndexedDB setup for failed batches
const INDEXEDDB_DB_NAME = 'oauth_playground_v8';
const FAILED_BATCHES_STORE_NAME = 'unified_mfa_failed_batches';

interface FailedBatch {
  id: string;
  entries: UnifiedLogEntry[];
  attempts: number;
  lastAttempt: number;
  nextRetry: number;
  error?: string;
}

interface ShipperStats {
  totalShipped: number;
  totalFailed: number;
  currentBatchSize: number;
  isCircuitOpen: boolean;
  consecutiveFailures: number;
  lastShipTime: number;
}

class UnifiedLogShipperV8 {
  private isShipping = false;
  private shipTimer: NodeJS.Timeout | null = null;
  private circuitOpen = false;
  private circuitOpenTime = 0;
  private consecutiveFailures = 0;
  private stats: ShipperStats = {
    totalShipped: 0,
    totalFailed: 0,
    currentBatchSize: 0,
    isCircuitOpen: false,
    consecutiveFailures: 0,
    lastShipTime: 0,
  };

  /**
   * Initialize log shipper
   */
  async initialize(): Promise<void> {
    logger.info('LOG_SHIPPER', 'Initializing unified log shipper');
    
    // Start periodic shipping
    this.startPeriodicShipping();
    
    // Retry failed batches on startup
    await this.retryFailedBatches();
    
    // Cleanup old failed batches
    await this.cleanupOldFailedBatches();
    
    logger.info('LOG_SHIPPER', 'Log shipper initialized', this.getStats());
  }

  /**
   * Start periodic shipping
   */
  private startPeriodicShipping(): void {
    if (this.shipTimer) {
      clearInterval(this.shipTimer);
    }

    this.shipTimer = setInterval(async () => {
      if (!this.isShipping && !this.circuitOpen) {
        await this.shipPendingLogs();
      }
    }, SHIPPER_INTERVAL);
  }

  /**
   * Ship pending logs from unified logger
   */
  async shipPendingLogs(): Promise<void> {
    if (this.isShipping || this.circuitOpen) {
      return;
    }

    this.isShipping = true;

    try {
      // Get logs from unified logger
      const logs = await unifiedLoggerV8.getLogs();
      
      if (logs.length === 0) {
        return;
      }

      // Process in batches
      const batches = this.createBatches(logs);
      
      for (const batch of batches) {
        await this.shipBatch(batch);
        
        // Small delay between batches to avoid overwhelming server
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      this.stats.lastShipTime = Date.now();
      logger.info('LOG_SHIPPER', 'Shipped pending logs', {
        batchCount: batches.length,
        totalLogs: logs.length,
      });

    } catch (error) {
      logger.error('LOG_SHIPPER', 'Failed to ship pending logs', error);
      await this.handleShippingError(error);
    } finally {
      this.isShipping = false;
    }
  }

  /**
   * Create batches from logs
   */
  private createBatches(logs: UnifiedLogEntry[]): UnifiedLogEntry[][] {
    const batches: UnifiedLogEntry[][] = [];
    
    for (let i = 0; i < logs.length; i += SHIPPER_BATCH_SIZE) {
      batches.push(logs.slice(i, i + SHIPPER_BATCH_SIZE));
    }

    this.stats.currentBatchSize = batches.length;
    return batches;
  }

  /**
   * Ship a single batch to server
   */
  private async shipBatch(batch: UnifiedLogEntry[]): Promise<void> {
    const batchId = this.generateBatchId();
    const checksum = await this.calculateChecksum(batch);
    
    const payload = {
      batchId,
      timestamp: Date.now(),
      runId: batch[0]?.runId || 'unknown',
      entries: batch,
      checksum,
      metadata: {
        batchSize: batch.length,
        shipperVersion: '8.0.0',
        userAgent: navigator.userAgent,
      },
    };

    try {
      const response = await fetch('/api/v1/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Verify server acknowledgment
      if (!result.success || result.batchId !== batchId) {
        throw new Error('Server acknowledgment mismatch');
      }

      // Update stats
      this.stats.totalShipped += batch.length;
      this.consecutiveFailures = 0; // Reset on success
      
      // Close circuit if it was open
      if (this.circuitOpen) {
        this.closeCircuit();
      }

      logger.info('LOG_SHIPPER', 'Batch shipped successfully', {
        batchId,
        entryCount: batch.length,
        checksum,
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Save failed batch for retry
      await this.saveFailedBatch(batch, errorMessage);
      
      // Update circuit breaker
      this.consecutiveFailures++;
      if (this.consecutiveFailures >= CIRCUIT_BREAKER_THRESHOLD) {
        this.openCircuit();
      }

      throw error;
    }
  }

  /**
   * Save failed batch for retry
   */
  private async saveFailedBatch(batch: UnifiedLogEntry[], error: string): Promise<void> {
    const failedBatch: FailedBatch = {
      id: this.generateBatchId(),
      entries: batch,
      attempts: 1,
      lastAttempt: Date.now(),
      nextRetry: Date.now() + (RETRY_DELAY_BASE * Math.pow(2, 0)), // Exponential backoff
      error,
    };

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(INDEXEDDB_DB_NAME, 1);
      
      request.onsuccess = () => {
        const db = request.result;
        
        // Create store if not exists
        if (!db.objectStoreNames.contains(FAILED_BATCHES_STORE_NAME)) {
          const transaction = db.createObjectStore(FAILED_BATCHES_STORE_NAME, { keyPath: 'id' });
          transaction.createIndex('nextRetry', 'nextRetry', { unique: false });
          transaction.createIndex('attempts', 'attempts', { unique: false });
        }
        
        const transaction = db.transaction([FAILED_BATCHES_STORE_NAME], 'readwrite');
        const store = transaction.objectStore(FAILED_BATCHES_STORE_NAME);
        
        const putRequest = store.put(failedBatch);
        putRequest.onsuccess = () => {
          this.stats.totalFailed += batch.length;
          resolve();
        };
        putRequest.onerror = () => reject(putRequest.error);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Retry failed batches
   */
  private async retryFailedBatches(): Promise<void> {
    const failedBatches = await this.getFailedBatches();
    const now = Date.now();
    
    for (const batch of failedBatches) {
      if (batch.nextRetry <= now && batch.attempts < MAX_RETRY_ATTEMPTS) {
        try {
          await this.shipBatch(batch.entries);
          
          // Delete successful batch
          await this.deleteFailedBatch(batch.id);
          
          logger.info('LOG_SHIPPER', 'Failed batch retried successfully', {
            batchId: batch.id,
            attempts: batch.attempts + 1,
          });
          
        } catch (error) {
          // Update retry info
          batch.attempts++;
          batch.lastAttempt = now;
          batch.nextRetry = now + (RETRY_DELAY_BASE * Math.pow(2, batch.attempts - 1));
          batch.error = error instanceof Error ? error.message : String(error);
          
          await this.updateFailedBatch(batch);
          
          logger.warn('LOG_SHIPPER', 'Failed batch retry failed', {
            batchId: batch.id,
            attempts: batch.attempts,
            nextRetry: new Date(batch.nextRetry).toISOString(),
          });
        }
      }
    }
  }

  /**
   * Get failed batches from IndexedDB
   */
  private async getFailedBatches(): Promise<FailedBatch[]> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(INDEXEDDB_DB_NAME, 1);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction([FAILED_BATCHES_STORE_NAME], 'readonly');
        const store = transaction.objectStore(FAILED_BATCHES_STORE_NAME);
        const results: FailedBatch[] = [];
        
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
   * Update failed batch
   */
  private async updateFailedBatch(batch: FailedBatch): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(INDEXEDDB_DB_NAME, 1);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction([FAILED_BATCHES_STORE_NAME], 'readwrite');
        const store = transaction.objectStore(FAILED_BATCHES_STORE_NAME);
        
        const putRequest = store.put(batch);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete failed batch
   */
  private async deleteFailedBatch(batchId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(INDEXEDDB_DB_NAME, 1);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction([FAILED_BATCHES_STORE_NAME], 'readwrite');
        const store = transaction.objectStore(FAILED_BATCHES_STORE_NAME);
        
        const deleteRequest = store.delete(batchId);
        deleteRequest.onsuccess = () => resolve();
        deleteRequest.onerror = () => reject(deleteRequest.error);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Cleanup old failed batches
   */
  private async cleanupOldFailedBatches(): Promise<void> {
    const failedBatches = await this.getFailedBatches();
    const now = Date.now();
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    
    for (const batch of failedBatches) {
      if (now - batch.lastAttempt > maxAge || batch.attempts >= MAX_RETRY_ATTEMPTS) {
        await this.deleteFailedBatch(batch.id);
        
        logger.info('LOG_SHIPPER', 'Cleaned up old failed batch', {
          batchId: batch.id,
          age: now - batch.lastAttempt,
          attempts: batch.attempts,
        });
      }
    }
  }

  /**
   * Handle shipping error
   */
  private async handleShippingError(error: unknown): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logger.error('LOG_SHIPPER', 'Shipping error occurred', {
      error: errorMessage,
      consecutiveFailures: this.consecutiveFailures,
      circuitOpen: this.circuitOpen,
    });
  }

  /**
   * Open circuit breaker
   */
  private openCircuit(): void {
    this.circuitOpen = true;
    this.circuitOpenTime = Date.now();
    this.stats.isCircuitOpen = true;
    this.stats.consecutiveFailures = this.consecutiveFailures;
    
    logger.warn('LOG_SHIPPER', 'Circuit breaker opened', {
      consecutiveFailures: this.consecutiveFailures,
      timeout: CIRCUIT_BREAKER_TIMEOUT,
    });

    // Auto-close circuit after timeout
    setTimeout(() => {
      this.closeCircuit();
    }, CIRCUIT_BREAKER_TIMEOUT);
  }

  /**
   * Close circuit breaker
   */
  private closeCircuit(): void {
    this.circuitOpen = false;
    this.circuitOpenTime = 0;
    this.consecutiveFailures = 0;
    this.stats.isCircuitOpen = false;
    this.stats.consecutiveFailures = 0;
    
    logger.info('LOG_SHIPPER', 'Circuit breaker closed');
  }

  /**
   * Generate batch ID
   */
  private generateBatchId(): string {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  }

  /**
   * Calculate checksum for batch
   */
  private async calculateChecksum(batch: UnifiedLogEntry[]): Promise<string> {
    const batchString = JSON.stringify(batch, Object.keys(batch[0] || {}).sort());
    const encoder = new TextEncoder();
    const data = encoder.encode(batchString);
    
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Get shipper stats
   */
  getStats(): ShipperStats {
    return { ...this.stats };
  }

  /**
   * Force ship all pending logs
   */
  async forceShip(): Promise<void> {
    logger.info('LOG_SHIPPER', 'Force shipping all pending logs');
    await this.shipPendingLogs();
  }

  /**
   * Stop shipper
   */
  stop(): void {
    if (this.shipTimer) {
      clearInterval(this.shipTimer);
      this.shipTimer = null;
    }
    
    logger.info('LOG_SHIPPER', 'Log shipper stopped');
  }

  /**
   * Get health status
   */
  getHealth(): {
    healthy: boolean;
    circuitOpen: boolean;
    consecutiveFailures: number;
    lastShipTime: number;
    pendingLogs: number;
  } {
    return {
      healthy: !this.circuitOpen && this.consecutiveFailures < CIRCUIT_BREAKER_THRESHOLD,
      circuitOpen: this.circuitOpen,
      consecutiveFailures: this.consecutiveFailures,
      lastShipTime: this.stats.lastShipTime,
      pendingLogs: this.stats.currentBatchSize,
    };
  }
}

// Singleton instance
export const unifiedLogShipperV8 = new UnifiedLogShipperV8();
export default unifiedLogShipperV8;
