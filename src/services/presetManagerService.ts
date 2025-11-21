// src/services/presetManagerService.ts
// Configuration preset management service for the Application Generator

export type BuilderAppType =
	| 'OIDC_WEB_APP'
	| 'OIDC_NATIVE_APP'
	| 'SINGLE_PAGE_APP'
	| 'WORKER'
	| 'SERVICE'
	| 'SAML_APP';
export type TokenEndpointMethod =
	| 'client_secret_basic'
	| 'client_secret_post'
	| 'client_secret_jwt'
	| 'private_key_jwt'
	| 'none';
export type PkceOption = 'OPTIONAL' | 'REQUIRED';

export interface FormDataState {
	// Basic Settings
	name: string;
	description: string;
	enabled: boolean;
	redirectUris: string[];
	postLogoutRedirectUris: string[];
	grantTypes: string[];
	responseTypes: string[];
	tokenEndpointAuthMethod: TokenEndpointMethod;
	pkceEnforcement: PkceOption;
	scopes: string[];
	accessTokenValiditySeconds: number;
	refreshTokenValiditySeconds: number;
	idTokenValiditySeconds: number;

	// Advanced Settings
	refreshTokenDuration: number; // in days
	refreshTokenRollingDuration: number; // in days
	refreshTokenRollingGracePeriod: number; // in seconds
	allowRedirectUriPatterns: boolean;
	jwksUrl: string;
	pushedAuthorizationRequestStatus: 'OPTIONAL' | 'REQUIRED';
	parReferenceTimeout: number; // in seconds
	initiateLoginUri: string;
	targetLinkUri: string;
	signoffUrls: string[];
}

export interface ConfigurationPreset {
	id: string;
	name: string;
	description: string;
	category: 'built-in' | 'custom';
	appType: BuilderAppType;
	configuration: Partial<FormDataState>;
	metadata: {
		createdAt: string;
		updatedAt: string;
		useCase: string;
		securityLevel: 'basic' | 'enhanced' | 'enterprise';
		tags: string[];
	};
}

export interface PresetManagerService {
	getBuiltInPresets(): ConfigurationPreset[];
	getCustomPresets(): ConfigurationPreset[];
	getAllPresets(): ConfigurationPreset[];
	getPresetsByAppType(appType: BuilderAppType): ConfigurationPreset[];
	saveCustomPreset(preset: Omit<ConfigurationPreset, 'id' | 'metadata'>): ConfigurationPreset;
	deleteCustomPreset(id: string): boolean;
	updateCustomPreset(id: string, updates: Partial<ConfigurationPreset>): ConfigurationPreset | null;
	applyPreset(presetId: string): FormDataState | null;
	getPresetById(id: string): ConfigurationPreset | null;
}

