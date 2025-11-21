/**
 * @file services.ts
 * @module v8/types
 * @description Service interfaces for dependency injection and testing
 * @version 8.0.0
 * @since 2024-11-16
 *
 * These interfaces define the contracts for all V8 services.
 * Using interfaces allows for:
 * - Easy mocking in tests
 * - Dependency injection
 * - Clear service contracts
 * - Better IDE support
 *
 * @example
 * import { ICredentialsService } from '@/v8/types/services';
 * const mockService: ICredentialsService = { ... };
 */

/**
 * Credentials data structure
 */
export interface Credentials {
	environmentId: string;
	clientId: string;
	clientSecret?: string;
	redirectUri?: string;
	logoutUri?: string;
	scopes?: string;
	[key: string]: any;
}

/**
 * Credentials configuration for a flow
 */
export interface CredentialsConfig {
	flowKey: string;
	flowType: 'oauth' | 'oidc' | 'client-credentials' | 'device-code' | 'ropc' | 'hybrid' | 'pkce';
	includeClientSecret: boolean;
	includeRedirectUri: boolean;
	includeLogoutUri: boolean;
	includeScopes: boolean;
	defaultScopes?: string;
	defaultRedirectUri?: string;
	defaultLogoutUri?: string;
}

/**
 * Application configuration from PingOne
 */
export interface AppConfig {
	clientId: string;
	redirectUris: string[];
	logoutUris?: string[];
	grantTypes: string[];
	scopes?: string[];
	responseTypes?: string[];
}

/**
 * Validation result
 */
export interface ValidationResult {
	errors: string[];
	warnings: string[];
	isValid: boolean;
}

/**
 * Authorization URL generation result
 */
export interface AuthorizationUrlResult {
	authorizationUrl: string;
	state: string;
	codeChallenge?: string;
	codeChallengeMethod?: string;
	nonce?: string;
}

/**
 * Token exchange result
 */
export interface TokenResult {
	accessToken: string;
	idToken?: string;
	refreshToken?: string;
	tokenType: string;
	expiresIn: number;
	scope?: string;
}

/**
 * Decoded JWT token
 */
export interface DecodedToken {
	header: Record<string, any>;
	payload: Record<string, any>;
	signature: string;
}

/**
 * Credentials Service Interface
 * Manages credentials storage, retrieval, and validation
 */
export interface ICredentialsService {
	/**
	 * Get smart defaults for a flow
	 */
	getSmartDefaults(flowKey: string): Credentials;

	/**
	 * Get flow configuration
	 */
	getFlowConfig(flowKey: string): CredentialsConfig | undefined;

	/**
	 * Load credentials with app discovery
	 */
	loadWithAppDiscovery(flowKey: string, appConfig: AppConfig): Credentials;

	/**
	 * Check if redirect URI needs app update
	 */
	needsRedirectUriUpdate(flowKey: string, currentUri: string, appUris: string[]): boolean;

	/**
	 * Check if logout URI needs app update
	 */
	needsLogoutUriUpdate(flowKey: string, currentUri: string, appUris: string[] | undefined): boolean;

	/**
	 * Load credentials from storage
	 */
	loadCredentials(flowKey: string, config: CredentialsConfig): Credentials;

	/**
	 * Save credentials to storage
	 */
	saveCredentials(flowKey: string, credentials: Credentials): void;

	/**
	 * Clear credentials from storage
	 */
	clearCredentials(flowKey: string): void;

	/**
	 * Validate credentials
	 */
	validateCredentials(credentials: Credentials, config: CredentialsConfig): ValidationResult;

	/**
	 * Export credentials as JSON
	 */
	exportCredentials(credentials: Credentials): string;

	/**
	 * Import credentials from JSON
	 */
	importCredentials(json: string): Credentials;

	/**
	 * Check if credentials are stored
	 */
	hasStoredCredentials(flowKey: string): boolean;
}

/**
 * OAuth Integration Service Interface
 * Handles OAuth 2.0 Authorization Code flow logic
 */
export interface IOAuthIntegrationService {
	/**
	 * Generate authorization URL
	 */
	generateAuthorizationUrl(credentials: Credentials): AuthorizationUrlResult;

	/**
	 * Parse callback URL
	 */
	parseCallbackUrl(callbackUrl: string, expectedState: string): { code: string; state: string };

