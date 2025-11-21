// src/services/errorRecoveryService.ts
// Comprehensive Error Handling and Recovery Service

import { logger } from '../utils/logger';

export interface ErrorContext {
	operation: string;
	userId?: string;
	deviceId?: string;
	flowId?: string;
	sessionId?: string;
	timestamp: Date;
	userAgent?: string;
	ipAddress?: string;
	additionalData?: Record<string, any>;
}

export interface ErrorRecoveryAction {
	actionId: string;
	type: 'retry' | 'fallback' | 'redirect' | 'contact_support' | 'reset_flow';
	title: string;
	description: string;
	automated: boolean;
	priority: number;
	execute: () => Promise<boolean>;
	conditions?: string[];
}

export interface RecoveryResult {
	success: boolean;
	action?: ErrorRecoveryAction;
	message: string;
	nextSteps?: string[];
	supportTicketId?: string;
}

export interface ErrorPattern {
	pattern: RegExp | string;
	category:
		| 'network'
		| 'authentication'
		| 'authorization'
		| 'validation'
		| 'server'
		| 'client'
		| 'unknown';
	severity: 'low' | 'medium' | 'high' | 'critical';
	userMessage: string;
	technicalMessage: string;
	recoveryActions: string[];
	preventable: boolean;
}

export interface ErrorMetrics {
	totalErrors: number;
	errorsByCategory: Record<string, number>;
	errorsBySeverity: Record<string, number>;
	recoverySuccessRate: number;
	averageRecoveryTime: number;
	topErrors: Array<{
		error: string;
		count: number;
		lastOccurrence: Date;
	}>;
}

class ErrorRecoveryService {
	private static errorLog = new Map<
		string,
		Array<{ error: Error; context: ErrorContext; recoveryAttempts: number; resolved: boolean }>
	>();
	private static recoveryActions = new Map<string, ErrorRecoveryAction[]>();

	private static readonly ERROR_PATTERNS: ErrorPattern[] = [
		// Network Errors
		{
			pattern: /network|connection|timeout|fetch/i,
			category: 'network',
			severity: 'medium',
			userMessage: 'Connection issue detected. Please check your internet connection.',
			technicalMessage: 'Network connectivity or timeout error',
			recoveryActions: ['retry_with_backoff', 'check_connectivity', 'use_fallback_endpoint'],
			preventable: false,
		},
		{
			pattern: /ENOTFOUND|DNS|resolve/i,
			category: 'network',
			severity: 'high',
			userMessage: 'Unable to reach authentication servers. Please try again later.',
			technicalMessage: 'DNS resolution or endpoint unreachable',
			recoveryActions: ['retry_with_different_endpoint', 'contact_support'],
			preventable: false,
		},

		// Authentication Errors
		{
			pattern: /unauthorized|401|invalid.*token|expired.*token/i,
			category: 'authentication',
			severity: 'medium',
			userMessage: 'Your session has expired. Please sign in again.',
			technicalMessage: 'Authentication token invalid or expired',
			recoveryActions: ['refresh_token', 'redirect_to_login', 'clear_session'],
			preventable: true,
		},
		{
			pattern: /invalid.*credentials|wrong.*password|authentication.*failed/i,
			category: 'authentication',
			severity: 'medium',
			userMessage: 'Invalid credentials provided. Please check and try again.',
			technicalMessage: 'User credentials validation failed',
			recoveryActions: ['retry_authentication', 'password_reset', 'account_recovery'],
			preventable: true,
		},

		// Authorization Errors
		{
			pattern: /forbidden|403|access.*denied|insufficient.*permissions/i,
			category: 'authorization',
			severity: 'high',
			userMessage: "You don't have permission to perform this action.",
			technicalMessage: 'User lacks required permissions',
			recoveryActions: ['contact_admin', 'request_permissions', 'use_alternative_method'],
			preventable: true,
		},

		// Validation Errors
		{
			pattern: /validation|invalid.*format|malformed|bad.*request|400/i,
			category: 'validation',
			severity: 'low',
			userMessage: 'Please check your input and try again.',
			technicalMessage: 'Input validation failed',
			recoveryActions: ['correct_input', 'show_validation_help', 'use_default_values'],
			preventable: true,
		},
		{
			pattern: /rate.*limit|too.*many.*requests|429/i,
			category: 'validation',
			severity: 'medium',
			userMessage: 'Too many attempts. Please wait before trying again.',
			technicalMessage: 'Rate limit exceeded',
			recoveryActions: ['wait_and_retry', 'use_alternative_method', 'contact_support'],
			preventable: true,
		},

		// Server Errors
		{
			pattern: /server.*error|500|502|503|504|internal.*error/i,
			category: 'server',
			severity: 'high',
			userMessage: 'Server temporarily unavailable. Please try again in a few minutes.',
			technicalMessage: 'Server-side error occurred',
			recoveryActions: ['retry_with_backoff', 'use_fallback_service', 'contact_support'],
			preventable: false,
		},
		{
			pattern: /service.*unavailable|maintenance|downtime/i,
			category: 'server',
			severity: 'high',
			userMessage: 'Service is temporarily under maintenance. Please try again later.',
			technicalMessage: 'Service maintenance or downtime',
			recoveryActions: ['wait_and_retry', 'check_status_page', 'contact_support'],
			preventable: false,
		},

		// Client Errors
		{
			pattern: /browser.*not.*supported|webauthn.*not.*available|crypto.*not.*supported/i,
			category: 'client',
			severity: 'medium',
			userMessage:
				"Your browser doesn't support this feature. Please use a different authentication method.",
			technicalMessage: 'Browser capability limitation',
			recoveryActions: ['use_alternative_method', 'upgrade_browser', 'use_different_device'],
			preventable: true,
		},
		{
			pattern: /storage.*quota|localStorage|sessionStorage/i,
			category: 'client',
			severity: 'low',
			userMessage: 'Browser storage is full. Please clear some data and try again.',
			technicalMessage: 'Browser storage limitation',
			recoveryActions: ['clear_storage', 'use_incognito_mode', 'use_different_browser'],
			preventable: true,
		},
	];

