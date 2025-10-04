// Type definitions for OIDC Device Code flow

export interface DeviceCodeFlowConfig {
	deviceAuthorizationEndpoint: string;
	tokenEndpoint: string;
	clientId: string;
	scope: string[];
	environmentId: string;
}

export interface DeviceCodeFlowState {
	config: DeviceCodeFlowConfig;
	deviceCode?: string;
	userCode?: string;
	verificationUri?: string;
	verificationUriComplete?: string;
	expiresIn?: number;
	interval?: number;
	startTime?: number;
	tokens?: DeviceCodeTokens;
	status: 'idle' | 'requesting' | 'verifying' | 'polling' | 'success' | 'error' | 'expired';
	error?: string;
	pollingAttempts: number;
	pollingDuration: number;
}

export interface DeviceCodeTokens {
	access_token: string;
	token_type?: string;
	expires_in?: number;
	refresh_token?: string;
	scope?: string;
	id_token?: string;
	issued_at?: number;
}

export interface DeviceCodeStep {
	id: string;
	title: string;
	description: string;
	status: 'pending' | 'active' | 'completed' | 'error';
	canExecute: boolean;
	completed: boolean;
}

export interface DeviceVerificationProps {
	userCode: string;
	verificationUri: string;
	verificationUriComplete?: string;
	expiresIn: number;
	startTime: number;
	onCopyUserCode: () => void;
	onCopyVerificationUri: () => void;
}

export interface DevicePollingProps {
	deviceCode: string;
	clientId: string;
	tokenEndpoint: string;
	interval: number;
	onSuccess: (tokens: DeviceCodeTokens) => void;
	onError: (error: Error) => void;
	onProgress: (attempt: number, status: string) => void;
}

export interface DeviceCodePollingOptions {
	maxAttempts?: number;
	maxDuration?: number;
	onProgress?: (attempt: number, totalAttempts: number, status: string) => void;
	onSuccess?: (tokens: DeviceCodeTokens) => void;
	onError?: (error: Error) => void;
	onSlowDown?: (newInterval: number) => void;
}

export type DeviceCodeStatus =
	| 'idle'
	| 'requesting'
	| 'verifying'
	| 'polling'
	| 'success'
	| 'error'
	| 'expired';

export type PollingStatus =
	| 'authorization_pending'
	| 'slow_down'
	| 'expired_token'
	| 'access_denied'
	| 'invalid_grant';

export interface DeviceCodeError {
	type: 'network' | 'authorization' | 'validation' | 'polling' | 'expiry';
	message: string;
	details?: any;
	recoverable: boolean;
}
