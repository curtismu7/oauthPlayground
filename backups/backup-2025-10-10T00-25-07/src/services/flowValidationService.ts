// src/services/flowValidationService.ts
// Step validation logic and requirements for V5 flows

export interface FlowController {
	credentials: Record<string, string>;
	setCredentials: (credentials: Record<string, string>) => void;
	pkceCodes?: {
		codeVerifier: string;
		codeChallenge: string;
	};
	authUrl?: string;
	authCode?: string;
	tokens?: {
		access_token: string;
		refresh_token?: string;
		id_token?: string;
	};
	deviceCode?: string;
	userCode?: string;
}

export interface ValidationConfig {
	flowType: string;
	stepIndex: number;
	controller: FlowController;
	credentials?: Record<string, unknown>;
	tokens?: Record<string, unknown>;
	authCode?: string;
	authUrl?: string;
}

export interface ValidationRule {
	stepIndex: number;
	validator: (controller: FlowController) => boolean;
	requirements: string[];
	errorMessage: string;
}

export class FlowValidationService {
	// Step validation based on flow type and step index
	static validateStep(stepIndex: number, flowType: string, controller: FlowController): boolean {
		const validationRules = FlowValidationService.getValidationRules(flowType);
		const rule = validationRules.find((r) => r.stepIndex === stepIndex);

		if (!rule) {
			return true; // Default to valid if no rule found
		}

		return rule.validator(controller);
	}

	// Get step requirements for user guidance
	static getStepRequirements(stepIndex: number, flowType: string): string[] {
		const validationRules = FlowValidationService.getValidationRules(flowType);
		const rule = validationRules.find((r) => r.stepIndex === stepIndex);

		return rule ? rule.requirements : [];
	}

	// Check if user can navigate to next step
	static canNavigateNext(
		currentStep: number,
		flowType: string,
		controller: FlowController
	): boolean {
		return (
			FlowValidationService.validateStep(currentStep, flowType, controller) &&
			currentStep < FlowValidationService.getMaxStepIndex(flowType)
		);
	}

	// Get maximum step index for flow type
	static getMaxStepIndex(flowType: string): number {
		const maxSteps: Record<string, number> = {
			'authorization-code': 7,
			implicit: 4,
			'client-credentials': 3,
			'device-authorization': 5,
			'resource-owner-password': 3,
			'jwt-bearer': 3,
			ciba: 5,
			redirectless: 4,
			hybrid: 5,
		};

		return maxSteps[flowType] || 4;
	}

