// src/services/v9/V9TokenService.ts
// Token endpoint simulator for V9 educational flows.
// Supports authorization_code, refresh_token, device_code, client_credentials,
// and password grants. Includes PKCE checks and client auth simulation.
//
// Migrated from V7MTokenService.ts — updated to use V9StateStore, V9TokenGenerator.

import { V9StateStore } from './V9StateStore';
import { generateV9Tokens, V9TokenSeed, V9TokenTtls } from './V9TokenGenerator';

export type V9AuthorizationCodeGrantRequest = {
	grant_type: 'authorization_code';
	code: string;
	redirect_uri: string;
	client_id: string;
	code_verifier?: string;
	authorization?: string; // e.g., "Basic base64(client_id:client_secret)"
	client_secret?: string;
	issuer?: string;
	environmentId?: string;
	scope?: string;
	userEmail?: string;
	userId?: string;
	includeIdToken?: boolean;
	expectedClientSecret?: string;
	ttls?: Partial<V9TokenTtls>;
};

export type V9RefreshTokenGrantRequest = {
	grant_type: 'refresh_token';
	refresh_token: string;
	client_id: string;
	authorization?: string;
	client_secret?: string;
	expectedClientSecret?: string;
	issuer?: string;
	environmentId?: string;
	scope?: string;
	userEmail?: string;
	userId?: string;
	includeIdToken?: boolean;
	ttls?: Partial<V9TokenTtls>;
};

export type V9DeviceCodeGrantRequest = {
	grant_type: 'urn:ietf:params:oauth:grant-type:device_code';
	device_code: string;
	client_id: string;
	authorization?: string;
	client_secret?: string;
	expectedClientSecret?: string;
	issuer?: string;
	environmentId?: string;
	scope?: string;
	userEmail?: string;
	userId?: string;
	includeIdToken?: boolean;
	ttls?: Partial<V9TokenTtls>;
};

export type V9ClientCredentialsGrantRequest = {
	grant_type: 'client_credentials';
	client_id: string;
	scope?: string;
	audience?: string;
	authorization?: string;
	client_secret?: string;
	expectedClientSecret?: string;
	issuer?: string;
	environmentId?: string;
	ttls?: Partial<V9TokenTtls>;
};

export type V9PasswordGrantRequest = {
	grant_type: 'password';
	username: string;
	password: string;
	client_id: string;
	scope?: string;
	authorization?: string;
	client_secret?: string;
	expectedClientSecret?: string;
	issuer?: string;
	environmentId?: string;
	userEmail?: string;
	userId?: string;
	includeIdToken?: boolean;
	ttls?: Partial<V9TokenTtls>;
};

export type V9TokenError = {
	error: string;
	error_description?: string;
};

export type V9TokenSuccess = {
	access_token: string;
	id_token?: string;
	refresh_token?: string;
	token_type: 'Bearer';
	expires_in: number;
	scope?: string;
};

const DEFAULT_TTLS: V9TokenTtls = {
	accessTokenSeconds: 3600,
	idTokenSeconds: 3600,
	refreshTokenSeconds: 86400,
};