// Built-in preset definitions for common use cases
const BUILT_IN_PRESETS: ConfigurationPreset[] = [
	// Worker Applications
	{
		id: 'worker-app-basic',
		name: 'Basic Worker Application',
		description: 'Standard worker application for background processing and API access',
		category: 'built-in',
		appType: 'WORKER',
		configuration: {
			enabled: true,
			redirectUris: [],
			postLogoutRedirectUris: [],
			grantTypes: ['client_credentials'],
			responseTypes: [],
			tokenEndpointAuthMethod: 'client_secret_basic',
			pkceEnforcement: 'OPTIONAL',
			scopes: ['p1:read:user', 'p1:update:user'],
			accessTokenValiditySeconds: 3600, // 1 hour
			refreshTokenValiditySeconds: 0, // No refresh tokens for client credentials
			idTokenValiditySeconds: 0, // No ID tokens for worker apps
			refreshTokenDuration: 0,
			refreshTokenRollingDuration: 0,
			refreshTokenRollingGracePeriod: 0,
			allowRedirectUriPatterns: false,
			pushedAuthorizationRequestStatus: 'OPTIONAL',
			parReferenceTimeout: 60,
			signoffUrls: [],
		},
		metadata: {
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			useCase: 'Background workers and automated processes',
			securityLevel: 'enhanced',
			tags: ['worker', 'automation', 'api-access', 'client-credentials'],
		},
	},

	{
		id: 'worker-app-admin',
		name: 'Administrative Worker Application',
		description: 'Worker application with full administrative privileges for management operations',
		category: 'built-in',
		appType: 'WORKER',
		configuration: {
			enabled: true,
			redirectUris: [],
			postLogoutRedirectUris: [],
			grantTypes: ['client_credentials'],
			responseTypes: [],
			tokenEndpointAuthMethod: 'client_secret_jwt',
			pkceEnforcement: 'OPTIONAL',
			scopes: [
				'p1:read:user',
				'p1:update:user',
				'p1:create:user',
				'p1:delete:user',
				'p1:create:application',
				'p1:update:application',
				'p1:read:application',
			],
			accessTokenValiditySeconds: 7200, // 2 hours
			refreshTokenValiditySeconds: 0,
			idTokenValiditySeconds: 0,
			refreshTokenDuration: 0,
			refreshTokenRollingDuration: 0,
			refreshTokenRollingGracePeriod: 0,
			allowRedirectUriPatterns: false,
			pushedAuthorizationRequestStatus: 'OPTIONAL',
			parReferenceTimeout: 60,
			signoffUrls: [],
		},
		metadata: {
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			useCase: 'Administrative operations and user management',
			securityLevel: 'enterprise',
			tags: ['worker', 'admin', 'management-api', 'high-privilege'],
		},
	},

	// OIDC Web Applications
	{
		id: 'oidc-web-enterprise',
		name: 'Enterprise OIDC Web Application',
		description:
			'High-security OIDC web application for enterprise environments with strict compliance',
		category: 'built-in',
		appType: 'OIDC_WEB_APP',
		configuration: {
			enabled: true,
			redirectUris: ['https://app.company.com/callback', 'https://app.company.com/auth/callback'],
			postLogoutRedirectUris: ['https://app.company.com/logout', 'https://app.company.com'],
			grantTypes: ['authorization_code', 'refresh_token'],
			responseTypes: ['code'],
			tokenEndpointAuthMethod: 'client_secret_basic',
			pkceEnforcement: 'REQUIRED',
			scopes: ['openid', 'profile', 'email', 'address', 'phone'],
			accessTokenValiditySeconds: 3600, // 1 hour
			refreshTokenValiditySeconds: 604800, // 7 days
			idTokenValiditySeconds: 3600, // 1 hour
			refreshTokenDuration: 7, // 7 days
			refreshTokenRollingDuration: 30, // 30 days
			refreshTokenRollingGracePeriod: 300, // 5 minutes
			allowRedirectUriPatterns: false,
			pushedAuthorizationRequestStatus: 'REQUIRED',
			parReferenceTimeout: 60,
			signoffUrls: [],
		},
		metadata: {
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			useCase: 'Enterprise web applications requiring high security and compliance',
			securityLevel: 'enterprise',
			tags: ['oidc', 'web', 'enterprise', 'high-security', 'pkce-required'],
		},
	},

	{
		id: 'oidc-web-development',
		name: 'Development OIDC Web Application',
		description: 'Developer-friendly OIDC web application for local development and testing',
		category: 'built-in',
		appType: 'OIDC_WEB_APP',
		configuration: {
			enabled: true,
			redirectUris: [
				'http://localhost:3000/callback',
				'https://localhost:3000/callback',
				'http://localhost:8080/callback',
			],
			postLogoutRedirectUris: [
				'http://localhost:3000',
				'https://localhost:3000',
				'http://localhost:8080',
			],
			grantTypes: ['authorization_code', 'refresh_token'],
			responseTypes: ['code'],
			tokenEndpointAuthMethod: 'client_secret_post',
			pkceEnforcement: 'OPTIONAL',
			scopes: ['openid', 'profile', 'email'],
			accessTokenValiditySeconds: 7200, // 2 hours
			refreshTokenValiditySeconds: 2592000, // 30 days
			idTokenValiditySeconds: 7200, // 2 hours
			refreshTokenDuration: 30, // 30 days
			refreshTokenRollingDuration: 90, // 90 days
			refreshTokenRollingGracePeriod: 0,
			allowRedirectUriPatterns: true,
			pushedAuthorizationRequestStatus: 'OPTIONAL',
			parReferenceTimeout: 60,
			signoffUrls: [],
		},
		metadata: {
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			useCase: 'Local development and testing environments',
			securityLevel: 'basic',
			tags: ['oidc', 'web', 'development', 'localhost', 'testing'],
		},
	},

	// Single Page Applications
	{
		id: 'spa-react',
		name: 'React Single Page Application',
		description: 'React SPA with PKCE enforcement and browser-optimized security settings',
		category: 'built-in',
		appType: 'SINGLE_PAGE_APP',
		configuration: {
			enabled: true,
			redirectUris: ['http://localhost:3000/callback', 'https://app.company.com/callback'],
			postLogoutRedirectUris: ['http://localhost:3000', 'https://app.company.com'],
			grantTypes: ['authorization_code', 'refresh_token'],
			responseTypes: ['code'],
			tokenEndpointAuthMethod: 'none',
			pkceEnforcement: 'REQUIRED',
			scopes: ['openid', 'profile', 'email'],
			accessTokenValiditySeconds: 3600, // 1 hour
			refreshTokenValiditySeconds: 86400, // 1 day (shorter for SPA)
			idTokenValiditySeconds: 3600, // 1 hour
			refreshTokenDuration: 1, // 1 day
			refreshTokenRollingDuration: 7, // 7 days
			refreshTokenRollingGracePeriod: 0,
			allowRedirectUriPatterns: true,
			pushedAuthorizationRequestStatus: 'OPTIONAL',
			parReferenceTimeout: 60,
			signoffUrls: [],
		},
		metadata: {
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			useCase: 'React-based single page applications',
			securityLevel: 'enhanced',
			tags: ['spa', 'react', 'browser', 'pkce-required'],
		},
	},

	{
		id: 'spa-angular',
		name: 'Angular Single Page Application',
		description: 'Angular SPA with PKCE enforcement and TypeScript-optimized settings',
		category: 'built-in',
		appType: 'SINGLE_PAGE_APP',
		configuration: {
			enabled: true,
			redirectUris: ['http://localhost:4200/callback', 'https://app.company.com/callback'],
			postLogoutRedirectUris: ['http://localhost:4200', 'https://app.company.com'],
			grantTypes: ['authorization_code', 'refresh_token'],
			responseTypes: ['code'],
			tokenEndpointAuthMethod: 'none',
			pkceEnforcement: 'REQUIRED',
			scopes: ['openid', 'profile', 'email'],
			accessTokenValiditySeconds: 3600,
			refreshTokenValiditySeconds: 86400,
			idTokenValiditySeconds: 3600,
			refreshTokenDuration: 1,
			refreshTokenRollingDuration: 7,
			refreshTokenRollingGracePeriod: 0,
			allowRedirectUriPatterns: true,
			pushedAuthorizationRequestStatus: 'OPTIONAL',
			parReferenceTimeout: 60,
			signoffUrls: [],
		},
		metadata: {
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			useCase: 'Angular-based single page applications',
			securityLevel: 'enhanced',
			tags: ['spa', 'angular', 'typescript', 'pkce-required'],
		},
	},

	{
		id: 'spa-vue',
		name: 'Vue.js Single Page Application',
		description: 'Vue.js SPA with PKCE enforcement and modern JavaScript settings',
		category: 'built-in',
		appType: 'SINGLE_PAGE_APP',
		configuration: {
			enabled: true,
			redirectUris: ['http://localhost:8080/callback', 'https://app.company.com/callback'],
			postLogoutRedirectUris: ['http://localhost:8080', 'https://app.company.com'],
			grantTypes: ['authorization_code', 'refresh_token'],
			responseTypes: ['code'],
			tokenEndpointAuthMethod: 'none',
			pkceEnforcement: 'REQUIRED',
			scopes: ['openid', 'profile', 'email'],
			accessTokenValiditySeconds: 3600,
			refreshTokenValiditySeconds: 86400,
			idTokenValiditySeconds: 3600,
			refreshTokenDuration: 1,
			refreshTokenRollingDuration: 7,
			refreshTokenRollingGracePeriod: 0,
			allowRedirectUriPatterns: true,
			pushedAuthorizationRequestStatus: 'OPTIONAL',
			parReferenceTimeout: 60,
			signoffUrls: [],
		},
		metadata: {
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			useCase: 'Vue.js-based single page applications',
			securityLevel: 'enhanced',
			tags: ['spa', 'vue', 'javascript', 'pkce-required'],
		},
	},

	// Device Authorization Applications
	{
		id: 'device-auth-tv',
		name: 'Device Authorization (Smart TV)',
		description: 'Device authorization flow optimized for smart TVs and streaming devices',
		category: 'built-in',
		appType: 'OIDC_NATIVE_APP',
		configuration: {
			enabled: true,
			redirectUris: [], // Device flow doesn't use redirect URIs
			postLogoutRedirectUris: [],
			grantTypes: ['urn:ietf:params:oauth:grant-type:device_code', 'refresh_token'],
			responseTypes: [],
			tokenEndpointAuthMethod: 'none',
			pkceEnforcement: 'OPTIONAL', // Not typically used with device flow
			scopes: ['openid', 'profile'],
			accessTokenValiditySeconds: 3600,
			refreshTokenValiditySeconds: 2592000, // 30 days
			idTokenValiditySeconds: 3600,
			refreshTokenDuration: 30,
			refreshTokenRollingDuration: 180,
			refreshTokenRollingGracePeriod: 0,
			allowRedirectUriPatterns: false,
			pushedAuthorizationRequestStatus: 'OPTIONAL',
			parReferenceTimeout: 60,
			signoffUrls: [],
		},
		metadata: {
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			useCase: 'Smart TVs, streaming devices, and input-constrained devices',
			securityLevel: 'enhanced',
			tags: ['device-flow', 'tv', 'streaming', 'input-constrained'],
		},
	},

	{
		id: 'device-auth-iot',
		name: 'Device Authorization (IoT)',
		description: 'Device authorization flow for IoT devices and embedded systems',
		category: 'built-in',
		appType: 'OIDC_NATIVE_APP',
		configuration: {
			enabled: true,
			redirectUris: [],
			postLogoutRedirectUris: [],
			grantTypes: ['urn:ietf:params:oauth:grant-type:device_code'],
			responseTypes: [],
			tokenEndpointAuthMethod: 'none',
			pkceEnforcement: 'OPTIONAL',
			scopes: ['openid', 'device:read', 'device:write'],
			accessTokenValiditySeconds: 7200, // 2 hours
			refreshTokenValiditySeconds: 604800, // 7 days
			idTokenValiditySeconds: 3600,
			refreshTokenDuration: 7,
			refreshTokenRollingDuration: 30,
			refreshTokenRollingGracePeriod: 0,
			allowRedirectUriPatterns: false,
			pushedAuthorizationRequestStatus: 'OPTIONAL',
			parReferenceTimeout: 60,
			signoffUrls: [],
		},
		metadata: {
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			useCase: 'IoT devices and embedded systems with limited input capabilities',
			securityLevel: 'enhanced',
			tags: ['device-flow', 'iot', 'embedded', 'headless'],
		},
	},

	// Mobile Native Applications
	{
		id: 'mobile-ios',
		name: 'iOS Mobile Application',
		description: 'Native iOS application with PKCE enforcement and mobile-optimized settings',
		category: 'built-in',
		appType: 'OIDC_NATIVE_APP',
		configuration: {
			enabled: true,
			redirectUris: ['com.company.app://callback', 'com.company.app://auth'],
			postLogoutRedirectUris: ['com.company.app://logout'],
			grantTypes: ['authorization_code', 'refresh_token'],
			responseTypes: ['code'],
			tokenEndpointAuthMethod: 'none',
			pkceEnforcement: 'REQUIRED',
			scopes: ['openid', 'profile', 'email'],
			accessTokenValiditySeconds: 3600,
			refreshTokenValiditySeconds: 2592000, // 30 days
			idTokenValiditySeconds: 3600,
			refreshTokenDuration: 30,
			refreshTokenRollingDuration: 180,
			refreshTokenRollingGracePeriod: 0,
			allowRedirectUriPatterns: false,
			pushedAuthorizationRequestStatus: 'OPTIONAL',
			parReferenceTimeout: 60,
			signoffUrls: [],
		},
		metadata: {
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			useCase: 'Native iOS mobile applications',
			securityLevel: 'enhanced',
			tags: ['mobile', 'ios', 'native', 'pkce-required'],
		},
	},

	{
		id: 'mobile-android',
		name: 'Android Mobile Application',
		description: 'Native Android application with PKCE enforcement and mobile-optimized settings',
		category: 'built-in',
		appType: 'OIDC_NATIVE_APP',
		configuration: {
			enabled: true,
			redirectUris: ['com.company.app://callback', 'com.company.app://auth'],
			postLogoutRedirectUris: ['com.company.app://logout'],
			grantTypes: ['authorization_code', 'refresh_token'],
			responseTypes: ['code'],
			tokenEndpointAuthMethod: 'none',
			pkceEnforcement: 'REQUIRED',
			scopes: ['openid', 'profile', 'email'],
			accessTokenValiditySeconds: 3600,
			refreshTokenValiditySeconds: 2592000,
			idTokenValiditySeconds: 3600,
			refreshTokenDuration: 30,
			refreshTokenRollingDuration: 180,
			refreshTokenRollingGracePeriod: 0,
			allowRedirectUriPatterns: false,
			pushedAuthorizationRequestStatus: 'OPTIONAL',
			parReferenceTimeout: 60,
			signoffUrls: [],
		},
		metadata: {
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			useCase: 'Native Android mobile applications',
			securityLevel: 'enhanced',
			tags: ['mobile', 'android', 'native', 'pkce-required'],
		},
	},

	// Service Applications
	{
		id: 'microservice-api',
		name: 'Microservice API',
		description: 'Service-to-service authentication for microservices with minimal scopes',
		category: 'built-in',
		appType: 'SERVICE',
		configuration: {
			enabled: true,
			redirectUris: [],
			postLogoutRedirectUris: [],
			grantTypes: ['client_credentials'],
			responseTypes: [],
			tokenEndpointAuthMethod: 'client_secret_jwt',
			pkceEnforcement: 'OPTIONAL',
			scopes: ['api:read', 'api:write'],
			accessTokenValiditySeconds: 3600,
			refreshTokenValiditySeconds: 0, // No refresh tokens for client credentials
			idTokenValiditySeconds: 0, // No ID tokens for service apps
			refreshTokenDuration: 0,
			refreshTokenRollingDuration: 0,
			refreshTokenRollingGracePeriod: 0,
			allowRedirectUriPatterns: false,
			pushedAuthorizationRequestStatus: 'OPTIONAL',
			parReferenceTimeout: 60,
			signoffUrls: [],
		},
		metadata: {
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			useCase: 'Microservice-to-microservice authentication',
			securityLevel: 'enhanced',
			tags: ['microservice', 'api', 'service-to-service', 'client-credentials'],
		},
	},

	// OAuth Authorization Code Flow Presets
	{
		id: 'oauth-authz-code-basic',
		name: 'OAuth Authorization Code Flow',
		description:
			'Standard OAuth 2.0 Authorization Code flow for web applications with delegated authorization',
		category: 'built-in',
		appType: 'OIDC_WEB_APP',
		configuration: {
			enabled: true,
			redirectUris: ['http://localhost:3000/callback', 'https://app.company.com/callback'],
			postLogoutRedirectUris: ['http://localhost:3000', 'https://app.company.com'],
			grantTypes: ['authorization_code', 'refresh_token'],
			responseTypes: ['code'],
			tokenEndpointAuthMethod: 'client_secret_basic',
			pkceEnforcement: 'OPTIONAL',
			scopes: ['read', 'write'],
			accessTokenValiditySeconds: 3600, // 1 hour
			refreshTokenValiditySeconds: 2592000, // 30 days
			idTokenValiditySeconds: 0, // No ID tokens for OAuth-only
			refreshTokenDuration: 30,
			refreshTokenRollingDuration: 180,
			refreshTokenRollingGracePeriod: 0,
			allowRedirectUriPatterns: false,
			pushedAuthorizationRequestStatus: 'OPTIONAL',
			parReferenceTimeout: 60,
			signoffUrls: [],
		},
		metadata: {
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			useCase: 'OAuth 2.0 delegated authorization for web applications',
			securityLevel: 'enhanced',
			tags: ['oauth', 'authorization-code', 'web-app', 'delegated-auth'],
		},
	},

	{
		id: 'oidc-authz-code-basic',
		name: 'OIDC Authorization Code Flow',
		description:
			'OpenID Connect Authorization Code flow for web applications with authentication and authorization',
		category: 'built-in',
		appType: 'OIDC_WEB_APP',
		configuration: {
			enabled: true,
			redirectUris: ['http://localhost:3000/callback', 'https://app.company.com/callback'],
			postLogoutRedirectUris: ['http://localhost:3000', 'https://app.company.com'],
			grantTypes: ['authorization_code', 'refresh_token'],
			responseTypes: ['code'],
			tokenEndpointAuthMethod: 'client_secret_basic',
			pkceEnforcement: 'OPTIONAL',
			scopes: ['openid', 'profile', 'email'],
			accessTokenValiditySeconds: 3600, // 1 hour
			refreshTokenValiditySeconds: 2592000, // 30 days
			idTokenValiditySeconds: 3600, // 1 hour
			refreshTokenDuration: 30,
			refreshTokenRollingDuration: 180,
			refreshTokenRollingGracePeriod: 0,
			allowRedirectUriPatterns: false,
			pushedAuthorizationRequestStatus: 'OPTIONAL',
			parReferenceTimeout: 60,
			signoffUrls: [],
		},
		metadata: {
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			useCase: 'OIDC authentication and authorization for web applications',
			securityLevel: 'enhanced',
			tags: ['oidc', 'authorization-code', 'web-app', 'authentication'],
		},
	},

	{
		id: 'worker-token-basic',
		name: 'Worker Token Application',
		description:
			'Worker application optimized for token-based API access and background processing',
		category: 'built-in',
		appType: 'WORKER',
		configuration: {
			enabled: true,
			redirectUris: [],
			postLogoutRedirectUris: [],
			grantTypes: ['client_credentials'],
			responseTypes: [],
			tokenEndpointAuthMethod: 'client_secret_basic',
			pkceEnforcement: 'OPTIONAL',
			scopes: ['p1:read:user', 'p1:update:user', 'p1:read:application'],
			accessTokenValiditySeconds: 3600, // 1 hour
			refreshTokenValiditySeconds: 0, // No refresh tokens for client credentials
			idTokenValiditySeconds: 0, // No ID tokens for worker apps
			refreshTokenDuration: 0,
			refreshTokenRollingDuration: 0,
			refreshTokenRollingGracePeriod: 0,
			allowRedirectUriPatterns: false,
			pushedAuthorizationRequestStatus: 'OPTIONAL',
			parReferenceTimeout: 60,
			signoffUrls: [],
		},
		metadata: {
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			useCase: 'Worker applications for API access and automation',
			securityLevel: 'enhanced',
			tags: ['worker', 'token', 'api-access', 'automation'],
		},
	},

	// OAuth Implicit Flow Presets
	{
		id: 'oauth-implicit-spa',
		name: 'OAuth Implicit Flow (SPA)',
		description: 'OAuth 2.0 Implicit flow for single-page applications with direct token access',
		category: 'built-in',
		appType: 'SINGLE_PAGE_APP',
		configuration: {
			enabled: true,
			redirectUris: ['http://localhost:3000', 'https://app.company.com'],
			postLogoutRedirectUris: ['http://localhost:3000', 'https://app.company.com'],
			grantTypes: ['implicit'],
			responseTypes: ['token'],
			tokenEndpointAuthMethod: 'none',
			pkceEnforcement: 'OPTIONAL',
			scopes: ['read', 'write'],
			accessTokenValiditySeconds: 3600, // 1 hour
			refreshTokenValiditySeconds: 0, // No refresh tokens in implicit flow
			idTokenValiditySeconds: 0, // No ID tokens for OAuth-only
			refreshTokenDuration: 0,
			refreshTokenRollingDuration: 0,
			refreshTokenRollingGracePeriod: 0,
			allowRedirectUriPatterns: false,
			pushedAuthorizationRequestStatus: 'OPTIONAL',
			parReferenceTimeout: 60,
			signoffUrls: [],
		},
		metadata: {
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			useCase: 'Single-page applications with OAuth implicit flow',
			securityLevel: 'basic',
			tags: ['oauth', 'implicit', 'spa', 'browser-based'],
		},
	},

	{
		id: 'oidc-implicit-spa',
		name: 'OIDC Implicit Flow (SPA)',
		description: 'OpenID Connect Implicit flow for single-page applications with ID tokens',
		category: 'built-in',
		appType: 'SINGLE_PAGE_APP',
		configuration: {
			enabled: true,
			redirectUris: ['http://localhost:3000', 'https://app.company.com'],
			postLogoutRedirectUris: ['http://localhost:3000', 'https://app.company.com'],
			grantTypes: ['implicit'],
			responseTypes: ['id_token', 'token'],
			tokenEndpointAuthMethod: 'none',
			pkceEnforcement: 'OPTIONAL',
			scopes: ['openid', 'profile', 'email'],
			accessTokenValiditySeconds: 3600, // 1 hour
			refreshTokenValiditySeconds: 0, // No refresh tokens in implicit flow
			idTokenValiditySeconds: 3600, // 1 hour
			refreshTokenDuration: 0,
			refreshTokenRollingDuration: 0,
			refreshTokenRollingGracePeriod: 0,
			allowRedirectUriPatterns: false,
			pushedAuthorizationRequestStatus: 'OPTIONAL',
			parReferenceTimeout: 60,
			signoffUrls: [],
		},
		metadata: {
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			useCase: 'Single-page applications with OIDC authentication',
			securityLevel: 'basic',
			tags: ['oidc', 'implicit', 'spa', 'authentication'],
		},
	},

	// SAML Application Presets
	{
		id: 'saml-web-enterprise',
		name: 'SAML Web Application (Enterprise)',
		description: 'Enterprise SAML web application for SSO integration with identity providers',
		category: 'built-in',
		appType: 'SAML_APP',
		configuration: {
			enabled: true,
			redirectUris: ['https://app.company.com/saml/acs'],
			postLogoutRedirectUris: ['https://app.company.com/saml/sls'],
			grantTypes: ['authorization_code'],
			responseTypes: ['code'],
			tokenEndpointAuthMethod: 'client_secret_basic',
			pkceEnforcement: 'OPTIONAL',
			scopes: ['openid', 'profile', 'email', 'groups'],
			accessTokenValiditySeconds: 3600, // 1 hour
			refreshTokenValiditySeconds: 2592000, // 30 days
			idTokenValiditySeconds: 3600, // 1 hour
			refreshTokenDuration: 30,
			refreshTokenRollingDuration: 180,
			refreshTokenRollingGracePeriod: 0,
			allowRedirectUriPatterns: false,
			pushedAuthorizationRequestStatus: 'OPTIONAL',
			parReferenceTimeout: 60,
			signoffUrls: ['https://app.company.com/saml/sls'],
		},
		metadata: {
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			useCase: 'Enterprise web applications with SAML SSO integration',
			securityLevel: 'enterprise',
			tags: ['saml', 'sso', 'enterprise', 'identity-provider'],
		},
	},

	{
		id: 'saml-service-provider',
		name: 'SAML Service Provider',
		description: 'SAML service provider configuration for federated authentication',
		category: 'built-in',
		appType: 'SAML_APP',
		configuration: {
			enabled: true,
			redirectUris: ['https://sp.company.com/saml/acs', 'https://sp.company.com/auth/callback'],
			postLogoutRedirectUris: ['https://sp.company.com/logout', 'https://sp.company.com'],
			grantTypes: ['authorization_code', 'refresh_token'],
			responseTypes: ['code'],
			tokenEndpointAuthMethod: 'client_secret_post',
			pkceEnforcement: 'OPTIONAL',
			scopes: ['openid', 'profile', 'email', 'saml:assertion'],
			accessTokenValiditySeconds: 7200, // 2 hours
			refreshTokenValiditySeconds: 2592000, // 30 days
			idTokenValiditySeconds: 7200, // 2 hours
			refreshTokenDuration: 30,
			refreshTokenRollingDuration: 180,
			refreshTokenRollingGracePeriod: 0,
			allowRedirectUriPatterns: true,
			pushedAuthorizationRequestStatus: 'OPTIONAL',
			parReferenceTimeout: 60,
			signoffUrls: ['https://sp.company.com/saml/sls'],
		},
		metadata: {
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			useCase: 'SAML service provider for federated authentication',
			securityLevel: 'enterprise',
			tags: ['saml', 'service-provider', 'federation', 'sso'],
		},
	},

	// Additional SAML Template
	{
		id: 'saml-basic',
		name: 'Basic SAML Application',
		description: 'Standard SAML application for basic SSO integration',
		category: 'built-in',
		appType: 'SAML_APP',
		configuration: {
			enabled: true,
			redirectUris: ['https://app.company.com/saml/acs'],
			postLogoutRedirectUris: ['https://app.company.com/saml/sls'],
			grantTypes: ['authorization_code'],
			responseTypes: ['code'],
			tokenEndpointAuthMethod: 'client_secret_basic',
			pkceEnforcement: 'OPTIONAL',
			scopes: ['openid', 'profile', 'email'],
			accessTokenValiditySeconds: 3600, // 1 hour
			refreshTokenValiditySeconds: 2592000, // 30 days
			idTokenValiditySeconds: 3600, // 1 hour
			refreshTokenDuration: 30,
			refreshTokenRollingDuration: 180,
			refreshTokenRollingGracePeriod: 0,
			allowRedirectUriPatterns: false,
			pushedAuthorizationRequestStatus: 'OPTIONAL',
			parReferenceTimeout: 60,
			signoffUrls: ['https://app.company.com/saml/sls'],
		},
		metadata: {
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			useCase: 'Basic SAML SSO integration for web applications',
			securityLevel: 'enhanced',
			tags: ['saml', 'sso', 'basic', 'web-app'],
		},
	},
];

