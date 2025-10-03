// src/services/flowStateService.ts
// Common state management patterns and configuration for V5 flows

export interface FlowStateConfig {
	flowKey: string;
	stepCount: number;
	introSectionKeys: string[];
	defaultCollapsedSections: Record<string, boolean>;
}

export interface StepConfig {
	title: string;
	subtitle: string;
	description?: string;
	requirements?: string[];
}

export type StepMetadata = {
	title: string;
	subtitle: string;
};

export type StepCompletionState = Record<number, boolean>;

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

export class FlowStateService {
	// Step metadata creation
	static createStepMetadata(steps: StepConfig[]): StepMetadata[] {
		return steps.map((step) => ({
			title: step.title,
			subtitle: step.subtitle,
		}));
	}

	// Intro section key generation based on flow type
	static createIntroSectionKeys(flowType: string): string[] {
		const baseKeys = [
			'overview',
			'flowDiagram',
			'credentials',
			'results',
			'authRequestOverview',
			'authRequestDetails',
			'introspectionOverview',
			'introspectionDetails',
			'completionOverview',
			'completionDetails',
		];

		const flowSpecificKeys: Record<string, string[]> = {
			'authorization-code': [
				'pkceOverview',
				'pkceDetails',
				'tokenExchangeOverview',
				'tokenExchangeDetails',
			],
			implicit: ['tokenResponseOverview', 'tokenResponseDetails'],
			'client-credentials': ['tokenRequestOverview', 'tokenRequestDetails'],
			'device-authorization': [
				'deviceRequestOverview',
				'deviceRequestDetails',
				'userCodeDisplayOverview',
				'userCodeDisplayDetails',
				'tokenPollingOverview',
				'tokenPollingDetails',
			],
			'resource-owner-password': ['passwordRequestOverview', 'passwordRequestDetails'],
			'jwt-bearer': ['jwtRequestOverview', 'jwtRequestDetails'],
			ciba: [
				'cibaRequestOverview',
				'cibaRequestDetails',
				'cibaPollingOverview',
				'cibaPollingDetails',
			],
			redirectless: ['redirectlessOverview', 'redirectlessDetails'],
			hybrid: ['hybridOverview', 'hybridDetails'],
		};

		const specificKeys = flowSpecificKeys[flowType] || [];
		return [...baseKeys, ...specificKeys];
	}

	// Default collapsed sections based on intro section keys
	static createDefaultCollapsedSections(keys: string[]): Record<string, boolean> {
		const defaultCollapsed: Record<string, boolean> = {};

		keys.forEach((key) => {
			// Default to collapsed for technical details, expanded for overview
			if (key.includes('Details') || key.includes('Diagram')) {
				defaultCollapsed[key] = true;
			} else if (key.includes('Overview') || key.includes('credentials')) {
				defaultCollapsed[key] = false;
			} else {
				defaultCollapsed[key] = false;
			}
		});

		return defaultCollapsed;
	}

	// Step completion state creation
	static createStepCompletions(stepCount: number): StepCompletionState {
		const completions: StepCompletionState = {};
		for (let i = 0; i < stepCount; i++) {
			completions[i] = false;
		}
		return completions;
	}

	// Flow-specific configurations
	static getFlowConfig(flowType: string): FlowStateConfig {
		const introSectionKeys = this.createIntroSectionKeys(flowType);
		const defaultCollapsedSections = this.createDefaultCollapsedSections(introSectionKeys);

		const stepCounts: Record<string, number> = {
			'authorization-code': 8,
			implicit: 5,
			'client-credentials': 4,
			'device-authorization': 6,
			'resource-owner-password': 4,
			'jwt-bearer': 4,
			ciba: 6,
			redirectless: 5,
			hybrid: 6,
		};

		return {
			flowKey: `${flowType}-v5`,
			stepCount: stepCounts[flowType] || 5,
			introSectionKeys,
			defaultCollapsedSections,
		};
	}

	// Common state handlers
	static createToggleSectionHandler(
		setCollapsedSections: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
	): (key: string) => void {
		return (key: string) => {
			setCollapsedSections((prev) => ({ ...prev, [key]: !prev[key] }));
		};
	}

