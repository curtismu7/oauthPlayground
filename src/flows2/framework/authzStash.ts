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
	// flows2 route to resume at after the callback (defaults to the Authorization Code flow).
	// PAR reuses this same code-in-query callback but resumes its own page.
	returnTo?: string;
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
	} catch (err) {
		if (err instanceof SyntaxError) {
			return null;
		}
		if (err instanceof Error && (
			err.name === 'QuotaExceededError' ||
			err.message.includes('QuotaExceededError') ||
			err.name === 'SecurityError'
		)) {
			return null;
		}
		// Catch-all: never propagate storage errors to callers (e.g. Safari private-mode).
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
