// src/services/v7m/V7MTokenService.ts
// Token endpoint simulator for V7M educational flows.
// Supports authorization_code and refresh_token grants, PKCE checks, and client auth simulation.

import { V7MStateStore } from './V7MStateStore';
import { generateV7MTokens, V7MTokenSeed, V7MTokenTtls } from './V7MTokenGenerator';

export type V7MAuthorizationCodeGrantRequest = {
	grant_type: 'authorization_code';
	code: string;
	redirect_uri: string;
	client_id: string;
	code_verifier?: string;
	// Client auth variants
	authorization?: string; // Authorization header value e.g., "Basic base64(client_id:client_secret)"
	client_secret?: string; // client_secret_post
	// Settings for token shaping
	issuer?: string;
	environmentId?: string;
	scope?: string;
	userEmail?: string;
	userId?: string;
	includeIdToken?: boolean;
	expectedClientSecret?: string; // the "stored" secret to validate against
	ttls?: Partial<V7MTokenTtls>;
};

export type V7MRefreshTokenGrantRequest = {
	grant_type: 'refresh_token';
	refresh_token: string;
	client_id: string;
	authorization?: string;
	client_secret?: string;
	expectedClientSecret?: string;
	// For shaping new tokens if we don't find stored record
	issuer?: string;
	environmentId?: string;
	scope?: string;
	userEmail?: string;
	userId?: string;
	includeIdToken?: boolean;
	ttls?: Partial<V7MTokenTtls>;
};

export type V7MTokenError = {
	error: string;
	error_description?: string;
};

export type V7MTokenSuccess = {
	access_token: string;
	id_token?: string;
	refresh_token?: string;
	token_type: 'Bearer';
	expires_in: number;
	scope?: string;
};

const DEFAULT_TTLS: V7MTokenTtls = {
	accessTokenSeconds: 3600,
	idTokenSeconds: 3600,
	refreshTokenSeconds: 86400,
};

export function tokenExchangeAuthorizationCode(
	req: V7MAuthorizationCodeGrantRequest
): V7MTokenSuccess | V7MTokenError {
	if (req.grant_type !== 'authorization_code') {
		return {
			error: 'unsupported_grant_type',
			error_description: 'Only authorization_code supported',
		};
	}
	// Client auth
	const clientAuthOk = validateClientAuth(
		req.client_id,
		req.authorization,
		req.client_secret,
		req.expectedClientSecret
	);
	if (!clientAuthOk)
		return { error: 'invalid_client', error_description: 'Client authentication failed' };

	// Consume code
	const rec = V7MStateStore.consumeAuthorizationCode(req.code);
	if (!rec)
		return {
			error: 'invalid_grant',
			error_description: 'Invalid or already used authorization code',
		};
	if (rec.clientId !== req.client_id)
		return { error: 'invalid_grant', error_description: 'Code was not issued to this client' };
	if (rec.redirectUri !== req.redirect_uri)
		return { error: 'invalid_grant', error_description: 'redirect_uri mismatch' };

	// PKCE validation (if present)
	if (rec.codeChallenge) {
		if (!req.code_verifier)
			return { error: 'invalid_request', error_description: 'Missing code_verifier' };
		const expected =
			rec.codeChallengeMethod === 'S256' ? computePkceS256(req.code_verifier) : req.code_verifier;
		if (expected !== rec.codeChallenge) {
			return { error: 'invalid_grant', error_description: 'Invalid code_verifier' };
		}
	}

	// Shape tokens
	const ttls = { ...DEFAULT_TTLS, ...(req.ttls || {}) };
	const now = Math.floor(Date.now() / 1000);
	const userEmail = rec.userEmail ?? req.userEmail;
	const userId = rec.userId ?? req.userId;
	const scope = rec.scope || req.scope;
	const seed: V7MTokenSeed = {
		clientId: req.client_id,
		...(req.environmentId ? { environmentId: req.environmentId } : {}),
		...(req.issuer ? { issuer: req.issuer } : {}),
		...(userEmail ? { userEmail } : {}),
		...(userId ? { userId } : {}),
		...(rec.nonce ? { nonce: rec.nonce } : {}),
		...(scope ? { scope } : {}),
		audience: req.client_id,
	};
	const tokens = generateV7MTokens(seed, now, ttls, !!req.includeIdToken, req.code);

	const tokenScope = (tokens.scope ?? scope) || '';

	// Save token by refresh token for refresh flow
	if (tokens.refresh_token) {
		V7MStateStore.saveToken(tokens.refresh_token, {
			accessToken: tokens.access_token,
			refreshToken: tokens.refresh_token,
			clientId: req.client_id,
			scope: tokenScope,
			subject: userId ?? userEmail ?? 'user',
			issuedAt: tokens.issued_at,
			expiresAt: tokens.issued_at + ttls.accessTokenSeconds,
		});
	}
	// Also store by access token for UserInfo/Introspection lookup
	V7MStateStore.saveToken(tokens.access_token, {
		accessToken: tokens.access_token,
		refreshToken: tokens.refresh_token,
		clientId: req.client_id,
		scope: tokenScope,
		subject: userId ?? userEmail ?? 'user',
		issuedAt: tokens.issued_at,
		expiresAt: tokens.issued_at + ttls.accessTokenSeconds,
	});

	const result: V7MTokenSuccess = {
		access_token: tokens.access_token,
		...(tokens.id_token ? { id_token: tokens.id_token } : {}),
		...(tokens.refresh_token ? { refresh_token: tokens.refresh_token } : {}),
		token_type: 'Bearer',
		expires_in: tokens.expires_in,
		...(tokens.scope ? { scope: tokens.scope } : {}),
	};
	return result;
}

