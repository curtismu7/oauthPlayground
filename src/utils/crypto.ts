import { logger } from './logger';

// Types
interface JwtPayload {
	exp?: number;
	iss?: string;
	aud?: string | string[];
	nonce?: string;
	iat?: number;
	[key: string]: unknown;
}

type QueryParams = Record<string, string>;

// Utility functions
const utils = {
	/**
	 * Generates a random string of specified length
	 * @param length - Length of the random string to generate
	 * @returns Random string
	 */
	generateRandomString(length: number): string {
		const array = new Uint8Array(length);
		window.crypto.getRandomValues(array);
		return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
	},

	/**
	 * Hashes a string using SHA-256
	 * @param message - The string to hash
	 * @returns The hashed message
	 */
	async sha256(message: string): Promise<ArrayBuffer> {
		const msgBuffer = new TextEncoder().encode(message);
		return window.crypto.subtle.digest('SHA-256', msgBuffer);
	},

	/**
	 * Decodes a JWT token without validation
	 * @param token - The JWT token to decode
	 * @returns The decoded token payload or null if decoding fails
	 */
	decodeJwt(token: string): JwtPayload | null {
		try {
			const base64Url = token.split('.')[1];
			const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
			const jsonPayload = decodeURIComponent(
				atob(base64)
					.split('')
					.map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
					.join('')
			);
			return JSON.parse(jsonPayload);
		} catch (error) {
			logger.error('Crypto', 'Error decoding JWT:', undefined, error as Error);
			return null;
		}
	},

	/**
	 * Validates an ID token according to OIDC spec
	 * @param idToken - The ID token to validate
	 * @param clientId - The client ID
	 * @param issuer - The expected token issuer
	 * @param nonce - The nonce used in the authentication request
	 * @returns True if the token is valid, false otherwise
	 */
	validateIdToken(idToken: string, clientId: string, issuer: string, nonce?: string): boolean {
		try {
			const decoded = this.decodeJwt(idToken);
			if (!decoded) return false;

			const now = Math.floor(Date.now() / 1000);

			// Check expiration
			if (decoded.exp === undefined || decoded.exp < now) {
				logger.error('Crypto', 'Token expired or missing expiration');
				return false;
			}

			// Check issuer
			if (decoded.iss !== issuer) {
				logger.error('Crypto', 'Invalid issuer');
				return false;
			}

			// Check audience
			if (decoded.aud !== clientId) {
				logger.error('Crypto', 'Invalid audience');
				return false;
			}

			// Check nonce
			if (nonce && decoded.nonce !== nonce) {
				logger.error('Crypto', 'Invalid nonce');
				return false;
			}

			// Check issued at time
			if (decoded.iat === undefined || decoded.iat > now) {
				logger.error('Crypto', 'Token issued in the future or missing issued at time');
				return false;
			}

			return true;
		} catch (error) {
			logger.error('Crypto', 'Token validation error:', undefined, error as Error);
			return false;
		}
	},

	/**
	 * Parses query parameters from a URL
	 * @param url - The URL to parse
	 * @returns The parsed query parameters
	 */
	parseQueryParams(url: string): QueryParams {
		const params: QueryParams = {};
		const queryString = url.split('?')[1] || '';
		const pairs = queryString.split('&');

		for (const pair of pairs) {
			const [key, value] = pair.split('=');
			if (key) {
				params[decodeURIComponent(key)] = decodeURIComponent(value || '');
			}
		}

		return params;
	},

	/**
	 * Parses hash fragment from a URL
	 * @param url - The URL to parse
	 * @returns The parsed hash parameters
	 */
	parseHashFragment(url: string): QueryParams {
		const params: QueryParams = {};
		const hash = url.split('#')[1] || '';
		const pairs = hash.split('&');

		for (const pair of pairs) {
			const [key, value] = pair.split('=');
			if (key) {
				params[decodeURIComponent(key)] = decodeURIComponent(value || '');
			}
		}

		return params;
	},
};

// Export all functions and types
export const {
	generateRandomString,
	sha256,
	decodeJwt,
	validateIdToken,
	parseQueryParams,
	parseHashFragment,
} = utils;

export type { JwtPayload, QueryParams };