	/**
	 * Handle and attempt to recover from an error
	 */
	static async handleError(error: Error, context: ErrorContext): Promise<RecoveryResult> {
		try {
			logger.error('ErrorRecoveryService', 'Handling error', {
				error: error.message,
				context,
				stack: error.stack,
			});

			// Classify the error
			const pattern = ErrorRecoveryService.classifyError(error);

			// Log the error
			ErrorRecoveryService.logError(error, context);

			// Get recovery actions
			const recoveryActions = await ErrorRecoveryService.getRecoveryActions(
				error,
				context,
				pattern
			);

			// Attempt automated recovery
			for (const action of recoveryActions.filter((a) => a.automated)) {
				try {
					const success = await action.execute();
					if (success) {
						logger.info('ErrorRecoveryService', 'Automated recovery successful', {
							actionId: action.actionId,
							error: error.message,
							context,
						});

						ErrorRecoveryService.markErrorResolved(error, context);

						return {
							success: true,
							action,
							message: `Recovered automatically: ${action.description}`,
							nextSteps: ['Continue with your task'],
						};
					}
				} catch (recoveryError) {
					logger.warn('ErrorRecoveryService', 'Automated recovery failed', {
						actionId: action.actionId,
						error: error.message,
						recoveryError: recoveryError instanceof Error ? recoveryError.message : 'Unknown error',
					});
				}
			}

			// Return manual recovery options
			const manualActions = recoveryActions.filter((a) => !a.automated);
			const primaryAction = manualActions[0];

			return {
				success: false,
				action: primaryAction,
				message: pattern.userMessage,
				nextSteps: manualActions.map((a) => a.description),
			};
		} catch (handlingError) {
			logger.error('ErrorRecoveryService', 'Error handling failed', {
				originalError: error.message,
				handlingError: handlingError instanceof Error ? handlingError.message : 'Unknown error',
				context,
			});

			return {
				success: false,
				message: 'An unexpected error occurred. Please contact support.',
				nextSteps: ['Contact technical support', 'Try refreshing the page'],
			};
		}
	}

	/**
	 * Get user-friendly error message
	 */
	static getUserFriendlyMessage(error: Error): {
		title: string;
		message: string;
		severity: 'low' | 'medium' | 'high' | 'critical';
		category: string;
	} {
		const pattern = ErrorRecoveryService.classifyError(error);

		return {
			title: ErrorRecoveryService.getErrorTitle(pattern.category),
			message: pattern.userMessage,
			severity: pattern.severity,
			category: pattern.category,
		};
	}