export function tokenExchangeRefreshToken(
	req: V7MRefreshTokenGrantRequest
): V7MTokenSuccess | V7MTokenError {
	if (req.grant_type !== 'refresh_token') {
		return { error: 'unsupported_grant_type', error_description: 'Only refresh_token supported' };
	}
	const clientAuthOk = validateClientAuth(
		req.client_id,
		req.authorization,
		req.client_secret,
		req.expectedClientSecret
	);
	if (!clientAuthOk)
		return { error: 'invalid_client', error_description: 'Client authentication failed' };

	const existing = V7MStateStore.getToken(req.refresh_token);
	const ttls = { ...DEFAULT_TTLS, ...(req.ttls || {}) };
	const now = Math.floor(Date.now() / 1000);

	let seed: V7MTokenSeed;
	if (existing) {
		seed = {
			clientId: existing.clientId,
			userId: existing.subject,
			...(existing.scope ? { scope: existing.scope } : {}),
		};
	} else {
		// Fallback shaping if not stored
		seed = {
			clientId: req.client_id,
			...(req.environmentId ? { environmentId: req.environmentId } : {}),
			...(req.issuer ? { issuer: req.issuer } : {}),
			...(req.userEmail ? { userEmail: req.userEmail } : {}),
			...(req.userId ? { userId: req.userId } : {}),
			...(req.scope ? { scope: req.scope } : {}),
		};
	}
	const tokens = generateV7MTokens(seed, now, ttls, !!req.includeIdToken);

	const seedScope = existing?.scope || req.scope || '';
	const seedSubject = seed.userId ?? seed.userEmail ?? 'user';

	// rotate refresh
	if (tokens.refresh_token) {
		V7MStateStore.saveToken(tokens.refresh_token, {
			accessToken: tokens.access_token,
			refreshToken: tokens.refresh_token,
			clientId: req.client_id,
			scope: tokens.scope ?? seedScope,
			subject: seedSubject,
			issuedAt: tokens.issued_at,
			expiresAt: tokens.issued_at + ttls.accessTokenSeconds,
		});
		// delete old token if we had it
		if (existing) V7MStateStore.deleteToken(req.refresh_token);
	}
	// store by new access token too
	V7MStateStore.saveToken(tokens.access_token, {
		accessToken: tokens.access_token,
		refreshToken: tokens.refresh_token,
		clientId: req.client_id,
		scope: tokens.scope ?? seedScope,
		subject: seedSubject,
		issuedAt: tokens.issued_at,
		expiresAt: tokens.issued_at + ttls.accessTokenSeconds,
	});

	const result: V7MTokenSuccess = {
		access_token: tokens.access_token,
		...(tokens.id_token ? { id_token: tokens.id_token } : {}),
		...(tokens.refresh_token ? { refresh_token: tokens.refresh_token } : {}),
		token_type: 'Bearer',
		expires_in: tokens.expires_in,
		...(tokens.scope ? { scope: tokens.scope } : {}),
	};
	return result;
}

export type V7MDeviceCodeGrantRequest = {
	grant_type: 'urn:ietf:params:oauth:grant-type:device_code';
	device_code: string;
	client_id: string;
	authorization?: string;
	client_secret?: string;
	expectedClientSecret?: string;
	// For shaping tokens if we don't find stored record
	issuer?: string;
	environmentId?: string;
	scope?: string;
	userEmail?: string;
	userId?: string;
	includeIdToken?: boolean;
	ttls?: Partial<V7MTokenTtls>;
};

export type V7MClientCredentialsGrantRequest = {
	grant_type: 'client_credentials';
	client_id: string;
	scope?: string;
	audience?: string;
	authorization?: string;
	client_secret?: string;
	expectedClientSecret?: string;
	// For shaping tokens
	issuer?: string;
	environmentId?: string;
	ttls?: Partial<V7MTokenTtls>;
};

