/**
 * @file errorHandlingService.ts
 * @module protect-portal/services
 * @description Comprehensive error handling service for Protect Portal
 * @version 9.6.5
 * @since 2026-02-10
 *
 * This service provides centralized error handling, logging, and user feedback
 * for all Protect Portal operations.
 */

import type { PortalError } from '../types/protectPortal.types';

// ============================================================================
// INTERFACES
// ============================================================================

export interface ErrorContext {
	component: string;
	operation: string;
	userId?: string;
	requestId?: string;
	timestamp: string;
	additionalData?: Record<string, any>;
}

export interface ErrorReport {
	error: PortalError;
	context: ErrorContext;
	severity: 'low' | 'medium' | 'high' | 'critical';
	userMessage: string;
	suggestedActions: string[];
	technicalDetails: string;
}

export interface ErrorHandlingOptions {
	logToConsole?: boolean;
	logToService?: boolean;
	showUserNotification?: boolean;
	retryable?: boolean;
	maxRetries?: number;
}

// ============================================================================
// ERROR HANDLING SERVICE
// ============================================================================

class ErrorHandlingService {
	private static readonly DEFAULT_OPTIONS: ErrorHandlingOptions = {
		logToConsole: true,
		logToService: false,
		showUserNotification: true,
		retryable: false,
		maxRetries: 3,
	};

	/**
	 * Handle and process errors with comprehensive logging and user feedback
	 */
	static handleError(
		error: Error | PortalError | string,
		context: ErrorContext,
		options: ErrorHandlingOptions = {}
	): ErrorReport {
		const opts = { ...ErrorHandlingService.DEFAULT_OPTIONS, ...options };

		// Normalize error to PortalError format
		const portalError = ErrorHandlingService.normalizeError(error);

		// Create error report
		const report = ErrorHandlingService.createErrorReport(portalError, context);

		// Log error
		if (opts.logToConsole) {
			ErrorHandlingService.logErrorToConsole(report);
		}

		// TODO: Send to logging service when implemented
		if (opts.logToService) {
			ErrorHandlingService.logErrorToService(report);
		}

		return report;
	}

	/**
	 * Create user-friendly error message
	 */
	static createUserMessage(error: PortalError, context: ErrorContext): string {
		const { component } = context;

		// Component-specific messages
		const componentMessages: Record<string, Record<string, string>> = {
			CustomLoginForm: {
				NETWORK_ERROR:
					'Unable to connect to the authentication service. Please check your internet connection and try again.',
				AUTHENTICATION_ERROR:
					'Invalid credentials. Please check your username and password and try again.',
				FLOW_ERROR: 'Authentication flow encountered an issue. Please try again.',
				TOKEN_ERROR: 'Token processing failed. Please restart the authentication process.',
				default: 'Login failed. Please try again or contact support if the issue persists.',
			},
			RiskEvaluationDisplay: {
				PROTECT_API_ERROR: 'Risk evaluation service is temporarily unavailable. Please try again.',
				NETWORK_ERROR: 'Unable to connect to security services. Please check your connection.',
				VALIDATION_ERROR: 'Invalid user information provided. Please try again.',
				default: 'Security evaluation failed. Please try again or contact support.',
			},
			MFAAuthenticationFlow: {
				DEVICE_NOT_FOUND: 'Selected MFA device not found. Please select a different device.',
				AUTHENTICATION_ERROR: 'MFA authentication failed. Please try again.',
				RATE_LIMIT_ERROR: 'Too many authentication attempts. Please wait before trying again.',
				SERVICE_ERROR: 'MFA service is temporarily unavailable. Please try again.',
				default: 'Multi-factor authentication failed. Please try again or contact support.',
			},
			PortalSuccess: {
				TOKEN_VALIDATION_ERROR: 'Token validation failed. Please login again.',
				default: 'Session validation failed. Please login again.',
			},
		};

		const messages = componentMessages[component] || {};
		return messages[error.code] || messages['default'] || error.message;
	}

	/**
	 * Get suggested actions for error resolution
	 */
	static getSuggestedActions(error: PortalError, context: ErrorContext): string[] {
		const actions: string[] = [];

		// Add error-specific suggested action if available
		if (error.suggestedAction) {
			actions.push(error.suggestedAction);
		}

		// Add context-specific actions
		const { component } = context;

		switch (component) {
			case 'CustomLoginForm':
				actions.push('Check your username and password');
				actions.push('Ensure your account is active');
				if (error.recoverable) {
					actions.push('Try logging in again');
				}
				break;

			case 'RiskEvaluationDisplay':
				actions.push('Check your internet connection');
				actions.push('Verify your account information');
				if (error.recoverable) {
					actions.push('Retry the security evaluation');
				}
				break;

			case 'MFAAuthenticationFlow':
				actions.push('Ensure your MFA device is available');
				actions.push('Check for MFA notifications');
				if (error.recoverable) {
					actions.push('Try the authentication again');
				}
				break;

			default:
				actions.push('Refresh the page and try again');
				actions.push('Contact support if the issue persists');
		}

		// Add general actions
		if (!error.recoverable) {
			actions.push('Contact your administrator');
		}

		return actions;
	}

