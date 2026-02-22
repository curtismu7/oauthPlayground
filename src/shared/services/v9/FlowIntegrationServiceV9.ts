/**
 * @file FlowIntegrationServiceV9.ts
 * @module shared/services/v9
 * @description V9 unified flow integration service
 * @version 9.0.0
 * @since 2026-02-20
 *
 * Consolidates flow integration from:
 * - OAuthIntegrationServiceV8
 * - ImplicitFlowIntegrationServiceV8
 * - HybridFlowIntegrationServiceV8
 * - ClientCredentialsIntegrationServiceV8
 *
 * Provides unified flow integration logic across all OAuth/OIDC flows.
 */

export interface V9FlowConfig {
	flowType:
		| 'authorization_code'
		| 'implicit'
		| 'hybrid'
		| 'client_credentials'
		| 'device_code'
		| 'refresh_token';
	authEndpoint: string;
	tokenEndpoint: string;
	redirectUri: string;
	clientId: string;
	clientSecret?: string;
	scopes?: string;
	state?: string;
	pkceCodeVerifier?: string;
	pkceCodeChallenge?: string;
	[key: string]: unknown;
}

export interface V9FlowResult {
	success: boolean;
	data?: Record<string, unknown>;
	error?: string;
	errorType?: string;
	flowType: string;
	timestamp: number;
}

export interface V9FlowBuilder {
	setFlowType(flowType: V9FlowConfig['flowType']): V9FlowBuilder;
	setAuthEndpoint(endpoint: string): V9FlowBuilder;
	setTokenEndpoint(endpoint: string): V9FlowBuilder;
	setRedirectUri(uri: string): V9FlowBuilder;
	setCredentials(clientId: string, clientSecret?: string): V9FlowBuilder;
	setScopes(scopes: string): V9FlowBuilder;
	setState(state?: string): V9FlowBuilder;
	setPKCE(verifier?: string, challenge?: string): V9FlowBuilder;
	build(): V9FlowConfig;
}

/**
 * V9 Flow Integration Service
 *
 * Consolidates flow integration functionality from multiple V8 services
 * into a single, unified service for better maintainability and consistency.
 */