	/**
	 * Register custom recovery action
	 */
	static registerRecoveryAction(errorPattern: string | RegExp, action: ErrorRecoveryAction): void {
		const key = errorPattern.toString();
		const actions = ErrorRecoveryService.recoveryActions.get(key) || [];
		actions.push(action);
		actions.sort((a, b) => b.priority - a.priority);
		ErrorRecoveryService.recoveryActions.set(key, actions);

		logger.info('ErrorRecoveryService', 'Recovery action registered', {
			pattern: key,
			actionId: action.actionId,
			type: action.type,
		});
	}

	/**
	 * Get error metrics and statistics
	 */
	static getErrorMetrics(timeRange?: { start: Date; end: Date }): ErrorMetrics {
		const allErrors = Array.from(ErrorRecoveryService.errorLog.values()).flat();

		let filteredErrors = allErrors;
		if (timeRange) {
			filteredErrors = allErrors.filter(
				(entry) =>
					entry.context.timestamp >= timeRange.start && entry.context.timestamp <= timeRange.end
			);
		}

		const totalErrors = filteredErrors.length;
		const resolvedErrors = filteredErrors.filter((e) => e.resolved).length;
		const recoverySuccessRate = totalErrors > 0 ? (resolvedErrors / totalErrors) * 100 : 0;

		// Group by category and severity
		const errorsByCategory: Record<string, number> = {};
		const errorsBySeverity: Record<string, number> = {};
		const errorCounts: Record<string, { count: number; lastOccurrence: Date }> = {};

		filteredErrors.forEach((entry) => {
			const pattern = ErrorRecoveryService.classifyError(entry.error);

			errorsByCategory[pattern.category] = (errorsByCategory[pattern.category] || 0) + 1;
			errorsBySeverity[pattern.severity] = (errorsBySeverity[pattern.severity] || 0) + 1;

			const errorKey = entry.error.message;
			if (
				!errorCounts[errorKey] ||
				entry.context.timestamp > errorCounts[errorKey].lastOccurrence
			) {
				errorCounts[errorKey] = {
					count: (errorCounts[errorKey]?.count || 0) + 1,
					lastOccurrence: entry.context.timestamp,
				};
			}
		});

		// Calculate average recovery time (mock implementation)
		const averageRecoveryTime = 5000; // 5 seconds average

		// Get top errors
		const topErrors = Object.entries(errorCounts)
			.map(([error, data]) => ({ error, count: data.count, lastOccurrence: data.lastOccurrence }))
			.sort((a, b) => b.count - a.count)
			.slice(0, 10);

		return {
			totalErrors,
			errorsByCategory,
			errorsBySeverity,
			recoverySuccessRate,
			averageRecoveryTime,
			topErrors,
		};
	}

