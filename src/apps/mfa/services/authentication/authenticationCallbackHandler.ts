/**
 * @file authenticationCallbackHandler.ts
 * @module apps/mfa/services/authentication
 * @description Authentication flow callback handler
 * @version 8.0.0
 * @since 2026-02-20
 */

import type {
	AuthenticationFlowState,
	CallbackRoutingResult,
	MFACallbackData,
} from '@/apps/mfa/types/mfaFlowTypes';
import {
	AuthenticationStep,
	CallbackValidationError,
	NetworkError,
	StateCorruptionError,
} from '@/apps/mfa/types/mfaFlowTypes';
import { AuthenticationStateManager } from './authenticationStateManager';

const MODULE_TAG = '[🔐 AUTH-CALLBACK-HANDLER]';

/**
 * Authentication flow callback handler
 * Processes callbacks specifically for device authentication flows
 */
export class AuthenticationCallbackHandler {
	/**
	 * Process authentication callback
	 */
	static async process(
		callbackData: MFACallbackData,
		flowState: AuthenticationFlowState
	): Promise<CallbackRoutingResult> {
		console.log(`${MODULE_TAG} Processing authentication callback`, {
			url: callbackData.url,
			currentStep: flowState.currentStep,
			deviceType: flowState.selectedDevice?.type,
		});

		try {
			// 1. Validate callback integrity
			AuthenticationCallbackHandler.validateCallback(callbackData, flowState);

			// 2. Determine target step from callback
			const targetStep = AuthenticationCallbackHandler.determineTargetStep(callbackData, flowState);

			// 3. Update authentication state
			const updatedState = await AuthenticationCallbackHandler.updateAuthenticationState(
				flowState,
				callbackData,
				targetStep
			);

			// 4. Route to correct step
			const result: CallbackRoutingResult = {
				success: true,
				flowType: 'authentication',
				targetStep,
				flowState: updatedState,
				navigationAction: AuthenticationCallbackHandler.getNavigationAction(
					targetStep,
					flowState.currentStep
				),
			};

			console.log(`${MODULE_TAG} Authentication callback processed successfully`, {
				targetStep,
				navigationAction: result.navigationAction,
			});

			return result;
		} catch (error) {
			console.error(`${MODULE_TAG} Authentication callback processing failed:`, error);
			return AuthenticationCallbackHandler.handleCallbackError(error, flowState);
		}
	}

	/**
	 * Validate callback data against flow state
	 */
	private static validateCallback(callback: MFACallbackData, state: AuthenticationFlowState): void {
		// Check if callback is for authentication
		if (
			!callback.url.toLowerCase().includes('auth') &&
			!callback.url.toLowerCase().includes('authenticate')
		) {
			throw new CallbackValidationError('Callback URL does not match authentication flow', {
				url: callback.url,
				expectedFlow: 'authentication',
			});
		}

		// Check challenge consistency
		if (
			callback.data?.challengeId &&
			callback.data.challengeId !== state.challengeData.challengeId
		) {
			throw new CallbackValidationError('Challenge ID mismatch in callback', {
				callbackChallengeId: callback.data.challengeId,
				stateChallengeId: state.challengeData.challengeId,
			});
		}

		// Check device consistency
		if (
			callback.data?.deviceId &&
			state.selectedDevice.id &&
			callback.data.deviceId !== state.selectedDevice.id
		) {
			throw new CallbackValidationError('Device ID mismatch in callback', {
				callbackDeviceId: callback.data.deviceId,
				stateDeviceId: state.selectedDevice.id,
			});
		}

		// Check callback timestamp (should be recent for security)
		const callbackAge = Date.now() - callback.timestamp;
		const maxAge = 2 * 60 * 1000; // 2 minutes for authentication
		if (callbackAge > maxAge) {
			throw new CallbackValidationError('Callback timestamp is too old for authentication', {
				callbackAge,
				maxAge,
			});
		}

		console.log(`${MODULE_TAG} Callback validation passed`);
	}

