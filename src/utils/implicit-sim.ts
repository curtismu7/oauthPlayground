// Implicit flow simulation utilities
// Simulates what happens when a user is redirected back to the SPA with tokens in the URL fragment

import { generateState } from './pingone-url-builders';

/**
 * Simulate an implicit flow redirect by generating a mock fragment
 * In a real implementation, this would be handled by the browser redirect
 * @param authUrl - The authorization URL that would trigger the redirect
 * @returns Mock URL fragment containing tokens
 */
export function simulateImplicitRedirect(authUrl: string): string {
	// Parse the auth URL to understand what tokens to simulate
	const url = new URL(authUrl);
	const responseType = url.searchParams.get('response_type');
	const redirectUri = url.searchParams.get('redirect_uri');
	const state = url.searchParams.get('state');

	// Build the fragment based on response_type
	const fragmentParams: Record<string, string> = {};

	// Always include state if provided
	if (state) {
		fragmentParams.state = state;
	}

	// Add tokens based on response_type
	if (responseType?.includes('id_token')) {
		// Simulate a JWT ID token
		fragmentParams.id_token = generateMockIdToken();
	}

	if (responseType?.includes('token')) {
		// Simulate an access token
		fragmentParams.access_token = generateMockAccessToken();
		fragmentParams.token_type = 'Bearer';
		fragmentParams.expires_in = '3600'; // 1 hour
	}

	// Build the fragment string
	const fragmentString = Object.entries(fragmentParams)
		.map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
		.join('&');

	// Return the full redirect URL with fragment
	return `${redirectUri}#${fragmentString}`;
}

/**
 * Parse URL fragment parameters into a key-value object
 * @param fragment - URL fragment string (with or without #)
 * @returns Parsed parameters
 */
export function parseFragmentParams(fragment: string): Record<string, string> {
	// Remove leading # if present
	const cleanFragment = fragment.startsWith('#') ? fragment.slice(1) : fragment;

	const params: Record<string, string> = {};

	// Parse the fragment like URL search params
	const fragmentParams = new URLSearchParams(cleanFragment);

	for (const [key, value] of fragmentParams.entries()) {
		params[key] = value;
	}

	return params;
}

/**
 * Generate a mock ID token (JWT format)
 * In reality, this would come from PingOne
 */
function generateMockIdToken(): string {
	// Mock JWT structure: header.payload.signature
	const header = {
		alg: 'RS256',
		typ: 'JWT',
		kid: 'mock-key-id',
	};

	const now = Math.floor(Date.now() / 1000);
	const payload = {
		iss: 'https://auth.pingone.com/mock-env/as',
		sub: 'mock-user-id',
		aud: 'mock-client-id',
		exp: now + 3600, // expires in 1 hour
		iat: now,
		auth_time: now,
		nonce: generateState(), // mock nonce
		email: 'user@example.com',
		given_name: 'John',
		family_name: 'Doe',
	};

	// Base64 encode header and payload (signature is mocked)
	const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '');
	const encodedPayload = btoa(JSON.stringify(payload)).replace(/=/g, '');
	const mockSignature = 'mock-signature';

	return `${encodedHeader}.${encodedPayload}.${mockSignature}`;
}

/**
 * Generate a mock access token
 * In reality, this would be an opaque token or JWT from PingOne
 */
function generateMockAccessToken(): string {
	// For simulation, generate a mock opaque token
	return `mock-access-token-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Decode a JWT token (ID token) and return header and payload
 * @param token - JWT token string
 * @returns Decoded header and payload, or null if invalid
 */
export function decodeJwt(token: string): { header: any; payload: any } | null {
	try {
		const parts = token.split('.');
		if (parts.length !== 3) {
			return null;
		}

		const header = JSON.parse(atob(parts[0].replace(/-/g, '+').replace(/_/g, '/')));
		const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));

		return { header, payload };
	} catch {
		return null;
	}
}

/**
 * Check if a JWT token is expired
 * @param token - JWT token string
 * @returns true if expired, false otherwise
 */
export function isJwtExpired(token: string): boolean {
	const decoded = decodeJwt(token);
	if (!decoded) return true;

	const now = Math.floor(Date.now() / 1000);
	return decoded.payload.exp < now;
}
