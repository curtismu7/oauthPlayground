// src/utils/FlowInfoGenerator.ts - Dynamic flow information generator for V5 flows

import { DetailedFlowInfo, FlowInfoCardData } from '../services/FlowInfoService';

export interface FlowInfoTemplate {
	flowType: 'oauth' | 'oidc';
	flowName: string;
	flowVersion: string;
	flowCategory: 'standard' | 'experimental' | 'deprecated' | 'pingone-specific';
	complexity: 'simple' | 'moderate' | 'complex';
	securityLevel: 'high' | 'medium' | 'low';
	userInteraction: 'required' | 'optional' | 'none';
	backendRequired: boolean;
	refreshTokenSupport: boolean;
	idTokenSupport: boolean;
	tokensReturned: string;
	purpose: string;
	specLayer: string;
	nonceRequirement: string;
	validation: string;
	securityNotes: string[];
	useCases: string[];
	recommendedFor: string[];
	notRecommendedFor: string[];
	implementationNotes: string[];
	commonIssues: Array<{
		issue: string;
		solution: string;
	}>;
	relatedFlows: string[];
	documentationLinks: Array<{
		title: string;
		url: string;
	}>;
}

export class FlowInfoGenerator {
	/**
	 * Generate flow information from a template
	 */
	static generateFromTemplate(template: FlowInfoTemplate): DetailedFlowInfo {
		return {
			...template,
		};
	}

	/**
	 * Generate flow information for a custom flow
	 */
	static generateCustomFlow(config: {
		flowType: 'oauth' | 'oidc';
		flowName: string;
		flowVersion?: string;
		flowCategory?: 'standard' | 'experimental' | 'deprecated' | 'pingone-specific';
		complexity?: 'simple' | 'moderate' | 'complex';
		securityLevel?: 'high' | 'medium' | 'low';
		userInteraction?: 'required' | 'optional' | 'none';
		backendRequired?: boolean;
		refreshTokenSupport?: boolean;
		idTokenSupport?: boolean;
		tokensReturned: string;
		purpose: string;
		specLayer: string;
		nonceRequirement: string;
		validation: string;
		securityNotes?: string[];
		useCases?: string[];
		recommendedFor?: string[];
		notRecommendedFor?: string[];
		implementationNotes?: string[];
		commonIssues?: Array<{ issue: string; solution: string }>;
		relatedFlows?: string[];
		documentationLinks?: Array<{ title: string; url: string }>;
	}): DetailedFlowInfo {
		return {
			flowType: config.flowType,
			flowName: config.flowName,
			flowVersion: config.flowVersion || 'V5',
			flowCategory: config.flowCategory || 'standard',
			complexity: config.complexity || 'moderate',
			securityLevel: config.securityLevel || 'medium',
			userInteraction: config.userInteraction || 'required',
			backendRequired: config.backendRequired ?? true,
			refreshTokenSupport: config.refreshTokenSupport ?? false,
			idTokenSupport: config.idTokenSupport ?? false,
			tokensReturned: config.tokensReturned,
			purpose: config.purpose,
			specLayer: config.specLayer,
			nonceRequirement: config.nonceRequirement,
			validation: config.validation,
			securityNotes: config.securityNotes || [],
			useCases: config.useCases || [],
			recommendedFor: config.recommendedFor || [],
			notRecommendedFor: config.notRecommendedFor || [],
			implementationNotes: config.implementationNotes || [],
			commonIssues: config.commonIssues || [],
			relatedFlows: config.relatedFlows || [],
			documentationLinks: config.documentationLinks || [],
		};
	}

	/**
	 * Generate flow information card data from detailed flow info
	 */
	static generateCardData(flowInfo: DetailedFlowInfo): FlowInfoCardData {
		return {
			header: {
				title: `${flowInfo.flowType === 'oauth' ? 'OAuth 2.0' : 'OIDC'} ${flowInfo.flowName}`,
				subtitle: flowInfo.flowVersion,
				badge: FlowInfoGenerator.getCategoryBadge(flowInfo.flowCategory),
				icon: FlowInfoGenerator.getFlowIcon(flowInfo.flowName),
			},
			keyDetails: {
				tokensReturned: flowInfo.tokensReturned,
				purpose: flowInfo.purpose,
				specLayer: flowInfo.specLayer,
				nonceRequirement: flowInfo.nonceRequirement,
				validation: flowInfo.validation,
			},
			securityNotes: flowInfo.securityNotes ?? [],
			useCases: flowInfo.useCases ?? [],
			additionalInfo: {
				complexity: FlowInfoGenerator.getComplexityLabel(flowInfo.complexity),
				securityLevel: FlowInfoGenerator.getSecurityLevelLabel(flowInfo.securityLevel),
				userInteraction: FlowInfoGenerator.getUserInteractionLabel(flowInfo.userInteraction),
				backendRequired: flowInfo.backendRequired,
			},
		};
	}

