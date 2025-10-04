// src/services/flowStepService.ts
// FlowStepService - Standardized step content generation and management

import React from 'react';

export interface StepConfig {
	stepIndex: number;
	title: string;
	subtitle: string;
	content: StepContent;
	validation: StepValidation;
	requirements: string[];
	theme?: string;
}

export interface StepContent {
	type: 'introduction' | 'credentials' | 'request' | 'response' | 'validation' | 'completion';
	components: StepComponent[];
	collapsibleSections?: CollapsibleSection[];
}

export interface StepComponent {
	type: 'info' | 'warning' | 'success' | 'danger' | 'form' | 'button' | 'code' | 'diagram' | 'list';
	props: Record<string, any>;
	content?: React.ReactNode;
}

export interface CollapsibleSection {
	key: string;
	title: string;
	icon?: string;
	content: React.ReactNode;
	defaultCollapsed?: boolean;
}

export interface StepValidation {
	isStepValid: (stepIndex: number) => boolean;
	getStepRequirements: (stepIndex: number) => string[];
}

export interface StepMetadata {
	title: string;
	subtitle: string;
	stepIndex: number;
	isComplete: boolean;
	isValid: boolean;
	requirements: string[];
}

export class FlowStepService {
	/**
	 * Create step content based on flow type and step index
	 */
	static createStepContent(
		flowType: string,
		stepIndex: number,
		controller: any,
		theme: string = 'blue'
	): StepContent {
		switch (flowType) {
			case 'implicit':
				return this.createImplicitStepContent(stepIndex, controller, theme);
			case 'authorization-code':
				return this.createAuthorizationCodeStepContent(stepIndex, controller, theme);
			case 'client-credentials':
				return this.createClientCredentialsStepContent(stepIndex, controller, theme);
			case 'device-authorization':
				return this.createDeviceAuthorizationStepContent(stepIndex, controller, theme);
			case 'resource-owner-password':
				return this.createResourceOwnerPasswordStepContent(stepIndex, controller, theme);
			case 'jwt-bearer':
				return this.createJWTBearerStepContent(stepIndex, controller, theme);
			case 'ciba':
				return this.createCIBAStepContent(stepIndex, controller, theme);
			case 'hybrid':
				return this.createHybridStepContent(stepIndex, controller, theme);
			case 'redirectless':
				return this.createRedirectlessStepContent(stepIndex, controller, theme);
			case 'token-introspection':
				return this.createTokenIntrospectionStepContent(stepIndex, controller, theme);
			case 'token-revocation':
				return this.createTokenRevocationStepContent(stepIndex, controller, theme);
			case 'user-info':
				return this.createUserInfoStepContent(stepIndex, controller, theme);
			default:
				return this.createDefaultStepContent(stepIndex, controller, theme);
		}
	}

	/**
	 * Generate step metadata
	 */
	static generateStepMetadata(steps: StepConfig[]): StepMetadata[] {
		return steps.map((step) => ({
			title: step.title,
			subtitle: step.subtitle,
			stepIndex: step.stepIndex,
			isComplete: false, // This would be determined by the controller
			isValid: false, // This would be determined by the validation
			requirements: step.requirements,
		}));
	}

	/**
	 * Create step validation
	 */
	static createStepValidation(flowType: string, controller: any): StepValidation {
		const isStepValid = (stepIndex: number): boolean => {
			// This would use the FlowControllerService validation
			return true; // Placeholder
		};

		const getStepRequirements = (stepIndex: number): string[] => {
			return this.getStepRequirements(flowType, stepIndex);
		};

		return { isStepValid, getStepRequirements };
	}

