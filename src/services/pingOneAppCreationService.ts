// src/services/pingOneAppCreationService.ts
import { logger } from '../utils/logger';
import { createPingOneClient, makeApiRequest, PingOneClient } from '../utils/apiClient';

export type AppType = 'WEB_APP' | 'NATIVE_APP' | 'WORKER' | 'SINGLE_PAGE_APP' | 'SERVICE';

// Internal type mapping for UI display
export type AppTypeDisplay = 'OIDC_WEB_APP' | 'OIDC_NATIVE_APP' | 'WORKER' | 'SINGLE_PAGE_APP' | 'SERVICE';

export interface BaseAppConfig {
	name: string;
	description?: string;
	enabled?: boolean;
}

export interface OIDCWebAppConfig extends BaseAppConfig {
	type: 'OIDC_WEB_APP';
	redirectUris: string[];
	postLogoutRedirectUris?: string[];
	grantTypes: ('authorization_code' | 'implicit' | 'refresh_token' | 'client_credentials')[];
	responseTypes: ('code' | 'token' | 'id_token')[];
	tokenEndpointAuthMethod: 'client_secret_basic' | 'client_secret_post' | 'none';
	pkceEnforcement?: 'OPTIONAL' | 'REQUIRED';
	scopes: string[];
	accessTokenValiditySeconds?: number;
	refreshTokenValiditySeconds?: number;
	idTokenValiditySeconds?: number;
}

export interface OIDCNativeAppConfig extends BaseAppConfig {
	type: 'OIDC_NATIVE_APP';
	redirectUris: string[];
	grantTypes: ('authorization_code' | 'implicit' | 'refresh_token')[];
	responseTypes: ('code' | 'token' | 'id_token')[];
	tokenEndpointAuthMethod: 'client_secret_basic' | 'client_secret_post' | 'none';
	pkceEnforcement?: 'OPTIONAL' | 'REQUIRED';
	scopes: string[];
	accessTokenValiditySeconds?: number;
	refreshTokenValiditySeconds?: number;
	idTokenValiditySeconds?: number;
}

export interface WorkerAppConfig extends BaseAppConfig {
	type: 'WORKER';
	grantTypes: ('client_credentials' | 'authorization_code' | 'implicit')[];
	tokenEndpointAuthMethod:
		| 'client_secret_basic'
		| 'client_secret_post'
		| 'client_secret_jwt'
		| 'private_key_jwt';
	scopes: string[];
	accessTokenValiditySeconds?: number;
	refreshTokenValiditySeconds?: number;
	clientSecret?: string;
}

export interface SinglePageAppConfig extends BaseAppConfig {
	type: 'SINGLE_PAGE_APP';
	redirectUris: string[];
	grantTypes: ('authorization_code' | 'implicit' | 'refresh_token')[];
	responseTypes: ('code' | 'token' | 'id_token')[];
	tokenEndpointAuthMethod: 'none';
	pkceEnforcement?: 'OPTIONAL' | 'REQUIRED';
	scopes: string[];
	accessTokenValiditySeconds?: number;
	refreshTokenValiditySeconds?: number;
	idTokenValiditySeconds?: number;
}

export interface ServiceAppConfig extends BaseAppConfig {
	type: 'SERVICE';
	grantTypes: ('client_credentials' | 'authorization_code')[];
	tokenEndpointAuthMethod:
		| 'client_secret_basic'
		| 'client_secret_post'
		| 'client_secret_jwt'
		| 'private_key_jwt';
	scopes: string[];
	accessTokenValiditySeconds?: number;
	refreshTokenValiditySeconds?: number;
	clientSecret?: string;
}

export type AppConfig =
	| OIDCWebAppConfig
	| OIDCNativeAppConfig
	| WorkerAppConfig
	| SinglePageAppConfig
	| ServiceAppConfig;

