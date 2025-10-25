// src/services/hybridFlowSharedService.ts
/**
 * Hybrid Flow Shared Service - V6 Service Architecture
 * 
 * Provides shared functionality for OIDC Hybrid Flow V6
 * Follows the same patterns as AuthorizationCodeSharedService and ImplicitFlowSharedService
 */

import React from 'react';
import type { StepCredentials } from '../components/steps/CommonSteps';
import { FlowRedirectUriService } from './flowRedirectUriService';

// Unified logging format: [🔀 HYBRID-V6]
const LOG_PREFIX = '[🔀 HYBRID-V6]';

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

// Hybrid Flow Variants
export type HybridFlowVariant = 'code-id-token' | 'code-token' | 'code-id-token-token';

export interface HybridFlowConfig {
	variant: HybridFlowVariant;
	responseType: 'code id_token' | 'code token' | 'code id_token token';
	responseMode: 'fragment' | 'query' | 'form_post';
	requiresNonce: boolean;
	requiresState: boolean;
	supportsPKCE: boolean;
	supportsRefreshToken: boolean;
	description: string;
	benefits: string[];
	securityConsiderations: string[];
}

export interface HybridTokens {
	access_token?: string;
	id_token?: string;
	refresh_token?: string;
	scope?: string;
	code?: string; // Authorization code from hybrid response
	token_type?: string;
	expires_in?: number;
}

export interface HybridFlowState {
	credentials: StepCredentials | null;
	config: HybridFlowConfig | null;
	tokens: HybridTokens | null;
	authorizationUrl: string | null;
	isLoading: boolean;
	isExchangingCode: boolean;
	error: string | null;
}

/**
 * Hybrid Flow Defaults and Configuration
 */
export class HybridFlowDefaults {
	/**
	 * Get default credentials for hybrid flow
	 */
	static getDefaultCredentials(variant: HybridFlowVariant): Partial<StepCredentials> {
		const baseCredentials = {
			environmentId: '',
			clientId: '',
			clientSecret: '',
			redirectUri: FlowRedirectUriService.getDefaultRedirectUri('oidc-hybrid-v6'),
			scope: 'openid profile email',
			responseMode: 'fragment' as const,
		};

		switch (variant) {
			case 'code-id-token':
				return {
					...baseCredentials,
					responseType: 'code id_token',
				};
			case 'code-token':
				return {
					...baseCredentials,
					responseType: 'code token',
				};
			case 'code-id-token-token':
				return {
					...baseCredentials,
					responseType: 'code id_token token',
				};
			default:
				return baseCredentials;
		}
	}

	/**
	 * Get hybrid flow configuration
	 */
	static getFlowConfig(variant: HybridFlowVariant): HybridFlowConfig {
		const configs: Record<HybridFlowVariant, HybridFlowConfig> = {
			'code-id-token': {
				variant: 'code-id-token',
				responseType: 'code id_token',
				responseMode: 'fragment',
				requiresNonce: true,
				requiresState: true,
				supportsPKCE: true,
				supportsRefreshToken: true,
				description: 'Returns authorization code + ID token immediately in URL fragment',
				benefits: [
					'Immediate user identity verification via ID token',
					'Secure refresh token delivery via code exchange',
					'Combines benefits of implicit and authorization code flows',
				],
				securityConsiderations: [
					'ID token must be validated immediately',
					'Nonce parameter prevents replay attacks',
					'State parameter prevents CSRF attacks',
				],
			},
			'code-token': {
				variant: 'code-token',
				responseType: 'code token',
				responseMode: 'fragment',
				requiresNonce: false,
				requiresState: true,
				supportsPKCE: true,
				supportsRefreshToken: true,
				description: 'Returns authorization code + access token immediately in URL fragment',
				benefits: [
					'Immediate API access via access token',
					'Secure refresh token delivery via code exchange',
					'No need for separate token exchange for basic API calls',
				],
				securityConsiderations: [
					'Access token validation is critical',
					'State parameter prevents CSRF attacks',
					'Token must be validated against audience',
				],
			},
			'code-id-token-token': {
				variant: 'code-id-token-token',
				responseType: 'code id_token token',
				responseMode: 'fragment',
				requiresNonce: true,
				requiresState: true,
				supportsPKCE: true,
				supportsRefreshToken: true,
				description: 'Returns authorization code + ID token + access token immediately in URL fragment',
				benefits: [
					'Immediate user identity verification and API access',
					'Most comprehensive hybrid approach',
					'Secure refresh token delivery via code exchange',
				],
				securityConsiderations: [
					'Both ID token and access token must be validated',
					'Nonce parameter prevents replay attacks',
					'State parameter prevents CSRF attacks',
					'Multiple token validation required',
				],
			},
		};

		return configs[variant];
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
			responseType: false, // Response type selection
			authorizationUrl: false,
			authRequest: false,
			response: false,
			responseOverview: false, // New: Hybrid Authorization Response Overview
			responseDetails: false, // New: Hybrid Response Details
			hybridBenefits: false, // New: Hybrid Flow Benefits
			exchange: false,
			tokens: false,
			tokenManagement: false,
			complete: false,
			flowSummary: false,
			introspectionOverview: true,
			introspectionDetails: false, // Expanded by default for introspection
			rawJson: true, // Collapsed by default for raw JSON
			userInfo: false, // Expanded by default for user info
		};
	}

	/**
	 * Get supported response types
	 */
	static getSupportedResponseTypes(): HybridFlowVariant[] {
		return ['code-id-token', 'code-token', 'code-id-token-token'];
	}

	/**
	 * Validate response type
	 */
	static validateResponseType(responseType: string): responseType is 'code id_token' | 'code token' | 'code id_token token' {
		return ['code id_token', 'code token', 'code id_token token'].includes(responseType);
	}

	/**
	 * Get response type description
	 */
	static getResponseTypeDescription(responseType: HybridFlowVariant): string {
		const descriptions: Record<HybridFlowVariant, string> = {
			'code-id-token': 'Authorization Code + ID Token - Immediate user identity verification',
			'code-token': 'Authorization Code + Access Token - Immediate API access',
			'code-id-token-token': 'Authorization Code + ID Token + Access Token - Complete hybrid approach',
		};
		return descriptions[responseType];
	}
}

