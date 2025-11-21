// src/services/flowErrorService.tsx
import React from 'react';
import { FlowErrorDisplay, FlowErrorDisplayProps } from '../components/FlowErrorDisplay';
import { InlineFlowError, InlineFlowErrorProps } from '../components/InlineFlowError';
import { ERROR_MESSAGES, ErrorCategory, ErrorTemplate } from '../constants/errorMessages';
import { FlowType } from './flowStepDefinitions';

/**
 * Configuration for displaying an error in a flow
 */
export interface FlowErrorConfig {
	/** The flow type (e.g., 'authorization-code', 'implicit') */
	flowType: FlowType;
	/** The flow-specific key (e.g., 'oauth-authorization-code-v6') */
	flowKey: string;
	/** Current step number in the flow */
	currentStep?: number;
	/** Error category for standardized messaging */
	errorCategory?: ErrorCategory;
	/** Custom error title */
	title?: string;
	/** Error description */
	description?: string;
	/** Additional error details */
	details?: string;
	/** OAuth error code */
	oauthError?: string;
	/** OAuth error description */
	oauthErrorDescription?: string;
	/** Correlation ID */
	correlationId?: string;
	/** Raw error object */
	error?: Error | unknown;
	/** Display mode */
	displayMode?: 'full-page' | 'inline';
	/** Callbacks */
	onRetry?: () => void;
	onGoToConfig?: () => void;
	onStartOver?: () => void;
}

/**
 * FlowErrorService - Central service for handling and displaying flow errors
 *
 * This service provides:
 * - Consistent error display across all flows
 * - Both full-page and inline error components
 * - Standardized error categorization and messaging
 * - Integration with OAuthErrorHelper for OAuth-specific errors
 * - Correlation IDs for debugging
 */
