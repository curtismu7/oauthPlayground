// src/services/clientCredentialsSharedService.ts
/**
 * Client Credentials Shared Service - V6 Service Architecture
 *
 * Provides shared functionality for OAuth 2.0 Client Credentials Flow V6
 * Focuses on machine-to-machine authentication without user interaction
 */

import React from 'react';
import { StepCredentials } from '../types/v4FlowTemplate';

// Unified logging format: [🔑 CLIENT-CREDS-V6]
const LOG_PREFIX = '[🔑 CLIENT-CREDS-V6]';

const log = {
	info: (message: string, ...args: unknown[]) => {
		const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
		console.log(`${timestamp} ${LOG_PREFIX} [INFO]`, message, ...args);
	},
	warn: (message: string, ...args: unknown[]) => {
		const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
		console.warn(`${timestamp} ${LOG_PREFIX} [WARN]`, message, ...args);
	},
	error: (message: string, ...args: unknown[]) => {
		const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
		console.error(`${timestamp} ${LOG_PREFIX} [ERROR]`, message, ...args);
	},
	success: (message: string, ...args: unknown[]) => {
		const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
		console.log(`${timestamp} ${LOG_PREFIX} [SUCCESS]`, message, ...args);
	},
};

// Client authentication methods
export type ClientAuthMethod =
	| 'client_secret_basic'
	| 'client_secret_post'
	| 'private_key_jwt'
	| 'none';

export interface ClientCredentialsConfig {
	authMethod: ClientAuthMethod;
	description: string;
	requiresClientSecret: boolean;
	securityLevel: 'high' | 'medium' | 'low';
	useCases: string[];
}

export interface ClientCredentialsTokens {
	access_token: string;
	token_type: string;
	expires_in?: number;
	scope?: string;
}

/**
 * Client Credentials Flow Defaults
 */
export class ClientCredentialsDefaults {
	/**
	 * Get default credentials for client credentials flow
	 */
	static getDefaultCredentials(): Partial<StepCredentials> {
		return {
			environmentId: '',
			clientId: '',
			clientSecret: '',
			scope: '',
			tokenEndpoint: '',
		};
	}

	/**
	 * Get client authentication method configuration
	 */
	static getAuthMethodConfig(method: ClientAuthMethod): ClientCredentialsConfig {
		const configs: Record<ClientAuthMethod, ClientCredentialsConfig> = {
			client_secret_basic: {
				authMethod: 'client_secret_basic',
				description: 'Client credentials sent in HTTP Basic Authorization header',
				requiresClientSecret: true,
				securityLevel: 'high',
				useCases: [
					'Standard OAuth 2.0 client authentication',
					'Backend services with secure credential storage',
					'Server-to-server communication',
				],
			},
			client_secret_post: {
				authMethod: 'client_secret_post',
				description: 'Client credentials sent in request body',
				requiresClientSecret: true,
				securityLevel: 'medium',
				useCases: [
					'Clients that cannot use HTTP Basic authentication',
					'Legacy system integration',
					'Simpler implementation requirements',
				],
			},
			private_key_jwt: {
				authMethod: 'private_key_jwt',
				description: 'JWT signed with client private key',
				requiresClientSecret: false,
				securityLevel: 'high',
				useCases: [
					'Enhanced security requirements',
					'Public key infrastructure (PKI) environments',
					'Cryptographic authentication',
				],
			},
			none: {
				authMethod: 'none',
				description: 'No client authentication (public clients)',
				requiresClientSecret: false,
				securityLevel: 'low',
				useCases: [
					'Public clients without secrets',
					'Development and testing',
					'Low-security scenarios',
				],
			},
		};

		return configs[method];
	}

	/**
	 * Get default collapsible sections state
	 */
	static getDefaultCollapsedSections(): Record<string, boolean> {
		return {
			overview: false,
			flowDiagram: false,
			credentials: false, // Always expanded - users need to see credentials first
			configuration: false,
			authMethods: false,
			tokenRequest: false,
			requestDetails: false,
			tokenAnalysis: false,
			tokenIntrospection: false,
			securityFeatures: false,
			bestPractices: false,
			completionOverview: false,
			completionDetails: false,
			introspectionDetails: false, // Expanded by default for introspection
			rawJson: true, // Collapsed by default for raw JSON
			flowSummary: false,
		};
	}

	/**
	 * Get supported authentication methods
	 */
	static getSupportedAuthMethods(): ClientAuthMethod[] {
		return ['client_secret_basic', 'client_secret_post', 'private_key_jwt', 'none'];
	}

