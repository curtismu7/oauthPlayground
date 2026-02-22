/**
 * @file mfaErrorHandler.ts
 * @module apps/mfa/services/shared
 * @description Comprehensive MFA error handling and recovery system
 * @version 8.0.0
 * @since 2026-02-20
 */

import { toastV8 } from '@/v8/utils/toastNotificationsV8';

const MODULE_TAG = '[🛡️ MFA-ERROR-HANDLER]';

/**
 * Error severity levels
 */
export enum ErrorSeverity {
	LOW = 'low',
	MEDIUM = 'medium',
	HIGH = 'high',
	CRITICAL = 'critical',
}

/**
 * Error recovery strategies
 */
export enum RecoveryStrategy {
	RETRY = 'retry',
	RESTART_FLOW = 'restart_flow',
	MANUAL_INTERVENTION = 'manual_intervention',
	IGNORE = 'ignore',
}

/**
 * Error context information
 */
export interface ErrorContext {
	flowType: 'registration' | 'authentication';
	currentStep: number;
	stepName: string;
	timestamp: number;
	userId?: string;
	environmentId?: string;
	deviceType?: string;
	additionalData?: Record<string, unknown>;
}

/**
 * Error recovery options
 */
export interface RecoveryOptions {
	strategy: RecoveryStrategy;
	maxRetries?: number;
	retryDelay?: number;
	customMessage?: string;
	actionLabel?: string;
	actionCallback?: () => Promise<void>;
}

/**
 * Enhanced error with context and recovery options
 */
export class MFAError extends Error {
	public readonly context: ErrorContext;
	public readonly severity: ErrorSeverity;
	public readonly recoveryOptions: RecoveryOptions;
	public readonly originalError: Error;

	constructor(
		message: string,
		context: ErrorContext,
		severity: ErrorSeverity = ErrorSeverity.MEDIUM,
		recoveryOptions: RecoveryOptions = { strategy: RecoveryStrategy.RESTART_FLOW },
		originalError?: Error
	) {
		super(message);
		this.name = 'MFAError';
		this.context = context;
		this.severity = severity;
		this.recoveryOptions = recoveryOptions;
		this.originalError = originalError || this;
	}
}

/**
 * Comprehensive MFA error handler
 * Provides centralized error handling, recovery strategies, and user feedback
 */
export class MFAErrorHandler {
	private static readonly MAX_RETRY_ATTEMPTS = 3;
	private static readonly BASE_RETRY_DELAY = 1000; // 1 second
	private static readonly MAX_RETRY_DELAY = 30000; // 30 seconds

	/**
	 * Handle MFA errors with appropriate recovery strategies
	 */
	static handleError(error: Error, context: ErrorContext): MFAError {
		console.error(`${MODULE_TAG} Handling error`, {
			message: error.message,
			flowType: context.flowType,
			currentStep: context.currentStep,
			severity: MFAErrorHandler.determineSeverity(error, context),
		});

		// Convert to MFAError if not already
		const mfaError =
			error instanceof MFAError ? error : MFAErrorHandler.createMFAError(error, context);

		// Log error for monitoring
		MFAErrorHandler.logError(mfaError);

		// Attempt recovery
		MFAErrorHandler.attemptRecovery(mfaError);

		// Show user notification
		MFAErrorHandler.showUserNotification(mfaError);

		return mfaError;
	}

	/**
	 * Handle callback errors specifically
	 */
	static handleCallbackError(
		error: Error,
		callbackData: Record<string, unknown>,
		context: ErrorContext
	): MFAError {
		console.error(`${MODULE_TAG} Handling callback error`, {
			message: error.message,
			callbackUrl: callbackData.url,
			flowType: context.flowType,
		});

		const enhancedContext = {
			...context,
			additionalData: {
				...context.additionalData,
				callbackUrl: callbackData.url,
				callbackData: callbackData.data,
			},
		};

		return MFAErrorHandler.handleError(error, enhancedContext);
	}

