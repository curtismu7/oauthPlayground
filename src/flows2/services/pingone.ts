// src/flows2/services/pingone.ts
//
// Tiny helpers shared by the flows2 services: PingOne auth-host selection and
// unverified JWT payload decoding (for mock/teaching views — never validation).

import type { TokenResult } from '../framework/types';

export function pingoneHost(region?: string): string {
	const r = (region || 'com').toLowerCase().trim();
	if (r === 'eu') return 'auth.pingone.eu';
	if (r === 'ca') return 'auth.pingone.ca';
	if (r === 'ap' || r === 'asia') return 'auth.pingone.asia';
	return 'auth.pingone.com';
}

/** Decode a JWT payload without verification — null for opaque/garbled tokens. */
export function decodeJwtPayload(token?: string): Record<string, unknown> | null {
	if (!token) return null;
	const parts = token.split('.');
	if (parts.length < 2) return null;
	try {
		const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
		if (!base64) return null;
		const decoded = atob(base64);
		return JSON.parse(decoded) as Record<string, unknown>;
	} catch (_err) {
		return null;
	}
}

/** Normalize a token-endpoint response into a typed TokenResult. */
export function toTokenResult(data: Record<string, unknown>): TokenResult {
	return {
		accessToken: typeof data.access_token === 'string' ? data.access_token : undefined,
		tokenType: typeof data.token_type === 'string' ? data.token_type : undefined,
		expiresIn: typeof data.expires_in === 'number' ? data.expires_in : undefined,
		scope: typeof data.scope === 'string' ? data.scope : undefined,
		idToken: typeof data.id_token === 'string' ? data.id_token : undefined,
		refreshToken: typeof data.refresh_token === 'string' ? data.refresh_token : undefined,
		raw: data,
	};
}

/** Return the canonical PingOne AS endpoint URLs for a given credential set. */
export function pingoneEndpoints(creds: { environmentId: string; region?: string }) {
	const base = `https://${pingoneHost(creds.region)}/${creds.environmentId}/as`;
	return {
		authorize: `${base}/authorize`,
		token: `${base}/token`,
		par: `${base}/par`,
		device_authorization: `${base}/device_authorization`,
		introspect: `${base}/introspect`,
		revoke: `${base}/revoke`,
		userinfo: `${base}/userinfo`,
		discovery: `${base}/.well-known/openid-configuration`,
	};
}

// Apply client authentication to a token-endpoint param set (RFC 6749 2.3 / RFC 7617).
// client_secret_basic -> Authorization: Basic header (+ client_id still in body for PingOne).
// client_secret_post (or public) -> client_id [+ client_secret] in the body.
export function applyClientAuth(
	params: URLSearchParams,
	creds: { clientId: string; clientSecret?: string; authMethod?: 'client_secret_post' | 'client_secret_basic' }
): { body: string; headers?: Record<string, string> } {
	const method = creds.authMethod ?? 'client_secret_post';
	if (method === 'client_secret_basic' && creds.clientSecret) {
		const basic = btoa(`${creds.clientId}:${creds.clientSecret}`);
		params.set('client_id', creds.clientId);
		return { body: params.toString(), headers: { Authorization: `Basic ${basic}` } };
	}
	params.set('client_id', creds.clientId);
	if (creds.clientSecret) params.set('client_secret', creds.clientSecret);
	return { body: params.toString() };
}
