/**
 * @file mfaCallbackRouter.ts
 * @module apps/mfa/services/shared
 * @description Smart callback router for MFA flow detection and routing
 * @version 8.0.0
 * @since 2026-02-20
 */

import type {
	AuthenticationFlowState,
	CallbackRoutingResult,
	CallbackValidationError,
	MFACallbackData,
	MFAFlowType,
	NetworkError,
	RegistrationFlowState,
	StateCorruptionError,
} from '@/apps/mfa/types/mfaFlowTypes';

const MODULE_TAG = '[🔄 MFA-CALLBACK-ROUTER]';

/**
 * Smart callback router that detects flow type and routes to appropriate handler
 */
export class MFACallbackRouter {
	private static callbackHandlers: Map<MFAFlowType, Function> = new Map();
	private static readonly CALLBACK_TIMEOUT = 30000; // 30 seconds

	/**
	 * Route incoming callbacks to correct flow handler
	 */
	static async routeCallback(callbackData: MFACallbackData): Promise<CallbackRoutingResult> {
		console.log(`${MODULE_TAG} Routing callback`, {
			url: callbackData.url,
			method: callbackData.method,
			timestamp: callbackData.timestamp,
		});

		try {
			// 1. Validate callback data
			MFACallbackRouter.validateCallbackData(callbackData);

			// 2. Detect flow type from callback patterns
			const flowType = MFACallbackRouter.detectFlowType(callbackData);
			console.log(`${MODULE_TAG} Detected flow type: ${flowType}`);

			// 3. Extract flow state from callback
			const flowState = await MFACallbackRouter.extractFlowState(callbackData, flowType);

			// 4. Route to appropriate handler
			const handler = MFACallbackRouter.callbackHandlers.get(flowType);
			if (!handler) {
				throw new Error(`No handler registered for flow type: ${flowType}`);
			}

			console.log(`${MODULE_TAG} Routing to ${flowType} handler`);
			const result = await handler(callbackData, flowState);

			console.log(`${MODULE_TAG} Callback routing completed`, {
				success: result.success,
				flowType: result.flowType,
				targetStep: result.targetStep,
			});

			return result;
		} catch (error) {
			console.error(`${MODULE_TAG} Callback routing failed:`, error);
			return MFACallbackRouter.handleRoutingError(error);
		}
	}

	/**
	 * Register a callback handler for a specific flow type
	 */
	static registerCallbackHandler(flowType: MFAFlowType, handler: Function): void {
		console.log(`${MODULE_TAG} Registering handler for ${flowType} flow`);
		MFACallbackRouter.callbackHandlers.set(flowType, handler);
	}

	/**
	 * Unregister a callback handler
	 */
	static unregisterCallbackHandler(flowType: MFAFlowType): void {
		console.log(`${MODULE_TAG} Unregistering handler for ${flowType} flow`);
		MFACallbackRouter.callbackHandlers.delete(flowType);
	}

	/**
	 * Detect flow type from callback patterns
	 */
	private static detectFlowType(callback: MFACallbackData): MFAFlowType {
		// Registration patterns
		const registrationPatterns = [
			/\/mfa\/register\//i,
			/device-registration-callback/i,
			/registration/i,
			/register/i,
		];

		// Authentication patterns
		const authenticationPatterns = [
			/\/mfa\/auth\//i,
			/\/mfa\/authenticate\//i,
			/device-auth-callback/i,
			/authentication/i,
			/authenticate/i,
			/auth/i,
		];

		// Check URL patterns
		const url = callback.url.toLowerCase();

		if (registrationPatterns.some((pattern) => pattern.test(url))) {
			return 'registration';
		}

		if (authenticationPatterns.some((pattern) => pattern.test(url))) {
			return 'authentication';
		}

		// Check state parameter
		if (callback.state) {
			const stateLower = callback.state.toLowerCase();
			if (stateLower.includes('registration') || stateLower.includes('register')) {
				return 'registration';
			}
			if (stateLower.includes('authentication') || stateLower.includes('auth')) {
				return 'authentication';
			}
		}

		// Check data payload
		if (callback.data) {
			if (
				callback.data.registrationToken ||
				callback.data.deviceRegistration ||
				callback.data.registrationId
			) {
				return 'registration';
			}

			if (
				callback.data.challengeId ||
				callback.data.deviceAuthentication ||
				callback.data.authChallenge
			) {
				return 'authentication';
			}
		}

		// Fallback: Check persisted state
		return MFACallbackRouter.detectFromPersistedState(callback);
	}