	/**
	 * Handle network errors with retry logic
	 */
	static handleNetworkError(error: Error, context: ErrorContext, retryCount: number = 0): MFAError {
		const recoveryOptions: RecoveryOptions = {
			strategy:
				retryCount < MFAErrorHandler.MAX_RETRY_ATTEMPTS
					? RecoveryStrategy.RETRY
					: RecoveryStrategy.MANUAL_INTERVENTION,
			maxRetries: MFAErrorHandler.MAX_RETRY_ATTEMPTS,
			retryDelay: MFAErrorHandler.calculateRetryDelay(retryCount),
			customMessage: MFAErrorHandler.getRetryMessage(retryCount),
			actionLabel: retryCount < MFAErrorHandler.MAX_RETRY_ATTEMPTS ? 'Retry' : 'Get Help',
		};

		const enhancedContext = {
			...context,
			additionalData: {
				...context.additionalData,
				retryCount,
				lastError: error.message,
			},
		};

		const mfaError = new MFAError(
			error.message,
			enhancedContext,
			ErrorSeverity.MEDIUM,
			recoveryOptions,
			error
		);

		if (retryCount < MFAErrorHandler.MAX_RETRY_ATTEMPTS) {
			// Auto-retry will be handled by the recovery strategy
			setTimeout(() => {
				MFAErrorHandler.attemptRecovery(mfaError);
			}, recoveryOptions.retryDelay);
		}

		return mfaError;
	}

	/**
	 * Handle state corruption errors
	 */
	static handleStateCorruptionError(error: Error, context: ErrorContext): MFAError {
		const recoveryOptions: RecoveryOptions = {
			strategy: RecoveryStrategy.RESTART_FLOW,
			customMessage: 'Your session has expired or become corrupted. Please restart the process.',
			actionLabel: 'Restart Flow',
		};

		const enhancedContext = {
			...context,
			additionalData: {
				...context.additionalData,
				corruptedState: true,
			},
		};

		const mfaError = new MFAError(
			error.message,
			enhancedContext,
			ErrorSeverity.HIGH,
			recoveryOptions,
			error
		);

		// Clear corrupted state
		MFAErrorHandler.clearCorruptedState(context.flowType);

		return mfaError;
	}

	/**
	 * Handle validation errors
	 */
	static handleValidationError(
		error: Error,
		context: ErrorContext,
		validationDetails?: Record<string, unknown>
	): MFAError {
		const recoveryOptions: RecoveryOptions = {
			strategy: RecoveryStrategy.MANUAL_INTERVENTION,
			customMessage: MFAErrorHandler.getValidationErrorMessage(error, validationDetails),
			actionLabel: 'Fix Issues',
		};

		const enhancedContext = {
			...context,
			additionalData: {
				...context.additionalData,
				validationErrors: validationDetails,
			},
		};

		return new MFAError(
			error.message,
			enhancedContext,
			ErrorSeverity.MEDIUM,
			recoveryOptions,
			error
		);
	}

	/**
	 * Create MFAError from generic error
	 */
	private static createMFAError(error: Error, context: ErrorContext): MFAError {
		const severity = MFAErrorHandler.determineSeverity(error, context);
		const recoveryOptions = MFAErrorHandler.determineRecoveryStrategy(error, context, severity);

		return new MFAError(error.message, context, severity, recoveryOptions, error);
	}

	/**
	 * Determine error severity based on error type and context
	 */
	private static determineSeverity(error: Error, context: ErrorContext): ErrorSeverity {
		// State corruption is always high severity
		if (error instanceof StateCorruptionError) {
			return ErrorSeverity.HIGH;
		}

		// Network errors are medium severity
		if (error instanceof NetworkError) {
			return ErrorSeverity.MEDIUM;
		}

		// Validation errors are medium severity
		if (error instanceof CallbackValidationError) {
			return ErrorSeverity.MEDIUM;
		}

		// Check context-based severity
		if (context.currentStep === 0) {
			return ErrorSeverity.LOW; // Early step errors are less critical
		}

		if (context.currentStep >= 3) {
			return ErrorSeverity.HIGH; // Late step errors are more critical
		}

		return ErrorSeverity.MEDIUM;
	}

