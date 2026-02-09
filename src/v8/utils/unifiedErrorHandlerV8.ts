/**
 * @file unifiedErrorHandlerV8.ts
 * @module v8/utils
 * @description Standardized error handling for Unified MFA flows
 * @version 8.0.0
 * @since 2026-02-07
 *
 * This utility provides consistent error handling patterns across all Unified MFA components
 * to ensure proper user experience and debugging capabilities.
 */

const MODULE_TAG = '[🚨 UNIFIED-ERROR-HANDLER-V8]';

export interface ErrorContext {
	/** Component or service name */
	component: string;
	/** Operation being performed */
	operation: string;
	/** Additional context for debugging */
	additionalInfo?: Record<string, unknown>;
}

export interface ErrorHandlingOptions {
	/** Whether to show toast notification to user */
	showToast?: boolean;
	/** Whether to log to console */
	logError?: boolean;
	/** Custom error message override */
	customMessage?: string;
	/** Whether to re-throw the error */
	rethrow?: boolean;
}

/**
 * Standardized error handling functions for Unified MFA flows
 * Provides consistent logging, user feedback, and error tracking
 */
export const unifiedErrorHandlerV8 = {
	/**
	 * Handle an error with standardized logging and user feedback
	 */
	handle(
		error: unknown,
		context: ErrorContext,
		options: ErrorHandlingOptions = {}
	): string {
		const {
			showToast = true,
			logError = true,
			customMessage,
			rethrow = false,
		} = options;

		// Extract error message
		const errorMessage = extractErrorMessage(error);
		const finalMessage = customMessage || errorMessage;
		const contextMessage = `${context.component}: ${context.operation}`;

		// Log error with context
		if (logError) {
			console.error(`${MODULE_TAG} ${contextMessage}:`, error);
		}

		// Show user feedback
		if (showToast) {
			// Import toast dynamically to avoid circular dependencies
			import('@/v8/utils/toastNotificationsV8').then(({ toastV8 }) => {
				toastV8.error(`${context.component}: ${finalMessage}`);
			}).catch(() => {
				// Fallback if toast import fails
				console.error(`${MODULE_TAG} Failed to show toast for: ${contextMessage}`);
			});
		}

		// Track error for analytics (if available)
		trackError(error, context);

		// Re-throw if requested
		if (rethrow) {
			throw error;
		}

		return finalMessage;
	},

	/**
	 * Create a context object for error handling
	 */
	createContext(component: string, operation: string, additionalInfo?: Record<string, unknown>): ErrorContext {
		return {
			component,
			operation,
			additionalInfo,
		};
	},

	/**
	 * Handle async errors in promises with consistent patterns
	 */
	async handleAsync<T>(
		promise: Promise<T>,
		context: ErrorContext,
		options: ErrorHandlingOptions = {}
	): Promise<T | null> {
		try {
			return await promise;
		} catch (error) {
			this.handle(error, context, options);
			return null;
		}
	},

	/**
	 * Handle validation errors specifically
	 */
	handleValidationError(
		error: unknown,
		context: ErrorContext,
		validationErrors: string[]
	): void {
		const errorMessage = extractErrorMessage(error);
		
		// Log validation error
		console.error(`${MODULE_TAG} Validation error in ${context.component}:`, {
			error,
			validationErrors,
			context,
		});

		// Show validation feedback
		import('@/v8/utils/toastNotificationsV8').then(({ toastV8 }) => {
			toastV8.error(`Validation failed: ${errorMessage}`);
		}).catch(() => {
			console.error(`${MODULE_TAG} Failed to show validation toast`);
		});
	},

	/**
	 * Handle network errors specifically
	 */
	handleNetworkError(
		error: unknown,
		context: ErrorContext,
		options: ErrorHandlingOptions = {}
	): void {
		const errorMessage = extractErrorMessage(error);
		
		// Check if it's a network error
		const isNetworkError = errorMessage.includes('fetch') || 
			errorMessage.includes('network') || 
			errorMessage.includes('connection');

		const networkMessage = isNetworkError 
			? 'Network connection failed. Please check your internet connection and try again.'
			: errorMessage;

		this.handle(error, context, {
			...options,
			customMessage: networkMessage,
		});
	},
};

/**
 * Extract meaningful error message from various error types
 */
function extractErrorMessage(error: unknown): string {
	if (error instanceof Error) {
		return error.message;
	}

	if (typeof error === 'string') {
		return error;
	}

	if (error && typeof error === 'object' && 'message' in error) {
		return String(error.message);
	}

	return 'An unexpected error occurred';
}

/**
 * Track error for analytics and monitoring
 */
function trackError(error: unknown, context: ErrorContext): void {
	// Track to error monitoring service if available
	if (typeof window !== 'undefined') {
		const windowObj = window as unknown as Record<string, unknown>;
		if (windowObj.errorTracking) {
			const errorTracker = windowObj.errorTracking as {
				captureException: (error: unknown, context: Record<string, unknown>) => void;
			};
			errorTracker.captureException(error, {
				component: context.component,
				operation: context.operation,
				additionalInfo: context.additionalInfo,
			});
		}

		// Track to analytics if available
		if (windowObj.gtag) {
			const gtag = windowObj.gtag as (
				command: string,
				eventName: string,
				params: Record<string, unknown>
			) => void;
			gtag('event', 'error', {
				event_category: 'unified_mfa',
				event_label: `${context.component}_${context.operation}`,
				error_message: extractErrorMessage(error),
			});
		}
	}
}

/**
 * Convenience function for quick error handling
 */
export const handleError = (
	error: unknown,
	component: string,
	operation: string,
	options?: ErrorHandlingOptions
): string => {
	const context = unifiedErrorHandlerV8.createContext(component, operation);
	return unifiedErrorHandlerV8.handle(error, context, options);
};

/**
 * Convenience function for async error handling
 */
export const handleAsyncError = async <T>(
	promise: Promise<T>,
	component: string,
	operation: string,
	options?: ErrorHandlingOptions
): Promise<T | null> => {
	const context = unifiedErrorHandlerV8.createContext(component, operation);
	return unifiedErrorHandlerV8.handleAsync(promise, context, options);
};
