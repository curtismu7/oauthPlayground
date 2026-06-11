// src/flows2/services/pingone.ts
//
// Tiny helpers shared by the flows2 services: PingOne auth-host selection and
// unverified JWT payload decoding (for mock/teaching views — never validation).

export function pingoneHost(region?: string): string {
	const r = (region || 'com').toLowerCase().trim();
	if (r === 'eu') return 'auth.pingone.eu';
	if (r === 'ca') return 'auth.pingone.ca';
	if (r === 'ap' || r === 'asia') return 'auth.pingone.asia';
	return 'auth.pingone.com';
}

/** Decode a JWT payload without verification — null for opaque/garbled tokens. */
export function decodeJwtPayload(token?: string): Record<string, unknown> | null {
	if (!token) return null;
	const parts = token.split('.');
	if (parts.length < 2) return null;
	try {
		return JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))) as Record<string, unknown>;
	} catch {
		return null;
	}
}
