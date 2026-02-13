/**
 * @file MFAFlowController.ts
 * @module v8/flows/controllers
 * @description Base controller for MFA flow operations
 * @version 8.2.0
 */

import type { useStepNavigationV8 } from '@/v8/hooks/useStepNavigationV8';
import { MfaAuthenticationServiceV8 } from '@/v8/services/mfaAuthenticationServiceV8';
import { MFAServiceV8, type RegisterDeviceParams } from '@/v8/services/mfaServiceV8';
import { WorkerTokenStatusServiceV8 } from '@/v8/services/workerTokenStatusServiceV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';
import type { TokenStatusInfo } from '@/v8/services/workerTokenStatusServiceV8';
import type { DeviceType, MFACredentials, MFAState } from '../shared/MFATypes';

const MODULE_TAG = '[🎮 MFA-CONTROLLER]';

export interface OTPState {
	otpSent: boolean;
	sendError: string | null;
	sendRetryCount: number;
	deviceAuthId?: string; // Store deviceAuthId from initialize response
	otpCheckUrl?: string; // Store otp.check URL from _links
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
 *
 * @version 8.3.0 - Added unified flow support with new method signatures
 */
export abstract class MFAFlowController {
	protected deviceType: DeviceType;
	protected callbacks: FlowControllerCallbacks;

	constructor(deviceType: DeviceType, callbacks: FlowControllerCallbacks = {}) {
		this.deviceType = deviceType;
		this.callbacks = callbacks;
	}

	// ========================================================================
	// LEGACY METHODS (for backward compatibility with existing flows)
	// ========================================================================

	/**
	 * Load existing devices for the user (legacy signature)
	 */
	async loadExistingDevices(
		credentials: MFACredentials,
		tokenStatus: TokenStatusInfo
	): Promise<Array<Record<string, unknown>>>;

	/**
	 * Load existing devices for the user (unified flow signature)
	 */
	async loadExistingDevices(
		credentials: MFACredentials,
		mfaState: MFAState,
		tokenStatus: ReturnType<typeof WorkerTokenStatusServiceV8.checkWorkerTokenStatus>,
		nav: ReturnType<typeof useStepNavigationV8>
	): Promise<Array<Record<string, unknown>>>;

