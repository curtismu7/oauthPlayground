// src/services/pingoneConfigService.ts
import { logger } from '../utils/logger';

export interface PingOneConfig {
	environmentId: string;
	clientId: string;
	clientSecret: string;
	redirectUri: string;
	authServerId?: string;
	// Application configuration
	allowRedirectUriPatterns?: boolean;
	// Derived endpoints
	baseUrl: string;
	authUrl: string;
	authorizationEndpoint: string;
	tokenEndpoint: string;
	userInfoEndpoint: string;
	logoutEndpoint: string;
	parEndpoint: string;
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

export interface WindowWithPingOne extends Window {
	__PINGONE_ENVIRONMENT_ID__?: string;
	__PINGONE_CLIENT_ID__?: string;
	__PINGONE_CLIENT_SECRET__?: string;
	__PINGONE_REDIRECT_URI__?: string;
	__PINGONE_AUTH_SERVER_ID__?: string;
	__PINGONE_API_URL__?: string;
	__PINGONE_FEATURE_ANALYTICS__?: string;
	__PINGONE_ALLOW_REDIRECT_URI_PATTERNS__?: string;
}

export class PingOneConfigService {
	private config: PingOneConfig | null = null;

	/**
	 * Load PingOne configuration from environment variables or localStorage
	 */
	loadConfig(): PingOneConfig {
		if (this.config) {
			return this.config;
		}

		logger.info('PingOneConfigService', 'Loading PingOne configuration...');

		try {
			// Try to get from environment variables first
			const typedWindow = window as WindowWithPingOne;
			const envConfig = this.buildConfigFromEnvironment(typedWindow);

			// If we have environment variables, use them
			if (envConfig.clientId && envConfig.environmentId) {
				logger.info('PingOneConfigService', 'Using environment variables for configuration');
				this.config = envConfig;
				return this.config;
			}

			// Otherwise, try to get from localStorage
			logger.info('PingOneConfigService', 'Loading from localStorage...');
			const savedConfig = localStorage.getItem('pingone-config');
			if (savedConfig) {
				const parsed = JSON.parse(savedConfig);
				this.config = this.validateAndBuildConfig(parsed);
				logger.info('PingOneConfigService', 'Loaded configuration from localStorage');
				return this.config;
			}

			// Fallback to default configuration
			this.config = this.getDefaultConfig();
			logger.warn(
				'PingOneConfigService',
				'Using default configuration - no environment variables or saved config found'
			);
			return this.config;
		} catch (error) {
			logger.error('PingOneConfigService', 'Failed to load configuration', error);
			this.config = this.getDefaultConfig();
			return this.config;
		}
	}

	/**
	 * Save configuration to localStorage
	 */
	saveConfig(config: PingOneConfig): void {
		try {
			localStorage.setItem('pingone-config', JSON.stringify(config));
			this.config = config;
			logger.info('PingOneConfigService', 'Configuration saved to localStorage');
		} catch (error) {
			logger.error('PingOneConfigService', 'Failed to save configuration', error);
		}
	}

	/**
	 * Get current configuration
	 */
	getConfig(): PingOneConfig | null {
		return this.config;
	}

	/**
	 * Update configuration
	 */
	updateConfig(updates: Partial<PingOneConfig>): PingOneConfig {
		const currentConfig = this.loadConfig();
		const updatedConfig = { ...currentConfig, ...updates };
		this.saveConfig(updatedConfig);
		return updatedConfig;
	}

	/**
	 * Validate and build configuration from parsed data
	 */
	private validateAndBuildConfig(parsed: any): PingOneConfig {
		if (!parsed.environmentId || !parsed.clientId) {
			throw new Error('Invalid configuration: missing required fields');
		}

		return this.buildConfigFromParams({
			environmentId: parsed.environmentId,
			clientId: parsed.clientId,
			clientSecret: parsed.clientSecret || '',
			redirectUri: parsed.redirectUri || `${window.location.origin}/callback`,
			authServerId: parsed.authServerId,
			apiUrl: parsed.apiUrl || 'https://auth.pingone.com',
			allowRedirectUriPatterns: parsed.allowRedirectUriPatterns || false,
			enableJWKS: parsed.enableJWKS || false,
		});
	}

