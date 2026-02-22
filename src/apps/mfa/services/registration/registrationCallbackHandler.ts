/**
 * @file registrationCallbackHandler.ts
 * @module apps/mfa/services/registration
 * @description Registration flow callback handler
 * @version 8.0.0
 * @since 2026-02-20
 */

import type {
	CallbackRoutingResult,
	MFACallbackData,
	RegistrationFlowState,
} from '@/apps/mfa/types/mfaFlowTypes';
import { CallbackValidationError, RegistrationStep } from '@/apps/mfa/types/mfaFlowTypes';
import { RegistrationStateManager } from './registrationStateManager';

const MODULE_TAG = '[📝 REGISTRATION-CALLBACK-HANDLER]';

/**
 * Registration flow callback handler
 * Processes callbacks specifically for device registration flows
 */
export class RegistrationCallbackHandler {
	/**
	 * Process registration callback
	 */
	static async process(
		callbackData: MFACallbackData,
		flowState: RegistrationFlowState
	): Promise<CallbackRoutingResult> {
		console.log(`${MODULE_TAG} Processing registration callback`, {
			url: callbackData.url,
			currentStep: flowState.currentStep,
			deviceType: flowState.deviceType,
		});

		try {
			// 1. Validate callback integrity
			RegistrationCallbackHandler.validateCallback(callbackData, flowState);

			// 2. Determine target step from callback
			const targetStep = RegistrationCallbackHandler.determineTargetStep(callbackData, flowState);

			// 3. Update registration state
			const updatedState = await RegistrationCallbackHandler.updateRegistrationState(
				flowState,
				callbackData,
				targetStep
			);

			// 4. Route to correct step
			const result: CallbackRoutingResult = {
				success: true,
				flowType: 'registration',
				targetStep,
				flowState: updatedState,
				navigationAction: RegistrationCallbackHandler.getNavigationAction(
					targetStep,
					flowState.currentStep
				),
			};

			console.log(`${MODULE_TAG} Registration callback processed successfully`, {
				targetStep,
				navigationAction: result.navigationAction,
			});

			return result;
		} catch (error) {
			console.error(`${MODULE_TAG} Registration callback processing failed:`, error);
			return RegistrationCallbackHandler.handleCallbackError(error, flowState);
		}
	}

	/**
	 * Validate callback data against flow state
	 */
	private static validateCallback(callback: MFACallbackData, state: RegistrationFlowState): void {
		// Check if callback is for registration
		if (
			!callback.url.toLowerCase().includes('register') &&
			!callback.url.toLowerCase().includes('registration')
		) {
			throw new CallbackValidationError('Callback URL does not match registration flow', {
				url: callback.url,
				expectedFlow: 'registration',
			});
		}

		// Check device type consistency
		if (callback.data?.deviceType && callback.data.deviceType !== state.deviceType) {
			throw new CallbackValidationError('Device type mismatch in callback', {
				callbackDeviceType: callback.data.deviceType,
				stateDeviceType: state.deviceType,
			});
		}

		// Check user consistency
		if (callback.data?.userId && callback.data.userId !== state.userData.userId) {
			throw new CallbackValidationError('User ID mismatch in callback', {
				callbackUserId: callback.data.userId,
				stateUserId: state.userData.userId,
			});
		}

		// Check callback timestamp (should be recent)
		const callbackAge = Date.now() - callback.timestamp;
		const maxAge = 5 * 60 * 1000; // 5 minutes
		if (callbackAge > maxAge) {
			throw new CallbackValidationError('Callback timestamp is too old', { callbackAge, maxAge });
		}

		console.log(`${MODULE_TAG} Callback validation passed`);
	}

	/**
	 * Determine target step from callback data
	 */
	private static determineTargetStep(
		callback: MFACallbackData,
		state: RegistrationFlowState
	): RegistrationStep {
		console.log(`${MODULE_TAG} Determining target step from callback`, {
			callbackData: callback.data,
			currentStep: state.currentStep,
		});

		// Check for completion signals
		if (
			callback.data?.registrationComplete ||
			callback.data?.status === 'COMPLETE' ||
			callback.data?.success === true
		) {
			return RegistrationStep.REGISTRATION_COMPLETE;
		}

		// Check for device validation requirements
		if (
			callback.data?.deviceValidationRequired ||
			callback.data?.validationRequired ||
			callback.data?.needsValidation
		) {
			return RegistrationStep.DEVICE_VALIDATION;
		}

		// Check for device configuration requirements
		if (
			callback.data?.deviceConfigurationRequired ||
			callback.data?.configurationRequired ||
			callback.data?.needsConfiguration
		) {
			return RegistrationStep.DEVICE_CONFIGURATION;
		}

		// Check for user verification requirements
		if (
			callback.data?.userVerificationRequired ||
			callback.data?.verificationRequired ||
			callback.data?.needsVerification
		) {
			return RegistrationStep.USER_VERIFICATION;
		}

		// Check for error conditions that require retry
		if (callback.data?.error || callback.data?.errorCode) {
			console.warn(`${MODULE_TAG} Callback contains error, staying at current step`);
			return state.currentStep;
		}

		// Default: advance to next logical step
		return RegistrationCallbackHandler.getNextLogicalStep(state.currentStep);
	}