// Implementation of the PresetManagerService
class PresetManagerServiceImpl implements PresetManagerService {
	private static readonly CUSTOM_PRESETS_STORAGE_KEY = 'app-generator-custom-presets';

	getBuiltInPresets(): ConfigurationPreset[] {
		return [...BUILT_IN_PRESETS];
	}

	getCustomPresets(): ConfigurationPreset[] {
		try {
			const stored = localStorage.getItem(PresetManagerServiceImpl.CUSTOM_PRESETS_STORAGE_KEY);
			if (!stored) return [];

			const presets = JSON.parse(stored) as ConfigurationPreset[];
			return Array.isArray(presets) ? presets : [];
		} catch (error) {
			console.warn('[PresetManager] Failed to load custom presets:', error);
			return [];
		}
	}

	getAllPresets(): ConfigurationPreset[] {
		return [...this.getBuiltInPresets(), ...this.getCustomPresets()];
	}

	getPresetsByAppType(appType: BuilderAppType): ConfigurationPreset[] {
		return this.getAllPresets().filter((preset) => preset.appType === appType);
	}

	saveCustomPreset(preset: Omit<ConfigurationPreset, 'id' | 'metadata'>): ConfigurationPreset {
		const customPresets = this.getCustomPresets();

		// Check if a preset with the same name already exists
		const existingIndex = customPresets.findIndex(
			(existing) =>
				existing.name.toLowerCase() === preset.name.toLowerCase() &&
				existing.appType === preset.appType
		);

		if (existingIndex !== -1) {
			// Update existing preset
			const updatedPreset: ConfigurationPreset = {
				...customPresets[existingIndex],
				...preset,
				metadata: {
					...customPresets[existingIndex].metadata,
					updatedAt: new Date().toISOString(),
					useCase: preset.description || 'Custom configuration',
					tags: ['custom'],
				},
			};

			customPresets[existingIndex] = updatedPreset;

			try {
				localStorage.setItem(
					PresetManagerServiceImpl.CUSTOM_PRESETS_STORAGE_KEY,
					JSON.stringify(customPresets)
				);
				return updatedPreset;
			} catch (error) {
				console.error('[PresetManager] Failed to update custom preset:', error);
				throw new Error('Failed to update custom preset');
			}
		} else {
			// Create new preset
			const newPreset: ConfigurationPreset = {
				...preset,
				id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
				category: 'custom',
				metadata: {
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
					useCase: preset.description || 'Custom configuration',
					securityLevel: 'basic',
					tags: ['custom'],
				},
			};

			customPresets.push(newPreset);

			try {
				localStorage.setItem(
					PresetManagerServiceImpl.CUSTOM_PRESETS_STORAGE_KEY,
					JSON.stringify(customPresets)
				);
				return newPreset;
			} catch (error) {
				console.error('[PresetManager] Failed to save custom preset:', error);
				throw new Error('Failed to save custom preset');
			}
		}
	}

