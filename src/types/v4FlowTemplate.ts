// src/types/v4FlowTemplate.ts - V4 Flow Template Types

export interface StepCredentials {
	environmentId: string;
	clientId: string;
	clientSecret: string;
	redirectUri: string;
	scopes: string;
	authMethod: ClientAuthMethod;
	tokenEndpointAuthMethod?: string; // Token endpoint authentication method
}

export interface ClientAuthMethod {
	value: string;
	label: string;
	description: string;
	securityLevel: 'low' | 'medium' | 'high' | 'highest';
}

export interface PKCECodes {
	codeVerifier: string;
	codeChallenge: string;
	codeChallengeMethod: string;
}

export interface FlowConfiguration {
	flowType:
		| 'authorization_code_pkce'
		| 'implicit'
		| 'client_credentials'
		| 'device_code'
		| 'worker_token';
	flowName: string;
	description: string;
	steps: FlowStep[];
	requiredCredentials: string[];
	supportsPKCE: boolean;
	supportsRefreshTokens: boolean;
	educationalContent: EducationalContent;
}

export interface FlowStep {
	id: string;
	title: string;
	description: string;
	component: (props: StepProps) => React.ReactNode;
	validation?: (credentials: StepCredentials) => ValidationResult;
	isRequired: boolean;
	educationalContent?: EducationalStepContent;
}

export interface StepProps {
	credentials: StepCredentials;
	setCredentials: (credentials: StepCredentials) => void;
	pkceCodes?: PKCECodes;
	setPkceCodes?: (codes: PKCECodes) => void;
	authUrl?: string;
	setAuthUrl?: (url: string) => void;
	authCode?: string;
	setAuthCode?: (code: string) => void;
	tokens?: any;
	setTokens?: (tokens: any) => void;
	userInfo?: any;
	setUserInfo?: (info: any) => void;
	isLoading?: boolean;
	setIsLoading?: (loading: boolean) => void;
	onAction?: (action: string, data?: any) => void;
	quizAnswers?: { [key: string]: any };
	handleQuizAnswer?: (stepId: string, answer: any, isCorrect: boolean) => void;
}

export interface ValidationResult {
	isValid: boolean;
	errors: string[];
	warnings: string[];
}

export interface EducationalContent {
	flowExplanation: string;
	securityNotes: string[];
	commonMistakes: string[];
	bestPractices: string[];
	quizQuestions: QuizQuestion[];
}

export interface EducationalStepContent {
	title: string;
	description: string;
	keyPoints: string[];
	examples?: string[];
	securityConsiderations?: string[];
	quizQuestion?: QuizQuestion;
}

export interface QuizQuestion {
	id: string;
	question: string;
	options: QuizOption[];
	explanation: string;
}

export interface QuizOption {
	text: string;
	correct: boolean;
	explanation?: string;
}

export interface ButtonStates {
	saveConfiguration: {
		loading: boolean;
		disabled: boolean;
		variant: 'primary' | 'secondary' | 'success' | 'error';
	};
	generateAuthUrl: {
		loading: boolean;
		disabled: boolean;
		hasUrl: boolean;
	};
	exchangeTokens: {
		loading: boolean;
		disabled: boolean;
		hasTokens: boolean;
	};
	generatePKCE: {
		loading: boolean;
		disabled: boolean;
	};
	copyToClipboard: {
		loading: boolean;
		disabled: boolean;
	};
	navigation: {
		canGoNext: boolean;
		canGoPrevious: boolean;
	};
}

export interface ApiCallHandler {
	endpoint: string;
	method: 'GET' | 'POST' | 'PUT' | 'DELETE';
	body?: any;
	headers?: Record<string, string>;
	showLoadingToast?: boolean;
	successMessage?: string;
	errorMessage?: string;
	timeout?: number;
	retries?: number;
}

export interface V4SaveConfigurationHandler {
	flowType: string;
	validateConfiguration(config: StepCredentials): ValidationResult;
	saveConfiguration(config: StepCredentials): Promise<SaveResult>;
	handleSaveSuccess(result: SaveResult): void;
	handleSaveError(error: Error): void;
	showLoadingState(): void;
	hideLoadingState(): void;
}

export interface SaveResult {
	success: boolean;
	message: string;
	data?: any;
}

export interface FlowResult {
	flowType: string;
	success: boolean;
	tokens?: any;
	userInfo?: any;
	error?: string;
	duration?: number;
}

export interface V4OAuthFlowTemplateProps {
	flowConfig: FlowConfiguration;
	initialCredentials?: Partial<StepCredentials>;
	onFlowComplete?: (result: FlowResult) => void;
	onStepChange?: (step: number) => void;
	onError?: (error: Error) => void;
}

// Toast message scenarios
export interface ButtonToastScenarios {
	// Save Configuration Button
	saveConfigurationStart: string;
	saveConfigurationSuccess: string;
	saveConfigurationError: string;
	saveConfigurationValidationError: string;

	// PKCE Buttons
	pkceGenerated: string;
	pkceGenerationError: string;
	pkceVerifierCopied: string;
	pkceChallengeCopied: string;

	// Authorization URL Buttons
	authUrlGenerated: string;
	authUrlGenerationError: string;
	authUrlCopied: string;
	authUrlOpened: string;

	// Token Exchange Button
	tokenExchangeStart: string;
	tokenExchangeSuccess: string;
	tokenExchangeError: string;
	authCodeCopied: string;

	// User Info
	userInfoFetched: string;
	userInfoError: string;

	// Navigation Buttons
	stepCompleted: string;
	stepError: string;
	flowCompleted: string;

	// Quiz Buttons
	quizCorrect: string;
	quizIncorrect: string;

	// Scope Selection
	scopeUpdated: string;
	scopeRequired: string;

	// Copy Functionality
	copySuccess: string;
	copyError: string;

	// Token Loading
	tokenLoadedFromStorage: string;
	tokenLoadedFromDashboard: string;
	sampleTokenLoaded: string;
	badTokenLoaded: string;
	noTokensInStorage: string;
	noTokensInSession: string;

	// Token Introspection
	introspectionNotSupported: string;
	introspectionCredentialsRequired: string;
	introspectionSuccess: string;

	// Network/Server Errors
	networkError: string;
	serverError: string;
	timeoutError: string;
}

// Node server error handling
export interface NodeServerErrorHandling {
	// HTTP Status Codes
	400: string;
	401: string;
	403: string;
	404: string;
	429: string;
	500: string;
	502: string;
	503: string;
	504: string;

	// Network Errors
	NETWORK_ERROR: string;
	TIMEOUT_ERROR: string;
	PARSE_ERROR: string;

	// PingOne Specific Errors
	INVALID_CLIENT: string;
	INVALID_GRANT: string;
	INVALID_REQUEST: string;
	ACCESS_DENIED: string;
	EXPIRED_TOKEN: string;
}
