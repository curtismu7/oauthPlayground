/**
 * @file MFAFlowController.ts
 * @module v8/flows/controllers
 * @description Base controller for MFA flow operations
 * @version 8.2.0
 */

import { MFAServiceV8, type RegisterDeviceParams } from '@/v8/services/mfaServiceV8';
import { WorkerTokenStatusServiceV8 } from '@/v8/services/workerTokenStatusServiceV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';
import type { DeviceType, MFACredentials, MFAState } from '../shared/MFATypes';
import type { useStepNavigationV8 } from '@/v8/hooks/useStepNavigationV8';

const MODULE_TAG = '[🎮 MFA-CONTROLLER]';

export interface OTPState {
	otpSent: boolean;
	sendError: string | null;
	sendRetryCount: number;
}

export interface ValidationState {
	validationAttempts: number;
	lastValidationError: string | null;
}

export interface DeviceSelectionState {
	existingDevices: Array<Record<string, unknown>>;
	loadingDevices: boolean;
	selectedExistingDevice: string;
	showRegisterForm: boolean;
}

export interface FlowControllerCallbacks {
	onDeviceRegistered?: (deviceId: string, status: string) => void;
	onOTPSent?: () => void;
	onOTPValidated?: () => void;
	onError?: (error: string) => void;
}

/**
 * Base controller for MFA flow operations
 * Handles common operations like device loading, OTP sending, and validation
 */
export abstract class MFAFlowController {
	protected deviceType: DeviceType;
	protected callbacks: FlowControllerCallbacks;

	constructor(deviceType: DeviceType, callbacks: FlowControllerCallbacks = {}) {
		this.deviceType = deviceType;
		this.callbacks = callbacks;
	}

