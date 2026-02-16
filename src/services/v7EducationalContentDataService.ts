// src/services/v7EducationalContentDataService.ts
/**
 * V7 Educational Content Data Service
 *
 * Provides comprehensive specification education for V7 flows
 * with interactive learning components and compliance checking.
 */

import type { V7FlowName } from './v7SharedService';
import React from 'react';

export interface EducationSectionData {
	id: string;
	title: string;
	content: React.ReactNode;
	oneLiner?: string;
	icon?: React.ReactNode;
}

export interface MasterEducationContent {
	id: string;
	title: string;
	sections: EducationSectionData[];
}

export interface V7EducationalContent {
	flowName: V7FlowName;
	specification: {
		name: string;
		version: string;
		url: string;
		description: string;
	};
	overview: {
		title: string;
		description: string;
		keyConcepts: string[];
		flowDiagram: string;
	};
	stepByStepGuide: {
		step: number;
		title: string;
		description: string;
		specification: string;
		parameters: Array<{
			name: string;
			required: boolean;
			description: string;
			example: string;
		}>;
		securityConsiderations: string[];
		commonMistakes: string[];
	};
	interactiveLearning: {
		quizzes: Array<{
			question: string;
			options: string[];
			correctAnswer: number;
			explanation: string;
		}>;
		scenarios: Array<{
			title: string;
			description: string;
			solution: string;
			learningPoints: string[];
		}>;
	};
	complianceChecking: {
		validationRules: Array<{
			rule: string;
			description: string;
			severity: 'error' | 'warning' | 'info';
			specification: string;
		}>;
		bestPractices: Array<{
			practice: string;
			description: string;
			benefit: string;
			implementation: string;
		}>;
	};
}

/**
 * V7 Educational Content Service
 * Provides comprehensive educational content for all V7 flows
 */