class FlowErrorServiceClass {
	/**
	 * Generate a correlation ID for error tracking
	 */
	generateCorrelationId(): string {
		return `err_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
	}

	/**
	 * Extract error details from various error types
	 */
	extractErrorDetails(error: unknown): { message: string; details?: string } {
		if (error instanceof Error) {
			return {
				message: error.message,
				details: error.stack,
			};
		}

		if (typeof error === 'string') {
			return { message: error };
		}

		if (error && typeof error === 'object') {
			const err = error as any;
			return {
				message: err.message || err.error || 'An unknown error occurred',
				details: JSON.stringify(error, null, 2),
			};
		}

		return { message: 'An unknown error occurred' };
	}

	/**
	 * Categorize an error based on its properties
	 */
	categorizeError(config: FlowErrorConfig): ErrorCategory {
		// If category explicitly provided, use it
		if (config.errorCategory) {
			return config.errorCategory;
		}

		// Check OAuth error codes
		if (config.oauthError) {
			const errorCode = config.oauthError.toLowerCase();

			if (errorCode.includes('invalid_client') || errorCode.includes('unauthorized_client')) {
				return 'INVALID_CREDENTIALS';
			}

			if (errorCode.includes('redirect_uri')) {
				return 'REDIRECT_URI_MISMATCH';
			}

			if (errorCode === 'invalid_grant') {
				return 'TOKEN_EXCHANGE_FAILED';
			}
		}

		// Check error message content
		const message = config.description || config.title || '';
		const lowerMessage = message.toLowerCase();

		if (
			lowerMessage.includes('network') ||
			lowerMessage.includes('fetch') ||
			lowerMessage.includes('connection')
		) {
			return 'NETWORK_ERROR';
		}

		if (lowerMessage.includes('redirect') && lowerMessage.includes('uri')) {
			return 'REDIRECT_URI_MISMATCH';
		}

		if (lowerMessage.includes('pkce')) {
			return 'PKCE_MISMATCH';
		}

		if (lowerMessage.includes('token') && lowerMessage.includes('exchange')) {
			return 'TOKEN_EXCHANGE_FAILED';
		}

		if (lowerMessage.includes('discovery') || lowerMessage.includes('well-known')) {
			return 'OIDC_DISCOVERY_FAILED';
		}

		if (lowerMessage.includes('jwt') && lowerMessage.includes('generat')) {
			return 'JWT_GENERATION_FAILED';
		}

		if (lowerMessage.includes('introspect')) {
			return 'INTROSPECTION_FAILED';
		}

		if (lowerMessage.includes('userinfo')) {
			return 'USERINFO_FAILED';
		}

		// Default to generic error
		return 'GENERIC_ERROR';
	}

	/**
	 * Get the appropriate error template for the given error
	 */
	private getErrorTemplate(config: FlowErrorConfig): ErrorTemplate {
		// Try to get template from OAuth error first
		if (config.oauthError && ERROR_MESSAGES[config.oauthError]) {
			return ERROR_MESSAGES[config.oauthError];
		}

		// Try to get template from error message
		if (config.description) {
			const errorKey = Object.keys(ERROR_MESSAGES).find((key) =>
				config.description?.toLowerCase().includes(key.toLowerCase())
			);
			if (errorKey) {
				return ERROR_MESSAGES[errorKey];
			}

			// Check for specific error patterns
			const lowerDesc = config.description.toLowerCase();
			if (
				lowerDesc.includes('client id is required') ||
				lowerDesc.includes('client_id is required')
			) {
				return ERROR_MESSAGES['client_id_is_required'];
			}
		}

		// Categorize and return appropriate generic template
		const category = this.categorizeError(config);

		// Map categories to generic error templates
		const categoryMap: Record<string, keyof typeof ERROR_MESSAGES> = {
			CALLBACK_NO_CODE: 'invalid_grant',
			TOKEN_EXCHANGE_FAILED: 'invalid_grant',
			INVALID_CALLBACK: 'invalid_request',
			NETWORK_ERROR: 'network_error',
			GENERIC_ERROR: 'unknown_error',
		};

		const templateKey = categoryMap[category] || 'unknown_error';
		return ERROR_MESSAGES[templateKey] || ERROR_MESSAGES['unknown_error'];
	}

	/**
	 * Get a full-page error display component
	 */
	getFullPageError(config: FlowErrorConfig): React.ReactElement<FlowErrorDisplayProps> {
		const _category = this.categorizeError(config);
		const correlationId = config.correlationId || this.generateCorrelationId();

		// Extract error details if error object provided
		let details = config.details;
		if (config.error && !details) {
			const extracted = this.extractErrorDetails(config.error);
			details = extracted.details;
		}

		// Get the error template
		const errorTemplate = this.getErrorTemplate(config);

		return (
			<FlowErrorDisplay
				flowType={config.flowType}
				flowKey={config.flowKey}
				currentStep={config.currentStep}
				errorTemplate={errorTemplate}
				errorCode={config.oauthError}
				errorDescription={config.oauthErrorDescription || config.description}
				correlationId={correlationId}
				onRetry={config.onRetry}
				onGoToConfig={config.onGoToConfig}
				onStartOver={config.onStartOver}
				metadata={details ? { details } : undefined}
			/>
		);
	}

	/**
	 * Get an inline error display component
	 */
	getInlineError(config: FlowErrorConfig): React.ReactElement<InlineFlowErrorProps> {
		const category = this.categorizeError(config);
		const correlationId = config.correlationId || this.generateCorrelationId();

		// Extract error details if error object provided
		let details = config.details;
		let description = config.description;
		if (config.error) {
			const extracted = this.extractErrorDetails(config.error);
			if (!description) {
				description = extracted.message;
			}
			if (!details) {
				details = extracted.details;
			}
		}

		return (
			<InlineFlowError
				errorCategory={category}
				title={config.title}
				description={description}
				details={details}
				oauthError={config.oauthError}
				oauthErrorDescription={config.oauthErrorDescription}
				correlationId={correlationId}
				onRetry={config.onRetry}
				onGoToConfig={config.onGoToConfig}
				showDetails={false}
				severity="error"
			/>
		);
	}

	/**
	 * Get an error display component (full-page or inline based on config)
	 */
	getErrorDisplay(config: FlowErrorConfig): React.ReactElement {
		const displayMode = config.displayMode || 'full-page';

		if (displayMode === 'inline') {
			return this.getInlineError(config);
		}

		return this.getFullPageError(config);
	}

	/**
	 * Log an error with context for debugging
	 */
	logError(config: FlowErrorConfig): void {
		const correlationId = config.correlationId || this.generateCorrelationId();
		const category = this.categorizeError(config);

		console.error(`[FlowError] ${category}`, {
			correlationId,
			flowType: config.flowType,
			flowKey: config.flowKey,
			currentStep: config.currentStep,
			category,
			oauthError: config.oauthError,
			oauthErrorDescription: config.oauthErrorDescription,
			error: config.error,
			timestamp: new Date().toISOString(),
		});
	}

	/**
	 * Handle an error in a flow (log and return display component)
	 */
	handleError(config: FlowErrorConfig): React.ReactElement {
		this.logError(config);
		return this.getErrorDisplay(config);
	}
}

// Export singleton instance
export const FlowErrorService = new FlowErrorServiceClass();

// Export type for convenience
export type { FlowErrorConfig };