	// Flow-specific validation rules
	static getValidationRules(flowType: string): ValidationRule[] {
		const rules: Record<string, ValidationRule[]> = {
			'authorization-code': [
				{
					stepIndex: 0,
					validator: () => true,
					requirements: ['Review the flow overview and setup credentials'],
					errorMessage: 'Complete the introduction step',
				},
				{
					stepIndex: 1,
					validator: (controller) =>
						!!(controller.pkceCodes?.codeVerifier && controller.pkceCodes?.codeChallenge),
					requirements: ['Generate PKCE code verifier and code challenge'],
					errorMessage: 'Generate PKCE parameters before proceeding',
				},
				{
					stepIndex: 2,
					validator: (controller) => !!(controller.authUrl && controller.pkceCodes?.codeVerifier),
					requirements: ['Generate authorization URL with PKCE parameters'],
					errorMessage: 'Generate authorization URL before proceeding',
				},
				{
					stepIndex: 3,
					validator: (controller) => !!controller.authCode,
					requirements: ['Receive authorization code from PingOne callback'],
					errorMessage: 'Complete authorization to receive authorization code',
				},
				{
					stepIndex: 4,
					validator: (controller) => !!controller.tokens?.access_token,
					requirements: ['Exchange authorization code for access and refresh tokens'],
					errorMessage: 'Exchange authorization code for tokens before proceeding',
				},
				{
					stepIndex: 5,
					validator: (controller) => !!controller.tokens?.access_token,
					requirements: ['Introspect access token to validate and inspect claims'],
					errorMessage: 'Complete token introspection before proceeding',
				},
				{
					stepIndex: 6,
					validator: () => true,
					requirements: ['Flow completed successfully'],
					errorMessage: 'Complete the flow',
				},
				{
					stepIndex: 7,
					validator: () => true,
					requirements: ['Demonstrate advanced security implementations'],
					errorMessage: 'Complete security features demonstration',
				},
			],
			implicit: [
				{
					stepIndex: 0,
					validator: () => true,
					requirements: ['Review the flow overview and setup credentials'],
					errorMessage: 'Complete the introduction step',
				},
				{
					stepIndex: 1,
					validator: (controller) => !!controller.authUrl,
					requirements: ['Generate authorization URL with implicit flow parameters'],
					errorMessage: 'Generate authorization URL before proceeding',
				},
				{
					stepIndex: 2,
					validator: (controller) => !!controller.tokens,
					requirements: ['Receive tokens directly from URL fragment'],
					errorMessage: 'Complete authorization to receive tokens',
				},
				{
					stepIndex: 3,
					validator: (controller) => !!controller.tokens,
					requirements: ['Validate and inspect received tokens'],
					errorMessage: 'Complete token validation before proceeding',
				},
				{
					stepIndex: 4,
					validator: () => true,
					requirements: ['Demonstrate advanced security implementations'],
					errorMessage: 'Complete security features demonstration',
				},
			],
			'client-credentials': [
				{
					stepIndex: 0,
					validator: () => true,
					requirements: ['Review the flow overview and setup credentials'],
					errorMessage: 'Complete the introduction step',
				},
				{
					stepIndex: 1,
					validator: (controller) =>
						!!(controller.credentials?.clientId && controller.credentials?.clientSecret),
					requirements: ['Configure client credentials and scopes'],
					errorMessage: 'Configure client credentials before proceeding',
				},
				{
					stepIndex: 2,
					validator: (controller) => !!controller.tokens?.access_token,
					requirements: ['Exchange client credentials for access token'],
					errorMessage: 'Exchange credentials for token before proceeding',
				},
				{
					stepIndex: 3,
					validator: () => true,
					requirements: ['Demonstrate advanced security implementations'],
					errorMessage: 'Complete security features demonstration',
				},
			],
			'device-authorization': [
				{
					stepIndex: 0,
					validator: () => true,
					requirements: ['Review the flow overview and setup credentials'],
					errorMessage: 'Complete the introduction step',
				},
				{
					stepIndex: 1,
					validator: (controller) => !!controller.deviceCode,
					requirements: ['Request device authorization code'],
					errorMessage: 'Request device code before proceeding',
				},
				{
					stepIndex: 2,
					validator: (controller) => !!controller.userCode,
					requirements: ['Display user code and verification URL'],
					errorMessage: 'Display user code before proceeding',
				},
				{
					stepIndex: 3,
					validator: (controller) => !!controller.tokens?.access_token,
					requirements: ['Poll for token after user authorization'],
					errorMessage: 'Complete user authorization and token polling',
				},
				{
					stepIndex: 4,
					validator: (controller) => !!controller.tokens?.access_token,
					requirements: ['Validate and inspect received tokens'],
					errorMessage: 'Complete token validation before proceeding',
				},
				{
					stepIndex: 5,
					validator: () => true,
					requirements: ['Demonstrate advanced security implementations'],
					errorMessage: 'Complete security features demonstration',
				},
			],
		};

		return rules[flowType] || rules['authorization-code'];
	}

	// Common validation patterns
	static validateCredentials(
		credentials: Record<string, unknown>,
		requiredFields: string[]
	): boolean {
		return requiredFields.every((field) => {
			const value = credentials[field];
			return value && typeof value === 'string' && value.trim().length > 0;
		});
	}

	static validateTokens(tokens: Record<string, unknown>, requiredTokens: string[]): boolean {
		if (!tokens) return false;
		return requiredTokens.every((token) => tokens[token]);
	}

	static validateAuthCode(authCode: string): boolean {
		return !!(authCode && authCode.trim().length > 0);
	}

	static validateAuthUrl(authUrl: string): boolean {
		return !!(authUrl && authUrl.startsWith('https://'));
	}

	static validatePkceCodes(pkceCodes: Record<string, unknown>): boolean {
		return !!(pkceCodes?.codeVerifier && pkceCodes?.codeChallenge);
	}

	static validateDeviceCode(deviceCode: string): boolean {
		return !!(deviceCode && deviceCode.trim().length > 0);
	}

	static validateUserCode(userCode: string): boolean {
		return !!(userCode && userCode.trim().length > 0);
	}

	// Get required fields for flow type
	static getRequiredFields(flowType: string): string[] {
		const requiredFields: Record<string, string[]> = {
			'authorization-code': ['environmentId', 'clientId', 'clientSecret', 'redirectUri'],
			implicit: ['environmentId', 'clientId', 'redirectUri'],
			'client-credentials': ['environmentId', 'clientId', 'clientSecret'],
			'device-authorization': ['environmentId', 'clientId', 'clientSecret'],
			'resource-owner-password': [
				'environmentId',
				'clientId',
				'clientSecret',
				'username',
				'password',
			],
			'jwt-bearer': ['environmentId', 'clientId', 'privateKey'],
		};

		return requiredFields[flowType] || requiredFields['authorization-code'];
	}

