// src/services/flowConfigService.ts
// FlowConfigService - Centralized flow configuration management

export interface FlowConfig {
	flowType: string;
	flowName: string;
	flowVersion: string;
	flowTheme: string;
	flowKey: string;
	flowVariant: 'oauth' | 'oidc' | 'pingone';
	stepConfigs: StepConfig[];
	introSectionKeys: string[];
	validationRules: ValidationRule[];
	requirements: FlowRequirements;
	enableDebugger?: boolean;
	category: 'standard' | 'experimental' | 'deprecated' | 'pingone';
}

export interface StepConfig {
	stepIndex: number;
	title: string;
	subtitle: string;
	type: 'introduction' | 'credentials' | 'request' | 'response' | 'validation' | 'completion';
	requirements: string[];
	validation: StepValidation;
}

export interface StepValidation {
	isStepValid: (stepIndex: number, controller: any) => boolean;
	getStepRequirements: (stepIndex: number) => string[];
}

export interface ValidationRule {
	stepIndex: number;
	field: string;
	required: boolean;
	type?: 'string' | 'number' | 'boolean' | 'object';
	minLength?: number;
	maxLength?: number;
	pattern?: RegExp;
	custom?: (value: any) => boolean;
}

export interface FlowRequirements {
	credentials: string[];
	endpoints: string[];
	scopes: string[];
	responseTypes: string[];
	grantTypes: string[];
	additionalRequirements?: string[];
}

export class FlowConfigService {
	private static flowConfigs: Map<string, FlowConfig> = new Map();

	/**
	 * Initialize default flow configurations
	 */
	static initializeDefaultConfigs(): void {
		// OAuth 2.0 Flows
		FlowConfigService.registerFlow('implicit', FlowConfigService.createImplicitConfig());
		FlowConfigService.registerFlow('authorization-code', FlowConfigService.createAuthorizationCodeConfig());
		FlowConfigService.registerFlow('client-credentials', FlowConfigService.createClientCredentialsConfig());
		FlowConfigService.registerFlow('device-authorization', FlowConfigService.createDeviceAuthorizationConfig());
		FlowConfigService.registerFlow('resource-owner-password', FlowConfigService.createResourceOwnerPasswordConfig());
		FlowConfigService.registerFlow('jwt-bearer', FlowConfigService.createJWTBearerConfig());

		// OIDC Flows
		FlowConfigService.registerFlow('oidc-authorization-code', FlowConfigService.createOIDCAuthorizationCodeConfig());
		FlowConfigService.registerFlow('oidc-implicit', FlowConfigService.createOIDCImplicitConfig());
		FlowConfigService.registerFlow('oidc-hybrid', FlowConfigService.createOIDCHybridConfig());
		FlowConfigService.registerFlow('oidc-client-credentials', FlowConfigService.createOIDCClientCredentialsConfig());
		FlowConfigService.registerFlow('oidc-device-authorization', FlowConfigService.createOIDCDeviceAuthorizationConfig());
		FlowConfigService.registerFlow('oidc-ciba', FlowConfigService.createOIDCCIBAConfig());

		// PingOne Flows
		FlowConfigService.registerFlow('worker-token', FlowConfigService.createWorkerTokenConfig());
		FlowConfigService.registerFlow('pingone-par', FlowConfigService.createPingOnePARConfig());
		FlowConfigService.registerFlow('redirectless', FlowConfigService.createRedirectlessConfig());

		// Token Management Flows
		FlowConfigService.registerFlow('token-introspection', FlowConfigService.createTokenIntrospectionConfig());
		FlowConfigService.registerFlow('token-revocation', FlowConfigService.createTokenRevocationConfig());
		FlowConfigService.registerFlow('user-info', FlowConfigService.createUserInfoConfig());
	}

	/**
	 * Register a flow configuration
	 */
	static registerFlow(flowType: string, config: FlowConfig): void {
		FlowConfigService.flowConfigs.set(flowType, config);
	}

	/**
	 * Get a flow configuration
	 */
	static getFlowConfig(flowType: string): FlowConfig | undefined {
		return FlowConfigService.flowConfigs.get(flowType);
	}

	/**
	 * Get all flow configurations
	 */
	static getAllFlowConfigs(): FlowConfig[] {
		return Array.from(FlowConfigService.flowConfigs.values());
	}

	/**
	 * Get flows by category
	 */
	static getFlowsByCategory(category: string): FlowConfig[] {
		return Array.from(FlowConfigService.flowConfigs.values()).filter((flow) => flow.category === category);
	}

	/**
	 * Get flows by variant
	 */
	static getFlowsByVariant(variant: 'oauth' | 'oidc' | 'pingone'): FlowConfig[] {
		return Array.from(FlowConfigService.flowConfigs.values()).filter((flow) => flow.flowVariant === variant);
	}