export function tokenExchangeAuthorizationCode(
	req: V9AuthorizationCodeGrantRequest
): V9TokenSuccess | V9TokenError {
	if (req.grant_type !== 'authorization_code') {
		return {
			error: 'unsupported_grant_type',
			error_description: 'Only authorization_code supported',
		};
	}

	const clientAuthOk = validateClientAuth(
		req.client_id,
		req.authorization,
		req.client_secret,
		req.expectedClientSecret
	);
	if (!clientAuthOk)
		return { error: 'invalid_client', error_description: 'Client authentication failed' };

	const rec = V9StateStore.consumeAuthorizationCode(req.code);
	if (!rec)
		return {
			error: 'invalid_grant',
			error_description: 'Invalid or already used authorization code',
		};
	if (rec.clientId !== req.client_id)
		return { error: 'invalid_grant', error_description: 'Code was not issued to this client' };
	if (rec.redirectUri !== req.redirect_uri)
		return { error: 'invalid_grant', error_description: 'redirect_uri mismatch' };

	// PKCE validation
	if (rec.codeChallenge) {
		if (!req.code_verifier)
			return { error: 'invalid_request', error_description: 'Missing code_verifier' };
		const expected =
			rec.codeChallengeMethod === 'S256' ? computePkceS256(req.code_verifier) : req.code_verifier;
		if (expected !== rec.codeChallenge) {
			return { error: 'invalid_grant', error_description: 'Invalid code_verifier' };
		}
	}

	const ttls = { ...DEFAULT_TTLS, ...(req.ttls || {}) };
	const now = Math.floor(Date.now() / 1000);
	const userEmail = rec.userEmail ?? req.userEmail;
	const userId = rec.userId ?? req.userId;
	const scope = rec.scope || req.scope;

	const seed: V9TokenSeed = {
		clientId: req.client_id,
		...(req.environmentId ? { environmentId: req.environmentId } : {}),
		...(req.issuer ? { issuer: req.issuer } : {}),
		...(userEmail ? { userEmail } : {}),
		...(userId ? { userId } : {}),
		...(rec.nonce ? { nonce: rec.nonce } : {}),
		...(scope ? { scope } : {}),
		audience: req.client_id,
	};
	const tokens = generateV9Tokens(seed, now, ttls, !!req.includeIdToken, req.code);
	const tokenScope = (tokens.scope ?? scope) || '';

	if (tokens.refresh_token) {
		V9StateStore.saveToken(tokens.refresh_token, {
			accessToken: tokens.access_token,
			refreshToken: tokens.refresh_token,
			clientId: req.client_id,
			scope: tokenScope,
			subject: userId ?? userEmail ?? 'user',
			issuedAt: tokens.issued_at,
			expiresAt: tokens.issued_at + ttls.accessTokenSeconds,
		});
	}
	V9StateStore.saveToken(tokens.access_token, {
		accessToken: tokens.access_token,
		refreshToken: tokens.refresh_token,
		clientId: req.client_id,
		scope: tokenScope,
		subject: userId ?? userEmail ?? 'user',
		issuedAt: tokens.issued_at,
		expiresAt: tokens.issued_at + ttls.accessTokenSeconds,
	});

	return {
		access_token: tokens.access_token,
		...(tokens.id_token ? { id_token: tokens.id_token } : {}),
		...(tokens.refresh_token ? { refresh_token: tokens.refresh_token } : {}),
		token_type: 'Bearer',
		expires_in: tokens.expires_in,
		...(tokens.scope ? { scope: tokens.scope } : {}),
	};
}

export function tokenExchangeRefreshToken(
	req: V9RefreshTokenGrantRequest
): V9TokenSuccess | V9TokenError {
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

	const existing = V9StateStore.getToken(req.refresh_token);
	const ttls = { ...DEFAULT_TTLS, ...(req.ttls || {}) };
	const now = Math.floor(Date.now() / 1000);

	let seed: V9TokenSeed;
	if (existing) {
		seed = {
			clientId: existing.clientId,
			userId: existing.subject,
			...(existing.scope ? { scope: existing.scope } : {}),
		};
	} else {
		seed = {
			clientId: req.client_id,
			...(req.environmentId ? { environmentId: req.environmentId } : {}),
			...(req.issuer ? { issuer: req.issuer } : {}),
			...(req.userEmail ? { userEmail: req.userEmail } : {}),
			...(req.userId ? { userId: req.userId } : {}),
			...(req.scope ? { scope: req.scope } : {}),
		};
	}
	const tokens = generateV9Tokens(seed, now, ttls, !!req.includeIdToken);

	const seedScope = existing?.scope || req.scope || '';
	const seedSubject = seed.userId ?? seed.userEmail ?? 'user';

	// Rotate refresh token
	if (tokens.refresh_token) {
		V9StateStore.saveToken(tokens.refresh_token, {
			accessToken: tokens.access_token,
			refreshToken: tokens.refresh_token,
			clientId: req.client_id,
			scope: tokens.scope ?? seedScope,
			subject: seedSubject,
			issuedAt: tokens.issued_at,
			expiresAt: tokens.issued_at + ttls.accessTokenSeconds,
		});
		if (existing) V9StateStore.deleteToken(req.refresh_token);
	}
	V9StateStore.saveToken(tokens.access_token, {
		accessToken: tokens.access_token,
		refreshToken: tokens.refresh_token,
		clientId: req.client_id,
		scope: tokens.scope ?? seedScope,
		subject: seedSubject,
		issuedAt: tokens.issued_at,
		expiresAt: tokens.issued_at + ttls.accessTokenSeconds,
	});

	return {
		access_token: tokens.access_token,
		...(tokens.id_token ? { id_token: tokens.id_token } : {}),
		...(tokens.refresh_token ? { refresh_token: tokens.refresh_token } : {}),
		token_type: 'Bearer',
		expires_in: tokens.expires_in,
		...(tokens.scope ? { scope: tokens.scope } : {}),
	};
}

