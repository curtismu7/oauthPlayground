export interface FlowState {
	// Authorization URL flows (authz, implicit, hybrid)
	authorizationUrl?: string;
	state?: string;
	nonce?: string;
	codeVerifier?: string;
	codeChallenge?: string;
	// PAR (Pushed Authorization Request) information
	parRequestUri?: string;
	parExpiresIn?: number;

	// Authorization Code flows
	authorizationCode?: string;

	// Device Code flow
	deviceCode?: string;
	userCode?: string;
	verificationUri?: string;
	verificationUriComplete?: string; // URI with user code pre-filled (RFC 8628)
	deviceCodeExpiresIn?: number;
	deviceCodeExpiresAt?: number; // Timestamp when device code expires
	deviceCodeInterval?: number; // Polling interval from server response (RFC 8628 Section 3.2)
	pollingStatus?: {
		isPolling: boolean;
		pollCount: number;
		lastPolled: number;
	};

	// Tokens
	tokens?: {
		accessToken: string;
		idToken?: string;
		refreshToken?: string;
		expiresIn?: number;
	};

	// User info
	userInfo?: Record<string, unknown>;

	// Fragment data for implicit/hybrid flows
	fragmentData?: {
		access_token?: string;
		id_token?: string;
		refresh_token?: string;
		token_type?: string;
		expires_in?: number;
		scope?: string;
		state?: string;
	};
}

export interface UnifiedFlowStepsProps {
	specVersion: 'oauth2.0' | 'oauth2.1' | 'oidc';
	flowType: 'oauth-authz' | 'implicit' | 'hybrid' | 'client-credentials' | 'device-code';
	credentials: UnifiedFlowCredentials;
	onCredentialsChange?: (credentials: UnifiedFlowCredentials) => void;
	onStepChange?: (step: number) => void;
	onCompletedStepsChange?: (steps: number[]) => void;
	onFlowReset?: () => void;
	appConfig?:
		| {
				pkceRequired?: boolean;
				pkceEnforced?: boolean;
				[key: string]: unknown;
		  }
		| undefined;
	blockContent?: boolean;
}

export interface UnifiedFlowCredentials {
	environmentId: string;
	clientId: string;
	clientSecret?: string;
	redirectUri?: string;
	scopes: string;
	usePKCE?: boolean;
	pkceEnforcement?: 'OPTIONAL' | 'REQUIRED' | 'S256_REQUIRED' | 'NONE';
	clientAuthMethod?:
		| 'none'
		| 'client_secret_basic'
		| 'client_secret_post'
		| 'client_secret_jwt'
		| 'private_key_jwt';
	responseType?: string;
	enableRefreshToken?: boolean;
	[key: string]: unknown;
}

export interface NavigationState {
	currentStep: number;
	totalSteps: number;
	completedSteps: number[];
	canGoPrevious: boolean;
	canGoNext: boolean;
	goToPrevious: () => void;
	goToNext: () => void;
	navigateToStep: (step: number) => void;
	markStepComplete: () => void;
}

export interface StepRendererProps {
	flowType: string;
	specVersion: string;
	credentials: UnifiedFlowCredentials;
	flowState: FlowState;
	nav: NavigationState;
	isLoading: boolean;
	loadingMessage: string;
	error: string | null;
	validationErrors: string[];
	validationWarnings: string[];
	onFlowStateChange: (updates: Partial<FlowState>) => void;
	onErrorChange: (error: string | null) => void;
	onValidationErrorsChange: (errors: string[]) => void;
	onValidationWarningsChange: (warnings: string[]) => void;
}

export type StepRenderer = React.FC<StepRendererProps>;

export interface CollapsibleSectionProps {
	title: string;
	icon?: React.ReactNode;
	children: React.ReactNode;
	defaultCollapsed?: boolean;
	variant?: 'default' | 'info' | 'warning' | 'success';
}

export interface InfoBoxProps {
	variant?: 'info' | 'warning' | 'success';
	children: React.ReactNode;
}

export interface PKCECodes {
	codeVerifier: string;
	codeChallenge: string;
	codeChallengeMethod: string;
}