	/**
	 * Create a custom flow configuration
	 */
	static createCustomFlowConfig(flowType: string, customConfig: Partial<FlowConfig>): FlowConfig {
		const baseConfig = FlowConfigService.getFlowConfig(flowType) || FlowConfigService.createDefaultConfig(flowType);
		return { ...baseConfig, ...customConfig };
	}

	/**
	 * Create step configuration
	 */
	static createStepConfig(
		stepIndex: number,
		title: string,
		subtitle: string,
		type: StepConfig['type'],
		requirements: string[] = []
	): StepConfig {
		return {
			stepIndex,
			title,
			subtitle,
			type,
			requirements,
			validation: {
				isStepValid: () => true, // Default validation
				getStepRequirements: () => requirements,
			},
		};
	}

	/**
	 * Create validation rule
	 */
	static createValidationRule(
		stepIndex: number,
		field: string,
		required: boolean = true,
		type: ValidationRule['type'] = 'string'
	): ValidationRule {
		return {
			stepIndex,
			field,
			required,
			type,
		};
	}

	/**
	 * Create flow requirements
	 */
	static createFlowRequirements(
		credentials: string[] = [],
		endpoints: string[] = [],
		scopes: string[] = [],
		responseTypes: string[] = [],
		grantTypes: string[] = []
	): FlowRequirements {
		return {
			credentials,
			endpoints,
			scopes,
			responseTypes,
			grantTypes,
		};
	}

	/**
	 * Flow-specific configuration creators
	 */
	private static createImplicitConfig(): FlowConfig {
		return {
			flowType: 'implicit',
			flowName: 'OAuth 2.0 Implicit Flow',
			flowVersion: 'V5',
			flowTheme: 'orange',
			flowKey: 'oauth-implicit-v5',
			flowVariant: 'oauth',
			category: 'deprecated',
			stepConfigs: [
				FlowConfigService.createStepConfig(
					0,
					'Step 0: Introduction & Setup',
					'Understand the Implicit Flow',
					'introduction'
				),
				FlowConfigService.createStepConfig(
					1,
					'Step 1: Authorization Request',
					'Build and launch the authorization URL',
					'request'
				),
				FlowConfigService.createStepConfig(
					2,
					'Step 2: Token Response',
					'Receive tokens directly from URL fragment',
					'response'
				),
				FlowConfigService.createStepConfig(
					3,
					'Step 3: Token Introspection',
					'Validate and inspect tokens',
					'validation'
				),
				FlowConfigService.createStepConfig(
					4,
					'Step 4: Security Features',
					'Advanced security demonstrations',
					'completion'
				),
			],
			introSectionKeys: ['overview', 'flowDiagram', 'credentials', 'results'],
			validationRules: [
				FlowConfigService.createValidationRule(1, 'authUrl', true),
				FlowConfigService.createValidationRule(2, 'tokens', true),
			],
			requirements: FlowConfigService.createFlowRequirements(
				['clientId', 'clientSecret'],
				['authorizationEndpoint'],
				['openid', 'profile', 'email'],
				['token'],
				['implicit']
			),
			enableDebugger: true,
		};
	}

	private static createAuthorizationCodeConfig(): FlowConfig {
		return {
			flowType: 'authorization-code',
			flowName: 'OAuth 2.0 Authorization Code Flow',
			flowVersion: 'V5',
			flowTheme: 'blue',
			flowKey: 'oauth-authorization-code-v5',
			flowVariant: 'oauth',
			category: 'standard',
			stepConfigs: [
				FlowConfigService.createStepConfig(
					0,
					'Step 0: Introduction & Setup',
					'Understand the Authorization Code Flow',
					'introduction'
				),
				FlowConfigService.createStepConfig(
					1,
					'Step 1: Authorization Request',
					'Build and launch the authorization URL',
					'request'
				),
				FlowConfigService.createStepConfig(
					2,
					'Step 2: Code Exchange',
					'Exchange authorization code for tokens',
					'response'
				),
				FlowConfigService.createStepConfig(
					3,
					'Step 3: Token Introspection',
					'Validate and inspect tokens',
					'validation'
				),
				FlowConfigService.createStepConfig(
					4,
					'Step 4: Security Features',
					'Advanced security demonstrations',
					'completion'
				),
			],
			introSectionKeys: ['overview', 'flowDiagram', 'credentials', 'results'],
			validationRules: [
				FlowConfigService.createValidationRule(1, 'authUrl', true),
				FlowConfigService.createValidationRule(2, 'tokens', true),
			],
			requirements: FlowConfigService.createFlowRequirements(
				['clientId', 'clientSecret'],
				['authorizationEndpoint', 'tokenEndpoint'],
				['openid', 'profile', 'email'],
				['code'],
				['authorization_code']
			),
			enableDebugger: true,
		};
	}