export function tokenExchangeDeviceCode(
	req: V9DeviceCodeGrantRequest
): V9TokenSuccess | V9TokenError {
	if (req.grant_type !== 'urn:ietf:params:oauth:grant-type:device_code') {
		return { error: 'unsupported_grant_type', error_description: 'Only device_code supported' };
	}

	const clientAuthOk = validateClientAuth(
		req.client_id,
		req.authorization,
		req.client_secret,
		req.expectedClientSecret
	);
	if (!clientAuthOk)
		return { error: 'invalid_client', error_description: 'Client authentication failed' };

	const deviceRec = V9StateStore.getDeviceCode(req.device_code);
	if (!deviceRec)
		return { error: 'invalid_grant', error_description: 'Invalid or expired device code' };
	if (deviceRec.clientId !== req.client_id)
		return {
			error: 'invalid_grant',
			error_description: 'Device code was not issued to this client',
		};
	if (!deviceRec.approved)
		return {
			error: 'authorization_pending',
			error_description: 'User has not yet approved the device',
		};

	const ttls = { ...DEFAULT_TTLS, ...(req.ttls || {}) };
	const now = Math.floor(Date.now() / 1000);
	const userEmail = deviceRec.userEmail ?? req.userEmail;
	const userId = deviceRec.userId ?? req.userId;
	const scope = deviceRec.scope || req.scope || '';

	const seed: V9TokenSeed = {
		clientId: deviceRec.clientId,
		...(req.environmentId ? { environmentId: req.environmentId } : {}),
		...(req.issuer ? { issuer: req.issuer } : {}),
		...(userEmail ? { userEmail } : {}),
		...(userId ? { userId } : {}),
		...(scope ? { scope } : {}),
	};

	const tokens = generateV9Tokens(seed, now, ttls, !!req.includeIdToken);
	const seedSubject = userId ?? userEmail ?? 'user';

	V9StateStore.saveToken(tokens.access_token, {
		accessToken: tokens.access_token,
		refreshToken: tokens.refresh_token,
		clientId: deviceRec.clientId,
		scope: tokens.scope ?? scope,
		subject: seedSubject,
		issuedAt: tokens.issued_at,
		expiresAt: tokens.issued_at + ttls.accessTokenSeconds,
	});
	V9StateStore.deleteDeviceCode(req.device_code);

	return {
		access_token: tokens.access_token,
		...(tokens.id_token ? { id_token: tokens.id_token } : {}),
		...(tokens.refresh_token ? { refresh_token: tokens.refresh_token } : {}),
		token_type: 'Bearer',
		expires_in: tokens.expires_in,
		...(tokens.scope ? { scope: tokens.scope } : {}),
	};
}