	/**
	 * Build configuration from environment variables
	 */
	private buildConfigFromEnvironment(typedWindow: WindowWithPingOne): PingOneConfig {
		return this.buildConfigFromParams({
			environmentId: typedWindow.__PINGONE_ENVIRONMENT_ID__ || '',
			clientId: typedWindow.__PINGONE_CLIENT_ID__ || '',
			clientSecret: typedWindow.__PINGONE_CLIENT_SECRET__ || '',
			redirectUri: typedWindow.__PINGONE_REDIRECT_URI__ || `${window.location.origin}/callback`,
			authServerId: typedWindow.__PINGONE_AUTH_SERVER_ID__,
			apiUrl: typedWindow.__PINGONE_API_URL__ || 'https://auth.pingone.com',
			allowRedirectUriPatterns: typedWindow.__PINGONE_ALLOW_REDIRECT_URI_PATTERNS__ === 'true',
			enableJWKS: typedWindow.__PINGONE_ENABLE_JWKS__ === 'true',
		});
	}

	/**
	 * Build configuration from parameters
	 */
	private buildConfigFromParams(params: {
		environmentId: string;
		clientId: string;
		clientSecret?: string;
		redirectUri?: string;
		authServerId?: string;
		apiUrl?: string;
		allowRedirectUriPatterns?: boolean;
		enableJWKS?: boolean;
	}): PingOneConfig {
		const baseUrl = params.apiUrl || 'https://auth.pingone.com';
		const authUrl = `${baseUrl}/${params.environmentId}/as`;

		return {
			environmentId: params.environmentId,
			clientId: params.clientId,
			clientSecret: params.clientSecret || '',
			redirectUri: params.redirectUri || `${window.location.origin}/callback`,
			allowRedirectUriPatterns: params.allowRedirectUriPatterns || false,
			enableJWKS: params.enableJWKS || false,
			baseUrl,
			authUrl,
			authorizationEndpoint: `${authUrl}/authorize`,
			tokenEndpoint: `${authUrl}/token`,
			userInfoEndpoint: `${authUrl}/userinfo`,
			logoutEndpoint: `${authUrl}/signoff`,
			parEndpoint: `${authUrl}/par`,
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
	}

	/**
	 * Get default configuration
	 */
	private getDefaultConfig(): PingOneConfig {
		return {
			environmentId: '',
			clientId: '',
			clientSecret: '',
			redirectUri: `${window.location.origin}/callback`,
			allowRedirectUriPatterns: false,
			enableJWKS: false,
			baseUrl: '',
			authUrl: '',
			authorizationEndpoint: '',
			tokenEndpoint: '',
			userInfoEndpoint: '',
			logoutEndpoint: '',
			parEndpoint: '',
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
	}

	/**
	 * Check if configuration is valid
	 */
	isConfigValid(): boolean {
		const config = this.loadConfig();
		return !!(config.environmentId && config.clientId);
	}

	/**
	 * Get configuration for PAR requests
	 */
	getPARConfig(): {
		parEndpoint: string;
		clientId: string;
		clientSecret: string;
	} {
		const config = this.loadConfig();
		return {
			parEndpoint: config.parEndpoint,
			clientId: config.clientId,
			clientSecret: config.clientSecret,
		};
	}

	/**
	 * Get configuration for authorization requests
	 */
	getAuthConfig(): {
		authorizationEndpoint: string;
		clientId: string;
		redirectUri: string;
	} {
		const config = this.loadConfig();
		return {
			authorizationEndpoint: config.authorizationEndpoint,
			clientId: config.clientId,
			redirectUri: config.redirectUri,
		};
	}

	/**
	 * Get configuration for token requests
	 */
	getTokenConfig(): {
		tokenEndpoint: string;
		clientId: string;
		clientSecret: string;
		tokenAuthMethod: string;
	} {
		const config = this.loadConfig();
		return {
			tokenEndpoint: config.tokenEndpoint,
			clientId: config.clientId,
			clientSecret: config.clientSecret,
			tokenAuthMethod: config.tokenAuthMethod || 'client_secret_basic',
		};
	}

	/**
	 * Get configuration for user info requests
	 */
	getUserInfoConfig(): {
		userInfoEndpoint: string;
	} {
		const config = this.loadConfig();
		return {
			userInfoEndpoint: config.userInfoEndpoint,
		};
	}
}

// Export singleton instance
export const pingOneConfigService = new PingOneConfigService();
