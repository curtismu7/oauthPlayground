// Define types for window object properties injected by Vite
interface WindowWithPingOne extends Window {
	__PINGONE_ENVIRONMENT_ID__?: string;
	__PINGONE_CLIENT_ID__?: string;
	__PINGONE_CLIENT_SECRET__?: string;
	__PINGONE_REDIRECT_URI__?: string;
	__PINGONE_LOGOUT_REDIRECT_URI__?: string;
	__PINGONE_API_URL__?: string;
	__PINGONE_APP_TITLE__?: string;
	__PINGONE_APP_DESCRIPTION__?: string;
	__PINGONE_APP_VERSION__?: string;
	__PINGONE_APP_DEFAULT_THEME__?: string;
	__PINGONE_DEV_SERVER_PORT__?: string;
	__PINGONE_DEV_SERVER_HTTPS__?: string;
	__PINGONE_FEATURE_DEBUG_MODE__?: string;
	__PINGONE_FEATURE_ANALYTICS__?: string;
}

export interface PingOneConfig {
	environmentId: string;
	clientId: string;
	clientSecret: string;
	redirectUri: string;
	logoutRedirectUri: string;
	apiUrl: string;
	authServerId: string;
	baseUrl: string;
	authUrl: string;
	authorizationEndpoint: string;
	tokenEndpoint: string;
	userInfoEndpoint: string;
	logoutEndpoint: string;
	// Token endpoint client authentication method
	tokenAuthMethod?:
		| 'client_secret_basic'
		| 'client_secret_post'
		| 'client_secret_jwt'
		| 'private_key_jwt';
	// Options for client assertions (JWT) when using client_secret_jwt or private_key_jwt
	clientAssertion?: {
		hmacAlg?: 'HS256' | 'HS384' | 'HS512';
		signAlg?: 'RS256' | 'ES256' | 'PS256' | 'RS384' | 'ES384' | 'RS512' | 'ES512';
		privateKeyPEM?: string;
		kid?: string;
		x5t?: string;
		audience?: string; // defaults to token endpoint
	};
	// Advanced configuration toggles
	advanced?: {
		// Request Object signing policy for authorization requests (PAR/JAR)
		requestObjectPolicy?: 'default' | 'require' | 'allow_unsigned';
		// OIDC Session Management / OP iframe monitoring
		oidcSessionManagement?: boolean;
		// Multi-resource scopes (comma or space separated string for UI convenience)
		resourceScopes?: string;
		// RP-initiated logout behavior: terminate session by ID token hint
		terminateByIdToken?: boolean;
	};
}

// App configuration from environment variables
const typedWindow = window as WindowWithPingOne;

export const appConfig = {
	title: typedWindow.__PINGONE_APP_TITLE__ || 'PingOne OAuth/OIDC Playground',
	description:
		typedWindow.__PINGONE_APP_DESCRIPTION__ ||
		'Interactive playground for OAuth 2.0 and OpenID Connect with PingOne',
	version: typedWindow.__PINGONE_APP_VERSION__ || '5.8.1',
	defaultTheme: typedWindow.__PINGONE_APP_DEFAULT_THEME__ || 'light',
	devServer: {
		port: parseInt(typedWindow.__PINGONE_DEV_SERVER_PORT__ || '3000'),
		https: typedWindow.__PINGONE_DEV_SERVER_HTTPS__ === 'true',
	},
	features: {
		debugMode: typedWindow.__PINGONE_FEATURE_DEBUG_MODE__ === 'true',
		analytics: typedWindow.__PINGONE_FEATURE_ANALYTICS__ === 'true',
	},
};

// Default PingOne configuration
export const pingOneConfig: PingOneConfig = {
	environmentId: typedWindow.__PINGONE_ENVIRONMENT_ID__ || '',
	clientId: typedWindow.__PINGONE_CLIENT_ID__ || '',
	clientSecret: typedWindow.__PINGONE_CLIENT_SECRET__ || '',
	redirectUri: typedWindow.__PINGONE_REDIRECT_URI__ || `${window.location.origin}/callback`,
	logoutRedirectUri: typedWindow.__PINGONE_LOGOUT_REDIRECT_URI__ || window.location.origin,
	apiUrl: typedWindow.__PINGONE_API_URL__ || 'https://auth.pingone.com',
	authServerId: '', // Removed from .env as requested
	baseUrl: '',
	authUrl: '',
	authorizationEndpoint: '',
	tokenEndpoint: '',
	userInfoEndpoint: '',
	logoutEndpoint: '',
	tokenAuthMethod: 'client_secret_basic',
	clientAssertion: {
		hmacAlg: 'HS256',
		signAlg: 'RS256',
	},
	advanced: {
		requestObjectPolicy: 'default',
		oidcSessionManagement: false,
		resourceScopes: 'openid profile email',
		terminateByIdToken: true,
	},
};

// OAuth 2.0 PKCE Configuration
export const PKCE_CONFIG = {
	codeChallengeMethod: 'S256',
	codeVerifierLength: 64,
};

// Default OAuth scopes
export const DEFAULT_SCOPES = 'openid profile email';

// OAuth flow types
export enum OAuthFlowType {
	AUTHORIZATION_CODE = 'authorization_code',
	IMPLICIT = 'implicit',
	CLIENT_CREDENTIALS = 'client_credentials',
	DEVICE_CODE = 'device_code',
	REFRESH_TOKEN = 'refresh_token',
}

// OAuth response types
export enum OAuthResponseType {
	CODE = 'code',
	TOKEN = 'token',
	ID_TOKEN = 'id_token',
}

// Security constants
export const SECURITY_CONFIG = {
	STATE_LENGTH: 32,
	NONCE_LENGTH: 32,
	MAX_TOKEN_AGE: 3600, // 1 hour
	MAX_STATE_AGE: 600, // 10 minutes
};

// API endpoints
export const API_ENDPOINTS = {
	AUTHORIZE: '/as/authorize',
	TOKEN: '/as/token',
	USERINFO: '/as/userinfo',
	REVOKE: '/as/revoke',
	INTROSPECT: '/as/introspect',
	LOGOUT: '/as/signoff',
	PAR: '/as/par', // Pushed Authorization Requests endpoint
	DEVICE_AUTHORIZATION: '/as/device_authorization',
};

// Error messages
export const OAUTH_ERRORS = {
	INVALID_REQUEST: 'invalid_request',
	UNAUTHORIZED_CLIENT: 'unauthorized_client',
	ACCESS_DENIED: 'access_denied',
	UNSUPPORTED_RESPONSE_TYPE: 'unsupported_response_type',
	INVALID_SCOPE: 'invalid_scope',
	SERVER_ERROR: 'server_error',
	TEMPORARILY_UNAVAILABLE: 'temporarily_unavailable',
	INVALID_CLIENT: 'invalid_client',
	INVALID_GRANT: 'invalid_grant',
	UNSUPPORTED_GRANT_TYPE: 'unsupported_grant_type',
	INVALID_TOKEN: 'invalid_token',
};