export class V7EducationalContentService {
	/**
	 * Get educational content for a specific V7 flow
	 */
	static getEducationalContent(flowName: V7FlowName): V7EducationalContent {
		const contentMap: Record<V7FlowName, V7EducationalContent> = {
			'oauth-authorization-code-v7': {
				flowName: 'oauth-authorization-code-v7',
				specification: {
					name: 'OAuth 2.0 Authorization Framework',
					version: 'RFC 6749',
					url: 'https://tools.ietf.org/html/rfc6749',
					description:
						'The OAuth 2.0 authorization framework enables a third-party application to obtain limited access to an HTTP service.',
				},
				overview: {
					title: 'OAuth 2.0 Authorization Code Flow',
					description:
						'The most secure OAuth 2.0 flow, using a two-step process to obtain access tokens. It involves redirecting the user to an authorization server, obtaining an authorization code, and then exchanging that code for tokens.',
					keyConcepts: [
						'Authorization Server: Issues access tokens after authenticating the resource owner',
						'Resource Server: Hosts the protected resources and accepts access tokens',
						'Client: Application requesting access to protected resources',
						'Resource Owner: User who owns the protected resources',
						"Authorization Code: Temporary credential representing the resource owner's authorization",
						'Access Token: Credential used to access protected resources',
					],
					flowDiagram:
						'User → Client → Authorization Server → User → Authorization Server → Client → Resource Server',
				},
				stepByStepGuide: {
					step: 1,
					title: 'Authorization Request',
					description:
						'The client redirects the user to the authorization server with the required parameters.',
					specification: 'RFC 6749 Section 4.1.1',
					parameters: [
						{
							name: 'response_type',
							required: true,
							description: 'Must be "code" for authorization code flow',
							example: 'response_type=code',
						},
						{
							name: 'client_id',
							required: true,
							description: 'The client identifier',
							example: 'client_id=your-client-id',
						},
						{
							name: 'redirect_uri',
							required: true,
							description: 'Where to redirect after authorization',
							example: 'redirect_uri=https://app.com/callback',
						},
						{
							name: 'scope',
							required: false,
							description: 'Space-separated list of permissions',
							example: 'scope=read write',
						},
						{
							name: 'state',
							required: false,
							description: 'CSRF protection parameter',
							example: 'state=random-state-value',
						},
					],
					securityConsiderations: [
						'Always use HTTPS for authorization requests',
						'Validate redirect_uri to prevent open redirect attacks',
						'Use state parameter to prevent CSRF attacks',
						'Implement PKCE for public clients',
					],
					commonMistakes: [
						'Not validating the redirect_uri parameter',
						'Not using the state parameter for CSRF protection',
						'Exposing client credentials in the authorization URL',
						'Not implementing proper error handling',
					],
				},
				interactiveLearning: {
					quizzes: [
						{
							question: 'What is the primary purpose of the state parameter in OAuth 2.0?',
							options: [
								'To store user information',
								'To prevent CSRF attacks',
								'To encrypt the authorization code',
								'To validate the client credentials',
							],
							correctAnswer: 1,
							explanation:
								'The state parameter is used to prevent CSRF attacks by allowing the client to verify that the authorization response corresponds to the original request.',
						},
						{
							question: 'Which parameter is required in the authorization request?',
							options: ['scope', 'state', 'response_type', 'redirect_uri'],
							correctAnswer: 2,
							explanation:
								'The response_type parameter is required and must be "code" for the authorization code flow.',
						},
					],
					scenarios: [
						{
							title: 'Mobile App Authorization',
							description:
								"A mobile app needs to access a user's photos from a cloud service. How should it implement OAuth 2.0?",
							solution:
								'Use the authorization code flow with PKCE. The app should redirect to the authorization server, obtain an authorization code, and exchange it for an access token.',
							learningPoints: [
								'Mobile apps should use PKCE for security',
								'Authorization codes should be exchanged immediately',
								'Access tokens should be stored securely',
							],
						},
					],
				},
				complianceChecking: {
					validationRules: [
						{
							rule: 'response_type_validation',
							description: 'response_type must be "code" for authorization code flow',
							severity: 'error',
							specification: 'RFC 6749 Section 4.1.1',
						},
						{
							rule: 'client_id_validation',
							description: 'client_id must be present and valid',
							severity: 'error',
							specification: 'RFC 6749 Section 4.1.1',
						},
						{
							rule: 'redirect_uri_validation',
							description: 'redirect_uri must be present and match registered URI',
							severity: 'error',
							specification: 'RFC 6749 Section 4.1.1',
						},
						{
							rule: 'state_parameter_recommended',
							description: 'state parameter is recommended for CSRF protection',
							severity: 'warning',
							specification: 'RFC 6749 Section 4.1.1',
						},
					],
					bestPractices: [
						{
							practice: 'Use PKCE for public clients',
							description: 'Implement Proof Key for Code Exchange for public clients',
							benefit: 'Prevents authorization code interception attacks',
							implementation: 'Generate code_verifier and code_challenge parameters',
						},
						{
							practice: 'Validate state parameter',
							description: 'Always validate the state parameter in the callback',
							benefit: 'Prevents CSRF attacks',
							implementation: 'Store state value and compare with callback parameter',
						},
						{
							practice: 'Use secure redirect URIs',
							description: 'Only use HTTPS redirect URIs in production',
							benefit: 'Prevents token interception',
							implementation: 'Validate redirect_uri against registered URIs',
						},
					],
				},
			},
			'oidc-authorization-code-v7': {
				flowName: 'oidc-authorization-code-v7',
				specification: {
					name: 'OpenID Connect Core 1.0',
					version: 'OpenID Connect Core 1.0',
					url: 'https://openid.net/specs/openid-connect-core-1_0.html',
					description:
						'OpenID Connect 1.0 is a simple identity layer on top of the OAuth 2.0 protocol.',
				},
				overview: {
					title: 'OpenID Connect Authorization Code Flow',
					description:
						'Extends OAuth 2.0 to provide identity information through ID tokens. It follows the same pattern as OAuth 2.0 but adds identity layer with ID tokens and user information.',
					keyConcepts: [
						'ID Token: JWT containing user identity information',
						'UserInfo Endpoint: Provides additional user profile information',
						'Claims: User attributes contained in the ID token',
						'Nonce: Parameter for replay protection',
						'Issuer: The OpenID Connect provider',
						'Audience: The intended recipient of the ID token',
					],
					flowDiagram:
						'User → Client → Authorization Server → User → Authorization Server → Client → UserInfo Endpoint',
				},
				stepByStepGuide: {
					step: 1,
					title: 'Authorization Request',
					description:
						'The client redirects the user to the authorization server with OIDC-specific parameters.',
					specification: 'OpenID Connect Core 1.0 Section 3.1.2.1',
					parameters: [
						{
							name: 'response_type',
							required: true,
							description: 'Must be "code" for authorization code flow',
							example: 'response_type=code',
						},
						{
							name: 'scope',
							required: true,
							description: 'Must include "openid" scope',
							example: 'scope=openid profile email',
						},
						{
							name: 'nonce',
							required: true,
							description: 'Replay protection parameter',
							example: 'nonce=random-nonce-value',
						},
						{
							name: 'client_id',
							required: true,
							description: 'The client identifier',
							example: 'client_id=your-client-id',
						},
						{
							name: 'redirect_uri',
							required: true,
							description: 'Where to redirect after authorization',
							example: 'redirect_uri=https://app.com/callback',
						},
					],
					securityConsiderations: [
						'Always validate ID token signature',
						'Check token expiration and nonce values',
						'Verify issuer and audience claims',
						'Implement proper session management',
					],
					commonMistakes: [
						'Not validating ID token signature',
						'Not checking nonce parameter',
						'Not verifying issuer and audience claims',
						'Not handling token expiration properly',
					],
				},
				interactiveLearning: {
					quizzes: [
						{
							question: 'What is the primary purpose of the nonce parameter in OpenID Connect?',
							options: [
								'To encrypt the ID token',
								'To prevent replay attacks',
								'To validate the client credentials',
								'To store user information',
							],
							correctAnswer: 1,
							explanation:
								'The nonce parameter is used to prevent replay attacks by ensuring that each ID token is unique and cannot be reused.',
						},
						{
							question: 'Which scope is required for OpenID Connect?',
							options: ['profile', 'email', 'openid', 'address'],
							correctAnswer: 2,
							explanation:
								'The "openid" scope is required for OpenID Connect flows to indicate that the client is requesting an ID token.',
						},
					],
					scenarios: [
						{
							title: 'Single Sign-On Implementation',
							description:
								'A company wants to implement SSO across multiple applications. How should they use OpenID Connect?',
							solution:
								'Use OpenID Connect with a centralized identity provider. Each application should validate ID tokens and use the access token for API calls.',
							learningPoints: [
								'ID tokens provide user identity across applications',
								'Access tokens provide API authorization',
								'Centralized identity provider simplifies management',
							],
						},
					],
				},
				complianceChecking: {
					validationRules: [
						{
							rule: 'openid_scope_required',
							description: 'scope must include "openid" for OIDC flows',
							severity: 'error',
							specification: 'OpenID Connect Core 1.0 Section 3.1.2.1',
						},
						{
							rule: 'nonce_parameter_required',
							description: 'nonce parameter is required for ID token flows',
							severity: 'error',
							specification: 'OpenID Connect Core 1.0 Section 3.1.2.1',
						},
						{
							rule: 'id_token_validation',
							description: 'ID token must be validated according to specification',
							severity: 'error',
							specification: 'OpenID Connect Core 1.0 Section 3.1.3.7',
						},
					],
					bestPractices: [
						{
							practice: 'Validate ID token signature',
							description: 'Always validate the ID token signature using JWKS',
							benefit: 'Ensures token authenticity',
							implementation: 'Fetch JWKS and validate signature',
						},
						{
							practice: 'Check token claims',
							description: 'Validate all required claims in the ID token',
							benefit: 'Ensures token validity and security',
							implementation: 'Check iss, aud, exp, iat, and nonce claims',
						},
					],
				},
			},
		};

		return (
			contentMap[flowName] || {
				flowName,
				specification: {
					name: 'Unknown Specification',
					version: 'Unknown',
					url: '',
					description: 'No specification information available',
				},
				overview: {
					title: 'Unknown Flow',
					description: 'No overview available',
					keyConcepts: [],
					flowDiagram: '',
				},
				stepByStepGuide: {
					step: 1,
					title: 'Unknown Step',
					description: 'No step information available',
					specification: 'Unknown',
					parameters: [],
					securityConsiderations: [],
					commonMistakes: [],
				},
				interactiveLearning: {
					quizzes: [],
					scenarios: [],
				},
				complianceChecking: {
					validationRules: [],
					bestPractices: [],
				},
			}
		);
	}