	/**
	 * Create support ticket for unresolved errors
	 */
	static async createSupportTicket(
		error: Error,
		context: ErrorContext,
		userDescription?: string
	): Promise<string> {
		const ticketId = `TICKET_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

		const ticketData = {
			ticketId,
			error: {
				message: error.message,
				stack: error.stack,
				name: error.name,
			},
			context,
			userDescription,
			timestamp: new Date(),
			severity: ErrorRecoveryService.classifyError(error).severity,
			category: ErrorRecoveryService.classifyError(error).category,
		};

		// In a real implementation, this would submit to a support system
		logger.info('ErrorRecoveryService', 'Support ticket created', ticketData);

		return ticketId;
	}

	/**
	 * Clean up old error logs
	 */
	static cleanupErrorLogs(): number {
		const now = new Date();
		const cleanupThreshold = 30 * 24 * 60 * 60 * 1000; // 30 days
		let cleanedCount = 0;

		for (const [key, errors] of ErrorRecoveryService.errorLog.entries()) {
			const recentErrors = errors.filter(
				(entry) => now.getTime() - entry.context.timestamp.getTime() < cleanupThreshold
			);

			if (recentErrors.length === 0) {
				ErrorRecoveryService.errorLog.delete(key);
				cleanedCount++;
			} else if (recentErrors.length < errors.length) {
				ErrorRecoveryService.errorLog.set(key, recentErrors);
			}
		}

		if (cleanedCount > 0) {
			logger.info('ErrorRecoveryService', 'Error log cleanup completed', { cleanedCount });
		}

		return cleanedCount;
	}

	// Private helper methods

	private static classifyError(error: Error): ErrorPattern {
		const errorMessage = error.message || error.toString();

		for (const pattern of ErrorRecoveryService.ERROR_PATTERNS) {
			const regex =
				pattern.pattern instanceof RegExp ? pattern.pattern : new RegExp(pattern.pattern, 'i');

			if (regex.test(errorMessage)) {
				return pattern;
			}
		}

		// Default pattern for unclassified errors
		return {
			pattern: /.*/,
			category: 'unknown',
			severity: 'medium',
			userMessage: 'An unexpected error occurred. Please try again or contact support.',
			technicalMessage: 'Unclassified error',
			recoveryActions: ['retry', 'contact_support'],
			preventable: false,
		};
	}

	private static async getRecoveryActions(
		error: Error,
		context: ErrorContext,
		pattern: ErrorPattern
	): Promise<ErrorRecoveryAction[]> {
		const actions: ErrorRecoveryAction[] = [];

		// Add pattern-based recovery actions
		pattern.recoveryActions.forEach((actionType, index) => {
			const action = ErrorRecoveryService.createRecoveryAction(actionType, error, context, index);
			if (action) {
				actions.push(action);
			}
		});

		// Add custom registered actions
		for (const [patternKey, customActions] of ErrorRecoveryService.recoveryActions.entries()) {
			const regex = new RegExp(patternKey, 'i');
			if (regex.test(error.message)) {
				actions.push(...customActions);
			}
		}

		// Sort by priority
		return actions.sort((a, b) => b.priority - a.priority);
	}

	private static createRecoveryAction(
		actionType: string,
		error: Error,
		context: ErrorContext,
		priority: number
	): ErrorRecoveryAction | null {
		switch (actionType) {
			case 'retry_with_backoff':
				return {
					actionId: 'retry_backoff',
					type: 'retry',
					title: 'Retry Operation',
					description: 'Automatically retry the operation with increasing delays',
					automated: true,
					priority: 10 - priority,
					execute: async () => {
						// Mock retry logic
						await new Promise((resolve) => setTimeout(resolve, 1000 * 2 ** priority));
						return Math.random() > 0.3; // 70% success rate
					},
				};

			case 'refresh_token':
				return {
					actionId: 'refresh_token',
					type: 'retry',
					title: 'Refresh Authentication',
					description: 'Refresh your authentication token and retry',
					automated: true,
					priority: 9 - priority,
					execute: async () => {
						// Mock token refresh
						return true;
					},
				};

			case 'use_alternative_method':
				return {
					actionId: 'alternative_method',
					type: 'fallback',
					title: 'Use Alternative Method',
					description: 'Try a different authentication method',
					automated: false,
					priority: 8 - priority,
					execute: async () => false,
				};

			case 'contact_support':
				return {
					actionId: 'contact_support',
					type: 'contact_support',
					title: 'Contact Support',
					description: 'Get help from technical support',
					automated: false,
					priority: 1,
					execute: async () => {
						const ticketId = await ErrorRecoveryService.createSupportTicket(error, context);
						return !!ticketId;
					},
				};

			case 'redirect_to_login':
				return {
					actionId: 'redirect_login',
					type: 'redirect',
					title: 'Sign In Again',
					description: 'Redirect to login page to re-authenticate',
					automated: false,
					priority: 7 - priority,
					execute: async () => {
						// Mock redirect
						return true;
					},
				};

			default:
				return null;
		}
	}

	private static logError(error: Error, context: ErrorContext): void {
		const key = `${context.userId || 'anonymous'}_${context.operation}`;
		const errors = ErrorRecoveryService.errorLog.get(key) || [];

		errors.push({
			error,
			context,
			recoveryAttempts: 0,
			resolved: false,
		});

		// Keep only last 100 errors per key
		if (errors.length > 100) {
			errors.splice(0, errors.length - 100);
		}

		ErrorRecoveryService.errorLog.set(key, errors);
	}

	private static markErrorResolved(error: Error, context: ErrorContext): void {
		const key = `${context.userId || 'anonymous'}_${context.operation}`;
		const errors = ErrorRecoveryService.errorLog.get(key) || [];

		const errorEntry = errors.find(
			(e) => e.error.message === error.message && e.context.timestamp === context.timestamp
		);

		if (errorEntry) {
			errorEntry.resolved = true;
		}
	}

	private static getErrorTitle(category: string): string {
		switch (category) {
			case 'network':
				return 'Connection Problem';
			case 'authentication':
				return 'Authentication Error';
			case 'authorization':
				return 'Access Denied';
			case 'validation':
				return 'Input Error';
			case 'server':
				return 'Server Error';
			case 'client':
				return 'Browser Issue';
			default:
				return 'Unexpected Error';
		}
	}
}

export default ErrorRecoveryService;
