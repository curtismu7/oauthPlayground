/**
 * @file unifiedFlowErrorHandlerV8U.ts
 * @module v8u/services
 * @description Centralized error handling for Unified Flow
 * @version 8.0.0
 * @since 2025-11-23
 *
 * Provides unified error handling with:
 * - PingOne error parsing
 * - User-friendly error messages
 * - Toast notification integration
 * - Validation error management
 * - Error recovery suggestions
 */

import type { FlowType } from '@/v8/services/specVersionServiceV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';
import { UnifiedFlowLoggerService } from './unifiedFlowLoggerServiceV8U';

const _MODULE_TAG = '[🛡️ UNIFIED-FLOW-ERROR-HANDLER-V8U]';

export type ErrorCategory =
	| 'authentication'
	| 'validation'
	| 'network'
	| 'storage'
	| 'configuration'
	| 'unknown';

export interface ErrorContext {
	flowType?: FlowType;
	step?: number;
	operation?: string;
	originalError?: unknown;
	[key: string]: unknown;
}

export interface ParsedError {
	message: string;
	userFriendlyMessage: string;
	technicalDetails?: string;
	recoverySuggestion?: string;
	errorCode?: string;
	category?: ErrorCategory;
	isRetryable?: boolean;
}

export interface ErrorRecoveryAction {
	label: string;
	action: () => void | Promise<void>;
}

// Error rate limiting to prevent toast spam
const errorTimestamps: Map<string, number> = new Map();
const ERROR_RATE_LIMIT_MS = 3000; // Don't show same error within 3 seconds

/**
 * UnifiedFlowErrorHandler
 *
 * Centralized error handling service for Unified Flow with PingOne-specific
 * error parsing and user-friendly error messages.
 */
export class UnifiedFlowErrorHandler {
	/**
	 * Categorize error based on error code/message
	 */
	private static categorizeError(errorCode?: string, message?: string): ErrorCategory {
		if (!errorCode && !message) return 'unknown';

		const code = errorCode?.toLowerCase() || '';
		const msg = message?.toLowerCase() || '';

		// Authentication errors
		if (
			code.includes('invalid_client') ||
			code.includes('invalid_grant') ||
			code.includes('unauthorized') ||
			code.includes('access_denied') ||
			msg.includes('authentication') ||
			msg.includes('credentials')
		) {
			return 'authentication';
		}

		// Validation errors
		if (
			code.includes('invalid_scope') ||
			code.includes('invalid_redirect') ||
			code.includes('invalid_request') ||
			msg.includes('validation') ||
			msg.includes('required') ||
			msg.includes('invalid')
		) {
			return 'validation';
		}

		// Network errors
		if (
			code.includes('network') ||
			code.includes('timeout') ||
			code.includes('cors') ||
			msg.includes('fetch') ||
			msg.includes('network') ||
			msg.includes('connection')
		) {
			return 'network';
		}

		// Storage errors
		if (
			code.includes('storage') ||
			code.includes('quota') ||
			msg.includes('storage') ||
			msg.includes('indexeddb') ||
			msg.includes('localstorage')
		) {
			return 'storage';
		}

		// Configuration errors
		if (
			code.includes('config') ||
			code.includes('missing') ||
			msg.includes('configuration') ||
			msg.includes('environment')
		) {
			return 'configuration';
		}

		return 'unknown';
	}

	/**
	 * Check if error is retryable
	 */
	private static isRetryableError(category: ErrorCategory, errorCode?: string): boolean {
		// Network errors are usually retryable
		if (category === 'network') return true;

		// Some auth errors are retryable (token expired)
		if (category === 'authentication' && errorCode === 'invalid_grant') return true;

		// Storage errors might be retryable
		if (category === 'storage') return true;

		return false;
	}

	/**
	 * Check if error should be shown (rate limiting)
	 */
	private static shouldShowError(errorKey: string): boolean {
		const now = Date.now();
		const lastShown = errorTimestamps.get(errorKey);

		if (lastShown && now - lastShown < ERROR_RATE_LIMIT_MS) {
			return false; // Too soon, don't spam
		}

		errorTimestamps.set(errorKey, now);
		return true;
	}

