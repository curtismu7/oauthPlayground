/**
 * PingOne API config: use proxy when on localhost (avoid CORS), direct when on custom domain.
 * Tracking of API calls is required either way (proxy: backend logs; direct: client reports via POST /api/pingone/log-call).
 */

/** True when origin is localhost/127.0.0.1 — use backend proxy (/api/pingone/*). False = custom domain, call PingOne direct. */
export function shouldUsePingOneProxy(): boolean {
	if (typeof window === 'undefined') return true;
	const h = window.location.hostname.toLowerCase();
	return h === 'localhost' || h === '127.0.0.1';
}

const PLATFORM_BY_REGION: Record<string, string> = {
	us: 'https://api.pingone.com',
	na: 'https://api.pingone.com',
	eu: 'https://api.pingone.eu',
	ca: 'https://api.pingone.ca',
	ap: 'https://api.pingone.asia',
	asia: 'https://api.pingone.asia',
};

const AUTH_BY_REGION: Record<string, string> = {
	us: 'https://auth.pingone.com',
	na: 'https://auth.pingone.com',
	eu: 'https://auth.pingone.eu',
	ca: 'https://auth.pingone.ca',
	ap: 'https://auth.pingone.asia',
	asia: 'https://auth.pingone.asia',
};

/** Base URL for PingOne Platform API (v1/environments, MFA, etc.). Empty string = use proxy. */
export function getPingOnePlatformBaseUrl(region: string = 'us'): string {
	if (shouldUsePingOneProxy()) return '';
	const r = (region || 'us').toLowerCase();
	return PLATFORM_BY_REGION[r] ?? PLATFORM_BY_REGION.us;
}

/** Base URL for PingOne Auth (authorize, token, userinfo). Empty string = use proxy. */
export function getPingOneAuthBaseUrl(region: string = 'us'): string {
	if (shouldUsePingOneProxy()) return '';
	const r = (region || 'us').toLowerCase();
	return AUTH_BY_REGION[r] ?? AUTH_BY_REGION.us;
}