	// Get required tokens for flow type
	static getRequiredTokens(flowType: string): string[] {
		const requiredTokens: Record<string, string[]> = {
			'authorization-code': ['access_token'],
			implicit: ['access_token'],
			'client-credentials': ['access_token'],
			'device-authorization': ['access_token'],
			'resource-owner-password': ['access_token'],
			'jwt-bearer': ['access_token'],
		};

		return requiredTokens[flowType] || requiredTokens['authorization-code'];
	}

	// Create validation error message
	static createValidationErrorMessage(stepIndex: number, flowType: string): string {
		const rule = FlowValidationService.getValidationRules(flowType).find(
			(r) => r.stepIndex === stepIndex
		);
		return rule ? rule.errorMessage : 'Complete the required actions before proceeding';
	}

	// Check if step is completion step
	static isCompletionStep(stepIndex: number, flowType: string): boolean {
		const maxStep = FlowValidationService.getMaxStepIndex(flowType);
		return stepIndex === maxStep;
	}

	// Check if step is security features step
	static isSecurityFeaturesStep(stepIndex: number, flowType: string): boolean {
		const maxStep = FlowValidationService.getMaxStepIndex(flowType);
		return stepIndex === maxStep;
	}

	// Get step type for UI rendering
	static getStepType(
		stepIndex: number,
		flowType: string
	):
		| 'introduction'
		| 'configuration'
		| 'authorization'
		| 'token-exchange'
		| 'validation'
		| 'completion'
		| 'security' {
		if (stepIndex === 0) return 'introduction';
		if (stepIndex === 1) return 'configuration';

		const maxStep = FlowValidationService.getMaxStepIndex(flowType);
		if (stepIndex === maxStep) return 'security';
		if (stepIndex === maxStep - 1) return 'completion';

		// Flow-specific logic
		if (flowType === 'authorization-code') {
			if (stepIndex === 2) return 'authorization';
			if (stepIndex === 3) return 'authorization';
			if (stepIndex === 4) return 'token-exchange';
			if (stepIndex === 5) return 'validation';
		}

		if (flowType === 'implicit') {
			if (stepIndex === 2) return 'token-exchange';
			if (stepIndex === 3) return 'validation';
		}

		if (flowType === 'client-credentials') {
			if (stepIndex === 2) return 'token-exchange';
		}

		if (flowType === 'device-authorization') {
			if (stepIndex === 2) return 'authorization';
			if (stepIndex === 3) return 'token-exchange';
			if (stepIndex === 4) return 'validation';
		}

		return 'configuration';
	}

	// Get step priority for UI highlighting
	static getStepPriority(stepIndex: number, flowType: string): 'high' | 'medium' | 'low' {
		const stepType = FlowValidationService.getStepType(stepIndex, flowType);

		if (stepType === 'introduction' || stepType === 'security') return 'low';
		if (stepType === 'configuration' || stepType === 'token-exchange') return 'high';
		if (stepType === 'authorization' || stepType === 'validation') return 'medium';

		return 'medium';
	}

	// Check if step has prerequisites
	static hasPrerequisites(stepIndex: number, flowType: string): boolean {
		if (stepIndex === 0) return false;

		const rules = FlowValidationService.getValidationRules(flowType);
		const rule = rules.find((r) => r.stepIndex === stepIndex);

		return rule ? rule.requirements.length > 0 : false;
	}

	// Get prerequisite steps
	static getPrerequisiteSteps(stepIndex: number, flowType: string): number[] {
		const prerequisites: Record<string, Record<number, number[]>> = {
			'authorization-code': {
				1: [0],
				2: [0, 1],
				3: [0, 1, 2],
				4: [0, 1, 2, 3],
				5: [0, 1, 2, 3, 4],
				6: [0, 1, 2, 3, 4, 5],
				7: [0, 1, 2, 3, 4, 5, 6],
			},
			implicit: {
				1: [0],
				2: [0, 1],
				3: [0, 1, 2],
				4: [0, 1, 2, 3],
			},
			'client-credentials': {
				1: [0],
				2: [0, 1],
				3: [0, 1, 2],
			},
			'device-authorization': {
				1: [0],
				2: [0, 1],
				3: [0, 1, 2],
				4: [0, 1, 2, 3],
				5: [0, 1, 2, 3, 4],
			},
		};

		return prerequisites[flowType]?.[stepIndex] || [];
	}
}
