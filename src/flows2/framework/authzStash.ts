// src/flows2/framework/authzStash.ts
//
// Cross-redirect handoff for the Authorization Code flow. Because the real flow leaves
// the SPA (full navigation to PingOne and back), React state is lost — so the bits needed
// to resume (PKCE verifier, state, non-secret config) are stashed in sessionStorage.
// The client SECRET is intentionally NOT stashed; the flow re-prefills it from env on resume.

const KEY = 'flows2:authz:pending';

export interface AuthzStash {
	state: string;
	nonce?: string;
	codeVerifier: string;
	oidc: boolean;
	spec: '2.0' | '2.1';
	// non-secret credentials needed to resume the exchange
	environmentId: string;
	region: string;
	clientId: string;
	redirectUri: string;
	scope?: string;
	// filled in by the callback receiver
	code?: string;
	error?: string;
	errorDescription?: string;
}

export function saveStash(s: AuthzStash): void {
	try {
		sessionStorage.setItem(KEY, JSON.stringify(s));
	} catch {
		/* sessionStorage unavailable — real-redirect resume won't work, mock is unaffected */
	}
}

export function loadStash(): AuthzStash | null {
	try {
		const raw = sessionStorage.getItem(KEY);
		return raw ? (JSON.parse(raw) as AuthzStash) : null;
	} catch {
		return null;
	}
}

export function clearStash(): void {
	try {
		sessionStorage.removeItem(KEY);
	} catch {
		/* noop */
	}
}
