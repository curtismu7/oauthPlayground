// src/services/v9/V9AuthorizeService.ts
// Authorization endpoint simulator for V9.
// Validates request params and issues an authorization code stored in V9StateStore.
// Also supports implicit flow (tokens in fragment).
//
// Migrated from V7MAuthorizeService.ts — updated to use V9StateStore, V9TokenGenerator.

import { V9AuthorizationCodeRecord, V9StateStore } from './V9StateStore';
import { generateV9Tokens, V9TokenSeed, V9TokenTtls } from './V9TokenGenerator';

export type V9AuthorizeRequest = {
	response_type:
		| 'code'
		| 'id_token token'
		| 'id_token'
		| 'token'
		| 'code id_token'
		| 'code token'
		| 'code id_token token';
	client_id: string;
	redirect_uri: string;
	scope: string;
	state?: string;
	nonce?: string;
	code_challenge?: string;
	code_challenge_method?: 'S256' | 'plain';
	userEmail?: string;
	userId?: string;
	// For implicit flow token generation
	issuer?: string;
	environmentId?: string;
	includeIdToken?: boolean;
	ttls?: Partial<V9TokenTtls>;
};

export type V9AuthorizeResult =
	| {
			type: 'redirect';
			url: string;
			tokens?: {
				access_token?: string;
				id_token?: string;
				token_type: 'Bearer';
				expires_in: number;
				scope?: string;
			};
	  }
	| { type: 'error'; error: string; error_description?: string };

/**
 * Issue an authorization code and construct the redirect URL (success) or error.
 * Consent acceptance is assumed; callers can choose to send access_denied instead.
 * For implicit flow (response_type includes 'token' or 'id_token' without 'code'), returns tokens in fragment.
 */
export function authorizeIssueCode(
	req: V9AuthorizeRequest,
	nowEpochSeconds: number,
	codeTtlSeconds: number
): V9AuthorizeResult {
	const validationError = validateAuthorizeRequest(req);
	if (validationError) return validationError;

	// Implicit flow: return tokens directly in fragment
	if (isImplicitFlow(req.response_type)) {
		return authorizeIssueTokens(req, nowEpochSeconds);
	}

	// Authorization code flow: generate code
	const code = buildCode(req, nowEpochSeconds);
	const record: V9AuthorizationCodeRecord = {
		code,
		clientId: req.client_id,
		redirectUri: req.redirect_uri,
		scope: req.scope,
		state: req.state,
		nonce: req.nonce,
		codeChallenge: req.code_challenge,
		codeChallengeMethod: req.code_challenge_method,
		userEmail: req.userEmail,
		userId: req.userId,
		createdAt: nowEpochSeconds,
		expiresAt: nowEpochSeconds + codeTtlSeconds,
		consumed: false,
	};
	V9StateStore.saveAuthorizationCode(record);

	const url = appendToUrl(req.redirect_uri, {
		code,
		state: req.state,
	});
	return { type: 'redirect', url };
}

/**
 * Issue tokens for implicit flow (response_type: 'token' or 'id_token token').
 */
function authorizeIssueTokens(req: V9AuthorizeRequest, nowEpochSeconds: number): V9AuthorizeResult {
	const DEFAULT_TTLS: V9TokenTtls = {
		accessTokenSeconds: 3600,
		idTokenSeconds: 3600,
		refreshTokenSeconds: 86400,
	};
	const ttls = { ...DEFAULT_TTLS, ...(req.ttls || {}) };

	const userEmail = req.userEmail ?? 'jane.doe@example.com';
	const userId = req.userId ?? 'user-123';
	const scope = req.scope || '';

	const needsAccessToken = req.response_type.includes('token');
	const needsIdToken = req.response_type.includes('id_token') || req.includeIdToken;

	const seed: V9TokenSeed = {
		clientId: req.client_id,
		...(req.environmentId ? { environmentId: req.environmentId } : {}),
		issuer: req.issuer ?? 'https://mock.issuer/v9',
		userEmail,
		userId,
		scope,
		nonce: req.nonce,
	};

	const tokens = generateV9Tokens(seed, nowEpochSeconds, ttls, !!needsIdToken);
	const expiresIn = tokens.expires_in;

	const fragmentParams: Record<string, string> = {};
	if (needsAccessToken && tokens.access_token) {
		fragmentParams.access_token = tokens.access_token;
		fragmentParams.token_type = 'Bearer';
		fragmentParams.expires_in = expiresIn.toString();
		if (tokens.scope) fragmentParams.scope = tokens.scope;
	}
	if (needsIdToken && tokens.id_token) {
		fragmentParams.id_token = tokens.id_token;
	}
	if (req.state) {
		fragmentParams.state = req.state;
	}

	const url = appendFragmentToUrl(req.redirect_uri, fragmentParams);

	return {
		type: 'redirect',
		url,
		tokens: {
			...(needsAccessToken && tokens.access_token ? { access_token: tokens.access_token } : {}),
			...(needsIdToken && tokens.id_token ? { id_token: tokens.id_token } : {}),
			token_type: 'Bearer',
			expires_in: expiresIn,
			...(tokens.scope ? { scope: tokens.scope } : {}),
		},
	};
}

function isImplicitFlow(responseType: string): boolean {
	return (
		(responseType.includes('token') || responseType.includes('id_token')) &&
		!responseType.includes('code')
	);
}

export function authorizeAccessDenied(req: V9AuthorizeRequest): V9AuthorizeResult {
	return {
		type: 'redirect',
		url: appendToUrl(req.redirect_uri, {
			error: 'access_denied',
			error_description: 'The resource owner denied the request',
			state: req.state,
		}),
	};
}

function validateAuthorizeRequest(req: V9AuthorizeRequest): V9AuthorizeResult | undefined {
	if (!req.response_type) return error('invalid_request', 'Missing response_type');
	if (!req.client_id) return error('invalid_request', 'Missing client_id');
	if (!req.redirect_uri) return error('invalid_request', 'Missing redirect_uri');
	if (!req.scope) return error('invalid_request', 'Missing scope');
	if (req.response_type.includes('code')) {
		if (req.code_challenge_method && !['S256', 'plain'].includes(req.code_challenge_method)) {
			return error('invalid_request', 'Unsupported code_challenge_method');
		}
	}
	return undefined;
}

function error(errorCode: string, description?: string): V9AuthorizeResult {
	return { type: 'error', error: errorCode, error_description: description };
}

function buildCode(req: V9AuthorizeRequest, nowEpochSeconds: number): string {
	const raw = [
		'v9',
		req.client_id,
		req.redirect_uri,
		req.scope,
		req.state ?? '',
		req.nonce ?? '',
		req.code_challenge ?? '',
		req.code_challenge_method ?? '',
		nowEpochSeconds.toString(),
	].join('|');
	return toB64Url(raw).slice(0, 64);
}

function appendToUrl(base: string, params: Record<string, string | undefined>): string {
	const url = new URL(base, 'http://localhost');
	for (const [k, v] of Object.entries(params)) {
		if (v !== undefined) url.searchParams.set(k, v);
	}
	return base.includes('://') ? url.toString() : url.pathname + (url.search || '');
}

function appendFragmentToUrl(base: string, params: Record<string, string>): string {
	const url = new URL(base, 'http://localhost');
	const fragmentPairs = Object.entries(params)
		.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
		.join('&');
	url.hash = fragmentPairs;
	return base.includes('://')
		? url.toString()
		: url.pathname + (url.search || '') + (url.hash || '');
}

function toB64Url(input: string): string {
	const b64 = Buffer.from(input, 'utf8').toString('base64');
	return b64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}