	/**
	 * Create a flow information template for common flow patterns
	 */
	static createTemplate(
		pattern:
			| 'authorization-code'
			| 'implicit'
			| 'client-credentials'
			| 'device'
			| 'ciba'
			| 'par'
			| 'custom'
	): FlowInfoTemplate {
		const baseTemplate: FlowInfoTemplate = {
			flowType: 'oauth',
			flowName: 'Custom Flow',
			flowVersion: 'V5',
			flowCategory: 'standard',
			complexity: 'moderate',
			securityLevel: 'high',
			userInteraction: 'required',
			backendRequired: true,
			refreshTokenSupport: false,
			idTokenSupport: false,
			tokensReturned: 'Access Token',
			purpose: 'Authorization',
			specLayer: 'Custom implementation',
			nonceRequirement: 'Not required',
			validation: 'Validate access token with resource server',
			securityNotes: [],
			useCases: [],
			recommendedFor: [],
			notRecommendedFor: [],
			implementationNotes: [],
			commonIssues: [],
			relatedFlows: [],
			documentationLinks: [],
		};

		switch (pattern) {
			case 'authorization-code':
				return {
					...baseTemplate,
					flowName: 'Authorization Code Flow',
					complexity: 'moderate',
					securityLevel: 'high',
					userInteraction: 'required',
					backendRequired: true,
					refreshTokenSupport: true,
					tokensReturned: 'Access Token + Refresh Token',
					purpose: 'Authorization (API access)',
					specLayer: 'Defined in OAuth 2.0',
					nonceRequirement: 'Not required (but recommended with PKCE)',
					validation: 'Validate access token with resource server, exchange code for tokens',
					securityNotes: [
						'✅ Most secure OAuth 2.0 flow',
						'Use PKCE for public clients',
						'Requires secure backend for confidential clients',
						'Always validate state parameter (CSRF protection)',
					],
					useCases: [
						'Web applications with secure backend',
						'Mobile apps with PKCE',
						'Server-side applications',
						'Any application needing refresh tokens',
					],
					recommendedFor: [
						'Production web applications',
						'Mobile applications',
						'Server-to-server integrations',
					],
					notRecommendedFor: [
						'Simple client-side only applications',
						'Legacy systems without backend support',
					],
					implementationNotes: [
						'Implement PKCE for enhanced security',
						'Use secure state parameter for CSRF protection',
						'Store refresh tokens securely',
						'Implement proper token validation',
					],
					commonIssues: [
						{
							issue: 'State parameter mismatch',
							solution: 'Ensure state parameter is properly generated and validated',
						},
						{
							issue: 'Code exchange fails',
							solution: 'Verify client credentials and redirect URI match exactly',
						},
					],
					relatedFlows: ['oidc-authorization-code', 'par', 'client-credentials'],
					documentationLinks: [
						{
							title: 'OAuth 2.0 Authorization Code Flow',
							url: 'https://tools.ietf.org/html/rfc6749#section-4.1',
						},
						{
							title: 'PKCE Extension',
							url: 'https://tools.ietf.org/html/rfc7636',
						},
					],
				};

			case 'implicit':
				return {
					...baseTemplate,
					flowName: 'Implicit Flow',
					complexity: 'simple',
					securityLevel: 'low',
					userInteraction: 'required',
					backendRequired: false,
					refreshTokenSupport: false,
					tokensReturned: 'Access Token only',
					purpose: 'Authorization (API access)',
					specLayer: 'Defined in OAuth 2.0',
					nonceRequirement: 'Not required',
					validation: 'Validate access token with resource server',
					securityNotes: [
						'⚠️ DEPRECATED - Not recommended for new applications',
						'Tokens exposed in URL fragment',
						'No refresh tokens available',
						'Consider using Authorization Code Flow with PKCE instead',
					],
					useCases: ['Legacy browser-based applications (migration only)'],
					recommendedFor: [],
					notRecommendedFor: ['New applications', 'Production systems', 'Secure applications'],
					implementationNotes: [
						'Migrate to Authorization Code Flow with PKCE',
						'Implement proper token validation',
						'Consider security implications',
					],
					commonIssues: [
						{
							issue: 'Tokens exposed in URL',
							solution: 'Migrate to Authorization Code Flow with PKCE',
						},
						{
							issue: 'No refresh token support',
							solution: 'Use Authorization Code Flow for refresh token support',
						},
					],
					relatedFlows: ['oauth-authorization-code', 'oidc-authorization-code'],
					documentationLinks: [
						{
							title: 'OAuth 2.0 Implicit Flow',
							url: 'https://tools.ietf.org/html/rfc6749#section-4.2',
						},
					],
				};

			case 'client-credentials':
				return {
					...baseTemplate,
					flowName: 'Client Credentials Flow',
					complexity: 'simple',
					securityLevel: 'high',
					userInteraction: 'none',
					backendRequired: true,
					refreshTokenSupport: false,
					idTokenSupport: false,
					tokensReturned: 'Access Token only',
					purpose: 'Machine-to-machine authorization',
					specLayer: 'Defined in OAuth 2.0',
					nonceRequirement: 'Not applicable (no user interaction)',
					validation: 'Validate access token with resource server',
					securityNotes: [
						'✅ Ideal for server-to-server authentication',
						'No user context - application acts on its own behalf',
						'Secure storage of client credentials required',
						'Use appropriate scopes to limit access',
					],
					useCases: [
						'Backend services accessing APIs',
						'Microservice authentication',
						'Scheduled jobs and automation',
						'System-to-system integration',
					],
					recommendedFor: ['Microservices', 'Automated systems', 'Backend integrations'],
					notRecommendedFor: ['User-facing applications', 'Client-side applications'],
					implementationNotes: [
						'Securely store client credentials',
						'Implement proper scope management',
						'Monitor token usage and expiration',
						'Use least privilege principle',
					],
					commonIssues: [
						{
							issue: 'Invalid client credentials',
							solution: 'Verify client ID and secret are correct and properly encoded',
						},
						{
							issue: 'Insufficient scope',
							solution: 'Request appropriate scopes for the required operations',
						},
					],
					relatedFlows: ['oauth-authorization-code', 'device-code'],
					documentationLinks: [
						{
							title: 'OAuth 2.0 Client Credentials Flow',
							url: 'https://tools.ietf.org/html/rfc6749#section-4.4',
						},
					],
				};

			case 'device':
				return {
					...baseTemplate,
					flowName: 'Device Authorization Flow',
					complexity: 'moderate',
					securityLevel: 'high',
					userInteraction: 'required',
					backendRequired: false,
					refreshTokenSupport: true,
					idTokenSupport: false,
					tokensReturned: 'Access Token + Refresh Token + (optional ID Token)',
					purpose: 'Authorization for input-constrained devices',
					specLayer: 'Defined in OAuth 2.0 (RFC 8628)',
					nonceRequirement: 'Not typically used',
					validation: 'Poll token endpoint until user authorizes on separate device',
					securityNotes: [
						'✅ Perfect for devices with limited input capabilities',
						'User completes authentication on a separate device',
						'Polling mechanism to check authorization status',
						'Device code and user code have short expiration times',
					],
					useCases: [
						'Smart TVs and streaming devices',
						'IoT devices with no keyboard',
						'Gaming consoles',
						'Command-line tools and CLI applications',
					],
					recommendedFor: [
						'Input-constrained devices',
						'TV and streaming applications',
						'IoT devices',
					],
					notRecommendedFor: ['Web applications', 'Mobile applications with full UI'],
					implementationNotes: [
						'Implement proper polling intervals',
						'Handle device code expiration',
						'Provide clear user instructions',
						'Implement timeout handling',
					],
					commonIssues: [
						{
							issue: 'Polling timeout',
							solution: 'Implement exponential backoff and proper error handling',
						},
						{
							issue: 'User code expired',
							solution: 'Request new device code and restart the flow',
						},
					],
					relatedFlows: ['oauth-authorization-code', 'oidc-ciba-v6'],
					documentationLinks: [
						{
							title: 'OAuth 2.0 Device Authorization Grant',
							url: 'https://tools.ietf.org/html/rfc8628',
						},
					],
				};

			case 'ciba':
				return {
					...baseTemplate,
					flowType: 'oidc',
					flowName: 'OIDC CIBA Flow',
					complexity: 'complex',
					securityLevel: 'high',
					userInteraction: 'required',
					backendRequired: true,
					refreshTokenSupport: true,
					idTokenSupport: true,
					tokensReturned: 'Access Token + ID Token + Refresh Token',
					purpose: 'Decoupled Authentication + Authorization',
					specLayer: 'Defined in OIDC CIBA (RFC 8628 extension)',
					nonceRequirement: 'Not applicable (backchannel flow)',
					validation:
						'Validate ID Token signature, issuer, audience, and expiry. Poll with auth_req_id.',
					securityNotes: [
						'✅ Secure decoupled authentication flow',
						'Requires CIBA-enabled PingOne environment',
						'User approval happens on secondary device',
						'Respect polling intervals to avoid rate limiting',
						'Use strong client authentication (private_key_jwt recommended)',
					],
					useCases: [
						'IoT devices without user interface',
						'Call center authentication scenarios',
						'Smart TV and streaming device authentication',
						'Point-of-sale systems',
						'Any scenario requiring decoupled user approval',
					],
					recommendedFor: [
						'Decoupled authentication scenarios',
						'IoT and embedded devices',
						'High-security applications',
					],
					notRecommendedFor: ['Simple web applications', 'Direct user interaction scenarios'],
					implementationNotes: [
						'Implement proper polling with backoff',
						'Handle authentication request expiration',
						'Use strong client authentication',
						'Implement proper error handling',
					],
					commonIssues: [
						{
							issue: 'Authentication request timeout',
							solution: 'Implement proper polling intervals and handle expiration',
						},
						{
							issue: 'Client authentication fails',
							solution: 'Verify client credentials and authentication method',
						},
					],
					relatedFlows: ['device-code', 'oidc-authorization-code'],
					documentationLinks: [
						{
							title: 'OpenID Connect CIBA',
							url: 'https://openid.net/specs/openid-connect-ciba-1_0.html',
						},
						{
							title: 'OAuth 2.0 Device Authorization Grant',
							url: 'https://tools.ietf.org/html/rfc8628',
						},
					],
				};

			case 'par':
				return {
					...baseTemplate,
					flowName: 'Pushed Authorization Request (PAR)',
					complexity: 'moderate',
					securityLevel: 'high',
					userInteraction: 'required',
					backendRequired: true,
					refreshTokenSupport: true,
					idTokenSupport: false,
					tokensReturned: 'Same as Authorization Code Flow',
					purpose: 'Secure authorization with server-side request initiation',
					specLayer: 'Defined in OAuth 2.0 (RFC 9126)',
					nonceRequirement: 'Recommended for OIDC',
					validation: 'Push request to server first, then redirect with request_uri',
					securityNotes: [
						'✅ Enhanced security - Authorization request not exposed in browser',
						'Prevents request tampering and leakage',
						'Requires additional server endpoint',
						'Ideal for high-security applications',
					],
					useCases: [
						'Financial applications',
						'Healthcare systems',
						'High-security enterprise applications',
						'Applications handling sensitive data',
					],
					recommendedFor: [
						'High-security applications',
						'Financial services',
						'Healthcare systems',
					],
					notRecommendedFor: ['Simple applications', 'Applications without security requirements'],
					implementationNotes: [
						'Implement PAR endpoint on authorization server',
						'Handle request URI generation and validation',
						'Implement proper error handling',
						'Consider request URI expiration',
					],
					commonIssues: [
						{
							issue: 'Request URI not found',
							solution: 'Verify request URI is valid and not expired',
						},
						{
							issue: 'PAR endpoint unavailable',
							solution: 'Ensure PAR endpoint is properly configured and accessible',
						},
					],
					relatedFlows: ['oauth-authorization-code', 'oidc-authorization-code'],
					documentationLinks: [
						{
							title: 'OAuth 2.0 Pushed Authorization Requests',
							url: 'https://tools.ietf.org/html/rfc9126',
						},
					],
				};

			case 'custom':
			default:
				return baseTemplate;
		}
	}