	/**
	 * Determine target step from callback data
	 */
	private static determineTargetStep(
		callback: MFACallbackData,
		state: AuthenticationFlowState
	): AuthenticationStep {
		console.log(`${MODULE_TAG} Determining target step from callback`, {
			callbackData: callback.data,
			currentStep: state.currentStep,
		});

		// Check for completion signals
		if (
			callback.data?.authenticationComplete ||
			callback.data?.status === 'SUCCESS' ||
			callback.data?.authenticated === true
		) {
			return AuthenticationStep.AUTHENTICATION_COMPLETE;
		}

		// Check for challenge response requirements
		if (
			callback.data?.challengeResponse ||
			callback.data?.responseRequired ||
			callback.data?.needsResponse
		) {
			return AuthenticationStep.CHALLENGE_RESPONSE;
		}

		// Check for challenge initiation requirements
		if (
			callback.data?.challengeInitiation ||
			callback.data?.initiationRequired ||
			callback.data?.needsInitiation
		) {
			return AuthenticationStep.CHALLENGE_INITIATION;
		}

		// Check for device selection requirements
		if (
			callback.data?.deviceSelection ||
			callback.data?.selectionRequired ||
			callback.data?.needsSelection
		) {
			return AuthenticationStep.DEVICE_SELECTION;
		}

		// Check for error conditions that require retry
		if (callback.data?.error || callback.data?.errorCode) {
			console.warn(`${MODULE_TAG} Callback contains error, staying at current step`);
			return state.currentStep;
		}

		// Default: advance to next logical step
		return AuthenticationCallbackHandler.getNextLogicalStep(state.currentStep);
	}

	/**
	 * Get next logical step in authentication flow
	 */
	private static getNextLogicalStep(currentStep: AuthenticationStep): AuthenticationStep {
		switch (currentStep) {
			case AuthenticationStep.DEVICE_SELECTION:
				return AuthenticationStep.CHALLENGE_INITIATION;
			case AuthenticationStep.CHALLENGE_INITIATION:
				return AuthenticationStep.CHALLENGE_RESPONSE;
			case AuthenticationStep.CHALLENGE_RESPONSE:
				return AuthenticationStep.AUTHENTICATION_COMPLETE;
			case AuthenticationStep.AUTHENTICATION_COMPLETE:
				return AuthenticationStep.AUTHENTICATION_COMPLETE; // Stay at complete
			default:
				return AuthenticationStep.DEVICE_SELECTION;
		}
	}

	/**
	 * Update authentication state with callback data
	 */
	private static async updateAuthenticationState(
		currentState: AuthenticationFlowState,
		callbackData: MFACallbackData,
		targetStep: AuthenticationStep
	): Promise<AuthenticationFlowState> {
		console.log(`${MODULE_TAG} Updating authentication state`, {
			currentStep: currentState.currentStep,
			targetStep,
			hasCallbackData: !!callbackData.data,
		});

		// Update callback state
		const updatedCallbackState = {
			isPending: false,
			callbackUrl: callbackData.url,
			callbackData: callbackData.data,
			expectedStep: targetStep,
			retryCount: 0,
			lastCallbackTime: Date.now(),
		};

		let updatedState = AuthenticationStateManager.updateCallbackState(
			currentState,
			updatedCallbackState
		);

		// Update challenge data if present in callback
		if (callbackData.data?.challengeData) {
			updatedState = AuthenticationStateManager.updateChallengeData(
				updatedState,
				callbackData.data.challengeData
			);
		}

		// Update selected device if present in callback
		if (callbackData.data?.selectedDevice) {
			updatedState = AuthenticationStateManager.updateSelectedDevice(
				updatedState,
				callbackData.data.selectedDevice
			);
		}

		// Update authentication method if present in callback
		if (callbackData.data?.authenticationMethod) {
			updatedState = AuthenticationStateManager.updateAuthenticationMethod(
				updatedState,
				callbackData.data.authenticationMethod
			);
		}

		// Update step
		updatedState = AuthenticationStateManager.updateStep(updatedState, targetStep);

		console.log(`${MODULE_TAG} Authentication state updated successfully`);
		return updatedState;
	}

	/**
	 * Get navigation action based on step transition
	 */
	private static getNavigationAction(
		targetStep: AuthenticationStep,
		currentStep: AuthenticationStep
	): 'forward' | 'backward' | 'restart' {
		if (targetStep === AuthenticationStep.DEVICE_SELECTION) {
			return 'restart';
		}

		if (targetStep < currentStep) {
			return 'backward';
		}

		if (targetStep > currentStep) {
			return 'forward';
		}

		// Same step - could be a retry or refresh
		return 'forward';
	}

