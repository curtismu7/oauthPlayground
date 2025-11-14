// src/utils/mockOAuth.ts - Mock OAuth utilities for educational purposes

import type { MockTokens, MockUserInfo } from '../hooks/useMockOIDCResourceOwnerPasswordController';

interface GenerateMockTokensParams {
	scopes: string[];
	includeRefreshToken?: boolean;
	includeIdToken?: boolean;
	expiresIn?: number;
}

/**
 * Generate mock OAuth/OIDC tokens for educational purposes
 */
export const generateMockTokens = ({
	scopes,
	includeRefreshToken = true,
	includeIdToken = true,
	expiresIn = 3600,
}: GenerateMockTokensParams): MockTokens => {
	const mockTokens: MockTokens = {
		access_token: generateMockAccessToken(),
		token_type: 'Bearer',
		expires_in: expiresIn,
		scope: scopes.join(' '),
	};

	if (includeRefreshToken) {
		mockTokens.refresh_token = generateMockRefreshToken();
	}

	if (includeIdToken && scopes.includes('openid')) {
		mockTokens.id_token = generateMockIdToken();
	}

	return mockTokens;
};

/**
 * Generate a mock access token (JWT-like structure for educational purposes)
 */
export const generateMockAccessToken = (): string => {
	const header = {
		alg: 'RS256',
		typ: 'JWT',
		kid: 'mock-key-id-12345',
	};

	const payload = {
		iss: 'https://auth.pingone.com/mock-env-12345/as',
		sub: 'mock-user-12345',
		aud: 'mock-client-id',
		exp: Math.floor(Date.now() / 1000) + 3600,
		iat: Math.floor(Date.now() / 1000),
		scope: 'openid profile email',
		client_id: 'mock-client-id',
		username: 'demo@example.com',
	};

	const signature = 'mock-signature-for-educational-purposes';

	return `${btoa(JSON.stringify(header))}.${btoa(JSON.stringify(payload))}.${signature}`;
};

/**
 * Generate a mock refresh token
 */
export const generateMockRefreshToken = (): string => {
	const randomBytes = new Uint8Array(32);
	crypto.getRandomValues(randomBytes);
	return Array.from(randomBytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Generate a mock ID token (OIDC)
 */
export const generateMockIdToken = (): string => {
	const header = {
		alg: 'RS256',
		typ: 'JWT',
		kid: 'mock-key-id-12345',
	};

	const payload = {
		iss: 'https://auth.pingone.com/mock-env-12345/as',
		sub: 'mock-user-12345',
		aud: 'mock-client-id',
		exp: Math.floor(Date.now() / 1000) + 3600,
		iat: Math.floor(Date.now() / 1000),
		auth_time: Math.floor(Date.now() / 1000),
		nonce: 'mock-nonce-12345',
		// Standard OIDC claims
		name: 'Demo User',
		given_name: 'Demo',
		family_name: 'User',
		email: 'demo@example.com',
		email_verified: true,
		picture: 'https://via.placeholder.com/150/0066cc/ffffff?text=Demo',
		locale: 'en-US',
		updated_at: Math.floor(Date.now() / 1000),
	};

	const signature = 'mock-signature-for-educational-purposes';

	return `${btoa(JSON.stringify(header))}.${btoa(JSON.stringify(payload))}.${signature}`;
};

/**
 * Generate mock user info for the UserInfo endpoint
 */
export const generateMockUserInfo = (username: string): MockUserInfo => {
	const [localPart] = username.split('@');
	const displayName = localPart.charAt(0).toUpperCase() + localPart.slice(1);

	return {
		sub: 'mock-user-12345',
		name: `${displayName} User`,
		email: username,
		email_verified: true,
		given_name: displayName,
		family_name: 'User',
		picture: `https://via.placeholder.com/150/0066cc/ffffff?text=${displayName.charAt(0)}`,
	};
};

/**
 * Decode a mock JWT token for display purposes
 */
export const decodeMockJWT = (
	token: string
): { header: any; payload: any; signature: string } | null => {
	try {
		const parts = token.split('.');
		if (parts.length !== 3) {
			return null;
		}

		const header = JSON.parse(atob(parts[0]));
		const payload = JSON.parse(atob(parts[1]));
		const signature = parts[2];

		return { header, payload, signature };
	} catch (error) {
		console.error('Failed to decode mock JWT:', error);
		return null;
	}
};

/**
 * Validate mock token expiration
 */
export const isMockTokenExpired = (token: string): boolean => {
	const decoded = decodeMockJWT(token);
	if (!decoded || !decoded.payload.exp) {
		return true;
	}

	return Date.now() / 1000 > decoded.payload.exp;
};

/**
 * Get mock token claims
 */
export const getMockTokenClaims = (token: string): Record<string, any> | null => {
	const decoded = decodeMockJWT(token);
	return decoded ? decoded.payload : null;
};
