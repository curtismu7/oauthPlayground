// src/pages/flows/OAuthAuthorizationCodeFlowV7_1/types/flowTypes.ts
// V7.1 Flow Types - TypeScript interfaces for the OAuth Authorization Code Flow

import type { PingOneApplicationState } from '../../../components/PingOneApplicationConfig';
import type { StepCredentials } from '../../../components/steps/CommonSteps';

// Flow variant types
export type FlowVariant = 'oauth' | 'oidc';

// Step completion state
export type StepCompletionState = Record<number, boolean>;

// Auth code state
export interface AuthCodeState {
	code: string | null;
	source: 'url' | 'session' | 'manual';
	timestamp: number;
}

// Flow state interface
export interface FlowState {
	authCode: AuthCodeState;
	currentStep: number;
	flowVariant: FlowVariant;
	collapsedSections: Record<string, boolean>;
	showModals: {
		redirect: boolean;
		loginSuccess: boolean;
	};
}

// PKCE codes interface
export interface PKCECodes {
	codeVerifier: string;
	codeChallenge: string;
	codeChallengeMethod: string;
}

// Token response interface
export interface TokenResponse {
	access_token: string;
	token_type: string;
	expires_in: number;
	refresh_token?: string;
	id_token?: string;
	scope?: string;
}

// User info interface
export interface UserInfo {
	sub: string;
	name?: string;
	given_name?: string;
	family_name?: string;
	email?: string;
	email_verified?: boolean;
	picture?: string;
	locale?: string;
	[key: string]: any;
}

// Flow configuration interface
export interface FlowConfig {
	flowKey: string;
	defaultFlowVariant: FlowVariant;
	totalSteps: number;
	enablePKCE: boolean;
	enableState: boolean;
	enableNonce: boolean;
	enableAudience: boolean;
	enableResources: boolean;
}

// Step configuration interface
export interface StepConfig {
	title: string;
	subtitle: string;
	description: string;
	icon: string;
	isOverview?: boolean;
	isSetup?: boolean;
	isPKCE?: boolean;
	isAuthorization?: boolean;
	isResponse?: boolean;
	isTokenExchange?: boolean;
	isValidation?: boolean;
	isUserInfo?: boolean;
	isComplete?: boolean;
}

// Flow credentials interface
export interface FlowCredentials extends StepCredentials {
	environmentId: string;
	clientId: string;
	clientSecret: string;
	redirectUri: string;
	scope: string;
	state?: string;
	nonce?: string;
	audience?: string;
	resources?: string[];
}

// Flow controller interface
export interface FlowController {
	flowVariant: FlowVariant;
	setFlowVariant: (variant: FlowVariant) => void;
	persistKey: string;
	credentials: FlowCredentials;
	setCredentials: (creds: FlowCredentials) => void;
	currentStep: number;
	setCurrentStep: (step: number) => void;
	pkceCodes: PKCECodes;
	setPkceCodes: (codes: PKCECodes) => void;
	authCode: string | null;
	setAuthCode: (code: string) => void;
	tokens: TokenResponse | null;
	setTokens: (tokens: TokenResponse) => void;
	userInfo: UserInfo | null;
	setUserInfo: (info: UserInfo) => void;
	stepCompletion: StepCompletionState;
	setStepCompletion: (completion: StepCompletionState) => void;
	collapsedSections: Record<string, boolean>;
	setCollapsedSections: (sections: Record<string, boolean>) => void;
	showModals: {
		redirect: boolean;
		loginSuccess: boolean;
	};
	setShowModals: (modals: { redirect: boolean; loginSuccess: boolean }) => void;
}

// Flow props interface
export interface FlowProps {
	flowVariant?: FlowVariant;
	initialStep?: number;
	onStepChange?: (step: number) => void;
	onVariantChange?: (variant: FlowVariant) => void;
	onComplete?: (result: FlowResult) => void;
	onError?: (error: Error) => void;
}

// Flow result interface
export interface FlowResult {
	success: boolean;
	tokens?: TokenResponse;
	userInfo?: UserInfo;
	error?: string;
	step: number;
	variant: FlowVariant;
	timestamp: number;
}

// Flow error interface
export interface FlowError {
	code: string;
	message: string;
	details?: any;
	step: number;
	timestamp: number;
}

// Flow validation interface
export interface FlowValidation {
	isValid: boolean;
	errors: string[];
	warnings: string[];
	step: number;
}

// Flow navigation interface
export interface FlowNavigation {
	currentStep: number;
	totalSteps: number;
	canGoBack: boolean;
	canGoForward: boolean;
	isComplete: boolean;
	steps: {
		index: number;
		title: string;
		completed: boolean;
		current: boolean;
	}[];
}

