/**
 * SecurityError - Comprehensive error handling for Phase 3 validation
 *
 * Provides structured error handling for:
 * - CSRF detection (Phase 3A)
 * - Replay attack detection (Phase 3B)
 * - PKCE validation failures (Phase 3C)
 * - Token validation failures (Phase 3D)
 *
 * Features:
 * - Error categorization and severity levels
 * - User-friendly error messages
 * - Detailed debugging information
 * - Security event logging
 */

export enum SecurityErrorType {
	// Phase 3A: State validation errors
	CSRF_DETECTED = 'CSRF_DETECTED',
	STATE_MISSING = 'STATE_MISSING',
	STATE_EXPIRED = 'STATE_EXPIRED',
	STATE_INVALID = 'STATE_INVALID',

	// Phase 3B: Nonce validation errors
	REPLAY_ATTACK_DETECTED = 'REPLAY_ATTACK_DETECTED',
	NONCE_MISSING = 'NONCE_MISSING',
	NONCE_EXPIRED = 'NONCE_EXPIRED',
	NONCE_INVALID = 'NONCE_INVALID',

	// Phase 3C: PKCE validation errors
	CODE_VERIFIER_MISSING = 'CODE_VERIFIER_MISSING',
	CODE_VERIFIER_INVALID = 'CODE_VERIFIER_INVALID',
	PKCE_MISMATCH = 'PKCE_MISMATCH',
	PKCE_GENERATION_FAILED = 'PKCE_GENERATION_FAILED',

	// Phase 3D: Token validation errors
	TOKEN_SIGNATURE_INVALID = 'TOKEN_SIGNATURE_INVALID',
	JWKS_RETRIEVAL_FAILED = 'JWKS_RETRIEVAL_FAILED',
	KEY_NOT_FOUND = 'KEY_NOT_FOUND',
	TOKEN_EXPIRED = 'TOKEN_EXPIRED',
	TOKEN_INVALID_FORMAT = 'TOKEN_INVALID_FORMAT',

	// General validation errors
	VALIDATION_FAILED = 'VALIDATION_FAILED',
	FLOW_KEY_MISSING = 'FLOW_KEY_MISSING',
	SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
	NETWORK_ERROR = 'NETWORK_ERROR',
}

export enum SecurityErrorSeverity {
	LOW = 'low', // Informational, no security impact
	MEDIUM = 'medium', // Potential security issue
	HIGH = 'high', // Confirmed security issue
	CRITICAL = 'critical', // Immediate security threat
}

export interface SecurityErrorContext {
	flowKey?: string;
	flowType?: string;
	step?: string;
	component?: string;
	timestamp?: number;
	userAgent?: string;
	ipAddress?: string;
	additionalData?: Record<string, unknown>;
}

export interface SecurityErrorDetails {
	type: SecurityErrorType;
	severity: SecurityErrorSeverity;
	message: string;
	userMessage: string;
	technicalMessage: string;
	context?: SecurityErrorContext;
	originalError?: Error;
	securityEvent?: boolean;
	recommendedAction?: string;
}

/**
 * SecurityError class for structured error handling
 */
export class SecurityError extends Error {
	public readonly type: SecurityErrorType;
	public readonly severity: SecurityErrorSeverity;
	public readonly userMessage: string;
	public readonly technicalMessage: string;
	public readonly context?: SecurityErrorContext;
	public readonly originalError?: Error;
	public readonly securityEvent: boolean;
	public readonly recommendedAction?: string;
	public readonly timestamp: number;

	constructor(details: SecurityErrorDetails) {
		super(details.technicalMessage);

		this.type = details.type;
		this.severity = details.severity;
		this.userMessage = details.userMessage;
		this.technicalMessage = details.technicalMessage;
		this.context = details.context;
		this.originalError = details.originalError;
		this.securityEvent = details.securityEvent ?? true;
		this.recommendedAction = details.recommendedAction;
		this.timestamp = details.context?.timestamp ?? Date.now();

		// Set error name for better debugging
		this.name = 'SecurityError';

		// Log security event
		this.logSecurityEvent();
	}

