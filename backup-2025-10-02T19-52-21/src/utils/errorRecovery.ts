// src/utils/errorRecovery.ts - Enhanced Error Handling and Recovery System

export interface ErrorRecoveryConfig {
	maxRetries: number;
	baseDelay: number;
	maxDelay: number;
	enableAutoRetry: boolean;
	enableUserPrompts: boolean;
}

export interface RecoveryAction {
	id: string;
	label: string;
	description: string;
	icon: string;
	action: () => void | Promise<void>;
	priority: 'high' | 'medium' | 'low';
}

export interface ErrorContext {
	operation: string;
	step?: string;
	flow?: string;
	timestamp: number;
	userAgent: string;
	url: string;
	credentials?: Record<string, unknown>;
}

export class EnhancedErrorRecovery {
	private retryCount = 0;
	private config: ErrorRecoveryConfig;
	private recoveryActions: RecoveryAction[] = [];

	constructor(config: Partial<ErrorRecoveryConfig> = {}) {
		this.config = {
			maxRetries: 3,
			baseDelay: 1000,
			maxDelay: 30000,
			enableAutoRetry: true,
			enableUserPrompts: true,
			...config,
		};
	}

	/**
	 * Handle error with automatic recovery attempts
	 */
	async handleError(
		error: unknown,
		context: ErrorContext,
		retryFunction?: () => Promise<void>
	): Promise<void> {
		const errorInfo = this.categorizeError(error);
		console.error(' [ErrorRecovery] Error occurred:', {
			error: errorInfo,
			context,
			retryCount: this.retryCount,
		});

		// Generate recovery actions based on error type
		this.recoveryActions = this.generateRecoveryActions(errorInfo, context);

		// Attempt automatic recovery if enabled
		if (this.config.enableAutoRetry && retryFunction && this.shouldRetry(errorInfo)) {
			await this.attemptRetry(retryFunction, errorInfo);
		}

		// Log error for analytics
		this.logErrorForAnalytics(errorInfo, context);
	}

	/**
	 * Categorize error type for appropriate recovery
	 */
	private categorizeError(error: unknown): {
		type: string;
		category: string;
		severity: 'low' | 'medium' | 'high' | 'critical';
		isRetryable: boolean;
		message: string;
	} {
		const errorStr = String(error);
		const errorMessage = error instanceof Error ? error.message : errorStr;

		// Network errors
		if (
			errorStr.includes('fetch') ||
			errorStr.includes('NetworkError') ||
			errorStr.includes('ERR_NETWORK')
		) {
			return {
				type: 'network',
				category: 'connectivity',
				severity: 'medium',
				isRetryable: true,
				message: 'Network connection error',
			};
		}

		// OAuth/OIDC specific errors
		if (errorStr.includes('invalid_grant') || errorStr.includes('authorization_pending')) {
			return {
				type: 'oauth',
				category: 'authorization',
				severity: 'medium',
				isRetryable: false,
				message: 'OAuth authorization error',
			};
		}

		// Token errors
		if (errorStr.includes('invalid_token') || errorStr.includes('token_expired')) {
			return {
				type: 'token',
				category: 'authentication',
				severity: 'high',
				isRetryable: true,
				message: 'Token validation error',
			};
		}

		// Configuration errors
		if (errorStr.includes('invalid_client') || errorStr.includes('Client ID')) {
			return {
				type: 'configuration',
				category: 'setup',
				severity: 'high',
				isRetryable: false,
				message: 'Configuration error',
			};
		}

		// Server errors (5xx)
		if (errorStr.includes('500') || errorStr.includes('502') || errorStr.includes('503')) {
			return {
				type: 'server',
				category: 'infrastructure',
				severity: 'high',
				isRetryable: true,
				message: 'Server error',
			};
		}

		// Default categorization
		return {
			type: 'unknown',
			category: 'general',
			severity: 'medium',
			isRetryable: false,
			message: errorMessage,
		};
	}

