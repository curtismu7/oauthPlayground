/**
 * @file errorHandlerV8.ts
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
 * import { ErrorHandlerV8 } from '@/v8/services/errorHandlerV8';
 *
 * try {
 *   // some operation
 * } catch (error) {
 *   ErrorHandlerV8.handleError(error, { flowKey: 'oauth-authz-v8' });
 * }
 */

import { ERROR_MESSAGES, MODULE_TAGS } from '@/v8/config/constants';
import type { IErrorHandlerService } from '@/v8/types/services';

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
export class ErrorHandlerV8 implements IErrorHandlerService {
	private static readonly MAX_LOG_ENTRIES = 100;
	private static logHistory: ErrorLogEntry[] = [];

	/**
	 * Handle error with logging and context
	 * @param error - Error object or message string
	 * @param context - Additional context information
	 * @example
	 * ErrorHandlerV8.handleError(new Error('Invalid credentials'), {
	 *   flowKey: 'oauth-authz-v8',
	 *   step: 1
	 * });
	 */
	static handleError(error: Error | string, context?: ErrorContext): void {
		const message = ErrorHandlerV8.getErrorMessage(error);
		ErrorHandlerV8.logError(message, error instanceof Error ? error : undefined, context);
	}

	/**
	 * Log error with full context
	 * @param message - Error message
	 * @param error - Optional error object
	 * @param context - Optional context information
	 * @example
	 * ErrorHandlerV8.logError('Failed to generate authorization URL', error, {
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

		ErrorHandlerV8.addLogEntry(entry);
		console.error(`${MODULE_TAG} ${message}`, {
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
	 * ErrorHandlerV8.logWarning('Redirect URI not registered in app', {
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

		ErrorHandlerV8.addLogEntry(entry);
		console.warn(`${MODULE_TAG} ${message}`, context);
	}

	/**
	 * Log info message
	 * @param message - Info message
	 * @param context - Optional context information
	 * @example
	 * ErrorHandlerV8.logInfo('Authorization URL generated', {
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

		ErrorHandlerV8.addLogEntry(entry);
		console.log(`${MODULE_TAG} ${message}`, context);
	}

	/**
	 * Get human-readable error message
	 * @param error - Error object or message string
	 * @returns Formatted error message
	 * @example
	 * const message = ErrorHandlerV8.getErrorMessage(error);
	 */
	static getErrorMessage(error: Error | string): string {
		if (typeof error === 'string') {
			return error;
		}

		if (error instanceof Error) {
			return error.message;
		}

		return 'An unknown error occurred';
	}

	/**
	 * Get error from known error types
	 * @param errorType - Type of error
	 * @returns Error message
	 * @example
	 * const message = ErrorHandlerV8.getKnownError('INVALID_ENVIRONMENT_ID');
	 */
	static getKnownError(errorType: keyof typeof ERROR_MESSAGES): string {
		return ERROR_MESSAGES[errorType];
	}

	/**
	 * Get log history
	 * @param limit - Maximum number of entries to return
	 * @returns Array of log entries
	 * @example
	 * const logs = ErrorHandlerV8.getLogHistory(10);
	 */
	static getLogHistory(limit?: number): ErrorLogEntry[] {
		if (!limit) {
			return [...ErrorHandlerV8.logHistory];
		}
		return ErrorHandlerV8.logHistory.slice(-limit);
	}

	/**
	 * Clear log history
	 * @example
	 * ErrorHandlerV8.clearLogHistory();
	 */
	static clearLogHistory(): void {
		ErrorHandlerV8.logHistory = [];
		console.log(`${MODULE_TAG} Log history cleared`);
	}

	/**
	 * Export log history as JSON
	 * @returns JSON string of log history
	 * @example
	 * const json = ErrorHandlerV8.exportLogs();
	 */
	static exportLogs(): string {
		return JSON.stringify(ErrorHandlerV8.logHistory, null, 2);
	}

	/**
	 * Add log entry to history
	 * @param entry - Log entry to add
	 */
	private static addLogEntry(entry: ErrorLogEntry): void {
		ErrorHandlerV8.logHistory.push(entry);

		// Keep history size manageable
		if (ErrorHandlerV8.logHistory.length > ErrorHandlerV8.MAX_LOG_ENTRIES) {
			ErrorHandlerV8.logHistory = ErrorHandlerV8.logHistory.slice(-ErrorHandlerV8.MAX_LOG_ENTRIES);
		}
	}

	/**
	 * Format error for display
	 * @param error - Error to format
	 * @returns Formatted error message
	 */
	static formatErrorForDisplay(error: Error | string): string {
		const message = ErrorHandlerV8.getErrorMessage(error);
		return `Error: ${message}`;
	}

	/**
	 * Check if error is a network error
	 * @param error - Error to check
	 * @returns True if network error
	 */
	static isNetworkError(error: Error | string): boolean {
		const message = ErrorHandlerV8.getErrorMessage(error);
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
		const message = ErrorHandlerV8.getErrorMessage(error);
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
		const message = ErrorHandlerV8.getErrorMessage(error);
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
		if (ErrorHandlerV8.isNetworkError(error)) return 'network';
		if (ErrorHandlerV8.isValidationError(error)) return 'validation';
		if (ErrorHandlerV8.isAuthenticationError(error)) return 'authentication';
		return 'unknown';
	}
}

export default ErrorHandlerV8;
