/**
 * DPoP (RFC 9449) — Demonstration of Proof-of-Possession.
 * Generates an ephemeral key pair and signs a DPoP proof JWT binding a request
 * (htm + htu) to the key. Optionally includes `ath` (access token hash) and `nonce`.
 *
 * Uses `jose` for key generation and signing (ES256 by default).
 */

import { exportJWK, generateKeyPair, SignJWT, calculateJwkThumbprint, type JWK } from 'jose';
import crypto from 'node:crypto';

export type DpopAlg = 'ES256' | 'RS256';

export interface DpopKeyMaterial {
	alg: DpopAlg;
	publicJwk: JWK;
	privateJwk: JWK;
	thumbprint: string;
}

export interface DpopProofResult {
	proof: string;
	publicJwk: JWK;
	privateJwk: JWK;
	thumbprint: string;
	jti: string;
	htm: string;
	htu: string;
}

/** Generate a fresh DPoP key pair and return exportable JWKs + JKT thumbprint. */
export async function generateDpopKey(alg: DpopAlg = 'ES256'): Promise<DpopKeyMaterial> {
	const { publicKey, privateKey } = await generateKeyPair(alg, { extractable: true });
	const publicJwk = await exportJWK(publicKey);
	const privateJwk = await exportJWK(privateKey);
	publicJwk.alg = alg;
	const thumbprint = await calculateJwkThumbprint(publicJwk, 'sha256');
	return { alg, publicJwk, privateJwk, thumbprint };
}

/** Compute the `ath` claim: BASE64URL(SHA256(access_token)). */
export function accessTokenHash(accessToken: string): string {
	return crypto.createHash('sha256').update(accessToken).digest('base64url');
}

export interface CreateProofInput {
	/** HTTP method of the request the proof is for (e.g. POST). */
	htm: string;
	/** HTTP target URI (no query/fragment) of the request. */
	htu: string;
	alg?: DpopAlg;
	/** Reuse an existing private JWK (else a new key pair is generated). */
	privateJwk?: JWK;
	publicJwk?: JWK;
	/** Bind to an access token via the `ath` claim. */
	accessToken?: string;
	/** Server-provided DPoP nonce, if any. */
	nonce?: string;
}

/**
 * Create a signed DPoP proof JWT. If no key is supplied, a new ephemeral pair is
 * generated and returned alongside the proof so the caller can reuse it.
 */
export async function createDpopProof(input: CreateProofInput): Promise<DpopProofResult> {
	const alg: DpopAlg = input.alg ?? 'ES256';

	let publicJwk = input.publicJwk;
	let privateJwk = input.privateJwk;
	if (!privateJwk || !publicJwk) {
		const mat = await generateDpopKey(alg);
		publicJwk = mat.publicJwk;
		privateJwk = mat.privateJwk;
	}

	const { importJWK } = await import('jose');
	const signKey = await importJWK(privateJwk, alg);

	const jti = crypto.randomBytes(16).toString('base64url');
	const htu = stripUrl(input.htu);

	const builder = new SignJWT({
		htm: input.htm.toUpperCase(),
		htu,
		jti,
		...(input.accessToken ? { ath: accessTokenHash(input.accessToken) } : {}),
		...(input.nonce ? { nonce: input.nonce } : {}),
	})
		.setProtectedHeader({ typ: 'dpop+jwt', alg, jwk: publicJwk })
		.setIssuedAt();

	const proof = await builder.sign(signKey);
	const thumbprint = await calculateJwkThumbprint(publicJwk, 'sha256');

	return { proof, publicJwk, privateJwk, thumbprint, jti, htm: input.htm.toUpperCase(), htu };
}

/** Strip query and fragment from a URL for the htu claim (RFC 9449 §4.2). */
function stripUrl(url: string): string {
	try {
		const u = new URL(url);
		return `${u.origin}${u.pathname}`;
	} catch {
		return url;
	}
}