	/**
	 * Parse PingOne API error response
	 */
	private static parsePingOneError(error: unknown): ParsedError {
		// Handle Error objects
		if (error instanceof Error) {
			const message = error.message;

			// Check for common PingOne error patterns
			if (message.includes('invalid_client')) {
				return {
					message,
					userFriendlyMessage:
						'Invalid client credentials. Please check your Client ID and Client Secret in the configuration.',
					recoverySuggestion:
						'Verify your Client ID and Client Secret are correct in Step 0 (Configuration).',
					errorCode: 'invalid_client',
					category: 'authentication',
					isRetryable: false,
				};
			}

			if (message.includes('invalid_grant')) {
				return {
					message,
					userFriendlyMessage:
						'Invalid authorization grant. The authorization code may have expired or been used already.',
					recoverySuggestion:
						'Please go back to Step 1 and generate a new authorization URL, then authenticate again.',
					errorCode: 'invalid_grant',
					category: 'authentication',
					isRetryable: true,
				};
			}

			if (message.includes('invalid_scope')) {
				return {
					message,
					userFriendlyMessage:
						'Invalid scope requested. One or more scopes are not allowed for this application.',
					recoverySuggestion:
						'Check your scopes in Step 0 (Configuration) and ensure they match your PingOne application settings.',
					errorCode: 'invalid_scope',
					category: 'validation',
					isRetryable: false,
				};
			}

			if (message.includes('invalid_redirect_uri')) {
				return {
					message,
					userFriendlyMessage:
						'Invalid redirect URI. The redirect URI does not match your application configuration.',
					recoverySuggestion:
						'Verify your Redirect URI in Step 0 (Configuration) matches your PingOne application settings.',
					errorCode: 'invalid_redirect_uri',
					category: 'validation',
					isRetryable: false,
				};
			}

			if (message.includes('CORS')) {
				return {
					message,
					userFriendlyMessage:
						'CORS error: Direct API calls to PingOne are blocked. All requests must go through the backend proxy.',
					recoverySuggestion: 'This is an internal error. Please report this issue if it persists.',
					errorCode: 'cors_error',
					category: 'network',
					isRetryable: false,
				};
			}

			if (message.includes('fetch') || message.includes('network')) {
				return {
					message,
					userFriendlyMessage: 'Network error. Please check your internet connection and try again.',
					recoverySuggestion: 'Verify your internet connection and retry the operation.',
					errorCode: 'network_error',
					category: 'network',
					isRetryable: true,
				};
			}

			// Default error handling
			const category = UnifiedFlowErrorHandler.categorizeError(undefined, message);
			return {
				message,
				userFriendlyMessage: message,
				technicalDetails: error.stack,
				category,
				isRetryable: UnifiedFlowErrorHandler.isRetryableError(category),
			};
		}

		// Handle string errors
		if (typeof error === 'string') {
			const category = UnifiedFlowErrorHandler.categorizeError(undefined, error);
			return {
				message: error,
				userFriendlyMessage: error,
				category,
				isRetryable: UnifiedFlowErrorHandler.isRetryableError(category),
			};
		}

		// Handle unknown error types
		return {
			message: 'Unknown error occurred',
			userFriendlyMessage: 'An unexpected error occurred. Please try again.',
			technicalDetails: JSON.stringify(error),
			category: 'unknown',
			isRetryable: false,
		};
	}

	/**
	 * Parse API response error
	 */
	private static async parseApiError(response: Response): Promise<ParsedError> {
		try {
			const errorText = await response.text();
			let errorBody: Record<string, unknown> = {};

			try {
				errorBody = JSON.parse(errorText) as Record<string, unknown>;
			} catch {
				// Not JSON, use text as message
				return {
					message: errorText || `HTTP ${response.status}: ${response.statusText}`,
					userFriendlyMessage:
						errorText ||
						`Request failed with status ${response.status}. Please check your configuration and try again.`,
					errorCode: response.status.toString(),
				};
			}

			// Parse PingOne error format
			const errorMessage =
				(typeof errorBody.error === 'string' ? errorBody.error : '') ||
				(typeof errorBody.message === 'string' ? errorBody.message : '') ||
				(typeof errorBody.error_description === 'string' ? errorBody.error_description : '') ||
				errorText;

			const _errorCode =
				(typeof errorBody.error === 'string' ? errorBody.error : '') || response.status.toString();

			return UnifiedFlowErrorHandler.parsePingOneError(new Error(errorMessage));
		} catch (parseError) {
			return {
				message: `Failed to parse error: ${parseError}`,
				userFriendlyMessage: `Request failed with status ${response.status}. Please try again.`,
				errorCode: response.status.toString(),
			};
		}
	}