	/**
	 * Load existing devices for the user (implementation)
	 */
	async loadExistingDevices(
		credentials: MFACredentials,
		mfaStateOrTokenStatus:
			| MFAState
			| TokenStatusInfo,
		tokenStatus?: TokenStatusInfo,
		_nav?: ReturnType<typeof useStepNavigationV8>
	): Promise<Array<Record<string, unknown>>> {
		// Handle both signatures:
		// Legacy: (credentials, tokenStatus)
		// Unified: (credentials, mfaState, tokenStatus, nav)
		const actualTokenStatus =
			tokenStatus !== undefined
				? tokenStatus
				: (mfaStateOrTokenStatus as TokenStatusInfo);

		if (!credentials.environmentId || !credentials.username || !actualTokenStatus.isValid) {
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
	protected abstract filterDevicesByType(
		devices: Array<Record<string, unknown>>
	): Array<Record<string, unknown>>;

	/**
	 * Register a new device (legacy signature)
	 */
	async registerDevice(
		credentials: MFACredentials,
		deviceParams: Partial<RegisterDeviceParams>
	): Promise<{ deviceId: string; status: string }>;

	/**
	 * Register a new device (unified flow signature)
	 */
	async registerDevice(
		credentials: MFACredentials,
		mfaState: MFAState,
		tokenStatus: ReturnType<typeof WorkerTokenStatusServiceV8.checkWorkerTokenStatus>,
		nav: ReturnType<typeof useStepNavigationV8>
	): Promise<{ deviceId: string; status: string; [key: string]: any }>;

	/**
	 * Register a new device (implementation)
	 */
	async registerDevice(
		credentials: MFACredentials,
		deviceParamsOrMfaState: Partial<RegisterDeviceParams> | MFAState,
		tokenStatus?: ReturnType<typeof WorkerTokenStatusServiceV8.checkWorkerTokenStatus>,
		_nav?: ReturnType<typeof useStepNavigationV8>
	): Promise<{ deviceId: string; status: string; [key: string]: any }> {
		// Handle both signatures:
		// Legacy: (credentials, deviceParams)
		// Unified: (credentials, mfaState, tokenStatus, nav)
		const isUnifiedFlow = tokenStatus !== undefined;

		let deviceParams: Partial<RegisterDeviceParams>;

		if (isUnifiedFlow) {
			// Unified flow: get device params from credentials
			deviceParams = this.getDeviceRegistrationParams(credentials);
		} else {
			// Legacy flow: use provided params
			deviceParams = deviceParamsOrMfaState as Partial<RegisterDeviceParams>;
		}

		const params: RegisterDeviceParams = {
			environmentId: credentials.environmentId,
			username: credentials.username,
			type: this.deviceType,
			// Per rightTOTP.md: Pass token type and user token if available
			tokenType: credentials.tokenType,
			userToken: credentials.userToken,
			...deviceParams,
		} as RegisterDeviceParams;

		const result = await MFAServiceV8.registerDevice(params);

		if (this.callbacks.onDeviceRegistered) {
			this.callbacks.onDeviceRegistered(result.deviceId, result.status);
		}

		// Process and return result with device-specific fields
		return this.processRegistrationResult(result);
	}

	/**
	 * Process registration result (can be overridden for device-specific handling)
	 * Extracts and formats device-specific data from the API response
	 */
	protected processRegistrationResult(result: any): {
		deviceId: string;
		status: string;
		[key: string]: any;
	} {
		// Return all fields from result, including device-specific fields
		// This ensures publicKeyCredentialCreationOptions, QR codes, and other fields are preserved
		return {
			deviceId: result.deviceId,
			status: result.status,
			type: result.type,
			// Per rightOTP.md: Include deviceActivateUri for ACTIVATION_REQUIRED devices
			...(result.deviceActivateUri ? { deviceActivateUri: result.deviceActivateUri } : {}),
			// Include other common fields
			...(result.userId ? { userId: result.userId } : {}),
			...(result.environmentId ? { environmentId: result.environmentId } : {}),
			...(result.createdAt ? { createdAt: result.createdAt } : {}),
			...(result.updatedAt ? { updatedAt: result.updatedAt } : {}),
			// FIDO2-specific: Include publicKeyCredentialCreationOptions if present
			...(result.publicKeyCredentialCreationOptions
				? { publicKeyCredentialCreationOptions: result.publicKeyCredentialCreationOptions }
				: {}),
			// TOTP-specific: Include secret, QR code, and keyUri if present
			...(result.secret ? { secret: result.secret } : {}),
			...(result.totpSecret ? { totpSecret: result.totpSecret } : {}),
			...(result.qrCode ? { qrCode: result.qrCode } : {}),
			...(result.qrCodeUrl ? { qrCodeUrl: result.qrCodeUrl } : {}),
			...(result.keyUri ? { keyUri: result.keyUri } : {}),
			// Mobile-specific: Include pairing key if present
			...(result.pairingKey ? { pairingKey: result.pairingKey } : {}),
			// Include phone/email if present
			...(result.phone ? { phone: result.phone } : {}),
			...(result.email ? { email: result.email } : {}),
			...(result.nickname ? { nickname: result.nickname } : {}),
			// Include _links for activation if present
			...(result._links ? { _links: result._links } : {}),
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
			const { deviceAuthId, otpCheckUrl } = await MFAServiceV8.sendOTP({
				environmentId: credentials.environmentId,
				username: credentials.username,
				deviceId,
				region: credentials.region,
				customDomain: credentials.customDomain,
			});

			console.log(`${MODULE_TAG} OTP sent successfully`, {
				hasOtpCheckUrl: !!otpCheckUrl,
				deviceAuthId,
				deviceId,
			});

			// Even if otpCheckUrl is not returned, if we have a deviceAuthId,
			// the OTP was likely sent (PingOne sends OTP automatically when deviceId is provided)
			if (deviceAuthId) {
				setState({
					otpSent: true,
					sendRetryCount: 0,
					deviceAuthId, // Store deviceAuthId for validation
					...(otpCheckUrl ? { otpCheckUrl } : {}), // Only include otpCheckUrl if it exists
				});
				nav.markStepComplete();
				toastV8.success('OTP sent successfully!');
			} else {
				throw new Error(
					'Failed to initialize device authentication - no authentication ID returned'
				);
			}

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

	// ========================================================================
	// UNIFIED FLOW METHODS (for UnifiedMFARegistrationFlowV8 components)
	// ========================================================================

	/**
	 * Validate OTP (unified flow signature)
	 * Called by UnifiedActivationStep component
	 *
	 * @param deviceId - Device ID to validate OTP for
	 * @param otp - 6-digit OTP code
	 * @param credentials - MFA credentials
	 * @param mfaState - Current MFA state
	 * @param tokenStatus - Worker token status
	 * @param nav - Navigation helper
	 * @returns Promise that resolves to validation result
	 * @throws Error if validation fails
	 */
	async validateOtp(
		deviceId: string,
		otp: string,
		credentials: MFACredentials,
		mfaState: MFAState,
		_tokenStatus: ReturnType<typeof WorkerTokenStatusServiceV8.checkWorkerTokenStatus>,
		_nav: ReturnType<typeof useStepNavigationV8>
	): Promise<any> {
		console.log(`${MODULE_TAG} Validating OTP (unified flow)`, {
			deviceId,
			deviceType: this.deviceType,
		});

		try {
			const workerToken = await MFAServiceV8.getWorkerToken();
			const cleanToken = workerToken.trim().replace(/^Bearer\s+/i, '');

			const result = await MFAServiceV8.validateOTP({
				environmentId: credentials.environmentId,
				deviceAuthId: mfaState.deviceAuthId || deviceId,
				otp,
				workerToken: cleanToken,
				otpCheckUrl: mfaState.otpCheckUrl,
			});

			if (!result.valid) {
				throw new Error(result.message || 'Invalid OTP code');
			}

			console.log(`${MODULE_TAG} OTP validated successfully (unified flow)`);
			return result;
		} catch (error) {
			console.error(`${MODULE_TAG} OTP validation failed (unified flow)`, error);
			throw error;
		}
	}

	/**
	 * Resend OTP (unified flow signature)
	 * Called by UnifiedActivationStep component
	 *
	 * @param deviceId - Device ID to resend OTP for
	 * @param credentials - MFA credentials
	 * @param mfaState - Current MFA state
	 * @param tokenStatus - Worker token status
	 * @param nav - Navigation helper
	 * @returns Promise that resolves when OTP is sent
	 * @throws Error if sending fails
	 */
	async resendOtp(
		deviceId: string,
		credentials: MFACredentials,
		mfaState: MFAState,
		_tokenStatus: ReturnType<typeof WorkerTokenStatusServiceV8.checkWorkerTokenStatus>,
		_nav: ReturnType<typeof useStepNavigationV8>
	): Promise<void> {
		console.log(`${MODULE_TAG} Resending OTP (unified flow)`, {
			deviceId,
			deviceType: this.deviceType,
		});

		try {
			const { deviceAuthId, otpCheckUrl } = await MFAServiceV8.sendOTP({
				environmentId: credentials.environmentId,
				username: credentials.username,
				deviceId,
			});

			console.log(`${MODULE_TAG} OTP resent successfully (unified flow)`, {
				hasOtpCheckUrl: !!otpCheckUrl,
				deviceAuthId,
			});

			// Update mfaState with new deviceAuthId if needed
			if (deviceAuthId && mfaState.deviceAuthId !== deviceAuthId) {
				console.log(`${MODULE_TAG} Updating deviceAuthId in mfaState`);
			}
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to resend OTP (unified flow)`, error);
			throw error;
		}
	}

	/**
	 * Validate OTP code (legacy signature)
	 */
	async validateOTP(
		credentials: MFACredentials,
		_deviceId: string,
		otpCode: string,
		mfaState: MFAState,
		setMfaState: (state: Partial<MFAState> | ((prev: MFAState) => MFAState)) => void,
		validationState: ValidationState,
		setValidationState: (
			state: Partial<ValidationState> | ((prev: ValidationState) => Partial<ValidationState>)
		) => void,
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
				workerToken: cleanToken,
				otpCheckUrl: mfaState.otpCheckUrl, // Use otp.check URL from _links if available
			});

			setMfaState({
				verificationResult: {
					status: result.valid ? 'SUCCESS' : 'FAILED',
					message:
						result.message || (result.valid ? 'OTP validated successfully' : 'Invalid OTP code'),
				},
			});

			if (result.valid) {
				setValidationState({ validationAttempts: 0, lastValidationError: null });
				// Update verification result to COMPLETED for success page
				setMfaState({
					verificationResult: {
						status: 'COMPLETED',
						message: result.message || 'OTP validated successfully',
					},
				});
				nav.markStepComplete();
				nav.goToStep(4); // Navigate to success page
				toastV8.success('OTP validated successfully!');

				if (this.callbacks.onOTPValidated) {
					this.callbacks.onOTPValidated();
				}
				return true;
			} else {
				// Normalize error message for invalid OTP codes
				const errorMsg = result.message || 'Invalid OTP code';
				const userFriendlyError =
					errorMsg.toLowerCase().includes('invalid') ||
					errorMsg.toLowerCase().includes('incorrect') ||
					errorMsg.toLowerCase().includes('wrong')
						? 'OTP code invalid'
						: errorMsg;

				setValidationState({
					validationAttempts: validationState.validationAttempts + 1,
					lastValidationError: userFriendlyError,
				});
				nav.setValidationErrors([userFriendlyError]);
				toastV8.error(userFriendlyError);
				return false;
			}
		} catch (error) {
			console.error(`${MODULE_TAG} OTP validation failed`, error);
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';

			// Normalize error message for invalid OTP codes
			let userFriendlyError = errorMessage;
			if (
				errorMessage.toLowerCase().includes('invalid') ||
				errorMessage.toLowerCase().includes('incorrect') ||
				errorMessage.toLowerCase().includes('wrong') ||
				errorMessage.toLowerCase().includes('400') ||
				errorMessage.toLowerCase().includes('bad request')
			) {
				userFriendlyError = 'OTP code invalid';
			}

			setValidationState({
				validationAttempts: validationState.validationAttempts + 1,
				lastValidationError: userFriendlyError,
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
	protected handleOTPSendError(
		errorMessage: string,
		nav: ReturnType<typeof useStepNavigationV8>
	): void {
		if (
			errorMessage.toLowerCase().includes('worker token') ||
			errorMessage.toLowerCase().includes('missing') ||
			errorMessage.toLowerCase().includes('invalid')
		) {
			nav.setValidationErrors([
				'Worker token is missing or invalid. Please click "Manage Token" button to generate a new worker token.',
			]);
		} else if (
			errorMessage.toLowerCase().includes('rate limit') ||
			errorMessage.toLowerCase().includes('too many')
		) {
			nav.setValidationErrors([
				'Rate limit exceeded. Please wait a few minutes before trying again.',
			]);
		} else {
			nav.setValidationErrors([`Failed to send OTP: ${errorMessage}`]);
		}
		toastV8.error(`Failed to send OTP: ${errorMessage}`);
	}

	/**
	 * Handle OTP validation errors with specific error messages
	 */
	protected handleOTPValidationError(
		errorMessage: string,
		nav: ReturnType<typeof useStepNavigationV8>
	): void {
		if (errorMessage.toLowerCase().includes('expired')) {
			nav.setValidationErrors(['OTP code has expired. Please go back and request a new code.']);
		} else if (
			errorMessage.toLowerCase().includes('too many') ||
			errorMessage.toLowerCase().includes('attempts')
		) {
			nav.setValidationErrors([
				'Too many failed attempts. Please wait a few minutes or request a new code.',
			]);
		} else {
			nav.setValidationErrors([`OTP validation failed: ${errorMessage}`]);
		}
		toastV8.error(`Validation failed: ${errorMessage}`);
	}

	/**
	 * Initialize device authentication (for existing devices)
	 * Uses PingOne MFA API: POST auth.pingone.com/{environmentId}/deviceAuthentications
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

		console.log(
			`${MODULE_TAG} Initializing device authentication for ${this.deviceType} via PingOne MFA API`,
			{
				policyId: credentials.deviceAuthenticationPolicyId,
			}
		);

		// Use MfaAuthenticationServiceV8 which correctly implements PingOne MFA API
		// DeviceId in the request body immediately targets this device for OTP
		const result = await MfaAuthenticationServiceV8.initializeDeviceAuthentication({
			environmentId: credentials.environmentId,
			username: credentials.username,
			deviceAuthenticationPolicyId: credentials.deviceAuthenticationPolicyId,
			deviceId, // Pass deviceId to immediately trigger authentication for this device
			region: credentials.region, // Pass region from credentials
			customDomain: credentials.customDomain, // Pass custom domain from credentials
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
	 * POST auth.pingone.com/{environmentId}/deviceAuthentications/{authenticationId}/cancel
	 * API Reference: https://apidocs.pingidentity.com/pingone/mfa/v1/api/#post-cancel-device-authentication
	 */
	async cancelDeviceAuthentication(
		credentials: MFACredentials,
		authenticationId: string
	): Promise<{ status: string; [key: string]: unknown }> {
		if (!credentials.username) {
			throw new Error('Username is required to cancel device authentication');
		}
		return await MfaAuthenticationServiceV8.cancelDeviceAuthentication(
			credentials.environmentId,
			credentials.username,
			authenticationId,
			credentials.region, // Pass region from credentials
			credentials.customDomain // Pass custom domain from credentials
		);
	}

	/**
	 * Select device for authentication (when multiple devices available)
	 * Uses MfaAuthenticationServiceV8 which correctly implements PingOne MFA API
	 */
	async selectDeviceForAuthentication(
		credentials: MFACredentials,
		authenticationId: string,
		deviceId: string
	): Promise<{ status: string; nextStep?: string; [key: string]: unknown }> {
		console.log(`${MODULE_TAG} Selecting device for authentication`);
		const result = await MfaAuthenticationServiceV8.selectDeviceForAuthentication({
			environmentId: credentials.environmentId,
			username: credentials.username,
			authenticationId,
			deviceId,
			region: credentials.region, // Pass region from credentials
			customDomain: credentials.customDomain, // Pass custom domain from credentials
		});
		return {
			status: result.status,
			nextStep: result.nextStep,
			...result,
		};
	}

	/**
	 * Validate OTP for device authentication (for existing devices)
	 * Uses MfaAuthenticationServiceV8.validateOTP() which correctly implements PingOne MFA API
	 */
	async validateOTPForDevice(
		credentials: MFACredentials,
		authenticationId: string,
		otpCode: string,
		mfaState: MFAState,
		setMfaState: (state: Partial<MFAState> | ((prev: MFAState) => MFAState)) => void,
		validationState: ValidationState,
		setValidationState: (
			state: Partial<ValidationState> | ((prev: ValidationState) => Partial<ValidationState>)
		) => void,
		nav: ReturnType<typeof useStepNavigationV8>,
		setIsLoading: (loading: boolean) => void
	): Promise<boolean> {
		console.log(`${MODULE_TAG} Validating OTP for device authentication`);
		setIsLoading(true);
		setValidationState({ lastValidationError: null });

		try {
			// Use MfaAuthenticationServiceV8.validateOTP() which correctly implements PingOne MFA API
			// It uses _links.otp.check URL when available, or constructs the correct endpoint
			const result = await MfaAuthenticationServiceV8.validateOTP({
				environmentId: credentials.environmentId,
				username: credentials.username,
				authenticationId,
				otp: otpCode,
				region: credentials.region, // Pass region from credentials
				// otpCheckUrl is optional - if not provided, service will construct endpoint
			});

			setMfaState({
				...mfaState,
				verificationResult: {
					status: result.status,
					message: result.message || 'OTP validated successfully',
				},
			});

			// Check valid flag or COMPLETED status
			if (result.valid || result.status === 'COMPLETED') {
				setValidationState({ validationAttempts: 0, lastValidationError: null });
				nav.markStepComplete();
				toastV8.success('Authentication successful!');

				if (this.callbacks.onOTPValidated) {
					this.callbacks.onOTPValidated();
				}
				return true;
			} else {
				// Normalize error message for invalid OTP codes
				const errorMsg = result.message || 'Invalid OTP code';
				const userFriendlyError =
					errorMsg.toLowerCase().includes('invalid') ||
					errorMsg.toLowerCase().includes('incorrect') ||
					errorMsg.toLowerCase().includes('wrong')
						? 'OTP code invalid'
						: errorMsg;

				setValidationState({
					validationAttempts: validationState.validationAttempts + 1,
					lastValidationError: userFriendlyError,
				});
				nav.setValidationErrors([userFriendlyError]);
				toastV8.error(userFriendlyError);
				return false;
			}
		} catch (error) {
			console.error(`${MODULE_TAG} OTP validation for device authentication failed`, error);
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';

			// Normalize error message for invalid OTP codes
			let userFriendlyError = errorMessage;
			if (
				errorMessage.toLowerCase().includes('invalid') ||
				errorMessage.toLowerCase().includes('incorrect') ||
				errorMessage.toLowerCase().includes('wrong') ||
				errorMessage.toLowerCase().includes('400') ||
				errorMessage.toLowerCase().includes('bad request')
			) {
				userFriendlyError = 'OTP code invalid';
			}

			setValidationState({
				validationAttempts: validationState.validationAttempts + 1,
				lastValidationError: userFriendlyError,
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
