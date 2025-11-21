// src/services/authErrorRecoveryService.ts
// Authentication Error Handling and Recovery Service for PingOne MFA Flow

import { logger } from '../utils/logger';
import { type ErrorContext, ErrorSeverity, ErrorType } from './errorHandlingService';
import type { AuthenticationError } from './pingOneAuthService';

export interface RecoveryAction {
	type: 'RETRY' | 'ALTERNATIVE' | 'CONTACT_SUPPORT' | 'RESTART_FLOW' | 'MANUAL_CONFIG';
	title: string;
	description: string;
	action?: () => Promise<void>;
	priority: number;
	automated?: boolean;
	estimatedTime?: string;
}

export interface AuthErrorAnalysis {
	errorType: ErrorType;
	severity: ErrorSeverity;
	isRetryable: boolean;
	retryDelay?: number;
	maxRetries?: number;
	userMessage: string;
	technicalDetails: string;
	recoveryActions: RecoveryAction[];
	preventionTips: string[];
}

export interface RetryConfig {
	maxAttempts: number;
	baseDelay: number;
	maxDelay: number;
	backoffMultiplier: number;
	jitter: boolean;
}

export interface AuthErrorContext extends ErrorContext {
	username?: string;
	environmentId?: string;
	authMethod?: string;
	clientId?: string;
	attemptNumber?: number;
	lastSuccessfulAuth?: Date;
}

class AuthErrorRecoveryService {
	private static readonly DEFAULT_RETRY_CONFIG: RetryConfig = {
		maxAttempts: 3,
		baseDelay: 1000,
		maxDelay: 10000,
		backoffMultiplier: 2,
		jitter: true,
	};

	private static retryAttempts = new Map<string, number>();
	private static lastRetryTime = new Map<string, number>();

	/**
	 * Analyze authentication error and provide recovery strategies
	 */
	static analyzeAuthError(
		error: AuthenticationError,
		context: AuthErrorContext
	): AuthErrorAnalysis {
		logger.error('AuthErrorRecoveryService', 'Analyzing authentication error', {
			errorCode: error.code,
			username: context.username,
			environmentId: context.environmentId,
			attemptNumber: context.attemptNumber,
		});

		const analysis = AuthErrorRecoveryService.classifyError(error, context);
		const recoveryActions = AuthErrorRecoveryService.generateRecoveryActions(
			error,
			context,
			analysis
		);
		const preventionTips = AuthErrorRecoveryService.generatePreventionTips(error, analysis);

		return {
			...analysis,
			recoveryActions,
			preventionTips,
		};
	}

	/**
	 * Handle authentication error with automatic recovery attempts
	 */
	static async handleAuthError(
		error: AuthenticationError,
		context: AuthErrorContext,
		retryCallback?: () => Promise<void>
	): Promise<{ recovered: boolean; action?: RecoveryAction; nextRetryDelay?: number }> {
		const analysis = AuthErrorRecoveryService.analyzeAuthError(error, context);

		// Log error for monitoring
		AuthErrorRecoveryService.logAuthError(error, context, analysis);

		// Check if automatic retry is appropriate
		if (analysis.isRetryable && retryCallback) {
			const retryResult = await AuthErrorRecoveryService.attemptAutoRetry(
				error,
				context,
				retryCallback,
				analysis.retryDelay
			);

			if (retryResult.success) {
				return { recovered: true };
			}

			if (retryResult.nextRetryDelay) {
				return {
					recovered: false,
					nextRetryDelay: retryResult.nextRetryDelay,
				};
			}
		}

		// Return primary recovery action for manual intervention
		const primaryAction = analysis.recoveryActions.find((action) => action.priority === 1);
		return primaryAction ? { recovered: false, action: primaryAction } : { recovered: false };
	}

	/**
	 * Get user-friendly error message with context
	 */
	static getUserFriendlyMessage(error: AuthenticationError, context: AuthErrorContext): string {
		const analysis = AuthErrorRecoveryService.analyzeAuthError(error, context);
		return analysis.userMessage;
	}

	/**
	 * Check if error is retryable and get retry delay
	 */
	static getRetryInfo(
		error: AuthenticationError,
		context: AuthErrorContext
	): {
		retryable: boolean;
		delay?: number;
		attemptsRemaining?: number;
	} {
		const analysis = AuthErrorRecoveryService.analyzeAuthError(error, context);
		const key = AuthErrorRecoveryService.getRetryKey(context);
		const attempts = AuthErrorRecoveryService.retryAttempts.get(key) || 0;
		const maxAttempts =
			analysis.maxRetries || AuthErrorRecoveryService.DEFAULT_RETRY_CONFIG.maxAttempts;

		const result: { retryable: boolean; delay?: number; attemptsRemaining?: number } = {
			retryable: analysis.isRetryable && attempts < maxAttempts,
		};

		if (analysis.retryDelay !== undefined) {
			result.delay = analysis.retryDelay;
		}

		result.attemptsRemaining = Math.max(0, maxAttempts - attempts);

		return result;
	}

