// src/services/tokenDisplayService.ts
/**
 * Token Display Service
 *
 * Provides secure token handling utilities for V6 flows including:
 * - JWT detection and decoding
 * - Safe clipboard operations
 * - Token masking utilities
 * - Secure logging without token values
 *
 * Security: Never logs token values, only type/length/flow information
 */

interface DecodedJWT {
	header: Record<string, any>;
	payload: Record<string, any>;
	signature?: string;
}

interface TokenInfo {
	type: 'access' | 'id' | 'refresh';
	length: number;
	isJWT: boolean;
	flow?: string;
}

class TokenDisplayService {
	/**
	 * Checks if a token is a valid JWT format (3 parts separated by dots)
	 */
	public static isJWT(token: string): boolean {
		if (!token || typeof token !== 'string') return false;

		const parts = token.split('.');
		return parts.length === 3 && parts.every((part) => part.length > 0);
	}

	/**
	 * Decodes a JWT token safely
	 * Returns null if token is not a valid JWT
	 */
	public static decodeJWT(token: string): DecodedJWT | null {
		if (!TokenDisplayService.isJWT(token)) {
			return null;
		}

		try {
			const parts = token.split('.');

			// Decode header
			const header = JSON.parse(atob(parts[0].replace(/-/g, '+').replace(/_/g, '/')));

			// Decode payload
			const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));

			return {
				header,
				payload,
				signature: parts[2],
			};
		} catch (error) {
			console.error('[🔐 TOKEN-DISPLAY-V6][ERROR] Failed to decode JWT:', error);
			return null;
		}
	}

	/**
	 * Safely copies text to clipboard
	 */
	public static async copyToClipboard(text: string): Promise<boolean> {
		try {
			await navigator.clipboard.writeText(text);
			return true;
		} catch (error) {
			console.error('[🔐 TOKEN-DISPLAY-V6][ERROR] Failed to copy to clipboard:', error);

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
				return successful;
			} catch (fallbackError) {
				console.error('[🔐 TOKEN-DISPLAY-V6][ERROR] Fallback copy failed:', fallbackError);
				return false;
			}
		}
	}

	/**
	 * Creates a masked version of a token for preview
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
	 */
	public static getTokenInfo(
		token: string,
		type: 'access' | 'id' | 'refresh',
		flow?: string
	): TokenInfo {
		return {
			type,
			length: token?.length || 0,
			isJWT: TokenDisplayService.isJWT(token || ''),
			flow,
		};
	}

	/**
	 * Logs token panel rendering (secure - no token values)
	 */
	public static logTokenRender(tokenInfo: TokenInfo): void {
		const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
		console.log(
			`[${timestamp}][🔐 TOKEN-DISPLAY-V6][INFO] Rendered ${tokenInfo.type} Token panel (length=${tokenInfo.length}, isJWT=${tokenInfo.isJWT}, flow=${tokenInfo.flow || 'unknown'})`
		);
	}

	/**
	 * Logs token copy operation (secure - no token values)
	 */
	public static logTokenCopy(tokenInfo: TokenInfo): void {
		const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
		console.log(
			`[${timestamp}][🔐 TOKEN-DISPLAY-V6][INFO] Copied ${tokenInfo.type} Token (length=${tokenInfo.length}, flow=${tokenInfo.flow || 'unknown'})`
		);
	}

	/**
	 * Logs token decode operation (secure - no token values)
	 */
	public static logTokenDecode(tokenInfo: TokenInfo, success: boolean): void {
		const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
		const level = success ? 'INFO' : 'WARN';
		console.log(
			`[${timestamp}][🔐 TOKEN-DISPLAY-V6][${level}] Decode ${tokenInfo.type} Token (length=${tokenInfo.length}, isJWT=${tokenInfo.isJWT}, success=${success}, flow=${tokenInfo.flow || 'unknown'})`
		);
	}

	/**
	 * Determines if a flow is OIDC-based
	 */
	public static isOIDCFlow(flowKey: string): boolean {
		return /oidc|authz|hybrid|implicit/i.test(flowKey);
	}

	/**
	 * Gets the appropriate token type label
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
}

export default TokenDisplayService;
export type { DecodedJWT, TokenInfo };