	private static createClientCredentialsConfig(): FlowConfig {
		return {
			flowType: 'client-credentials',
			flowName: 'OAuth 2.0 Client Credentials Flow',
			flowVersion: 'V5',
			flowTheme: 'green',
			flowKey: 'client-credentials-v5',
			flowVariant: 'oauth',
			category: 'standard',
			stepConfigs: [
				FlowConfigService.createStepConfig(
					0,
					'Step 0: Introduction & Setup',
					'Understand the Client Credentials Flow',
					'introduction'
				),
				FlowConfigService.createStepConfig(
					1,
					'Step 1: Client Authentication',
					'Configure client credentials',
					'credentials'
				),
				FlowConfigService.createStepConfig(
					2,
					'Step 2: Token Request',
					'Request access token using client credentials',
					'request'
				),
				FlowConfigService.createStepConfig(
					3,
					'Step 3: Token Response',
					'Review the received access token',
					'response'
				),
				FlowConfigService.createStepConfig(
					4,
					'Step 4: Security Features',
					'Advanced security demonstrations',
					'completion'
				),
			],
			introSectionKeys: ['overview', 'flowDiagram', 'credentials', 'results'],
			validationRules: [
				FlowConfigService.createValidationRule(1, 'clientId', true),
				FlowConfigService.createValidationRule(1, 'clientSecret', true),
				FlowConfigService.createValidationRule(2, 'tokens', true),
			],
			requirements: FlowConfigService.createFlowRequirements(
				['clientId', 'clientSecret'],
				['tokenEndpoint'],
				['api:read', 'api:write'],
				[],
				['client_credentials']
			),
			enableDebugger: true,
		};
	}

	private static createDeviceAuthorizationConfig(): FlowConfig {
		return {
			flowType: 'device-authorization',
			flowName: 'OAuth 2.0 Device Authorization Flow',
			flowVersion: 'V6',
			flowTheme: 'purple',
			flowKey: 'device-authorization-v6',
			flowVariant: 'oauth',
			category: 'standard',
			stepConfigs: [
				FlowConfigService.createStepConfig(
					0,
					'Step 0: Introduction & Setup',
					'Understand the Device Authorization Flow',
					'introduction'
				),
				FlowConfigService.createStepConfig(
					1,
					'Step 1: Device Code Request',
					'Request device code from authorization server',
					'request'
				),
				FlowConfigService.createStepConfig(
					2,
					'Step 2: User Authorization',
					'Complete authorization on device',
					'response'
				),
				FlowConfigService.createStepConfig(3, 'Step 3: Token Polling', 'Poll for tokens', 'validation'),
				FlowConfigService.createStepConfig(
					4,
					'Step 4: Token Response',
					'Review the received tokens',
					'response'
				),
				FlowConfigService.createStepConfig(5, 'Step 5: Complete', 'Review results and next steps', 'completion'),
			],
			introSectionKeys: ['overview', 'flowDiagram', 'credentials', 'results'],
			validationRules: [
				FlowConfigService.createValidationRule(1, 'deviceCodeData', true),
				FlowConfigService.createValidationRule(3, 'tokens', true),
			],
			requirements: FlowConfigService.createFlowRequirements(
				['clientId'],
				['deviceAuthorizationEndpoint', 'tokenEndpoint'],
				['openid', 'profile', 'email'],
				[],
				['urn:ietf:params:oauth:grant-type:device_code']
			),
			enableDebugger: true,
		};
	}

	private static createResourceOwnerPasswordConfig(): FlowConfig {
		return {
			flowType: 'resource-owner-password',
			flowName: 'OAuth 2.0 Resource Owner Password Flow',
			flowVersion: 'V5',
			flowTheme: 'red',
			flowKey: 'resource-owner-password-v5',
			flowVariant: 'oauth',
			category: 'deprecated',
			stepConfigs: [
				FlowConfigService.createStepConfig(
					0,
					'Step 0: Introduction & Setup',
					'Understand the Resource Owner Password Flow',
					'introduction'
				),
				FlowConfigService.createStepConfig(
					1,
					'Step 1: Credentials Configuration',
					'Configure client and user credentials',
					'credentials'
				),
				FlowConfigService.createStepConfig(
					2,
					'Step 2: Token Request',
					'Request access token using user credentials',
					'request'
				),
				FlowConfigService.createStepConfig(
					3,
					'Step 3: Token Response',
					'Review the received access token',
					'response'
				),
				FlowConfigService.createStepConfig(
					4,
					'Step 4: Security Features',
					'Advanced security demonstrations',
					'completion'
				),
			],
			introSectionKeys: ['overview', 'flowDiagram', 'credentials', 'results'],
			validationRules: [
				FlowConfigService.createValidationRule(1, 'clientId', true),
				FlowConfigService.createValidationRule(1, 'username', true),
				FlowConfigService.createValidationRule(1, 'password', true),
				FlowConfigService.createValidationRule(2, 'tokens', true),
			],
			requirements: FlowConfigService.createFlowRequirements(
				['clientId', 'clientSecret', 'username', 'password'],
				['tokenEndpoint'],
				['openid', 'profile', 'email'],
				[],
				['password']
			),
			enableDebugger: true,
		};
	}

