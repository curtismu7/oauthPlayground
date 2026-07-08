// src/flows/services/dpopService.ts
//
// DPoP (Demonstrating Proof of Possession) service for the flows2 clean-core rebuild.
// RFC 9449 — binds an access token to a client-held key pair so a stolen token cannot
// be replayed without the matching private key.
//
// real mode → generates a genuine EC P-256 key pair via Web Crypto, builds and signs a
//             real DPoP proof JWT, then POSTs to /api/pingone/token forwarding the proof
//             via the `headers` field. PingOne's DPoP support is limited/absent at the
//             time of writing — the request is forwarded best-effort and PingOne may
//             ignore or reject the DPoP header. Mock mode is the reliable teaching path.
//
// mock mode → returns a deterministic proof JWT and a fake DPoP-bound token entirely
//             offline, without network or key-generation overhead.

import type { FlowCredentials, FlowMode, TokenResult } from '../framework/types';
import { applyClientAuth, toTokenResult } from './pingone';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface DPoPKeyPairResult {
	keyPair: CryptoKeyPair;
	publicJwk: JsonWebKey;
	/** JWK SHA-256 thumbprint (base64url), per RFC 7638. Used in the cnf.jkt claim. */
	thumbprint: string;
}

export interface DPoPProofResult {
	/** Compact JWT: header.payload.signature */
	proof: string;
	/** Decoded header object (for display). */
	header: Record<string, unknown>;
	/** Decoded payload object (for display). */
	payload: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** base64url-encode a string or raw bytes (no padding, URL-safe chars). */
function b64url(data: string | ArrayBuffer): string {
	let base64: string;
	if (typeof data === 'string') {
		base64 = btoa(data);
	} else {
		base64 = btoa(Array.from(new Uint8Array(data), (b) => String.fromCharCode(b)).join(''));
	}
	return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/** base64url-decode a string to its original text. */
function b64urlDecode(s: string): string {
	const padded = s.replace(/-/g, '+').replace(/_/g, '/');
	const pad = padded.length % 4;
	return atob(pad ? padded + '='.repeat(4 - pad) : padded);
}

/** Compute RFC 7638 JWK thumbprint: SHA-256 of canonical key members, base64url-encoded. */
async function jwkThumbprint(publicJwk: JsonWebKey): Promise<string> {
	// For EC P-256 keys the required members are crv, kty, x, y (alphabetical, RFC 7638 §3.2).
	const canonical = JSON.stringify({ crv: publicJwk.crv, kty: publicJwk.kty, x: publicJwk.x, y: publicJwk.y });
	const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical));
	return b64url(digest);
}