	/**
	 * Handle error with full context
	 */
	static handleError(
		error: unknown,
		context: ErrorContext = {},
		options: {
			showToast?: boolean;
			setValidationErrors?: (errors: string[]) => void;
			logError?: boolean;
			recoveryAction?: ErrorRecoveryAction;
		} = {}
	): ParsedError {
		const { showToast = true, setValidationErrors, logError = true, recoveryAction } = options;

		// Parse error
		const parsedError = UnifiedFlowErrorHandler.parsePingOneError(error);

		// Create error key for rate limiting
		const errorKey = `${parsedError.errorCode || 'unknown'}_${context.operation || 'unknown'}`;

		// Log error
		if (logError) {
			UnifiedFlowLoggerService.error(
				`Error: ${parsedError.message}`,
				{
					...context,
					errorCode: parsedError.errorCode,
					category: parsedError.category,
					isRetryable: parsedError.isRetryable,
					recoverySuggestion: parsedError.recoverySuggestion,
				},
				error instanceof Error ? error : undefined
			);
		}

		// Show toast notification (with rate limiting)
		if (showToast && UnifiedFlowErrorHandler.shouldShowError(errorKey)) {
			if (recoveryAction) {
				// Show toast with recovery action button
				toastV8.error(parsedError.userFriendlyMessage);
				// Note: Toast action buttons would need to be added to toastV8 service
			} else {
				toastV8.error(parsedError.userFriendlyMessage);
			}
		}

		// Set validation errors if callback provided
		if (setValidationErrors) {
			const errorMessage = parsedError.recoverySuggestion
				? `${parsedError.userFriendlyMessage} ${parsedError.recoverySuggestion}`
				: parsedError.userFriendlyMessage;
			setValidationErrors([errorMessage]);
		}

		return parsedError;
	}

	/**
	 * Handle API response error
	 */
	static async handleApiError(
		response: Response,
		context: ErrorContext = {},
		options: {
			showToast?: boolean;
			setValidationErrors?: (errors: string[]) => void;
			logError?: boolean;
		} = {}
	): Promise<ParsedError> {
		const { showToast = true, setValidationErrors, logError = true } = options;

		// Parse API error
		const parsedError = await UnifiedFlowErrorHandler.parseApiError(response);

		// Log error
		if (logError) {
			UnifiedFlowLoggerService.error(`API Error: ${parsedError.message}`, {
				...context,
				status: response.status,
				statusText: response.statusText,
				errorCode: parsedError.errorCode,
				recoverySuggestion: parsedError.recoverySuggestion,
			});
		}

		// Show toast notification
		if (showToast) {
			toastV8.error(parsedError.userFriendlyMessage);
		}

		// Set validation errors if callback provided
		if (setValidationErrors) {
			setValidationErrors([parsedError.userFriendlyMessage]);
		}

		return parsedError;
	}

	/**
	 * Handle validation error
	 */
	static handleValidationError(
		message: string,
		context: ErrorContext = {},
		options: {
			showToast?: boolean;
			setValidationErrors?: (errors: string[]) => void;
		} = {}
	): void {
		const { showToast = true, setValidationErrors } = options;

		UnifiedFlowLoggerService.warn(`Validation Error: ${message}`, context);

		if (showToast) {
			toastV8.error(message);
		}

		if (setValidationErrors) {
			setValidationErrors([message]);
		}
	}

	/**
	 * Get recovery suggestion for error
	 */
	static getRecoverySuggestion(error: unknown, _context: ErrorContext = {}): string | undefined {
		const parsedError = UnifiedFlowErrorHandler.parsePingOneError(error);
		return parsedError.recoverySuggestion;
	}

	/**
	 * Retry operation with exponential backoff
	 */
	static async retryOperation<T>(
		operation: () => Promise<T>,
		options: {
			maxRetries?: number;
			initialDelay?: number;
			maxDelay?: number;
			context?: ErrorContext;
		} = {}
	): Promise<T> {
		const { maxRetries = 3, initialDelay = 1000, maxDelay = 10000, context = {} } = options;

		let lastError: unknown;
		let delay = initialDelay;

		for (let attempt = 1; attempt <= maxRetries; attempt++) {
			try {
				return await operation();
			} catch (error) {
				lastError = error;
				const parsedError = UnifiedFlowErrorHandler.parsePingOneError(error);

				// Don't retry if error is not retryable
				if (!parsedError.isRetryable) {
					throw error;
				}

				// Don't retry on last attempt
				if (attempt === maxRetries) {
					break;
				}

				UnifiedFlowLoggerService.warn(`Retry attempt ${attempt}/${maxRetries}`, {
					...context,
					delay,
					error: parsedError.message,
				});

				// Wait before retrying
				await new Promise((resolve) => setTimeout(resolve, delay));

				// Exponential backoff
				delay = Math.min(delay * 2, maxDelay);
			}
		}

		// All retries failed
		throw lastError;
	}

	/**
	 * Execute operation with graceful degradation
	 * Returns default value if operation fails
	 */
	static async withGracefulDegradation<T>(
		operation: () => Promise<T>,
		defaultValue: T,
		options: {
			context?: ErrorContext;
			logError?: boolean;
			showToast?: boolean;
		} = {}
	): Promise<T> {
		const { context = {}, logError = true, showToast = false } = options;

		try {
			return await operation();
		} catch (error) {
			if (logError) {
				UnifiedFlowLoggerService.warn('Operation failed, using default value', {
					...context,
					error: error instanceof Error ? error.message : String(error),
				});
			}

			if (showToast) {
				const parsedError = UnifiedFlowErrorHandler.parsePingOneError(error);
				toastV8.warn(parsedError.userFriendlyMessage);
			}

			return defaultValue;
		}
	}
}
