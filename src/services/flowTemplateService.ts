// src/services/v7FlowTemplateService.ts
/**
 * V7 Flow Template Service
 * 
 * Provides standardized configurations and templates for V7 flows
 * with built-in compliance architecture.
 */

import type { V7FlowName } from './v7SharedService';

export interface V7FlowTemplateConfig {
	flowName: V7FlowName;
	flowTitle: string;
	flowSubtitle: string;
	stepMetadata: Array<{
		title: string;
		subtitle: string;
		description?: string;
	}>;
	complianceFeatures: {
		enableIDTokenValidation: boolean;
		enableParameterValidation: boolean;
		enableErrorHandling: boolean;
		enableSecurityHeaders: boolean;
	};
	educationalContent: {
		overview: string;
		useCases: string[];
		securityConsiderations: string[];
		bestPractices: string[];
	};
}

/**
 * V7 Flow Template Service
 * Provides standardized configurations for all V7 flows
 */
export class V7FlowTemplateService {
	/**
	 * Get template configuration for a specific V7 flow
	 */
	static getTemplateConfig(flowName: V7FlowName): V7FlowTemplateConfig {
		const configs: Record<V7FlowName, V7FlowTemplateConfig> = {
			'oauth-authorization-code-v7': {
				flowName: 'oauth-authorization-code-v7',
				flowTitle: 'OAuth 2.0 Authorization Code Flow (V7)',
				flowSubtitle: 'Unified OAuth/OIDC authorization code experience with enhanced security and compliance',
				stepMetadata: [
					{
						title: 'Application Configuration',
						subtitle: 'Configure your OAuth application credentials',
						description: 'Set up client ID, secret, redirect URI, and other required parameters'
					},
					{
						title: 'Authorization Request',
						subtitle: 'Generate authorization URL and redirect to login',
						description: 'Create PKCE parameters, build authorization URL, and redirect user to authorization server'
					},
					{
						title: 'Authorization Response',
						subtitle: 'Process authorization code from callback',
						description: 'Handle the authorization code returned from the authorization server'
					},
					{
						title: 'Token Exchange',
						subtitle: 'Exchange authorization code for tokens',
						description: 'Exchange the authorization code for access token and refresh token'
					},
					{
						title: 'Token Management',
						subtitle: 'Manage and introspect tokens',
						description: 'View token details, refresh tokens, and manage token lifecycle'
					},
					{
						title: 'Flow Completion',
						subtitle: 'Review flow results and next steps',
						description: 'Review the completed flow and understand next steps'
					}
				],
				complianceFeatures: {
					enableIDTokenValidation: false, // OAuth flow
					enableParameterValidation: true,
					enableErrorHandling: true,
					enableSecurityHeaders: true
				},
				educationalContent: {
					overview: 'The OAuth 2.0 Authorization Code flow is the most secure OAuth flow, using a two-step process to obtain access tokens. It involves redirecting the user to an authorization server, obtaining an authorization code, and then exchanging that code for tokens.',
					useCases: [
						'Web applications requiring secure API access',
						'Mobile applications with secure token storage',
						'Server-to-server applications',
						'Applications requiring refresh token support'
					],
					securityConsiderations: [
						'Always use PKCE for public clients',
						'Validate state parameter to prevent CSRF attacks',
						'Use secure redirect URIs',
						'Implement proper token storage and rotation'
					],
					bestPractices: [
						'Use HTTPS for all communications',
						'Implement proper error handling',
						'Use short-lived access tokens',
						'Implement token refresh mechanisms'
					]
				}
			},
			'oidc-authorization-code-v7': {
				flowName: 'oidc-authorization-code-v7',
				flowTitle: 'OIDC Authorization Code Flow (V7)',
				flowSubtitle: 'OpenID Connect authorization code flow with identity and access tokens',
				stepMetadata: [
					{
						title: 'Application Configuration',
						subtitle: 'Configure your OIDC application credentials',
						description: 'Set up client ID, secret, redirect URI, and OIDC-specific parameters'
					},
					{
						title: 'Authorization Request',
						subtitle: 'Generate OIDC authorization URL',
						description: 'Create PKCE parameters, nonce, and build OIDC authorization URL'
					},
					{
						title: 'Authorization Response',
						subtitle: 'Process authorization code from callback',
						description: 'Handle the authorization code returned from the authorization server'
					},
					{
						title: 'Token Exchange',
						subtitle: 'Exchange authorization code for ID and access tokens',
						description: 'Exchange the authorization code for ID token, access token, and refresh token'
					},
					{
						title: 'ID Token Validation',
						subtitle: 'Validate ID token according to OIDC specification',
						description: 'Validate ID token signature, claims, and compliance with OIDC Core 1.0'
					},
					{
						title: 'User Information',
						subtitle: 'Retrieve user information from UserInfo endpoint',
						description: 'Use the access token to retrieve user information from the UserInfo endpoint'
					},
					{
						title: 'Flow Completion',
						subtitle: 'Review flow results and next steps',
						description: 'Review the completed OIDC flow and understand next steps'
					}
				],
				complianceFeatures: {
					enableIDTokenValidation: true, // OIDC flow
					enableParameterValidation: true,
					enableErrorHandling: true,
					enableSecurityHeaders: true
				},
				educationalContent: {
					overview: 'The OpenID Connect Authorization Code flow extends OAuth 2.0 to provide identity information through ID tokens. It follows the same pattern as OAuth 2.0 but adds identity layer with ID tokens and user information.',
					useCases: [
						'Web applications requiring user authentication',
						'Single sign-on (SSO) implementations',
						'Applications needing user profile information',
						'Federated identity scenarios'
					],
					securityConsiderations: [
						'Validate ID token signature and claims',
						'Check token expiration and nonce values',
						'Verify issuer and audience claims',
						'Implement proper session management'
					],
					bestPractices: [
						'Always validate ID tokens',
						'Use nonce for replay protection',
						'Implement proper logout mechanisms',
						'Handle token refresh securely'
					]
				}
			},
			'oidc-hybrid-v7': {
				flowName: 'oidc-hybrid-v7',
				flowTitle: 'OIDC Hybrid Flow (V7)',
				flowSubtitle: 'OpenID Connect hybrid flow with immediate tokens and authorization code',
				stepMetadata: [
					{
						title: 'Application Configuration',
						subtitle: 'Configure your OIDC hybrid application',
						description: 'Set up client credentials and hybrid flow parameters'
					},
					{
						title: 'Variant Selection',
						subtitle: 'Choose hybrid flow variant',
						description: 'Select the appropriate hybrid flow variant (code+id_token, code+token, or code+id_token+token)'
					},
					{
						title: 'Authorization Request',
						subtitle: 'Generate hybrid authorization URL',
						description: 'Create PKCE parameters, nonce, and build hybrid authorization URL'
					},
					{
						title: 'Authorization Response',
						subtitle: 'Process hybrid response (fragment + query)',
						description: 'Handle tokens from fragment and authorization code from query parameters'
					},
					{
						title: 'Token Analysis',
						subtitle: 'Analyze and validate received tokens',
						description: 'Validate ID token, access token, and analyze token claims'
					},
					{
						title: 'Flow Completion',
						subtitle: 'Review hybrid flow results',
						description: 'Review the completed hybrid flow and understand the benefits'
					}
				],
				complianceFeatures: {
					enableIDTokenValidation: true, // OIDC flow
					enableParameterValidation: true,
					enableErrorHandling: true,
					enableSecurityHeaders: true
				},
				educationalContent: {
					overview: 'The OpenID Connect Hybrid flow combines the security of the authorization code flow with the immediacy of the implicit flow. It returns tokens immediately while also providing an authorization code for secure token exchange.',
					useCases: [
						'Applications requiring immediate token access',
						'Mobile applications with secure token storage',
						'SPA applications needing both security and performance',
						'Applications requiring refresh token support'
					],
					securityConsiderations: [
						'Validate both fragment and query parameters',
						'Check ID token signature and claims',
						'Verify nonce values for replay protection',
						'Handle mixed response types securely'
					],
					bestPractices: [
						'Use appropriate hybrid variants',
						'Implement proper token validation',
						'Handle fragment and query parameters correctly',
						'Ensure secure token storage'
					]
				}
			},
			'oauth-client-credentials-v7': {
				flowName: 'oauth-client-credentials-v7',
				flowTitle: 'OAuth 2.0 Client Credentials Flow (V7)',
				flowSubtitle: 'Machine-to-machine authentication with enhanced client authentication methods',
				stepMetadata: [
					{
						title: 'Application Configuration',
						subtitle: 'Configure client credentials and authentication method',
						description: 'Set up client ID, secret, and choose authentication method (client_secret_post, client_secret_basic, private_key_jwt, or mTLS)'
					},
					{
						title: 'Client Authentication',
						subtitle: 'Configure client authentication method',
						description: 'Set up the chosen client authentication method with appropriate credentials'
					},
					{
						title: 'Token Request',
						subtitle: 'Request access token using client credentials',
						description: 'Send token request with client credentials to obtain access token'
					},
					{
						title: 'Token Response',
						subtitle: 'Process token response and validate',
						description: 'Handle the access token response and validate token properties'
					},
					{
						title: 'Token Usage',
						subtitle: 'Use access token for API calls',
						description: 'Use the obtained access token to make API calls to protected resources'
					},
					{
						title: 'Flow Completion',
						subtitle: 'Review client credentials flow results',
						description: 'Review the completed client credentials flow and understand machine-to-machine authentication'
					}
				],
				complianceFeatures: {
					enableIDTokenValidation: false, // OAuth flow
					enableParameterValidation: true,
					enableErrorHandling: true,
					enableSecurityHeaders: true
				},
				educationalContent: {
					overview: 'The OAuth 2.0 Client Credentials flow is designed for machine-to-machine authentication where no user interaction is required. It allows applications to authenticate themselves and obtain access tokens for API access.',
					useCases: [
						'Server-to-server API communication',
						'Microservice authentication',
						'Background job processing',
						'System integration scenarios'
					],
					securityConsiderations: [
						'Use secure client authentication methods',
						'Implement proper credential storage',
						'Use short-lived access tokens',
						'Implement token rotation mechanisms'
					],
					bestPractices: [
						'Choose appropriate authentication method',
						'Implement secure credential management',
						'Use HTTPS for all communications',
						'Monitor and audit token usage'
					]
				}
			}
		};

		return configs[flowName] || {
			flowName,
			flowTitle: 'V7 Flow',
			flowSubtitle: 'Standardized V7 flow with compliance features',
			stepMetadata: [],
			complianceFeatures: {
				enableIDTokenValidation: true,
				enableParameterValidation: true,
				enableErrorHandling: true,
				enableSecurityHeaders: true
			},
			educationalContent: {
				overview: 'This is a standardized V7 flow with built-in compliance features.',
				useCases: [],
				securityConsiderations: [],
				bestPractices: []
			}
		};
	}