	/**
	 * Handle callback processing errors
	 */
	private static handleCallbackError(
		error: Error,
		flowState: AuthenticationFlowState
	): CallbackRoutingResult {
		console.error(`${MODULE_TAG} Handling callback error:`, error);

		if (error instanceof CallbackValidationError) {
			return {
				success: false,
				flowType: 'authentication',
				error: {
					type: 'validation',
					message: `Invalid callback data: ${error.message}`,
					recoveryAction: 'restart_flow',
					targetStep: AuthenticationStep.DEVICE_SELECTION,
				},
			};
		}

		if (error instanceof NetworkError) {
			// Update callback state for retry
			const retryState = AuthenticationStateManager.updateCallbackState(flowState, {
				isPending: true,
				retryCount: flowState.callbackState.retryCount + 1,
			});

			return {
				success: false,
				flowType: 'authentication',
				flowState: retryState,
				error: {
					type: 'network',
					message: 'Network error during callback processing. Please retry.',
					recoveryAction: 'retry_callback',
				},
			};
		}

		if (error instanceof StateCorruptionError) {
			// Clear corrupted state
			AuthenticationStateManager.clearState();

			return {
				success: false,
				flowType: 'authentication',
				error: {
					type: 'state_corruption',
					message: 'Authentication state corrupted. Please restart the process.',
					recoveryAction: 'restart_flow',
					targetStep: AuthenticationStep.DEVICE_SELECTION,
				},
			};
		}

		// Fallback error handling
		return {
			success: false,
			flowType: 'authentication',
			error: {
				type: 'validation',
				message: 'An unexpected error occurred during callback processing.',
				recoveryAction: 'restart_flow',
				targetStep: AuthenticationStep.DEVICE_SELECTION,
			},
		};
	}

	/**
	 * Check if callback requires retry
	 */
	static shouldRetryCallback(flowState: AuthenticationFlowState): boolean {
		const maxRetries = 2; // Fewer retries for authentication for security
		return flowState.callbackState.retryCount < maxRetries;
	}

	/**
	 * Get retry delay in milliseconds (exponential backoff)
	 */
	static getRetryDelay(retryCount: number): number {
		const baseDelay = 500; // Shorter base delay for authentication
		const maxDelay = 10000; // 10 seconds max
		const delay = baseDelay * 2 ** retryCount;
		return Math.min(delay, maxDelay);
	}

	/**
	 * Prepare callback data for sending
	 */
	static prepareCallbackData(
		flowState: AuthenticationFlowState,
		additionalData?: Record<string, unknown>
	): MFACallbackData {
		return {
			url: `${window.location.origin}/mfa/auth/callback`,
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-Flow-Type': 'authentication',
				'X-Challenge-ID': flowState.challengeData.challengeId || '',
				'X-Device-ID': flowState.selectedDevice.id || '',
			},
			data: {
				flowType: 'authentication',
				challengeId: flowState.challengeData.challengeId,
				deviceId: flowState.selectedDevice.id,
				currentStep: flowState.currentStep,
				challengeData: flowState.challengeData,
				...additionalData,
			},
			state: `auth_${flowState.challengeData.challengeId}_${Date.now()}`,
			timestamp: Date.now(),
		};
	}

	/**
	 * Validate challenge security
	 */
	static validateChallengeSecurity(flowState: AuthenticationFlowState): {
		isValid: boolean;
		issues: string[];
	} {
		const issues: string[] = [];

		// Check if challenge is expired
		if (AuthenticationStateManager.isChallengeExpired(flowState)) {
			issues.push('Challenge has expired');
		}

		// Check remaining attempts
		if (flowState.challengeData.attemptsRemaining <= 0) {
			issues.push('No attempts remaining');
		}

		// Check state age
		const stateAge = AuthenticationStateManager.getStateAge();
		if (stateAge && stateAge > 10 * 60 * 1000) {
			// 10 minutes
			issues.push('Authentication state is too old');
		}

		return {
			isValid: issues.length === 0,
			issues,
		};
	}
}