export const FlowIntegrationServiceV9 = {
	/**
	 * Create a new flow configuration builder
	 */
	createBuilder(): V9FlowBuilder {
		const config: Partial<V9FlowConfig> = {};

		const builder: V9FlowBuilder = {
			setFlowType(flowType) {
				config.flowType = flowType;
				return builder;
			},

			setAuthEndpoint(endpoint) {
				config.authEndpoint = endpoint;
				return builder;
			},

			setTokenEndpoint(endpoint) {
				config.tokenEndpoint = endpoint;
				return builder;
			},

			setRedirectUri(uri) {
				config.redirectUri = uri;
				return builder;
			},

			setCredentials(clientId, clientSecret) {
				config.clientId = clientId;
				if (clientSecret) {
					config.clientSecret = clientSecret;
				}
				return builder;
			},

			setScopes(scopes) {
				config.scopes = scopes;
				return builder;
			},

			setState(state) {
				if (state) {
					config.state = state;
				}
				return builder;
			},

			setPKCE(verifier, challenge) {
				if (verifier) {
					config.pkceCodeVerifier = verifier;
				}
				if (challenge) {
					config.pkceCodeChallenge = challenge;
				}
				return builder;
			},

			build() {
				// Validate required fields
				if (!config.flowType) {
					throw new Error('Flow type is required');
				}
				if (!config.authEndpoint) {
					throw new Error('Auth endpoint is required');
				}
				if (!config.tokenEndpoint) {
					throw new Error('Token endpoint is required');
				}
				if (!config.redirectUri) {
					throw new Error('Redirect URI is required');
				}
				if (!config.clientId) {
					throw new Error('Client ID is required');
				}

				return config as V9FlowConfig;
			},
		};

		return builder;
	},

	/**
	 * Generate authorization URL for the given flow config
	 */
	generateAuthUrl(config: V9FlowConfig): string {
		const url = new URL(config.authEndpoint);
		const params = new URLSearchParams();

		// Common parameters
		params.append('response_type', this.getResponseType(config.flowType));
		params.append('client_id', config.clientId);
		params.append('redirect_uri', config.redirectUri);

		if (config.scopes) {
			params.append('scope', config.scopes);
		}

		if (config.state) {
			params.append('state', config.state);
		}

		// Flow-specific parameters
		switch (config.flowType) {
			case 'authorization_code':
				if (config.pkceCodeChallenge) {
					params.append('code_challenge', config.pkceCodeChallenge);
					params.append('code_challenge_method', 'S256');
				}
				break;

			case 'implicit':
			case 'hybrid':
				// Implicit and hybrid flows use response_type parameter
				// Already set above
				break;

			case 'client_credentials':
				// Client credentials flow doesn't use authorization URL
				throw new Error('Client credentials flow does not use authorization URL');

			case 'device_code':
				// Device code flow uses device authorization endpoint
				throw new Error('Device code flow uses device authorization endpoint, not auth URL');
		}

		url.search = params.toString();
		return url.toString();
	},

	/**
	 * Exchange authorization code for tokens
	 */
	async exchangeCodeForTokens(config: V9FlowConfig, code: string): Promise<V9FlowResult> {
		try {
			const tokenData = {
				grant_type: 'authorization_code',
				code,
				redirect_uri: config.redirectUri,
				client_id: config.clientId,
				...(config.clientSecret && { client_secret: config.clientSecret }),
				...(config.pkceCodeVerifier && { code_verifier: config.pkceCodeVerifier }),
			};

			const response = await fetch(config.tokenEndpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				body: new URLSearchParams(tokenData as Record<string, string>),
			});

			if (!response.ok) {
				const errorText = await response.text();
				return {
					success: false,
					error: `Token exchange failed: ${response.status} ${errorText}`,
					errorType: 'token_exchange_error',
					flowType: config.flowType,
					timestamp: Date.now(),
				};
			}

			const data = await response.json();

			return {
				success: true,
				data,
				flowType: config.flowType,
				timestamp: Date.now(),
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error during token exchange',
				errorType: 'network_error',
				flowType: config.flowType,
				timestamp: Date.now(),
			};
		}
	},

	/**
	 * Perform client credentials flow
	 */
	async performClientCredentialsFlow(config: V9FlowConfig): Promise<V9FlowResult> {
		try {
			const tokenData = {
				grant_type: 'client_credentials',
				client_id: config.clientId,
				...(config.clientSecret && { client_secret: config.clientSecret }),
				...(config.scopes && { scope: config.scopes }),
			};

			const response = await fetch(config.tokenEndpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				body: new URLSearchParams(tokenData as Record<string, string>),
			});

			if (!response.ok) {
				const errorText = await response.text();
				return {
					success: false,
					error: `Client credentials flow failed: ${response.status} ${errorText}`,
					errorType: 'client_credentials_error',
					flowType: config.flowType,
					timestamp: Date.now(),
				};
			}

			const data = await response.json();

			return {
				success: true,
				data,
				flowType: config.flowType,
				timestamp: Date.now(),
			};
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error ? error.message : 'Unknown error during client credentials flow',
				errorType: 'network_error',
				flowType: config.flowType,
				timestamp: Date.now(),
			};
		}
	},

	/**
	 * Get response type for flow type
	 */
	getResponseType(flowType: V9FlowConfig['flowType']): string {
		switch (flowType) {
			case 'authorization_code':
				return 'code';
			case 'implicit':
				return 'token';
			case 'hybrid':
				return 'code token';
			default:
				throw new Error(`Unsupported flow type for auth URL: ${flowType}`);
		}
	},

	/**
	 * Validate flow configuration
	 */
	validateConfig(config: V9FlowConfig): { valid: boolean; errors: string[] } {
		const errors: string[] = [];

		if (!config.flowType) {
			errors.push('Flow type is required');
		}

		if (!config.authEndpoint) {
			errors.push('Auth endpoint is required');
		}

		if (!config.tokenEndpoint) {
			errors.push('Token endpoint is required');
		}

		if (!config.redirectUri) {
			errors.push('Redirect URI is required');
		}

		if (!config.clientId) {
			errors.push('Client ID is required');
		}

		// Flow-specific validation
		switch (config.flowType) {
			case 'authorization_code':
				if (config.pkceCodeChallenge && !config.pkceCodeVerifier) {
					errors.push('PKCE code verifier is required when code challenge is provided');
				}
				break;

			case 'client_credentials':
				if (!config.clientSecret) {
					errors.push('Client secret is required for client credentials flow');
				}
				break;
		}

		return {
			valid: errors.length === 0,
			errors,
		};
	},
};

export default FlowIntegrationServiceV9;
