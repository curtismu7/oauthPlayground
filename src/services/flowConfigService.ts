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
		this.registerFlow('implicit', this.createImplicitConfig());
		this.registerFlow('authorization-code', this.createAuthorizationCodeConfig());
		this.registerFlow('client-credentials', this.createClientCredentialsConfig());
		this.registerFlow('device-authorization', this.createDeviceAuthorizationConfig());
		this.registerFlow('resource-owner-password', this.createResourceOwnerPasswordConfig());
		this.registerFlow('jwt-bearer', this.createJWTBearerConfig());

		// OIDC Flows
		this.registerFlow('oidc-authorization-code', this.createOIDCAuthorizationCodeConfig());
		this.registerFlow('oidc-implicit', this.createOIDCImplicitConfig());
		this.registerFlow('oidc-hybrid', this.createOIDCHybridConfig());
		this.registerFlow('oidc-client-credentials', this.createOIDCClientCredentialsConfig());
		this.registerFlow('oidc-device-authorization', this.createOIDCDeviceAuthorizationConfig());
		this.registerFlow('oidc-ciba', this.createOIDCCIBAConfig());

		// PingOne Flows
		this.registerFlow('worker-token', this.createWorkerTokenConfig());
		this.registerFlow('pingone-par', this.createPingOnePARConfig());
		this.registerFlow('redirectless', this.createRedirectlessConfig());

		// Token Management Flows
		this.registerFlow('token-introspection', this.createTokenIntrospectionConfig());
		this.registerFlow('token-revocation', this.createTokenRevocationConfig());
		this.registerFlow('user-info', this.createUserInfoConfig());
	}

	/**
	 * Register a flow configuration
	 */
	static registerFlow(flowType: string, config: FlowConfig): void {
		this.flowConfigs.set(flowType, config);
	}

	/**
	 * Get a flow configuration
	 */
	static getFlowConfig(flowType: string): FlowConfig | undefined {
		return this.flowConfigs.get(flowType);
	}

	/**
	 * Get all flow configurations
	 */
	static getAllFlowConfigs(): FlowConfig[] {
		return Array.from(this.flowConfigs.values());
	}

	/**
	 * Get flows by category
	 */
	static getFlowsByCategory(category: string): FlowConfig[] {
		return Array.from(this.flowConfigs.values()).filter((flow) => flow.category === category);
	}

	/**
	 * Get flows by variant
	 */
	static getFlowsByVariant(variant: 'oauth' | 'oidc' | 'pingone'): FlowConfig[] {
		return Array.from(this.flowConfigs.values()).filter((flow) => flow.flowVariant === variant);
	}

	/**
	 * Create a custom flow configuration
	 */
	static createCustomFlowConfig(flowType: string, customConfig: Partial<FlowConfig>): FlowConfig {
		const baseConfig = this.getFlowConfig(flowType) || this.createDefaultConfig(flowType);
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
				this.createStepConfig(
					0,
					'Step 0: Introduction & Setup',
					'Understand the Implicit Flow',
					'introduction'
				),
				this.createStepConfig(
					1,
					'Step 1: Authorization Request',
					'Build and launch the authorization URL',
					'request'
				),
				this.createStepConfig(
					2,
					'Step 2: Token Response',
					'Receive tokens directly from URL fragment',
					'response'
				),
				this.createStepConfig(
					3,
					'Step 3: Token Introspection',
					'Validate and inspect tokens',
					'validation'
				),
				this.createStepConfig(
					4,
					'Step 4: Security Features',
					'Advanced security demonstrations',
					'completion'
				),
			],
			introSectionKeys: ['overview', 'flowDiagram', 'credentials', 'results'],
			validationRules: [
				this.createValidationRule(1, 'authUrl', true),
				this.createValidationRule(2, 'tokens', true),
			],
			requirements: this.createFlowRequirements(
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
				this.createStepConfig(
					0,
					'Step 0: Introduction & Setup',
					'Understand the Authorization Code Flow',
					'introduction'
				),
				this.createStepConfig(
					1,
					'Step 1: Authorization Request',
					'Build and launch the authorization URL',
					'request'
				),
				this.createStepConfig(
					2,
					'Step 2: Code Exchange',
					'Exchange authorization code for tokens',
					'response'
				),
				this.createStepConfig(
					3,
					'Step 3: Token Introspection',
					'Validate and inspect tokens',
					'validation'
				),
				this.createStepConfig(
					4,
					'Step 4: Security Features',
					'Advanced security demonstrations',
					'completion'
				),
			],
			introSectionKeys: ['overview', 'flowDiagram', 'credentials', 'results'],
			validationRules: [
				this.createValidationRule(1, 'authUrl', true),
				this.createValidationRule(2, 'tokens', true),
			],
			requirements: this.createFlowRequirements(
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
				this.createStepConfig(
					0,
					'Step 0: Introduction & Setup',
					'Understand the Client Credentials Flow',
					'introduction'
				),
				this.createStepConfig(
					1,
					'Step 1: Client Authentication',
					'Configure client credentials',
					'credentials'
				),
				this.createStepConfig(
					2,
					'Step 2: Token Request',
					'Request access token using client credentials',
					'request'
				),
				this.createStepConfig(
					3,
					'Step 3: Token Response',
					'Review the received access token',
					'response'
				),
				this.createStepConfig(
					4,
					'Step 4: Security Features',
					'Advanced security demonstrations',
					'completion'
				),
			],
			introSectionKeys: ['overview', 'flowDiagram', 'credentials', 'results'],
			validationRules: [
				this.createValidationRule(1, 'clientId', true),
				this.createValidationRule(1, 'clientSecret', true),
				this.createValidationRule(2, 'tokens', true),
			],
			requirements: this.createFlowRequirements(
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
				this.createStepConfig(
					0,
					'Step 0: Introduction & Setup',
					'Understand the Device Authorization Flow',
					'introduction'
				),
				this.createStepConfig(
					1,
					'Step 1: Device Code Request',
					'Request device code from authorization server',
					'request'
				),
				this.createStepConfig(
					2,
					'Step 2: User Authorization',
					'Complete authorization on device',
					'response'
				),
				this.createStepConfig(3, 'Step 3: Token Polling', 'Poll for tokens', 'validation'),
				this.createStepConfig(
					4,
					'Step 4: Token Response',
					'Review the received tokens',
					'response'
				),
				this.createStepConfig(5, 'Step 5: Complete', 'Review results and next steps', 'completion'),
			],
			introSectionKeys: ['overview', 'flowDiagram', 'credentials', 'results'],
			validationRules: [
				this.createValidationRule(1, 'deviceCodeData', true),
				this.createValidationRule(3, 'tokens', true),
			],
			requirements: this.createFlowRequirements(
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
				this.createStepConfig(
					0,
					'Step 0: Introduction & Setup',
					'Understand the Resource Owner Password Flow',
					'introduction'
				),
				this.createStepConfig(
					1,
					'Step 1: Credentials Configuration',
					'Configure client and user credentials',
					'credentials'
				),
				this.createStepConfig(
					2,
					'Step 2: Token Request',
					'Request access token using user credentials',
					'request'
				),
				this.createStepConfig(
					3,
					'Step 3: Token Response',
					'Review the received access token',
					'response'
				),
				this.createStepConfig(
					4,
					'Step 4: Security Features',
					'Advanced security demonstrations',
					'completion'
				),
			],
			introSectionKeys: ['overview', 'flowDiagram', 'credentials', 'results'],
			validationRules: [
				this.createValidationRule(1, 'clientId', true),
				this.createValidationRule(1, 'username', true),
				this.createValidationRule(1, 'password', true),
				this.createValidationRule(2, 'tokens', true),
			],
			requirements: this.createFlowRequirements(
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
				this.createStepConfig(
					0,
					'Step 0: Introduction & Setup',
					'Understand the JWT Bearer Token Flow',
					'introduction'
				),
				this.createStepConfig(
					1,
					'Step 1: JWT Configuration',
					'Configure JWT signing key',
					'credentials'
				),
				this.createStepConfig(
					2,
					'Step 2: Token Request',
					'Request access token using JWT assertion',
					'request'
				),
				this.createStepConfig(
					3,
					'Step 3: Token Response',
					'Review the received access token',
					'response'
				),
				this.createStepConfig(4, 'Step 4: Complete', 'Review results and next steps', 'completion'),
			],
			introSectionKeys: ['overview', 'flowDiagram', 'credentials', 'results'],
			validationRules: [
				this.createValidationRule(1, 'privateKey', true),
				this.createValidationRule(2, 'tokens', true),
			],
			requirements: this.createFlowRequirements(
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
				this.createStepConfig(
					0,
					'Step 0: Introduction & Setup',
					'Understand the OIDC Authorization Code Flow',
					'introduction'
				),
				this.createStepConfig(
					1,
					'Step 1: Authorization Request',
					'Build and launch the authorization URL',
					'request'
				),
				this.createStepConfig(
					2,
					'Step 2: Code Exchange',
					'Exchange authorization code for tokens',
					'response'
				),
				this.createStepConfig(
					3,
					'Step 3: User Info Request',
					'Request user information',
					'validation'
				),
				this.createStepConfig(4, 'Step 4: Complete', 'Review results and next steps', 'completion'),
			],
			introSectionKeys: ['overview', 'flowDiagram', 'credentials', 'results'],
			validationRules: [
				this.createValidationRule(1, 'authUrl', true),
				this.createValidationRule(2, 'tokens', true),
				this.createValidationRule(3, 'userInfo', true),
			],
			requirements: this.createFlowRequirements(
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
				this.createStepConfig(
					0,
					'Step 0: Introduction & Setup',
					'Understand the OIDC Implicit Flow',
					'introduction'
				),
				this.createStepConfig(
					1,
					'Step 1: Authorization Request',
					'Build and launch the authorization URL',
					'request'
				),
				this.createStepConfig(
					2,
					'Step 2: Token Response',
					'Receive tokens directly from URL fragment',
					'response'
				),
				this.createStepConfig(
					3,
					'Step 3: User Info Request',
					'Request user information',
					'validation'
				),
				this.createStepConfig(4, 'Step 4: Complete', 'Review results and next steps', 'completion'),
			],
			introSectionKeys: ['overview', 'flowDiagram', 'credentials', 'results'],
			validationRules: [
				this.createValidationRule(1, 'authUrl', true),
				this.createValidationRule(2, 'tokens', true),
				this.createValidationRule(3, 'userInfo', true),
			],
			requirements: this.createFlowRequirements(
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
				this.createStepConfig(
					0,
					'Step 0: Introduction & Setup',
					'Understand the OIDC Hybrid Flow',
					'introduction'
				),
				this.createStepConfig(
					1,
					'Step 1: Authorization Request',
					'Build and launch the authorization URL',
					'request'
				),
				this.createStepConfig(
					2,
					'Step 2: Token Response',
					'Receive tokens and authorization code',
					'response'
				),
				this.createStepConfig(
					3,
					'Step 3: Code Exchange',
					'Exchange authorization code for additional tokens',
					'validation'
				),
				this.createStepConfig(4, 'Step 4: Complete', 'Review results and next steps', 'completion'),
			],
			introSectionKeys: ['overview', 'flowDiagram', 'credentials', 'results'],
			validationRules: [
				this.createValidationRule(1, 'authUrl', true),
				this.createValidationRule(2, 'tokens', true),
				this.createValidationRule(3, 'tokens', true),
			],
			requirements: this.createFlowRequirements(
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
				this.createStepConfig(
					0,
					'Step 0: Introduction & Setup',
					'Understand the OIDC Client Credentials Flow',
					'introduction'
				),
				this.createStepConfig(
					1,
					'Step 1: Client Authentication',
					'Configure client credentials',
					'credentials'
				),
				this.createStepConfig(
					2,
					'Step 2: Token Request',
					'Request access token using client credentials',
					'request'
				),
				this.createStepConfig(
					3,
					'Step 3: Token Response',
					'Review the received access token',
					'response'
				),
				this.createStepConfig(4, 'Step 4: Complete', 'Review results and next steps', 'completion'),
			],
			introSectionKeys: ['overview', 'flowDiagram', 'credentials', 'results'],
			validationRules: [
				this.createValidationRule(1, 'clientId', true),
				this.createValidationRule(1, 'clientSecret', true),
				this.createValidationRule(2, 'tokens', true),
			],
			requirements: this.createFlowRequirements(
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
				this.createStepConfig(
					0,
					'Step 0: Introduction & Setup',
					'Understand the OIDC Device Authorization Flow',
					'introduction'
				),
				this.createStepConfig(
					1,
					'Step 1: Device Code Request',
					'Request device code from authorization server',
					'request'
				),
				this.createStepConfig(
					2,
					'Step 2: User Authorization',
					'Complete authorization on device',
					'response'
				),
				this.createStepConfig(3, 'Step 3: Token Polling', 'Poll for tokens', 'validation'),
				this.createStepConfig(
					4,
					'Step 4: Token Response',
					'Review the received tokens',
					'response'
				),
				this.createStepConfig(5, 'Step 5: Complete', 'Review results and next steps', 'completion'),
			],
			introSectionKeys: ['overview', 'flowDiagram', 'credentials', 'results'],
			validationRules: [
				this.createValidationRule(1, 'deviceCodeData', true),
				this.createValidationRule(3, 'tokens', true),
			],
			requirements: this.createFlowRequirements(
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
			flowKey: 'oidc-ciba-v5',
			flowVariant: 'oidc',
			category: 'standard',
			stepConfigs: [
				this.createStepConfig(
					0,
					'Step 0: Introduction & Setup',
					'Understand the OIDC CIBA Flow',
					'introduction'
				),
				this.createStepConfig(
					1,
					'Step 1: CIBA Request',
					'Initiate CIBA authentication request',
					'request'
				),
				this.createStepConfig(
					2,
					'Step 2: User Authorization',
					'Complete CIBA authentication',
					'response'
				),
				this.createStepConfig(3, 'Step 3: Token Polling', 'Poll for tokens', 'validation'),
				this.createStepConfig(
					4,
					'Step 4: Token Response',
					'Review the received tokens',
					'response'
				),
				this.createStepConfig(5, 'Step 5: Complete', 'Review results and next steps', 'completion'),
			],
			introSectionKeys: ['overview', 'flowDiagram', 'credentials', 'results'],
			validationRules: [
				this.createValidationRule(1, 'authRequestId', true),
				this.createValidationRule(3, 'tokens', true),
			],
			requirements: this.createFlowRequirements(
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
				this.createStepConfig(
					0,
					'Step 0: Introduction & Setup',
					'Understand the Worker Token Flow',
					'introduction'
				),
				this.createStepConfig(
					1,
					'Step 1: Worker Configuration',
					'Configure worker credentials',
					'credentials'
				),
				this.createStepConfig(2, 'Step 2: Token Request', 'Request worker token', 'request'),
				this.createStepConfig(
					3,
					'Step 3: Token Response',
					'Review the received worker token',
					'response'
				),
				this.createStepConfig(4, 'Step 4: Complete', 'Review results and next steps', 'completion'),
			],
			introSectionKeys: ['overview', 'flowDiagram', 'credentials', 'results'],
			validationRules: [
				this.createValidationRule(1, 'workerId', true),
				this.createValidationRule(1, 'workerSecret', true),
				this.createValidationRule(2, 'tokens', true),
			],
			requirements: this.createFlowRequirements(
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
				this.createStepConfig(
					0,
					'Step 0: Introduction & Setup',
					'Understand the PingOne PAR Flow',
					'introduction'
				),
				this.createStepConfig(
					1,
					'Step 1: PAR Request',
					'Create Pushed Authorization Request',
					'request'
				),
				this.createStepConfig(
					2,
					'Step 2: Authorization Request',
					'Build authorization URL with request_uri',
					'request'
				),
				this.createStepConfig(
					3,
					'Step 3: Code Exchange',
					'Exchange authorization code for tokens',
					'response'
				),
				this.createStepConfig(4, 'Step 4: Complete', 'Review results and next steps', 'completion'),
			],
			introSectionKeys: ['overview', 'flowDiagram', 'credentials', 'results'],
			validationRules: [
				this.createValidationRule(1, 'parRequest', true),
				this.createValidationRule(2, 'authUrl', true),
				this.createValidationRule(3, 'tokens', true),
			],
			requirements: this.createFlowRequirements(
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
				this.createStepConfig(
					0,
					'Step 0: Introduction & Setup',
					'Understand the Redirectless Flow',
					'introduction'
				),
				this.createStepConfig(
					1,
					'Step 1: PKCE Parameters',
					'Generate secure PKCE codes',
					'credentials'
				),
				this.createStepConfig(
					2,
					'Step 2: Authorization Request',
					'Build authorization URL with response_mode=pi.flow',
					'request'
				),
				this.createStepConfig(
					3,
					'Step 3: Flow Response',
					'Receive and process flow object',
					'response'
				),
				this.createStepConfig(
					4,
					'Step 4: Token Response',
					'Receive tokens in JSON format',
					'response'
				),
				this.createStepConfig(5, 'Step 5: Complete', 'Review results and next steps', 'completion'),
			],
			introSectionKeys: ['overview', 'flowDiagram', 'credentials', 'results'],
			validationRules: [
				this.createValidationRule(1, 'pkceCodes', true),
				this.createValidationRule(2, 'authUrl', true),
				this.createValidationRule(3, 'flowResponse', true),
				this.createValidationRule(4, 'tokens', true),
			],
			requirements: this.createFlowRequirements(
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
				this.createStepConfig(
					0,
					'Step 0: Introduction & Setup',
					'Understand Token Introspection',
					'introduction'
				),
				this.createStepConfig(
					1,
					'Step 1: Configuration',
					'Configure credentials and access token',
					'credentials'
				),
				this.createStepConfig(
					2,
					'Step 2: Introspection Request',
					'Introspect the access token',
					'request'
				),
				this.createStepConfig(
					3,
					'Step 3: Introspection Response',
					'Review the introspection results',
					'response'
				),
				this.createStepConfig(4, 'Step 4: Complete', 'Review results and next steps', 'completion'),
			],
			introSectionKeys: ['overview', 'flowDiagram', 'credentials', 'results'],
			validationRules: [
				this.createValidationRule(1, 'clientId', true),
				this.createValidationRule(1, 'accessToken', true),
				this.createValidationRule(2, 'introspectionResult', true),
			],
			requirements: this.createFlowRequirements(
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
				this.createStepConfig(
					0,
					'Step 0: Introduction & Setup',
					'Understand Token Revocation',
					'introduction'
				),
				this.createStepConfig(
					1,
					'Step 1: Configuration',
					'Configure credentials and access token',
					'credentials'
				),
				this.createStepConfig(
					2,
					'Step 2: Revocation Request',
					'Revoke the access token',
					'request'
				),
				this.createStepConfig(
					3,
					'Step 3: Revocation Response',
					'Review the revocation results',
					'response'
				),
				this.createStepConfig(4, 'Step 4: Complete', 'Review results and next steps', 'completion'),
			],
			introSectionKeys: ['overview', 'flowDiagram', 'credentials', 'results'],
			validationRules: [
				this.createValidationRule(1, 'clientId', true),
				this.createValidationRule(1, 'accessToken', true),
				this.createValidationRule(2, 'revocationResult', true),
			],
			requirements: this.createFlowRequirements(
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
				this.createStepConfig(
					0,
					'Step 0: Introduction & Setup',
					'Understand User Info Flow',
					'introduction'
				),
				this.createStepConfig(1, 'Step 1: Configuration', 'Configure access token', 'credentials'),
				this.createStepConfig(
					2,
					'Step 2: User Info Request',
					'Request user information',
					'request'
				),
				this.createStepConfig(
					3,
					'Step 3: User Info Response',
					'Review the received user information',
					'response'
				),
				this.createStepConfig(4, 'Step 4: Complete', 'Review results and next steps', 'completion'),
			],
			introSectionKeys: ['overview', 'flowDiagram', 'credentials', 'results'],
			validationRules: [
				this.createValidationRule(1, 'accessToken', true),
				this.createValidationRule(2, 'userInfo', true),
			],
			requirements: this.createFlowRequirements(
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
			requirements: this.createFlowRequirements(),
			enableDebugger: false,
		};
	}
}

// Initialize default configurations
FlowConfigService.initializeDefaultConfigs();

export default FlowConfigService;
