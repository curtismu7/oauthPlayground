// src/utils/tokenDebug.ts
import { oauthStorage } from './storage';

import { logger } from '../utils/logger';
/**
 * Debug utility for token validation and troubleshooting
 */

/**
 * Check the current state of stored tokens
 */
export async function checkTokenState(): Promise<{
	hasTokens: boolean;
	tokenCount: number;
	refreshTokenValid: boolean;
	refreshTokenLength: number;
	refreshTokenPreview: string;
	accessTokenLength: number;
	accessTokenPreview: string;
}> {
	try {
		const tokens = await oauthStorage.getTokens();

		if (!tokens) {
			return {
				hasTokens: false,
				tokenCount: 0,
				refreshTokenValid: false,
				refreshTokenLength: 0,
				refreshTokenPreview: 'none',
				accessTokenLength: 0,
				accessTokenPreview: 'none',
			};
		}

		const tokenCount = Object.keys(tokens).length;
		const refreshTokenValid = tokens.refresh_token
			? tokens.refresh_token.length >= 10 &&
				tokens.refresh_token.length <= 1000 &&
				tokens.refresh_token.trim() !== ''
			: false;

		return {
			hasTokens: true,
			tokenCount,
			refreshTokenValid,
			refreshTokenLength: tokens.refresh_token?.length || 0,
			refreshTokenPreview: tokens.refresh_token
				? `${tokens.refresh_token.substring(0, 10)}...`
				: 'none',
			accessTokenLength: tokens.access_token?.length || 0,
			accessTokenPreview: tokens.access_token
				? `${tokens.access_token.substring(0, 10)}...`
				: 'none',
		};
	} catch (error) {
		logger.error('TokenDebugger: Failed to check token state', error);
		return {
			hasTokens: false,
			tokenCount: 0,
			refreshTokenValid: false,
			refreshTokenLength: 0,
			refreshTokenPreview: 'error',
			accessTokenLength: 0,
			accessTokenPreview: 'error',
		};
	}
}

/**
 * Clear all tokens and return success status
 */
export async function clearAllTokens(): Promise<{ success: boolean; error?: string }> {
	try {
		await oauthStorage.clearTokens();
		return { success: true };
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

/**
 * Validate a refresh token format
 */
export function validateRefreshToken(token: string): {
	isValid: boolean;
	reasons: string[];
} {
	const reasons: string[] = [];

	if (!token) {
		reasons.push('Token is null or undefined');
	} else if (token.trim() === '') {
		reasons.push('Token is empty or whitespace only');
	} else if (token.length < 10) {
		reasons.push(`Token too short (${token.length} chars, minimum 10)`);
	} else if (token.length > 1000) {
		reasons.push(`Token too long (${token.length} chars, maximum 1000)`);
	}

	return {
		isValid: reasons.length === 0,
		reasons,
	};
}

// Make it available globally for debugging
if (typeof window !== 'undefined') {
	(window as Record<string, unknown>).TokenDebugger = {
		checkTokenState,
		clearAllTokens,
		validateRefreshToken,
	};
}