	/**
	 * Determine recovery strategy based on error and context
	 */
	private static determineRecoveryStrategy(
		error: Error,
		_context: ErrorContext,
		severity: ErrorSeverity
	): RecoveryOptions {
		// State corruption always requires restart
		if (error instanceof StateCorruptionError) {
			return { strategy: RecoveryStrategy.RESTART_FLOW };
		}

		// Network errors allow retry
		if (error instanceof NetworkError) {
			return {
				strategy: RecoveryStrategy.RETRY,
				maxRetries: MFAErrorHandler.MAX_RETRY_ATTEMPTS,
				retryDelay: MFAErrorHandler.BASE_RETRY_DELAY,
			};
		}

		// Validation errors require manual intervention
		if (error instanceof CallbackValidationError) {
			return { strategy: RecoveryStrategy.MANUAL_INTERVENTION };
		}

		// High severity errors require restart
		if (severity === ErrorSeverity.HIGH || severity === ErrorSeverity.CRITICAL) {
			return { strategy: RecoveryStrategy.RESTART_FLOW };
		}

		// Default to manual intervention for safety
		return { strategy: RecoveryStrategy.MANUAL_INTERVENTION };
	}

	/**
	 * Attempt automatic recovery
	 */
	private static attemptRecovery(error: MFAError): void {
		const { strategy, actionCallback } = error.recoveryOptions;

		console.log(`${MODULE_TAG} Attempting recovery with strategy: ${strategy}`);

		switch (strategy) {
			case RecoveryStrategy.RETRY:
				// Auto-retry logic handled by caller
				console.log(`${MODULE_TAG} Retry scheduled for ${error.recoveryOptions.retryDelay}ms`);
				break;

			case RecoveryStrategy.RESTART_FLOW:
				MFAErrorHandler.restartFlow(error.context.flowType);
				break;

			case RecoveryStrategy.MANUAL_INTERVENTION:
				// User action required
				console.log(`${MODULE_TAG} Manual intervention required`);
				break;

			case RecoveryStrategy.IGNORE:
				// Error is ignored
				console.log(`${MODULE_TAG} Error ignored per strategy`);
				break;
		}
	}

	/**
	 * Restart the flow
	 */
	private static restartFlow(flowType: 'registration' | 'authentication'): void {
		console.log(`${MODULE_TAG} Restarting ${flowType} flow`);

		// Clear state
		if (flowType === 'registration') {
			const {
				RegistrationStateManager,
			} = require('@/apps/mfa/services/registration/registrationStateManager');
			RegistrationStateManager.clearState();
		} else {
			const {
				AuthenticationStateManager,
			} = require('@/apps/mfa/services/authentication/authenticationStateManager');
			AuthenticationStateManager.clearState();
		}

		// Show restart notification
		toastV8.warning(
			`${flowType === 'registration' ? 'Registration' : 'Authentication'} flow restarted due to an error. Please try again.`,
			'Flow Restarted',
			5000
		);
	}

	/**
	 * Show user notification for error
	 */
	private static showUserNotification(error: MFAError): void {
		const { severity, recoveryOptions } = error;

		switch (severity) {
			case ErrorSeverity.LOW:
				toastV8.error(error.message, 'Error', 3000);
				break;

			case ErrorSeverity.MEDIUM:
				toastV8.error(error.message, 'Error', 5000);
				break;

			case ErrorSeverity.HIGH:
				toastV8.error(error.message, 'Critical Error', 7000);
				break;

			case ErrorSeverity.CRITICAL:
				toastV8.error(error.message, 'Critical Error', 10000);
				break;
		}

		// Show recovery action if available
		if (recoveryOptions.actionLabel && recoveryOptions.actionCallback) {
			setTimeout(() => {
				toastV8.info(
					recoveryOptions.customMessage || 'Click to attempt recovery',
					recoveryOptions.actionLabel,
					{
						onClick: recoveryOptions.actionCallback,
						autoClose: false,
					}
				);
			}, 1000);
		}
	}

	/**
	 * Log error for monitoring
	 */
	private static logError(error: MFAError): void {
		const logData = {
			timestamp: new Date().toISOString(),
			severity: error.severity,
			flowType: error.context.flowType,
			currentStep: error.context.currentStep,
			stepName: error.context.stepName,
			message: error.message,
			stack: error.stack,
			recoveryStrategy: error.recoveryOptions.strategy,
			userId: error.context.userId,
			environmentId: error.context.environmentId,
			deviceType: error.context.deviceType,
			additionalData: error.context.additionalData,
		};

		console.error(`${MODULE_TAG} Error logged:`, logData);

		// In production, send to monitoring service
		if (process.env.NODE_ENV === 'production') {
			// TODO: Send to monitoring service
			// this.sendToMonitoring(logData);
		}
	}