	/**
	 * Generate appropriate recovery actions based on error type
	 */
	private generateRecoveryActions(
		errorInfo: ReturnType<typeof this.categorizeError>,
		context: ErrorContext
	): RecoveryAction[] {
		const actions: RecoveryAction[] = [];

		switch (errorInfo.type) {
			case 'network':
				actions.push({
					id: 'check-connection',
					label: 'Check Network Connection',
					description: 'Verify your internet connection and try again',
					icon: '',
					action: () => window.location.reload(),
					priority: 'high',
				});
				break;

			case 'oauth':
				actions.push({
					id: 'restart-flow',
					label: 'Restart OAuth Flow',
					description: 'Start a new authorization flow with fresh credentials',
					icon: '',
					action: () => {
						sessionStorage.clear();
						window.location.href = window.location.pathname;
					},
					priority: 'high',
				});
				break;

			case 'token':
				actions.push({
					id: 'refresh-tokens',
					label: 'Refresh Tokens',
					description: 'Attempt to refresh expired tokens',
					icon: '',
					action: async () => {
						// Implement token refresh logic
						console.log(' Attempting token refresh...');
					},
					priority: 'high',
				});
				break;

			case 'configuration':
				actions.push({
					id: 'check-config',
					label: 'Check Configuration',
					description: 'Review your PingOne application settings',
					icon: '',
					action: () => (window.location.href = '/configuration'),
					priority: 'high',
				});
				break;

			case 'server':
				actions.push({
					id: 'wait-retry',
					label: 'Wait and Retry',
					description: 'Server may be temporarily unavailable',
					icon: '',
					action: () => setTimeout(() => window.location.reload(), 5000),
					priority: 'medium',
				});
				break;
		}

		// Universal recovery actions
		actions.push({
			id: 'view-logs',
			label: 'View Debug Logs',
			description: 'Check console logs for detailed error information',
			icon: '',
			action: () => {
				console.log(' Error Context:', context);
				console.log(' Error Info:', errorInfo);
			},
			priority: 'low',
		});

		actions.push({
			id: 'contact-support',
			label: 'Contact Support',
			description: 'Get help with this specific error',
			icon: '',
			action: () => {
				const errorReport = `Error: ${errorInfo.message}\nContext: ${JSON.stringify(context, null, 2)}`;
				navigator.clipboard?.writeText(errorReport);
				alert('Error details copied to clipboard. Please contact support.');
			},
			priority: 'low',
		});

		return actions.sort((a, b) => {
			const priorityOrder = { high: 0, medium: 1, low: 2 };
			return priorityOrder[a.priority] - priorityOrder[b.priority];
		});
	}

	/**
	 * Determine if error should be retried automatically
	 */
	private shouldRetry(errorInfo: ReturnType<typeof this.categorizeError>): boolean {
		return (
			errorInfo.isRetryable &&
			this.retryCount < this.config.maxRetries &&
			['network', 'server', 'token'].includes(errorInfo.type)
		);
	}

	/**
	 * Attempt retry with exponential backoff
	 */
	private async attemptRetry(
		retryFunction: () => Promise<void>,
		errorInfo: ReturnType<typeof this.categorizeError>
	): Promise<void> {
		this.retryCount++;
		const delay = Math.min(
			this.config.baseDelay * 2 ** (this.retryCount - 1),
			this.config.maxDelay
		);

		console.log(
			` [ErrorRecovery] Attempting retry ${this.retryCount}/${this.config.maxRetries} after ${delay}ms delay`
		);

		return new Promise((resolve) => {
			setTimeout(async () => {
				try {
					await retryFunction();
					console.log(' [ErrorRecovery] Retry successful');
					this.retryCount = 0; // Reset on success
					resolve();
				} catch (retryError) {
					console.error(' [ErrorRecovery] Retry failed:', retryError);
					if (this.retryCount < this.config.maxRetries) {
						await this.attemptRetry(retryFunction, errorInfo);
					}
					resolve();
				}
			}, delay);
		});
	}

	/**
	 * Log error for analytics and monitoring
	 */
	private logErrorForAnalytics(
		errorInfo: ReturnType<typeof this.categorizeError>,
		context: ErrorContext
	): void {
		const analyticsData = {
			timestamp: context.timestamp,
			errorType: errorInfo.type,
			errorCategory: errorInfo.category,
			severity: errorInfo.severity,
			operation: context.operation,
			step: context.step,
			flow: context.flow,
			retryCount: this.retryCount,
			userAgent: context.userAgent,
			url: context.url,
		};

		console.log(' [ErrorRecovery] Analytics data:', analyticsData);

		// Store for later analysis
		const errorHistory = JSON.parse(localStorage.getItem('error_history') || '[]');
		errorHistory.push(analyticsData);

		// Keep only last 50 errors
		if (errorHistory.length > 50) {
			errorHistory.splice(0, errorHistory.length - 50);
		}

		localStorage.setItem('error_history', JSON.stringify(errorHistory));
	}

	/**
	 * Get available recovery actions
	 */
	getRecoveryActions(): RecoveryAction[] {
		return this.recoveryActions;
	}

	/**
	 * Reset retry counter
	 */
	resetRetryCount(): void {
		this.retryCount = 0;
	}

	/**
	 * Get error statistics
	 */
	getErrorStats(): {
		totalErrors: number;
		errorsByType: Record<string, number>;
		errorsByCategory: Record<string, number>;
		recentErrors: number;
	} {
		const errorHistory = JSON.parse(localStorage.getItem('error_history') || '[]');
		const now = Date.now();
		const oneHour = 60 * 60 * 1000;

		const errorsByType: Record<string, number> = {};
		const errorsByCategory: Record<string, number> = {};
		let recentErrors = 0;

		errorHistory.forEach((error: ErrorHistoryEntry) => {
			errorsByType[error.errorType] = (errorsByType[error.errorType] || 0) + 1;
			errorsByCategory[error.errorCategory] = (errorsByCategory[error.errorCategory] || 0) + 1;

			if (now - error.timestamp < oneHour) {
				recentErrors++;
			}
		});

		return {
			totalErrors: errorHistory.length,
			errorsByType,
			errorsByCategory,
			recentErrors,
		};
	}
}

export default EnhancedErrorRecovery;