// Flow storage interface
export interface FlowStorage {
	flowId: string;
	flowVariant: FlowVariant;
	currentStep: number;
	credentials: FlowCredentials;
	pkceCodes: PKCECodes;
	authCode: string | null;
	tokens: TokenResponse | null;
	userInfo: UserInfo | null;
	stepCompletion: StepCompletionState;
	collapsedSections: Record<string, boolean>;
	timestamp: number;
}

// Flow service interface
export interface FlowService {
	saveFlow: (flow: FlowStorage) => Promise<void>;
	loadFlow: (flowId: string) => Promise<FlowStorage | null>;
	deleteFlow: (flowId: string) => Promise<void>;
	listFlows: () => Promise<FlowStorage[]>;
}

// Flow event interface
export interface FlowEvent {
	type: 'step_change' | 'variant_change' | 'token_received' | 'error' | 'complete';
	data: any;
	timestamp: number;
	flowId: string;
	step: number;
	variant: FlowVariant;
}

// Flow event handler interface
export interface FlowEventHandler {
	onStepChange: (event: FlowEvent) => void;
	onVariantChange: (event: FlowEvent) => void;
	onTokenReceived: (event: FlowEvent) => void;
	onError: (event: FlowEvent) => void;
	onComplete: (event: FlowEvent) => void;
}

// Flow hook interface
export interface FlowHook {
	flowState: FlowState;
	flowController: FlowController;
	flowNavigation: FlowNavigation;
	flowValidation: FlowValidation;
	updateFlowState: (updates: Partial<FlowState>) => void;
	resetFlow: () => void;
	saveFlow: () => Promise<void>;
	loadFlow: (flowId: string) => Promise<void>;
}

// Flow component props interface
export interface FlowComponentProps {
	flowState: FlowState;
	flowController: FlowController;
	flowNavigation: FlowNavigation;
	flowValidation: FlowValidation;
	onUpdate: (updates: Partial<FlowState>) => void;
	onReset: () => void;
	onSave: () => Promise<void>;
	onLoad: (flowId: string) => Promise<void>;
}

// Flow step props interface
export interface FlowStepProps extends FlowComponentProps {
	step: number;
	stepConfig: StepConfig;
	isActive: boolean;
	isCompleted: boolean;
	isCollapsed: boolean;
	onToggleCollapse: () => void;
	onComplete: () => void;
	onError: (error: Error) => void;
}

// Flow header props interface
export interface FlowHeaderProps {
	flowVariant: FlowVariant;
	onVariantChange: (variant: FlowVariant) => void;
	currentStep: number;
	totalSteps: number;
	isCollapsed: boolean;
	onToggleCollapse: () => void;
}

// Flow navigation props interface
export interface FlowNavigationProps {
	currentStep: number;
	totalSteps: number;
	canGoBack: boolean;
	canGoForward: boolean;
	isComplete: boolean;
	onStepChange: (step: number) => void;
	onReset: () => void;
}

// Flow results props interface
export interface FlowResultsProps {
	tokens: TokenResponse | null;
	userInfo: UserInfo | null;
	flowVariant: FlowVariant;
	onCopy: (text: string) => void;
	onIntrospect: (token: string) => Promise<void>;
}

// Flow configuration props interface
export interface FlowConfigurationProps {
	credentials: FlowCredentials;
	onCredentialsChange: (credentials: FlowCredentials) => void;
	flowVariant: FlowVariant;
	onVariantChange: (variant: FlowVariant) => void;
	appConfig: PingOneApplicationState;
	onAppConfigChange: (config: PingOneApplicationState) => void;
}

// Flow constants interface
export interface FlowConstants {
	TIMING: {
		ADVANCED_PARAMS_SAVE_DURATION: number;
		MODAL_AUTO_CLOSE_DELAY: number;
		TOKEN_INTROSPECTION_DELAY: number;
		COPY_FEEDBACK_DURATION: number;
	};
	PKCE: {
		CODE_VERIFIER_LENGTH: number;
		CODE_VERIFIER_MAX_LENGTH: number;
		CHALLENGE_METHOD: string;
	};
	DEFAULTS: {
		REDIRECT_URI: string;
		SCOPE: string;
		RESPONSE_TYPE: string;
		PROFILE_SCOPE: string;
	};
	STORAGE: {
		CURRENT_STEP: string;
		APP_CONFIG: string;
		PKCE_CODES: string;
		AUTH_CODE: string;
		FLOW_SOURCE: string;
	};
	FLOW: {
		TOTAL_STEPS: number;
		DEFAULT_VARIANT: FlowVariant;
		FLOW_KEY: string;
		FALLBACK_FLOW_ID: string;
	};
}

// Export all types
export type { PingOneApplicationState, StepCredentials };