	/**
	 * Create CSRF detection error
	 */
	static csrfDetected(context?: SecurityErrorContext, originalError?: Error): SecurityError {
		return new SecurityError({
			type: SecurityErrorType.CSRF_DETECTED,
			severity: SecurityErrorSeverity.HIGH,
			message: 'CSRF attack detected',
			userMessage: 'Security validation failed. Please restart the authentication process.',
			technicalMessage: 'CSRF attack detected - state parameter validation failed',
			context,
			originalError,
			recommendedAction:
				'Restart authentication flow and ensure state parameter is properly validated',
		});
	}

	/**
	 * Create replay attack detection error
	 */
	static replayAttackDetected(
		context?: SecurityErrorContext,
		originalError?: Error
	): SecurityError {
		return new SecurityError({
			type: SecurityErrorType.REPLAY_ATTACK_DETECTED,
			severity: SecurityErrorSeverity.HIGH,
			message: 'Replay attack detected',
			userMessage:
				'Security validation failed. The authentication request may have been used already.',
			technicalMessage: 'Replay attack detected - nonce parameter validation failed',
			context,
			originalError,
			recommendedAction: 'Restart authentication flow to generate a new nonce',
		});
	}

	/**
	 * Create PKCE validation error
	 */
	static pkceValidationFailed(
		reason: string,
		context?: SecurityErrorContext,
		originalError?: Error
	): SecurityError {
		return new SecurityError({
			type: SecurityErrorType.PKCE_MISMATCH,
			severity: SecurityErrorSeverity.MEDIUM,
			message: `PKCE validation failed: ${reason}`,
			userMessage: 'PKCE validation failed. Please regenerate PKCE parameters and try again.',
			technicalMessage: `PKCE validation failed - ${reason}`,
			context,
			originalError,
			recommendedAction: 'Regenerate PKCE parameters in the configuration step',
		});
	}

	/**
	 * Create token validation error
	 */
	static tokenValidationFailed(
		reason: string,
		context?: SecurityErrorContext,
		originalError?: Error
	): SecurityError {
		return new SecurityError({
			type: SecurityErrorType.TOKEN_SIGNATURE_INVALID,
			severity: SecurityErrorSeverity.MEDIUM,
			message: `Token validation failed: ${reason}`,
			userMessage: 'Token validation failed. Please check your authentication configuration.',
			technicalMessage: `Token validation failed - ${reason}`,
			context,
			originalError,
			recommendedAction: 'Verify token configuration and ensure proper JWKS setup',
		});
	}

	/**
	 * Create general validation error
	 */
	static validationFailed(
		reason: string,
		context?: SecurityErrorContext,
		originalError?: Error
	): SecurityError {
		return new SecurityError({
			type: SecurityErrorType.VALIDATION_FAILED,
			severity: SecurityErrorSeverity.MEDIUM,
			message: `Validation failed: ${reason}`,
			userMessage: 'Validation failed. Please check your configuration and try again.',
			technicalMessage: `Validation failed - ${reason}`,
			context,
			originalError,
			recommendedAction: 'Review configuration and ensure all required parameters are set',
		});
	}

	/**
	 * Create service unavailable error
	 */
	static serviceUnavailable(
		serviceName: string,
		context?: SecurityErrorContext,
		originalError?: Error
	): SecurityError {
		return new SecurityError({
			type: SecurityErrorType.SERVICE_UNAVAILABLE,
			severity: SecurityErrorSeverity.LOW,
			message: `Service unavailable: ${serviceName}`,
			userMessage: 'A required service is temporarily unavailable. Please try again later.',
			technicalMessage: `Service unavailable - ${serviceName}`,
			context,
			originalError,
			securityEvent: false,
			recommendedAction: 'Wait a moment and try again, or contact support if the issue persists',
		});
	}

	/**
	 * Get user-friendly error message
	 */
	getUserMessage(): string {
		return this.userMessage;
	}

	/**
	 * Get recommended action for user
	 */
	getRecommendedAction(): string {
		return this.recommendedAction || 'Contact support if the issue persists';
	}

	/**
	 * Check if this is a high-severity security event
	 */
	isHighSeverity(): boolean {
		return (
			this.severity === SecurityErrorSeverity.HIGH ||
			this.severity === SecurityErrorSeverity.CRITICAL
		);
	}

	/**
	 * Check if this is a security event
	 */
	isSecurityEvent(): boolean {
		return this.securityEvent;
	}