/** Generate a random jti (16 hex bytes). */
function randomJti(): string {
	const buf = new Uint8Array(16);
	crypto.getRandomValues(buf);
	return Array.from(buf, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Build the token-endpoint URL for a given env/region (used in the htu claim). */
function tokenEndpointUrl(environmentId: string, region: string): string {
	if (!environmentId || !region) {
		throw new Error('Invalid credentials: environmentId and region are required');
	}
	return `https://auth.pingone.${region}/${environmentId}/as/token`;
}

/** Build the url-encoded client-credentials body + optional Basic auth header. */
function buildCCBody(creds: FlowCredentials): { body: string; headers?: Record<string, string> } {
	const params = new URLSearchParams({ grant_type: 'client_credentials' });
	if (creds.scope && creds.scope.trim()) params.set('scope', creds.scope.trim());
	return applyClientAuth(params, creds);
}

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

/** Fixed mock public JWK — deterministic so tests are stable. */
const MOCK_PUBLIC_JWK: JsonWebKey = {
	kty: 'EC',
	crv: 'P-256',
	x: 'mock-x-component-base64url-padding-removed',
	y: 'mock-y-component-base64url-padding-removed',
	key_ops: ['verify'],
	ext: true,
};

const MOCK_THUMBPRINT = 'mockThumbprintABCDEFGH1234567890XYZ';

const MOCK_KEY_PAIR_RESULT: DPoPKeyPairResult = {
	// CryptoKeyPair is not constructable in test environments; cast to satisfy the type.
	// The mock proof path never calls crypto.subtle.sign, so the actual CryptoKey is unused.
	keyPair: null as unknown as CryptoKeyPair,
	publicJwk: MOCK_PUBLIC_JWK,
	thumbprint: MOCK_THUMBPRINT,
};

// ---------------------------------------------------------------------------
// dpopService
// ---------------------------------------------------------------------------

export const dpopService = {
	/**
	 * Generate an ephemeral EC P-256 key pair and compute the public JWK + thumbprint.
	 * mock mode returns a deterministic offline result — no crypto, no randomness.
	 */
	async generateKeyPair(mode: FlowMode): Promise<DPoPKeyPairResult> {
		if (mode === 'mock') return MOCK_KEY_PAIR_RESULT;

		const keyPair = await crypto.subtle.generateKey(
			{ name: 'ECDSA', namedCurve: 'P-256' },
			true,
			['sign', 'verify']
		);

		const rawJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
		// Strip any private-key components just in case.
		const publicJwk: JsonWebKey = { kty: rawJwk.kty, crv: rawJwk.crv, x: rawJwk.x, y: rawJwk.y, key_ops: ['verify'], ext: true };

		const thumbprint = await jwkThumbprint(publicJwk);

		return { keyPair, publicJwk, thumbprint };
	},

	/**
	 * Build and sign a DPoP proof JWT.
	 *
	 * Header: { typ: 'dpop+jwt', alg: 'ES256', jwk: <publicJwk> }
	 * Payload: { jti, htm, htu, iat, nonce? }
	 *
	 * mock mode returns a deterministic offline proof (base64url segments with a
	 * fixed placeholder signature) — no network, no real signing.
	 */
	async createProof(
		{ htm, htu, nonce }: { htm: string; htu: string; nonce?: string },
		keyPairResult: DPoPKeyPairResult,
		mode: FlowMode
	): Promise<DPoPProofResult> {
		const jti = mode === 'mock' ? 'mock-jti-0000000000000001' : randomJti();
		const iat = Math.floor(Date.now() / 1000);

		const header: Record<string, unknown> = {
			typ: 'dpop+jwt',
			alg: 'ES256',
			jwk: keyPairResult.publicJwk,
		};

		const payload: Record<string, unknown> = {
			jti,
			htm,
			htu,
			iat,
			...(nonce ? { nonce } : {}),
		};

		if (mode === 'mock') {
			const encodedHeader = b64url(JSON.stringify(header));
			const encodedPayload = b64url(JSON.stringify(payload));
			const proof = `${encodedHeader}.${encodedPayload}.mock-dpop-signature`;
			return { proof, header, payload };
		}

		// Real: sign with the private key using ES256 (ECDSA + SHA-256).
		const encodedHeader = b64url(JSON.stringify(header));
		const encodedPayload = b64url(JSON.stringify(payload));
		const signingInput = `${encodedHeader}.${encodedPayload}`;

		const signatureBuffer = await crypto.subtle.sign(
			{ name: 'ECDSA', hash: { name: 'SHA-256' } },
			keyPairResult.keyPair.privateKey,
			new TextEncoder().encode(signingInput)
		);

		const proof = `${signingInput}.${b64url(signatureBuffer)}`;
		return { proof, header, payload };
	},

	/**
	 * Request an access token via client_credentials, forwarding the DPoP proof
	 * as a request header.
	 *
	 * real mode → POST /api/pingone/token with headers: { DPoP: proof }.
	 *   NOTE: PingOne's DPoP support is limited at the time of writing. The request
	 *   is forwarded best-effort. If PingOne rejects the DPoP header the response
	 *   will contain an error; use mock mode for a reliable offline teaching demo.
	 *
	 * mock mode → returns a fake DPoP-bound token offline (token_type: 'DPoP',
	 *   raw includes a cnf.jkt binding).
	 */
	async requestTokenWithDpop(
		creds: FlowCredentials,
		proofJwt: string,
		thumbprint: string,
		mode: FlowMode
	): Promise<TokenResult> {
		if (mode === 'mock') {
			const now = Math.floor(Date.now() / 1000);
			const fakeClaims = {
				sub: creds.clientId,
				aud: `https://api.pingone.${creds.region}/${creds.environmentId}`,
				scope: creds.scope || 'mock:read',
				iat: now,
				exp: now + 3600,
				iss: `https://auth.pingone.${creds.region}/${creds.environmentId}/as`,
				cnf: { jkt: thumbprint },
				token_use: 'mock',
			};
			const fakeHeader = b64url(JSON.stringify({ alg: 'none', typ: 'JWT' }));
			const fakePayload = b64url(JSON.stringify(fakeClaims));
			const raw = {
				access_token: `${fakeHeader}.${fakePayload}.`,
				token_type: 'DPoP',
				expires_in: 3600,
				scope: fakeClaims.scope,
				_mock: true,
				_dpop_bound: true,
				cnf: { jkt: thumbprint },
			};
			return toTokenResult(raw);
		}

		const { body, headers: authHeaders } = buildCCBody(creds);

		const res = await fetch('/api/pingone/token', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				environment_id: creds.environmentId,
				region: creds.region,
				auth_method: creds.authMethod ?? 'client_secret_post',
				body,
				headers: {
					...(authHeaders ?? {}),
					DPoP: proofJwt,
				},
			}),
		});

		const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
		if (!res.ok || data.error) {
			throw {
				error: (data.error as string) || 'token_request_failed',
				error_description:
					(data.error_description as string) || `Token request failed (HTTP ${res.status})`,
				status: res.status,
			};
		}
		return toTokenResult(data);
	},

	// Expose helpers needed by tests / the flow page.
	_tokenEndpointUrl: tokenEndpointUrl,
};