	static createStepNavigationHandlers(
		currentStep: number,
		setCurrentStep: React.Dispatch<React.SetStateAction<number>>,
		stepCount: number
	): {
		handleNext: () => void;
		handlePrev: () => void;
		canNavigateNext: () => boolean;
	} {
		const handleNext = () => {
			if (currentStep < stepCount - 1) {
				setCurrentStep(currentStep + 1);
			}
		};

		const handlePrev = () => {
			if (currentStep > 0) {
				setCurrentStep(currentStep - 1);
			}
		};

		const canNavigateNext = () => {
			return currentStep < stepCount - 1;
		};

		return {
			handleNext,
			handlePrev,
			canNavigateNext,
		};
	}

	// Common field change handler
	static createFieldChangeHandler(
		controller: FlowController,
		setEmptyRequiredFields: React.Dispatch<React.SetStateAction<Set<string>>>
	): (field: string, value: string) => void {
		return (field: string, value: string) => {
			const updatedCredentials = {
				...controller.credentials,
				[field]: value,
			};
			controller.setCredentials(updatedCredentials);

			if (value.trim()) {
				setEmptyRequiredFields((prev) => {
					const next = new Set(prev);
					next.delete(field);
					return next;
				});
			} else {
				setEmptyRequiredFields((prev) => new Set(prev).add(field));
			}
		};
	}

	// Copy handler
	static createCopyHandler(
		setCopiedField: React.Dispatch<React.SetStateAction<string | null>>
	): (text: string, label: string) => void {
		return (text: string, label: string) => {
			navigator.clipboard
				.writeText(text)
				.then(() => {
					setCopiedField(label);
					setTimeout(() => setCopiedField(null), 1000);
				})
				.catch((err) => {
					console.error('Failed to copy text: ', err);
				});
		};
	}

	// Common step validation patterns
	static createStepValidationPatterns(
		flowType: string
	): Record<string, (controller: FlowController) => boolean> {
		const patterns: Record<string, Record<string, (controller: FlowController) => boolean>> = {
			'authorization-code': {
				'0': () => true, // Introduction step
				'1': (controller) =>
					!!(controller.pkceCodes?.codeVerifier && controller.pkceCodes?.codeChallenge),
				'2': (controller) => !!(controller.authUrl && controller.pkceCodes?.codeVerifier),
				'3': (controller) => !!controller.authCode,
				'4': (controller) => !!controller.tokens?.access_token,
				'5': (controller) => !!controller.tokens?.access_token,
				'6': () => true, // Completion step
				'7': () => true, // Security features step
			},
			implicit: {
				'0': () => true, // Introduction step
				'1': (controller) => !!controller.authUrl,
				'2': (controller) => !!controller.tokens,
				'3': (controller) => !!controller.tokens,
				'4': () => true, // Security features step
			},
			'client-credentials': {
				'0': () => true, // Introduction step
				'1': (controller) =>
					!!(controller.credentials?.clientId && controller.credentials?.clientSecret),
				'2': (controller) => !!controller.tokens?.access_token,
				'3': () => true, // Security features step
			},
			'device-authorization': {
				'0': () => true, // Introduction step
				'1': (controller) => !!controller.deviceCode,
				'2': (controller) => !!controller.userCode,
				'3': (controller) => !!controller.tokens?.access_token,
				'4': (controller) => !!controller.tokens?.access_token,
				'5': () => true, // Security features step
			},
		};

		return patterns[flowType] || patterns['authorization-code'];
	}