	/**
	 * Get next logical step in registration flow
	 */
	private static getNextLogicalStep(currentStep: RegistrationStep): RegistrationStep {
		switch (currentStep) {
			case RegistrationStep.DEVICE_TYPE_SELECTION:
				return RegistrationStep.USER_VERIFICATION;
			case RegistrationStep.USER_VERIFICATION:
				return RegistrationStep.DEVICE_CONFIGURATION;
			case RegistrationStep.DEVICE_CONFIGURATION:
				return RegistrationStep.DEVICE_VALIDATION;
			case RegistrationStep.DEVICE_VALIDATION:
				return RegistrationStep.REGISTRATION_COMPLETE;
			case RegistrationStep.REGISTRATION_COMPLETE:
				return RegistrationStep.REGISTRATION_COMPLETE; // Stay at complete
			default:
				return RegistrationStep.DEVICE_TYPE_SELECTION;
		}
	}

	/**
	 * Update registration state with callback data
	 */
	private static async updateRegistrationState(
		currentState: RegistrationFlowState,
		callbackData: MFACallbackData,
		targetStep: RegistrationStep
	): Promise<RegistrationFlowState> {
		console.log(`${MODULE_TAG} Updating registration state`, {
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

		let updatedState = RegistrationStateManager.updateCallbackState(
			currentState,
			updatedCallbackState
		);

		// Update device data if present in callback
		if (callbackData.data?.deviceData) {
			updatedState = RegistrationStateManager.updateDeviceData(
				updatedState,
				callbackData.data.deviceData
			);
		}

		// Update validation state if present in callback
		if (callbackData.data?.validationResult) {
			const validationResult = callbackData.data.validationResult;
			updatedState = RegistrationStateManager.updateValidationState(updatedState, {
				isValid: validationResult.isValid || false,
				errors: validationResult.errors || {},
				warnings: validationResult.warnings || {},
				completedSteps: [...updatedState.validationState.completedSteps, targetStep],
			});
		}

		// Update step
		updatedState = RegistrationStateManager.updateStep(updatedState, targetStep);

		console.log(`${MODULE_TAG} Registration state updated successfully`);
		return updatedState;
	}

	/**
	 * Get navigation action based on step transition
	 */
	private static getNavigationAction(
		targetStep: RegistrationStep,
		currentStep: RegistrationStep
	): 'forward' | 'backward' | 'restart' {
		if (targetStep === RegistrationStep.DEVICE_TYPE_SELECTION) {
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
		flowState: RegistrationFlowState
	): CallbackRoutingResult {
		console.error(`${MODULE_TAG} Handling callback error:`, error);

		if (error instanceof CallbackValidationError) {
			return {
				success: false,
				flowType: 'registration',
				error: {
					type: 'validation',
					message: `Invalid callback data: ${error.message}`,
					recoveryAction: 'restart_flow',
					targetStep: RegistrationStep.DEVICE_TYPE_SELECTION,
				},
			};
		}

		if (error instanceof NetworkError) {
			// Update callback state for retry
			const retryState = RegistrationStateManager.updateCallbackState(flowState, {
				isPending: true,
				retryCount: flowState.callbackState.retryCount + 1,
			});

			return {
				success: false,
				flowType: 'registration',
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
			RegistrationStateManager.clearState();

			return {
				success: false,
				flowType: 'registration',
				error: {
					type: 'state_corruption',
					message: 'Registration state corrupted. Please restart the process.',
					recoveryAction: 'restart_flow',
					targetStep: RegistrationStep.DEVICE_TYPE_SELECTION,
				},
			};
		}

		// Fallback error handling
		return {
			success: false,
			flowType: 'registration',
			error: {
				type: 'validation',
				message: 'An unexpected error occurred during callback processing.',
				recoveryAction: 'restart_flow',
				targetStep: RegistrationStep.DEVICE_TYPE_SELECTION,
			},
		};
	}

	/**
	 * Check if callback requires retry
	 */
	static shouldRetryCallback(flowState: RegistrationFlowState): boolean {
		const maxRetries = 3;
		return flowState.callbackState.retryCount < maxRetries;
	}

	/**
	 * Get retry delay in milliseconds (exponential backoff)
	 */
	static getRetryDelay(retryCount: number): number {
		const baseDelay = 1000; // 1 second
		const maxDelay = 30000; // 30 seconds
		const delay = baseDelay * 2 ** retryCount;
		return Math.min(delay, maxDelay);
	}

	/**
	 * Prepare callback data for sending
	 */
	static prepareCallbackData(
		flowState: RegistrationFlowState,
		additionalData?: Record<string, unknown>
	): MFACallbackData {
		return {
			url: `${window.location.origin}/mfa/register/callback`,
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-Flow-Type': 'registration',
				'X-Device-Type': flowState.deviceType,
				'X-User-ID': flowState.userData.userId,
			},
			data: {
				flowType: 'registration',
				deviceType: flowState.deviceType,
				userId: flowState.userData.userId,
				environmentId: flowState.userData.environmentId,
				currentStep: flowState.currentStep,
				deviceData: flowState.deviceData,
				...additionalData,
			},
			state: `registration_${flowState.userData.userId}_${Date.now()}`,
			timestamp: Date.now(),
		};
	}
}