	/**
	 * Get all available educational content
	 */
	static getAllEducationalContent(): V7EducationalContent[] {
		const flowNames: V7FlowName[] = [
			'oauth-authorization-code-v7',
			'oidc-authorization-code-v7',
			'oidc-hybrid-v7',
			'oauth-client-credentials-v7',
		];

		return flowNames.map((flowName) => V7EducationalContentService.getEducationalContent(flowName));
	}

	/**
	 * Get specification references for a flow
	 */
	static getSpecificationReferences(flowName: V7FlowName): Array<{
		title: string;
		url: string;
		description: string;
		section?: string;
	}> {
		const content = V7EducationalContentService.getEducationalContent(flowName);

		return [
			{
				title: content.specification.name,
				url: content.specification.url,
				description: content.specification.description,
				section: 'Main Specification',
			},
			{
				title: 'OAuth 2.0 Security Best Practices',
				url: 'https://tools.ietf.org/html/draft-ietf-oauth-security-topics',
				description: 'Security considerations for OAuth 2.0 implementations',
				section: 'Security',
			},
			{
				title: 'PKCE (RFC 7636)',
				url: 'https://tools.ietf.org/html/rfc7636',
				description: 'Proof Key for Code Exchange for OAuth 2.0',
				section: 'Security Extension',
			},
		];
	}

