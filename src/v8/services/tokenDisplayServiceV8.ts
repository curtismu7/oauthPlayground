// src/v8/services/tokenDisplayServiceV8.ts
/**
 * @file tokenDisplayServiceV8.ts
 * @module v8/services
 * @description Token display service for V8 flows with JWT decoding
 * @version 8.0.0
 * @since 2024-11-16
 *
 * Provides secure token handling utilities for V8 flows including:
 * - JWT detection and decoding
 * - Safe clipboard operations
 * - Token masking utilities
 * - Secure logging without token values
 *
 * Security: Never logs token values, only type/length/flow information
 *
 * @example
 * // Check if token is JWT
 * const isJWT = TokenDisplayServiceV8.isJWT(token);
 *
 * // Decode JWT token
 * const decoded = TokenDisplayServiceV8.decodeJWT(token);
 *
 * // Copy token to clipboard
 * await TokenDisplayServiceV8.copyToClipboard(token, 'Access Token');
 */

const MODULE_TAG = '[🎫 TOKEN-DISPLAY-V8]';

// ============================================================================
// TYPES
// ============================================================================

export interface DecodedJWT {
	header: Record<string, unknown>;
	payload: Record<string, unknown>;
	signature: string;
}

export interface TokenInfo {
	type: 'access' | 'id' | 'refresh';
	length: number;
	isJWT: boolean;
	flow?: string;
}

// ============================================================================
// TOKEN DISPLAY SERVICE CLASS
// ============================================================================

export class TokenDisplayServiceV8 {
	/**
	 * Checks if a token is a valid JWT format (3 parts separated by dots)
	 * @param token - Token string to check
	 * @returns True if token appears to be a JWT
	 * @example
	 * const isJWT = TokenDisplayServiceV8.isJWT('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
	 */
	public static isJWT(token: string): boolean {
		if (!token || typeof token !== 'string') {
			return false;
		}

		const parts = token.split('.');
		return parts.length === 3 && parts.every((part) => part.length > 0);
	}