export interface CreatedApp {
	id: string;
	name: string;
	clientId: string;
	clientSecret?: string;
	type: AppType;
	enabled: boolean;
	environment: {
		id: string;
	};
	createdAt: string;
	_links: {
		self: {
			href: string;
		};
		environment: {
			href: string;
		};
	};
}

export interface AppCreationResult {
	success: boolean;
	app?: CreatedApp;
	error?: string;
}

export class PingOneAppCreationService {
	private client: PingOneClient | null = null;

	/**
	 * Initialize the service with authentication token
	 */
	initialize(token: string, environmentId: string, region: string = 'NA'): void {
		this.client = createPingOneClient(token, environmentId, region);
		logger.info('APP-CREATION', 'Service initialized', { environmentId, region });
	}

	/**
	 * Create an OIDC Web Application
	 */
	async createOIDCWebApp(config: OIDCWebAppConfig): Promise<AppCreationResult> {
		return this.createApp({
			name: config.name,
			description: config.description,
			enabled: config.enabled !== undefined ? config.enabled : true,
			protocol: 'OPENID_CONNECT',
			type: 'WEB_APP',
			grantTypes: config.grantTypes,
			responseTypes: config.responseTypes,
			redirectUris: config.redirectUris,
			postLogoutRedirectUris: config.postLogoutRedirectUris,
			tokenEndpointAuthMethod: config.tokenEndpointAuthMethod,
			pkceEnforcement: config.pkceEnforcement || 'OPTIONAL',
			scopes: config.scopes,
			accessTokenValiditySeconds: config.accessTokenValiditySeconds || 3600,
			refreshTokenValiditySeconds: config.refreshTokenValiditySeconds || 2592000,
			idTokenValiditySeconds: config.idTokenValiditySeconds || 3600,
		});
	}

	/**
	 * Create an OIDC Native Application
	 */
	async createOIDCNativeApp(config: OIDCNativeAppConfig): Promise<AppCreationResult> {
		return this.createApp({
			name: config.name,
			description: config.description,
			enabled: config.enabled !== undefined ? config.enabled : true,
			protocol: 'OPENID_CONNECT',
			type: 'NATIVE_APP',
			grantTypes: config.grantTypes,
			responseTypes: config.responseTypes,
			redirectUris: config.redirectUris,
			tokenEndpointAuthMethod: config.tokenEndpointAuthMethod,
			pkceEnforcement: config.pkceEnforcement || 'REQUIRED',
			scopes: config.scopes,
			accessTokenValiditySeconds: config.accessTokenValiditySeconds || 3600,
			refreshTokenValiditySeconds: config.refreshTokenValiditySeconds || 2592000,
			idTokenValiditySeconds: config.idTokenValiditySeconds || 3600,
		});
	}

	/**
	 * Create a Worker Application
	 */
	async createWorkerApp(config: WorkerAppConfig): Promise<AppCreationResult> {
		return this.createApp({
			name: config.name,
			description: config.description,
			enabled: config.enabled !== undefined ? config.enabled : true,
			protocol: 'OPENID_CONNECT',
			type: config.type,
			grantTypes: config.grantTypes,
			tokenEndpointAuthMethod: config.tokenEndpointAuthMethod,
			scopes: config.scopes,
			accessTokenValiditySeconds: config.accessTokenValiditySeconds || 3600,
			refreshTokenValiditySeconds: config.refreshTokenValiditySeconds || 2592000,
		});
	}

	/**
	 * Create a Single Page Application
	 */
	async createSinglePageApp(config: SinglePageAppConfig): Promise<AppCreationResult> {
		return this.createApp({
			name: config.name,
			description: config.description,
			enabled: config.enabled !== undefined ? config.enabled : true,
			protocol: 'OPENID_CONNECT',
			type: config.type,
			grantTypes: config.grantTypes,
			responseTypes: config.responseTypes,
			redirectUris: config.redirectUris,
			tokenEndpointAuthMethod: 'none',
			pkceEnforcement: config.pkceEnforcement || 'REQUIRED',
			scopes: config.scopes,
			accessTokenValiditySeconds: config.accessTokenValiditySeconds || 3600,
			refreshTokenValiditySeconds: config.refreshTokenValiditySeconds || 2592000,
			idTokenValiditySeconds: config.idTokenValiditySeconds || 3600,
		});
	}