	// Common step requirements
	static createStepRequirements(flowType: string): Record<string, string[]> {
		const requirements: Record<string, Record<string, string[]>> = {
			'authorization-code': {
				'0': ['Review the flow overview and setup credentials'],
				'1': ['Generate PKCE code verifier and code challenge'],
				'2': ['Generate authorization URL with PKCE parameters'],
				'3': ['Receive authorization code from PingOne callback'],
				'4': ['Exchange authorization code for access and refresh tokens'],
				'5': ['Introspect access token to validate and inspect claims'],
				'6': ['Flow completed successfully'],
				'7': ['Demonstrate advanced security implementations'],
			},
			implicit: {
				'0': ['Review the flow overview and setup credentials'],
				'1': ['Generate authorization URL with implicit flow parameters'],
				'2': ['Receive tokens directly from URL fragment'],
				'3': ['Validate and inspect received tokens'],
				'4': ['Demonstrate advanced security implementations'],
			},
			'client-credentials': {
				'0': ['Review the flow overview and setup credentials'],
				'1': ['Configure client credentials and scopes'],
				'2': ['Exchange client credentials for access token'],
				'3': ['Demonstrate advanced security implementations'],
			},
			'device-authorization': {
				'0': ['Review the flow overview and setup credentials'],
				'1': ['Request device authorization code'],
				'2': ['Display user code and verification URL'],
				'3': ['Poll for token after user authorization'],
				'4': ['Validate and inspect received tokens'],
				'5': ['Demonstrate advanced security implementations'],
			},
		};

		return requirements[flowType] || requirements['authorization-code'];
	}

	// Common PingOne application configuration
	static getDefaultPingOneConfig(flowType: string): Record<string, unknown> {
		const baseConfig = {
			allowRedirectUriPatterns: false,
			initiateLoginUri: '',
			targetLinkUri: '',
			signoffUrls: [],
			requestParameterSignatureRequirement: 'DEFAULT',
			enableJWKS: false,
			jwksMethod: 'JWKS_URL',
			jwksUrl: '',
			jwks: '',
			requirePushedAuthorizationRequest: false,
			pushedAuthorizationRequestTimeout: 60,
			additionalRefreshTokenReplayProtection: false,
			includeX5tParameter: false,
			oidcSessionManagement: false,
			requestScopesForMultipleResources: false,
			terminateUserSessionByIdToken: false,
			corsOrigins: [],
			corsAllowAnyOrigin: false,
		};

		const flowSpecificConfigs: Record<string, Record<string, unknown>> = {
			'authorization-code': {
				...baseConfig,
				clientAuthMethod: 'client_secret_post',
				pkceEnforcement: 'REQUIRED',
				responseTypeCode: true,
				responseTypeToken: false,
				responseTypeIdToken: false,
				grantTypeAuthorizationCode: true,
			},
			implicit: {
				...baseConfig,
				clientAuthMethod: 'none',
				pkceEnforcement: 'OPTIONAL',
				responseTypeCode: false,
				responseTypeToken: true,
				responseTypeIdToken: true,
				grantTypeAuthorizationCode: false,
			},
			'client-credentials': {
				...baseConfig,
				clientAuthMethod: 'client_secret_post',
				pkceEnforcement: 'OPTIONAL',
				responseTypeCode: false,
				responseTypeToken: false,
				responseTypeIdToken: false,
				grantTypeClientCredentials: true,
			},
			'device-authorization': {
				...baseConfig,
				clientAuthMethod: 'client_secret_post',
				pkceEnforcement: 'OPTIONAL',
				responseTypeCode: false,
				responseTypeToken: false,
				responseTypeIdToken: false,
				grantTypeDeviceCode: true,
			},
		};

		return flowSpecificConfigs[flowType] || flowSpecificConfigs['authorization-code'];
	}

	// Common credential requirements
	static getRequiredCredentials(flowType: string): string[] {
		const requirements: Record<string, string[]> = {
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

		return requirements[flowType] || requirements['authorization-code'];
	}

	// Session storage helpers
	static createSessionStorageHelpers(flowKey: string) {
		return {
			saveStep: (step: number) => {
				sessionStorage.setItem(`${flowKey}-current-step`, step.toString());
			},
			loadStep: (): number => {
				const stored = sessionStorage.getItem(`${flowKey}-current-step`);
				return stored ? parseInt(stored, 10) : 0;
			},
			saveConfig: (config: Record<string, unknown>) => {
				sessionStorage.setItem(`${flowKey}-app-config`, JSON.stringify(config));
			},
			loadConfig: (): Record<string, unknown> | null => {
				const stored = sessionStorage.getItem(`${flowKey}-app-config`);
				return stored ? JSON.parse(stored) : null;
			},
			clearAll: () => {
				sessionStorage.removeItem(`${flowKey}-current-step`);
				sessionStorage.removeItem(`${flowKey}-app-config`);
			},
		};
	}
}
