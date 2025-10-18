import type { FlowConfig } from '../components/FlowConfiguration';

// Generate a random string for nonce/state
const generateRandomString = (length: number) => {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let result = '';
	for (let i = 0; i < length; i++) {
		result += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return result;
};

// Default configuration for Authorization Code Flow
export const getAuthorizationCodeConfig = (): FlowConfig => ({
	scopes: ['openid', 'profile', 'email'],
	responseType: 'code',
	grantType: 'authorization_code',
	enablePKCE: true,
	codeChallengeMethod: 'S256',
	customParams: {},
	enableOIDC: true,
	nonce: generateRandomString(32),
	state: generateRandomString(32),
	customClaims: {},
	audience: '',
	maxAge: 0,
	prompt: '',
	loginHint: '',
	acrValues: [],
	clientAuthMethod: 'client_secret_post',
	showSuccessModal: true,
	showAuthCodeInModal: true,
	showCredentialsModal: true,
	enableErrorRecovery: true,
	showAuthRequestModal: false,
});

// Default configuration for PKCE Flow
export const getPKCEConfig = (): FlowConfig => ({
	scopes: ['openid', 'profile', 'email'],
	responseType: 'code',
	grantType: 'authorization_code',
	enablePKCE: true,
	codeChallengeMethod: 'S256',
	customParams: {},
	enableOIDC: true,
	nonce: generateRandomString(32),
	state: generateRandomString(32),
	customClaims: {},
	audience: '',
	maxAge: 0,
	prompt: '',
	loginHint: '',
	acrValues: [],
	clientAuthMethod: 'client_secret_post',
	showSuccessModal: true,
	showAuthCodeInModal: true,
	showCredentialsModal: true,
	enableErrorRecovery: true,
	showAuthRequestModal: false,
});

// Default configuration for Implicit Flow
export const getImplicitConfig = (): FlowConfig => ({
	scopes: ['openid', 'profile', 'email'],
	responseType: 'token',
	grantType: 'implicit',
	enablePKCE: false,
	codeChallengeMethod: 'S256',
	customParams: {},
	enableOIDC: true,
	nonce: generateRandomString(32),
	state: generateRandomString(32),
	customClaims: {},
	audience: '',
	maxAge: 0,
	prompt: '',
	loginHint: '',
	acrValues: [],
	clientAuthMethod: 'client_secret_post',
	showSuccessModal: true,
	showAuthCodeInModal: true,
	showCredentialsModal: true,
	enableErrorRecovery: true,
	showAuthRequestModal: false,
});

// Default configuration for Client Credentials Flow
export const getClientCredentialsConfig = (): FlowConfig => ({
	scopes: ['openid'],
	responseType: '',
	grantType: 'client_credentials',
	enablePKCE: false,
	codeChallengeMethod: 'S256',
	customParams: {},
	enableOIDC: false,
	nonce: '',
	state: '',
	customClaims: {},
	audience: '',
	maxAge: 0,
	prompt: '',
	loginHint: '',
	acrValues: [],
	clientAuthMethod: 'client_secret_post',
	showSuccessModal: true,
	showAuthCodeInModal: true,
	showCredentialsModal: true,
	enableErrorRecovery: true,
	showAuthRequestModal: false,
});

// Default configuration for Device Code Flow
export const getDeviceCodeConfig = (): FlowConfig => ({
	scopes: ['openid', 'profile', 'email'],
	responseType: '',
	grantType: 'urn:ietf:params:oauth:grant-type:device_code',
	enablePKCE: false,
	codeChallengeMethod: 'S256',
	customParams: {},
	enableOIDC: true,
	nonce: generateRandomString(32),
	state: generateRandomString(32),
	customClaims: {},
	audience: '',
	maxAge: 0,
	prompt: '',
	loginHint: '',
	acrValues: [],
	clientAuthMethod: 'client_secret_post',
	showSuccessModal: true,
	showAuthCodeInModal: true,
	showCredentialsModal: true,
	enableErrorRecovery: true,
	showAuthRequestModal: false,
});

// Default configuration for Refresh Token Flow
export const getRefreshTokenConfig = (): FlowConfig => ({
	scopes: ['openid', 'profile', 'email'],
	responseType: '',
	grantType: 'refresh_token',
	enablePKCE: false,
	codeChallengeMethod: 'S256',
	customParams: {},
	enableOIDC: true,
	nonce: '',
	state: '',
	customClaims: {},
	audience: '',
	maxAge: 0,
	prompt: '',
	loginHint: '',
	acrValues: [],
	clientAuthMethod: 'client_secret_post',
	showSuccessModal: true,
	showAuthCodeInModal: true,
	showCredentialsModal: true,
	enableErrorRecovery: true,
	showAuthRequestModal: false,
});

// Default configuration for Password Grant Flow
export const getPasswordGrantConfig = (): FlowConfig => ({
	scopes: ['openid', 'profile', 'email'],
	responseType: '',
	grantType: 'password',
	enablePKCE: false,
	codeChallengeMethod: 'S256',
	customParams: {},
	enableOIDC: true,
	nonce: generateRandomString(32),
	state: generateRandomString(32),
	customClaims: {},
	audience: '',
	maxAge: 0,
	prompt: '',
	loginHint: '',
	acrValues: [],
	clientAuthMethod: 'client_secret_post',
	showSuccessModal: true,
	showAuthCodeInModal: true,
	showCredentialsModal: true,
	enableErrorRecovery: true,
	showAuthRequestModal: false,
});

// Factory function to get default config based on flow type
export const getDefaultConfig = (flowType: string): FlowConfig => {
	switch (flowType) {
		case 'authorization-code':
			return getAuthorizationCodeConfig();
		case 'pkce':
			return getPKCEConfig();
		case 'implicit':
			return getImplicitConfig();
		case 'client-credentials':
			return getClientCredentialsConfig();
		case 'device-code':
			return getDeviceCodeConfig();
		case 'refresh-token':
			return getRefreshTokenConfig();
		case 'password-grant':
			return getPasswordGrantConfig();
		default:
			return getAuthorizationCodeConfig();
	}
};

// PingOne-specific configuration presets
export const getPingOnePresets = () => ({
	// Standard OIDC scopes supported by PingOne
	standardScopes: ['openid', 'profile', 'email', 'address', 'phone', 'offline_access'],

	// PingOne-specific ACR values for different levels of assurance
	acrValues: [
		'urn:pingone:loa:1', // Level 1 - Basic authentication
		'urn:pingone:loa:2', // Level 2 - Multi-factor authentication
		'urn:pingone:loa:3', // Level 3 - Hardware token authentication
	],

	// PingOne-supported prompt values
	promptValues: ['', 'login', 'consent', 'select_account'],

	// PingOne-supported response types
	responseTypes: [
		'code', // Authorization Code
		'token', // Implicit
		'id_token', // OIDC ID Token
		'code token', // Hybrid
		'code id_token', // Hybrid
	],

	// PingOne-supported grant types
	grantTypes: [
		'authorization_code',
		'implicit',
		'client_credentials',
		'password',
		'refresh_token',
		'urn:ietf:params:oauth:grant-type:device_code',
	],
});

// Validate configuration for PingOne compatibility
export const validatePingOneConfig = (
	config: FlowConfig
): { isValid: boolean; errors: string[] } => {
	const errors: string[] = [];

	// Check required scopes for OIDC
	if (config.enableOIDC && !config.scopes.includes('openid')) {
		errors.push('OpenID Connect requires the "openid" scope');
	}

	// Check PKCE requirements for public clients
	if (config.responseType === 'code' && !config.enablePKCE) {
		errors.push('PKCE is recommended for public clients using Authorization Code flow');
	}

	// Check nonce requirement for OIDC implicit flow
	if (config.enableOIDC && config.responseType === 'id_token' && !config.nonce) {
		errors.push('Nonce is required for OIDC implicit flow with id_token response type');
	}

	// Check state requirement for security
	if (config.responseType === 'code' && !config.state) {
		errors.push('State parameter is recommended for CSRF protection');
	}

	return {
		isValid: errors.length === 0,
		errors,
	};
};