/**
 * Hybrid Flow Credentials Sync
 */
export class HybridFlowCredentialsSync {
	/**
	 * Sync credentials from controller
	 */
	static syncCredentials(variant: HybridFlowVariant, credentials: StepCredentials): void {
		log.info(`Syncing credentials for ${variant} hybrid flow`, {
			environmentId: credentials.environmentId,
			clientId: credentials.clientId?.substring(0, 8) + '...',
			responseType: credentials.responseType,
			scope: credentials.scope,
		});

		// Validate credentials
		if (!credentials.environmentId || !credentials.clientId) {
			log.warn('Missing required credentials for hybrid flow');
			return;
		}

		// Validate response type for hybrid flow
		if (!HybridFlowDefaults.validateResponseType(credentials.responseType || '')) {
			log.warn('Invalid response type for hybrid flow', credentials.responseType);
		}
	}

	/**
	 * Get default credentials for variant
	 */
	static getDefaultCredentials(variant: HybridFlowVariant): Partial<StepCredentials> {
		return HybridFlowDefaults.getDefaultCredentials(variant);
	}
}

/**
 * Hybrid Flow Response Type Manager
 */
export class HybridFlowResponseTypeManager {
	/**
	 * Get supported response types
	 */
	static getSupportedResponseTypes(): HybridFlowVariant[] {
		return HybridFlowDefaults.getSupportedResponseTypes();
	}

	/**
	 * Validate response type
	 */
	static validateResponseType(responseType: string): boolean {
		return HybridFlowDefaults.validateResponseType(responseType);
	}

	/**
	 * Get response type description
	 */
	static getResponseTypeDescription(responseType: HybridFlowVariant): string {
		return HybridFlowDefaults.getResponseTypeDescription(responseType);
	}

	/**
	 * Get flow config for response type
	 */
	static getFlowConfig(responseType: string): HybridFlowConfig | null {
		if (!HybridFlowDefaults.validateResponseType(responseType)) {
			return null;
		}

		const variantMap: Record<string, HybridFlowVariant> = {
			'code id_token': 'code-id-token',
			'code token': 'code-token',
			'code id_token token': 'code-id-token-token',
		};

		const variant = variantMap[responseType];
		return variant ? HybridFlowDefaults.getFlowConfig(variant) : null;
	}
}

/**
 * Hybrid Flow Step Restoration
 */
export class HybridFlowStepRestoration {
	/**
	 * Get initial step from URL or session storage
	 */
	static getInitialStep(): number {
		// Check for restore_step in session storage (from callback)
		const restoreStep = sessionStorage.getItem('restore_step');
		if (restoreStep) {
			const step = parseInt(restoreStep, 10);
			sessionStorage.removeItem('restore_step');
			log.info('Restoring step from session storage', { step });
			return step;
		}

		// Check URL parameters
		const urlParams = new URLSearchParams(window.location.search);
		const urlStep = urlParams.get('step');
		if (urlStep) {
			const step = parseInt(urlStep, 10);
			log.info('Using step from URL parameter', { step });
			return step;
		}

		// Default to step 0
		return 0;
	}