	/**
	 * Create a Service Application
	 */
	async createServiceApp(config: ServiceAppConfig): Promise<AppCreationResult> {
		return this.createApp({
			name: config.name,
			description: config.description,
			enabled: config.enabled !== undefined ? config.enabled : true,
			protocol: 'OPENID_CONNECT',
			type: config.type,
			grantTypes: config.grantTypes,
			tokenEndpointAuthMethod: config.tokenEndpointAuthMethod,
			scopes: config.scopes,
			accessTokenValiditySeconds: config.accessTokenValiditySeconds || 3600,
			refreshTokenValiditySeconds: config.refreshTokenValiditySeconds || 2592000,
		});
	}

	/**
	 * Generic app creation method
	 */
	private async createApp(appData: any): Promise<AppCreationResult> {
		// Ensure protocol is always set
		if (!appData.protocol) {
			appData.protocol = 'OPENID_CONNECT';
		}
		if (!this.client) {
			const error = 'Service not initialized. Call initialize() first.';
			logger.error('APP-CREATION', error);
			return { success: false, error };
		}

		try {
			logger.info('APP-CREATION', 'Creating application', {
				name: appData.name,
				type: appData.type,
				protocol: appData.protocol,
			});

			const normalizeArray = (values?: string[]) =>
				Array.isArray(values)
					? values
						.map((value) => value?.toString().trim())
						.filter((value): value is string => !!value)
						.map((value) => value.toUpperCase())
					: undefined;

			const payload = {
				...appData,
				grantTypes: normalizeArray(appData.grantTypes),
				responseTypes: normalizeArray(appData.responseTypes),
				tokenEndpointAuthMethod: appData.tokenEndpointAuthMethod
					? appData.tokenEndpointAuthMethod.toUpperCase()
					: undefined,
			};

			// Log the full request payload for debugging
			console.log('[APP-CREATION] Request payload:', JSON.stringify(payload, null, 2));
			console.log('[APP-CREATION] Protocol field:', payload.protocol);

			const createdApp = await makeApiRequest<CreatedApp>(this.client, '/applications', {
				method: 'POST',
				body: JSON.stringify(payload),
			});

			logger.success('APP-CREATION', 'Application created successfully', {
				appId: createdApp.id,
				appName: createdApp.name,
				clientId: createdApp.clientId,
			});

			return {
				success: true,
				app: createdApp,
			};
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
			logger.error('APP-CREATION', 'Failed to create application', {
				error: errorMessage,
				appData: { name: appData.name, type: appData.type },
			});

			return {
				success: false,
				error: errorMessage,
			};
		}
	}

	/**
	 * Get list of applications
	 */
	async getApplications(limit: number = 50): Promise<any[]> {
		if (!this.client) {
			throw new Error('Service not initialized. Call initialize() first.');
		}

		try {
			const response = await makeApiRequest<any>(this.client, `/applications?limit=${limit}`);
			return response._embedded?.applications || response.applications || [];
		} catch (error) {
			logger.error('APP-CREATION', 'Failed to get applications', error);
			throw error;
		}
	}

	/**
	 * Delete an application
	 */
	async deleteApplication(appId: string): Promise<boolean> {
		if (!this.client) {
			throw new Error('Service not initialized. Call initialize() first.');
		}

		try {
			await makeApiRequest(this.client, `/applications/${appId}`, {
				method: 'DELETE',
			});

			logger.success('APP-CREATION', 'Application deleted', { appId });
			return true;
		} catch (error) {
			logger.error('APP-CREATION', 'Failed to delete application', { appId, error });
			return false;
		}
	}
}

// Export singleton instance
export const pingOneAppCreationService = new PingOneAppCreationService();