	/**
	 * Backwards compatible error handler wrapper
	 */
	static async handleError(
		error: AuthenticationError,
		context: AuthErrorContext,
		retryCallback?: () => Promise<void>
	) {
		return AuthErrorRecoveryService.handleAuthError(error, context, retryCallback);
	}

	/**
	 * Reset retry counter for successful authentication
	 */
	static resetRetryCounter(context: AuthErrorContext): void {
		const key = AuthErrorRecoveryService.getRetryKey(context);
		AuthErrorRecoveryService.retryAttempts.delete(key);
		AuthErrorRecoveryService.lastRetryTime.delete(key);
	}

	/**
	 * Get recovery actions for specific error
	 */
	static getRecoveryActions(
		error: AuthenticationError,
		context: AuthErrorContext
	): RecoveryAction[] {
		const analysis = AuthErrorRecoveryService.analyzeAuthError(error, context);
		return analysis.recoveryActions;
	}

	// Private helper methods

	private static classifyError(
		error: AuthenticationError,
		context: AuthErrorContext
	): Omit<AuthErrorAnalysis, 'recoveryActions' | 'preventionTips'> {
		switch (error.code) {
			case 'INVALID_CREDENTIALS':
				return {
					errorType: ErrorType.AUTHENTICATION,
					severity: ErrorSeverity.MEDIUM,
					isRetryable: true,
					maxRetries: 3,
					retryDelay: 2000,
					userMessage:
						'The username or password you entered is incorrect. Please check your credentials and try again.',
					technicalDetails: `Authentication failed for user ${context.username} in environment ${context.environmentId}`,
				};

			case 'INVALID_ENVIRONMENT':
				return {
					errorType: ErrorType.CONFIGURATION,
					severity: ErrorSeverity.HIGH,
					isRetryable: false,
					userMessage:
						'The PingOne environment configuration is invalid. Please verify your environment ID.',
					technicalDetails: `Environment ${context.environmentId} not found or not accessible`,
				};

			case 'ACCOUNT_LOCKED':
				return {
					errorType: ErrorType.AUTHENTICATION,
					severity: ErrorSeverity.HIGH,
					isRetryable: false,
					userMessage:
						'Your account has been temporarily locked due to multiple failed login attempts. Please wait or contact support.',
					technicalDetails: `Account locked for user ${context.username}`,
				};

			case 'NETWORK_ERROR':
				return {
					errorType: ErrorType.NETWORK,
					severity: ErrorSeverity.MEDIUM,
					isRetryable: true,
					maxRetries: 5,
					retryDelay: 3000,
					userMessage:
						'Unable to connect to PingOne. Please check your internet connection and try again.',
					technicalDetails: `Network error: ${error.details}`,
				};

			case 'RATE_LIMITED':
				return {
					errorType: ErrorType.RATE_LIMIT,
					severity: ErrorSeverity.MEDIUM,
					isRetryable: true,
					maxRetries: 2,
					retryDelay: 30000, // 30 seconds
					userMessage: 'Too many login attempts. Please wait a moment before trying again.',
					technicalDetails: 'Rate limit exceeded for authentication requests',
				};

			case 'SERVICE_UNAVAILABLE':
				return {
					errorType: ErrorType.SERVER_ERROR,
					severity: ErrorSeverity.HIGH,
					isRetryable: true,
					maxRetries: 3,
					retryDelay: 10000,
					userMessage:
						'PingOne authentication service is temporarily unavailable. Please try again in a few minutes.',
					technicalDetails: `Service unavailable: ${error.details}`,
				};

			case 'TOKEN_EXPIRED':
				return {
					errorType: ErrorType.AUTHENTICATION,
					severity: ErrorSeverity.LOW,
					isRetryable: true,
					maxRetries: 1,
					retryDelay: 1000,
					userMessage: 'Your session has expired. Please sign in again.',
					technicalDetails: 'Authentication token expired',
				};

			case 'INVALID_CLIENT':
				return {
					errorType: ErrorType.CONFIGURATION,
					severity: ErrorSeverity.HIGH,
					isRetryable: false,
					userMessage:
						'Application configuration error. Please contact support or verify your client credentials.',
					technicalDetails: `Invalid client configuration for ${context.clientId}`,
				};

			default:
				return {
					errorType: ErrorType.UNKNOWN,
					severity: ErrorSeverity.MEDIUM,
					isRetryable: error.retryable || false,
					maxRetries: 2,
					retryDelay: 5000,
					userMessage:
						error.message ||
						'An unexpected error occurred during authentication. Please try again.',
					technicalDetails: `Unknown error: ${error.code} - ${error.details}`,
				};
		}
	}