	// Private helper methods
	private static getCategoryBadge(category: DetailedFlowInfo['flowCategory']): string {
		switch (category) {
			case 'standard':
				return 'Standard';
			case 'experimental':
				return 'Experimental';
			case 'deprecated':
				return 'Deprecated';
			case 'pingone-specific':
				return 'PingOne';
			default:
				return 'Unknown';
		}
	}

	private static getFlowIcon(flowName: string): string {
		const iconMap: Record<string, string> = {
			'Authorization Code Flow': '🔐',
			'Client Credentials Flow': '🤖',
			'Device Authorization Flow': '📱',
			'OIDC CIBA Flow': '🔗',
			'Pushed Authorization Request (PAR)': '📤',
			'Redirectless Flow': '⚡',
			'Implicit Flow': '⚠️',
		};
		return iconMap[flowName] || '🔑';
	}

	private static getComplexityLabel(complexity: DetailedFlowInfo['complexity']): string {
		switch (complexity) {
			case 'simple':
				return 'Simple';
			case 'moderate':
				return 'Moderate';
			case 'complex':
				return 'Complex';
			default:
				return 'Unknown';
		}
	}

	private static getSecurityLevelLabel(securityLevel: DetailedFlowInfo['securityLevel']): string {
		switch (securityLevel) {
			case 'high':
				return 'High Security';
			case 'medium':
				return 'Medium Security';
			case 'low':
				return 'Low Security';
			default:
				return 'Unknown';
		}
	}

	private static getUserInteractionLabel(
		userInteraction: DetailedFlowInfo['userInteraction']
	): string {
		switch (userInteraction) {
			case 'required':
				return 'User Interaction Required';
			case 'optional':
				return 'User Interaction Optional';
			case 'none':
				return 'No User Interaction';
			default:
				return 'Unknown';
		}
	}
}

export default FlowInfoGenerator;
