/**
 * @file errorHandler.ts
 * @module v8/services
 * @description Centralized error handling service for all V8 flows
 * @version 8.0.0
 * @since 2024-11-16
 *
 * Provides consistent error logging and handling across all V8 flows.
 * Features:
 * - Structured error logging with context
 * - Error level distinction (error, warn, info)
 * - Error message formatting
 * - Error tracking and reporting
 *
 * @example
 * import { ErrorHandler } from '@/mfa/services/errorHandler';
 *
 * try {
 *   // some operation
 * } catch (error) {
 *   ErrorHandler.handleError(error, { flowKey: 'oauth-authz-v8' });
 * }
 */

import { getErrorMessage } from '@/utils/errorMessageUtils';
import { ERROR_MESSAGES, MODULE_TAGS } from '@/mfa/config/constants';
import type { IErrorHandlerService } from '@/mfa/types/services';
import { logger } from '../../utils/logger';

const MODULE_TAG = MODULE_TAGS.ERROR_HANDLER;

/**
 * Error severity levels
 */
export enum ErrorLevel {
	INFO = 'info',
	WARN = 'warn',
	ERROR = 'error',
}

/**
 * Error context for tracking
 */
export interface ErrorContext {
	flowKey?: string;
	step?: number;
	operation?: string;
	[key: string]: any;
}

/**
 * Structured error log entry
 */
export interface ErrorLogEntry {
	timestamp: string;
	level: ErrorLevel;
	message: string;
	error?: Error;
	context?: ErrorContext;
	stack?: string;
}

/**
 * Error Handler Service
 * Provides centralized error handling and logging
 */
export class ErrorHandler implements IErrorHandlerService {
	private static readonly MAX_LOG_ENTRIES = 100;
	private static logHistory: ErrorLogEntry[] = [];

	/**
	 * Handle error with logging and context
	 * @param error - Error object or message string
	 * @param context - Additional context information
	 * @example
	 * ErrorHandler.handleError(new Error('Invalid credentials'), {
	 *   flowKey: 'oauth-authz-v8',
	 *   step: 1
	 * });
	 */
	static handleError(error: Error | string, context?: ErrorContext): void {
		const message = ErrorHandler.getErrorMessage(error);
		ErrorHandler.logError(message, error instanceof Error ? error : undefined, context);
	}

	/**
	 * Log error with full context
	 * @param message - Error message
	 * @param error - Optional error object
	 * @param context - Optional context information
	 * @example
	 * ErrorHandler.logError('Failed to generate authorization URL', error, {
	 *   flowKey: 'oauth-authz-v8'
	 * });
	 */
	static logError(message: string, error?: Error, context?: ErrorContext): void {
		const entry: ErrorLogEntry = {
			timestamp: new Date().toISOString(),
			level: ErrorLevel.ERROR,
			message,
			error,
			context,
			stack: error?.stack,
		};

		ErrorHandler.addLogEntry(entry);
		logger.error(`${MODULE_TAG} ${message}`, {
			error: error?.message,
			context,
			stack: error?.stack,
		});
	}

	/**
	 * Log warning message
	 * @param message - Warning message
	 * @param context - Optional context information
	 * @example
	 * ErrorHandler.logWarning('Redirect URI not registered in app', {
	 *   flowKey: 'oauth-authz-v8'
	 * });
	 */
	static logWarning(message: string, context?: ErrorContext): void {
		const entry: ErrorLogEntry = {
			timestamp: new Date().toISOString(),
			level: ErrorLevel.WARN,
			message,
			context,
		};

		ErrorHandler.addLogEntry(entry);
		logger.warn(`${MODULE_TAG} ${message}`, context);
	}

	/**
	 * Log info message
	 * @param message - Info message
	 * @param context - Optional context information
	 * @example
	 * ErrorHandler.logInfo('Authorization URL generated', {
	 *   flowKey: 'oauth-authz-v8'
	 * });
	 */
	static logInfo(message: string, context?: ErrorContext): void {
		const entry: ErrorLogEntry = {
			timestamp: new Date().toISOString(),
			level: ErrorLevel.INFO,
			message,
			context,
		};

		ErrorHandler.addLogEntry(entry);
		logger.info(`${MODULE_TAG} ${message}`, context);
	}

