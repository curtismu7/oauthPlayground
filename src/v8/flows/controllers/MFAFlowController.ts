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
			await MFAServiceV8.sendOTP({
				environmentId: credentials.environmentId,
				username: credentials.username,
				deviceId,
			});

			console.log(`${MODULE_TAG} OTP sent successfully`);
			setState({ otpSent: true, sendRetryCount: 0 });
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
			const result = await MFAServiceV8.validateOTP({
				environmentId: credentials.environmentId,
				username: credentials.username,
				deviceId,
				otp: otpCode,
			});

			setMfaState({
				verificationResult: {
					status: result.status,
					message: result.message || 'OTP validated successfully',
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