	/**
	 * Detect flow type from persisted state
	 */
	private static detectFromPersistedState(callback: MFACallbackData): MFAFlowType {
		try {
			// Check registration state
			const registrationState = localStorage.getItem('mfa_registration_state');
			if (registrationState) {
				const state = JSON.parse(registrationState);
				if (MFACallbackRouter.isValidState(state, 'registration')) {
					return 'registration';
				}
			}

			// Check authentication state
			const authState = sessionStorage.getItem('mfa_auth_state');
			if (authState) {
				const state = JSON.parse(authState);
				if (MFACallbackRouter.isValidState(state, 'authentication')) {
					return 'authentication';
				}
			}
		} catch (error) {
			console.warn(`${MODULE_TAG} Failed to detect flow from persisted state:`, error);
		}

		// Default fallback - this should be improved based on specific requirements
		throw new CallbackValidationError(
			'Unable to determine flow type from callback. Please restart the process.',
			{ callbackUrl: callback.url }
		);
	}

	/**
	 * Extract flow state from callback
	 */
	private static async extractFlowState(
		_callback: MFACallbackData,
		flowType: MFAFlowType
	): Promise<RegistrationFlowState | AuthenticationFlowState> {
		try {
			if (flowType === 'registration') {
				const stored = localStorage.getItem('mfa_registration_state');
				if (!stored) {
					throw new StateCorruptionError('No registration state found');
				}

				const state = JSON.parse(stored);
				if (!MFACallbackRouter.isValidState(state, 'registration')) {
					throw new StateCorruptionError('Invalid registration state', state);
				}

				return state as RegistrationFlowState;
			}

			if (flowType === 'authentication') {
				const stored = sessionStorage.getItem('mfa_auth_state');
				if (!stored) {
					throw new StateCorruptionError('No authentication state found');
				}

				const state = JSON.parse(stored);
				if (!MFACallbackRouter.isValidState(state, 'authentication')) {
					throw new StateCorruptionError('Invalid authentication state', state);
				}

				return state as AuthenticationFlowState;
			}

			throw new Error(`Unknown flow type: ${flowType}`);
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to extract flow state:`, error);
			throw error;
		}
	}

	/**
	 * Validate callback data integrity
	 */
	private static validateCallbackData(callback: MFACallbackData): void {
		if (!callback.url) {
			throw new CallbackValidationError('Callback URL is required');
		}

		if (!callback.method || !['GET', 'POST'].includes(callback.method)) {
			throw new CallbackValidationError('Invalid callback method');
		}

		if (
			!callback.timestamp ||
			Date.now() - callback.timestamp > MFACallbackRouter.CALLBACK_TIMEOUT
		) {
			throw new CallbackValidationError('Callback timestamp is invalid or expired');
		}

		try {
			new URL(callback.url);
		} catch {
			throw new CallbackValidationError('Invalid callback URL format');
		}
	}

	/**
	 * Validate state structure
	 */
	private static isValidState(state: any, expectedFlowType: MFAFlowType): boolean {
		if (!state || typeof state !== 'object') {
			return false;
		}

		if (state.flowType !== expectedFlowType) {
			return false;
		}

		if (!state.currentStep || typeof state.currentStep !== 'number') {
			return false;
		}

		if (!state.metadata || !state.metadata.startTime || !state.metadata.version) {
			return false;
		}

		// Check timestamp (expire after appropriate time)
		const maxAge = expectedFlowType === 'registration' ? 24 * 60 * 60 * 1000 : 15 * 60 * 1000;
		if (Date.now() - state.metadata.lastActivity > maxAge) {
			return false;
		}

		return true;
	}

	/**
	 * Handle routing errors
	 */
	private static handleRoutingError(error: Error): CallbackRoutingResult {
		if (error instanceof CallbackValidationError) {
			return {
				success: false,
				flowType: 'registration', // Default to registration for validation errors
				error: {
					type: 'validation',
					message: error.message,
					recoveryAction: 'restart_flow',
					details: (error as CallbackValidationError).details,
				},
			};
		}

		if (error instanceof NetworkError) {
			return {
				success: false,
				flowType: 'registration', // Default to registration
				error: {
					type: 'network',
					message: error.message,
					recoveryAction: 'retry_callback',
					details: { statusCode: (error as NetworkError).statusCode },
				},
			};
		}

		if (error instanceof StateCorruptionError) {
			// Clear corrupted states
			localStorage.removeItem('mfa_registration_state');
			sessionStorage.removeItem('mfa_auth_state');

			return {
				success: false,
				flowType: 'registration', // Default to registration
				error: {
					type: 'state_corruption',
					message: 'Session expired or corrupted. Please restart the process.',
					recoveryAction: 'restart_flow',
					details: { corruptedData: (error as StateCorruptionError).corruptedData },
				},
			};
		}

		// Fallback error handling
		return {
			success: false,
			flowType: 'registration',
			error: {
				type: 'routing',
				message: 'An unexpected error occurred. Please restart the process.',
				recoveryAction: 'restart_flow',
				details: { originalError: error.message },
			},
		};
	}

	/**
	 * Get registered handlers for debugging
	 */
	static getRegisteredHandlers(): MFAFlowType[] {
		return Array.from(MFACallbackRouter.callbackHandlers.keys());
	}

	/**
	 * Clear all handlers (useful for testing)
	 */
	static clearHandlers(): void {
		MFACallbackRouter.callbackHandlers.clear();
	}
}