	/**
	 * Get step requirements for a specific flow type and step
	 */
	static getStepRequirements(flowType: string, stepIndex: number): string[] {
		const requirements = {
			implicit: {
				0: ['Complete the introduction and setup'],
				1: ['Configure credentials and generate authorization URL'],
				2: ['Complete authorization and receive tokens'],
				3: ['Validate and inspect received tokens'],
				4: ['Review results and next steps'],
			},
			'authorization-code': {
				0: ['Complete the introduction and setup'],
				1: ['Configure credentials and generate authorization URL'],
				2: ['Complete authorization and exchange code for tokens'],
				3: ['Validate and inspect received tokens'],
				4: ['Review results and next steps'],
			},
			'client-credentials': {
				0: ['Complete the introduction and setup'],
				1: ['Configure client credentials'],
				2: ['Request access token using client credentials'],
				3: ['Review results and next steps'],
			},
			'device-authorization': {
				0: ['Complete the introduction and setup'],
				1: ['Configure credentials and request device code'],
				2: ['Complete device authorization'],
				3: ['Poll for tokens'],
				4: ['Review results and next steps'],
			},
			'resource-owner-password': {
				0: ['Complete the introduction and setup'],
				1: ['Configure credentials and user credentials'],
				2: ['Request access token using user credentials'],
				3: ['Review results and next steps'],
			},
			'jwt-bearer': {
				0: ['Complete the introduction and setup'],
				1: ['Configure JWT signing key'],
				2: ['Request access token using JWT assertion'],
				3: ['Review results and next steps'],
			},
			ciba: {
				0: ['Complete the introduction and setup'],
				1: ['Configure credentials and initiate CIBA request'],
				2: ['Complete CIBA authentication'],
				3: ['Poll for tokens'],
				4: ['Review results and next steps'],
			},
			hybrid: {
				0: ['Complete the introduction and setup'],
				1: ['Configure credentials and generate authorization URL'],
				2: ['Complete authorization and receive tokens'],
				3: ['Validate and inspect received tokens'],
				4: ['Review results and next steps'],
			},
			redirectless: {
				0: ['Complete the introduction and setup'],
				1: ['Generate PKCE parameters'],
				2: ['Build authorization URL with response_mode=pi.flow'],
				3: ['Receive and process flow object'],
				4: ['Receive tokens in JSON format'],
				5: ['Review results and next steps'],
			},
			'token-introspection': {
				0: ['Complete the introduction and setup'],
				1: ['Configure credentials and access token'],
				2: ['Introspect the access token'],
				3: ['Review results and next steps'],
			},
			'token-revocation': {
				0: ['Complete the introduction and setup'],
				1: ['Configure credentials and access token'],
				2: ['Revoke the access token'],
				3: ['Review results and next steps'],
			},
			'user-info': {
				0: ['Complete the introduction and setup'],
				1: ['Configure access token'],
				2: ['Request user information'],
				3: ['Review results and next steps'],
			},
		};

		const flowRequirements = requirements[flowType as keyof typeof requirements];
		return flowRequirements?.[stepIndex as keyof typeof flowRequirements] || [];
	}

	/**
	 * Flow-specific step content creators
	 */
	private static createImplicitStepContent(
		stepIndex: number,
		controller: any,
		theme: string
	): StepContent {
		switch (stepIndex) {
			case 0:
				return {
					type: 'introduction',
					components: [
						{
							type: 'warning',
							props: { variant: 'warning' },
							content:
								'The Implicit Flow is considered legacy and less secure than Authorization Code with PKCE.',
						},
						{
							type: 'info',
							props: { variant: 'info' },
							content:
								'This flow returns tokens directly in the URL fragment, making them vulnerable to interception.',
						},
					],
					collapsibleSections: [
						{
							key: 'overview',
							title: 'Implicit Flow Overview',
							icon: 'info',
							content: 'Detailed overview of the implicit flow...',
							defaultCollapsed: false,
						},
						{
							key: 'flowDiagram',
							title: 'Flow Diagram',
							icon: 'diagram',
							content: 'Visual representation of the flow...',
							defaultCollapsed: true,
						},
					],
				};
			case 1:
				return {
					type: 'request',
					components: [
						{
							type: 'form',
							props: { type: 'credentials' },
							content: 'Credentials input form',
						},
						{
							type: 'button',
							props: { variant: 'primary', action: 'generateAuthUrl' },
							content: 'Generate Authorization URL',
						},
					],
				};
			case 2:
				return {
					type: 'response',
					components: [
						{
							type: 'code',
							props: { language: 'json' },
							content: controller.tokens
								? JSON.stringify(controller.tokens, null, 2)
								: 'No tokens received',
						},
					],
				};
			case 3:
				return {
					type: 'validation',
					components: [
						{
							type: 'form',
							props: { type: 'tokenIntrospection' },
							content: 'Token introspection form',
						},
					],
				};
			case 4:
				return {
					type: 'completion',
					components: [
						{
							type: 'success',
							props: { variant: 'success' },
							content: 'Flow completed successfully!',
						},
					],
				};
			default:
				return this.createDefaultStepContent(stepIndex, controller, theme);
		}
	}

	private static createAuthorizationCodeStepContent(
		stepIndex: number,
		controller: any,
		theme: string
	): StepContent {
		// Similar structure to implicit but with authorization code specific content
		return this.createDefaultStepContent(stepIndex, controller, theme);
	}

	private static createClientCredentialsStepContent(
		stepIndex: number,
		controller: any,
		theme: string
	): StepContent {
		// Client credentials specific content
		return this.createDefaultStepContent(stepIndex, controller, theme);
	}

	private static createDeviceAuthorizationStepContent(
		stepIndex: number,
		controller: any,
		theme: string
	): StepContent {
		// Device authorization specific content
		return this.createDefaultStepContent(stepIndex, controller, theme);
	}

	private static createResourceOwnerPasswordStepContent(
		stepIndex: number,
		controller: any,
		theme: string
	): StepContent {
		// Resource owner password specific content
		return this.createDefaultStepContent(stepIndex, controller, theme);
	}

