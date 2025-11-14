// src/types/credentials.ts
// Type definitions for the credential storage system

/**
 * Flow-specific credentials
 * Each OAuth/OIDC flow has its own isolated credentials
 */
export interface FlowCredentials {
	environmentId: string;
	clientId: string;
	clientSecret?: string;
	redirectUri?: string;
	scopes?: string[];

	// Optional endpoints (from discovery)
	authorizationEndpoint?: string;
	tokenEndpoint?: string;
	userInfoEndpoint?: string;
	endSessionEndpoint?: string;

	// Flow-specific settings
	clientAuthMethod?: string;
	responseType?: string;
	responseMode?: string;

	// Metadata
	savedAt?: number;
	lastUsedAt?: number;
}

/**
 * Metadata about stored credentials
 */
export interface CredentialMetadata {
	flowKey: string;
	hasCredentials: boolean;
	savedAt?: number;
	lastUsedAt?: number;
	source?: 'memory' | 'browser' | 'file';
}

/**
 * Result of a storage operation
 */
export interface StorageResult<T> {
	success: boolean;
	data: T | null;
	source: 'memory' | 'browser' | 'file' | 'none';
	error?: string;
	timestamp?: number;
}

/**
 * Configuration for credential storage
 */
export interface CredentialStorageConfig {
	enableFileStorage: boolean;
	enableMemoryCache: boolean;
	fileStoragePath: string;
	encryptSecrets: boolean;
}

/**
 * Worker Token credentials (shared across app)
 */
export interface WorkerTokenCredentials {
	environmentId: string;
	clientId: string;
	clientSecret: string;
	scopes: string[];
	region: 'us' | 'eu' | 'ap' | 'ca';
	tokenEndpoint: string;
}

/**
 * Worker Access Token (shared across app)
 */
export interface WorkerAccessToken {
	access_token: string;
	token_type: string;
	expires_in: number;
	scope: string;
	// Computed fields
	fetchedAt: number;
	expiresAt: number;
}

/**
 * Worker Token status information
 */
export interface WorkerTokenStatus {
	hasCredentials: boolean;
	hasToken: boolean;
	tokenValid: boolean;
	tokenExpiresIn?: number; // seconds
	lastFetchedAt?: number;
}

/**
 * Credential load errors
 */
export enum CredentialLoadError {
	NOT_FOUND = 'CREDENTIALS_NOT_FOUND',
	PARSE_ERROR = 'CREDENTIALS_PARSE_ERROR',
	FILE_READ_ERROR = 'FILE_READ_ERROR',
	PERMISSION_DENIED = 'PERMISSION_DENIED',
}

/**
 * Credential error details
 */
export interface CredentialError {
	code: CredentialLoadError;
	message: string;
	flowKey: string;
	source: 'browser' | 'file';
	recoverable: boolean;
}

/**
 * Worker Token errors
 */
export enum WorkerTokenError {
	NO_CREDENTIALS = 'NO_WORKER_CREDENTIALS',
	INVALID_CREDENTIALS = 'INVALID_WORKER_CREDENTIALS',
	FETCH_FAILED = 'TOKEN_FETCH_FAILED',
	NETWORK_ERROR = 'NETWORK_ERROR',
	TOKEN_EXPIRED = 'TOKEN_EXPIRED',
}

/**
 * Worker Token error details
 */
export interface WorkerTokenErrorDetails {
	code: WorkerTokenError;
	message: string;
	retryable: boolean;
	retryAfter?: number; // seconds
}