	private static createJWTBearerConfig(): FlowConfig {
		return {
			flowType: 'jwt-bearer',
			flowName: 'JWT Bearer Token Flow',
			flowVersion: 'V5',
			flowTheme: 'blue',
			flowKey: 'jwt-bearer-v5',
			flowVariant: 'oauth',
			category: 'standard',
			stepConfigs: [
				FlowConfigService.createStepConfig(
					0,
					'Step 0: Introduction & Setup',
					'Understand the JWT Bearer Token Flow',
					'introduction'
				),
				FlowConfigService.createStepConfig(
					1,
					'Step 1: JWT Configuration',
					'Configure JWT signing key',
					'credentials'
				),
				FlowConfigService.createStepConfig(
					2,
					'Step 2: Token Request',
					'Request access token using JWT assertion',
					'request'
				),
				FlowConfigService.createStepConfig(
					3,
					'Step 3: Token Response',
					'Review the received access token',
					'response'
				),
				FlowConfigService.createStepConfig(4, 'Step 4: Complete', 'Review results and next steps', 'completion'),
			],
			introSectionKeys: ['overview', 'flowDiagram', 'credentials', 'results'],
			validationRules: [
				FlowConfigService.createValidationRule(1, 'privateKey', true),
				FlowConfigService.createValidationRule(2, 'tokens', true),
			],
			requirements: FlowConfigService.createFlowRequirements(
				['clientId', 'privateKey'],
				['tokenEndpoint'],
				['api:read', 'api:write'],
				[],
				['urn:ietf:params:oauth:grant-type:jwt-bearer']
			),
			enableDebugger: true,
		};
	}

	private static createOIDCAuthorizationCodeConfig(): FlowConfig {
		return {
			flowType: 'oidc-authorization-code',
			flowName: 'OIDC Authorization Code Flow',
			flowVersion: 'V5',
			flowTheme: 'blue',
			flowKey: 'oidc-authorization-code-v5',
			flowVariant: 'oidc',
			category: 'standard',
			stepConfigs: [
				FlowConfigService.createStepConfig(
					0,
					'Step 0: Introduction & Setup',
					'Understand the OIDC Authorization Code Flow',
					'introduction'
				),
				FlowConfigService.createStepConfig(
					1,
					'Step 1: Authorization Request',
					'Build and launch the authorization URL',
					'request'
				),
				FlowConfigService.createStepConfig(
					2,
					'Step 2: Code Exchange',
					'Exchange authorization code for tokens',
					'response'
				),
				FlowConfigService.createStepConfig(
					3,
					'Step 3: User Info Request',
					'Request user information',
					'validation'
				),
				FlowConfigService.createStepConfig(4, 'Step 4: Complete', 'Review results and next steps', 'completion'),
			],
			introSectionKeys: ['overview', 'flowDiagram', 'credentials', 'results'],
			validationRules: [
				FlowConfigService.createValidationRule(1, 'authUrl', true),
				FlowConfigService.createValidationRule(2, 'tokens', true),
				FlowConfigService.createValidationRule(3, 'userInfo', true),
			],
			requirements: FlowConfigService.createFlowRequirements(
				['clientId', 'clientSecret'],
				['authorizationEndpoint', 'tokenEndpoint', 'userInfoEndpoint'],
				['openid', 'profile', 'email'],
				['code'],
				['authorization_code']
			),
			enableDebugger: true,
		};
	}