	/**
	 * Load existing devices for the user
	 */
	async loadExistingDevices(
		credentials: MFACredentials,
		tokenStatus: ReturnType<typeof WorkerTokenStatusServiceV8.checkWorkerTokenStatus>
	): Promise<Array<Record<string, unknown>>> {
		if (!credentials.environmentId || !credentials.username || !tokenStatus.isValid) {
			return [];
		}

		try {
			console.log(`${MODULE_TAG} Loading existing ${this.deviceType} devices`);
			const devices = await MFAServiceV8.getAllDevices({
				environmentId: credentials.environmentId,
				username: credentials.username,
				deviceType: this.deviceType,
				countryCode: credentials.countryCode,
				phoneNumber: credentials.phoneNumber,
				email: credentials.email,
				deviceName: credentials.deviceName,
			});

			const filteredDevices = this.filterDevicesByType(devices);
			console.log(`${MODULE_TAG} Loaded ${filteredDevices.length} ${this.deviceType} devices`);
			return filteredDevices;
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to load devices`, error);
			return [];
		}
	}

	/**
	 * Filter devices by type (implemented by subclasses)
	 */
	protected abstract filterDevicesByType(devices: Array<Record<string, unknown>>): Array<Record<string, unknown>>;

	/**
	 * Register a new device
	 */
	async registerDevice(
		credentials: MFACredentials,
		deviceParams: Partial<RegisterDeviceParams>
	): Promise<{ deviceId: string; status: string }> {
		const params: RegisterDeviceParams = {
			environmentId: credentials.environmentId,
			username: credentials.username,
			type: this.deviceType,
			...deviceParams,
		} as RegisterDeviceParams;

		const result = await MFAServiceV8.registerDevice(params);
		
		if (this.callbacks.onDeviceRegistered) {
			this.callbacks.onDeviceRegistered(result.deviceId, result.status);
		}

		return {
			deviceId: result.deviceId,
			status: result.status,
		};
	}

	/**
	 * Send OTP to registered device
	 */
	async sendOTP(
		credentials: MFACredentials,
		deviceId: string,
		state: OTPState,
		setState: (state: Partial<OTPState> | ((prev: OTPState) => Partial<OTPState>)) => void,
		nav: ReturnType<typeof useStepNavigationV8>,
		setIsLoading: (loading: boolean) => void
	): Promise<void> {
		console.log(`${MODULE_TAG} Sending OTP to ${this.deviceType} device`);
		setIsLoading(true);
		setState({ sendError: null });

		try {
			const workerToken = await MFAServiceV8.getWorkerToken();
			const cleanToken = workerToken.trim().replace(/^Bearer\s+/i, '');
			
			const { deviceAuthId } = await MFAServiceV8.sendOTP({
				environmentId: credentials.environmentId,
				username: credentials.username,
				deviceId,
			});

			console.log(`${MODULE_TAG} OTP sent successfully`);
			setState({ 
				otpSent: true, 
				sendRetryCount: 0,
				deviceAuthId // Store deviceAuthId for validation
			});
			nav.markStepComplete();
			toastV8.success('OTP sent successfully!');

			if (this.callbacks.onOTPSent) {
				this.callbacks.onOTPSent();
			}
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to send OTP`, error);
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			setState({
				sendError: errorMessage,
				sendRetryCount: state.sendRetryCount + 1,
			});

			this.handleOTPSendError(errorMessage, nav);

			if (this.callbacks.onError) {
				this.callbacks.onError(errorMessage);
			}
		} finally {
			setIsLoading(false);
		}
	}

	/**
	 * Validate OTP code
	 */
	async validateOTP(
		credentials: MFACredentials,
		deviceId: string,
		otpCode: string,
		mfaState: MFAState,
		setMfaState: (state: Partial<MFAState> | ((prev: MFAState) => MFAState)) => void,
		validationState: ValidationState,
		setValidationState: (state: Partial<ValidationState> | ((prev: ValidationState) => Partial<ValidationState>)) => void,
		nav: ReturnType<typeof useStepNavigationV8>,
		setIsLoading: (loading: boolean) => void
	): Promise<boolean> {
		console.log(`${MODULE_TAG} Validating OTP`);
		setIsLoading(true);
		setValidationState({ lastValidationError: null });

		try {
			const workerToken = await MFAServiceV8.getWorkerToken();
			const cleanToken = workerToken.trim().replace(/^Bearer\s+/i, '');

			const result = await MFAServiceV8.validateOTP({
				environmentId: credentials.environmentId,
				deviceAuthId: mfaState.deviceAuthId || '',
				otp: otpCode,
				workerToken: cleanToken
			});

			setMfaState({
				verificationResult: {
					status: result.valid ? 'SUCCESS' : 'FAILED',
					message: result.message || (result.valid ? 'OTP validated successfully' : 'Invalid OTP code')
				},
			});

			if (result.valid) {
				setValidationState({ validationAttempts: 0, lastValidationError: null });
				nav.markStepComplete();
				toastV8.success('OTP validated successfully!');

				if (this.callbacks.onOTPValidated) {
					this.callbacks.onOTPValidated();
				}
				return true;
			} else {
				setValidationState({
					validationAttempts: validationState.validationAttempts + 1,
					lastValidationError: 'Invalid OTP code',
				});
				nav.setValidationErrors(['Invalid OTP code. Please try again.']);
				toastV8.error('Invalid OTP code');
				return false;
			}
		} catch (error) {
			console.error(`${MODULE_TAG} OTP validation failed`, error);
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			setValidationState({
				validationAttempts: validationState.validationAttempts + 1,
				lastValidationError: errorMessage,
			});

			this.handleOTPValidationError(errorMessage, nav);

			if (this.callbacks.onError) {
				this.callbacks.onError(errorMessage);
			}
			return false;
		} finally {
			setIsLoading(false);
		}
	}

	/**
	 * Handle OTP send errors with specific error messages
	 */
	protected handleOTPSendError(errorMessage: string, nav: ReturnType<typeof useStepNavigationV8>): void {
		if (
			errorMessage.toLowerCase().includes('worker token') ||
			errorMessage.toLowerCase().includes('missing') ||
			errorMessage.toLowerCase().includes('invalid')
		) {
			nav.setValidationErrors([
				'Worker token is missing or invalid. Please click "Manage Token" button to generate a new worker token.',
			]);
		} else if (errorMessage.toLowerCase().includes('rate limit') || errorMessage.toLowerCase().includes('too many')) {
			nav.setValidationErrors(['Rate limit exceeded. Please wait a few minutes before trying again.']);
		} else {
			nav.setValidationErrors([`Failed to send OTP: ${errorMessage}`]);
		}
		toastV8.error(`Failed to send OTP: ${errorMessage}`);
	}

	/**
	 * Handle OTP validation errors with specific error messages
	 */
	protected handleOTPValidationError(errorMessage: string, nav: ReturnType<typeof useStepNavigationV8>): void {
		if (errorMessage.toLowerCase().includes('expired')) {
			nav.setValidationErrors(['OTP code has expired. Please go back and request a new code.']);
		} else if (errorMessage.toLowerCase().includes('too many') || errorMessage.toLowerCase().includes('attempts')) {
			nav.setValidationErrors(['Too many failed attempts. Please wait a few minutes or request a new code.']);
		} else {
			nav.setValidationErrors([`OTP validation failed: ${errorMessage}`]);
		}
		toastV8.error(`Validation failed: ${errorMessage}`);
	}

	/**
	 * Initialize device authentication (for existing devices)
	 * Uses PingOne MFA API: POST /mfa/v1/environments/{environmentId}/users/{userId}/deviceAuthentications
	 * API Reference: https://apidocs.pingidentity.com/pingone/mfa/v1/api/#post-initialize-device-authentication
	 * When deviceId is provided, the request immediately targets that device for OTP delivery.
	 */
	async initializeDeviceAuthentication(
		credentials: MFACredentials,
		deviceId?: string
	): Promise<{
		authenticationId: string;
		status: string;
		nextStep?: string;
		devices?: Array<{ id: string; type: string; nickname?: string }>;
		challengeId?: string;
		[key: string]: unknown;
	}> {
		if (!credentials.deviceAuthenticationPolicyId) {
			const errorMessage =
				'Device Authentication Policy ID is required. Configure it via PingOne (Settings ▶ Device Authentication Policies).';
			console.error(`${MODULE_TAG} Missing deviceAuthenticationPolicyId`, {
				deviceType: this.deviceType,
				username: credentials.username,
			});
			throw new Error(errorMessage);
		}

		console.log(`${MODULE_TAG} Initializing device authentication for ${this.deviceType} via PingOne MFA API`, {
			policyId: credentials.deviceAuthenticationPolicyId,
		});
		
		// Use PingOne MFA API so the backend follows the official Initialize Device Authentication flow
		// DeviceId in the request body immediately targets this device for OTP
		const result = await MFAServiceV8.initializeDeviceAuthentication({
			...credentials,
			deviceId, // Pass deviceId to immediately trigger authentication for this device
		});

		if (result.status === 'DEVICE_SELECTION_REQUIRED' && deviceId && result.id) {
			console.warn(
				`${MODULE_TAG} initializeDeviceAuthentication returned DEVICE_SELECTION_REQUIRED even though a deviceId was provided. Returning initial response; backend should already be triggering authentication.`
			);
		}

		// DeviceId was passed, authentication should be triggered directly
		return {
			authenticationId: result.id,
			status: result.status,
			nextStep: result.nextStep,
			devices: result.devices,
			challengeId: result.challengeId,
			...result,
		};
	}

	/**
	 * Cancel device authentication
	 * POST /mfa/v1/environments/{environmentId}/users/{userId}/deviceAuthentications/{authenticationId}/cancel
	 * API Reference: https://apidocs.pingidentity.com/pingone/mfa/v1/api/#post-cancel-device-authentication
	 */
	async cancelDeviceAuthentication(
		credentials: MFACredentials,
		authenticationId: string
	): Promise<{ status: string; [key: string]: unknown }> {
		return await MFAServiceV8.cancelDeviceAuthentication({
			...credentials,
			authenticationId,
		});
	}

	/**
	 * Select device for authentication (when multiple devices available)
	 */
	async selectDeviceForAuthentication(
		credentials: MFACredentials,
		authenticationId: string,
		deviceId: string
	): Promise<{ status: string; nextStep?: string; [key: string]: unknown }> {
		console.log(`${MODULE_TAG} Selecting device for authentication`);
		return await MFAServiceV8.selectDeviceForAuthentication({
			...credentials,
			authenticationId,
			deviceId,
		});
	}

	/**
	 * Validate OTP for device authentication (for existing devices)
	 */
	async validateOTPForDevice(
		credentials: MFACredentials,
		authenticationId: string,
		otpCode: string,
		mfaState: MFAState,
		setMfaState: (state: Partial<MFAState> | ((prev: MFAState) => MFAState)) => void,
		validationState: ValidationState,
		setValidationState: (state: Partial<ValidationState> | ((prev: ValidationState) => Partial<ValidationState>)) => void,
		nav: ReturnType<typeof useStepNavigationV8>,
		setIsLoading: (loading: boolean) => void
	): Promise<boolean> {
		console.log(`${MODULE_TAG} Validating OTP for device authentication`);
		setIsLoading(true);
		setValidationState({ lastValidationError: null });

		try {
			const result = await MFAServiceV8.validateOTPForDevice({
				environmentId: credentials.environmentId,
				username: credentials.username,
				authenticationId,
				otp: otpCode,
			});

			setMfaState({
				...mfaState,
				verificationResult: {
					status: result.status,
					message: (result.message as string) || 'OTP validated successfully',
				},
			});

			if (result.status === 'COMPLETED') {
				setValidationState({ validationAttempts: 0, lastValidationError: null });
				nav.markStepComplete();
				toastV8.success('Authentication successful!');

				if (this.callbacks.onOTPValidated) {
					this.callbacks.onOTPValidated();
				}
				return true;
			} else {
				setValidationState({
					validationAttempts: validationState.validationAttempts + 1,
					lastValidationError: 'Invalid OTP code',
				});
				nav.setValidationErrors(['Invalid OTP code. Please try again.']);
				toastV8.error('Invalid OTP code');
				return false;
			}
		} catch (error) {
			console.error(`${MODULE_TAG} OTP validation for device authentication failed`, error);
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			setValidationState({
				validationAttempts: validationState.validationAttempts + 1,
				lastValidationError: errorMessage,
			});

			this.handleOTPValidationError(errorMessage, nav);

			if (this.callbacks.onError) {
				this.callbacks.onError(errorMessage);
			}
			return false;
		} finally {
			setIsLoading(false);
		}
	}

	/**
	 * Validate step 0 credentials (implemented by subclasses)
	 */
	abstract validateCredentials(
		credentials: MFACredentials,
		tokenStatus: ReturnType<typeof WorkerTokenStatusServiceV8.checkWorkerTokenStatus>,
		nav: ReturnType<typeof useStepNavigationV8>
	): boolean;

	/**
	 * Get device registration parameters (implemented by subclasses)
	 */
	abstract getDeviceRegistrationParams(credentials: MFACredentials): Partial<RegisterDeviceParams>;
}

