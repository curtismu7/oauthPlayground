/**
 * @file authHeaderUtilsV8.ts
 * @module v8/utils
 * @description Centralized authorization header utilities for consistent token handling
 * @version 8.0.0
 *
 * Provides standardized functions for creating Authorization headers with Bearer tokens.
 * Ensures consistent format across all API calls.
 */

const MODULE_TAG = '[🔐 AUTH-HEADER-UTILS-V8]';

/**
 * Create a standardized Authorization header with Bearer token
 *
 * @param token - The access token (worker or user token)
 * @param options - Optional configuration
 * @returns Authorization header value in format "Bearer {token}"
 *
 * @example
 * const headers = {
 *   Authorization: createAuthHeader(accessToken),
 *   'Content-Type': 'application/json'
 * };
 */
export function createAuthHeader(
	token: string | null | undefined,
	options?: {
		/** If true, validates token format before creating header */
		validate?: boolean;
		/** If true, trims whitespace from token */
		trim?: boolean;
	}
): string {
	const { validate = false, trim = true } = options || {};

	if (!token) {
		console.warn(`${MODULE_TAG} No token provided to createAuthHeader`);
		return '';
	}

	let cleanToken = token;

	// Remove existing Bearer prefix if present
	if (cleanToken.startsWith('Bearer ') || cleanToken.startsWith('Bearer')) {
		cleanToken = cleanToken.replace(/^Bearer\s*/i, '');
	}

	// Trim whitespace if requested
	if (trim) {
		cleanToken = cleanToken.trim();
	}

	// Validate token format if requested
	if (validate) {
		if (!cleanToken || cleanToken.length === 0) {
			throw new Error('Invalid token: token is empty after cleaning');
		}
		// Basic validation - token should be non-empty string
		if (typeof cleanToken !== 'string') {
			throw new Error(`Invalid token: expected string, got ${typeof cleanToken}`);
		}
	}

	return `Bearer ${cleanToken}`;
}

/**
 * Create Authorization headers object for fetch/axios requests
 *
 * @param token - The access token (worker or user token)
 * @param options - Optional configuration
 * @returns Headers object with Authorization header, or empty object if no token
 *
 * @example
 * const headers = {
 *   ...createAuthHeaders(accessToken),
 *   'Content-Type': 'application/json'
 * };
 */
export function createAuthHeaders(
	token: string | null | undefined,
	options?: {
		validate?: boolean;
		trim?: boolean;
	}
): Record<string, string> {
	if (!token) {
		return {};
	}

	const authHeader = createAuthHeader(token, options);

	if (!authHeader) {
		return {};
	}

	return {
		Authorization: authHeader,
	};
}

/**
 * Extract token from Authorization header
 *
 * @param authHeader - Authorization header value (e.g., "Bearer token123")
 * @returns The token without the "Bearer " prefix, or null if invalid
 *
 * @example
 * const token = extractTokenFromHeader(headers.Authorization);
 */
export function extractTokenFromHeader(authHeader: string | null | undefined): string | null {
	if (!authHeader) {
		return null;
	}

	// Remove Bearer prefix if present
	const token = authHeader.replace(/^Bearer\s*/i, '').trim();

	return token || null;
}

/**
 * Validate token format
 *
 * @param token - The token to validate
 * @returns True if token appears valid, false otherwise
 */
export function isValidTokenFormat(token: string | null | undefined): boolean {
	if (!token || typeof token !== 'string') {
		return false;
	}

	const trimmed = token.trim();

	// Basic validation: non-empty string
	if (trimmed.length === 0) {
		return false;
	}

	// Remove Bearer prefix if present for validation
	const cleanToken = trimmed.replace(/^Bearer\s*/i, '').trim();

	return cleanToken.length > 0;
}