export type V7MPasswordGrantRequest = {
	grant_type: 'password';
	username: string;
	password: string;
	client_id: string;
	scope?: string;
	authorization?: string;
	client_secret?: string;
	expectedClientSecret?: string;
	// For shaping tokens
	issuer?: string;
	environmentId?: string;
	userEmail?: string; // If username is email, this can be the same
	userId?: string;
	includeIdToken?: boolean; // For OIDC variant
	ttls?: Partial<V7MTokenTtls>;
};

export function tokenExchangeDeviceCode(
	req: V7MDeviceCodeGrantRequest
): V7MTokenSuccess | V7MTokenError {
	if (req.grant_type !== 'urn:ietf:params:oauth:grant-type:device_code') {
		return { error: 'unsupported_grant_type', error_description: 'Only device_code supported' };
	}

	// Client auth
	const clientAuthOk = validateClientAuth(
		req.client_id,
		req.authorization,
		req.client_secret,
		req.expectedClientSecret
	);
	if (!clientAuthOk)
		return { error: 'invalid_client', error_description: 'Client authentication failed' };

	// Get device code
	const deviceRec = V7MStateStore.getDeviceCode(req.device_code);
	if (!deviceRec) {
		return { error: 'invalid_grant', error_description: 'Invalid or expired device code' };
	}
	if (deviceRec.clientId !== req.client_id) {
		return {
			error: 'invalid_grant',
			error_description: 'Device code was not issued to this client',
		};
	}

	// Check if approved
	if (!deviceRec.approved) {
		return {
			error: 'authorization_pending',
			error_description: 'User has not yet approved the device',
		};
	}

	// Generate tokens
	const ttls = { ...DEFAULT_TTLS, ...(req.ttls || {}) };
	const now = Math.floor(Date.now() / 1000);

	const userEmail = deviceRec.userEmail ?? req.userEmail;
	const userId = deviceRec.userId ?? req.userId;
	const scope = deviceRec.scope || req.scope || '';

	const seed: V7MTokenSeed = {
		clientId: deviceRec.clientId,
		...(req.environmentId ? { environmentId: req.environmentId } : {}),
		...(req.issuer ? { issuer: req.issuer } : {}),
		...(userEmail ? { userEmail } : {}),
		...(userId ? { userId } : {}),
		...(scope ? { scope } : {}),
	};

	const tokens = generateV7MTokens(seed, now, ttls, !!req.includeIdToken);

	const seedSubject = userId ?? userEmail ?? 'user';

	// Store token
	V7MStateStore.saveToken(tokens.access_token, {
		accessToken: tokens.access_token,
		refreshToken: tokens.refresh_token,
		clientId: deviceRec.clientId,
		scope: tokens.scope ?? scope,
		subject: seedSubject,
		issuedAt: tokens.issued_at,
		expiresAt: tokens.issued_at + ttls.accessTokenSeconds,
	});

	// Delete device code after successful token exchange
	V7MStateStore.deleteDeviceCode(req.device_code);

	const result: V7MTokenSuccess = {
		access_token: tokens.access_token,
		...(tokens.id_token ? { id_token: tokens.id_token } : {}),
		...(tokens.refresh_token ? { refresh_token: tokens.refresh_token } : {}),
		token_type: 'Bearer',
		expires_in: tokens.expires_in,
		...(tokens.scope ? { scope: tokens.scope } : {}),
	};
	return result;
}

export function tokenExchangeClientCredentials(
	req: V7MClientCredentialsGrantRequest
): V7MTokenSuccess | V7MTokenError {
	if (req.grant_type !== 'client_credentials') {
		return {
			error: 'unsupported_grant_type',
			error_description: 'Only client_credentials supported',
		};
	}

	// Client auth required for client_credentials
	const clientAuthOk = validateClientAuth(
		req.client_id,
		req.authorization,
		req.client_secret,
		req.expectedClientSecret
	);
	if (!clientAuthOk)
		return { error: 'invalid_client', error_description: 'Client authentication failed' };

	// Generate tokens (no user context, no refresh token)
	const ttls = { ...DEFAULT_TTLS, ...(req.ttls || {}) };
	const now = Math.floor(Date.now() / 1000);

	const seed: V7MTokenSeed = {
		clientId: req.client_id,
		...(req.environmentId ? { environmentId: req.environmentId } : {}),
		...(req.issuer ? { issuer: req.issuer } : {}),
		...(req.scope ? { scope: req.scope } : {}),
		...(req.audience ? { audience: req.audience } : {}),
	};

	const tokens = generateV7MTokens(seed, now, ttls, false); // No ID token for client_credentials

	// Store token (no refresh for client_credentials)
	V7MStateStore.saveToken(tokens.access_token, {
		accessToken: tokens.access_token,
		clientId: req.client_id,
		scope: tokens.scope ?? req.scope ?? '',
		subject: req.client_id, // Client credentials uses client_id as subject
		issuedAt: tokens.issued_at,
		expiresAt: tokens.issued_at + ttls.accessTokenSeconds,
	});

	const result: V7MTokenSuccess = {
		access_token: tokens.access_token,
		token_type: 'Bearer',
		expires_in: tokens.expires_in,
		...(tokens.scope ? { scope: tokens.scope } : {}),
	};
	return result;
}

