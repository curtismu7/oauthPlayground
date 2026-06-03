/**
 * JWKS + JWT helpers using `jose`. Provider-agnostic.
 * - decodeJwtParts: split header/payload without verification (educational)
 * - verifySignature: verify against a remote JWKS (jose createRemoteJWKSet + jwtVerify)
 * - fetchJwks: raw JWKS document fetch
 */

import axios from 'axios';
import { createRemoteJWKSet, jwtVerify, type JWTVerifyOptions } from 'jose';

export interface DecodedJwt {
	header: Record<string, unknown>;
	payload: Record<string, unknown>;
	hasSignature: boolean;
}

function b64urlToJson(segment: string): Record<string, unknown> {
	const json = Buffer.from(segment, 'base64url').toString('utf8');
	return JSON.parse(json) as Record<string, unknown>;
}

/** Decode a JWT's header and payload without verifying the signature. */
export function decodeJwtParts(token: string): DecodedJwt {
	const parts = token.split('.');
	if (parts.length < 2) {
		throw new Error('Not a JWT — expected at least header.payload segments.');
	}
	return {
		header: b64urlToJson(parts[0]),
		payload: b64urlToJson(parts[1]),
		hasSignature: parts.length === 3 && parts[2].length > 0,
	};
}

const remoteSets = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

function getRemoteSet(jwksUri: string) {
	let set = remoteSets.get(jwksUri);
	if (!set) {
		set = createRemoteJWKSet(new URL(jwksUri));
		remoteSets.set(jwksUri, set);
	}
	return set;
}

export interface VerifyOptions {
	issuer?: string;
	audience?: string;
	algorithms?: string[];
	clockToleranceSeconds?: number;
}

export interface VerifyResult {
	valid: boolean;
	payload?: Record<string, unknown>;
	header?: Record<string, unknown>;
	algorithm?: string;
	kid?: string;
	error?: string;
}

/** Verify a JWT signature against a remote JWKS endpoint. */
export async function verifySignature(
	token: string,
	jwksUri: string,
	options: VerifyOptions = {}
): Promise<VerifyResult> {
	try {
		const jwks = getRemoteSet(jwksUri);
		const verifyOpts: JWTVerifyOptions = {};
		if (options.issuer) verifyOpts.issuer = options.issuer;
		if (options.audience) verifyOpts.audience = options.audience;
		if (options.algorithms) verifyOpts.algorithms = options.algorithms;
		if (typeof options.clockToleranceSeconds === 'number')
			verifyOpts.clockTolerance = options.clockToleranceSeconds;

		const { payload, protectedHeader } = await jwtVerify(token, jwks, verifyOpts);
		return {
			valid: true,
			payload: payload as Record<string, unknown>,
			header: protectedHeader as Record<string, unknown>,
			algorithm: protectedHeader.alg,
			kid: protectedHeader.kid,
		};
	} catch (error) {
		return { valid: false, error: (error as Error).message };
	}
}

/** Fetch a raw JWKS document. */
export async function fetchJwks(jwksUri: string): Promise<{ keys: Array<Record<string, unknown>> }> {
	const { data } = await axios.get<{ keys: Array<Record<string, unknown>> }>(jwksUri, {
		headers: { Accept: 'application/json' },
		timeout: 10000,
	});
	return data;
}

/** Summarize the standard claims of a decoded payload into human-readable lines. */
export function summarizeClaims(payload: Record<string, unknown>): string {
	const lines: string[] = [];
	if (payload.iss) lines.push(`Issuer (iss): ${String(payload.iss)}`);
	if (payload.sub) lines.push(`Subject (sub): ${String(payload.sub)}`);
	if (payload.aud)
		lines.push(
			`Audience (aud): ${Array.isArray(payload.aud) ? (payload.aud as string[]).join(', ') : String(payload.aud)}`
		);
	if (payload.client_id) lines.push(`Client ID: ${String(payload.client_id)}`);
	if (payload.scope) lines.push(`Scope: ${String(payload.scope)}`);
	if (payload.act) lines.push(`Actor (act): ${JSON.stringify(payload.act)}`);
	if (payload.may_act) lines.push(`May act (may_act): ${JSON.stringify(payload.may_act)}`);
	if (typeof payload.exp === 'number') {
		const d = new Date(payload.exp * 1000);
		lines.push(`Expires (exp): ${d.toISOString()} ${d < new Date() ? '(EXPIRED)' : '(valid)'}`);
	}
	if (typeof payload.iat === 'number')
		lines.push(`Issued at (iat): ${new Date(payload.iat * 1000).toISOString()}`);
	return lines.join('\n');
}

/** Whether a decoded payload is expired (exp in the past). */
export function isExpired(payload: Record<string, unknown>): boolean {
	return typeof payload.exp === 'number' && payload.exp * 1000 < Date.now();
}