	/**
	 * Store step for restoration
	 */
	static storeStepForRestoration(step: number): void {
		sessionStorage.setItem('hybrid_flow_step', step.toString());
		log.info('Stored step for restoration', { step });
	}

	/**
	 * Scroll to top on step change
	 */
	static scrollToTopOnStepChange(): void {
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}
}

/**
 * Hybrid Flow Collapsible Sections Manager
 */
export class HybridFlowCollapsibleSectionsManager {
	/**
	 * Get default state for collapsible sections
	 */
	static getDefaultState(): Record<string, boolean> {
		return HybridFlowDefaults.getDefaultCollapsedSections();
	}

	/**
	 * Create toggle handler for collapsible sections
	 */
	static createToggleHandler(
		setCollapsedSections: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
	) {
		return (key: string) => {
			setCollapsedSections(prev => ({
				...prev,
				[key]: !prev[key],
			}));
			log.info('Toggled collapsible section', { key, collapsed: !setCollapsedSections[key] });
		};
	}

	/**
	 * Toggle specific section
	 */
	static toggleSection(
		key: string,
		setCollapsedSections: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
	): void {
		setCollapsedSections(prev => ({
			...prev,
			[key]: !prev[key],
		}));
		log.info('Toggled section', { key });
	}
}

/**
 * Hybrid Flow Token Processor
 */
export class HybridFlowTokenProcessor {
	/**
	 * Process tokens from URL fragment
	 */
	static processFragmentTokens(fragment: string): HybridTokens {
		const params = new URLSearchParams(fragment);
		const tokens: HybridTokens = {};

		if (params.get('access_token')) {
			tokens.access_token = params.get('access_token')!;
		}
		if (params.get('id_token')) {
			tokens.id_token = params.get('id_token')!;
		}
		if (params.get('refresh_token')) {
			tokens.refresh_token = params.get('refresh_token')!;
		}
		if (params.get('scope')) {
			tokens.scope = params.get('scope')!;
		}
		if (params.get('token_type')) {
			tokens.token_type = params.get('token_type')!;
		}
		if (params.get('expires_in')) {
			tokens.expires_in = parseInt(params.get('expires_in')!, 10);
		}

		log.info('Processed fragment tokens', {
			hasAccessToken: !!tokens.access_token,
			hasIdToken: !!tokens.id_token,
			hasRefreshToken: !!tokens.refresh_token,
			scope: tokens.scope,
		});

		return tokens;
	}

	/**
	 * Merge tokens from fragment and code exchange
	 */
	static mergeTokens(fragmentTokens: HybridTokens, exchangeTokens: HybridTokens): HybridTokens {
		const merged: HybridTokens = {
			...fragmentTokens,
			...exchangeTokens,
		};

		// Prefer exchange tokens over fragment tokens for refresh_token
		if (exchangeTokens.refresh_token) {
			merged.refresh_token = exchangeTokens.refresh_token;
		}

		log.info('Merged tokens from fragment and exchange', {
			hasAccessToken: !!merged.access_token,
			hasIdToken: !!merged.id_token,
			hasRefreshToken: !!merged.refresh_token,
			hasCode: !!merged.code,
		});

		return merged;
	}

	/**
	 * Validate token response
	 */
	static validateTokenResponse(tokens: HybridTokens, expectedResponseType: string): boolean {
		const hasAccessToken = !!tokens.access_token;
		const hasIdToken = !!tokens.id_token;
		const hasCode = !!tokens.code;

		switch (expectedResponseType) {
			case 'code id_token':
				return hasCode && hasIdToken;
			case 'code token':
				return hasCode && hasAccessToken;
			case 'code id_token token':
				return hasCode && hasIdToken && hasAccessToken;
			default:
				return false;
		}
	}
}

/**
 * Hybrid Flow Educational Content
 */