	private static createJWTBearerStepContent(
		stepIndex: number,
		controller: any,
		theme: string
	): StepContent {
		// JWT bearer specific content
		return this.createDefaultStepContent(stepIndex, controller, theme);
	}

	private static createCIBAStepContent(
		stepIndex: number,
		controller: any,
		theme: string
	): StepContent {
		// CIBA specific content
		return this.createDefaultStepContent(stepIndex, controller, theme);
	}

	private static createHybridStepContent(
		stepIndex: number,
		controller: any,
		theme: string
	): StepContent {
		switch (stepIndex) {
			case 0:
				return {
					type: 'introduction',
					components: [
						{
							type: 'info',
							props: { variant: 'info' },
							content: 'OIDC Hybrid Flow combines elements of authorization code and implicit flows, allowing for both frontend and backend token handling.'
						},
						{
							type: 'form',
							props: { type: 'credentials' },
							content: 'Configure your OIDC credentials and settings'
						}
					],
					collapsibleSections: [
						{
							key: 'overview',
							title: 'Flow Overview',
							icon: 'info',
							content: 'Understand the OIDC Hybrid Flow process and its benefits'
						},
						{
							key: 'credentials',
							title: 'Credentials Configuration',
							icon: 'key',
							content: 'Set up your OIDC provider credentials and configuration'
						}
					]
				};
			case 1:
				return {
					type: 'request',
					components: [
						{
							type: 'info',
							props: { variant: 'info' },
							content: 'Build and launch the authorization request URL'
						},
						{
							type: 'button',
							props: { variant: 'primary', action: 'generateAuthUrl' },
							content: 'Generate Authorization URL'
						}
					]
				};
			case 2:
				return {
					type: 'response',
					components: [
						{
							type: 'info',
							props: { variant: 'success' },
							content: 'Process the authorization response and validate received tokens'
						},
						{
							type: 'code',
							props: { language: 'json' },
							content: 'Authorization response details'
						}
					]
				};
			case 3:
				return {
					type: 'validation',
					components: [
						{
							type: 'info',
							props: { variant: 'warning' },
							content: 'Exchange authorization code for additional tokens if needed'
						}
					]
				};
			case 4:
				return {
					type: 'completion',
					components: [
						{
							type: 'success',
							props: { variant: 'success' },
							content: 'All tokens received and validated successfully'
						},
						{
							type: 'code',
							props: { language: 'json' },
							content: 'Token details and validation results'
						}
					]
				};
			case 5:
			case 6:
				return {
					type: 'completion',
					components: [
						{
							type: 'success',
							props: { variant: 'success' },
							content: 'OIDC Hybrid Flow completed successfully'
						},
						{
							type: 'info',
							props: { variant: 'info' },
							content: 'Flow summary and next steps'
						}
					]
				};
			default:
				return this.createDefaultStepContent(stepIndex, controller, theme);
		}
	}

	private static createRedirectlessStepContent(
		stepIndex: number,
		controller: any,
		theme: string
	): StepContent {
		// Redirectless specific content
		return this.createDefaultStepContent(stepIndex, controller, theme);
	}

	private static createTokenIntrospectionStepContent(
		stepIndex: number,
		controller: any,
		theme: string
	): StepContent {
		// Token introspection specific content
		return this.createDefaultStepContent(stepIndex, controller, theme);
	}

	private static createTokenRevocationStepContent(
		stepIndex: number,
		controller: any,
		theme: string
	): StepContent {
		// Token revocation specific content
		return this.createDefaultStepContent(stepIndex, controller, theme);
	}

	private static createUserInfoStepContent(
		stepIndex: number,
		controller: any,
		theme: string
	): StepContent {
		// User info specific content
		return this.createDefaultStepContent(stepIndex, controller, theme);
	}

	private static createDefaultStepContent(
		stepIndex: number,
		controller: any,
		theme: string
	): StepContent {
		return {
			type: 'introduction',
			components: [
				{
					type: 'info',
					props: { variant: 'info' },
					content: `Step ${stepIndex + 1} content`,
				},
			],
		};
	}

	/**
	 * Create a step configuration
	 */
	static createStepConfig(
		stepIndex: number,
		title: string,
		subtitle: string,
		flowType: string,
		controller: any,
		theme: string = 'blue'
	): StepConfig {
		const content = this.createStepContent(flowType, stepIndex, controller, theme);
		const validation = this.createStepValidation(flowType, controller);
		const requirements = this.getStepRequirements(flowType, stepIndex);

		return {
			stepIndex,
			title,
			subtitle,
			content,
			validation,
			requirements,
			theme,
		};
	}

	/**
	 * Create multiple step configurations
	 */
	static createStepConfigs(
		steps: Array<{ title: string; subtitle: string }>,
		flowType: string,
		controller: any,
		theme: string = 'blue'
	): StepConfig[] {
		return steps.map((step, index) =>
			this.createStepConfig(index, step.title, step.subtitle, flowType, controller, theme)
		);
	}
}

export default FlowStepService;
