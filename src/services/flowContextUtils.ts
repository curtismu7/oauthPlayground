// src/services/flowContextUtils.ts
// Utility functions for common flow context operations

import FlowContextService from './flowContextService';
import RedirectStateManager, { type FlowState } from './redirectStateManager';

/**
 * FlowContextUtils - High-level utility functions for flow context management
 *
 * This utility provides simplified methods for common operations:
 * 1. Starting OAuth flows with proper context setup
 * 2. Handling OAuth callbacks with state restoration
 * 3. Managing flow navigation and step transitions
 * 4. Cleaning up flow state on completion
 */
export class FlowContextUtils {
	/**
	 * Initialize flow context for OAuth redirect
	 */
	static initializeOAuthFlow(
		flowType: string,
		currentStep: number,
		flowState: FlowState,
		additionalParams?: Record<string, string>
	): string {
		try {
			const flowId = `${flowType}-${Date.now()}`;

			// Create redirect context
			const success = RedirectStateManager.createRedirectContext(
				flowType,
				flowId,
				currentStep,
				flowState
			);

			if (!success) {
				throw new Error('Failed to create redirect context');
			}

			// Build return path with additional parameters
			const returnPath = FlowContextService.buildReturnPath(
				flowType,
				currentStep.toString(),
				additionalParams
			);

			console.log(`[FlowContextUtils] Initialized OAuth flow ${flowType}:`, {
				flowId,
				currentStep,
				returnPath,
			});

			return flowId;
		} catch (error) {
			console.error('[FlowContextUtils] Failed to initialize OAuth flow:', error);
			throw error;
		}
	}

	/**
	 * Handle OAuth callback and restore flow state
	 */
	static handleOAuthCallback(callbackData: any): {
		success: boolean;
		redirectUrl: string;
		flowState?: FlowState;
		error?: string;
	} {
		try {
			// Clean up expired states first
			RedirectStateManager.cleanupExpiredStates();

			// Handle the redirect return
			const result = RedirectStateManager.handleRedirectReturn(callbackData);

			console.log('[FlowContextUtils] Handled OAuth callback:', {
				success: result.success,
				redirectUrl: result.redirectUrl,
				hasFlowState: !!result.flowState,
			});

			return result;
		} catch (error) {
			console.error('[FlowContextUtils] Failed to handle OAuth callback:', error);
			return {
				success: false,
				redirectUrl: '/dashboard',
				error: error instanceof Error ? error.message : 'Unknown error',
			};
		}
	}

	/**
	 * Update flow step and context
	 */
	static updateFlowStep(flowId: string, newStep: number, flowState?: Partial<FlowState>): boolean {
		try {
			// Update flow context
			const contextUpdated = FlowContextService.updateFlowContext(flowId, {
				currentStep: newStep,
				flowState: { step: newStep, ...flowState },
			});

			if (!contextUpdated) {
				console.warn(`[FlowContextUtils] Failed to update flow context for ${flowId}`);
				return false;
			}

			// Update preserved flow state if provided
			if (flowState) {
				const existingState = RedirectStateManager.restoreFlowState(flowId);
				if (existingState) {
					const updatedState = { ...existingState, ...flowState, currentStep: newStep };
					RedirectStateManager.preserveFlowState(flowId, updatedState);
				}
			}

			console.log(`[FlowContextUtils] Updated flow step for ${flowId}:`, {
				newStep,
				hasFlowState: !!flowState,
			});

			return true;
		} catch (error) {
			console.error('[FlowContextUtils] Failed to update flow step:', error);
			return false;
		}
	}

	/**
	 * Complete flow and clean up all state
	 */
	static completeFlow(flowId: string): void {
		try {
			// Clear flow context
			FlowContextService.clearFlowContext(flowId);

			// Clear preserved flow state
			RedirectStateManager.clearFlowState(flowId);

			// Clean up any expired states while we're at it
			RedirectStateManager.cleanupExpiredStates();

			console.log(`[FlowContextUtils] Completed and cleaned up flow ${flowId}`);
		} catch (error) {
			console.error('[FlowContextUtils] Failed to complete flow:', error);
		}
	}

	/**
	 * Check if flow context exists
	 */
	static hasActiveFlow(): boolean {
		try {
			const context = FlowContextService.getFlowContext();
			return context !== null;
		} catch (error) {
			console.error('[FlowContextUtils] Failed to check active flow:', error);
			return false;
		}
	}

