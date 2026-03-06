// src/services/flowTrackingService.ts
/**
 * Flow Tracking Service
 *
 * Tracks the current active flow for error handling and navigation purposes.
 * This ensures we know which flow to return to when errors occur.
 */

export interface FlowContext {
	flowKey: string;
	flowName: string;
	flowType:
		| 'oauth'
		| 'oidc'
		| 'implicit'
		| 'hybrid'
		| 'device'
		| 'client-credentials'
		| 'ciba'
		| 'par'
		| 'rar';
	currentStep?: number;
	timestamp: number;
	userAgent?: string;
	sessionId?: string;
}

export interface FlowErrorContext extends FlowContext {
	errorType:
		| 'authorization'
		| 'token-exchange'
		| 'user-info'
		| 'logout'
		| 'discovery'
		| 'validation';
	errorMessage: string;
	errorCode?: string;
	redirectUri?: string;
}

class FlowTrackingService {
	private readonly CURRENT_FLOW_KEY = 'pingone_current_flow';
	private readonly FLOW_HISTORY_KEY = 'pingone_flow_history';
	private readonly MAX_HISTORY_SIZE = 10;

	/**
	 * Set the current active flow
	 */
	setCurrentFlow(context: FlowContext): boolean {
		try {
			logger.debug('FlowTrackingService', `🔄 [FlowTracking] Setting current flow`);
			logger.info('FlowTrackingService', `📋 Flow Context:`, { arg0: context });

			// Store current flow
			sessionStorage.setItem(this.CURRENT_FLOW_KEY, JSON.stringify(context));

			// Add to history
			this.addToHistory(context);

			logger.info(
				'FlowTrackingService',
				`✅ Current flow set: ${context.flowKey} (${context.flowName})`
			);

			return true;
		} catch (error) {
			logger.error(
				'FlowTrackingService',
				`❌ Failed to set current flow:`,
				undefined,
				error as Error
			);
			return false;
		}
	}

	/**
	 * Get the current active flow
	 */
	getCurrentFlow(): FlowContext | null {
		try {
			const stored = sessionStorage.getItem(this.CURRENT_FLOW_KEY);
			if (!stored) return null;

			const context = JSON.parse(stored);
			logger.info('FlowTrackingService', `🔍 [FlowTracking] Current flow:`, { arg0: context });
			return context;
		} catch (error) {
			logger.error(
				'FlowTrackingService',
				`❌ Failed to get current flow:`,
				undefined,
				error as Error
			);
			return null;
		}
	}

	/**
	 * Clear the current flow (when flow completes or user navigates away)
	 */
	clearCurrentFlow(): boolean {
		try {
			sessionStorage.removeItem(this.CURRENT_FLOW_KEY);
			logger.info('FlowTrackingService', `🧹 [FlowTracking] Current flow cleared`);
			return true;
		} catch (error) {
			logger.error(
				'FlowTrackingService',
				`❌ Failed to clear current flow:`,
				undefined,
				error as Error
			);
			return false;
		}
	}

	/**
	 * Track an error that occurred in a flow
	 */
	trackFlowError(errorContext: FlowErrorContext): boolean {
		try {
			logger.debug('FlowTrackingService', `🚨 [FlowTracking] Tracking flow error`);
			logger.info('FlowTrackingService', `📋 Error Context:`, { arg0: errorContext });

			// Store error context
			const errorKey = `pingone_flow_error_${Date.now()}`;
			sessionStorage.setItem(errorKey, JSON.stringify(errorContext));

			// Also store in current flow context for easy access
			const currentFlow = this.getCurrentFlow();
			if (currentFlow) {
				const enhancedFlow = {
					...currentFlow,
					lastError: errorContext,
					lastErrorTime: Date.now(),
				};
				sessionStorage.setItem(this.CURRENT_FLOW_KEY, JSON.stringify(enhancedFlow));
			}

			logger.info(
				'FlowTrackingService',
				`✅ Flow error tracked: ${errorContext.errorType} in ${errorContext.flowKey}`
			);

			return true;
		} catch (error) {
			logger.error(
				'FlowTrackingService',
				`❌ Failed to track flow error:`,
				undefined,
				error as Error
			);
			return false;
		}
	}

