// src/platform/mock/V7MAuthorizeService.ts
// lint-file-disable: token-value-in-jsx
// Authorization endpoint simulator for V7M.
// Validates request params and issues an authorization code stored in MockStateStore.
// Also supports implicit flow (tokens in fragment).

import { MockAuthorizationCodeRecord, MockStateStore } from './MockStateStore';
import { generateMockTokens, MockTokenSeed, MockTokenTtls } from './MockTokenGenerator';

export type MockAuthorizeRequest = {
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
	ttls?: Partial<MockTokenTtls>;
};

export type MockAuthorizeResult =
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
	req: MockAuthorizeRequest,
	nowEpochSeconds: number,
	codeTtlSeconds: number
): MockAuthorizeResult {
	const validationError = validateAuthorizeRequest(req);
	if (validationError) return validationError;

	// Implicit flow: return tokens directly in fragment
	if (isImplicitFlow(req.response_type)) {
		return authorizeIssueTokens(req, nowEpochSeconds);
	}

	// Authorization code flow: generate code
	const code = buildCode(req, nowEpochSeconds);
	const record: MockAuthorizationCodeRecord = {
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
	MockStateStore.saveAuthorizationCode(record);

	const url = appendToUrl(req.redirect_uri, {
		code,
		state: req.state,
	});
	return { type: 'redirect', url };
}

/**
 * Issue tokens for implicit flow (response_type: 'token' or 'id_token token').
 * Tokens are returned in the URL fragment instead of authorization codes.
 */
function authorizeIssueTokens(
	req: MockAuthorizeRequest,
	nowEpochSeconds: number
): MockAuthorizeResult {
	const DEFAULT_TTLS: MockTokenTtls = {
		accessTokenSeconds: 3600,
		idTokenSeconds: 3600,
		refreshTokenSeconds: 86400,
	};
	const ttls = { ...DEFAULT_TTLS, ...(req.ttls || {}) };

	const userEmail = req.userEmail ?? 'jane.doe@example.com';
	const userId = req.userId ?? 'user-123';
	const scope = req.scope || '';

	// Determine what tokens to generate
	const needsAccessToken = req.response_type.includes('token');
	const needsIdToken = req.response_type.includes('id_token') || req.includeIdToken;

	const seed: MockTokenSeed = {
		clientId: req.client_id,
		...(req.environmentId ? { environmentId: req.environmentId } : {}),
		issuer: req.issuer ?? 'https://mock.issuer/v7m',
		userEmail,
		userId,
		scope,
		nonce: req.nonce,
	};

	const tokens = generateMockTokens(seed, nowEpochSeconds, ttls, needsIdToken);
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

	// Build URL with fragment
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
	// Implicit flow if response_type contains 'token' or 'id_token' but NOT 'code'
	return (
		(responseType.includes('token') || responseType.includes('id_token')) &&
		!responseType.includes('code')
	);
}

export function authorizeAccessDenied(req: MockAuthorizeRequest): MockAuthorizeResult {
	return {
		type: 'redirect',
		url: appendToUrl(req.redirect_uri, {
			error: 'access_denied',
			error_description: 'The resource owner denied the request',
			state: req.state,
		}),
	};
}

// ─── Hybrid Flow (OIDC Hybrid, deprecated per RFC 9700) ───────────────────────

export type MockHybridAuthorizeResult =
	| {
			type: 'hybrid';
			code: string;
			tokens: {
				id_token?: string;
				access_token?: string;
				token_type: 'Bearer';
				expires_in: number;
				scope?: string;
			};
	  }
	| { type: 'error'; error: string; error_description?: string };

/**
 * Issue hybrid authorization response: returns both a code and tokens immediately.
 * Used for OIDC Hybrid Flow (response_type: 'code id_token', 'code token', 'code id_token token').
 * The id_token includes c_hash binding it to the code.
 * Note: Hybrid flow is deprecated per RFC 9700 / OAuth 2.0 Security BCP.
 */
export function authorizeIssueHybrid(
	req: Omit<MockAuthorizeRequest, 'response_type'> & {
		response_type: 'code id_token' | 'code token' | 'code id_token token';
	},
	nowEpochSeconds: number,
	codeTtlSeconds: number
): MockHybridAuthorizeResult {
	const validationError = validateAuthorizeRequest(req as MockAuthorizeRequest);
	if (validationError) return validationError as MockHybridAuthorizeResult;

	// Issue a code and store it (can still be exchanged at token endpoint)
	const code = buildCode(req as MockAuthorizeRequest, nowEpochSeconds);
	const record: MockAuthorizationCodeRecord = {
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
	MockStateStore.saveAuthorizationCode(record);

	// Generate immediate tokens with c_hash (hash of code) for binding
	const DEFAULT_TTLS: MockTokenTtls = {
		accessTokenSeconds: 3600,
		idTokenSeconds: 3600,
		refreshTokenSeconds: 86400,
	};
	const ttls = { ...DEFAULT_TTLS, ...(req.ttls || {}) };
	const needsAccessToken = req.response_type.includes('token');
	const needsIdToken = req.response_type.includes('id_token');

	const seed: MockTokenSeed = {
		clientId: req.client_id,
		issuer: req.issuer ?? 'https://mock.issuer/v7m',
		userEmail: req.userEmail ?? 'jane.doe@example.com',
		userId: req.userId,
		scope: req.scope,
		nonce: req.nonce,
	};

	// Pass code so token generator can compute c_hash for the id_token
	const tokens = generateMockTokens(seed, nowEpochSeconds, ttls, needsIdToken, code);

	return {
		type: 'hybrid',
		code,
		tokens: {
			...(needsIdToken && tokens.id_token ? { id_token: tokens.id_token } : {}),
			...(needsAccessToken ? { access_token: tokens.access_token } : {}),
			token_type: 'Bearer',
			expires_in: ttls.accessTokenSeconds,
			scope: req.scope,
		},
	};
}

function validateAuthorizeRequest(req: MockAuthorizeRequest): MockAuthorizeResult | undefined {
	if (!req.response_type) return error('invalid_request', 'Missing response_type');
	if (!req.client_id) return error('invalid_request', 'Missing client_id');
	if (!req.redirect_uri) return error('invalid_request', 'Missing redirect_uri');
	if (!req.scope) return error('invalid_request', 'Missing scope');
	if (req.response_type.includes('code')) {
		// PKCE recommended; allow plain for education
		if (req.code_challenge_method && !['S256', 'plain'].includes(req.code_challenge_method)) {
			return error('invalid_request', 'Unsupported code_challenge_method');
		}
	}
	return undefined;
}

function error(errorCode: string, description?: string): MockAuthorizeResult {
	return { type: 'error', error: errorCode, error_description: description };
}

function buildCode(req: MockAuthorizeRequest, nowEpochSeconds: number): string {
	const raw = [
		'v7m',
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
	const url = new URL(base, 'http://localhost'); // base needed for relative safety; origin ignored if absolute
	for (const [k, v] of Object.entries(params)) {
		if (v !== undefined) url.searchParams.set(k, v);
	}
	// Preserve original absolute vs relative form
	return base.includes('://') ? url.toString() : url.pathname + (url.search || '');
}

function appendFragmentToUrl(base: string, params: Record<string, string>): string {
	const url = new URL(base, 'http://localhost');
	const fragmentPairs = Object.entries(params)
		.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
		.join('&');
	url.hash = fragmentPairs;
	// Preserve original absolute vs relative form
	return base.includes('://')
		? url.toString()
		: url.pathname + (url.search || '') + (url.hash || '');
}

/** Base64url encoding using browser-native Web APIs only (no Node.js Buffer). */
function toB64Url(input: string): string {
	const bytes = new TextEncoder().encode(input);
	let binary = '';
	for (const byte of bytes) binary += String.fromCharCode(byte);
	return btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}
