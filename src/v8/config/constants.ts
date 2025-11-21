/**
 * @file constants.ts
 * @module v8/config
 * @description Centralized constants for all V8 flows
 * @version 8.0.0
 * @since 2024-11-16
 *
 * This file contains all magic strings, numbers, and configuration values
 * used throughout the V8 implementation. Centralizing these values makes
 * the code more maintainable and reduces the risk of typos.
 *
 * @example
 * import { FLOW_KEYS, DEFAULT_SCOPES } from '@/v8/config/constants';
 * const flowKey = FLOW_KEYS.OAUTH_AUTHZ;
 * const scopes = DEFAULT_SCOPES[flowKey];
 */

/**
 * Flow identifiers used throughout the application
 * These keys are used for storage, routing, and service configuration
 */
export const FLOW_KEYS = {
	OAUTH_AUTHZ: 'oauth-authz-v8',
	IMPLICIT: 'implicit-flow-v8',
	CLIENT_CREDENTIALS: 'client-credentials-v8',
	DEVICE_CODE: 'device-code-v8',
	ROPC: 'ropc-v8',
	HYBRID: 'hybrid-v8',
	PKCE: 'pkce-v8',
} as const;

export type FlowKey = (typeof FLOW_KEYS)[keyof typeof FLOW_KEYS];

/**
 * Default redirect URIs for each flow
 * These are used as smart defaults to minimize user input
 */
export const DEFAULT_REDIRECT_URIS: Record<FlowKey, string> = {
	[FLOW_KEYS.OAUTH_AUTHZ]: 'http://localhost:3000/callback',
	[FLOW_KEYS.IMPLICIT]: 'http://localhost:3000/implicit-callback',
	[FLOW_KEYS.CLIENT_CREDENTIALS]: '',
	[FLOW_KEYS.DEVICE_CODE]: '',
	[FLOW_KEYS.ROPC]: '',
	[FLOW_KEYS.HYBRID]: 'http://localhost:3000/callback',
	[FLOW_KEYS.PKCE]: 'http://localhost:3000/callback',
} as const;

/**
 * Default logout URIs for each flow
 * Only used for flows that support logout
 */
export const DEFAULT_LOGOUT_URIS: Record<FlowKey, string> = {
	[FLOW_KEYS.OAUTH_AUTHZ]: '',
	[FLOW_KEYS.IMPLICIT]: '',
	[FLOW_KEYS.CLIENT_CREDENTIALS]: '',
	[FLOW_KEYS.DEVICE_CODE]: '',
	[FLOW_KEYS.ROPC]: '',
	[FLOW_KEYS.HYBRID]: 'http://localhost:3000/logout',
	[FLOW_KEYS.PKCE]: '',
} as const;

/**
 * Default scopes for each flow
 * These are recommended scopes for each flow type
 */
export const DEFAULT_SCOPES: Record<FlowKey, string> = {
	[FLOW_KEYS.OAUTH_AUTHZ]: 'openid profile email',
	[FLOW_KEYS.IMPLICIT]: 'openid profile email',
	[FLOW_KEYS.CLIENT_CREDENTIALS]: 'api:read api:write',
	[FLOW_KEYS.DEVICE_CODE]: 'openid profile email',
	[FLOW_KEYS.ROPC]: 'openid profile email',
	[FLOW_KEYS.HYBRID]: 'openid profile email',
	[FLOW_KEYS.PKCE]: 'openid profile email',
} as const;

/**
 * Storage key prefix for credentials
 * All credentials are stored with this prefix
 */
export const STORAGE_PREFIX = 'v8_credentials_' as const;

/**
 * Storage key prefix for flow state
 * Flow-specific state is stored with this prefix
 */
export const FLOW_STATE_PREFIX = 'v8_flow_state_' as const;

/**
 * Module tags for logging
 * Each module uses a unique tag for easy filtering
 */
export const MODULE_TAGS = {
	CREDENTIALS_FORM: '[📋 CREDENTIALS-FORM-V8]',
	CREDENTIALS_SERVICE: '[💾 CREDENTIALS-SERVICE-V8]',
	OAUTH_AUTHZ: '[🔐 OAUTH-AUTHZ-CODE-V8]',
	IMPLICIT: '[🔓 IMPLICIT-FLOW-V8]',
	OAUTH_INTEGRATION: '[🔗 OAUTH-INTEGRATION-V8]',
	IMPLICIT_INTEGRATION: '[🔗 IMPLICIT-INTEGRATION-V8]',
	VALIDATION: '[✅ VALIDATION-V8]',
	STORAGE: '[💾 STORAGE-V8]',
	STEP_NAVIGATION: '[📍 STEP-NAVIGATION-V8]',
	ERROR_HANDLER: '[🚨 ERROR-HANDLER-V8]',
	FLOW_RESET: '[🔄 FLOW-RESET-V8]',
} as const;