export function tokenExchangePassword(
	req: V7MPasswordGrantRequest
): V7MTokenSuccess | V7MTokenError {
	if (req.grant_type !== 'password') {
		return { error: 'unsupported_grant_type', error_description: 'Only password supported' };
	}

	// Client auth required for password grant
	const clientAuthOk = validateClientAuth(
		req.client_id,
		req.authorization,
		req.client_secret,
		req.expectedClientSecret
	);
	if (!clientAuthOk)
		return { error: 'invalid_client', error_description: 'Client authentication failed' };

	// Validate credentials (mock: accept non-empty values)
	if (!req.username || !req.password) {
		return { error: 'invalid_grant', error_description: 'Invalid username or password' };
	}

	// Generate tokens with user context
	const ttls = { ...DEFAULT_TTLS, ...(req.ttls || {}) };
	const now = Math.floor(Date.now() / 1000);

	// Use username as email if it looks like an email, otherwise use provided userEmail
	const userEmail = req.userEmail || (req.username.includes('@') ? req.username : undefined);
	const userId = req.userId || (userEmail ? userEmail.split('@')[0] : req.username);

	const seed: V7MTokenSeed = {
		clientId: req.client_id,
		...(req.environmentId ? { environmentId: req.environmentId } : {}),
		...(req.issuer ? { issuer: req.issuer } : {}),
		userEmail,
		userId,
		...(req.scope ? { scope: req.scope } : {}),
	};

	const includeIdToken = req.includeIdToken || (req.scope?.includes('openid') ?? false);
	const tokens = generateV7MTokens(seed, now, ttls, includeIdToken);

	const seedScope = req.scope || '';

	// Store tokens (with refresh token for password grant)
	if (tokens.refresh_token) {
		V7MStateStore.saveToken(tokens.refresh_token, {
			accessToken: tokens.access_token,
			refreshToken: tokens.refresh_token,
			clientId: req.client_id,
			scope: tokens.scope ?? seedScope,
			subject: userId,
			issuedAt: tokens.issued_at,
			expiresAt: tokens.issued_at + ttls.accessTokenSeconds,
		});
	}
	// Store by access token too
	V7MStateStore.saveToken(tokens.access_token, {
		accessToken: tokens.access_token,
		refreshToken: tokens.refresh_token,
		clientId: req.client_id,
		scope: tokens.scope ?? seedScope,
		subject: userId,
		issuedAt: tokens.issued_at,
		expiresAt: tokens.issued_at + ttls.accessTokenSeconds,
	});

	const result: V7MTokenSuccess = {
		access_token: tokens.access_token,
		...(tokens.id_token ? { id_token: tokens.id_token } : {}),
		...(tokens.refresh_token ? { refresh_token: tokens.refresh_token } : {}),
		token_type: 'Bearer',
		expires_in: tokens.expires_in,
		...(tokens.scope ? { scope: tokens.scope } : {}),
	};
	return result;
}

function validateClientAuth(
	clientId: string,
	authorizationHeader?: string,
	clientSecretPost?: string,
	expectedSecret?: string
): boolean {
	// If no secret configured, accept public client
	if (!expectedSecret) return true;
	// basic
	if (authorizationHeader?.startsWith('Basic ')) {
		try {
			const decoded = Buffer.from(authorizationHeader.slice(6), 'base64').toString('utf8');
			const [id, secret] = decoded.split(':');
			if (id === clientId && secret === expectedSecret) return true;
		} catch {
			// fall through
		}
	}
	// post
	if (clientSecretPost && clientSecretPost === expectedSecret) return true;
	return false;
}

function computePkceS256(verifier: string): string {
	// Educational deterministic stand-in for SHA-256 + base64url: base64url(stableHash)
	return toB64Url(stableHash(verifier));
}

function toB64Url(input: string): string {
	const b64 = Buffer.from(input, 'utf8').toString('base64');
	return b64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function stableHash(input: string): string {
	let h1 = 0x811c9dc5;
	for (let i = 0; i < input.length; i++) {
		h1 ^= input.charCodeAt(i);
		h1 = (h1 + ((h1 << 1) + (h1 << 4) + (h1 << 7) + (h1 << 8) + (h1 << 24))) >>> 0;
	}
	return h1.toString(16).padStart(8, '0');
}
