// PAR Flow V9 Type Definitions
// Resolves missing type issues in PingOnePARFlowV9.tsx

export interface PKCECodes {
	codeVerifier: string;
	codeChallenge: string;
	codeChallengeMethod?: string;
}

export interface V9FlowCredentials {
	clientId: string;
	clientSecret: string;
	environmentId: string;
	redirectUri?: string;
	scope?: string;
	responseType?: string;
	grantType?: string;
	clientAuthMethod?: string;
	[key: string]: any;
}

export interface BannerOptions {
	type: 'success' | 'error' | 'warning' | 'info';
	title: string;
	message: string;
	dismissible?: boolean;
	duration?: number;
}

export interface FooterMessageOptions {
	type: 'success' | 'error' | 'warning' | 'info';
	message: string;
	duration?: number;
}

export interface PARFlowState {
	currentStep: number;
	isLoading: boolean;
	error: string | null;
	pkceCodes: PKCECodes | null;
	parResponse: any;
	authResponse: any;
	tokens: any;
}
