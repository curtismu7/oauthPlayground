// src/utils/reusableTokenUtils.ts
import { v4ToastManager } from './v4ToastMessages';

/**
 * Reusable JWT decoding utility extracted from TokenManagement
 */
export const decodeJWT = (token: string): { header: string; payload: string } => {
	if (!token || token.trim() === '') {
		throw new Error('Please enter a JWT token');
	}

	const parts = token.split('.');
	if (parts.length !== 3) {
		throw new Error('Invalid JWT format. JWT should have 3 parts separated by dots.');
	}

	// Helper function to decode base64url
	const base64UrlDecode = (str: string): string => {
		// Add padding if needed
		const padding = '='.repeat((4 - (str.length % 4)) % 4);
		const base64 = str.replace(/-/g, '+').replace(/_/g, '/') + padding;
		return atob(base64);
	};

	try {
		const headerDecoded = base64UrlDecode(parts[0]);
		const payloadDecoded = base64UrlDecode(parts[1]);
		
		return {
			header: headerDecoded,
			payload: payloadDecoded
		};
	} catch (parseError) {
		throw new Error(`Failed to parse JWT: ${parseError}`);
	}
};

/**
 * Check if a token is expired based on exp claim
 */
export const isTokenExpired = (token: string): boolean => {
	try {
		const { payload } = decodeJWT(token);
		const parsedPayload = JSON.parse(payload);
		
		if (!parsedPayload.exp) {
			return false; // No expiration claim
		}
		
		const now = Math.floor(Date.now() / 1000);
		return now >= parsedPayload.exp;
	} catch {
		return true; // If we can't decode, consider it expired
	}
};

/**
 * Get token expiration time in human readable format
 */
export const getTokenExpiration = (token: string): string | null => {
	try {
		const { payload } = decodeJWT(token);
		const parsedPayload = JSON.parse(payload);
		
		if (!parsedPayload.exp) {
			return null;
		}
		
		return new Date(parsedPayload.exp * 1000).toLocaleString();
	} catch {
		return null;
	}
};

/**
 * Extract token type from JWT
 */
export const getTokenType = (token: string): 'access_token' | 'id_token' | 'refresh_token' | 'unknown' => {
	try {
		const { payload } = decodeJWT(token);
		const parsedPayload = JSON.parse(payload);
		
		// Check for common ID token claims
		if (parsedPayload.aud && parsedPayload.iss && parsedPayload.sub && parsedPayload.auth_time) {
			return 'id_token';
		}
		
		// Check for access token claims
		if (parsedPayload.scope || parsedPayload.client_id) {
			return 'access_token';
		}
		
		return 'unknown';
	} catch {
		return 'unknown';
	}
};

/**
 * Copy token to clipboard with toast feedback
 */
export const copyTokenToClipboard = (token: string, tokenType: string = 'Token'): void => {
	v4ToastManager.handleCopyOperation(token, tokenType);
};

/**
 * Validate token format (basic JWT structure check)
 */
export const isValidJWTFormat = (token: string): boolean => {
	if (!token || typeof token !== 'string') return false;
	
	const parts = token.split('.');
	return parts.length === 3 && parts.every(part => part.length > 0);
};

/**
 * Get token claims safely
 */
export const getTokenClaims = (token: string): Record<string, any> | null => {
	try {
		const { payload } = decodeJWT(token);
		return JSON.parse(payload);
	} catch {
		return null;
	}
};
