// src/services/v9/V9UserInfoService.ts
// UserInfo endpoint simulator for V9. Validates bearer token presence and returns
// profile derived from ID token payload if available or from stored token metadata.
//
// Migrated from V7MUserInfoService.ts — updated to use V9StateStore.

import { V9StateStore } from './V9StateStore';

export type V9UserInfo =
	| {
			sub: string;
			name?: string;
			given_name?: string;
			family_name?: string;
			preferred_username?: string;
			email?: string;
			email_verified?: boolean;
			updated_at?: number;
	  }
	| { error: string; error_description?: string };

export function getUserInfoFromAccessToken(bearerToken?: string): V9UserInfo {
	if (!bearerToken) return { error: 'invalid_token', error_description: 'Missing access token' };

	// Try decode as JWT-like
	const decoded = decodeJwtLike(bearerToken);
	if (decoded) {
		const sub = stringOrEmpty(decoded.payload.sub);
		const email = stringOrUndefined(decoded.payload.email);
		return {
			sub: sub || 'user',
			name: stringOrUndefined(decoded.payload.name),
			preferred_username:
				stringOrUndefined(decoded.payload.preferred_username) ??
				(email ? email.split('@')[0] : undefined),
			email,
			email_verified:
				typeof decoded.payload.email_verified === 'boolean'
					? decoded.payload.email_verified
					: undefined,
			updated_at: numberOrUndefined(decoded.payload.iat),
		};
	}

	// Fallback to store
	const rec = V9StateStore.getToken(bearerToken);
	if (rec) {
		return {
			sub: rec.subject,
			preferred_username: rec.subject,
			updated_at: rec.issuedAt,
		};
	}

	return { error: 'invalid_token', error_description: 'Token not recognized' };
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

function stringOrEmpty(v: unknown): string {
	return typeof v === 'string' ? v : '';
}

function stringOrUndefined(v: unknown): string | undefined {
	return typeof v === 'string' ? v : undefined;
}

function numberOrUndefined(v: unknown): number | undefined {
	return typeof v === 'number' ? v : undefined;
}