	deleteCustomPreset(id: string): boolean {
		const customPresets = this.getCustomPresets();
		const index = customPresets.findIndex((preset) => preset.id === id);

		if (index === -1) return false;

		customPresets.splice(index, 1);

		try {
			localStorage.setItem(
				PresetManagerServiceImpl.CUSTOM_PRESETS_STORAGE_KEY,
				JSON.stringify(customPresets)
			);
			return true;
		} catch (error) {
			console.error('[PresetManager] Failed to delete custom preset:', error);
			return false;
		}
	}

	updateCustomPreset(
		id: string,
		updates: Partial<ConfigurationPreset>
	): ConfigurationPreset | null {
		const customPresets = this.getCustomPresets();
		const index = customPresets.findIndex((preset) => preset.id === id);

		if (index === -1) return null;

		const updatedPreset = {
			...customPresets[index],
			...updates,
			id, // Ensure ID doesn't change
			category: 'custom' as const, // Ensure category stays custom
			metadata: {
				...customPresets[index].metadata,
				...updates.metadata,
				updatedAt: new Date().toISOString(),
			},
		};

		customPresets[index] = updatedPreset;

		try {
			localStorage.setItem(
				PresetManagerServiceImpl.CUSTOM_PRESETS_STORAGE_KEY,
				JSON.stringify(customPresets)
			);
			return updatedPreset;
		} catch (error) {
			console.error('[PresetManager] Failed to update custom preset:', error);
			return null;
		}
	}