	/**
	 * Validate authentication method
	 */
	static validateAuthMethod(method: string): method is ClientAuthMethod {
		return ['client_secret_basic', 'client_secret_post', 'private_key_jwt', 'none'].includes(
			method
		);
	}
}

/**
 * Client Credentials Sync
 */
export class ClientCredentialsSync {
	/**
	 * Sync credentials from controller
	 */
	static syncCredentials(credentials: StepCredentials): void {
		log.info('Syncing credentials for client credentials flow', {
			environmentId: credentials.environmentId,
			clientId: `${credentials.clientId?.substring(0, 8)}...`,
			scope: credentials.scope,
		});

		// Validate credentials
		if (!credentials.clientId || !credentials.clientSecret) {
			log.warn('Missing required credentials for client credentials flow');
			return;
		}
	}

	/**
	 * Get default credentials
	 */
	static getDefaultCredentials(): Partial<StepCredentials> {
		return ClientCredentialsDefaults.getDefaultCredentials();
	}
}

/**
 * Client Credentials Token Request
 */
export class ClientCredentialsTokenRequest {
	/**
	 * Build token request parameters
	 */
	static buildTokenRequest(
		credentials: StepCredentials,
		authMethod: ClientAuthMethod = 'client_secret_post'
	): {
		url: string;
		headers: Record<string, string>;
		body: string;
	} {
		const tokenEndpoint = credentials.tokenEndpoint || 'https://auth.pingone.com/oauth2/token';
		const headers: Record<string, string> = {
			'Content-Type': 'application/x-www-form-urlencoded',
		};

		const bodyParams: Record<string, string> = {
			grant_type: 'client_credentials',
		};

		if (credentials.environmentId) {
			bodyParams.environment_id = credentials.environmentId;
		}

		bodyParams.client_auth_method = authMethod;

		// Add scope if provided
		if (credentials.scope) {
			bodyParams.scope = credentials.scope;
		}

		// Handle authentication method
		switch (authMethod) {
			case 'client_secret_basic': {
				// Basic authentication in header (still include client ID for server-side validation)
				const basicAuth = btoa(`${credentials.clientId}:${credentials.clientSecret}`);
				headers['Authorization'] = `Basic ${basicAuth}`;
				if (credentials.clientId) {
					bodyParams.client_id = credentials.clientId;
				}
				break;
			}

			case 'client_secret_post':
				// Credentials in request body
				bodyParams.client_id = credentials.clientId;
				bodyParams.client_secret = credentials.clientSecret || '';
				break;

			case 'private_key_jwt':
				// JWT assertion (placeholder - requires actual JWT generation)
				bodyParams.client_id = credentials.clientId;
				bodyParams.client_assertion_type = 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer';
				bodyParams.client_assertion = 'PLACEHOLDER_JWT'; // Would be generated
				break;

			case 'none':
				// Public client - only client_id
				bodyParams.client_id = credentials.clientId;
				break;
		}

		const body = new URLSearchParams(bodyParams).toString();

		log.info('Built token request', {
			url: tokenEndpoint,
			authMethod,
			hasScope: !!credentials.scope,
		});

		return { url: tokenEndpoint, headers, body };
	}