	private static generateRecoveryActions(
		error: AuthenticationError,
		_context: AuthErrorContext,
		_analysis: Omit<AuthErrorAnalysis, 'recoveryActions' | 'preventionTips'>
	): RecoveryAction[] {
		const actions: RecoveryAction[] = [];

		switch (error.code) {
			case 'INVALID_CREDENTIALS':
				actions.push(
					{
						type: 'RETRY',
						title: 'Try Again',
						description: 'Double-check your username and password, then try signing in again.',
						priority: 1,
						estimatedTime: '1 minute',
					},
					{
						type: 'ALTERNATIVE',
						title: 'Reset Password',
						description: "If you've forgotten your password, use the password reset option.",
						priority: 2,
						estimatedTime: '5 minutes',
					},
					{
						type: 'CONTACT_SUPPORT',
						title: 'Contact Support',
						description: 'If you continue having trouble, contact your administrator.',
						priority: 3,
						estimatedTime: '24 hours',
					}
				);
				break;

			case 'INVALID_ENVIRONMENT':
				actions.push(
					{
						type: 'MANUAL_CONFIG',
						title: 'Verify Environment ID',
						description: 'Check that your PingOne Environment ID is correct and accessible.',
						priority: 1,
						estimatedTime: '2 minutes',
					},
					{
						type: 'ALTERNATIVE',
						title: 'Use Discovery URL',
						description:
							'Try using the full PingOne issuer URL instead of just the Environment ID.',
						priority: 2,
						estimatedTime: '1 minute',
					},
					{
						type: 'CONTACT_SUPPORT',
						title: 'Contact Administrator',
						description: 'Verify environment access with your PingOne administrator.',
						priority: 3,
						estimatedTime: '24 hours',
					}
				);
				break;

			case 'NETWORK_ERROR':
				actions.push(
					{
						type: 'RETRY',
						title: 'Retry Connection',
						description: 'Check your internet connection and try again.',
						priority: 1,
						automated: true,
						estimatedTime: '30 seconds',
					},
					{
						type: 'ALTERNATIVE',
						title: 'Check Firewall',
						description: 'Ensure your firewall allows connections to PingOne services.',
						priority: 2,
						estimatedTime: '5 minutes',
					},
					{
						type: 'CONTACT_SUPPORT',
						title: 'Report Network Issue',
						description: 'If the problem persists, report the network connectivity issue.',
						priority: 3,
						estimatedTime: '24 hours',
					}
				);
				break;

			case 'RATE_LIMITED':
				actions.push(
					{
						type: 'RETRY',
						title: 'Wait and Retry',
						description: 'Wait 30 seconds before attempting to sign in again.',
						priority: 1,
						automated: true,
						estimatedTime: '30 seconds',
					},
					{
						type: 'ALTERNATIVE',
						title: 'Use Different Network',
						description: 'Try connecting from a different network or device.',
						priority: 2,
						estimatedTime: '2 minutes',
					}
				);
				break;

			case 'ACCOUNT_LOCKED':
				actions.push(
					{
						type: 'ALTERNATIVE',
						title: 'Wait for Unlock',
						description: 'Account locks are typically temporary. Wait 15-30 minutes and try again.',
						priority: 1,
						estimatedTime: '30 minutes',
					},
					{
						type: 'CONTACT_SUPPORT',
						title: 'Contact Administrator',
						description: 'Contact your administrator to unlock your account immediately.',
						priority: 2,
						estimatedTime: '2 hours',
					}
				);
				break;

			case 'SERVICE_UNAVAILABLE':
				actions.push(
					{
						type: 'RETRY',
						title: 'Retry Later',
						description:
							'PingOne services are temporarily unavailable. Try again in a few minutes.',
						priority: 1,
						automated: true,
						estimatedTime: '5 minutes',
					},
					{
						type: 'ALTERNATIVE',
						title: 'Check Service Status',
						description: 'Check PingOne service status page for known issues.',
						priority: 2,
						estimatedTime: '1 minute',
					}
				);
				break;

			default:
				actions.push(
					{
						type: 'RETRY',
						title: 'Try Again',
						description: 'Retry the authentication process.',
						priority: 1,
						estimatedTime: '1 minute',
					},
					{
						type: 'RESTART_FLOW',
						title: 'Restart Process',
						description: 'Start the authentication process from the beginning.',
						priority: 2,
						estimatedTime: '2 minutes',
					},
					{
						type: 'CONTACT_SUPPORT',
						title: 'Get Help',
						description: 'Contact support if the problem continues.',
						priority: 3,
						estimatedTime: '24 hours',
					}
				);
		}

		return actions.sort((a, b) => a.priority - b.priority);
	}