	applyPreset(presetId: string): FormDataState | null {
		const preset = this.getPresetById(presetId);
		if (!preset) return null;

		// Create a complete FormDataState by merging preset configuration with defaults
		const defaultFormData = this.createDefaultFormData();

		return {
			...defaultFormData,
			...preset.configuration,
			// Ensure arrays are properly handled
			redirectUris: preset.configuration.redirectUris || defaultFormData.redirectUris,
			postLogoutRedirectUris:
				preset.configuration.postLogoutRedirectUris || defaultFormData.postLogoutRedirectUris,
			grantTypes: preset.configuration.grantTypes || defaultFormData.grantTypes,
			responseTypes: preset.configuration.responseTypes || defaultFormData.responseTypes,
			scopes: preset.configuration.scopes || defaultFormData.scopes,
			signoffUrls: preset.configuration.signoffUrls || defaultFormData.signoffUrls,
		};
	}

	getPresetById(id: string): ConfigurationPreset | null {
		const allPresets = this.getAllPresets();
		return allPresets.find((preset) => preset.id === id) || null;
	}

	private createDefaultFormData(): FormDataState {
		return {
			// Basic Settings
			name: '',
			description: '',
			enabled: true,
			redirectUris: ['http://localhost:3000/callback'],
			postLogoutRedirectUris: ['http://localhost:3000'],
			grantTypes: ['authorization_code'],
			responseTypes: ['code'],
			tokenEndpointAuthMethod: 'client_secret_basic',
			pkceEnforcement: 'OPTIONAL',
			scopes: ['openid', 'profile', 'email'],
			accessTokenValiditySeconds: 3600,
			refreshTokenValiditySeconds: 2592000,
			idTokenValiditySeconds: 3600,

			// Advanced Settings
			refreshTokenDuration: 30,
			refreshTokenRollingDuration: 180,
			refreshTokenRollingGracePeriod: 0,
			allowRedirectUriPatterns: false,
			jwksUrl: '',
			pushedAuthorizationRequestStatus: 'OPTIONAL',
			parReferenceTimeout: 60,
			initiateLoginUri: '',
			targetLinkUri: '',
			signoffUrls: [],
		};
	}
}

// Export singleton instance
export const presetManagerService = new PresetManagerServiceImpl();

// Export preset categories for UI organization
export const PRESET_CATEGORIES = {
	WORKER_APPLICATIONS: {
		'worker-app-basic': 'Basic Worker Application',
		'worker-app-admin': 'Administrative Worker Application',
	},
	OIDC_WEB_APPLICATIONS: {
		'oidc-web-enterprise': 'Enterprise OIDC Web Application',
		'oidc-web-development': 'Development OIDC Web Application',
	},
	SAML_APPLICATIONS: {
		'saml-web-app': 'SAML Web Application',
	},
	SINGLE_PAGE_APPS: {
		'spa-react': 'React Single Page Application',
		'spa-angular': 'Angular Single Page Application',
		'spa-vue': 'Vue.js Single Page Application',
	},
	DEVICE_AUTHORIZATION: {
		'device-auth-tv': 'Smart TV Device Authorization',
		'device-auth-iot': 'IoT Device Authorization',
	},
	MOBILE_APPLICATIONS: {
		'mobile-ios': 'iOS Mobile Application',
		'mobile-android': 'Android Mobile Application',
	},
	SERVICE_APPLICATIONS: {
		'microservice-api': 'Microservice API',
	},
} as const;