	private static createOIDCImplicitConfig(): FlowConfig {
		return {
			flowType: 'oidc-implicit',
			flowName: 'OIDC Implicit Flow',
			flowVersion: 'V5',
			flowTheme: 'orange',
			flowKey: 'oidc-implicit-v5',
			flowVariant: 'oidc',
			category: 'deprecated',
			stepConfigs: [
				FlowConfigService.createStepConfig(
					0,
					'Step 0: Introduction & Setup',
					'Understand the OIDC Implicit Flow',
					'introduction'
				),
				FlowConfigService.createStepConfig(
					1,
					'Step 1: Authorization Request',
					'Build and launch the authorization URL',
					'request'
				),
				FlowConfigService.createStepConfig(
					2,
					'Step 2: Token Response',
					'Receive tokens directly from URL fragment',
					'response'
				),
				FlowConfigService.createStepConfig(
					3,
					'Step 3: User Info Request',
					'Request user information',
					'validation'
				),
				FlowConfigService.createStepConfig(4, 'Step 4: Complete', 'Review results and next steps', 'completion'),
			],
			introSectionKeys: ['overview', 'flowDiagram', 'credentials', 'results'],
			validationRules: [
				FlowConfigService.createValidationRule(1, 'authUrl', true),
				FlowConfigService.createValidationRule(2, 'tokens', true),
				FlowConfigService.createValidationRule(3, 'userInfo', true),
			],
			requirements: FlowConfigService.createFlowRequirements(
				['clientId'],
				['authorizationEndpoint', 'userInfoEndpoint'],
				['openid', 'profile', 'email'],
				['id_token', 'token'],
				['implicit']
			),
			enableDebugger: true,
		};
	}

	private static createOIDCHybridConfig(): FlowConfig {
		return {
			flowType: 'oidc-hybrid',
			flowName: 'OIDC Hybrid Flow',
			flowVersion: 'V5',
			flowTheme: 'purple',
			flowKey: 'oidc-hybrid-v5',
			flowVariant: 'oidc',
			category: 'standard',
			stepConfigs: [
				FlowConfigService.createStepConfig(
					0,
					'Step 0: Introduction & Setup',
					'Understand the OIDC Hybrid Flow',
					'introduction'
				),
				FlowConfigService.createStepConfig(
					1,
					'Step 1: Authorization Request',
					'Build and launch the authorization URL',
					'request'
				),
				FlowConfigService.createStepConfig(
					2,
					'Step 2: Token Response',
					'Receive tokens and authorization code',
					'response'
				),
				FlowConfigService.createStepConfig(
					3,
					'Step 3: Code Exchange',
					'Exchange authorization code for additional tokens',
					'validation'
				),
				FlowConfigService.createStepConfig(4, 'Step 4: Complete', 'Review results and next steps', 'completion'),
			],
			introSectionKeys: ['overview', 'flowDiagram', 'credentials', 'results'],
			validationRules: [
				FlowConfigService.createValidationRule(1, 'authUrl', true),
				FlowConfigService.createValidationRule(2, 'tokens', true),
				FlowConfigService.createValidationRule(3, 'tokens', true),
			],
			requirements: FlowConfigService.createFlowRequirements(
				['clientId', 'clientSecret'],
				['authorizationEndpoint', 'tokenEndpoint'],
				['openid', 'profile', 'email'],
				['code id_token', 'code token', 'code id_token token'],
				['authorization_code']
			),
			enableDebugger: true,
		};
	}

	private static createOIDCClientCredentialsConfig(): FlowConfig {
		return {
			flowType: 'oidc-client-credentials',
			flowName: 'OIDC Client Credentials Flow',
			flowVersion: 'V5',
			flowTheme: 'green',
			flowKey: 'oidc-client-credentials-v5',
			flowVariant: 'oidc',
			category: 'standard',
			stepConfigs: [
				FlowConfigService.createStepConfig(
					0,
					'Step 0: Introduction & Setup',
					'Understand the OIDC Client Credentials Flow',
					'introduction'
				),
				FlowConfigService.createStepConfig(
					1,
					'Step 1: Client Authentication',
					'Configure client credentials',
					'credentials'
				),
				FlowConfigService.createStepConfig(
					2,
					'Step 2: Token Request',
					'Request access token using client credentials',
					'request'
				),
				FlowConfigService.createStepConfig(
					3,
					'Step 3: Token Response',
					'Review the received access token',
					'response'
				),
				FlowConfigService.createStepConfig(4, 'Step 4: Complete', 'Review results and next steps', 'completion'),
			],
			introSectionKeys: ['overview', 'flowDiagram', 'credentials', 'results'],
			validationRules: [
				FlowConfigService.createValidationRule(1, 'clientId', true),
				FlowConfigService.createValidationRule(1, 'clientSecret', true),
				FlowConfigService.createValidationRule(2, 'tokens', true),
			],
			requirements: FlowConfigService.createFlowRequirements(
				['clientId', 'clientSecret'],
				['tokenEndpoint'],
				['api:read', 'api:write'],
				[],
				['client_credentials']
			),
			enableDebugger: true,
		};
	}

