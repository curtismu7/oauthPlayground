/**
 * @file unifiedWorkerTokenTypes.ts
 * @description Types for unified worker token service
 * @version 1.0.0
 */

export interface WorkerAccessToken {
	access_token: string;
	token_type: string;
	expires_in: number;
	scope?: string;
	fetchedAt: number;
	expiresAt: number;
}

export interface WorkerTokenCredentials {
	environmentId: string;
	clientId: string;
	clientSecret: string;
	scopes?: string[];
	region?: 'us' | 'eu' | 'ap' | 'ca';
	tokenEndpoint?: string;
	tokenEndpointAuthMethod?:
		| 'none'
		| 'client_secret_basic'
		| 'client_secret_post'
		| 'client_secret_jwt'
		| 'private_key_jwt';
}

export interface WorkerTokenStatus {
	hasCredentials: boolean;
	hasToken: boolean;
	tokenValid: boolean;
	tokenExpiresIn?: number;
	lastFetchedAt?: number;
}