	private static generatePreventionTips(
		_error: AuthenticationError,
		analysis: Omit<AuthErrorAnalysis, 'recoveryActions' | 'preventionTips'>
	): string[] {
		const tips: string[] = [];

		switch (analysis.errorType) {
			case ErrorType.AUTHENTICATION:
				tips.push(
					'Use a password manager to avoid typing errors',
					'Ensure Caps Lock is not enabled when entering passwords',
					'Copy and paste credentials carefully to avoid extra spaces'
				);
				break;

			case ErrorType.CONFIGURATION:
				tips.push(
					'Verify environment IDs before entering them',
					'Use the discovery URL feature for automatic configuration',
					'Keep environment configuration details in a secure location'
				);
				break;

			case ErrorType.NETWORK:
				tips.push(
					'Ensure stable internet connection before starting authentication',
					'Check that corporate firewalls allow PingOne connections',
					'Consider using a VPN if accessing from restricted networks'
				);
				break;

			case ErrorType.RATE_LIMIT:
				tips.push(
					'Avoid rapid repeated login attempts',
					'Wait between authentication attempts if unsure of credentials',
					'Use password reset instead of guessing passwords'
				);
				break;

			default:
				tips.push(
					'Keep your browser updated for best compatibility',
					'Clear browser cache if experiencing persistent issues',
					'Try using an incognito/private browsing window'
				);
		}

		return tips;
	}

	private static async attemptAutoRetry(
		error: AuthenticationError,
		context: AuthErrorContext,
		retryCallback: () => Promise<void>,
		retryDelay?: number
	): Promise<{ success: boolean; nextRetryDelay?: number }> {
		const key = AuthErrorRecoveryService.getRetryKey(context);
		const attempts = AuthErrorRecoveryService.retryAttempts.get(key) || 0;
		const config = AuthErrorRecoveryService.DEFAULT_RETRY_CONFIG;

		if (attempts >= config.maxAttempts) {
			return { success: false };
		}

		// Calculate delay with exponential backoff
		const delay = Math.min(
			(retryDelay || config.baseDelay) * config.backoffMultiplier ** attempts,
			config.maxDelay
		);

		// Add jitter to prevent thundering herd
		const finalDelay = config.jitter ? delay + Math.random() * 1000 : delay;

		// Check if enough time has passed since last retry
		const lastRetry = AuthErrorRecoveryService.lastRetryTime.get(key) || 0;
		const timeSinceLastRetry = Date.now() - lastRetry;

		if (timeSinceLastRetry < finalDelay) {
			return {
				success: false,
				nextRetryDelay: finalDelay - timeSinceLastRetry,
			};
		}

		// Increment retry counter
		AuthErrorRecoveryService.retryAttempts.set(key, attempts + 1);
		AuthErrorRecoveryService.lastRetryTime.set(key, Date.now());

		try {
			logger.info('AuthErrorRecoveryService', 'Attempting automatic retry', {
				attempt: attempts + 1,
				delay: finalDelay,
				errorCode: error.code,
			});

			await new Promise((resolve) => setTimeout(resolve, finalDelay));
			await retryCallback();

			// Success - reset counter
			AuthErrorRecoveryService.resetRetryCounter(context);
			return { success: true };
		} catch (retryError) {
			logger.warn('AuthErrorRecoveryService', 'Automatic retry failed', {
				attempt: attempts + 1,
				error: retryError instanceof Error ? retryError.message : 'Unknown error',
			});

			return { success: false };
		}
	}

	private static logAuthError(
		error: AuthenticationError,
		context: AuthErrorContext,
		analysis: Omit<AuthErrorAnalysis, 'recoveryActions' | 'preventionTips'>
	): void {
		const logData = {
			errorCode: error.code,
			errorType: analysis.errorType,
			severity: analysis.severity,
			username: context.username,
			environmentId: context.environmentId,
			attemptNumber: context.attemptNumber,
			isRetryable: analysis.isRetryable,
			userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined,
			timestamp: new Date().toISOString(),
		};

		switch (analysis.severity) {
			case ErrorSeverity.CRITICAL:
			case ErrorSeverity.HIGH:
				logger.error('AuthErrorRecoveryService', 'High severity auth error', logData);
				break;
			case ErrorSeverity.MEDIUM:
				logger.warn('AuthErrorRecoveryService', 'Medium severity auth error', logData);
				break;
			default:
				logger.info('AuthErrorRecoveryService', 'Low severity auth error', logData);
		}
	}

	private static getRetryKey(context: AuthErrorContext): string {
		return `${context.username || 'unknown'}_${context.environmentId || 'unknown'}`;
	}
}

export default AuthErrorRecoveryService;
