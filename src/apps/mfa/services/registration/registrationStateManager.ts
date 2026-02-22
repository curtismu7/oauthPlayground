/**
 * @file registrationStateManager.ts
 * @module apps/mfa/services/registration
 * @description Registration flow state management with localStorage persistence
 * @version 8.0.0
 * @since 2026-02-20
 */

import type {
	DeviceConfigKey,
	DeviceRegistrationData,
	RegistrationCallbackState,
	RegistrationFlowState,
	RegistrationValidationState,
} from '@/apps/mfa/types/mfaFlowTypes';
import { RegistrationStep } from '@/apps/mfa/types/mfaFlowTypes';

const MODULE_TAG = '[📝 REGISTRATION-STATE-MANAGER]';
const REGISTRATION_STATE_KEY = 'mfa_registration_state';
const STATE_VERSION = '1.0';
const MAX_STATE_AGE = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Registration flow state manager
 * Handles persistence and retrieval of registration flow state
 */
export class RegistrationStateManager {
	/**
	 * Persist registration state to localStorage
	 */
	static saveState(state: RegistrationFlowState): void {
		console.log(`${MODULE_TAG} Saving registration state`, {
			currentStep: state.currentStep,
			deviceType: state.deviceType,
			username: state.userData.username,
		});

		const stateData = {
			...state,
			metadata: {
				...state.metadata,
				lastActivity: Date.now(),
				version: STATE_VERSION,
			},
		};

		try {
			localStorage.setItem(REGISTRATION_STATE_KEY, JSON.stringify(stateData));
			console.log(`${MODULE_TAG} Registration state saved successfully`);
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to save registration state:`, error);
			throw new Error(
				`Failed to save registration state: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	/**
	 * Load registration state from localStorage
	 */
	static loadState(): RegistrationFlowState | null {
		try {
			const stored = localStorage.getItem(REGISTRATION_STATE_KEY);
			if (!stored) {
				console.log(`${MODULE_TAG} No registration state found`);
				return null;
			}

			const stateData = JSON.parse(stored);
			console.log(`${MODULE_TAG} Loaded registration state`, {
				currentStep: stateData.currentStep,
				deviceType: stateData.deviceType,
				username: stateData.userData?.username,
			});

			// Validate state integrity
			if (!RegistrationStateManager.validateStateIntegrity(stateData)) {
				console.warn(`${MODULE_TAG} Invalid registration state detected, clearing`);
				RegistrationStateManager.clearState();
				return null;
			}

			return stateData as RegistrationFlowState;
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to load registration state:`, error);
			RegistrationStateManager.clearState();
			return null;
		}
	}

	/**
	 * Clear registration state
	 */
	static clearState(): void {
		console.log(`${MODULE_TAG} Clearing registration state`);
		localStorage.removeItem(REGISTRATION_STATE_KEY);
	}

	/**
	 * Create initial registration state
	 */
	static createInitialState(
		deviceType: DeviceConfigKey,
		userData: { userId: string; username: string; environmentId: string },
		subFlowType: 'user_initiated' | 'admin_setup' | 'bulk_import' = 'user_initiated'
	): RegistrationFlowState {
		const now = Date.now();

		return {
			flowType: 'registration',
			subFlowType,
			currentStep: RegistrationStep.DEVICE_TYPE_SELECTION,
			deviceType,
			userData,
			deviceData: {},
			validationState: {
				isValid: false,
				errors: {},
				warnings: {},
				completedSteps: [],
			},
			callbackState: {
				isPending: false,
				retryCount: 0,
			},
			metadata: {
				startTime: now,
				lastActivity: now,
				version: STATE_VERSION,
			},
		};
	}

	/**
	 * Update registration step
	 */
	static updateStep(
		currentState: RegistrationFlowState,
		newStep: RegistrationStep,
		additionalData?: Partial<RegistrationFlowState>
	): RegistrationFlowState {
		const updatedState: RegistrationFlowState = {
			...currentState,
			currentStep: newStep,
			metadata: {
				...currentState.metadata,
				lastActivity: Date.now(),
			},
			...additionalData,
		};

		// Update validation state
		if (!updatedState.validationState.completedSteps.includes(newStep)) {
			updatedState.validationState.completedSteps.push(newStep);
		}

		// Save updated state
		RegistrationStateManager.saveState(updatedState);

		console.log(`${MODULE_TAG} Updated registration step to ${newStep}`);
		return updatedState;
	}

	/**
	 * Update device data
	 */
	static updateDeviceData(
		currentState: RegistrationFlowState,
		deviceData: Partial<DeviceRegistrationData>
	): RegistrationFlowState {
		const updatedState: RegistrationFlowState = {
			...currentState,
			deviceData: {
				...currentState.deviceData,
				...deviceData,
			},
			metadata: {
				...currentState.metadata,
				lastActivity: Date.now(),
			},
		};

		RegistrationStateManager.saveState(updatedState);
		console.log(`${MODULE_TAG} Updated device data`);
		return updatedState;
	}

	/**
	 * Update validation state
	 */
	static updateValidationState(
		currentState: RegistrationFlowState,
		validationState: Partial<RegistrationValidationState>
	): RegistrationFlowState {
		const updatedState: RegistrationFlowState = {
			...currentState,
			validationState: {
				...currentState.validationState,
				...validationState,
			},
			metadata: {
				...currentState.metadata,
				lastActivity: Date.now(),
			},
		};

		RegistrationStateManager.saveState(updatedState);
		console.log(`${MODULE_TAG} Updated validation state`, {
			isValid: updatedState.validationState.isValid,
			errorCount: Object.keys(updatedState.validationState.errors).length,
		});
		return updatedState;
	}

	/**
	 * Update callback state
	 */
	static updateCallbackState(
		currentState: RegistrationFlowState,
		callbackState: Partial<RegistrationCallbackState>
	): RegistrationFlowState {
		const updatedState: RegistrationFlowState = {
			...currentState,
			callbackState: {
				...currentState.callbackState,
				...callbackState,
			},
			metadata: {
				...currentState.metadata,
				lastActivity: Date.now(),
			},
		};

		RegistrationStateManager.saveState(updatedState);
		console.log(`${MODULE_TAG} Updated callback state`, {
			isPending: updatedState.callbackState.isPending,
			retryCount: updatedState.callbackState.retryCount,
		});
		return updatedState;
	}

	/**
	 * Validate state integrity and freshness
	 */
	private static validateStateIntegrity(state: unknown): boolean {
		if (!state || typeof state !== 'object') {
			return false;
		}

		const stateObj = state as Record<string, unknown>;

		// Check required fields
		if (stateObj.flowType !== 'registration') {
			return false;
		}

		if (typeof stateObj.currentStep !== 'number' || stateObj.currentStep < 0) {
			return false;
		}

		if (!stateObj.userData || typeof stateObj.userData !== 'object') {
			return false;
		}

		const userData = stateObj.userData as Record<string, unknown>;
		if (!userData.userId || !userData.username || !userData.environmentId) {
			return false;
		}

		if (!stateObj.metadata || typeof stateObj.metadata !== 'object') {
			return false;
		}

		const metadata = stateObj.metadata as Record<string, unknown>;
		if (!metadata.startTime || !metadata.version) {
			return false;
		}

		// Check timestamp (expire after max age)
		if (typeof metadata.lastActivity === 'number') {
			if (Date.now() - metadata.lastActivity > MAX_STATE_AGE) {
				return false;
			}
		}

		// Check version compatibility
		if (metadata.version !== STATE_VERSION) {
			console.warn(
				`${MODULE_TAG} State version mismatch: expected ${STATE_VERSION}, got ${metadata.version}`
			);
			return false;
		}

		return true;
	}

	/**
	 * Get state age in milliseconds
	 */
	static getStateAge(): number | null {
		const state = RegistrationStateManager.loadState();
		if (!state) {
			return null;
		}

		return Date.now() - state.metadata.lastActivity;
	}

	/**
	 * Check if state is expired
	 */
	static isStateExpired(): boolean {
		const age = RegistrationStateManager.getStateAge();
		return age ? age > MAX_STATE_AGE : true;
	}

	/**
	 * Get registration progress percentage
	 */
	static getProgressPercentage(state: RegistrationFlowState): number {
		const totalSteps = Object.keys(RegistrationStep).length / 2; // Enum has numeric keys
		const completedSteps = state.validationState.completedSteps.length;
		return Math.round((completedSteps / totalSteps) * 100);
	}

	/**
	 * Export state for debugging
	 */
	static exportState(): string | null {
		const state = RegistrationStateManager.loadState();
		if (!state) {
			return null;
		}

		return JSON.stringify(state, null, 2);
	}

	/**
	 * Import state (for testing/debugging)
	 */
	static importState(stateJson: string): boolean {
		try {
			const state = JSON.parse(stateJson);
			if (RegistrationStateManager.validateStateIntegrity(state)) {
				RegistrationStateManager.saveState(state as RegistrationFlowState);
				return true;
			}
			return false;
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to import state:`, error);
			return false;
		}
	}
}