export function tokenExchangeClientCredentials(
	req: V9ClientCredentialsGrantRequest
): V9TokenSuccess | V9TokenError {
	if (req.grant_type !== 'client_credentials') {
		return {
			error: 'unsupported_grant_type',
			error_description: 'Only client_credentials supported',
		};
	}

	const clientAuthOk = validateClientAuth(
		req.client_id,
		req.authorization,
		req.client_secret,
		req.expectedClientSecret
	);
	if (!clientAuthOk)
		return { error: 'invalid_client', error_description: 'Client authentication failed' };

	const ttls = { ...DEFAULT_TTLS, ...(req.ttls || {}) };
	const now = Math.floor(Date.now() / 1000);

	const seed: V9TokenSeed = {
		clientId: req.client_id,
		...(req.environmentId ? { environmentId: req.environmentId } : {}),
		...(req.issuer ? { issuer: req.issuer } : {}),
		...(req.scope ? { scope: req.scope } : {}),
		...(req.audience ? { audience: req.audience } : {}),
	};
	const tokens = generateV9Tokens(seed, now, ttls, false); // No ID token

	V9StateStore.saveToken(tokens.access_token, {
		accessToken: tokens.access_token,
		clientId: req.client_id,
		scope: tokens.scope ?? req.scope ?? '',
		subject: req.client_id,
		issuedAt: tokens.issued_at,
		expiresAt: tokens.issued_at + ttls.accessTokenSeconds,
	});

	return {
		access_token: tokens.access_token,
		token_type: 'Bearer',
		expires_in: tokens.expires_in,
		...(tokens.scope ? { scope: tokens.scope } : {}),
	};
}

export function tokenExchangePassword(req: V9PasswordGrantRequest): V9TokenSuccess | V9TokenError {
	if (req.grant_type !== 'password') {
		return { error: 'unsupported_grant_type', error_description: 'Only password supported' };
	}

	const clientAuthOk = validateClientAuth(
		req.client_id,
		req.authorization,
		req.client_secret,
		req.expectedClientSecret
	);
	if (!clientAuthOk)
		return { error: 'invalid_client', error_description: 'Client authentication failed' };

	if (!req.username || !req.password) {
		return { error: 'invalid_grant', error_description: 'Invalid username or password' };
	}

	const ttls = { ...DEFAULT_TTLS, ...(req.ttls || {}) };
	const now = Math.floor(Date.now() / 1000);

	const userEmail = req.userEmail || (req.username.includes('@') ? req.username : undefined);
	const userId = req.userId || (userEmail ? userEmail.split('@')[0] : req.username);

	const seed: V9TokenSeed = {
		clientId: req.client_id,
		...(req.environmentId ? { environmentId: req.environmentId } : {}),
		...(req.issuer ? { issuer: req.issuer } : {}),
		userEmail,
		userId,
		...(req.scope ? { scope: req.scope } : {}),
	};

	const includeIdToken = req.includeIdToken || (req.scope?.includes('openid') ?? false);
	const tokens = generateV9Tokens(seed, now, ttls, includeIdToken);
	const seedScope = req.scope || '';

	if (tokens.refresh_token) {
		V9StateStore.saveToken(tokens.refresh_token, {
			accessToken: tokens.access_token,
			refreshToken: tokens.refresh_token,
			clientId: req.client_id,
			scope: tokens.scope ?? seedScope,
			subject: userId,
			issuedAt: tokens.issued_at,
			expiresAt: tokens.issued_at + ttls.accessTokenSeconds,
		});
	}
	V9StateStore.saveToken(tokens.access_token, {
		accessToken: tokens.access_token,
		refreshToken: tokens.refresh_token,
		clientId: req.client_id,
		scope: tokens.scope ?? seedScope,
		subject: userId,
		issuedAt: tokens.issued_at,
		expiresAt: tokens.issued_at + ttls.accessTokenSeconds,
	});

	return {
		access_token: tokens.access_token,
		...(tokens.id_token ? { id_token: tokens.id_token } : {}),
		...(tokens.refresh_token ? { refresh_token: tokens.refresh_token } : {}),
		token_type: 'Bearer',
		expires_in: tokens.expires_in,
		...(tokens.scope ? { scope: tokens.scope } : {}),
	};
}

function validateClientAuth(
	clientId: string,
	authorizationHeader?: string,
	clientSecretPost?: string,
	expectedSecret?: string
): boolean {
	if (!expectedSecret) return true;
	if (authorizationHeader?.startsWith('Basic ')) {
		try {
			const decoded = Buffer.from(authorizationHeader.slice(6), 'base64').toString('utf8');
			const [id, secret] = decoded.split(':');
			if (id === clientId && secret === expectedSecret) return true;
		} catch {
			// fall through
		}
	}
	if (clientSecretPost && clientSecretPost === expectedSecret) return true;
	return false;
}

function computePkceS256(verifier: string): string {
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
