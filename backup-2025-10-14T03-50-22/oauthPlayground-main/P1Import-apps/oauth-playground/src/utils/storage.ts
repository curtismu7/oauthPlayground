/**
 * Storage utility for managing browser storage (localStorage, sessionStorage)
 */

const STORAGE_PREFIX = 'pingone_playground_';

/**
 * Get a namespaced storage key
 * @param {string} key - The key to namespace
 * @returns {string} Namespaced key
 */
const getKey = (key) => `${STORAGE_PREFIX}${key}`;

/**
 * Storage service for localStorage
 */
export const localStorageService = {
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
			} catch (e) {
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
export const sessionStorageService = {
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
			} catch (e) {
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
export const oauthStorage = {
	// State
	setState(state) {
		return sessionStorageService.setItem('oauth_state', state);
	},
	getState() {
		return sessionStorageService.getItem('oauth_state');
	},
	clearState() {
		return sessionStorageService.removeItem('oauth_state');
	},

	// Nonce
	setNonce(nonce) {
		return sessionStorageService.setItem('oauth_nonce', nonce);
	},
	getNonce() {
		return sessionStorageService.getItem('oauth_nonce');
	},
	clearNonce() {
		return sessionStorageService.removeItem('oauth_nonce');
	},

	// PKCE Code Verifier
	setCodeVerifier(verifier) {
		return sessionStorageService.setItem('pkce_code_verifier', verifier);
	},
	getCodeVerifier() {
		return sessionStorageService.getItem('pkce_code_verifier');
	},
	clearCodeVerifier() {
		return sessionStorageService.removeItem('pkce_code_verifier');
	},

	// Tokens
	setTokens(tokens) {
		return localStorageService.setItem('auth_tokens', tokens);
	},
	getTokens() {
		return localStorageService.getItem('auth_tokens');
	},
	clearTokens() {
		return localStorageService.removeItem('auth_tokens');
	},

	// User Info
	setUserInfo(userInfo) {
		return localStorageService.setItem('user_info', userInfo);
	},
	getUserInfo() {
		return localStorageService.getItem('user_info');
	},
	clearUserInfo() {
		return localStorageService.removeItem('user_info');
	},

	// Configuration
	setConfig(config) {
		return localStorageService.setItem('oauth_config', config);
	},
	getConfig() {
		return localStorageService.getItem('oauth_config');
	},
	clearConfig() {
		return localStorageService.removeItem('oauth_config');
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