	private static createOIDCDeviceAuthorizationConfig(): FlowConfig {
		return {
			flowType: 'oidc-device-authorization',
			flowName: 'OIDC Device Authorization Flow',
			flowVersion: 'V6',
			flowTheme: 'purple',
			flowKey: 'oidc-device-authorization-v6',
			flowVariant: 'oidc',
			category: 'standard',
			stepConfigs: [
				FlowConfigService.createStepConfig(
					0,
					'Step 0: Introduction & Setup',
					'Understand the OIDC Device Authorization Flow',
					'introduction'
				),
				FlowConfigService.createStepConfig(
					1,
					'Step 1: Device Code Request',
					'Request device code from authorization server',
					'request'
				),
				FlowConfigService.createStepConfig(
					2,
					'Step 2: User Authorization',
					'Complete authorization on device',
					'response'
				),
				FlowConfigService.createStepConfig(3, 'Step 3: Token Polling', 'Poll for tokens', 'validation'),
				FlowConfigService.createStepConfig(
					4,
					'Step 4: Token Response',
					'Review the received tokens',
					'response'
				),
				FlowConfigService.createStepConfig(5, 'Step 5: Complete', 'Review results and next steps', 'completion'),
			],
			introSectionKeys: ['overview', 'flowDiagram', 'credentials', 'results'],
			validationRules: [
				FlowConfigService.createValidationRule(1, 'deviceCodeData', true),
				FlowConfigService.createValidationRule(3, 'tokens', true),
			],
			requirements: FlowConfigService.createFlowRequirements(
				['clientId'],
				['deviceAuthorizationEndpoint', 'tokenEndpoint'],
				['openid', 'profile', 'email'],
				[],
				['urn:ietf:params:oauth:grant-type:device_code']
			),
			enableDebugger: true,
		};
	}

	private static createOIDCCIBAConfig(): FlowConfig {
		return {
			flowType: 'oidc-ciba',
			flowName: 'OIDC CIBA Flow',
			flowVersion: 'V5',
			flowTheme: 'blue',
			flowKey: 'oidc-ciba-v6',
			flowVariant: 'oidc',
			category: 'standard',
			stepConfigs: [
				FlowConfigService.createStepConfig(
					0,
					'Step 0: Introduction & Setup',
					'Understand the OIDC CIBA Flow',
					'introduction'
				),
				FlowConfigService.createStepConfig(
					1,
					'Step 1: CIBA Request',
					'Initiate CIBA authentication request',
					'request'
				),
				FlowConfigService.createStepConfig(
					2,
					'Step 2: User Authorization',
					'Complete CIBA authentication',
					'response'
				),
				FlowConfigService.createStepConfig(3, 'Step 3: Token Polling', 'Poll for tokens', 'validation'),
				FlowConfigService.createStepConfig(
					4,
					'Step 4: Token Response',
					'Review the received tokens',
					'response'
				),
				FlowConfigService.createStepConfig(5, 'Step 5: Complete', 'Review results and next steps', 'completion'),
			],
			introSectionKeys: ['overview', 'flowDiagram', 'credentials', 'results'],
			validationRules: [
				FlowConfigService.createValidationRule(1, 'authRequestId', true),
				FlowConfigService.createValidationRule(3, 'tokens', true),
			],
			requirements: FlowConfigService.createFlowRequirements(
				['clientId', 'clientSecret'],
				['cibaEndpoint', 'tokenEndpoint'],
				['openid', 'profile', 'email'],
				[],
				['urn:openid:params:grant-type:ciba']
			),
			enableDebugger: true,
		};
	}

	private static createWorkerTokenConfig(): FlowConfig {
		return {
			flowType: 'worker-token',
			flowName: 'PingOne Worker Token Flow',
			flowVersion: 'V5',
			flowTheme: 'blue',
			flowKey: 'worker-token-v5',
			flowVariant: 'pingone',
			category: 'pingone',
			stepConfigs: [
				FlowConfigService.createStepConfig(
					0,
					'Step 0: Introduction & Setup',
					'Understand the Worker Token Flow',
					'introduction'
				),
				FlowConfigService.createStepConfig(
					1,
					'Step 1: Worker Configuration',
					'Configure worker credentials',
					'credentials'
				),
				FlowConfigService.createStepConfig(2, 'Step 2: Token Request', 'Request worker token', 'request'),
				FlowConfigService.createStepConfig(
					3,
					'Step 3: Token Response',
					'Review the received worker token',
					'response'
				),
				FlowConfigService.createStepConfig(4, 'Step 4: Complete', 'Review results and next steps', 'completion'),
			],
			introSectionKeys: ['overview', 'flowDiagram', 'credentials', 'results'],
			validationRules: [
				FlowConfigService.createValidationRule(1, 'workerId', true),
				FlowConfigService.createValidationRule(1, 'workerSecret', true),
				FlowConfigService.createValidationRule(2, 'tokens', true),
			],
			requirements: FlowConfigService.createFlowRequirements(
				['workerId', 'workerSecret'],
				['workerTokenEndpoint'],
				['worker:read', 'worker:write'],
				[],
				['worker_token']
			),
			enableDebugger: true,
		};
	}

