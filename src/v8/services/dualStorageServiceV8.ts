// src/v8/services/dualStorageServiceV8.ts
import { logger } from '../../utils/logger';
/**
 * Dual Storage Service V8
 *
 * Provides dual storage capabilities for V8 components.
 * This is a stub implementation to resolve import issues.
 */

export interface DualStorageOptions {
	primaryStorage: 'localStorage' | 'sessionStorage' | 'indexedDB';
	fallbackStorage: 'localStorage' | 'sessionStorage' | 'indexedDB';
}

export class DualStorageServiceV8 {
	private options: DualStorageOptions;

	constructor(options: DualStorageOptions) {
		this.options = options;
	}

	/**
	 * Store data in primary storage with fallback
	 */
	setItem(key: string, value: string): boolean {
		try {
			if (this.options.primaryStorage === 'localStorage') {
				localStorage.setItem(key, value);
				return true;
			} else if (this.options.primaryStorage === 'sessionStorage') {
				sessionStorage.setItem(key, value);
				return true;
			}
		} catch (_error) {
			// Try fallback storage
			try {
				if (this.options.fallbackStorage === 'localStorage') {
					localStorage.setItem(key, value);
					return true;
				} else if (this.options.fallbackStorage === 'sessionStorage') {
					sessionStorage.setItem(key, value);
					return true;
				}
			} catch (fallbackError) {
				logger.error('DualStorageServiceV8: Both storage mechanisms failed', fallbackError);
			}
		}
		return false;
	}

	/**
	 * Retrieve data from primary storage with fallback
	 */
	getItem(key: string): string | null {
		try {
			if (this.options.primaryStorage === 'localStorage') {
				return localStorage.getItem(key);
			} else if (this.options.primaryStorage === 'sessionStorage') {
				return sessionStorage.getItem(key);
			}
		} catch (_error) {
			// Try fallback storage
			try {
				if (this.options.fallbackStorage === 'localStorage') {
					return localStorage.getItem(key);
				} else if (this.options.fallbackStorage === 'sessionStorage') {
					return sessionStorage.getItem(key);
				}
			} catch (fallbackError) {
				logger.error('DualStorageServiceV8: Both storage mechanisms failed', fallbackError);
			}
		}
		return null;
	}

	/**
	 * Remove data from both storages
	 */
	removeItem(key: string): boolean {
		let success = false;

		try {
			if (this.options.primaryStorage === 'localStorage') {
				localStorage.removeItem(key);
				success = true;
			} else if (this.options.primaryStorage === 'sessionStorage') {
				sessionStorage.removeItem(key);
				success = true;
			}
		} catch (error) {
			logger.error('DualStorageServiceV8: Primary storage removal failed', error);
		}

		try {
			if (this.options.fallbackStorage === 'localStorage') {
				localStorage.removeItem(key);
				success = true;
			} else if (this.options.fallbackStorage === 'sessionStorage') {
				sessionStorage.removeItem(key);
				success = true;
			}
		} catch (error) {
			logger.error('DualStorageServiceV8: Fallback storage removal failed', error);
		}

		return success;
	}
}

// Default instance with localStorage primary and sessionStorage fallback
export const defaultDualStorage = new DualStorageServiceV8({
	primaryStorage: 'localStorage',
	fallbackStorage: 'sessionStorage',
});

export default DualStorageServiceV8;