	/**
	 * Get interactive learning content
	 */
	static getInteractiveLearning(flowName: V7FlowName) {
		const content = V7EducationalContentService.getEducationalContent(flowName);
		return content.interactiveLearning;
	}

	/**
	 * Get compliance checking rules
	 */
	static getComplianceRules(flowName: V7FlowName) {
		const content = V7EducationalContentService.getEducationalContent(flowName);
		return content.complianceChecking;
	}

	/**
	 * Get consolidated master education content for a flow
	 * Converts the detailed educational content into a master section format
	 */
	static getMasterEducationContent(flowName: V7FlowName): MasterEducationContent {
		const content = V7EducationalContentService.getEducationalContent(flowName);
		
		const sections: EducationSectionData[] = [
			{
				id: 'overview',
				title: 'Overview',
				content: `${content.overview.title}\n\n${content.overview.description}\n\nKey Concepts:\n${content.overview.keyConcepts.map(concept => `• ${concept}`).join('\n')}`,
				oneLiner: `${content.overview.title}: ${content.overview.description.split('.')[0]}.`,
			},
			{
				id: 'specification',
				title: 'Specification',
				content: `${content.specification.name}\n\nVersion: ${content.specification.version}\nDescription: ${content.specification.description}\nURL: ${content.specification.url}`,
				oneLiner: `Based on ${content.specification.name} (${content.specification.version})`,
			},
			{
				id: 'security',
				title: 'Security Considerations',
				content: `Security Considerations:\n${content.stepByStepGuide.securityConsiderations.map((consideration, index) => `${index + 1}. ${consideration}`).join('\n')}`,
				oneLiner: `${content.stepByStepGuide.securityConsiderations.length} security considerations to keep in mind`,
			},
			{
				id: 'common-mistakes',
				title: 'Common Mistakes',
				content: `Common Implementation Mistakes:\n${content.stepByStepGuide.commonMistakes.map((mistake, index) => `${index + 1}. ${mistake}`).join('\n')}`,
				oneLiner: `Avoid ${content.stepByStepGuide.commonMistakes.length} common implementation mistakes`,
			},
		];

		return {
			id: `${flowName}-master-education`,
			title: `${content.specification.name} Educational Content`,
			sections,
		};
	}

	/**
	 * Get all master education content for all flows
	 */
	static getAllMasterEducationContent(): MasterEducationContent[] {
		const flowNames: V7FlowName[] = [
			'oauth-authorization-code-v7',
			'oidc-authorization-code-v7',
			'oauth-client-credentials-v7',
		];

		return flowNames.map((flowName) => 
			V7EducationalContentService.getMasterEducationContent(flowName)
		);
	}
}