	/**
	 * Decodes a JWT token safely
	 * Returns null if token is not a valid JWT
	 * @param token - JWT token to decode
	 * @returns Decoded JWT with header, payload, and signature, or null if invalid
	 * @example
	 * const decoded = TokenDisplayServiceV8.decodeJWT(token);
	 * if (decoded) {
	 *   console.log('Header:', decoded.header);
	 *   console.log('Payload:', decoded.payload);
	 * }
	 */
	public static decodeJWT(token: string): DecodedJWT | null {
		if (!TokenDisplayServiceV8.isJWT(token)) {
			return null;
		}

		try {
			const parts = token.split('.');

			// Base64 URL decode header
			const header = JSON.parse(TokenDisplayServiceV8.base64UrlDecode(parts[0]));

			// Base64 URL decode payload
			const payload = JSON.parse(TokenDisplayServiceV8.base64UrlDecode(parts[1]));

			console.log(`${MODULE_TAG} Token decoded successfully`);

			return {
				header,
				payload,
				signature: parts[2],
			};
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to decode JWT:`, error);
			return null;
		}
	}

	/**
	 * Base64 URL decode helper
	 * @param str - Base64 URL encoded string
	 * @returns Decoded string
	 */
	private static base64UrlDecode(str: string): string {
		let base64 = str.replace(/-/g, '+').replace(/_/g, '/');

		// Add padding if needed
		const padding = 4 - (base64.length % 4);
		if (padding !== 4) {
			base64 += '='.repeat(padding);
		}

		// Use atob for browser compatibility (browser environment)
		if (typeof atob !== 'undefined') {
			return atob(base64);
		}

		// Node.js fallback (for testing/server-side)
		if (typeof Buffer !== 'undefined') {
			return Buffer.from(base64, 'base64').toString('utf-8');
		}

		throw new Error('Base64 decoding not available in this environment');
	}

	/**
	 * Safely copies text to clipboard
	 * @param text - Text to copy
	 * @param label - Label for logging (optional)
	 * @returns True if copy was successful
	 * @example
	 * const success = await TokenDisplayServiceV8.copyToClipboard(token, 'Access Token');
	 */
	public static async copyToClipboard(text: string, label?: string): Promise<boolean> {
		try {
			await navigator.clipboard.writeText(text);
			if (label) {
				console.log(`${MODULE_TAG} Copied ${label} to clipboard`);
			}
			return true;
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to copy to clipboard:`, error);

			// Fallback for older browsers
			try {
				const textArea = document.createElement('textarea');
				textArea.value = text;
				textArea.style.position = 'fixed';
				textArea.style.left = '-999999px';
				textArea.style.top = '-999999px';
				document.body.appendChild(textArea);
				textArea.focus();
				textArea.select();
				const successful = document.execCommand('copy');
				document.body.removeChild(textArea);

				if (successful && label) {
					console.log(`${MODULE_TAG} Copied ${label} to clipboard (fallback method)`);
				}

				return successful;
			} catch (fallbackError) {
				console.error(`${MODULE_TAG} Fallback copy failed:`, fallbackError);
				return false;
			}
		}
	}

	/**
	 * Creates a masked version of a token for preview
	 * @param token - Token to mask
	 * @param visibleChars - Number of characters to show at start and end
	 * @returns Masked token string
	 * @example
	 * const masked = TokenDisplayServiceV8.maskToken(token, 4);
	 * // Returns: "abc1...xyz9"
	 */
	public static maskToken(token: string, visibleChars: number = 4): string {
		if (!token || token.length <= visibleChars * 2) {
			return '••••••••••••••••••••';
		}

		const start = token.substring(0, visibleChars);
		const end = token.substring(token.length - visibleChars);
		const middle = '•'.repeat(Math.max(8, token.length - visibleChars * 2));

		return `${start}${middle}${end}`;
	}

	/**
	 * Gets token information for logging (secure - no token values)
	 * @param token - Token string
	 * @param type - Token type
	 * @param flow - Flow key (optional)
	 * @returns Token info object
	 */
	public static getTokenInfo(
		token: string,
		type: 'access' | 'id' | 'refresh',
		flow?: string
	): TokenInfo {
		return {
			type,
			length: token?.length || 0,
			isJWT: TokenDisplayServiceV8.isJWT(token || ''),
			flow,
		};
	}

	/**
	 * Formats decoded JWT for display
	 * @param decoded - Decoded JWT object
	 * @returns Formatted string representation
	 * @example
	 * const decoded = TokenDisplayServiceV8.decodeJWT(token);
	 * const formatted = TokenDisplayServiceV8.formatDecodedJWT(decoded);
	 */
	public static formatDecodedJWT(decoded: DecodedJWT): string {
		return `Header:
${JSON.stringify(decoded.header, null, 2)}

Payload:
${JSON.stringify(decoded.payload, null, 2)}

Signature: ${decoded.signature}`;
	}

	/**
	 * Gets the appropriate token type label
	 * @param tokenType - Token type
	 * @param isOIDC - Whether this is an OIDC flow
	 * @returns Token label string
	 */
	public static getTokenLabel(
		tokenType: 'access' | 'id' | 'refresh',
		isOIDC: boolean = false
	): string {
		switch (tokenType) {
			case 'access':
				return 'Access Token';
			case 'id':
				return isOIDC ? 'ID Token (OIDC)' : 'ID Token';
			case 'refresh':
				return 'Refresh Token';
			default:
				return 'Token';
		}
	}

	/**
	 * Gets the decode error message for opaque tokens
	 * @param tokenType - Token type
	 * @returns Error message string
	 */
	public static getOpaqueTokenMessage(tokenType: 'access' | 'id' | 'refresh'): string {
		switch (tokenType) {
			case 'access':
				return 'Access token is opaque and cannot be decoded as JWT.';
			case 'id':
				return 'ID token should be a JWT in OIDC flows. If opaque, this may indicate a configuration issue.';
			case 'refresh':
				return 'Refresh token is opaque and cannot be decoded as JWT.';
			default:
				return 'Token is opaque and cannot be decoded as JWT.';
		}
	}

	/**
	 * Formats token expiry time
	 * @param seconds - Expiry time in seconds
	 * @returns Formatted expiry string
	 * @example
	 * const formatted = TokenDisplayServiceV8.formatExpiry(3600);
	 * // Returns: "1h 0m 0s"
	 */
	public static formatExpiry(seconds: number): string {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		const remainingSeconds = seconds % 60;

		if (hours > 0) {
			return `${hours}h ${minutes}m ${remainingSeconds}s`;
		} else if (minutes > 0) {
			return `${minutes}m ${remainingSeconds}s`;
		} else {
			return `${remainingSeconds}s`;
		}
	}
}

export default TokenDisplayServiceV8;