	private static createPingOnePARConfig(): FlowConfig {
		return {
			flowType: 'pingone-par',
			flowName: 'PingOne PAR Flow',
			flowVersion: 'V5',
			flowTheme: 'blue',
			flowKey: 'pingone-par-v5',
			flowVariant: 'pingone',
			category: 'pingone',
			stepConfigs: [
				FlowConfigService.createStepConfig(
					0,
					'Step 0: Introduction & Setup',
					'Understand the PingOne PAR Flow',
					'introduction'
				),
				FlowConfigService.createStepConfig(
					1,
					'Step 1: PAR Request',
					'Create Pushed Authorization Request',
					'request'
				),
				FlowConfigService.createStepConfig(
					2,
					'Step 2: Authorization Request',
					'Build authorization URL with request_uri',
					'request'
				),
				FlowConfigService.createStepConfig(
					3,
					'Step 3: Code Exchange',
					'Exchange authorization code for tokens',
					'response'
				),
				FlowConfigService.createStepConfig(4, 'Step 4: Complete', 'Review results and next steps', 'completion'),
			],
			introSectionKeys: ['overview', 'flowDiagram', 'credentials', 'results'],
			validationRules: [
				FlowConfigService.createValidationRule(1, 'parRequest', true),
				FlowConfigService.createValidationRule(2, 'authUrl', true),
				FlowConfigService.createValidationRule(3, 'tokens', true),
			],
			requirements: FlowConfigService.createFlowRequirements(
				['clientId', 'clientSecret'],
				['parEndpoint', 'authorizationEndpoint', 'tokenEndpoint'],
				['openid', 'profile', 'email'],
				['code'],
				['authorization_code']
			),
			enableDebugger: true,
		};
	}

	private static createRedirectlessConfig(): FlowConfig {
		return {
			flowType: 'redirectless',
			flowName: 'PingOne Redirectless Flow',
			flowVersion: 'V6',
			flowTheme: 'blue',
			flowKey: 'redirectless-v6',
			flowVariant: 'pingone',
			category: 'pingone',
			stepConfigs: [
				FlowConfigService.createStepConfig(
					0,
					'Step 0: Introduction & Setup',
					'Understand the Redirectless Flow',
					'introduction'
				),
				FlowConfigService.createStepConfig(
					1,
					'Step 1: PKCE Parameters',
					'Generate secure PKCE codes',
					'credentials'
				),
				FlowConfigService.createStepConfig(
					2,
					'Step 2: Authorization Request',
					'Build authorization URL with response_mode=pi.flow',
					'request'
				),
				FlowConfigService.createStepConfig(
					3,
					'Step 3: Flow Response',
					'Receive and process flow object',
					'response'
				),
				FlowConfigService.createStepConfig(
					4,
					'Step 4: Token Response',
					'Receive tokens in JSON format',
					'response'
				),
				FlowConfigService.createStepConfig(5, 'Step 5: Complete', 'Review results and next steps', 'completion'),
			],
			introSectionKeys: ['overview', 'flowDiagram', 'credentials', 'results'],
			validationRules: [
				FlowConfigService.createValidationRule(1, 'pkceCodes', true),
				FlowConfigService.createValidationRule(2, 'authUrl', true),
				FlowConfigService.createValidationRule(3, 'flowResponse', true),
				FlowConfigService.createValidationRule(4, 'tokens', true),
			],
			requirements: FlowConfigService.createFlowRequirements(
				['clientId', 'clientSecret'],
				['authorizationEndpoint', 'tokenEndpoint'],
				['openid', 'profile', 'email'],
				['code'],
				['authorization_code']
			),
			enableDebugger: true,
		};
	}