	/**
	 * Get current flow information
	 */
	static getCurrentFlow(): {
		flowType?: string;
		currentStep?: number;
		returnPath?: string;
		age?: number;
	} | null {
		try {
			const context = FlowContextService.getFlowContext();
			if (!context) {
				return null;
			}

			return {
				flowType: context.flowType,
				currentStep: context.currentStep,
				returnPath: context.returnPath,
				age: Date.now() - context.timestamp,
			};
		} catch (error) {
			console.error('[FlowContextUtils] Failed to get current flow:', error);
			return null;
		}
	}

	/**
	 * Build OAuth authorization URL with proper state management
	 */
	static buildAuthorizationUrl(
		baseUrl: string,
		params: Record<string, string>,
		flowType: string,
		currentStep: number,
		flowState: FlowState
	): string {
		try {
			// Initialize flow context
			const flowId = FlowContextUtils.initializeOAuthFlow(flowType, currentStep, flowState);

			// Add flow ID to state parameter for tracking
			const enhancedParams = {
				...params,
				state: params.state ? `${params.state}_${flowId}` : flowId,
			};

			// Build URL
			const url = new URL(baseUrl);
			Object.entries(enhancedParams).forEach(([key, value]) => {
				url.searchParams.set(key, value);
			});

			console.log(`[FlowContextUtils] Built authorization URL for ${flowType}:`, {
				flowId,
				url: url.toString(),
			});

			return url.toString();
		} catch (error) {
			console.error('[FlowContextUtils] Failed to build authorization URL:', error);

			// Fallback to basic URL without flow context
			const url = new URL(baseUrl);
			Object.entries(params).forEach(([key, value]) => {
				url.searchParams.set(key, value);
			});
			return url.toString();
		}
	}

	/**
	 * Validate flow context integrity
	 */
	static validateFlowIntegrity(): {
		valid: boolean;
		issues: string[];
		recommendations: string[];
	} {
		const issues: string[] = [];
		const recommendations: string[] = [];

		try {
			// Check for active flow context
			const context = FlowContextService.getFlowContext();
			if (!context) {
				return {
					valid: true,
					issues: [],
					recommendations: ['No active flow context found'],
				};
			}

			// Validate context
			const validation = FlowContextService.validateFlowContext(context);
			issues.push(...validation.errors);
			recommendations.push(...validation.warnings);

			// Check for orphaned flow states
			let orphanedStates = 0;
			for (let i = 0; i < sessionStorage.length; i++) {
				const key = sessionStorage.key(i);
				if (key?.startsWith('flow_state_')) {
					orphanedStates++;
				}
			}

			if (orphanedStates > 5) {
				recommendations.push(`Found ${orphanedStates} preserved flow states. Consider cleanup.`);
			}

			// Check context age
			const age = Date.now() - context.timestamp;
			if (age > 20 * 60 * 1000) {
				// 20 minutes
				recommendations.push('Flow context is getting old. Consider refreshing.');
			}

			return {
				valid: issues.length === 0,
				issues,
				recommendations,
			};
		} catch (error) {
			return {
				valid: false,
				issues: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
				recommendations: ['Clear flow context and restart flow'],
			};
		}
	}

	/**
	 * Emergency cleanup - clear all flow-related storage
	 */
	static emergencyCleanup(): void {
		try {
			console.warn('[FlowContextUtils] Performing emergency cleanup of all flow state');

			// Clear all known flow context keys
			const flowContextKeys = [
				'flowContext',
				'tokenManagementFlowContext',
				'implicit_flow_v3_context',
			];

			flowContextKeys.forEach((key) => {
				sessionStorage.removeItem(key);
			});

			// Clear all flow state keys
			const keysToRemove: string[] = [];
			for (let i = 0; i < sessionStorage.length; i++) {
				const key = sessionStorage.key(i);
				if (key?.startsWith('flow_state_')) {
					keysToRemove.push(key);
				}
			}

			keysToRemove.forEach((key) => {
				sessionStorage.removeItem(key);
			});

			console.log(
				`[FlowContextUtils] Emergency cleanup completed. Removed ${flowContextKeys.length + keysToRemove.length} items.`
			);
		} catch (error) {
			console.error('[FlowContextUtils] Emergency cleanup failed:', error);
		}
	}
}

export default FlowContextUtils;
