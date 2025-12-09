/**
 * @file oauthStateUtilsV8.ts
 * @module v8/utils
 * @description Shared OAuth state parameter validation utilities
 * @version 8.0.0
 * 
 * Provides standardized functions for generating, validating, and managing OAuth state parameters.
 * Ensures consistent CSRF protection across all OAuth flows.
 */

const MODULE_TAG = '[🔒 OAUTH-STATE-UTILS-V8]';

/**
 * Generate a random state parameter for OAuth flows
 * 
 * @param prefix - Optional prefix to identify flow type (e.g., 'v8u-oauth-authz')
 * @param length - Length of random portion (default: 32)
 * @returns State parameter string
 * 
 * @example
 * const state = generateOAuthState('v8u-oauth-authz');
 * // Returns: "v8u-oauth-authz-abc123def456..."
 */
export function generateOAuthState(prefix?: string, length: number = 32): string {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let randomPart = '';
	
	for (let i = 0; i < length; i++) {
		randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	
	if (prefix) {
		return `${prefix}-${randomPart}`;
	}
	
	return randomPart;
}

/**
 * Validate OAuth state parameter
 * 
 * @param receivedState - State received from OAuth callback
 * @param storedState - State stored in session/localStorage
 * @returns True if states match and are valid, false otherwise
 * 
 * @example
 * const isValid = validateOAuthState(callbackState, sessionStorage.getItem('oauth_state'));
 * if (!isValid) {
 *   throw new Error('State mismatch - possible CSRF attack');
 * }
 */
export function validateOAuthState(
	receivedState: string | null | undefined,
	storedState: string | null | undefined
): boolean {
	// Both must be present
	if (!receivedState || !storedState) {
		console.warn(`${MODULE_TAG} State validation failed: missing state`, {
			hasReceived: !!receivedState,
			hasStored: !!storedState,
		});
		return false;
	}
	
	// States must match exactly
	if (receivedState !== storedState) {
		console.warn(`${MODULE_TAG} State validation failed: mismatch`, {
			receivedLength: receivedState.length,
			storedLength: storedState.length,
			receivedPreview: receivedState.substring(0, 20),
			storedPreview: storedState.substring(0, 20),
		});
		return false;
	}
	
	// Basic format validation - should be non-empty string
	if (receivedState.trim().length === 0) {
		console.warn(`${MODULE_TAG} State validation failed: empty state`);
		return false;
	}
	
	return true;
}

/**
 * Extract flow type from state parameter (if using prefixed format)
 * 
 * @param state - State parameter (e.g., "v8u-oauth-authz-abc123")
 * @returns Flow type if found, null otherwise
 * 
 * @example
 * const flowType = extractFlowTypeFromState(state);
 * // Returns: "oauth-authz" for "v8u-oauth-authz-abc123"
 */
export function extractFlowTypeFromState(state: string | null | undefined): string | null {
	if (!state || typeof state !== 'string') {
		return null;
	}
	
	// Check for v8u- prefix format
	if (state.startsWith('v8u-')) {
		const parts = state.split('-');
		if (parts.length >= 2) {
			return parts[1] || null;
		}
	}
	
	return null;
}

/**
 * Store OAuth state securely
 * 
 * @param state - State parameter to store
 * @param storage - Storage mechanism ('sessionStorage' | 'localStorage', default: 'sessionStorage')
 * @param key - Storage key (default: 'oauth_state')
 */
export function storeOAuthState(
	state: string,
	storage: 'sessionStorage' | 'localStorage' = 'sessionStorage',
	key: string = 'oauth_state'
): void {
	if (typeof window === 'undefined') {
		console.warn(`${MODULE_TAG} Cannot store state: window is undefined`);
		return;
	}
	
	try {
		const storageObj = storage === 'sessionStorage' ? window.sessionStorage : window.localStorage;
		storageObj.setItem(key, state);
		console.log(`${MODULE_TAG} Stored OAuth state`, { key, stateLength: state.length });
	} catch (error) {
		console.error(`${MODULE_TAG} Failed to store OAuth state:`, error);
	}
}

/**
 * Retrieve OAuth state from storage
 * 
 * @param storage - Storage mechanism ('sessionStorage' | 'localStorage', default: 'sessionStorage')
 * @param key - Storage key (default: 'oauth_state')
 * @returns Stored state or null if not found
 */
export function retrieveOAuthState(
	storage: 'sessionStorage' | 'localStorage' = 'sessionStorage',
	key: string = 'oauth_state'
): string | null {
	if (typeof window === 'undefined') {
		return null;
	}
	
	try {
		const storageObj = storage === 'sessionStorage' ? window.sessionStorage : window.localStorage;
		return storageObj.getItem(key);
	} catch (error) {
		console.error(`${MODULE_TAG} Failed to retrieve OAuth state:`, error);
		return null;
	}
}

/**
 * Clear OAuth state from storage
 * 
 * @param storage - Storage mechanism ('sessionStorage' | 'localStorage', default: 'sessionStorage')
 * @param key - Storage key (default: 'oauth_state')
 */
export function clearOAuthState(
	storage: 'sessionStorage' | 'localStorage' = 'sessionStorage',
	key: string = 'oauth_state'
): void {
	if (typeof window === 'undefined') {
		return;
	}
	
	try {
		const storageObj = storage === 'sessionStorage' ? window.sessionStorage : window.localStorage;
		storageObj.removeItem(key);
		console.log(`${MODULE_TAG} Cleared OAuth state`, { key });
	} catch (error) {
		console.error(`${MODULE_TAG} Failed to clear OAuth state:`, error);
	}
}