	/**
	 * Exchange authorization code for tokens
	 */
	exchangeCodeForTokens(
		credentials: Credentials,
		code: string,
		codeVerifier?: string
	): Promise<TokenResult>;

	/**
	 * Refresh access token
	 */
	refreshAccessToken(credentials: Credentials, refreshToken: string): Promise<TokenResult>;

	/**
	 * Decode JWT token
	 */
	decodeToken(token: string): DecodedToken;

	/**
	 * Validate token
	 */
	validateToken(token: string): boolean;
}

/**
 * Implicit Flow Integration Service Interface
 * Handles OAuth 2.0 Implicit flow logic
 */
export interface IImplicitFlowIntegrationService {
	/**
	 * Generate authorization URL
	 */
	generateAuthorizationUrl(credentials: Credentials): AuthorizationUrlResult;

	/**
	 * Parse callback URL fragment
	 */
	parseCallbackUrl(callbackUrl: string, expectedState: string): TokenResult;

	/**
	 * Decode JWT token
	 */
	decodeToken(token: string): DecodedToken;

	/**
	 * Validate token
	 */
	validateToken(token: string): boolean;
}

/**
 * Validation Service Interface
 * Handles validation of credentials and configuration
 */
export interface IValidationService {
	/**
	 * Validate credentials
	 */
	validateCredentials(credentials: Credentials, flowType: string): ValidationResult;

	/**
	 * Validate environment ID
	 */
	validateEnvironmentId(environmentId: string): boolean;

	/**
	 * Validate client ID
	 */
	validateClientId(clientId: string): boolean;

	/**
	 * Validate redirect URI
	 */
	validateRedirectUri(redirectUri: string): boolean;

	/**
	 * Validate scopes
	 */
	validateScopes(scopes: string, flowType: string): ValidationResult;
}

/**
 * Storage Service Interface
 * Handles localStorage operations
 */
export interface IStorageService {
	/**
	 * Get item from storage
	 */
	getItem(key: string): string | null;

	/**
	 * Set item in storage
	 */
	setItem(key: string, value: string): void;

	/**
	 * Remove item from storage
	 */
	removeItem(key: string): void;

	/**
	 * Clear all storage
	 */
	clear(): void;

	/**
	 * Check if storage is available
	 */
	isAvailable(): boolean;
}

/**
 * Error Handler Service Interface
 * Handles error logging and reporting
 */
export interface IErrorHandlerService {
	/**
	 * Handle error
	 */
	handleError(error: Error | string, context?: Record<string, any>): void;

	/**
	 * Log error
	 */
	logError(message: string, error?: Error, context?: Record<string, any>): void;

	/**
	 * Log warning
	 */
	logWarning(message: string, context?: Record<string, any>): void;

	/**
	 * Log info
	 */
	logInfo(message: string, context?: Record<string, any>): void;

	/**
	 * Get error message
	 */
	getErrorMessage(error: Error | string): string;
}

/**
 * Flow Reset Service Interface
 * Handles flow state reset
 */
export interface IFlowResetService {
	/**
	 * Reset flow state
	 */
	resetFlow(flowKey: string): void;

	/**
	 * Reset all flows
	 */
	resetAllFlows(): void;

	/**
	 * Get reset status
	 */
	getResetStatus(flowKey: string): boolean;
}

/**
 * Service Factory Interface
 * Creates service instances with dependency injection
 */
export interface IServiceFactory {
	/**
	 * Create credentials service
	 */
	createCredentialsService(): ICredentialsService;

	/**
	 * Create OAuth integration service
	 */
	createOAuthIntegrationService(): IOAuthIntegrationService;

	/**
	 * Create implicit flow integration service
	 */
	createImplicitFlowIntegrationService(): IImplicitFlowIntegrationService;

	/**
	 * Create validation service
	 */
	createValidationService(): IValidationService;

	/**
	 * Create storage service
	 */
	createStorageService(): IStorageService;

	/**
	 * Create error handler service
	 */
	createErrorHandlerService(): IErrorHandlerService;

	/**
	 * Create flow reset service
	 */
	createFlowResetService(): IFlowResetService;
}

export default {
	ICredentialsService,
	IOAuthIntegrationService,
	IImplicitFlowIntegrationService,
	IValidationService,
	IStorageService,
	IErrorHandlerService,
	IFlowResetService,
	IServiceFactory,
};
