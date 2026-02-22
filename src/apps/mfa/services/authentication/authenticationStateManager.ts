/**
 * @file authenticationStateManager.ts
 * @module apps/mfa/services/authentication
 * @description Authentication flow state management with sessionStorage persistence
 * @version 8.0.0
 * @since 2026-02-20
 */

import type {
	AuthenticationCallbackState,
	AuthenticationChallenge,
	AuthenticationFlowState,
	AuthenticationMethod,
	MFADevice,
} from '@/apps/mfa/types/mfaFlowTypes';
import { AuthenticationStep } from '@/apps/mfa/types/mfaFlowTypes';

const MODULE_TAG = '[🔐 AUTH-STATE-MANAGER]';
const AUTH_STATE_KEY = 'mfa_auth_state';
const STATE_VERSION = '1.0';
const MAX_STATE_AGE = 15 * 60 * 1000; // 15 minutes for security

/**
 * Authentication flow state manager
 * Handles persistence and retrieval of authentication flow state
 */
export class AuthenticationStateManager {
	/**
	 * Persist authentication state to sessionStorage
	 */
	static saveState(state: AuthenticationFlowState): void {
		console.log(`${MODULE_TAG} Saving authentication state`, {
			currentStep: state.currentStep,
			deviceType: state.selectedDevice?.type,
			challengeType: state.challengeData?.challengeType,
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
			sessionStorage.setItem(AUTH_STATE_KEY, JSON.stringify(stateData));
			console.log(`${MODULE_TAG} Authentication state saved successfully`);
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to save authentication state:`, error);
			throw new Error(
				`Failed to save authentication state: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	/**
	 * Load authentication state from sessionStorage
	 */
	static loadState(): AuthenticationFlowState | null {
		try {
			const stored = sessionStorage.getItem(AUTH_STATE_KEY);
			if (!stored) {
				console.log(`${MODULE_TAG} No authentication state found`);
				return null;
			}

			const stateData = JSON.parse(stored);
			console.log(`${MODULE_TAG} Loaded authentication state`, {
				currentStep: stateData.currentStep,
				deviceType: stateData.selectedDevice?.type,
				challengeType: stateData.challengeData?.challengeType,
			});

			// Validate state integrity
			if (!AuthenticationStateManager.validateStateIntegrity(stateData)) {
				console.warn(`${MODULE_TAG} Invalid authentication state detected, clearing`);
				AuthenticationStateManager.clearState();
				return null;
			}

			return stateData as AuthenticationFlowState;
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to load authentication state:`, error);
			AuthenticationStateManager.clearState();
			return null;
		}
	}

	/**
	 * Clear authentication state
	 */
	static clearState(): void {
		console.log(`${MODULE_TAG} Clearing authentication state`);
		sessionStorage.removeItem(AUTH_STATE_KEY);
	}

	/**
	 * Create initial authentication state
	 */
	static createInitialState(
		subFlowType: 'login' | 'step_up' | 'admin_impersonation' = 'login',
		_userData: { userId: string; username: string; environmentId: string }
	): AuthenticationFlowState {
		const now = Date.now();

		return {
			flowType: 'authentication',
			subFlowType,
			currentStep: AuthenticationStep.DEVICE_SELECTION,
			challengeData: {} as AuthenticationChallenge,
			selectedDevice: {} as MFADevice,
			authenticationMethod: {} as AuthenticationMethod,
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
	 * Update authentication step
	 */
	static updateStep(
		currentState: AuthenticationFlowState,
		newStep: AuthenticationStep,
		additionalData?: Partial<AuthenticationFlowState>
	): AuthenticationFlowState {
		const updatedState: AuthenticationFlowState = {
			...currentState,
			currentStep: newStep,
			metadata: {
				...currentState.metadata,
				lastActivity: Date.now(),
			},
			...additionalData,
		};

		// Save updated state
		AuthenticationStateManager.saveState(updatedState);

		console.log(`${MODULE_TAG} Updated authentication step to ${newStep}`);
		return updatedState;
	}

	/**
	 * Update challenge data
	 */
	static updateChallengeData(
		currentState: AuthenticationFlowState,
		challengeData: Partial<AuthenticationChallenge>
	): AuthenticationFlowState {
		const updatedState: AuthenticationFlowState = {
			...currentState,
			challengeData: {
				...currentState.challengeData,
				...challengeData,
			},
			metadata: {
				...currentState.metadata,
				lastActivity: Date.now(),
			},
		};

		AuthenticationStateManager.saveState(updatedState);
		console.log(`${MODULE_TAG} Updated challenge data`, {
			challengeId: updatedState.challengeData.challengeId,
			challengeType: updatedState.challengeData.challengeType,
		});
		return updatedState;
	}

	/**
	 * Update selected device
	 */
	static updateSelectedDevice(
		currentState: AuthenticationFlowState,
		selectedDevice: MFADevice
	): AuthenticationFlowState {
		const updatedState: AuthenticationFlowState = {
			...currentState,
			selectedDevice,
			metadata: {
				...currentState.metadata,
				lastActivity: Date.now(),
			},
		};

		AuthenticationStateManager.saveState(updatedState);
		console.log(`${MODULE_TAG} Updated selected device`, {
			deviceId: selectedDevice.id,
			deviceType: selectedDevice.type,
		});
		return updatedState;
	}

	/**
	 * Update authentication method
	 */
	static updateAuthenticationMethod(
		currentState: AuthenticationFlowState,
		authenticationMethod: AuthenticationMethod
	): AuthenticationFlowState {
		const updatedState: AuthenticationFlowState = {
			...currentState,
			authenticationMethod,
			metadata: {
				...currentState.metadata,
				lastActivity: Date.now(),
			},
		};

		AuthenticationStateManager.saveState(updatedState);
		console.log(`${MODULE_TAG} Updated authentication method`, {
			methodType: authenticationMethod.type,
			deviceType: authenticationMethod.device?.type,
		});
		return updatedState;
	}

	/**
	 * Update callback state
	 */
	static updateCallbackState(
		currentState: AuthenticationFlowState,
		callbackState: Partial<AuthenticationCallbackState>
	): AuthenticationFlowState {
		const updatedState: AuthenticationFlowState = {
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

		AuthenticationStateManager.saveState(updatedState);
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
		if (stateObj.flowType !== 'authentication') {
			return false;
		}

		if (typeof stateObj.currentStep !== 'number' || stateObj.currentStep < 0) {
			return false;
		}

		if (!stateObj.challengeData || typeof stateObj.challengeData !== 'object') {
			return false;
		}

		if (!stateObj.selectedDevice || typeof stateObj.selectedDevice !== 'object') {
			return false;
		}

		if (!stateObj.metadata || typeof stateObj.metadata !== 'object') {
			return false;
		}

		const metadata = stateObj.metadata as Record<string, unknown>;
		if (!metadata.startTime || !metadata.version) {
			return false;
		}

		// Check timestamp (expire after max age for security)
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
		const state = AuthenticationStateManager.loadState();
		if (!state) {
			return null;
		}

		return Date.now() - state.metadata.lastActivity;
	}

	/**
	 * Check if state is expired
	 */
	static isStateExpired(): boolean {
		const age = AuthenticationStateManager.getStateAge();
		return age ? age > MAX_STATE_AGE : true;
	}

	/**
	 * Get authentication progress percentage
	 */
	static getProgressPercentage(state: AuthenticationFlowState): number {
		const totalSteps = Object.keys(AuthenticationStep).length / 2; // Enum has numeric keys
		const currentStep = state.currentStep + 1; // Steps are 0-indexed
		return Math.round((currentStep / totalSteps) * 100);
	}

	/**
	 * Check if challenge is expired
	 */
	static isChallengeExpired(state: AuthenticationFlowState): boolean {
		if (!state.challengeData.expiresAt) {
			return false; // No expiration set
		}

		return Date.now() > state.challengeData.expiresAt;
	}

	/**
	 * Get remaining challenge time in seconds
	 */
	static getChallengeTimeRemaining(state: AuthenticationFlowState): number {
		if (!state.challengeData.expiresAt) {
			return -1; // No expiration set
		}

		const remaining = state.challengeData.expiresAt - Date.now();
		return Math.max(0, Math.floor(remaining / 1000)); // Return seconds, minimum 0
	}

	/**
	 * Export state for debugging
	 */
	static exportState(): string | null {
		const state = AuthenticationStateManager.loadState();
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
			if (AuthenticationStateManager.validateStateIntegrity(state)) {
				AuthenticationStateManager.saveState(state as AuthenticationFlowState);
				return true;
			}
			return false;
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to import state:`, error);
			return false;
		}
	}

	/**
	 * Get security metrics for monitoring
	 */
	static getSecurityMetrics(state: AuthenticationFlowState): {
		stateAge: number;
		challengeAge: number;
		attemptsRemaining: number;
		isExpired: boolean;
		riskLevel: 'low' | 'medium' | 'high';
	} {
		const now = Date.now();
		const stateAge = now - state.metadata.lastActivity;
		const challengeAge = state.challengeData.challengeId
			? now - (state.metadata.startTime || now)
			: 0;
		const isExpired = AuthenticationStateManager.isChallengeExpired(state);
		const attemptsRemaining = state.challengeData.attemptsRemaining || 0;

		// Calculate risk level
		let riskLevel: 'low' | 'medium' | 'high' = 'low';

		if (stateAge > MAX_STATE_AGE * 0.8 || attemptsRemaining <= 1) {
			riskLevel = 'high';
		} else if (stateAge > MAX_STATE_AGE * 0.5 || attemptsRemaining <= 2) {
			riskLevel = 'medium';
		}

		return {
			stateAge,
			challengeAge,
			attemptsRemaining,
			isExpired,
			riskLevel,
		};
	}
}
