// src/v8/types/tokenExchangeTypesV8.ts
// Token Exchange Phase 1 - RFC 8693 Implementation Types

/**
 * Token Exchange Parameters - RFC 8693 Section 2.1
 */
export interface TokenExchangeParams {
	subject_token: string;
	subject_token_type:
		| 'urn:ietf:params:oauth:token-type:access_token'
		| 'urn:ietf:params:oauth:token-type:id_token';
	requested_token_type: 'urn:ietf:params:oauth:token-type:access_token';
	scope?: string;
	actor_token?: string;
	actor_token_type?: string;
	resource?: string;
	audience?: string;
}

/**
 * Token Exchange Response - RFC 8693 Section 2.2
 */
export interface TokenExchangeResponse {
	access_token: string;
	token_type: 'Bearer';
	expires_in: number;
	scope?: string;
	issued_token_type: 'urn:ietf:params:oauth:token-type:access_token';
}

/**
 * Token Validation Result
 */
export interface TokenValidationResult {
	isValid: boolean;
	environmentId: string;
	tokenType: 'access_token' | 'id_token';
	expiresAt?: number;
	subject?: string;
	audience?: string[];
	issuer?: string;
	error?: string;
}

/**
 * Admin Token Exchange Configuration
 */
export interface AdminTokenExchangeConfig {
	enabled: boolean;
	allowedScopes: string[];
	maxTokenLifetime: number; // in seconds
	allowedAudiences: string[];
	requireSameEnvironment: boolean;
	lastUpdated: number;
	updatedBy: string;
}

/**
 * Token Exchange Error Types
 */
export enum TokenExchangeErrorType {
	ADMIN_DISABLED = 'ADMIN_DISABLED',
	INVALID_TOKEN = 'INVALID_TOKEN',
	WRONG_ENVIRONMENT = 'WRONG_ENVIRONMENT',
	EXPIRED_TOKEN = 'EXPIRED_TOKEN',
	INVALID_SCOPE = 'INVALID_SCOPE',
	UNSUPPORTED_TOKEN_TYPE = 'UNSUPPORTED_TOKEN_TYPE',
	MISSING_ACTOR_TOKEN = 'MISSING_ACTOR_TOKEN',
	INVALID_REQUEST = 'INVALID_REQUEST',
	SERVER_ERROR = 'SERVER_ERROR',
}

/**
 * Token Exchange Error
 */
export class TokenExchangeError extends Error {
	constructor(
		public type: TokenExchangeErrorType,
		message: string,
		public details?: Record<string, unknown>
	) {
		super(message);
		this.name = 'TokenExchangeError';
	}
}

/**
 * Token Exchange Context for Expressions
 * Available in PingOne attribute mapping expressions
 */
export interface TokenExchangeContext {
	requestData: {
		grantType: 'urn:ietf:params:oauth:grant-type:token-exchange';
		subjectToken: Record<string, unknown>;
		subjectTokenType: string;
		requestedTokenType: string;
		scope?: string;
		actorToken?: Record<string, unknown>;
		actorTokenType?: string;
		resource?: string;
		audience?: string[];
	};
	appConfig: {
		clientId: string;
		tokenEndpointAuthMethod: string;
		envId: string;
		orgId: string;
	};
}