	/**
	 * Get human-readable error message.
	 * Delegates to shared getErrorMessage utility.
	 */
	static getErrorMessage(error: Error | string | unknown): string {
		return getErrorMessage(error);
	}

	/**
	 * Get error from known error types
	 * @param errorType - Type of error
	 * @returns Error message
	 * @example
	 * const message = ErrorHandler.getKnownError('INVALID_ENVIRONMENT_ID');
	 */
	static getKnownError(errorType: keyof typeof ERROR_MESSAGES): string {
		return ERROR_MESSAGES[errorType];
	}

	/**
	 * Get log history
	 * @param limit - Maximum number of entries to return
	 * @returns Array of log entries
	 * @example
	 * const logs = ErrorHandler.getLogHistory(10);
	 */
	static getLogHistory(limit?: number): ErrorLogEntry[] {
		if (!limit) {
			return [...ErrorHandler.logHistory];
		}
		return ErrorHandler.logHistory.slice(-limit);
	}

	/**
	 * Clear log history
	 * @example
	 * ErrorHandler.clearLogHistory();
	 */
	static clearLogHistory(): void {
		ErrorHandler.logHistory = [];
		logger.info(`${MODULE_TAG} Log history cleared`, 'Logger info');
	}

	/**
	 * Export log history as JSON
	 * @returns JSON string of log history
	 * @example
	 * const json = ErrorHandler.exportLogs();
	 */
	static exportLogs(): string {
		return JSON.stringify(ErrorHandler.logHistory, null, 2);
	}

	/**
	 * Add log entry to history
	 * @param entry - Log entry to add
	 */
	private static addLogEntry(entry: ErrorLogEntry): void {
		ErrorHandler.logHistory.push(entry);

		// Keep history size manageable
		if (ErrorHandler.logHistory.length > ErrorHandler.MAX_LOG_ENTRIES) {
			ErrorHandler.logHistory = ErrorHandler.logHistory.slice(-ErrorHandler.MAX_LOG_ENTRIES);
		}
	}

	/**
	 * Format error for display
	 * @param error - Error to format
	 * @returns Formatted error message
	 */
	static formatErrorForDisplay(error: Error | string): string {
		const message = ErrorHandler.getErrorMessage(error);
		return `Error: ${message}`;
	}

	/**
	 * Check if error is a network error
	 * @param error - Error to check
	 * @returns True if network error
	 */
	static isNetworkError(error: Error | string): boolean {
		const message = ErrorHandler.getErrorMessage(error);
		return (
			message.includes('network') ||
			message.includes('fetch') ||
			message.includes('timeout') ||
			message.includes('connection')
		);
	}

	/**
	 * Check if error is a validation error
	 * @param error - Error to check
	 * @returns True if validation error
	 */
	static isValidationError(error: Error | string): boolean {
		const message = ErrorHandler.getErrorMessage(error);
		return (
			message.includes('invalid') ||
			message.includes('required') ||
			message.includes('validation') ||
			message.includes('format')
		);
	}

	/**
	 * Check if error is an authentication error
	 * @param error - Error to check
	 * @returns True if authentication error
	 */
	static isAuthenticationError(error: Error | string): boolean {
		const message = ErrorHandler.getErrorMessage(error);
		return (
			message.includes('unauthorized') ||
			message.includes('authentication') ||
			message.includes('credentials') ||
			message.includes('401')
		);
	}

	/**
	 * Get error category
	 * @param error - Error to categorize
	 * @returns Error category
	 */
	static getErrorCategory(
		error: Error | string
	): 'network' | 'validation' | 'authentication' | 'unknown' {
		if (ErrorHandler.isNetworkError(error)) return 'network';
		if (ErrorHandler.isValidationError(error)) return 'validation';
		if (ErrorHandler.isAuthenticationError(error)) return 'authentication';
		return 'unknown';
	}