	private static createTokenIntrospectionConfig(): FlowConfig {
		return {
			flowType: 'token-introspection',
			flowName: 'Token Introspection Flow',
			flowVersion: 'V5',
			flowTheme: 'blue',
			flowKey: 'token-introspection-v5',
			flowVariant: 'oauth',
			category: 'standard',
			stepConfigs: [
				FlowConfigService.createStepConfig(
					0,
					'Step 0: Introduction & Setup',
					'Understand Token Introspection',
					'introduction'
				),
				FlowConfigService.createStepConfig(
					1,
					'Step 1: Configuration',
					'Configure credentials and access token',
					'credentials'
				),
				FlowConfigService.createStepConfig(
					2,
					'Step 2: Introspection Request',
					'Introspect the access token',
					'request'
				),
				FlowConfigService.createStepConfig(
					3,
					'Step 3: Introspection Response',
					'Review the introspection results',
					'response'
				),
				FlowConfigService.createStepConfig(4, 'Step 4: Complete', 'Review results and next steps', 'completion'),
			],
			introSectionKeys: ['overview', 'flowDiagram', 'credentials', 'results'],
			validationRules: [
				FlowConfigService.createValidationRule(1, 'clientId', true),
				FlowConfigService.createValidationRule(1, 'accessToken', true),
				FlowConfigService.createValidationRule(2, 'introspectionResult', true),
			],
			requirements: FlowConfigService.createFlowRequirements(
				['clientId', 'clientSecret'],
				['introspectionEndpoint'],
				[],
				[],
				[]
			),
			enableDebugger: true,
		};
	}

	private static createTokenRevocationConfig(): FlowConfig {
		return {
			flowType: 'token-revocation',
			flowName: 'Token Revocation Flow',
			flowVersion: 'V5',
			flowTheme: 'red',
			flowKey: 'token-revocation-v5',
			flowVariant: 'oauth',
			category: 'standard',
			stepConfigs: [
				FlowConfigService.createStepConfig(
					0,
					'Step 0: Introduction & Setup',
					'Understand Token Revocation',
					'introduction'
				),
				FlowConfigService.createStepConfig(
					1,
					'Step 1: Configuration',
					'Configure credentials and access token',
					'credentials'
				),
				FlowConfigService.createStepConfig(
					2,
					'Step 2: Revocation Request',
					'Revoke the access token',
					'request'
				),
				FlowConfigService.createStepConfig(
					3,
					'Step 3: Revocation Response',
					'Review the revocation results',
					'response'
				),
				FlowConfigService.createStepConfig(4, 'Step 4: Complete', 'Review results and next steps', 'completion'),
			],
			introSectionKeys: ['overview', 'flowDiagram', 'credentials', 'results'],
			validationRules: [
				FlowConfigService.createValidationRule(1, 'clientId', true),
				FlowConfigService.createValidationRule(1, 'accessToken', true),
				FlowConfigService.createValidationRule(2, 'revocationResult', true),
			],
			requirements: FlowConfigService.createFlowRequirements(
				['clientId', 'clientSecret'],
				['revocationEndpoint'],
				[],
				[],
				[]
			),
			enableDebugger: true,
		};
	}

	private static createUserInfoConfig(): FlowConfig {
		return {
			flowType: 'user-info',
			flowName: 'User Info Flow',
			flowVersion: 'V5',
			flowTheme: 'blue',
			flowKey: 'user-info-v5',
			flowVariant: 'oidc',
			category: 'standard',
			stepConfigs: [
				FlowConfigService.createStepConfig(
					0,
					'Step 0: Introduction & Setup',
					'Understand User Info Flow',
					'introduction'
				),
				FlowConfigService.createStepConfig(1, 'Step 1: Configuration', 'Configure access token', 'credentials'),
				FlowConfigService.createStepConfig(
					2,
					'Step 2: User Info Request',
					'Request user information',
					'request'
				),
				FlowConfigService.createStepConfig(
					3,
					'Step 3: User Info Response',
					'Review the received user information',
					'response'
				),
				FlowConfigService.createStepConfig(4, 'Step 4: Complete', 'Review results and next steps', 'completion'),
			],
			introSectionKeys: ['overview', 'flowDiagram', 'credentials', 'results'],
			validationRules: [
				FlowConfigService.createValidationRule(1, 'accessToken', true),
				FlowConfigService.createValidationRule(2, 'userInfo', true),
			],
			requirements: FlowConfigService.createFlowRequirements(
				['accessToken'],
				['userInfoEndpoint'],
				['openid', 'profile', 'email'],
				[],
				[]
			),
			enableDebugger: true,
		};
	}

	private static createDefaultConfig(flowType: string): FlowConfig {
		return {
			flowType,
			flowName: `Unknown Flow: ${flowType}`,
			flowVersion: 'V5',
			flowTheme: 'blue',
			flowKey: `${flowType}-v5`,
			flowVariant: 'oauth',
			category: 'experimental',
			stepConfigs: [],
			introSectionKeys: [],
			validationRules: [],
			requirements: FlowConfigService.createFlowRequirements(),
			enableDebugger: false,
		};
	}
}

// Initialize default configurations
FlowConfigService.initializeDefaultConfigs();

export default FlowConfigService;