	/**
	 * Get all available V7 flow templates
	 */
	static getAllTemplateConfigs(): V7FlowTemplateConfig[] {
		const flowNames: V7FlowName[] = [
			'oauth-authorization-code-v7',
			'oidc-authorization-code-v7',
			'oidc-hybrid-v7',
			'oauth-client-credentials-v7'
		];

		return flowNames.map(flowName => this.getTemplateConfig(flowName));
	}

	/**
	 * Create a new V7 flow template
	 */
	static createTemplateConfig(
		flowName: V7FlowName,
		customConfig: Partial<V7FlowTemplateConfig>
	): V7FlowTemplateConfig {
		const baseConfig = this.getTemplateConfig(flowName);
		return {
			...baseConfig,
			...customConfig
		};
	}

	/**
	 * Validate template configuration
	 */
	static validateTemplateConfig(config: V7FlowTemplateConfig): {
		isValid: boolean;
		errors: string[];
		warnings: string[];
	} {
		const result = {
			isValid: true,
			errors: [] as string[],
			warnings: [] as string[]
		};

		// Validate required fields
		if (!config.flowName) {
			result.errors.push('Flow name is required');
			result.isValid = false;
		}

		if (!config.flowTitle) {
			result.errors.push('Flow title is required');
			result.isValid = false;
		}

		if (!config.stepMetadata || config.stepMetadata.length === 0) {
			result.errors.push('Step metadata is required');
			result.isValid = false;
		}

		// Validate step metadata
		config.stepMetadata?.forEach((step, index) => {
			if (!step.title) {
				result.errors.push(`Step ${index + 1} title is required`);
				result.isValid = false;
			}
		});

		// Validate compliance features
		if (config.complianceFeatures) {
			const { enableIDTokenValidation, enableParameterValidation, enableErrorHandling, enableSecurityHeaders } = config.complianceFeatures;
			
			if (typeof enableIDTokenValidation !== 'boolean') {
				result.warnings.push('enableIDTokenValidation should be a boolean');
			}
			
			if (typeof enableParameterValidation !== 'boolean') {
				result.warnings.push('enableParameterValidation should be a boolean');
			}
		}

		return result;
	}
}

export default V7FlowTemplateService;