	/**
	 * Get error summary for logging
	 */
	getSummary(): Record<string, unknown> {
		return {
			type: this.type,
			severity: this.severity,
			message: this.message,
			timestamp: this.timestamp,
			context: this.context,
			securityEvent: this.securityEvent,
			recommendedAction: this.recommendedAction,
		};
	}

	/**
	 * Log security event
	 */
	private logSecurityEvent(): void {
		if (this.securityEvent) {
			console.error('[SecurityError] SECURITY EVENT:', this.getSummary());

			// In production, this would send to security monitoring
			if (this.isHighSeverity()) {
				console.warn('[SecurityError] HIGH SEVERITY SECURITY EVENT DETECTED');
			}
		} else {
			console.error('[SecurityError] Validation Error:', this.getSummary());
		}
	}

	/**
	 * Convert to JSON for API responses
	 */
	toJSON(): Record<string, unknown> {
		return {
			error: 'SecurityError',
			type: this.type,
			severity: this.severity,
			message: this.userMessage,
			technicalMessage: this.technicalMessage,
			timestamp: this.timestamp,
			recommendedAction: this.recommendedAction,
		};
	}
}

/**
 * Security error factory for creating common error types
 */
export class SecurityErrorFactory {
	/**
	 * Create error based on error type
	 */
	static create(
		type: SecurityErrorType,
		message?: string,
		context?: SecurityErrorContext,
		originalError?: Error
	): SecurityError {
		switch (type) {
			case SecurityErrorType.CSRF_DETECTED:
				return SecurityError.csrfDetected(context, originalError);
			case SecurityErrorType.REPLAY_ATTACK_DETECTED:
				return SecurityError.replayAttackDetected(context, originalError);
			case SecurityErrorType.PKCE_MISMATCH:
				return SecurityError.pkceValidationFailed(
					message || 'PKCE mismatch',
					context,
					originalError
				);
			case SecurityErrorType.TOKEN_SIGNATURE_INVALID:
				return SecurityError.tokenValidationFailed(
					message || 'Token signature invalid',
					context,
					originalError
				);
			case SecurityErrorType.SERVICE_UNAVAILABLE:
				return SecurityError.serviceUnavailable(
					message || 'Service unavailable',
					context,
					originalError
				);
			default:
				return SecurityError.validationFailed(
					message || 'Validation failed',
					context,
					originalError
				);
		}
	}

	/**
	 * Create error from generic Error
	 */
	static fromError(error: Error, context?: SecurityErrorContext): SecurityError {
		// Try to determine error type based on error message
		const message = error.message.toLowerCase();

		if (message.includes('csrf') || message.includes('state')) {
			return SecurityError.csrfDetected(context, error);
		}

		if (message.includes('nonce') || message.includes('replay')) {
			return SecurityError.replayAttackDetected(context, error);
		}

		if (message.includes('pkce') || message.includes('code_verifier')) {
			return SecurityError.pkceValidationFailed(error.message, context, error);
		}

		if (message.includes('token') || message.includes('signature')) {
			return SecurityError.tokenValidationFailed(error.message, context, error);
		}

		return SecurityError.validationFailed(error.message, context, error);
	}
}

/**
 * Security error handler for consistent error processing
 */
export class SecurityErrorHandler {
	/**
	 * Handle security error with appropriate logging and user feedback
	 */
	static handle(error: SecurityError): {
		userMessage: string;
		technicalMessage: string;
		recommendedAction: string;
		severity: SecurityErrorSeverity;
		isSecurityEvent: boolean;
	} {
		// Log the error (already done in constructor)

		return {
			userMessage: error.getUserMessage(),
			technicalMessage: error.technicalMessage,
			recommendedAction: error.getRecommendedAction(),
			severity: error.severity,
			isSecurityEvent: error.isSecurityEvent(),
		};
	}

	/**
	 * Handle generic error by converting to SecurityError
	 */
	static handleGeneric(
		error: Error,
		context?: SecurityErrorContext
	): ReturnType<typeof SecurityErrorHandler.handle> {
		const securityError = SecurityErrorFactory.fromError(error, context);
		return SecurityErrorHandler.handle(securityError);
	}
}

export default SecurityError;
