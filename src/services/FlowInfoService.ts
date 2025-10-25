// src/services/FlowInfoService.ts - Comprehensive flow information service for V5 flows

import { FlowInfo } from '../components/FlowInfoCard';

export interface DetailedFlowInfo extends FlowInfo {
	// Enhanced flow information with additional details
	flowVersion: string;
	flowCategory: 'standard' | 'experimental' | 'deprecated' | 'pingone-specific';
	complexity: 'simple' | 'moderate' | 'complex';
	securityLevel: 'high' | 'medium' | 'low';
	userInteraction: 'required' | 'optional' | 'none';
	backendRequired: boolean;
	refreshTokenSupport: boolean;
	idTokenSupport: boolean;
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


export interface FlowInfoCardData {
	header: {
		title: string;
		subtitle?: string;
		badge?: string;
		icon?: string;
	};
	keyDetails: {
		tokensReturned: string;
		purpose: string;
		specLayer: string;
		nonceRequirement: string;
		validation: string;
	};
	securityNotes: string[];
	useCases: string[];
	additionalInfo?: {
		complexity?: string;
		securityLevel?: string;
		userInteraction?: string;
		backendRequired?: boolean;
	};
}

export class FlowInfoService {
	private static flowConfigs: Record<string, DetailedFlowInfo> = {
		'oauth-authorization-code': {
			flowType: 'oauth',
			flowName: 'Authorization Code Flow',
			flowVersion: 'V5',
			flowCategory: 'standard',
			complexity: 'moderate',
			securityLevel: 'high',
			userInteraction: 'required',
			backendRequired: true,
			refreshTokenSupport: true,
			idTokenSupport: false,
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
		},
		'oidc-authorization-code': {
			flowType: 'oidc',
			flowName: 'Authorization Code Flow',
			flowVersion: 'V5',
			flowCategory: 'standard',
			complexity: 'moderate',
			securityLevel: 'high',
			userInteraction: 'required',
			backendRequired: true,
			refreshTokenSupport: true,
			idTokenSupport: true,
			tokensReturned: 'Access Token + ID Token + Refresh Token',
			purpose: 'Authentication + Authorization',
			specLayer: 'Defined in OIDC (OpenID Connect)',
			nonceRequirement: 'Recommended for additional security',
			validation:
				'Validate ID Token (signature, issuer, audience, nonce if provided, at_hash), exchange code for tokens',
			securityNotes: [
				'✅ Most secure OIDC flow',
				'Use PKCE for public clients',
				'ID Token provides verified user identity',
				'Always validate state and optionally nonce parameters',
			],
			useCases: [
				'Single sign-on (SSO) applications',
				'Web applications needing user identity',
				'Mobile apps with authentication',
				'Any application requiring both authentication and API access',
			],
			recommendedFor: [
				'SSO implementations',
				'Applications requiring user identity',
				'Enterprise applications',
			],
			notRecommendedFor: ['Simple API-only applications', 'Machine-to-machine scenarios'],
			implementationNotes: [
				'Validate ID Token signature and claims',
				'Implement proper nonce validation',
				'Handle token refresh scenarios',
				'Implement user session management',
			],
			commonIssues: [
				{
					issue: 'ID Token validation fails',
					solution: 'Verify signature, issuer, audience, and expiration',
				},
				{
					issue: 'Nonce mismatch',
					solution: 'Ensure nonce is properly generated and validated',
				},
			],
			relatedFlows: ['oauth-authorization-code', 'hybrid', 'par'],
			documentationLinks: [
				{
					title: 'OpenID Connect Core',
					url: 'https://openid.net/specs/openid-connect-core-1_0.html',
				},
				{
					title: 'OIDC Authorization Code Flow',
					url: 'https://openid.net/specs/openid-connect-core-1_0.html#CodeFlowAuth',
				},
			],
		},
		'client-credentials': {
			flowType: 'oauth',
			flowName: 'Client Credentials Flow',
			flowVersion: 'V5',
			flowCategory: 'standard',
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
		},
		'device-code': {
			flowType: 'oauth',
			flowName: 'Device Authorization Flow',
			flowVersion: 'V5',
			flowCategory: 'standard',
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
			recommendedFor: ['Input-constrained devices', 'TV and streaming applications', 'IoT devices'],
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
		},
		'oidc-hybrid': {
			flowType: 'oidc',
			flowName: 'Hybrid Flow',
			flowVersion: 'V5',
			flowCategory: 'standard',
			complexity: 'complex',
			securityLevel: 'high',
			userInteraction: 'required',
			backendRequired: true,
			refreshTokenSupport: true,
			idTokenSupport: true,
			tokensReturned: 'Access Token + ID Token + Authorization Code',
			purpose: 'Combined authentication with immediate token access',
			specLayer: 'Defined in OIDC (OpenID Connect)',
			nonceRequirement: 'Required when ID Token returned',
			validation:
				'Validate ID Token immediately, exchange code for additional tokens, validate at_hash and c_hash',
			securityNotes: [
				'⚠️ Complex flow - use only when specifically needed',
				'Combines benefits of implicit and authorization code flows',
				'Frontend gets immediate access to ID Token',
				'Backend can securely exchange code for refresh token',
			],
			useCases: [
				'Applications needing immediate user identity verification',
				'Scenarios requiring both frontend and backend token access',
				'Advanced SSO implementations',
			],
			recommendedFor: [
				'Advanced SSO scenarios',
				'Applications needing immediate ID Token access',
				'Complex authentication requirements',
			],
			notRecommendedFor: ['Simple applications', 'Standard authentication scenarios'],
			implementationNotes: [
				'Implement proper ID Token validation',
				'Handle both immediate and deferred token access',
				'Validate at_hash and c_hash parameters',
				'Consider complexity vs. benefits',
			],
			commonIssues: [
				{
					issue: 'Complex implementation',
					solution: 'Consider using Authorization Code Flow with PKCE instead',
				},
				{
					issue: 'Hash validation fails',
					solution: 'Ensure proper at_hash and c_hash calculation and validation',
				},
			],
			relatedFlows: ['oidc-authorization-code', 'oidc-implicit'],
			documentationLinks: [
				{
					title: 'OpenID Connect Core',
					url: 'https://openid.net/specs/openid-connect-core-1_0.html',
				},
				{
					title: 'OIDC Hybrid Flow',
					url: 'https://openid.net/specs/openid-connect-core-1_0.html#HybridFlowAuth',
				},
			],
		},
		'oidc-client-credentials': {
			flowType: 'oidc',
			flowName: 'Client Credentials Flow',
			flowVersion: 'V5',
			flowCategory: 'standard',
			complexity: 'simple',
			securityLevel: 'high',
			userInteraction: 'none',
			backendRequired: true,
			refreshTokenSupport: false,
			idTokenSupport: false,
			tokensReturned: 'Access Token only',
			purpose: 'Machine-to-machine authentication with OIDC context',
			specLayer: 'Defined in OIDC (OpenID Connect)',
			nonceRequirement: 'Not applicable (no user interaction)',
			validation: 'Validate access token with resource server',
			securityNotes: [
				'✅ Ideal for server-to-server authentication',
				'No user context - application acts on its own behalf',
				'Secure storage of client credentials required',
				'Use appropriate scopes to limit access',
				'OIDC context provides additional metadata',
			],
			useCases: [
				'Backend services accessing APIs',
				'Microservice authentication',
				'Scheduled jobs and automation',
				'System-to-system integration',
				'OIDC-enabled machine-to-machine scenarios',
			],
			recommendedFor: [
				'Microservices with OIDC support',
				'Automated systems',
				'Backend integrations requiring OIDC context',
			],
			notRecommendedFor: ['User-facing applications', 'Client-side applications'],
			implementationNotes: [
				'Securely store client credentials',
				'Implement proper scope management',
				'Monitor token usage and expiration',
				'Use least privilege principle',
				'Leverage OIDC metadata for enhanced security',
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
			relatedFlows: ['client-credentials', 'oauth-authorization-code'],
			documentationLinks: [
				{
					title: 'OAuth 2.0 Client Credentials Flow',
					url: 'https://tools.ietf.org/html/rfc6749#section-4.4',
				},
				{
					title: 'OpenID Connect Core',
					url: 'https://openid.net/specs/openid-connect-core-1_0.html',
				},
			],
		},
		'oidc-implicit': {
			flowType: 'oidc',
			flowName: 'Implicit Flow',
			flowVersion: 'V5',
			flowCategory: 'deprecated',
			complexity: 'simple',
			securityLevel: 'low',
			userInteraction: 'required',
			backendRequired: false,
			refreshTokenSupport: false,
			idTokenSupport: true,
			tokensReturned: 'Access Token + ID Token',
			purpose: 'Authentication + Authorization (deprecated)',
			specLayer: 'Defined in OIDC (OpenID Connect)',
			nonceRequirement: 'Required for security',
			validation: 'Validate ID Token signature, issuer, audience, nonce, and expiry',
			securityNotes: [
				'⚠️ DEPRECATED - Not recommended for new applications',
				'Tokens exposed in URL fragment',
				'Nonce parameter is mandatory to prevent replay attacks',
				'Consider using Authorization Code Flow with PKCE instead',
			],
			useCases: [
				'Legacy single-page applications (migration only)',
				'Simple authentication scenarios (deprecated)',
			],
			recommendedFor: [],
			notRecommendedFor: ['New applications', 'Production systems', 'Secure applications'],
			implementationNotes: [
				'Migrate to Authorization Code Flow with PKCE',
				'Implement proper nonce validation',
				'Consider security implications',
				'Plan migration strategy',
			],
			commonIssues: [
				{
					issue: 'Tokens exposed in URL',
					solution: 'Migrate to Authorization Code Flow with PKCE',
				},
				{
					issue: 'Nonce validation fails',
					solution: 'Ensure nonce is properly generated and validated',
				},
			],
			relatedFlows: ['oidc-authorization-code', 'oauth-implicit'],
			documentationLinks: [
				{
					title: 'OpenID Connect Core',
					url: 'https://openid.net/specs/openid-connect-core-1_0.html',
				},
				{
					title: 'OIDC Implicit Flow',
					url: 'https://openid.net/specs/openid-connect-core-1_0.html#ImplicitFlowAuth',
				},
			],
		},
		'oauth-implicit': {
			flowType: 'oauth',
			flowName: 'Implicit Flow',
			flowVersion: 'V5',
			flowCategory: 'deprecated',
			complexity: 'simple',
			securityLevel: 'low',
			userInteraction: 'required',
			backendRequired: false,
			refreshTokenSupport: false,
			idTokenSupport: false,
			tokensReturned: 'Access Token only',
			purpose: 'Authorization (API access) - Deprecated',
			specLayer: 'Defined in OAuth 2.0',
			nonceRequirement: 'Not required',
			validation: 'Validate access token with resource server',
			securityNotes: [
				'⚠️ DEPRECATED - Not recommended for new applications',
				'Tokens exposed in URL fragment',
				'No refresh tokens available',
				'Consider using Authorization Code Flow with PKCE instead',
			],
			useCases: [
				'Legacy browser-based applications (migration only)',
				'Simple client-side applications (deprecated)',
			],
			recommendedFor: [],
			notRecommendedFor: ['New applications', 'Production systems', 'Secure applications'],
			implementationNotes: [
				'Migrate to Authorization Code Flow with PKCE',
				'Implement proper token validation',
				'Consider security implications',
				'Plan migration strategy',
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
			relatedFlows: ['oauth-authorization-code', 'oidc-implicit'],
			documentationLinks: [
				{
					title: 'OAuth 2.0 Implicit Flow',
					url: 'https://tools.ietf.org/html/rfc6749#section-4.2',
				},
			],
		},
		'pingone-worker-token': {
			flowType: 'oauth',
			flowName: 'Worker Token Flow',
			flowVersion: 'V5',
			flowCategory: 'pingone-specific',
			complexity: 'moderate',
			securityLevel: 'high',
			userInteraction: 'none',
			backendRequired: true,
			refreshTokenSupport: false,
			idTokenSupport: false,
			tokensReturned: 'Access Token only',
			purpose: 'PingOne admin access and management operations',
			specLayer: 'PingOne-specific implementation',
			nonceRequirement: 'Not applicable (no user interaction)',
			validation: 'Validate access token with PingOne APIs',
			securityNotes: [
				'✅ High-privilege flow for PingOne administration',
				'Requires PingOne admin credentials',
				'Use with caution - grants administrative access',
				'Monitor usage and implement proper access controls',
				'Store credentials securely',
			],
			useCases: [
				'PingOne environment management',
				'User and group administration',
				'Application configuration',
				'Policy management',
				'System monitoring and reporting',
			],
			recommendedFor: [
				'PingOne administrators',
				'System integration scenarios',
				'Automated management tasks',
			],
			notRecommendedFor: ['End-user applications', 'Public-facing services'],
			implementationNotes: [
				'Use PingOne admin credentials',
				'Implement proper scope management',
				'Monitor token usage and expiration',
				'Use least privilege principle',
				'Consider implementing audit logging',
			],
			commonIssues: [
				{
					issue: 'Invalid admin credentials',
					solution: 'Verify PingOne admin credentials are correct and have proper permissions',
				},
				{
					issue: 'Insufficient scope',
					solution: 'Request appropriate scopes for the required PingOne operations',
				},
			],
			relatedFlows: ['client-credentials', 'oauth-authorization-code'],
			documentationLinks: [
				{
					title: 'PingOne Developer Documentation',
					url: 'https://docs.pingidentity.com/',
				},
				{
					title: 'PingOne API Reference',
					url: 'https://apidocs.pingidentity.com/',
				},
			],
		},
		'token-revocation': {
			flowType: 'oauth',
			flowName: 'Token Revocation Flow',
			flowVersion: 'V5',
			flowCategory: 'standard',
			complexity: 'simple',
			securityLevel: 'high',
			userInteraction: 'none',
			backendRequired: true,
			refreshTokenSupport: false,
			idTokenSupport: false,
			tokensReturned: 'None (revokes existing tokens)',
			purpose: 'Revoke access and refresh tokens for security',
			specLayer: 'Defined in OAuth 2.0 (RFC 7009)',
			nonceRequirement: 'Not applicable',
			validation: 'Confirm token revocation with authorization server',
			securityNotes: [
				'✅ Essential for security and logout functionality',
				'Revokes tokens immediately upon request',
				'Prevents further use of compromised tokens',
				'Should be called during user logout',
				'Consider revoking both access and refresh tokens',
			],
			useCases: [
				'User logout and session termination',
				'Security incident response',
				'Token compromise mitigation',
				'Administrative token revocation',
				'Compliance requirements',
			],
			recommendedFor: [
				'All OAuth applications',
				'Security-sensitive applications',
				'Applications with logout functionality',
			],
			notRecommendedFor: [],
			implementationNotes: [
				'Implement proper error handling',
				'Consider revoking both access and refresh tokens',
				'Handle revocation failures gracefully',
				'Implement retry logic for failed revocations',
				'Log revocation attempts for audit purposes',
			],
			commonIssues: [
				{
					issue: 'Token already revoked',
					solution: 'Handle gracefully - token may already be invalid',
				},
				{
					issue: 'Invalid token format',
					solution: 'Ensure token is properly formatted and not expired',
				},
			],
			relatedFlows: ['token-introspection', 'oauth-authorization-code'],
			documentationLinks: [
				{
					title: 'OAuth 2.0 Token Revocation',
					url: 'https://tools.ietf.org/html/rfc7009',
				},
			],
		},
		'token-introspection': {
			flowType: 'oauth',
			flowName: 'Token Introspection Flow',
			flowVersion: 'V5',
			flowCategory: 'standard',
			complexity: 'simple',
			securityLevel: 'high',
			userInteraction: 'none',
			backendRequired: true,
			refreshTokenSupport: false,
			idTokenSupport: false,
			tokensReturned: 'Token metadata and claims',
			purpose: 'Validate and inspect access tokens',
			specLayer: 'Defined in OAuth 2.0 (RFC 7662)',
			nonceRequirement: 'Not applicable',
			validation: 'Validate token with authorization server',
			securityNotes: [
				'✅ Essential for token validation and authorization',
				'Provides detailed token information',
				'Enables fine-grained authorization decisions',
				'Should be used for API endpoint protection',
				'Consider caching results for performance',
			],
			useCases: [
				'API endpoint authorization',
				'Token validation and verification',
				'Authorization decision making',
				'Token metadata retrieval',
				'Security monitoring and auditing',
			],
			recommendedFor: ['All OAuth applications', 'API gateways and proxies', 'Resource servers'],
			notRecommendedFor: [],
			implementationNotes: [
				'Implement proper caching for performance',
				'Handle introspection failures gracefully',
				'Consider rate limiting for introspection calls',
				'Validate all returned claims',
				'Implement proper error handling',
			],
			commonIssues: [
				{
					issue: 'Token not found',
					solution: 'Handle as invalid token - may be expired or revoked',
				},
				{
					issue: 'Introspection endpoint unavailable',
					solution: 'Implement fallback logic or fail securely',
				},
			],
			relatedFlows: ['token-revocation', 'oauth-authorization-code'],
			documentationLinks: [
				{
					title: 'OAuth 2.0 Token Introspection',
					url: 'https://tools.ietf.org/html/rfc7662',
				},
			],
		},
		'jwt-bearer-token': {
			flowType: 'oauth',
			flowName: 'JWT Bearer Token Flow',
			flowVersion: 'V5',
			flowCategory: 'standard',
			complexity: 'complex',
			securityLevel: 'high',
			userInteraction: 'none',
			backendRequired: true,
			refreshTokenSupport: false,
			idTokenSupport: false,
			tokensReturned: 'Access Token only',
			purpose: 'Advanced client authentication using JWT assertions',
			specLayer: 'Defined in OAuth 2.0 (RFC 7523)',
			nonceRequirement: 'Not applicable',
			validation: 'Validate JWT signature and claims',
			securityNotes: [
				'✅ Enhanced security through JWT assertions',
				'Requires proper JWT signing and validation',
				'More secure than client credentials',
				'Supports advanced authentication scenarios',
				'Private key management is critical',
			],
			useCases: [
				'Advanced client authentication',
				'Microservice authentication',
				'System-to-system integration',
				'High-security applications',
				'Federated authentication scenarios',
			],
			recommendedFor: [
				'High-security applications',
				'Microservice architectures',
				'Advanced integration scenarios',
			],
			notRecommendedFor: ['Simple applications', 'Client-side applications'],
			implementationNotes: [
				'Implement proper JWT signing and validation',
				'Securely store private keys',
				'Use appropriate JWT claims and expiration',
				'Implement proper error handling',
				'Consider key rotation strategies',
			],
			commonIssues: [
				{
					issue: 'Invalid JWT signature',
					solution: 'Verify private key and signing algorithm',
				},
				{
					issue: 'JWT expired or invalid claims',
					solution: 'Check JWT expiration and required claims',
				},
			],
			relatedFlows: ['client-credentials', 'oauth-authorization-code'],
			documentationLinks: [
				{
					title: 'OAuth 2.0 JWT Bearer Token Profiles',
					url: 'https://tools.ietf.org/html/rfc7523',
				},
			],
		},
		'oidc-resource-owner-password': {
			flowType: 'oidc',
			flowName: 'Resource Owner Password Flow',
			flowVersion: 'V5',
			flowCategory: 'deprecated',
			complexity: 'simple',
			securityLevel: 'low',
			userInteraction: 'required',
			backendRequired: true,
			refreshTokenSupport: true,
			idTokenSupport: true,
			tokensReturned: 'Access Token + ID Token + Refresh Token',
			purpose: 'Authentication + Authorization (deprecated)',
			specLayer: 'Defined in OIDC (OpenID Connect)',
			nonceRequirement: 'Not required',
			validation: 'Validate access token and ID token',
			securityNotes: [
				'⚠️ DEPRECATED - Not recommended for new applications',
				'Username and password exposed to client application',
				'No user consent or authorization screen',
				'Consider using Authorization Code Flow with PKCE instead',
				'Only use for legacy migration scenarios',
			],
			useCases: [
				'Legacy OIDC applications (migration only)',
				'Simple authentication scenarios (deprecated)',
				'System-to-system authentication (deprecated)',
			],
			recommendedFor: [],
			notRecommendedFor: [
				'New applications',
				'Production systems',
				'Secure applications',
				'Public-facing applications',
			],
			implementationNotes: [
				'Migrate to Authorization Code Flow with PKCE',
				'Implement proper token validation',
				'Consider security implications',
				'Plan migration strategy',
				'Use only for legacy migration',
			],
			commonIssues: [
				{
					issue: 'Credentials exposed to client',
					solution: 'Migrate to Authorization Code Flow with PKCE',
				},
				{
					issue: 'No user consent',
					solution: 'Use Authorization Code Flow for proper user consent',
				},
			],
			relatedFlows: ['oidc-authorization-code', 'oauth-resource-owner-password'],
			documentationLinks: [
				{
					title: 'OpenID Connect Core',
					url: 'https://openid.net/specs/openid-connect-core-1_0.html',
				},
				{
					title: 'OAuth 2.0 Resource Owner Password Credentials',
					url: 'https://tools.ietf.org/html/rfc6749#section-4.3',
				},
			],
		},
		'oauth-resource-owner-password': {
			flowType: 'oauth',
			flowName: 'Resource Owner Password Flow',
			flowVersion: 'V5',
			flowCategory: 'deprecated',
			complexity: 'simple',
			securityLevel: 'low',
			userInteraction: 'required',
			backendRequired: true,
			refreshTokenSupport: true,
			idTokenSupport: false,
			tokensReturned: 'Access Token + Refresh Token',
			purpose: 'Authentication + Authorization (deprecated)',
			specLayer: 'Defined in OAuth 2.0',
			nonceRequirement: 'Not required',
			validation: 'Validate access token',
			securityNotes: [
				'⚠️ DEPRECATED - Not recommended for new applications',
				'Username and password exposed to client application',
				'No user consent or authorization screen',
				'Consider using Authorization Code Flow with PKCE instead',
				'Only use for legacy migration scenarios',
			],
			useCases: [
				'Legacy OAuth applications (migration only)',
				'Simple authentication scenarios (deprecated)',
				'System-to-system authentication (deprecated)',
			],
			recommendedFor: [],
			notRecommendedFor: [
				'New applications',
				'Production systems',
				'Secure applications',
				'Public-facing applications',
			],
			implementationNotes: [
				'Migrate to Authorization Code Flow with PKCE',
				'Implement proper token validation',
				'Consider security implications',
				'Plan migration strategy',
				'Use only for legacy migration',
			],
			commonIssues: [
				{
					issue: 'Credentials exposed to client',
					solution: 'Migrate to Authorization Code Flow with PKCE',
				},
				{
					issue: 'No user consent',
					solution: 'Use Authorization Code Flow for proper user consent',
				},
			],
			relatedFlows: ['oauth-authorization-code', 'oidc-resource-owner-password'],
			documentationLinks: [
				{
					title: 'OAuth 2.0 Resource Owner Password Credentials',
					url: 'https://tools.ietf.org/html/rfc6749#section-4.3',
				},
			],
		},
		'user-info': {
			flowType: 'oidc',
			flowName: 'User Info Flow',
			flowVersion: 'V5',
			flowCategory: 'standard',
			complexity: 'simple',
			securityLevel: 'high',
			userInteraction: 'none',
			backendRequired: false,
			refreshTokenSupport: false,
			idTokenSupport: false,
			tokensReturned: 'User information and claims',
			purpose: 'Retrieve user information using access token',
			specLayer: 'Defined in OIDC (OpenID Connect)',
			nonceRequirement: 'Not applicable',
			validation: 'Validate access token with user info endpoint',
			securityNotes: [
				'✅ Essential for user information retrieval',
				'Requires valid access token',
				'Provides additional user details and claims',
				'Should be used for personalization and authorization',
				'Consider caching for performance',
			],
			useCases: [
				'User profile display',
				'Personalization features',
				'User information management',
				'Authorization decisions',
				'User experience enhancement',
			],
			recommendedFor: [
				'All OIDC applications',
				'User-facing applications',
				'Personalization scenarios',
			],
			notRecommendedFor: [],
			implementationNotes: [
				'Implement proper access token validation',
				'Handle user info endpoint errors gracefully',
				'Consider caching user information',
				'Respect user privacy and data protection',
				'Implement proper error handling',
			],
			commonIssues: [
				{
					issue: 'Invalid access token',
					solution: 'Ensure access token is valid and has appropriate scopes',
				},
				{
					issue: 'User info endpoint unavailable',
					solution: 'Implement fallback logic or fail gracefully',
				},
			],
			relatedFlows: ['oidc-authorization-code', 'oidc-implicit'],
			documentationLinks: [
				{
					title: 'OpenID Connect Core',
					url: 'https://openid.net/specs/openid-connect-core-1_0.html',
				},
				{
					title: 'OIDC UserInfo Endpoint',
					url: 'https://openid.net/specs/openid-connect-core-1_0.html#UserInfo',
				},
			],
		},
		'oidc-ciba-v6': {
			flowType: 'oidc',
			flowName: 'OIDC CIBA Flow (Mock)',
			flowVersion: 'V5',
			flowCategory: 'standard',
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
		},
		par: {
			flowType: 'oauth',
			flowName: 'Pushed Authorization Request (PAR)',
			flowVersion: 'V5',
			flowCategory: 'standard',
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
			recommendedFor: ['High-security applications', 'Financial services', 'Healthcare systems'],
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
					title: 'Custom Flow Implementation',
					url: '#',
				},
			],
		},
		'oidc-overview': {
			flowType: 'documentation',
			flowName: 'OpenID Connect Overview',
			flowVersion: 'V7',
			flowCategory: 'educational',
			complexity: 'informational',
			securityLevel: 'informational',
			userInteraction: 'none',
			backendRequired: false,
			refreshTokenSupport: false,
			idTokenSupport: true,
			tokensReturned: 'Educational Content',
			purpose: 'Learn about OIDC authentication flows and concepts',
			specLayer: 'OpenID Connect Core 1.0',
			nonceRequirement: 'Varies by flow',
			validation: 'Educational content - no validation required',
			securityNotes: [
				'📚 Comprehensive OIDC flow comparison',
				'🎯 Best practice recommendations',
				'🔒 Security level explanations',
				'⚡ Interactive flow navigation',
			],
			useCases: [
				'Learning OIDC concepts',
				'Comparing authentication flows',
				'Understanding security implications',
				'Choosing the right flow for your application',
			],
			relatedFlows: ['oidc-authorization-code', 'oidc-implicit', 'oidc-hybrid'],
			documentationLinks: [
				{
					title: 'OpenID Connect Core 1.0',
					url: 'https://openid.net/specs/openid-connect-core-1_0.html',
				},
				{
					title: 'OIDC Discovery',
					url: 'https://openid.net/specs/openid-connect-discovery-1_0.html',
				},
			],
		},
	};

