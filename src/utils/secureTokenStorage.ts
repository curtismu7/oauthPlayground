/**
 * Secure token storage utility
 * Implements secure token storage using encrypted sessionStorage and secure cookies
 * Follows OAuth 2.0 security best practices
 */

import { logger } from './logger';
import { OAuthTokens } from './tokenStorage';

// AES-GCM encryption using a per-session random key held in memory.
// The key is never persisted, so tokens become unreadable after a page reload
// (sessionStorage is also cleared on tab close, so this is intentional).
class SimpleEncryption {
	private static keyPromise: Promise<CryptoKey> = crypto.subtle.generateKey(
		{ name: 'AES-GCM', length: 256 },
		false,
		['encrypt', 'decrypt']
	);

	static async encrypt(text: string): Promise<string> {
		try {
			const key = await SimpleEncryption.keyPromise;
			const iv = crypto.getRandomValues(new Uint8Array(12));
			const encoded = new TextEncoder().encode(text);
			const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
			// Prefix iv (12 bytes) to ciphertext, then base64url-encode the whole thing
			const combined = new Uint8Array(iv.byteLength + ciphertext.byteLength);
			combined.set(iv, 0);
			combined.set(new Uint8Array(ciphertext), iv.byteLength);
			return btoa(String.fromCharCode(...combined));
		} catch (error) {
			logger.error('SecureTokenStorage', 'Encryption error', undefined, error);
			throw error;
		}
	}

	static async decrypt(encryptedText: string): Promise<string> {
		try {
			const key = await SimpleEncryption.keyPromise;
			const combined = Uint8Array.from(atob(encryptedText), (c) => c.charCodeAt(0));
			const iv = combined.slice(0, 12);
			const ciphertext = combined.slice(12);
			const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
			return new TextDecoder().decode(plaintext);
		} catch (error) {
			logger.error('SecureTokenStorage', 'Decryption error', undefined, error);
			throw error;
		}
	}
}

/**
 * Secure token storage interface
 */
interface SecureTokenStorage {
	storeTokens(tokens: OAuthTokens): Promise<boolean>;
	getTokens(): Promise<OAuthTokens | null>;
	clearTokens(): boolean;
	hasValidTokens(): Promise<boolean>;
	getTokenExpirationStatus(): Promise<{
		hasTokens: boolean;
		isExpired: boolean;
		expiresAt: Date | null;
		timeRemaining: number | null;
	}>;
}

/**
 * Secure token storage implementation
 * Uses encrypted sessionStorage for temporary storage
 * Tokens are automatically cleared on browser close
 */
class SecureTokenStorageImpl implements SecureTokenStorage {
	private readonly STORAGE_KEY = 'pingone_secure_tokens';
	private readonly MAX_STORAGE_TIME = 24 * 60 * 60 * 1000; // 24 hours

	/**
	 * Store OAuth tokens securely
	 * @param tokens - The OAuth tokens to store
	 * @returns Promise<boolean> - Success status
	 */
	async storeTokens(tokens: OAuthTokens): Promise<boolean> {
		try {
			// Add storage timestamp
			const tokensWithTimestamp = {
				...tokens,
				timestamp: tokens.timestamp || Date.now(),
				storageTime: Date.now(),
			};

			// Encrypt the tokens before storing
			const encryptedTokens = await SimpleEncryption.encrypt(JSON.stringify(tokensWithTimestamp));

			// Store in sessionStorage (cleared on browser close)
			sessionStorage.setItem(this.STORAGE_KEY, encryptedTokens);

			logger.success('SecureTokenStorage', 'Tokens stored securely');
			return true;
		} catch (error) {
			logger.error('SecureTokenStorage', 'Error storing tokens', undefined, error);
			return false;
		}
	}

	/**
	 * Retrieve OAuth tokens securely
	 * @returns Promise<OAuthTokens | null> - The stored tokens or null if not found
	 */
	async getTokens(): Promise<OAuthTokens | null> {
		try {
			const encryptedTokens = sessionStorage.getItem(this.STORAGE_KEY);

			if (!encryptedTokens) {
				return null;
			}

			// Decrypt the tokens
			const decryptedTokens = await SimpleEncryption.decrypt(encryptedTokens);
			const tokens = JSON.parse(decryptedTokens) as OAuthTokens & { storageTime: number };

			// Check if tokens are too old (security measure)
			if (tokens.storageTime && Date.now() - tokens.storageTime > this.MAX_STORAGE_TIME) {
				logger.warn('SecureTokenStorage', 'Tokens too old, clearing');
				this.clearTokens();
				return null;
			}

			// Remove storage metadata before returning
			const { storageTime, ...cleanTokens } = tokens;
			return cleanTokens;
		} catch (error) {
			logger.error('SecureTokenStorage', 'Error retrieving tokens', undefined, error);
			this.clearTokens(); // Clear corrupted data
			return null;
		}
	}

	/**
	 * Clear OAuth tokens securely
	 * @returns boolean - Success status
	 */
	clearTokens(): boolean {
		try {
			sessionStorage.removeItem(this.STORAGE_KEY);
			logger.success('SecureTokenStorage', 'Tokens cleared securely');
			return true;
		} catch (error) {
			logger.error('SecureTokenStorage', 'Error clearing tokens', undefined, error);
			return false;
		}
	}

	/**
	 * Check if valid OAuth tokens exist
	 * @returns Promise<boolean> - Whether valid tokens exist
	 */
	async hasValidTokens(): Promise<boolean> {
		try {
			const tokens = await this.getTokens();

			if (!tokens || !tokens.access_token) {
				return false;
			}

			// Check if token is expired
			if (tokens.timestamp && tokens.expires_in) {
				const now = Date.now();
				const expiresAt = tokens.timestamp + tokens.expires_in * 1000;

				if (now >= expiresAt) {
					logger.info('SecureTokenStorage', 'Tokens found but expired');
					this.clearTokens(); // Auto-clear expired tokens
					return false;
				}
			}

			return true;
		} catch (error) {
			logger.error('SecureTokenStorage', 'Error checking token validity', undefined, error);
			return false;
		}
	}

	/**
	 * Get token expiration status
	 * @returns Promise<object> - Token expiration information
	 */
	async getTokenExpirationStatus() {
		try {
			const tokens = await this.getTokens();

			if (!tokens || !tokens.timestamp || !tokens.expires_in) {
				return {
					hasTokens: false,
					isExpired: false,
					expiresAt: null,
					timeRemaining: null,
				};
			}

			const now = Date.now();
			const expiresAt = tokens.timestamp + tokens.expires_in * 1000;
			const timeRemaining = expiresAt - now;
			const isExpired = timeRemaining <= 0;

			return {
				hasTokens: true,
				isExpired,
				expiresAt: new Date(expiresAt),
				timeRemaining: isExpired ? 0 : timeRemaining,
			};
		} catch (error) {
			logger.error('SecureTokenStorage', 'Error getting token expiration status', undefined, error);
			return {
				hasTokens: false,
				isExpired: false,
				expiresAt: null,
				timeRemaining: null,
			};
		}
	}
}

// Export singleton instance
export const secureTokenStorage = new SecureTokenStorageImpl();

// Export the class for testing
export { SecureTokenStorageImpl, SimpleEncryption };

// Export types
export type { SecureTokenStorage };
