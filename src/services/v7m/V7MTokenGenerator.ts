// src/services/v7m/V7MTokenGenerator.ts
// Deterministic token generator for V7M educational mock flows.
// Produces realistic-looking JWT access and ID tokens and an opaque refresh token
// derived from provided flow settings. Output is stable per seed until expiry.

export type V7MTokenTtls = {
	accessTokenSeconds: number;
	idTokenSeconds: number;
	refreshTokenSeconds: number;
};

export type V7MTokenSeed = {
	environmentId?: string;
	issuer?: string;
	clientId: string;
	userEmail?: string;
	userId?: string;
	nonce?: string;
	scope?: string;
	audience?: string | string[];
};

export type V7MGeneratedTokens = {
	access_token: string;
	id_token?: string;
	refresh_token: string;
	token_type: 'Bearer';
	expires_in: number;
	scope?: string;
	issued_at: number;
};

/**
 * Generate deterministic mock tokens for educational flows.
 * Uses a stable seed so identical inputs produce identical tokens in a time window.
 */
export function generateV7MTokens(
	seed: V7MTokenSeed,
	nowEpochSeconds: number,
	ttls: V7MTokenTtls,
	includeIdToken: boolean,
	codeForCHash?: string
): V7MGeneratedTokens {
	const issuedAt = clampToSecond(nowEpochSeconds);
	const accessExp = issuedAt + ttls.accessTokenSeconds;
	const idExp = issuedAt + ttls.idTokenSeconds;
	const refreshExp = issuedAt + ttls.refreshTokenSeconds;

	const seedString = buildSeedString(seed);
	const baseEntropy = stableHash(seedString);
	const kid = `v7m-${baseEntropy.slice(0, 8)}`;

	const iss = seed.issuer ?? `https://mock.ping.identity/${seed.environmentId ?? 'env'}`;
	const audArray = Array.isArray(seed.audience)
		? seed.audience
		: seed.audience
			? [seed.audience]
			: [seed.clientId];
	const sub = stableHash(seed.userId ?? seed.userEmail ?? seed.clientId).slice(0, 24);

	const accessToken = buildJwtLike({
		header: { alg: 'RS256', typ: 'JWT', kid },
		payload: {
			iss,
			sub,
			aud: audArray.length === 1 ? audArray[0] : audArray,
			exp: accessExp,
			iat: issuedAt,
			scope: seed.scope ?? 'openid profile email',
			client_id: seed.clientId,
		},
		signSeed: `${baseEntropy}.access.${issuedAt}.${accessExp}`,
	});

	// Compute OIDC hashes for ID token (educational stand-in)
	const at_hash = base64UrlEncode(stableHash(accessToken)).slice(0, 43); // looks like base64url
	const c_hash =
		codeForCHash !== undefined ? base64UrlEncode(stableHash(codeForCHash)).slice(0, 43) : undefined;

	const idToken = includeIdToken
		? buildJwtLike({
				header: { alg: 'RS256', typ: 'JWT', kid },
				payload: {
					iss,
					sub,
					aud: seed.clientId,
					exp: idExp,
					iat: issuedAt,
					auth_time: issuedAt,
					nonce: seed.nonce ?? undefined,
					amr: ['pwd'],
					acr: 'urn:mace:incommon:iap:silver',
					at_hash,
					c_hash,
					email: seed.userEmail ?? undefined,
					email_verified: seed.userEmail ? true : undefined,
					name: deriveDisplayName(seed.userEmail),
					preferred_username: preferredUsername(seed.userEmail),
				},
				signSeed: `${baseEntropy}.id.${issuedAt}.${idExp}`,
			})
		: undefined;

	const refresh_token = buildOpaque(
		`${baseEntropy}.refresh.${issuedAt}.${refreshExp}.${seed.clientId}.${sub}`
	);

	return {
		access_token: accessToken,
		id_token: idToken,
		refresh_token,
		token_type: 'Bearer',
		expires_in: ttls.accessTokenSeconds,
		scope: seed.scope,
		issued_at: issuedAt,
	};
}

/**
 * Build a deterministic, JWT-looking string: base64url(header).base64url(payload).base64url(signature)
 * The "signature" is a deterministic digest for educational realism only.
 */
function buildJwtLike(params: {
	header: Record<string, unknown>;
	payload: Record<string, unknown>;
	signSeed: string;
}): string {
	const headerB64 = base64UrlEncode(jsonStableStringify(params.header));
	const payloadB64 = base64UrlEncode(jsonStableStringify(stripUndefined(params.payload)));
	const signature = base64UrlEncode(stableHash(`${params.signSeed}.${headerB64}.${payloadB64}`));
	return `${headerB64}.${payloadB64}.${signature}`;
}

function buildOpaque(seed: string): string {
	// 48 bytes of base64url derived from deterministic hash material
	const digest = stableHash(seed);
	return `v7m.${base64UrlEncode(digest).slice(0, 64)}`;
}

function deriveDisplayName(email?: string): string | undefined {
	if (!email) return undefined;
	const local = email.split('@')[0] ?? '';
	const parts = local
		.replace(/[._-]+/g, ' ')
		.split(' ')
		.filter(Boolean);
	return parts.map(capitalize).join(' ') || local;
}

function preferredUsername(email?: string): string | undefined {
	if (!email) return undefined;
	return email.split('@')[0] ?? email;
}

function capitalize(s: string): string {
	return s.length ? s[0].toUpperCase() + s.slice(1) : s;
}

function stripUndefined<T extends Record<string, unknown>>(obj: T): T {
	const out: Record<string, unknown> = {};
	for (const [k, v] of Object.entries(obj)) {
		if (v !== undefined) out[k] = v;
	}
	return out as T;
}

function clampToSecond(epochSeconds: number): number {
	return Math.floor(epochSeconds);
}

function buildSeedString(seed: V7MTokenSeed): string {
	return [
		seed.environmentId ?? '',
		seed.issuer ?? '',
		seed.clientId,
		seed.userEmail ?? '',
		seed.userId ?? '',
		seed.nonce ?? '',
		seed.scope ?? '',
		Array.isArray(seed.audience) ? seed.audience.join(',') : (seed.audience ?? ''),
	].join('|');
}

/**
 * Stable hash -> hex string. Deterministic, non-cryptographic; sufficient for seeding.
 */
function stableHash(input: string): string {
	// FNV-1a 64-bit variant into hex
	let hashHigh = 0xcbf29ce4;
	let hashLow = 0x84222325; // 64-bit init split
	for (let i = 0; i < input.length; i++) {
		const code = input.charCodeAt(i);
		hashLow ^= code & 0xff;
		// 64-bit multiply by FNV prime (0x100000001b3)
		const lowMul = (hashLow >>> 0) * 0x1b3;
		const highMul = (hashHigh >>> 0) * 0x1b3;
		const carry = (lowMul / 0x100000000) >>> 0;
		hashLow = (lowMul & 0xffffffff) >>> 0;
		hashHigh = ((highMul + carry + ((hashHigh >>> 0) << 24)) & 0xffffffff) >>> 0;
	}
	return (
		(hashHigh >>> 0).toString(16).padStart(8, '0') + (hashLow >>> 0).toString(16).padStart(8, '0')
	);
}

function jsonStableStringify(obj: unknown): string {
	return JSON.stringify(obj, Object.keys(obj as Record<string, unknown>).sort());
}

function base64UrlEncode(input: string): string {
	const b64 = Buffer.from(input, 'utf8').toString('base64');
	return b64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}
