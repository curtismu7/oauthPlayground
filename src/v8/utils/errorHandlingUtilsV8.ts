/**
 * @file errorHandlingUtilsV8.ts
 * @module v8/utils
 * @description Shared error handling utilities for consistent error management
 * @version 8.0.0
 *
 * Provides standardized functions for handling, formatting, and displaying errors
 * across all MFA and OAuth flows.
 */

const MODULE_TAG = '[⚠️ ERROR-HANDLING-UTILS-V8]';

export interface ErrorDetails {
	message: string;
	code?: string;
	statusCode?: number;
	originalError?: unknown;
	context?: Record<string, unknown>;
}

/**
 * Extract error message from various error types
 *
 * @param error - Error object (Error, string, or unknown)
 * @returns Human-readable error message
 */
export function extractErrorMessage(error: unknown): string {
	if (error instanceof Error) {
		return error.message;
	}

	if (typeof error === 'string') {
		return error;
	}

	if (error && typeof error === 'object') {
		// Try common error message properties
		const errorObj = error as Record<string, unknown>;
		if (errorObj.message && typeof errorObj.message === 'string') {
			return errorObj.message;
		}
		if (errorObj.error && typeof errorObj.error === 'string') {
			return errorObj.error;
		}
		if (errorObj.error_description && typeof errorObj.error_description === 'string') {
			return errorObj.error_description;
		}
	}

	return 'An unknown error occurred';
}

/**
 * Extract error code from error object
 *
 * @param error - Error object
 * @returns Error code if available, null otherwise
 */
export function extractErrorCode(error: unknown): string | null {
	if (error && typeof error === 'object') {
		const errorObj = error as Record<string, unknown>;
		if (errorObj.code && typeof errorObj.code === 'string') {
			return errorObj.code;
		}
		if (errorObj.error && typeof errorObj.error === 'string') {
			return errorObj.error;
		}
	}

	return null;
}

/**
 * Extract HTTP status code from error
 *
 * @param error - Error object (may be a fetch Response or error with status property)
 * @returns Status code if available, null otherwise
 */
export function extractStatusCode(error: unknown): number | null {
	if (error && typeof error === 'object') {
		const errorObj = error as Record<string, unknown>;
		if (errorObj.status && typeof errorObj.status === 'number') {
			return errorObj.status;
		}
		if (errorObj.statusCode && typeof errorObj.statusCode === 'number') {
			return errorObj.statusCode;
		}
	}

	return null;
}

/**
 * Create standardized error details object
 *
 * @param error - Error object
 * @param context - Additional context information
 * @returns Standardized error details
 */
export function createErrorDetails(
	error: unknown,
	context?: Record<string, unknown>
): ErrorDetails {
	return {
		message: extractErrorMessage(error),
		code: extractErrorCode(error) || undefined,
		statusCode: extractStatusCode(error) || undefined,
		originalError: error,
		context: context || undefined,
	};
}

/**
 * Check if error is a network error
 *
 * @param error - Error object
 * @returns True if error appears to be a network error
 */
export function isNetworkError(error: unknown): boolean {
	if (error instanceof Error) {
		const message = error.message.toLowerCase();
		return (
			message.includes('network') ||
			message.includes('fetch') ||
			message.includes('connection') ||
			message.includes('timeout') ||
			message.includes('failed to fetch')
		);
	}

	return false;
}

/**
 * Check if error is an authentication/authorization error
 *
 * @param error - Error object
 * @returns True if error appears to be an auth error
 */
export function isAuthError(error: unknown): boolean {
	const statusCode = extractStatusCode(error);
	const code = extractErrorCode(error);
	const message = extractErrorMessage(error).toLowerCase();

	// Check status codes
	if (statusCode === 401 || statusCode === 403) {
		return true;
	}

	// Check error codes
	if (code === 'unauthorized' || code === 'forbidden' || code === 'invalid_token') {
		return true;
	}

	// Check message content
	if (
		message.includes('unauthorized') ||
		message.includes('forbidden') ||
		message.includes('invalid token') ||
		message.includes('expired token') ||
		message.includes('authentication')
	) {
		return true;
	}

	return false;
}

/**
 * Format error for user display
 *
 * @param error - Error object
 * @param options - Formatting options
 * @returns User-friendly error message
 */
export function formatErrorForUser(
	error: unknown,
	options?: {
		includeDetails?: boolean;
		maxLength?: number;
	}
): string {
	const { includeDetails = false, maxLength = 200 } = options || {};

	const errorDetails = createErrorDetails(error);
	let message = errorDetails.message;

	// Add status code if available and details requested
	if (includeDetails && errorDetails.statusCode) {
		message = `[${errorDetails.statusCode}] ${message}`;
	}

	// Truncate if too long
	if (message.length > maxLength) {
		message = `${message.substring(0, maxLength - 3)}...`;
	}

	return message;
}

/**
 * Log error with context
 *
 * @param error - Error object
 * @param context - Additional context
 * @param level - Log level ('error' | 'warn' | 'info')
 */
export function logError(
	error: unknown,
	context?: Record<string, unknown>,
	level: 'error' | 'warn' | 'info' = 'error'
): void {
	const errorDetails = createErrorDetails(error, context);

	const logData = {
		message: errorDetails.message,
		code: errorDetails.code,
		statusCode: errorDetails.statusCode,
		context: errorDetails.context,
		isNetworkError: isNetworkError(error),
		isAuthError: isAuthError(error),
	};

	if (level === 'error') {
		console.error(`${MODULE_TAG} Error:`, logData);
	} else if (level === 'warn') {
		console.warn(`${MODULE_TAG} Warning:`, logData);
	} else {
		console.log(`${MODULE_TAG} Info:`, logData);
	}
}
