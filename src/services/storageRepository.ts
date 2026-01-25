/**
 * StorageRepository - Abstraction over localStorage with IndexedDB fallback
 * 
 * Features:
 * - localStorage wrapper with prefix support
 * - Automatic IndexedDB fallback if localStorage quota exceeded
 * - Migration utilities for key changes
 * - JSON serialization/deserialization
 * - Error handling for quota exceeded
 */

export interface StorageOptions {
  prefix?: string;
  useIndexedDB?: boolean;
}

class StorageRepositoryImpl {
  private prefix: string;
  private dbName = 'oauth-playground-storage';
  private storeName = 'keyvalue';
  private db: IDBDatabase | null = null;

  constructor(options: StorageOptions = {}) {
    this.prefix = options.prefix ?? '';
  }

  get<T>(key: string): T | null {
    const prefixedKey = this.getPrefixedKey(key);

    try {
      const value = localStorage.getItem(prefixedKey);
      if (value === null) {
        return null;
      }
      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`[StorageRepository] Error getting key "${key}":`, error);
      return null;
    }
  }

  set<T>(key: string, value: T): void {
    const prefixedKey = this.getPrefixedKey(key);

    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(prefixedKey, serialized);
    } catch (error) {
      if (this.isQuotaExceededError(error)) {
        console.warn(`[StorageRepository] localStorage quota exceeded, attempting IndexedDB fallback`);
        this.setIndexedDB(prefixedKey, value);
      } else {
        console.error(`[StorageRepository] Error setting key "${key}":`, error);
        throw error;
      }
    }
  }

  remove(key: string): void {
    const prefixedKey = this.getPrefixedKey(key);

    try {
      localStorage.removeItem(prefixedKey);
    } catch (error) {
      console.error(`[StorageRepository] Error removing key "${key}":`, error);
    }
  }

  clear(prefix?: string): void {
    const targetPrefix = prefix ? this.getPrefixedKey(prefix) : this.prefix;

    try {
      const keys = this.keys(prefix);
      keys.forEach(key => {
        const fullKey = prefix ? this.getPrefixedKey(key) : key;
        localStorage.removeItem(fullKey);
      });
    } catch (error) {
      console.error(`[StorageRepository] Error clearing keys with prefix "${targetPrefix}":`, error);
    }
  }

  keys(prefix?: string): string[] {
    const targetPrefix = prefix ? this.getPrefixedKey(prefix) : this.prefix;

    try {
      const allKeys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(targetPrefix)) {
          const unprefixedKey = key.substring(this.prefix.length);
          allKeys.push(unprefixedKey);
        }
      }
      return allKeys;
    } catch (error) {
      console.error(`[StorageRepository] Error getting keys with prefix "${targetPrefix}":`, error);
      return [];
    }
  }

  migrate(oldKey: string, newKey: string): void {
    const oldPrefixedKey = this.getPrefixedKey(oldKey);
    const newPrefixedKey = this.getPrefixedKey(newKey);

    try {
      const value = localStorage.getItem(oldPrefixedKey);
      if (value !== null) {
        localStorage.setItem(newPrefixedKey, value);
        localStorage.removeItem(oldPrefixedKey);
        console.log(`[StorageRepository] Migrated "${oldKey}" to "${newKey}"`);
      }
    } catch (error) {
      console.error(`[StorageRepository] Error migrating "${oldKey}" to "${newKey}":`, error);
    }
  }

  migrateAll(keyMap: Record<string, string>): void {
    Object.entries(keyMap).forEach(([oldKey, newKey]) => {
      this.migrate(oldKey, newKey);
    });
  }

  private getPrefixedKey(key: string): string {
    return this.prefix ? `${this.prefix}${key}` : key;
  }

  private isQuotaExceededError(error: unknown): boolean {
    if (error instanceof DOMException) {
      return (
        error.name === 'QuotaExceededError' ||
        error.name === 'NS_ERROR_DOM_QUOTA_REACHED'
      );
    }
    return false;
  }

  private async initIndexedDB(): Promise<IDBDatabase> {
    if (this.db) {
      return this.db;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
    });
  }

  private async setIndexedDB<T>(key: string, value: T): Promise<void> {
    try {
      const db = await this.initIndexedDB();
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const serialized = JSON.stringify(value);
      store.put(serialized, key);

      return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    } catch (error) {
      console.error(`[StorageRepository] IndexedDB fallback failed for key "${key}":`, error);
      throw error;
    }
  }

  async getIndexedDB<T>(key: string): Promise<T | null> {
    try {
      const db = await this.initIndexedDB();
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          const value = request.result;
          if (value === undefined) {
            resolve(null);
          } else {
            resolve(JSON.parse(value) as T);
          }
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error(`[StorageRepository] Error getting from IndexedDB for key "${key}":`, error);
      return null;
    }
  }
}

export const StorageRepository = new StorageRepositoryImpl();

export function createStorageRepository(options?: StorageOptions): StorageRepositoryImpl {
  return new StorageRepositoryImpl(options);
}