	private static normalizeFlowKey(flowType: string): string {
		// Add null/undefined check
		if (!flowType || typeof flowType !== 'string') {
			console.warn('FlowInfoService.normalizeFlowKey called with invalid flowType:', flowType);
			return 'unknown';
		}

		if (FlowInfoService.flowConfigs[flowType]) {
			return flowType;
		}

		const normalizedMap: Record<string, string> = {
			'oauth-authorization-code-v7': 'oauth-authorization-code',
			'oidc-authorization-code-v7': 'oidc-authorization-code',
			'oauth-device-authorization': 'device-code',
			'oidc-device-authorization': 'device-code',
			'ciba-v7': 'oidc-ciba-v6',
			'oidc-ciba-v7': 'oidc-ciba-v6',
		};

		if (normalizedMap[flowType]) {
			return normalizedMap[flowType];
		}

		const trimmed = flowType.replace(/-v\d+$/i, '');
		return FlowInfoService.flowConfigs[trimmed] ? trimmed : flowType;
	}

	/**
	 * Get detailed flow information for a specific flow type
	 */
	static getFlowInfo(flowType: string): DetailedFlowInfo | null {
		if (!flowType || typeof flowType !== 'string') {
			console.warn('FlowInfoService.getFlowInfo called with invalid flowType:', flowType);
			return null;
		}
		
		const key = FlowInfoService.normalizeFlowKey(flowType);
		return FlowInfoService.flowConfigs[key] || null;
	}

