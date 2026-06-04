// src/flows2/services/authorizationCodeService.ts
//
// Authorization Code (+ PKCE) flow service. This is the ONLY flows2 file that imports the
// legacy V9Mock* services — the containment boundary. The flow component and the rest of
// flows2 see only the version-free types below. When the legacy mock services are retired,
// this file is the single swap point.

import { generateCodeChallenge, generateCodeVerifier } from '../../utils/oauth';
import { authorizeIssueCode } from '../../services/v9/mock/V9MockAuthorizeService';
import { computePkceS256, tokenExchangeAuthorizationCode } from '../../services/v9/mock/V9MockTokenService';
import { getUserInfoFromAccessToken } from '../../services/v9/mock/V9MockUserInfoService';
import { introspectToken } from '../../services/v9/mock/V9MockIntrospectionService';
import type { FlowCredentials, FlowMode, TokenResult } from '../framework/types';

export interface PkcePair {
	codeVerifier: string;
	codeChallenge: string;
	codeChallengeMethod: 'S256';
}

export interface AuthorizeParams {
	credentials: FlowCredentials;
	redirectUri: string;
	state: string;
	nonce?: string;
	codeChallenge: string;
	oidc?: boolean;
}

/** real mode → { url } (browser redirects there); mock mode → { code } (issued in-memory). */
export interface AuthorizeResult {
	url?: string;
	code?: string;
	state: string;
}

export interface ExchangeParams {
	credentials: FlowCredentials;
	redirectUri: string;
	code: string;
	codeVerifier: string;
	oidc?: boolean;
}

function pingoneHost(region?: string): string {
	const r = (region || 'com').toLowerCase().trim();
	if (r === 'eu') return 'auth.pingone.eu';
	if (r === 'ca') return 'auth.pingone.ca';
	if (r === 'ap' || r === 'asia') return 'auth.pingone.asia';
	return 'auth.pingone.com';
}

function authorizeEndpoint(c: FlowCredentials): string {
	return `https://${pingoneHost(c.region)}/${c.environmentId}/as/authorize`;
}

function resolveScope(c: FlowCredentials, oidc?: boolean): string {
	if (c.scope && c.scope.trim()) return c.scope.trim();
	return oidc ? 'openid profile email' : 'openid';
}

function toTokenResult(data: {
	access_token?: string;
	token_type?: string;
	expires_in?: number;
	scope?: string;
	id_token?: string;
	refresh_token?: string;
	[k: string]: unknown;
}): TokenResult {
	return {
		accessToken: data.access_token,
		tokenType: data.token_type,
		expiresIn: typeof data.expires_in === 'number' ? data.expires_in : undefined,
		scope: data.scope,
		idToken: data.id_token,
		refreshToken: data.refresh_token,
		raw: data as Record<string, unknown>,
	};
}

/**
 * Generate a PKCE pair. The verifier is always genuine high-entropy; the challenge is
 * mode-matched so verification holds: real mode uses WebCrypto SHA-256 (what PingOne
 * verifies against); mock mode uses the mock services' deterministic S256 stand-in
 * (what `tokenExchangeAuthorizationCode` verifies against).
 */
export async function generatePkce(mode: FlowMode = 'real'): Promise<PkcePair> {
	const codeVerifier = generateCodeVerifier();
	const codeChallenge =
		mode === 'mock' ? computePkceS256(codeVerifier) : await generateCodeChallenge(codeVerifier);
	return { codeVerifier, codeChallenge, codeChallengeMethod: 'S256' };
}

/** Build the authorization request. real → returns the /as/authorize URL; mock → issues a code. */
export async function authorize(p: AuthorizeParams, mode: FlowMode): Promise<AuthorizeResult> {
	const scope = resolveScope(p.credentials, p.oidc);

	if (mode === 'mock') {
		const res = authorizeIssueCode(
			{
				response_type: 'code',
				client_id: p.credentials.clientId,
				redirect_uri: p.redirectUri,
				scope,
				state: p.state,
				nonce: p.nonce,
				code_challenge: p.codeChallenge,
				code_challenge_method: 'S256',
			},
			Math.floor(Date.now() / 1000),
			300
		);
		if (res.type === 'error') {
			throw { error: res.error, error_description: res.error_description };
		}
		const url = new URL(res.url);
		return { code: url.searchParams.get('code') || '', state: p.state };
	}

	const params = new URLSearchParams({
		response_type: 'code',
		client_id: p.credentials.clientId,
		redirect_uri: p.redirectUri,
		scope,
		state: p.state,
		code_challenge: p.codeChallenge,
		code_challenge_method: 'S256',
	});
	if (p.nonce) params.set('nonce', p.nonce);
	return { url: `${authorizeEndpoint(p.credentials)}?${params.toString()}`, state: p.state };
}

/** Exchange the authorization code for tokens. real → BFF proxy; mock → V9Mock token service. */
export async function exchangeCode(p: ExchangeParams, mode: FlowMode): Promise<TokenResult> {
	if (mode === 'mock') {
		const res = tokenExchangeAuthorizationCode({
			grant_type: 'authorization_code',
			code: p.code,
			redirect_uri: p.redirectUri,
			client_id: p.credentials.clientId,
			code_verifier: p.codeVerifier,
			client_secret: p.credentials.clientSecret,
			expectedClientSecret: p.credentials.clientSecret,
			scope: p.credentials.scope,
			includeIdToken: p.oidc,
		});
		if ('error' in res) {
			throw { error: res.error, error_description: res.error_description };
		}
		return toTokenResult(res);
	}

	const body = new URLSearchParams({
		grant_type: 'authorization_code',
		client_id: p.credentials.clientId,
		redirect_uri: p.redirectUri,
		code: p.code,
		code_verifier: p.codeVerifier,
	});
	if (p.credentials.clientSecret) body.set('client_secret', p.credentials.clientSecret);
	if (p.credentials.scope && p.credentials.scope.trim()) body.set('scope', p.credentials.scope.trim());

	const res = await fetch('/api/pingone/token', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			environment_id: p.credentials.environmentId,
			region: p.credentials.region,
			auth_method: 'client_secret_post',
			body: body.toString(),
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

/** OIDC UserInfo for the access token. real → BFF; mock → V9Mock. */
export async function userInfo(
	accessToken: string,
	credentials: FlowCredentials,
	mode: FlowMode
): Promise<Record<string, unknown>> {
	if (mode === 'mock') {
		return getUserInfoFromAccessToken(accessToken) as unknown as Record<string, unknown>;
	}
	const res = await fetch('/api/userinfo', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			environment_id: credentials.environmentId,
			region: credentials.region,
			access_token: accessToken,
		}),
	});
	return (await res.json().catch(() => ({}))) as Record<string, unknown>;
}

/** RFC 7662 token introspection. real → BFF; mock → V9Mock. */
export async function introspect(
	token: string,
	credentials: FlowCredentials,
	mode: FlowMode
): Promise<Record<string, unknown>> {
	if (mode === 'mock') {
		return introspectToken(token) as unknown as Record<string, unknown>;
	}
	const res = await fetch('/api/introspect-token', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			environment_id: credentials.environmentId,
			region: credentials.region,
			token,
			client_id: credentials.clientId,
			client_secret: credentials.clientSecret,
			auth_method: 'client_secret_post',
		}),
	});
	return (await res.json().catch(() => ({}))) as Record<string, unknown>;
}

export const authorizationCodeService = {
	generatePkce,
	authorize,
	exchangeCode,
	userInfo,
	introspect,
};
