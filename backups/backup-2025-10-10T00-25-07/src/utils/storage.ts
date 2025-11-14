/**
 * Storage utility for managing browser storage (localStorage, sessionStorage)
 */

import {
	OAuthConfig,
	OAuthStorage,
	OAuthTokenResponse,
	StorageInterface,
	UserInfo,
} from '../types/storage';

const STORAGE_PREFIX = 'pingone_playground_';

/**
 * Get a namespaced storage key
 * @param key - The key to namespace
 * @returns Namespaced key
 */
const getKey = (key: string): string => `${STORAGE_PREFIX}${key}`;

/**
 * Storage service for localStorage
 */
interface StorageService extends StorageInterface {
	setItem<T>(key: string, value: T): boolean;
	getItem<T = unknown>(key: string, defaultValue?: T | null): T | null;
	removeItem(key: string): boolean;
	clear(): boolean;
}

export const localStorageService: StorageService = {
	/**
	 * Set an item in localStorage
	 * @param {string} key - The key to set
	 * @param {*} value - The value to store (will be stringified)
	 */
	setItem(key, value) {
		try {
			const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
			window.localStorage.setItem(getKey(key), stringValue);
			return true;
		} catch (error) {
			console.error('Error saving to localStorage:', error);
			return false;
		}
	},

	/**
	 * Get an item from localStorage
	 * @param {string} key - The key to get
	 * @param {*} defaultValue - Default value if key doesn't exist
	 * @returns {*} The stored value or defaultValue
	 */
	getItem(key, defaultValue = null) {
		try {
			const item = window.localStorage.getItem(getKey(key));
			if (item === null) return defaultValue;

			try {
				return JSON.parse(item);
			} catch (_e) {
				return item;
			}
		} catch (error) {
			console.error('Error reading from localStorage:', error);
			return defaultValue;
		}
	},

	/**
	 * Remove an item from localStorage
	 * @param {string} key - The key to remove
	 */
	removeItem(key) {
		try {
			window.localStorage.removeItem(getKey(key));
			return true;
		} catch (error) {
			console.error('Error removing from localStorage:', error);
			return false;
		}
	},

	/**
	 * Clear all namespaced items from localStorage
	 */
	clear() {
		try {
			Object.keys(window.localStorage).forEach((key) => {
				if (key.startsWith(STORAGE_PREFIX)) {
					window.localStorage.removeItem(key);
				}
			});
			return true;
		} catch (error) {
			console.error('Error clearing localStorage:', error);
			return false;
		}
	},
};

/**
 * Storage service for sessionStorage
 */
export const sessionStorageService: StorageService = {
	/**
	 * Set an item in sessionStorage
	 * @param {string} key - The key to set
	 * @param {*} value - The value to store (will be stringified)
	 */
	setItem(key, value) {
		try {
			const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
			window.sessionStorage.setItem(getKey(key), stringValue);
			return true;
		} catch (error) {
			console.error('Error saving to sessionStorage:', error);
			return false;
		}
	},

	/**
	 * Get an item from sessionStorage
	 * @param {string} key - The key to get
	 * @param {*} defaultValue - Default value if key doesn't exist
	 * @returns {*} The stored value or defaultValue
	 */
	getItem(key, defaultValue = null) {
		try {
			const item = window.sessionStorage.getItem(getKey(key));
			if (item === null) return defaultValue;

			try {
				return JSON.parse(item);
			} catch (_e) {
				return item;
			}
		} catch (error) {
			console.error('Error reading from sessionStorage:', error);
			return defaultValue;
		}
	},

	/**
	 * Remove an item from sessionStorage
	 * @param {string} key - The key to remove
	 */
	removeItem(key) {
		try {
			window.sessionStorage.removeItem(getKey(key));
			return true;
		} catch (error) {
			console.error('Error removing from sessionStorage:', error);
			return false;
		}
	},

	/**
	 * Clear all namespaced items from sessionStorage
	 */
	clear() {
		try {
			Object.keys(window.sessionStorage).forEach((key) => {
				if (key.startsWith(STORAGE_PREFIX)) {
					window.sessionStorage.removeItem(key);
				}
			});
			return true;
		} catch (error) {
			console.error('Error clearing sessionStorage:', error);
			return false;
		}
	},
};

/**
 * OAuth specific storage helpers
 */
export const oauthStorage: OAuthStorage = {
	// Core StorageInterface methods
	setItem<T>(key: string, value: T): boolean {
		return sessionStorageService.setItem(key, value);
	},
	getItem<T = unknown>(key: string, defaultValue: T | null = null): T | null {
		return sessionStorageService.getItem(key, defaultValue);
	},
	removeItem(key: string): boolean {
		return sessionStorageService.removeItem(key);
	},
	clear(): void {
		sessionStorageService.clear();
	},
	// State
	setState(state: string): boolean {
		return sessionStorageService.setItem('oauth_state', state);
	},
	getState(): string | null {
		return sessionStorageService.getItem('oauth_state');
	},
	clearState(): boolean {
		return sessionStorageService.removeItem('oauth_state');
	},

	// Nonce
	setNonce(nonce: string): boolean {
		return sessionStorageService.setItem('oauth_nonce', nonce);
	},
	getNonce(): string | null {
		return sessionStorageService.getItem('oauth_nonce');
	},
	clearNonce(): boolean {
		return sessionStorageService.removeItem('oauth_nonce');
	},

	// PKCE Code Verifier
	setCodeVerifier(verifier: string): boolean {
		return sessionStorageService.setItem('code_verifier', verifier);
	},
	getCodeVerifier(): string | null {
		return sessionStorageService.getItem('code_verifier');
	},
	clearCodeVerifier(): boolean {
		return sessionStorageService.removeItem('code_verifier');
	},

	// Tokens
	setTokens(tokens: OAuthTokenResponse): boolean {
		return this.setItem('tokens', tokens);
	},

	getTokens(): OAuthTokenResponse | null {
		return this.getItem('tokens');
	},

	clearTokens(): boolean {
		return this.removeItem('tokens');
	},

	// User Info
	setUserInfo(userInfo: UserInfo): boolean {
		return this.setItem('user_info', userInfo);
	},

	getUserInfo(): UserInfo | null {
		return this.getItem('user_info');
	},

	clearUserInfo(): boolean {
		return this.removeItem('user_info');
	},

	// Configuration
	setConfig(config: OAuthConfig): boolean {
		return this.setItem('config', config);
	},

	getConfig(): OAuthConfig | null {
		return this.getItem('config');
	},
	clearConfig(): boolean {
		return sessionStorageService.removeItem('oauth_config');
	},

	// Session start time
	setSessionStartTime(timestamp: number): boolean {
		return sessionStorageService.setItem('session_start_time', timestamp);
	},
	getSessionStartTime(): number | null {
		return sessionStorageService.getItem('session_start_time');
	},
	clearSessionStartTime(): boolean {
		return sessionStorageService.removeItem('session_start_time');
	},

	// Clear all OAuth related data
	clearAll() {
		this.clearState();
		this.clearNonce();
		this.clearCodeVerifier();
		this.clearTokens();
		this.clearUserInfo();
		// Don't clear config by default as it's needed across sessions
	},
};

export default {
	localStorage: localStorageService,
	sessionStorage: sessionStorageService,
	oauth: oauthStorage,
};
