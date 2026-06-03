/**
 * PKCE (RFC 7636) — Node.js implementation using node:crypto (NOT window.crypto).
 * verifier: 43–128 chars from the unreserved set [A-Za-z0-9-._~]
 * challenge (S256): BASE64URL(SHA256(verifier))
 */

import crypto from 'node:crypto';

export interface PkcePair {
	codeVerifier: string;
	codeChallenge: string;
	codeChallengeMethod: 'S256' | 'plain';
}

/** Generate a high-entropy code_verifier of the given length (clamped to 43–128). */
export function generateVerifier(length = 64): string {
	const len = Math.min(128, Math.max(43, Math.floor(length)));
	// base64url of N random bytes yields ~1.33*N chars; generate enough then slice.
	const bytes = crypto.randomBytes(Math.ceil((len * 3) / 4));
	return bytes.toString('base64url').slice(0, len);
}

/** Compute the S256 code_challenge for a verifier. */
export function computeChallenge(verifier: string): string {
	return crypto.createHash('sha256').update(verifier).digest('base64url');
}

/** Generate a full PKCE pair (S256). */
export function generatePkcePair(length = 64): PkcePair {
	const codeVerifier = generateVerifier(length);
	return {
		codeVerifier,
		codeChallenge: computeChallenge(codeVerifier),
		codeChallengeMethod: 'S256',
	};
}

/** Validate that a verifier matches a challenge under the given method (RFC 7636 §4.6). */
export function validatePkcePair(
	verifier: string,
	challenge: string,
	method: 'S256' | 'plain' = 'S256'
): boolean {
	if (method === 'plain') return verifier === challenge;
	return computeChallenge(verifier) === challenge;
}

const VERIFIER_RE = /^[A-Za-z0-9\-._~]{43,128}$/;

/** Check a verifier is RFC 7636-compliant (length + charset). */
export function isVerifierCompliant(verifier: string): boolean {
	return VERIFIER_RE.test(verifier);
}

/** Generate a cryptographically random URL-safe string (for state, nonce). */
export function randomString(bytes = 32): string {
	return crypto.randomBytes(bytes).toString('base64url');
}