	/**
	 * Clear corrupted state
	 */
	private static clearCorruptedState(flowType: 'registration' | 'authentication'): void {
		console.log(`${MODULE_TAG} Clearing corrupted state for ${flowType} flow`);

		if (flowType === 'registration') {
			const {
				RegistrationStateManager,
			} = require('@/apps/mfa/services/registration/registrationStateManager');
			RegistrationStateManager.clearState();
		} else {
			const {
				AuthenticationStateManager,
			} = require('@/apps/mfa/services/authentication/authenticationStateManager');
			AuthenticationStateManager.clearState();
		}
	}

	/**
	 * Calculate retry delay with exponential backoff
	 */
	private static calculateRetryDelay(retryCount: number): number {
		const delay = MFAErrorHandler.BASE_RETRY_DELAY * 2 ** retryCount;
		return Math.min(delay, MFAErrorHandler.MAX_RETRY_DELAY);
	}

	/**
	 * Get retry message based on attempt count
	 */
	private static getRetryMessage(retryCount: number): string {
		const messages = [
			'Retrying...',
			'Retrying (attempt 2)...',
			'Retrying (final attempt)...',
			'Max retries reached. Please try again later.',
		];
		return messages[Math.min(retryCount, messages.length - 1)];
	}

	/**
	 * Get validation error message with details
	 */
	private static getValidationErrorMessage(
		error: Error,
		validationDetails?: Record<string, unknown>
	): string {
		let message = error.message;

		if (validationDetails) {
			const details = Object.entries(validationDetails)
				.map(([key, value]) => `${key}: ${value}`)
				.join(', ');
			message += `\n\nDetails: ${details}`;
		}

		return message;
	}

	/**
	 * Create user-friendly error message
	 */
	public static createUserFriendlyMessage(error: MFAError): string {
		const { context, severity } = error;
		const stepName = context.stepName || `Step ${context.currentStep + 1}`;
		const flowName = context.flowType === 'registration' ? 'Registration' : 'Authentication';

		let message = `${flowName} error in ${stepName}`;

		// Add context-specific information
		if (context.deviceType) {
			message += ` (${context.deviceType})`;
		}

		if (severity === ErrorSeverity.HIGH || severity === ErrorSeverity.CRITICAL) {
			message += '\n\nThis error requires restarting the process.';
		}

		return message;
	}

	/**
	 * Check if error is recoverable
	 */
	public static isRecoverable(error: MFAError): boolean {
		const { strategy } = error.recoveryOptions;
		return strategy !== RecoveryStrategy.IGNORE;
	}

	/**
	 * Get recovery actions for user
	 */
	public static getRecoveryActions(error: MFAError): Array<{
		label: string;
		action: () => void;
		available: boolean;
	}> {
		const actions = [];

		const { strategy, actionCallback } = error.recoveryOptions;

		if (strategy === RecoveryStrategy.RESTART_FLOW) {
			actions.push({
				label: 'Restart Flow',
				action: () => MFAErrorHandler.restartFlow(error.context.flowType),
				available: true,
			});
		}

		if (strategy === RecoveryStrategy.RETRY && actionCallback) {
			actions.push({
				label: 'Retry',
				action: actionCallback,
				available: true,
			});
		}

		if (strategy === RecoveryStrategy.MANUAL_INTERVENTION && actionCallback) {
			actions.push({
				label: error.recoveryOptions.actionLabel || 'Get Help',
				action: actionCallback,
				available: true,
			});
		}

		return actions;
	}

	/**
	 * Format error for logging
	 */
	public static formatErrorForLogging(error: MFAError): string {
		return `${error.context.flowType.toUpperCase()} ERROR [${error.severity.toUpperCase()}] ${error.context.stepName}: ${error.message}`;
	}

	/**
	 * Check if error should be reported to monitoring
	 */
	public static shouldReportToMonitoring(error: MFAError): boolean {
		return error.severity === ErrorSeverity.HIGH || error.severity === ErrorSeverity.CRITICAL;
	}

	/**
	 * Get error tracking ID
	 */
	public static getErrorTrackingId(error: MFAError): string {
		const timestamp = error.context.timestamp;
		const hash = btoa(
			`${error.context.flowType}-${error.context.currentStep}-${error.message}`
		).substring(0, 8);
		return `${timestamp}-${hash}`;
	}
}