	/**
	 * Generate flow info card data for a specific flow type
	 */
	static generateFlowInfoCard(flowType: string): FlowInfoCardData | null {
		if (!flowType || typeof flowType !== 'string') {
			console.warn('FlowInfoService.generateFlowInfoCard called with invalid flowType:', flowType);
			return null;
		}
		
		const flowInfo = FlowInfoService.getFlowInfo(flowType);
		if (!flowInfo) {
			return null;
		}

		return {
			header: {
				title: flowInfo.flowName,
				subtitle: flowInfo.purpose,
				badge: FlowInfoService.getCategoryBadge(flowInfo.flowCategory),
				icon: FlowInfoService.getFlowIcon(flowInfo.flowName),
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
				complexity: FlowInfoService.getComplexityLabel(flowInfo.complexity),
				securityLevel: FlowInfoService.getSecurityLevelLabel(flowInfo.securityLevel),
				userInteraction: FlowInfoService.getUserInteractionLabel(flowInfo.userInteraction),
				backendRequired: flowInfo.backendRequired,
			},
		};
	}

	/**
	 * Get implementation notes for a flow
	 */
	static getImplementationNotes(flowType: string): string[] {
		const flowInfo = FlowInfoService.getFlowInfo(flowType);
		return flowInfo?.implementationNotes || [];
	}

	/**
	 * Get documentation links for a flow
	 */
	static getDocumentationLinks(flowType: string): Array<{ title: string; url: string }> {
		const flowInfo = FlowInfoService.getFlowInfo(flowType);
		return flowInfo?.documentationLinks || [];
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
			'OpenID Connect Overview': '📚',
			'Pushed Authorization Request (PAR)': '📤',
			'Redirectless Flow': '⚡',
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

export default FlowInfoService;
