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
	flowType: 'oauth' | 'oidc' | 'implicit' | 'hybrid' | 'device' | 'client-credentials' | 'ciba' | 'par' | 'rar';
	currentStep?: number;
	timestamp: number;
	userAgent?: string;
	sessionId?: string;
}

export interface FlowErrorContext extends FlowContext {
	errorType: 'authorization' | 'token-exchange' | 'user-info' | 'logout' | 'discovery' | 'validation';
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
			console.group(`🔄 [FlowTracking] Setting current flow`);
			console.log(`📋 Flow Context:`, context);
			
			// Store current flow
			sessionStorage.setItem(this.CURRENT_FLOW_KEY, JSON.stringify(context));
			
			// Add to history
			this.addToHistory(context);
			
			console.log(`✅ Current flow set: ${context.flowKey} (${context.flowName})`);
			console.groupEnd();
			
			return true;
		} catch (error) {
			console.error(`❌ Failed to set current flow:`, error);
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
			console.log(`🔍 [FlowTracking] Current flow:`, context);
			return context;
		} catch (error) {
			console.error(`❌ Failed to get current flow:`, error);
			return null;
		}
	}

	/**
	 * Clear the current flow (when flow completes or user navigates away)
	 */
	clearCurrentFlow(): boolean {
		try {
			sessionStorage.removeItem(this.CURRENT_FLOW_KEY);
			console.log(`🧹 [FlowTracking] Current flow cleared`);
			return true;
		} catch (error) {
			console.error(`❌ Failed to clear current flow:`, error);
			return false;
		}
	}

	/**
	 * Track an error that occurred in a flow
	 */
	trackFlowError(errorContext: FlowErrorContext): boolean {
		try {
			console.group(`🚨 [FlowTracking] Tracking flow error`);
			console.log(`📋 Error Context:`, errorContext);
			
			// Store error context
			const errorKey = `pingone_flow_error_${Date.now()}`;
			sessionStorage.setItem(errorKey, JSON.stringify(errorContext));
			
			// Also store in current flow context for easy access
			const currentFlow = this.getCurrentFlow();
			if (currentFlow) {
				const enhancedFlow = {
					...currentFlow,
					lastError: errorContext,
					lastErrorTime: Date.now()
				};
				sessionStorage.setItem(this.CURRENT_FLOW_KEY, JSON.stringify(enhancedFlow));
			}
			
			console.log(`✅ Flow error tracked: ${errorContext.errorType} in ${errorContext.flowKey}`);
			console.groupEnd();
			
			return true;
		} catch (error) {
			console.error(`❌ Failed to track flow error:`, error);
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
			
			console.log(`🔗 [FlowTracking] Return URL: ${returnUrl}`);
			return returnUrl;
		} catch (error) {
			console.error(`❌ Failed to get flow return URL:`, error);
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
				console.warn(`⚠️ [FlowTracking] No return URL available`);
				return false;
			}
			
			console.log(`🔄 [FlowTracking] Returning to flow: ${returnUrl}`);
			window.location.href = returnUrl;
			return true;
		} catch (error) {
			console.error(`❌ Failed to return to current flow:`, error);
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
			console.error(`❌ Failed to add to flow history:`, error);
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
			console.error(`❌ Failed to get flow history:`, error);
			return [];
		}
	}

	/**
	 * Clear flow history
	 */
	clearFlowHistory(): boolean {
		try {
			sessionStorage.removeItem(this.FLOW_HISTORY_KEY);
			console.log(`🧹 [FlowTracking] Flow history cleared`);
			return true;
		} catch (error) {
			console.error(`❌ Failed to clear flow history:`, error);
			return false;
		}
	}

	/**
	 * Get flow statistics
	 */
	getFlowStats(): { totalFlows: number; currentFlow: FlowContext | null; lastError: FlowErrorContext | null } {
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
				lastError
			};
		} catch (error) {
			console.error(`❌ Failed to get flow stats:`, error);
			return { totalFlows: 0, currentFlow: null, lastError: null };
		}
	}
}

// Export singleton instance
export const flowTrackingService = new FlowTrackingService();

// Make available globally in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
	(window as any).FlowTrackingService = flowTrackingService;
	console.log('🔧 [FlowTracking] Service available globally as window.FlowTrackingService');
}
