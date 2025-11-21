// PingOne URL builders for Implicit and related flows
// Aligned with apidocs.pingidentity.com

export interface PingOneImplicitAuthUrlParams {
	environmentId: string;
	clientId: string;
	redirectUri: string;
	scopes: string; // space-delimited
	responseType: 'token' | 'oidc'; // 'token' = OAuth 2.0, 'oidc' = 'id_token token' (OIDC)
	responseMode?: 'fragment' | 'form_post';
	state?: string;
	nonce?: string;
	prompt?: string;
	loginHint?: string;
}

/**
 * Build PingOne authorization URL for implicit flows
 * @param params - Authorization parameters
 * @returns Complete authorization URL
 */
export function buildPingOneImplicitAuthUrl(params: PingOneImplicitAuthUrlParams): string {
	const baseUrl = `https://auth.pingone.com/${params.environmentId}/as/authorize`;

	const urlParams = new URLSearchParams();

	// Required parameters
	urlParams.set('client_id', params.clientId);
	urlParams.set('redirect_uri', params.redirectUri);
	urlParams.set('scope', params.scopes);

	// Response type mapping
	// Note: 'id_token' alone is NOT valid for implicit flow per OIDC spec
	const responseTypeMap = {
		token: 'token', // OAuth 2.0 implicit - access token only
		oidc: 'id_token token', // OIDC implicit - both ID token and access token
	};
	urlParams.set('response_type', responseTypeMap[params.responseType]);

	// Optional parameters
	if (params.responseMode) {
		urlParams.set('response_mode', params.responseMode);
	}

	if (params.state) {
		urlParams.set('state', params.state);
	}

	// Nonce is REQUIRED when response_type includes id_token (OIDC implicit)
	if (params.responseType === 'oidc') {
		if (params.nonce) {
			urlParams.set('nonce', params.nonce);
		} else {
			// Auto-generate nonce if not provided (required for id_token)
			urlParams.set('nonce', generateNonce());
		}
	}

	if (params.prompt) {
		urlParams.set('prompt', params.prompt);
	}

	if (params.loginHint) {
		urlParams.set('login_hint', params.loginHint);
	}

	return `${baseUrl}?${urlParams.toString()}`;
}

/**
 * Generate a random nonce for OIDC flows
 * @returns Random nonce string
 */
export function generateNonce(): string {
	return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Generate a random state parameter for CSRF protection
 * @returns Random state string
 */
export function generateState(): string {
	return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Build PingOne logout URL
 * @param environmentId - PingOne environment ID
 * @param options - Logout options
 * @returns Logout URL
 */
export function buildPingOneLogoutUrl(
	environmentId: string,
	options: {
		idTokenHint?: string;
		postLogoutRedirectUri?: string;
		state?: string;
	} = {}
): string {
	const baseUrl = `https://auth.pingone.com/${environmentId}/as/logout`;

	const urlParams = new URLSearchParams();

	if (options.idTokenHint) {
		urlParams.set('id_token_hint', options.idTokenHint);
	}

	if (options.postLogoutRedirectUri) {
		urlParams.set('post_logout_redirect_uri', options.postLogoutRedirectUri);
	}

	if (options.state) {
		urlParams.set('state', options.state);
	}

	return `${baseUrl}?${urlParams.toString()}`;
}

/**
 * Build PingOne worker token URL (for environment-level operations)
 * @param environmentId - PingOne environment ID
 * @returns Worker token endpoint URL
 */
export function buildPingOneWorkerTokenUrl(environmentId: string): string {
	return `https://auth.pingone.com/${environmentId}/workers/token`;
}

/**
 * Build PingOne JWKS URL (for ID token verification)
 * @param environmentId - PingOne environment ID
 * @returns JWKS endpoint URL
 */
export function buildPingOneJwksUrl(environmentId: string): string {
	return `https://auth.pingone.com/${environmentId}/as/jwks`;
}

/**
 * Build PingOne UserInfo endpoint URL
 * @param environmentId - PingOne environment ID
 * @returns UserInfo endpoint URL
 */
export function buildPingOneUserInfoUrl(environmentId: string): string {
	return `https://auth.pingone.com/${environmentId}/as/userinfo`;
}
