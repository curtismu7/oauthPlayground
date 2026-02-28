// src/services/v9/V9IntrospectionService.ts
// OAuth 2.0 token introspection simulator for V9 (RFC 7662).
// Returns RFC 7662-like payloads using decoded JWT-like data or stored token metadata.
//
// Migrated from V7MIntrospectionService.ts — updated to use V9StateStore.

import { V9StateStore } from './V9StateStore';

export type V9IntrospectionResponse =
	| {
			active: boolean;
			scope?: string;
			client_id?: string;
			username?: string;
			token_type?: string;
			exp?: number;
			iat?: number;
			nbf?: number;
			sub?: string;
			aud?: string | string[];
			iss?: string;
	  }
	| { active: false };

export function introspectToken(token: string): V9IntrospectionResponse {
	if (!token) return { active: false };

	// Attempt decode as JWT-like
	const decoded = decodeJwtLike(token);
	if (decoded) {
		const now = Math.floor(Date.now() / 1000);
		const exp = numberOrUndefined(decoded.payload.exp);
		const iat = numberOrUndefined(decoded.payload.iat);
		const active = exp ? exp > now : true;
		return {
			active,
			token_type: 'Bearer',
			exp,
			iat,
			nbf: numberOrUndefined(decoded.payload.nbf),
			sub: stringOrUndefined(decoded.payload.sub),
			aud: decoded.payload.aud as string | string[],
			iss: stringOrUndefined(decoded.payload.iss),
		};
	}

	// Fallback to store
	const rec = V9StateStore.getToken(token);
	if (!rec) return { active: false };
	const now = Math.floor(Date.now() / 1000);
	return {
		active: rec.expiresAt > now,
		scope: rec.scope,
		client_id: rec.clientId,
		username: rec.subject,
		token_type: 'Bearer',
		exp: rec.expiresAt,
		iat: rec.issuedAt,
		sub: rec.subject,
		aud: rec.clientId,
	};
}

function decodeJwtLike(
	token: string
): { header: Record<string, unknown>; payload: Record<string, unknown> } | undefined {
	const parts = token.split('.');
	if (parts.length !== 3) return undefined;
	try {
		const header = JSON.parse(b64UrlDecode(parts[0]));
		const payload = JSON.parse(b64UrlDecode(parts[1]));
		return { header, payload };
	} catch {
		return undefined;
	}
}

function b64UrlDecode(input: string): string {
	const b64 = input.replace(/-/g, '+').replace(/_/g, '/');
	const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
	return Buffer.from(padded, 'base64').toString('utf8');
}

function stringOrUndefined(v: unknown): string | undefined {
	return typeof v === 'string' ? v : undefined;
}

function numberOrUndefined(v: unknown): number | undefined {
	return typeof v === 'number' ? v : undefined;
}