/**
 * HTTP status codes used in error handling
 */
export const HTTP_STATUS = {
	OK: 200,
	CREATED: 201,
	BAD_REQUEST: 400,
	UNAUTHORIZED: 401,
	FORBIDDEN: 403,
	NOT_FOUND: 404,
	CONFLICT: 409,
	INTERNAL_SERVER_ERROR: 500,
	SERVICE_UNAVAILABLE: 503,
} as const;

/**
 * Error messages for common scenarios
 */
export const ERROR_MESSAGES = {
	INVALID_ENVIRONMENT_ID: 'Environment ID is required and must be a valid UUID',
	INVALID_CLIENT_ID: 'Client ID is required',
	INVALID_REDIRECT_URI: 'Redirect URI is required and must be a valid URL',
	INVALID_SCOPES: 'Scopes are required',
	MISSING_OPENID_SCOPE: 'OIDC flows require "openid" scope',
	STORAGE_UNAVAILABLE: 'localStorage is not available',
	INVALID_JSON: 'Invalid JSON format',
	UNKNOWN_FLOW_TYPE: 'Unknown flow type',
	NETWORK_ERROR: 'Network error occurred',
	INVALID_CREDENTIALS: 'Invalid credentials provided',
} as const;

/**
 * Validation patterns
 */
export const VALIDATION_PATTERNS = {
	UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
	URL: /^https?:\/\/.+/i,
	SCOPE: /^[\w\s:]+$/,
} as const;

/**
 * Step configuration for flows
 */
export const STEP_CONFIG = {
	OAUTH_AUTHZ: {
		TOTAL_STEPS: 4,
		LABELS: ['Configure', 'Auth URL', 'Callback', 'Tokens'],
	},
	IMPLICIT: {
		TOTAL_STEPS: 4,
		LABELS: ['Configure', 'Auth URL', 'Callback', 'Tokens'],
	},
	CLIENT_CREDENTIALS: {
		TOTAL_STEPS: 3,
		LABELS: ['Configure', 'Request Token', 'Tokens'],
	},
	DEVICE_CODE: {
		TOTAL_STEPS: 4,
		LABELS: ['Configure', 'Device Code', 'User Auth', 'Tokens'],
	},
} as const;

/**
 * Token types
 */
export const TOKEN_TYPES = {
	ACCESS: 'access_token',
	ID: 'id_token',
	REFRESH: 'refresh_token',
} as const;

/**
 * PKCE code challenge methods
 */
export const PKCE_METHODS = {
	S256: 'S256',
	PLAIN: 'plain',
} as const;

/**
 * Grant types
 */
export const GRANT_TYPES = {
	AUTHORIZATION_CODE: 'authorization_code',
	IMPLICIT: 'implicit',
	CLIENT_CREDENTIALS: 'client_credentials',
	DEVICE_CODE: 'urn:ietf:params:oauth:grant-type:device_code',
	REFRESH_TOKEN: 'refresh_token',
	PASSWORD: 'password',
	HYBRID: 'hybrid',
} as const;

/**
 * Response types
 */
export const RESPONSE_TYPES = {
	CODE: 'code',
	TOKEN: 'token',
	ID_TOKEN: 'id_token',
	CODE_ID_TOKEN: 'code id_token',
	CODE_TOKEN: 'code token',
	CODE_ID_TOKEN_TOKEN: 'code id_token token',
} as const;

/**
 * Common scopes
 */
export const COMMON_SCOPES = {
	OPENID: 'openid',
	PROFILE: 'profile',
	EMAIL: 'email',
	OFFLINE_ACCESS: 'offline_access',
	ADDRESS: 'address',
	PHONE: 'phone',
} as const;

/**
 * Timeout values (in milliseconds)
 */
export const TIMEOUTS = {
	STORAGE_OPERATION: 1000,
	API_CALL: 30000,
	DEBOUNCE: 300,
} as const;

/**
 * Regular expressions for validation
 */
export const REGEX = {
	ENVIRONMENT_ID: VALIDATION_PATTERNS.UUID,
	REDIRECT_URI: VALIDATION_PATTERNS.URL,
	SCOPE: VALIDATION_PATTERNS.SCOPE,
} as const;

export default {
	FLOW_KEYS,
	DEFAULT_REDIRECT_URIS,
	DEFAULT_LOGOUT_URIS,
	DEFAULT_SCOPES,
	STORAGE_PREFIX,
	FLOW_STATE_PREFIX,
	MODULE_TAGS,
	HTTP_STATUS,
	ERROR_MESSAGES,
	VALIDATION_PATTERNS,
	STEP_CONFIG,
	TOKEN_TYPES,
	PKCE_METHODS,
	GRANT_TYPES,
	RESPONSE_TYPES,
	COMMON_SCOPES,
	TIMEOUTS,
	REGEX,
};