export const HybridFlowEducationalContent = {
	overview: {
		title: 'OIDC Hybrid Flow',
		description: 'Combines the security of Authorization Code flow with the immediate token delivery of Implicit flow, providing both immediate authentication and secure token exchange capabilities.',
		useCases: [
			'Immediate user identity verification with ID tokens',
			'Secure refresh token delivery via authorization code exchange',
			'Flexible authentication scenarios requiring both immediate and long-term access',
			'Mobile and single-page applications needing immediate token access',
			'Enterprise SSO with enhanced security requirements',
		],
		benefits: [
			'Immediate token delivery for better user experience',
			'Enhanced security with PKCE support',
			'OIDC compliance with proper token validation',
			'Reduced server round-trips compared to pure authorization code flow',
			'Flexible response types for different use cases',
		],
		security: [
			'PKCE (Proof Key for Code Exchange) mandatory for security',
			'State and nonce parameter validation',
			'ID token signature verification via JWKS',
			'HTTPS required for all redirect URIs',
			'Short-lived access tokens with secure refresh mechanism',
		],
	},
	responseTypes: {
		'code id_token': {
			description: 'Returns authorization code + ID token immediately in the URL fragment',
			benefits: [
				'Immediate user identity verification with ID token',
				'Secure refresh token delivery via authorization code exchange',
				'Reduced authentication latency',
				'OIDC compliance with proper user authentication',
			],
			security: [
				'ID token signature validation via JWKS',
				'Nonce parameter verification for replay protection',
				'State parameter validation for CSRF protection',
				'PKCE code challenge verification',
			],
			useCases: [
				'Social login implementations',
				'Single-page applications requiring immediate user identity',
				'Mobile apps with offline-first architecture',
			],
		},
		'code token': {
			description: 'Returns authorization code + access token immediately in the URL fragment',
			benefits: [
				'Immediate API access with access token',
				'Secure refresh token delivery via authorization code exchange',
				'Reduced API call latency',
				'Enhanced security compared to implicit flow',
			],
			security: [
				'Access token validation and scope verification',
				'State parameter validation for CSRF protection',
				'PKCE code challenge verification',
				'Token endpoint security for code exchange',
			],
			useCases: [
				'API-first applications',
				'Microservices with immediate data access needs',
				'Third-party integrations requiring immediate API access',
			],
		},
		'code id_token token': {
			description: 'Returns authorization code + ID token + access token immediately in the URL fragment',
			benefits: [
				'Immediate identity verification and API access',
				'Secure refresh token delivery via authorization code exchange',
				'Complete authentication and authorization in one step',
				'Maximum flexibility for complex applications',
			],
			security: [
				'Full token validation (ID token + access token)',
				'Nonce verification for ID token replay protection',
				'State parameter validation for CSRF protection',
				'PKCE code challenge verification',
				'Comprehensive token endpoint security',
			],
			useCases: [
				'Enterprise applications with complex authentication needs',
				'Multi-tenant SaaS applications',
				'Applications requiring both user identity and immediate API access',
			],
		},
	},
	flowSteps: {
		step1: {
			title: 'Configuration & Credentials',
			description: 'Configure PingOne application with hybrid flow support and proper redirect URIs',
			requirements: [
				'PingOne environment with OIDC support',
				'Application configured for hybrid response types',
				'HTTPS redirect URIs for security',
				'PKCE enforcement enabled',
			],
		},
		step2: {
			title: 'Variant Selection',
			description: 'Choose the appropriate hybrid response type for your use case',
			options: [
				'code id_token: For immediate user authentication',
				'code token: For immediate API access',
				'code id_token token: For complete authentication and authorization',
			],
		},
		step3: {
			title: 'Authorization Request',
			description: 'Generate PKCE parameters and build the authorization URL with hybrid response type',
			actions: [
				'Generate PKCE code verifier and challenge',
				'Build authorization URL with hybrid response type',
				'Redirect user to PingOne for authentication',
			],
		},
		step4: {
			title: 'Response Processing',
			description: 'Process the hybrid response containing immediate tokens and authorization code',
			actions: [
				'Parse URL fragment for immediate tokens',
				'Validate state and nonce parameters',
				'Verify ID token signature if present',
				'Store tokens securely for application use',
			],
		},
		step5: {
			title: 'Code Exchange',
			description: 'Exchange the authorization code for additional tokens (refresh token)',
			actions: [
				'Exchange authorization code for refresh token',
				'Merge all tokens for complete token set',
				'Validate token response',
				'Store complete token set',
			],
		},
	},
	bestPractices: {
		security: [
			'Always use PKCE with S256 code challenge method',
			'Validate all tokens using JWKS endpoints',
			'Implement proper state and nonce validation',
			'Use HTTPS for all redirect URIs',
			'Implement token rotation and refresh mechanisms',
		],
		implementation: [
			'Choose the right response type for your use case',
			'Implement proper error handling for all scenarios',
			'Use secure token storage mechanisms',
			'Implement proper logout and token cleanup',
			'Monitor and log authentication events',
		],
		performance: [
			'Cache JWKS keys for token validation',
			'Implement token refresh before expiration',
			'Use appropriate token lifetimes',
			'Minimize unnecessary token exchanges',
		],
	},
};

export { log };
