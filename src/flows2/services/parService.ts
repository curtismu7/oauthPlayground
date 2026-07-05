// src/flows2/services/parService.ts
//
// Pushed Authorization Request (PAR) flow service — RFC 9126.
// Real mode calls the BFF at /api/par then /api/pingone/token.
// Mock mode runs fully offline with deterministic fakes.
// PKCE is generated inline via Web Crypto (S256) — no imports from src/services/*.

import type { FlowCredentials, FlowMode, TokenResult } from '../framework/types';
import { applyClientAuth, pingoneHost, toTokenResult } from './pingone';

// ─── PKCE ─────────────────────────────────────────────────────────────────────

export interface PkcePair {
	codeVerifier: string;
	codeChallenge: string;
	codeChallengeMethod: 'S256';
}

function randomBase64Url(byteLen: number): string {
	const buf = new Uint8Array(byteLen);
	crypto.getRandomValues(buf);
	return btoa(String.fromCharCode(...buf))
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=+$/, '');
}

async function sha256Base64Url(plain: string): Promise<string> {
	const encoder = new TextEncoder();
	const data = encoder.encode(plain);
	const digest = await crypto.subtle.digest('SHA-256', data);
	return btoa(String.fromCharCode(...new Uint8Array(digest)))
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=+$/, '');
}

/** Deterministic mock S256: each char's code XOR'd into a fixed-length string. */
function mockS256(verifier: string): string {
	let n = 0;
	for (let i = 0; i < verifier.length; i++) n = (n * 31 + verifier.charCodeAt(i)) >>> 0;
	return `mock-challenge-${n.toString(16).padStart(8, '0')}`;
}

export async function generatePkce(mode: FlowMode = 'real'): Promise<PkcePair> {
	const codeVerifier = randomBase64Url(32); // 43-128 chars per RFC 7636
	const codeChallenge =
		mode === 'mock' ? mockS256(codeVerifier) : await sha256Base64Url(codeVerifier);
	return { codeVerifier, codeChallenge, codeChallengeMethod: 'S256' };
}

// ─── PAR push ─────────────────────────────────────────────────────────────────

export interface PushParams {
	credentials: FlowCredentials;
	redirectUri: string;
	state: string;
	nonce?: string;
	codeChallenge: string;
	scope?: string;
}

export interface PushResult {
	requestUri: string;
	expiresIn: number;
	raw: Record<string, unknown>;
}

const MOCK_REQUEST_URI_PREFIX = 'urn:ietf:params:oauth:request_uri:mock-';

export async function pushAuthorizationRequest(
	p: PushParams,
	mode: FlowMode
): Promise<PushResult> {
	if (mode === 'mock') {
		const token = randomBase64Url(12);
		return {
			requestUri: `${MOCK_REQUEST_URI_PREFIX}${token}`,
			expiresIn: 90,
			raw: {
				request_uri: `${MOCK_REQUEST_URI_PREFIX}${token}`,
				expires_in: 90,
			},
		};
	}

	const scope = resolveScope(p.credentials, p.scope);

	// POST to /api/par — BFF spreads all top-level fields except environment_id,
	// client_id, client_secret, auth_method into the PAR form body, and applies
	// client auth per auth_method (post = secret in body, basic = Authorization header).
	const res = await fetch('/api/par', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			environment_id: p.credentials.environmentId,
			client_id: p.credentials.clientId,
			client_secret: p.credentials.clientSecret,
			auth_method: p.credentials.authMethod ?? 'client_secret_post',
			// These become the PAR form body params:
			response_type: 'code',
			redirect_uri: p.redirectUri,
			scope,
			state: p.state,
			...(p.nonce ? { nonce: p.nonce } : {}),
			code_challenge: p.codeChallenge,
			code_challenge_method: 'S256',
		}),
	});

	const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
	if (!res.ok || data.error) {
		throw {
			error: (data.error as string) || 'par_request_failed',
			error_description:
				(data.error_description as string) || `PAR request failed (HTTP ${res.status})`,
			status: res.status,
		};
	}

	if (!data.request_uri || typeof data.request_uri !== 'string') {
		throw {
			error: 'invalid_request_uri',
			error_description: 'PAR response missing or invalid request_uri field',
			status: res.status,
		};
	}

	return {
		requestUri: data.request_uri,
		expiresIn: typeof data.expires_in === 'number' ? data.expires_in : 90,
		raw: data,
	};
}

// ─── Authorize URL ────────────────────────────────────────────────────────────

/** Build the /as/authorize URL that carries ONLY client_id + request_uri (RFC 9126 §4). */
export function buildAuthorizeUrl(
	credentials: FlowCredentials,
	requestUri: string
): string {
	const base = `https://${pingoneHost(credentials.region)}/${credentials.environmentId}/as/authorize`;
	const params = new URLSearchParams({
		client_id: credentials.clientId,
		request_uri: requestUri,
	});
	return `${base}?${params.toString()}`;
}

// ─── Token exchange ───────────────────────────────────────────────────────────

export interface ExchangeParams {
	credentials: FlowCredentials;
	redirectUri: string;
	code: string;
	codeVerifier: string;
	authMethod?: string;
	tokenLifetimes?: {
		accessTokenSeconds?: number;
		idTokenSeconds?: number;
		refreshTokenSeconds?: number;
	};
}

export async function exchangeCode(p: ExchangeParams, mode: FlowMode): Promise<TokenResult> {
	if (mode === 'mock') {
		const now = Math.floor(Date.now() / 1000);
		const claims = {
			sub: 'mock-user',
			aud: p.credentials.clientId,
			iss: `https://auth.pingone.${p.credentials.region}/${p.credentials.environmentId}/as`,
			iat: now,
			exp: now + 3600,
		};
		const idToken = `${btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }))}.${btoa(JSON.stringify(claims))}.`;
		return toTokenResult({
			access_token: `mock-access-token-par-${Date.now()}`,
			token_type: 'Bearer',
			expires_in: 3600,
			scope: resolveScope(p.credentials),
			id_token: idToken,
			refresh_token: 'mock-refresh-token-par',
		});
	}

	const params = new URLSearchParams({
		grant_type: 'authorization_code',
		redirect_uri: p.redirectUri,
		code: p.code,
		code_verifier: p.codeVerifier,
	});
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
			error_description:
				(data.error_description as string) || `Token exchange failed (HTTP ${res.status})`,
			status: res.status,
		};
	}
	return toTokenResult(data);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolveScope(c: FlowCredentials, override?: string): string {
	const s = override ?? c.scope;
	return s?.trim() ? s.trim() : 'openid profile email';
}

// ─── Exported service object ──────────────────────────────────────────────────

export const parService = {
	generatePkce,
	pushAuthorizationRequest,
	buildAuthorizeUrl,
	exchangeCode,
};