	/**
	 * Execute token request
	 */
	static async executeTokenRequest(
		credentials: StepCredentials,
		authMethod: ClientAuthMethod = 'client_secret_post'
	): Promise<ClientCredentialsTokens> {
		const { url: _url, headers, body } = ClientCredentialsTokenRequest.buildTokenRequest(
			credentials,
			authMethod
		);

		try {
			log.info('Making token request', {
				url: '/api/token-exchange',
				headers: { ...headers, Authorization: headers.Authorization ? '[REDACTED]' : 'NONE' },
				bodyLength: body.length,
				bodyPreview: body.substring(0, 200) + (body.length > 200 ? '...' : ''),
			});

			const response = await fetch('/api/token-exchange', {
				method: 'POST',
				headers,
				body,
			});

			if (!response.ok) {
				const errorText = await response.text();
				log.error('Token request failed', {
					status: response.status,
					statusText: response.statusText,
					errorText,
				});

				// Parse error response to provide more specific error messages
				let parsedError: unknown;
				try {
					parsedError = JSON.parse(errorText);
				} catch {
					parsedError = { error: 'unknown_error', error_description: errorText };
				}

				// Create more descriptive error messages based on status and error type
				let errorMessage = `Token request failed: ${response.status}`;

				// Type guard for parsed error
				const isErrorObject = (error: unknown): error is { error?: string; error_description?: string } => {
					return typeof error === 'object' && error !== null;
				};

				if (response.status === 401) {
					if (isErrorObject(parsedError) && parsedError.error === 'invalid_client') {
						errorMessage = `401 Unauthorized: Invalid client credentials - ${parsedError.error_description || 'Please check your Client ID, Client Secret, and Environment ID'}`;
					} else {
						errorMessage = `401 Unauthorized: ${isErrorObject(parsedError) ? parsedError.error_description || 'Authentication failed - please verify your credentials' : 'Authentication failed'}`;
					}
				} else if (response.status === 403) {
					errorMessage = `403 Forbidden: ${isErrorObject(parsedError) ? parsedError.error_description || 'Access denied - check your application permissions and scopes' : 'Access denied'}`;
				} else if (response.status === 404) {
					errorMessage = `404 Not Found: ${isErrorObject(parsedError) ? parsedError.error_description || 'Environment or endpoint not found - verify your Environment ID' : 'Environment or endpoint not found'}`;
				} else if (response.status >= 500) {
					errorMessage = `${response.status} Server Error: ${isErrorObject(parsedError) ? parsedError.error_description || 'PingOne server error - please try again later' : 'PingOne server error'}`;
				} else {
					errorMessage = `${response.status} ${response.statusText}: ${isErrorObject(parsedError) ? parsedError.error_description || errorText : errorText}`;
				}

				throw new Error(errorMessage);
			}

			const tokenData = await response.json();

			log.success('Token request successful', {
				hasAccessToken: !!tokenData.access_token,
				tokenType: tokenData.token_type,
				expiresIn: tokenData.expires_in,
			});

			return tokenData;
		} catch (error) {
			log.error('Token request failed', error);
			throw error;
		}
	}
}

/**
 * Client Credentials Collapsible Sections Manager
 */
export class ClientCredentialsCollapsibleSections {
	/**
	 * Get default state for collapsible sections
	 */
	static getDefaultState(): Record<string, boolean> {
		return ClientCredentialsDefaults.getDefaultCollapsedSections();
	}

	/**
	 * Create toggle handler for collapsible sections
	 */
	static createToggleHandler(
		setCollapsedSections: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
	) {
		return (key: string) => {
			setCollapsedSections((prev) => ({
				...prev,
				[key]: !prev[key],
			}));
		};
	}

	/**
	 * Toggle specific section
	 */
	static toggleSection(
		key: string,
		setCollapsedSections: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
	): void {
		setCollapsedSections((prev) => ({
			...prev,
			[key]: !prev[key],
		}));
		log.info('Toggled section', { key });
	}
}

/**
 * Client Credentials Educational Content
 */
export const ClientCredentialsEducationalContent = {
	overview: {
		title: 'OAuth 2.0 Client Credentials Flow',
		description: 'Machine-to-machine authentication without user interaction',
		useCases: [
			'Backend services authentication',
			'Server-to-server communication',
			'API client authentication',
			'Microservices authorization',
		],
	},
	authMethods: {
		client_secret_basic: {
			title: 'Client Secret Basic',
			description: 'Most secure standard method using HTTP Basic Authentication',
			benefits: [
				'Industry standard approach',
				'Credentials never appear in request body or logs',
				'Better security posture',
			],
		},
		client_secret_post: {
			title: 'Client Secret Post',
			description: 'Credentials sent in request body parameters',
			benefits: [
				'Simpler implementation',
				'Works with clients that cannot use HTTP headers',
				'Widely supported',
			],
		},
		private_key_jwt: {
			title: 'Private Key JWT',
			description: 'Enhanced security using cryptographic JWT assertions',
			benefits: ['Highest security level', 'No shared secrets', 'Cryptographic proof of identity'],
		},
		none: {
			title: 'None (Public Client)',
			description: 'No client authentication - for public clients only',
			benefits: ['Simplest approach', 'Suitable for development', 'No secret management required'],
		},
	},
	security: {
		bestPractices: [
			'Store client secrets securely (never in code or version control)',
			'Use client_secret_basic for best security',
			'Rotate client secrets regularly',
			'Limit token scopes to minimum required',
			'Implement proper token storage and handling',
			'Monitor token usage and detect anomalies',
		],
	},
};

export { log };
