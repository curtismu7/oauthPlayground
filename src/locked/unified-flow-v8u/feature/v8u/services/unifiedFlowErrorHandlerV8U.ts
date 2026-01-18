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

import type { FlowType } from '../../../dependencies/v8/services/specVersionServiceV8.ts';
import { toastV8 } from '../../../dependencies/v8/utils/toastNotificationsV8.ts';
import { UnifiedFlowLoggerService } from './unifiedFlowLoggerServiceV8U';

const MODULE_TAG = '[🛡️ UNIFIED-FLOW-ERROR-HANDLER-V8U]';

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
}

/**
 * UnifiedFlowErrorHandler
 *
 * Centralized error handling service for Unified Flow with PingOne-specific
 * error parsing and user-friendly error messages.
 */
export class UnifiedFlowErrorHandler {
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
				};
			}

			if (message.includes('CORS')) {
				return {
					message,
					userFriendlyMessage:
						'CORS error: Direct API calls to PingOne are blocked. All requests must go through the backend proxy.',
					recoverySuggestion: 'This is an internal error. Please report this issue if it persists.',
					errorCode: 'cors_error',
				};
			}

			// Default error handling
			return {
				message,
				userFriendlyMessage: message,
				technicalDetails: error.stack,
			};
		}

		// Handle string errors
		if (typeof error === 'string') {
			return {
				message: error,
				userFriendlyMessage: error,
			};
		}

		// Handle unknown error types
		return {
			message: 'Unknown error occurred',
			userFriendlyMessage: 'An unexpected error occurred. Please try again.',
			technicalDetails: JSON.stringify(error),
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
		} = {}
	): ParsedError {
		const { showToast = true, setValidationErrors, logError = true } = options;

		// Parse error
		const parsedError = UnifiedFlowErrorHandler.parsePingOneError(error);

		// Log error
		if (logError) {
			UnifiedFlowLoggerService.error(
				`Error: ${parsedError.message}`,
				{
					...context,
					errorCode: parsedError.errorCode,
					recoverySuggestion: parsedError.recoverySuggestion,
				},
				error instanceof Error ? error : undefined
			);
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
	static getRecoverySuggestion(error: unknown, context: ErrorContext = {}): string | undefined {
		const parsedError = UnifiedFlowErrorHandler.parsePingOneError(error);
		return parsedError.recoverySuggestion;
	}
}