	/**
	 * Categorize an error into a structured object with type, code, and user message.
	 */
	static categorizeError(error: Error | string): {
		type: 'auth' | 'network' | 'config' | 'validation' | 'unknown';
		code: string;
		userMessage: string;
	} {
		const msg = ErrorHandler.getErrorMessage(error).toLowerCase();

		if (msg.includes('invalid_grant') || msg.includes('token') && msg.includes('expire')) {
			return { type: 'auth', code: 'INVALID_GRANT', userMessage: 'The authorization code is invalid or expired. Please try again.' };
		}
		if (msg.includes('access_denied')) {
			return { type: 'auth', code: 'ACCESS_DENIED', userMessage: 'You denied access to the application.' };
		}
		if (msg.includes('invalid_client')) {
			return { type: 'auth', code: 'INVALID_CLIENT', userMessage: 'Client authentication failed. Check your client credentials.' };
		}
		if (msg.includes('redirect_uri')) {
			return { type: 'config', code: 'REDIRECT_URI_MISMATCH', userMessage: 'The redirect URI is not registered in PingOne.' };
		}
		if (msg.includes('cors')) {
			return { type: 'network', code: 'CORS_ERROR', userMessage: 'Cross-origin request was blocked. HTTPS is required.' };
		}
		if (ErrorHandler.isNetworkError(error)) {
			return { type: 'network', code: 'NETWORK_ERROR', userMessage: 'Network request failed. Check your connection.' };
		}
		if (ErrorHandler.isValidationError(error)) {
			return { type: 'validation', code: 'REQUIRED_FIELD_MISSING', userMessage: 'A required field is missing or invalid.' };
		}
		return { type: 'unknown', code: 'UNKNOWN_ERROR', userMessage: 'An unexpected error occurred. Please try again.' };
	}

	/** Returns a user-friendly message for an error. */
	static getUserMessage(error: Error | string): string {
		return ErrorHandler.categorizeError(error).userMessage;
	}

	/** Returns a technical (developer) message for an error. */
	static getTechnicalMessage(error: Error | string): string {
		const msg = ErrorHandler.getErrorMessage(error).toLowerCase();
		if (msg.includes('invalid_grant')) return 'Token endpoint returned invalid_grant. The authorization code may have expired or already been used.';
		if (msg.includes('access_denied')) return 'Authorization server returned access_denied.';
		if (msg.includes('invalid_client')) return 'Token endpoint returned invalid_client. Verify client_id and client_secret.';
		if (msg.includes('redirect_uri')) return 'redirect_uri_mismatch: The supplied redirect URI does not match any registered URIs.';
		return ErrorHandler.getErrorMessage(error);
	}

	/** Returns recovery suggestions for an error. */
	static getRecoverySuggestions(error: Error | string): string[] {
		const msg = ErrorHandler.getErrorMessage(error).toLowerCase();
		if (msg.includes('invalid_grant')) return ['Authorization codes expire quickly — retry the flow', 'Ensure the code has not already been used'];
		if (msg.includes('access_denied')) return ['Request only the permission scopes you need', 'Check with your administrator about required permissions'];
		if (msg.includes('invalid_client')) return ['Verify the client_id is correct', 'Confirm the client_secret has not been rotated'];
		if (ErrorHandler.isNetworkError(error)) return ['Check your internet connection', 'Verify PingOne services are reachable'];
		if (ErrorHandler.isValidationError(error)) return ['Ensure all required fields are filled in'];
		return ['Retry the operation', 'Contact support if the problem persists'];
	}

	/** Returns whether the error is recoverable by the user. */
	static isRecoverable(error: Error | string): boolean {
		const cat = ErrorHandler.categorizeError(error);
		return cat.type !== 'config' && cat.code !== 'INVALID_CLIENT';
	}

	/** Returns the severity level of an error. */
	static getSeverity(error: Error | string): 'error' | 'warning' | 'info' {
		const cat = ErrorHandler.categorizeError(error);
		if (cat.type === 'network' || cat.type === 'auth') return 'error';
		if (cat.type === 'validation') return 'warning';
		return 'error';
	}
}

export default ErrorHandler;