	/**
	 * Get the return URL for the current flow when an error occurs
	 */
	getFlowReturnUrl(): string | null {
		try {
			const currentFlow = this.getCurrentFlow();
			if (!currentFlow) return null;

			// Generate return URL based on flow type and current step
			const baseUrl = window.location.origin;
			let returnUrl = `${baseUrl}/flows/${currentFlow.flowKey}`;

			// Add step parameter if available
			if (currentFlow.currentStep !== undefined) {
				returnUrl += `?step=${currentFlow.currentStep}`;
			}

			logger.info('FlowTrackingService', `🔗 [FlowTracking] Return URL: ${returnUrl}`);
			return returnUrl;
		} catch (error) {
			logger.error(
				'FlowTrackingService',
				`❌ Failed to get flow return URL:`,
				undefined,
				error as Error
			);
			return null;
		}
	}

	/**
	 * Navigate back to the current flow (useful for error handling)
	 */
	returnToCurrentFlow(): boolean {
		try {
			const returnUrl = this.getFlowReturnUrl();
			if (!returnUrl) {
				logger.warn('FlowTrackingService', `⚠️ [FlowTracking] No return URL available`);
				return false;
			}

			logger.info('FlowTrackingService', `🔄 [FlowTracking] Returning to flow: ${returnUrl}`);
			window.location.href = returnUrl;
			return true;
		} catch (error) {
			logger.error(
				'FlowTrackingService',
				`❌ Failed to return to current flow:`,
				undefined,
				error as Error
			);
			return false;
		}
	}

	/**
	 * Add flow to history
	 */
	private addToHistory(context: FlowContext): void {
		try {
			const history = this.getFlowHistory();
			const newHistory = [context, ...history].slice(0, this.MAX_HISTORY_SIZE);
			sessionStorage.setItem(this.FLOW_HISTORY_KEY, JSON.stringify(newHistory));
		} catch (error) {
			logger.error(
				'FlowTrackingService',
				`❌ Failed to add to flow history:`,
				undefined,
				error as Error
			);
		}
	}

	/**
	 * Get flow history
	 */
	getFlowHistory(): FlowContext[] {
		try {
			const stored = sessionStorage.getItem(this.FLOW_HISTORY_KEY);
			if (!stored) return [];

			return JSON.parse(stored);
		} catch (error) {
			logger.error(
				'FlowTrackingService',
				`❌ Failed to get flow history:`,
				undefined,
				error as Error
			);
			return [];
		}
	}

	/**
	 * Clear flow history
	 */
	clearFlowHistory(): boolean {
		try {
			sessionStorage.removeItem(this.FLOW_HISTORY_KEY);
			logger.info('FlowTrackingService', `🧹 [FlowTracking] Flow history cleared`);
			return true;
		} catch (error) {
			logger.error(
				'FlowTrackingService',
				`❌ Failed to clear flow history:`,
				undefined,
				error as Error
			);
			return false;
		}
	}

	/**
	 * Get flow statistics
	 */
	getFlowStats(): {
		totalFlows: number;
		currentFlow: FlowContext | null;
		lastError: FlowErrorContext | null;
	} {
		try {
			const history = this.getFlowHistory();
			const currentFlow = this.getCurrentFlow();

			// Find last error
			let lastError: FlowErrorContext | null = null;
			if (currentFlow && (currentFlow as any).lastError) {
				lastError = (currentFlow as any).lastError;
			}

			return {
				totalFlows: history.length,
				currentFlow,
				lastError,
			};
		} catch (error) {
			logger.error(
				'FlowTrackingService',
				`❌ Failed to get flow stats:`,
				undefined,
				error as Error
			);
			return { totalFlows: 0, currentFlow: null, lastError: null };
		}
	}
}

// Export singleton instance
export const flowTrackingService = new FlowTrackingService();

// Make available globally in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
	(window as any).FlowTrackingService = flowTrackingService;
}