	/**
	 * Determine error severity
	 */
	static getSeverity(
		error: PortalError,
		_context: ErrorContext
	): 'low' | 'medium' | 'high' | 'critical' {
		// Critical errors
		if (error.type === 'SERVICE_ERROR' || error.type === 'NETWORK_ERROR') {
			return 'critical';
		}

		// High severity errors
		if (error.type === 'AUTHENTICATION_ERROR' || error.type === 'TOKEN_ERROR') {
			return 'high';
		}

		// Medium severity errors
		if (error.type === 'VALIDATION_ERROR' || error.type === 'RATE_LIMIT_ERROR') {
			return 'medium';
		}

		// Default to low
		return 'low';
	}

	/**
	 * Normalize different error types to PortalError
	 */
	private static normalizeError(error: Error | PortalError | string): PortalError {
		if (typeof error === 'string') {
			return {
				code: 'UNKNOWN_ERROR',
				message: error,
				type: 'NETWORK_ERROR',
				recoverable: true,
				suggestedAction: 'Please try again',
			};
		}

		if (error instanceof Error) {
			return {
				code: 'RUNTIME_ERROR',
				message: error.message,
				type: 'NETWORK_ERROR',
				details: {
					stack: error.stack,
					name: error.name,
				},
				recoverable: true,
				suggestedAction: 'Please try again',
			};
		}

		// Already a PortalError
		return error;
	}

	/**
	 * Create comprehensive error report
	 */
	private static createErrorReport(error: PortalError, context: ErrorContext): ErrorReport {
		return {
			error,
			context,
			severity: ErrorHandlingService.getSeverity(error, context),
			userMessage: ErrorHandlingService.createUserMessage(error, context),
			suggestedActions: ErrorHandlingService.getSuggestedActions(error, context),
			technicalDetails: ErrorHandlingService.generateTechnicalDetails(error, context),
		};
	}

	/**
	 * Generate technical details for debugging
	 */
	private static generateTechnicalDetails(error: PortalError, context: ErrorContext): string {
		const details = [
			`Component: ${context.component}`,
			`Operation: ${context.operation}`,
			`Error Code: ${error.code}`,
			`Error Type: ${error.type}`,
			`Timestamp: ${context.timestamp}`,
			`Recoverable: ${error.recoverable}`,
		];

		if (context.userId) {
			details.push(`User ID: ${context.userId}`);
		}

		if (context.requestId) {
			details.push(`Request ID: ${context.requestId}`);
		}

		if (error.details) {
			details.push(`Details: ${JSON.stringify(error.details, null, 2)}`);
		}

		return details.join('\n');
	}

	/**
	 * Log error to console
	 */
	private static logErrorToConsole(report: ErrorReport): void {
		const logMethod =
			report.severity === 'critical'
				? 'error'
				: report.severity === 'high'
					? 'error'
					: report.severity === 'medium'
						? 'warn'
						: 'info';

		console[logMethod](
			`[🚨 PROTECT-PORTAL-ERROR] ${report.context.component} - ${report.context.operation}`,
			{
				error: report.error,
				severity: report.severity,
				userMessage: report.userMessage,
				suggestedActions: report.suggestedActions,
				context: report.context,
			}
		);
	}

	/**
	 * Log error to external service (placeholder)
	 */
	private static logErrorToService(report: ErrorReport): void {
		// TODO: Implement external logging service integration
		// This could send errors to services like Sentry, LogRocket, or custom endpoints
		console.log('[🚨 PROTECT-PORTAL-ERROR] Would log to service:', report);
	}

	/**
	 * Create error context
	 */
	static createContext(
		component: string,
		operation: string,
		additionalData?: Record<string, any>
	): ErrorContext {
		return {
			component,
			operation,
			timestamp: new Date().toISOString(),
			requestId: `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
			additionalData,
		};
	}

	/**
	 * Check if error is recoverable
	 */
	static isRecoverable(error: PortalError): boolean {
		return (
			error.recoverable && error.type !== 'SERVICE_ERROR' && error.type !== 'AUTHENTICATION_ERROR'
		);
	}

	/**
	 * Get retry delay based on error type
	 */
	static getRetryDelay(error: PortalError, attempt: number): number {
		// Exponential backoff with jitter
		const baseDelay = 1000; // 1 second
		const maxDelay = 30000; // 30 seconds

		let delay = baseDelay * 2 ** (attempt - 1);

		// Add jitter
		delay = delay * (0.5 + Math.random() * 0.5);

		// Adjust based on error type
		if (error.type === 'RATE_LIMIT_ERROR') {
			delay = Math.max(delay, 5000); // At least 5 seconds for rate limit
		}

		return Math.min(delay, maxDelay);
	}
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default ErrorHandlingService;
