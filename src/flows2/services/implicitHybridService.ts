// src/flows2/services/implicitHybridService.ts
//
// Implicit + Hybrid flow service for the flows2 clean-core rebuild.
// Self-contained: fetches the BFF directly, imports nothing from src/services/*.
// Real mode: builds the /as/authorize URL and (for hybrid) calls /api/pingone/token.
// Mock mode: issues deterministic offline fragment params.

import type { FlowCredentials, FlowMode, TokenResult } from '../framework/types';
import { applyClientAuth, pingoneHost, toTokenResult } from './pingone';

// ── Sub-mode ────────────────────────────────────────────────────────────────

/** The two taught sub-modes. Both return via the URL fragment (#...). */
export type ImplicitHybridSubMode = 'implicit' | 'hybrid';

// ── Public parameter types ───────────────────────────────────────────────────

export interface BuildAuthorizeUrlParams {
	credentials: FlowCredentials;
	subMode: ImplicitHybridSubMode;
	oidc: boolean;
	redirectUri: string;
	state: string;
	nonce: string;
}

/** Parsed key→value from a raw fragment string (leading '#' or without). */
export type FragmentParams = Record<string, string>;

export interface ExchangeCodeParams {
	credentials: FlowCredentials;
	redirectUri: string;
	code: string;
}

// ── Mock fragment shapes ─────────────────────────────────────────────────────

export interface MockImplicitFragment {
	access_token: string;
	token_type: 'Bearer';
	id_token?: string;
	expires_in: number;
	scope: string;
	state: string;
}

export interface MockHybridFragment {
	code: string;
	id_token: string;
	state: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function authorizeEndpoint(c: FlowCredentials): string {
	return `https://${pingoneHost(c.region)}/${c.environmentId}/as/authorize`;
}

function resolveScope(c: FlowCredentials, oidc: boolean): string {
	if (c.scope?.trim()) return c.scope.trim();
	return oidc ? 'openid profile email' : 'openid';
}

/** Build a fake JWT-like opaque string for mock tokens (teaching only, not verifiable). */
function mockJwt(payload: Record<string, unknown>): string {
	const safeBase64 = (str: string) => {
		try {
			return btoa(unescape(encodeURIComponent(str)))
				.replace(/\+/g, '-')
				.replace(/\//g, '_')
				.replace(/=/g, '');
		} catch {
			return btoa(str)
				.replace(/\+/g, '-')
				.replace(/\//g, '_')
				.replace(/=/g, '');
		}
	};
	const header = safeBase64(JSON.stringify({ alg: 'none', typ: 'JWT' }));
	const body = safeBase64(JSON.stringify({ iat: Math.floor(Date.now() / 1000), ...payload }));
	return `${header}.${body}.mock_sig`;
}

// ── Core functions ───────────────────────────────────────────────────────────

/**
 * Build the authorization URL. Both implicit and hybrid use response_mode=fragment.
 * Implicit: response_type=token or 'id_token token'.
 * Hybrid:   response_type='code id_token'.
 */
export function buildAuthorizeUrl(p: BuildAuthorizeUrlParams): string {
	const scope = resolveScope(p.credentials, p.oidc);

	let responseType: string;
	if (p.subMode === 'hybrid') {
		responseType = 'code id_token';
	} else {
		// implicit
		responseType = p.oidc ? 'id_token token' : 'token';
	}

	const params = new URLSearchParams({
		response_type: responseType,
		response_mode: 'fragment',
		client_id: p.credentials.clientId,
		redirect_uri: p.redirectUri,
		scope,
		state: p.state,
		nonce: p.nonce,
	});

	return `${authorizeEndpoint(p.credentials)}?${params.toString()}`;
}

/**
 * Parse a raw fragment string (with or without the leading '#') into a key→value map.
 * Pure function — no side effects.
 */
export function parseFragment(hash: string): FragmentParams {
	const stripped = hash.startsWith('#') ? hash.slice(1) : hash;
	const result: FragmentParams = {};
	new URLSearchParams(stripped).forEach((v, k) => {
		result[k] = v;
	});
	return result;
}

/**
 * Exchange the authorization code (hybrid back-channel leg) for a full token set.
 * real mode → POST to /api/pingone/token via BFF.
 * mock mode → returns deterministic tokens.
 */
export async function exchangeCode(p: ExchangeCodeParams, mode: FlowMode): Promise<TokenResult> {
	if (!p.code || typeof p.code !== 'string') {
		throw {
			error: 'invalid_code',
			error_description: 'Authorization code is missing or invalid',
		};
	}

	if (mode === 'mock') {
		return toTokenResult({
			access_token: mockJwt({ sub: 'mock-user', client_id: p.credentials.clientId || 'mock-client', scope: 'openid profile email', grant: 'hybrid-exchange' }),
			token_type: 'Bearer',
			expires_in: 3600,
			scope: p.credentials.scope || 'openid profile email',
			id_token: mockJwt({ sub: 'mock-user', aud: p.credentials.clientId || 'mock-client', nonce: 'mock-nonce', c_hash: 'mock_c_hash' }),
			refresh_token: 'mock-refresh-token-hybrid',
		});
	}

	const params = new URLSearchParams({
		grant_type: 'authorization_code',
		redirect_uri: p.redirectUri,
		code: p.code,
	});
	if (p.credentials.scope?.trim()) params.set('scope', p.credentials.scope.trim());
	// applyClientAuth will add client_id (and client_secret if needed) based on auth method.
	const { body, headers } = applyClientAuth(params, p.credentials);

	const res = await fetch('/api/pingone/token', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			environment_id: p.credentials.environmentId,
			region: p.credentials.region,
			auth_method: p.credentials.authMethod ?? 'client_secret_post',
			body,
			...(headers ? { headers } : {}),
		}),
	});

	const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
	if (!res.ok || data.error) {
		throw {
			error: (data.error as string) || 'token_request_failed',
			error_description: (data.error_description as string) || `Token request failed (HTTP ${res.status})`,
			status: res.status,
		};
	}
	return toTokenResult(data);
}

/**
 * Generate offline fragment params for mock mode.
 * Implicit sub-mode: access_token (+ optional id_token for OIDC).
 * Hybrid sub-mode:   code + id_token.
 */
export function mockFragment(
	subMode: ImplicitHybridSubMode,
	oidc: boolean,
	state: string,
	nonce: string,
	creds: FlowCredentials
): MockImplicitFragment | MockHybridFragment {
	const clientId = creds.clientId || 'mock-client';
	const scope = creds.scope || (oidc ? 'openid profile email' : 'openid');

	if (subMode === 'hybrid') {
		const result: MockHybridFragment = {
			code: `mock_code_${Math.random().toString(36).slice(2, 10)}`,
			id_token: mockJwt({
				sub: 'mock-user',
				aud: clientId,
				nonce,
				c_hash: 'bWZjX2Nhc2hfbW9jaw',
			}),
			state,
		};
		return result;
	}

	// implicit
	const frag: MockImplicitFragment = {
		access_token: mockJwt({ sub: 'mock-user', client_id: clientId, scope }),
		token_type: 'Bearer',
		expires_in: 3600,
		scope,
		state,
	};
	if (oidc) {
		frag.id_token = mockJwt({ sub: 'mock-user', aud: clientId, nonce });
	}
	return frag;
}

export const implicitHybridService = {
	buildAuthorizeUrl,
	parseFragment,
	exchangeCode,
	mockFragment,
};
