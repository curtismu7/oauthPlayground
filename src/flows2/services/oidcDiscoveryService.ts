// src/flows2/services/oidcDiscoveryService.ts
//
// OIDC Discovery + JWKS as a flows2 service.
// real mode → POST /api/pingone/oidc-discovery with the issuer URL constructed from
//             environmentId + region, then GET /api/jwks?environment_id=... for signing keys.
// mock mode → return a deterministic offline discovery document and a static RSA JWKS,
//             so the flow works without any PingOne credentials.

import type { FlowCredentials, FlowMode } from '../framework/types';
import { pingoneHost } from './pingone';

/** The OIDC discovery document (RFC 8414 / OpenID Connect Discovery 1.0). */
export type DiscoveryDocument = Record<string, unknown>;

/** A JSON Web Key Set (RFC 7517). */
export interface JwksResult {
	keys: JwkKey[];
	raw: Record<string, unknown>;
}

export interface JwkKey {
	kid: string;
	kty: string;
	alg?: string;
	use?: string;
	[k: string]: unknown;
}

function pingOneIssuer(environmentId: string, region: string): string {
	return `https://${pingoneHost(region)}/${environmentId}/as`;
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

function mockDiscovery(environmentId: string, region: string): DiscoveryDocument {
	const issuer = pingOneIssuer(environmentId || 'mock-env-id', region || 'com');
	return {
		issuer,
		authorization_endpoint: `${issuer}/authorize`,
		token_endpoint: `${issuer}/token`,
		userinfo_endpoint: `${issuer}/userinfo`,
		jwks_uri: `${issuer}/jwks`,
		end_session_endpoint: `${issuer}/signoff`,
		introspection_endpoint: `${issuer}/introspect`,
		revocation_endpoint: `${issuer}/revoke`,
		device_authorization_endpoint: `${issuer}/device_authorization`,
		response_types_supported: ['code', 'token', 'id_token', 'code token', 'code id_token', 'token id_token', 'code token id_token'],
		grant_types_supported: ['authorization_code', 'implicit', 'client_credentials', 'refresh_token', 'urn:ietf:params:oauth:grant-type:device_code', 'urn:openid:params:grant-type:ciba'],
		scopes_supported: ['openid', 'profile', 'email', 'phone', 'address', 'offline_access'],
		subject_types_supported: ['public'],
		id_token_signing_alg_values_supported: ['RS256'],
		token_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post', 'private_key_jwt'],
		claims_supported: ['sub', 'iss', 'aud', 'exp', 'iat', 'name', 'given_name', 'family_name', 'email', 'phone_number', 'address', 'updated_at'],
		code_challenge_methods_supported: ['S256'],
		_mock: true,
	};
}

const MOCK_KEY: JwkKey = {
	kid: 'mock-key-20240101',
	kty: 'RSA',
	alg: 'RS256',
	use: 'sig',
	// Truncated but structurally valid base64url-encoded RSA public key components
	n: 'wJUEMvKB3yqm4fAOyq85JdKxa7XUyA3K9m3mW8-VNqLFvFQOFTdFy12iR0VJ7kDvMwLpHpHw5h5F4E_DuqYkNjzl3oJqQY-fYbDxQZ7WB3lRfp5cLHoE5iXEj7p0n3qN8G8eX_z2dJjKNmIUpZVwN1sGpBJe4P2_9wDj4kWqnT2s_KSa1FjAkILBVLi_7D5jtQE3a_2ZNoP1BIhU7Ro9QqZJ4BuNdBW9RJhp9L6zAlvHAc0hBE-6UVYs-8-w0XoJcuE3MmWtLqhFXDwZS2FQMJ7u4M_rPJaVVOvfPWp4aYzC3GfmKNfMrZY4MH1_5WcnbzPrH8NLzHBEQ',
	e: 'AQAB',
};

const MOCK_JWKS: JwksResult = {
	keys: [MOCK_KEY],
	raw: {
		keys: [MOCK_KEY],
		_mock: true,
	},
};

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const oidcDiscoveryService = {
	/**
	 * Fetch the OIDC discovery document for the given credentials.
	 * real mode → POST /api/pingone/oidc-discovery with { issuerUrl }
	 * mock mode → return a deterministic offline document
	 */
	async discover(credentials: FlowCredentials, mode: FlowMode): Promise<DiscoveryDocument> {
		if (mode === 'mock') {
			return mockDiscovery(credentials.environmentId, credentials.region);
		}

		const issuerUrl = pingOneIssuer(credentials.environmentId, credentials.region);
		const res = await fetch('/api/pingone/oidc-discovery', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ issuerUrl }),
		});
		let data: Record<string, unknown> = {};
		try {
			data = (await res.json()) as Record<string, unknown>;
		} catch {
			throw {
				error: 'invalid_response',
				error_description: `Discovery failed (HTTP ${res.status}) — response was not valid JSON`,
				status: res.status,
			};
		}
		if (!res.ok || data.error) {
			throw {
				error: (data.error as string) || 'discovery_failed',
				error_description:
					(data.error_description as string) ||
					(data.message as string) ||
					`Discovery failed (HTTP ${res.status})`,
				status: res.status,
			};
		}
		if (!data.issuer || !data.token_endpoint) {
			throw {
				error: 'invalid_discovery_response',
				error_description: 'Discovery response missing required fields (issuer, token_endpoint)',
				status: res.status,
			};
		}
		return data;
	},

	/**
	 * Fetch the JWKS (signing keys) for the given environment.
	 * real mode → GET /api/jwks?environment_id=<uuid> (jwksUri is threaded for narrative context)
	 * mock mode → return a static RSA key
	 */
	async fetchJwks(credentials: FlowCredentials, mode: FlowMode, jwksUri?: string): Promise<JwksResult> {
		if (mode === 'mock') {
			return MOCK_JWKS;
		}

		const params = new URLSearchParams({ environment_id: credentials.environmentId });
		const res = await fetch(`/api/jwks?${params.toString()}`, {
			method: 'GET',
			headers: { Accept: 'application/json' },
		});
		let data: Record<string, unknown> = {};
		try {
			data = (await res.json()) as Record<string, unknown>;
		} catch {
			throw {
				error: 'invalid_response',
				error_description: `JWKS fetch failed (HTTP ${res.status}) — response was not valid JSON`,
				status: res.status,
			};
		}
		if (!res.ok || data.error) {
			throw {
				error: (data.error as string) || 'jwks_fetch_failed',
				error_description:
					(data.error_description as string) || `JWKS fetch failed (HTTP ${res.status})`,
				status: res.status,
			};
		}
		if (!Array.isArray(data.keys)) {
			throw {
				error: 'invalid_jwks_response',
				error_description: 'JWKS response missing or invalid keys field',
				status: res.status,
			};
		}
		const keys = data.keys as JwkKey[];
		return { keys, raw: data };
	},
};
