// src/services/pingOneMfaService.ts
// Real PingOne MFA API Service Implementation with QR Code Integration

import QRCodeService, { type QRCodeResult, type TOTPConfig } from './qrCodeService';

export interface MfaDevice {
	id: string;
	type: 'SMS' | 'EMAIL' | 'TOTP' | 'VOICE' | 'FIDO2' | 'MOBILE';
	status: 'ACTIVE' | 'ACTIVATION_REQUIRED' | 'PENDING_ACTIVATION' | 'BLOCKED';
	phoneNumber?: string;
	emailAddress?: string;
	deviceName?: string;
	nickname?: string;
	activationRequired: boolean;
	qrCode?: string;
	secret?: string;
	pairingKey?: string;
	// Enhanced QR code data
	qrCodeData?: QRCodeResult;
	totpUri?: string;
	manualEntryKey?: string;
	backupCodes?: string[];
	// Additional metadata
	createdAt?: Date;
	lastUsed?: Date;
	activatedAt?: Date;
	userAgent?: string;
	ipAddress?: string;
}

export interface DeviceSetupData {
	device: MfaDevice;
	qrCodeData?: QRCodeResult;
	setupInstructions: string[];
	alternativeMethods: {
		manualEntry?: {
			key: string;
			instructions: string[];
		};
		backupCodes?: {
			codes: string[];
			instructions: string[];
		};
	};
}

export interface MfaCredentials {
	workerToken: string;
	environmentId: string;
	userId: string;
}

export interface DeviceRegistrationConfig {
	type: 'SMS' | 'EMAIL' | 'TOTP' | 'VOICE' | 'FIDO2' | 'MOBILE';
	nickname?: string;
	phoneNumber?: string;
	emailAddress?: string;
	deviceName?: string;
	issuer?: string;
	accountName?: string;
}

export interface DeviceRegistrationResult {
	success: boolean;
	device?: MfaDevice;
	setupData?: DeviceSetupData;
	error?: string;
	requiresActivation?: boolean;
}

export interface ChallengeResult {
	challengeId: string;
	deviceId: string;
	method: string;
	status: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED';
	expiresAt: Date;
	deliveryStatus?: 'SENT' | 'DELIVERED' | 'FAILED';
	retryAllowed?: boolean;
	nextRetryAt?: Date;
}

export interface ValidationResult {
	valid: boolean;
	challengeId?: string;
	deviceId?: string;
	error?: string;
	attemptsRemaining?: number;
	lockoutTime?: Date;
}

export interface DeviceActivationRequest {
	deviceId: string;
	otp: string;
}

export interface MfaChallengeRequest {
	deviceId: string;
	challengeType?: string;
}

export class PingOneMfaService {
	private static baseUrl = 'https://api.pingone.com/v1';

	/**
	 * Get registered MFA devices for a user with enhanced metadata
	 */
	static async getRegisteredDevices(credentials: MfaCredentials): Promise<MfaDevice[]> {
		try {
			const devices = await PingOneMfaService.getDevices(credentials);

			// Enhance devices with additional metadata
			return devices.map((device) => ({
				...device,
				createdAt: device.createdAt ? new Date(device.createdAt) : undefined,
				lastUsed: device.lastUsed ? new Date(device.lastUsed) : undefined,
				activatedAt: device.activatedAt ? new Date(device.activatedAt) : undefined,
				nickname: device.nickname || device.deviceName || `${device.type} Device`,
			}));
		} catch (error) {
			console.error('[PingOneMfaService] Failed to get registered devices:', error);
			throw new Error(
				`Failed to retrieve MFA devices: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	/**
	 * Register a new MFA device with comprehensive setup
	 */
	static async registerDevice(
		credentials: MfaCredentials,
		config: DeviceRegistrationConfig
	): Promise<DeviceRegistrationResult> {
		try {
			console.log(`[PingOneMfaService] Registering ${config.type} device`);

			let device: MfaDevice;
			let setupData: DeviceSetupData | undefined;

			switch (config.type) {
				case 'SMS':
					if (!config.phoneNumber) {
						return {
							success: false,
							error: 'Phone number is required for SMS devices',
						};
					}
					device = await PingOneMfaService.createSmsDevice(credentials, config.phoneNumber);
					break;

				case 'EMAIL':
					if (!config.emailAddress) {
						return {
							success: false,
							error: 'Email address is required for EMAIL devices',
						};
					}
					device = await PingOneMfaService.createEmailDevice(credentials, config.emailAddress);
					break;

				case 'TOTP':
					setupData = await PingOneMfaService.createTotpDeviceWithQRCode(credentials, {
						issuer: config.issuer,
						accountName: config.accountName,
						deviceName: config.nickname || config.deviceName,
					});
					device = setupData.device;
					break;

				case 'VOICE':
					if (!config.phoneNumber) {
						return {
							success: false,
							error: 'Phone number is required for VOICE devices',
						};
					}
					device = await PingOneMfaService.createVoiceDevice(credentials, config.phoneNumber);
					break;

				case 'FIDO2':
					// FIDO2 devices require special handling - will be implemented in FIDO service
					return {
						success: false,
						error: 'FIDO2 device registration requires WebAuthn integration',
					};

				case 'MOBILE':
					device = await PingOneMfaService.createDevice(credentials, 'MOBILE', {
						deviceName: config.nickname || config.deviceName || 'Mobile App',
					});
					break;

				default:
					return {
						success: false,
						error: `Unsupported device type: ${config.type}`,
					};
			}

			// Update device nickname if provided and different from device name
			if (config.nickname && config.nickname !== device.deviceName) {
				try {
					await PingOneMfaService.updateDevice(credentials, device.id, {
						nickname: config.nickname,
					});
					device.nickname = config.nickname;
				} catch (updateError) {
					console.warn('[PingOneMfaService] Failed to update device nickname:', updateError);
				}
			}

			// Generate setup data if not already created
			if (!setupData && device.type !== 'FIDO2') {
				setupData = await PingOneMfaService.getDeviceSetupData(credentials, device, {
					issuer: config.issuer,
					accountName: config.accountName,
					includeBackupCodes: true,
					includeInstructions: true,
				});
			}

			console.log(
				`[PingOneMfaService] Successfully registered ${config.type} device: ${device.id}`
			);

			return {
				success: true,
				device,
				setupData,
				requiresActivation: device.activationRequired || device.status === 'ACTIVATION_REQUIRED',
			};
		} catch (error) {
			console.error('[PingOneMfaService] Device registration failed:', error);
			return {
				success: false,
				error: `Device registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
			};
		}
	}

	/**
	 * Activate a device with validation code
	 */
	static async activateDeviceWithCode(
		credentials: MfaCredentials,
		deviceId: string,
		activationData: { otp?: string; totpCode?: string }
	): Promise<ValidationResult> {
		try {
			console.log(`[PingOneMfaService] Activating device: ${deviceId}`);

			// Get device details first
			const devices = await PingOneMfaService.getRegisteredDevices(credentials);
			const device = devices.find((d) => d.id === deviceId);

			if (!device) {
				return {
					valid: false,
					error: 'Device not found',
				};
			}

			let validationResult: ValidationResult;

			if (device.type === 'TOTP' && activationData.totpCode) {
				// Validate TOTP code
				const totpResult = await PingOneMfaService.validateTotpCode(
					device,
					activationData.totpCode
				);
				validationResult = {
					valid: totpResult.valid,
					deviceId,
					error: totpResult.error,
				};
			} else if (activationData.otp) {
				// Activate with OTP for SMS/EMAIL/VOICE devices
				await PingOneMfaService.activateDevice(credentials, {
					deviceId,
					otp: activationData.otp,
				});

				validationResult = {
					valid: true,
					deviceId,
				};
			} else {
				return {
					valid: false,
					error: 'Invalid activation data provided',
				};
			}

			if (validationResult.valid) {
				console.log(`[PingOneMfaService] Device activated successfully: ${deviceId}`);
			}

			return validationResult;
		} catch (error) {
			console.error('[PingOneMfaService] Device activation failed:', error);
			return {
				valid: false,
				deviceId,
				error: `Activation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
			};
		}
	}

	/**
	 * Initiate MFA challenge for a device
	 */
	static async initiateChallenge(
		credentials: MfaCredentials,
		deviceId: string,
		challengeType?: string
	): Promise<ChallengeResult> {
		try {
			console.log(`[PingOneMfaService] Initiating challenge for device: ${deviceId}`);

			const challengeResponse = await PingOneMfaService.sendChallenge(credentials, {
				deviceId,
				challengeType,
			});

			const result: ChallengeResult = {
				challengeId: challengeResponse.id || `challenge_${Date.now()}`,
				deviceId,
				method: challengeType || challengeResponse.type || 'SMS',
				status: challengeResponse.status || 'PENDING',
				expiresAt: challengeResponse.expiresAt
					? new Date(challengeResponse.expiresAt)
					: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes default
				deliveryStatus: challengeResponse.deliveryStatus,
				retryAllowed: challengeResponse.retryAllowed !== false,
				nextRetryAt: challengeResponse.nextRetryAt
					? new Date(challengeResponse.nextRetryAt)
					: undefined,
			};

			console.log(`[PingOneMfaService] Challenge initiated: ${result.challengeId}`);
			return result;
		} catch (error) {
			console.error('[PingOneMfaService] Challenge initiation failed:', error);
			throw new Error(
				`Challenge initiation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	/**
	 * Validate MFA challenge response
	 */
	static async validateChallenge(
		credentials: MfaCredentials,
		challengeId: string,
		_responseCode: string
	): Promise<ValidationResult> {
		try {
			console.log(`[PingOneMfaService] Validating challenge: ${challengeId}`);

			// This would typically make an API call to PingOne to validate the challenge
			// For now, implementing a mock validation that simulates real behavior
			const validationResponse = await fetch(
				`${PingOneMfaService.baseUrl}/environments/${credentials.environmentId}/users/${credentials.userId}/authentications/${challengeId}`,
				{
					method: 'POST',
					headers: {
						Authorization: `Bearer ${credentials.workerToken}`,
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						code: response,
					}),
				}
			);

			if (!validationResponse.ok) {
				const errorData = await validationResponse.json().catch(() => ({}));
				return {
					valid: false,
					challengeId,
					error: errorData.message || 'Challenge validation failed',
					attemptsRemaining: errorData.attemptsRemaining,
				};
			}

			const validationData = await validationResponse.json();

			const result: ValidationResult = {
				valid: validationData.status === 'COMPLETED' || validationData.valid === true,
				challengeId,
				deviceId: validationData.deviceId,
				attemptsRemaining: validationData.attemptsRemaining,
				lockoutTime: validationData.lockoutTime ? new Date(validationData.lockoutTime) : undefined,
			};

			console.log(`[PingOneMfaService] Challenge validation result: ${result.valid}`);
			return result;
		} catch (error) {
			console.error('[PingOneMfaService] Challenge validation failed:', error);
			return {
				valid: false,
				challengeId,
				error: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
			};
		}
	}

	/**
	 * Send OTP for Email or SMS devices
	 */
	static async sendOTP(
		credentials: MfaCredentials,
		deviceId: string,
		method: 'EMAIL' | 'SMS' | 'VOICE'
	): Promise<ChallengeResult> {
		return PingOneMfaService.initiateChallenge(credentials, deviceId, method);
	}

	/**
	 * Validate OTP for Email or SMS devices
	 */
	static async validateOTP(
		credentials: MfaCredentials,
		deviceId: string,
		challengeId: string,
		code: string
	): Promise<ValidationResult> {
		const result = await PingOneMfaService.validateChallenge(credentials, challengeId, code);
		return {
			...result,
			deviceId,
		};
	}

	/**
	 * Delete a device with confirmation
	 */
	static async deleteDeviceWithConfirmation(
		credentials: MfaCredentials,
		deviceId: string,
		confirmation?: { userConfirmed: boolean; backupMethod?: string }
	): Promise<{ success: boolean; error?: string; requiresConfirmation?: boolean }> {
		try {
			// Check if this is the user's only device
			const devices = await PingOneMfaService.getRegisteredDevices(credentials);
			const activeDevices = devices.filter((d) => d.status === 'ACTIVE');

			if (activeDevices.length === 1 && activeDevices[0].id === deviceId) {
				if (!confirmation?.userConfirmed) {
					return {
						success: false,
						requiresConfirmation: true,
						error:
							'This is your only active MFA device. Deleting it will disable MFA protection for your account.',
					};
				}
			}

			await PingOneMfaService.deleteDevice(credentials, deviceId);

			console.log(`[PingOneMfaService] Device deleted: ${deviceId}`);
			return { success: true };
		} catch (error) {
			console.error('[PingOneMfaService] Device deletion failed:', error);
			return {
				success: false,
				error: `Device deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
			};
		}
	}

	/**
	 * Get all MFA devices for a user
	 */
	static async getDevices(credentials: MfaCredentials): Promise<MfaDevice[]> {
		const response = await fetch(
			`${PingOneMfaService.baseUrl}/environments/${credentials.environmentId}/users/${credentials.userId}/devices`,
			{
				method: 'GET',
				headers: {
					Authorization: `Bearer ${credentials.workerToken}`,
					'Content-Type': 'application/json',
				},
			}
		);

		if (!response.ok) {
			throw new Error(`Failed to get devices: ${response.status} ${response.statusText}`);
		}

		const data = await response.json();
		return data._embedded?.devices || [];
	}

	/**
	 * Create a new MFA device
	 */
	static async createDevice(
		credentials: MfaCredentials,
		deviceType: string,
		deviceData: Record<string, unknown>
	): Promise<MfaDevice> {
		const response = await fetch(
			`${PingOneMfaService.baseUrl}/environments/${credentials.environmentId}/users/${credentials.userId}/devices`,
			{
				method: 'POST',
				headers: {
					Authorization: `Bearer ${credentials.workerToken}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					type: deviceType,
					...deviceData,
				}),
			}
		);

		if (!response.ok) {
			throw new Error(`Failed to create device: ${response.status} ${response.statusText}`);
		}

		return await response.json();
	}

	/**
	 * Activate a device with OTP
	 */
	static async activateDevice(
		credentials: MfaCredentials,
		request: DeviceActivationRequest
	): Promise<Record<string, unknown>> {
		const response = await fetch(
			`${PingOneMfaService.baseUrl}/environments/${credentials.environmentId}/users/${credentials.userId}/devices/${request.deviceId}`,
			{
				method: 'POST',
				headers: {
					Authorization: `Bearer ${credentials.workerToken}`,
					'Content-Type': 'application/vnd.pingidentity.device.activate+json',
				},
				body: JSON.stringify({
					otp: request.otp,
				}),
			}
		);

		if (!response.ok) {
			throw new Error(`Failed to activate device: ${response.status} ${response.statusText}`);
		}

		return await response.json();
	}

	/**
	 * Send MFA challenge (SMS, Email, Voice)
	 */
	static async sendChallenge(
		credentials: MfaCredentials,
		request: MfaChallengeRequest
	): Promise<Record<string, unknown>> {
		const response = await fetch(
			`${PingOneMfaService.baseUrl}/environments/${credentials.environmentId}/users/${credentials.userId}/devices/${request.deviceId}/authentications`,
			{
				method: 'POST',
				headers: {
					Authorization: `Bearer ${credentials.workerToken}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					type: request.challengeType || 'SMS',
				}),
			}
		);

		if (!response.ok) {
			throw new Error(`Failed to send challenge: ${response.status} ${response.statusText}`);
		}

		return await response.json();
	}

	/**
	 * Create SMS device with phone number
	 */
	static async createSmsDevice(
		credentials: MfaCredentials,
		phoneNumber: string
	): Promise<MfaDevice> {
		return PingOneMfaService.createDevice(credentials, 'SMS', {
			phone: phoneNumber,
		});
	}

	/**
	 * Create Email device with email address
	 */
	static async createEmailDevice(
		credentials: MfaCredentials,
		emailAddress: string
	): Promise<MfaDevice> {
		return PingOneMfaService.createDevice(credentials, 'EMAIL', {
			email: emailAddress,
		});
	}

	/**
	 * Create TOTP device (returns QR code)
	 */
	static async createTotpDevice(credentials: MfaCredentials): Promise<MfaDevice> {
		const device = await PingOneMfaService.createDevice(credentials, 'TOTP', {});

		// The response should include QR code data
		return device;
	}

	/**
	 * Create Voice device with phone number
	 */
	static async createVoiceDevice(
		credentials: MfaCredentials,
		phoneNumber: string
	): Promise<MfaDevice> {
		return PingOneMfaService.createDevice(credentials, 'VOICE', {
			phone: phoneNumber,
		});
	}

	/**
	 * Update device information
	 */
	static async updateDevice(
		credentials: MfaCredentials,
		deviceId: string,
		updates: Partial<MfaDevice>
	): Promise<MfaDevice> {
		const response = await fetch(
			`${PingOneMfaService.baseUrl}/environments/${credentials.environmentId}/users/${credentials.userId}/devices/${deviceId}`,
			{
				method: 'PATCH',
				headers: {
					Authorization: `Bearer ${credentials.workerToken}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(updates),
			}
		);

		if (!response.ok) {
			throw new Error(`Failed to update device: ${response.status} ${response.statusText}`);
		}

		return await response.json();
	}

	/**
	 * Delete a device
	 */
	static async deleteDevice(credentials: MfaCredentials, deviceId: string): Promise<void> {
		const response = await fetch(
			`${PingOneMfaService.baseUrl}/environments/${credentials.environmentId}/users/${credentials.userId}/devices/${deviceId}`,
			{
				method: 'DELETE',
				headers: {
					Authorization: `Bearer ${credentials.workerToken}`,
					'Content-Type': 'application/json',
				},
			}
		);

		if (!response.ok) {
			throw new Error(`Failed to delete device: ${response.status} ${response.statusText}`);
		}
	}

	/**
	 * Generate QR code for TOTP device registration
	 * Enhanced method that integrates QRCodeService with PingOne MFA
	 */
	static async generateDeviceQRCode(
		credentials: MfaCredentials,
		device: MfaDevice,
		issuer: string = 'PingOne MFA',
		accountName?: string
	): Promise<QRCodeResult> {
		try {
			if (device.type !== 'TOTP') {
				throw new Error('QR codes can only be generated for TOTP devices');
			}

			if (!device.secret && !device.pairingKey) {
				throw new Error('Device must have a secret or pairing key to generate QR code');
			}

			// Use device secret or pairing key
			const secret = device.secret || device.pairingKey || '';

			// Generate account name from user ID if not provided
			const account =
				accountName || `user-${credentials.userId}@${issuer.toLowerCase().replace(/\s+/g, '-')}`;

			const totpConfig: TOTPConfig = {
				secret,
				issuer,
				accountName: account,
				algorithm: 'SHA1', // PingOne typically uses SHA1
				digits: 6,
				period: 30,
			};

			console.log(`[PingOneMfaService] Generating QR code for TOTP device ${device.id}`);

			const qrResult = await QRCodeService.generateTOTPQRCode(totpConfig);

			console.log(`[PingOneMfaService] QR code generated successfully for device ${device.id}`);

			return qrResult;
		} catch (error) {
			console.error('[PingOneMfaService] Failed to generate device QR code:', error);
			throw new Error(
				`QR code generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	/**
	 * Get comprehensive device setup data including QR codes and backup options
	 * This method provides everything needed for MFA device setup UI
	 */
	static async getDeviceSetupData(
		credentials: MfaCredentials,
		device: MfaDevice,
		options?: {
			issuer?: string;
			accountName?: string;
			includeBackupCodes?: boolean;
			includeInstructions?: boolean;
		}
	): Promise<DeviceSetupData> {
		try {
			const issuer = options?.issuer || 'PingOne MFA';
			const includeBackupCodes = options?.includeBackupCodes !== false;
			const includeInstructions = options?.includeInstructions !== false;

			const setupData: DeviceSetupData = {
				device,
				setupInstructions: [],
				alternativeMethods: {},
			};

			// Generate QR code data for TOTP devices
			if (device.type === 'TOTP' && (device.secret || device.pairingKey)) {
				try {
					const qrCodeData = await PingOneMfaService.generateDeviceQRCode(
						credentials,
						device,
						issuer,
						options?.accountName
					);

					setupData.qrCodeData = qrCodeData;

					// Add manual entry alternative
					setupData.alternativeMethods.manualEntry = {
						key: qrCodeData.manualEntryKey,
						instructions: includeInstructions
							? [
									'Open your authenticator app',
									'Select "Add account" or "+"',
									'Choose "Enter a setup key" or "Manual entry"',
									'Enter the key shown above',
									'Set account name and issuer as desired',
								]
							: [],
					};

					// Add backup codes if requested
					if (includeBackupCodes && qrCodeData.backupCodes) {
						setupData.alternativeMethods.backupCodes = {
							codes: qrCodeData.backupCodes,
							instructions: includeInstructions
								? [
										'Save these backup codes in a secure location',
										'Each code can only be used once',
										'Use backup codes if you lose access to your authenticator app',
										'Generate new codes if you use more than half of them',
									]
								: [],
						};
					}

					if (includeInstructions) {
						setupData.setupInstructions = [
							'Scan the QR code with your authenticator app',
							'Enter the 6-digit code from your app to complete setup',
							'Save the backup codes in a secure location',
						];
					}
				} catch (qrError) {
					console.warn(
						'[PingOneMfaService] QR code generation failed, providing manual setup only:',
						qrError
					);

					// Fallback to manual entry only
					if (device.secret || device.pairingKey) {
						const manualKey = QRCodeService.generateManualEntryCode(
							device.secret || device.pairingKey || ''
						);
						setupData.alternativeMethods.manualEntry = {
							key: manualKey,
							instructions: includeInstructions
								? [
										'QR code generation failed',
										'Use manual entry in your authenticator app',
										'Enter the key shown above',
									]
								: [],
						};
					}
				}
			}

			// Setup instructions for other device types
			if (includeInstructions) {
				switch (device.type) {
					case 'SMS':
						setupData.setupInstructions = [
							'Verification codes will be sent to your phone via SMS',
							`Phone number: ${device.phoneNumber || 'Not specified'}`,
							'Make sure your phone can receive text messages',
						];
						break;
					case 'EMAIL':
						setupData.setupInstructions = [
							'Verification codes will be sent to your email',
							`Email address: ${device.emailAddress || 'Not specified'}`,
							'Check your email for verification codes',
						];
						break;
					case 'VOICE':
						setupData.setupInstructions = [
							'Verification codes will be delivered via voice call',
							`Phone number: ${device.phoneNumber || 'Not specified'}`,
							'Answer the call and listen for the verification code',
						];
						break;
					case 'MOBILE':
						setupData.setupInstructions = [
							'Use the PingID mobile app for authentication',
							'Install PingID from your app store if not already installed',
							'Follow the pairing instructions in the app',
						];
						break;
					case 'FIDO2':
						setupData.setupInstructions = [
							'Use your FIDO2 security key for authentication',
							'Insert or connect your security key when prompted',
							"Follow your browser's instructions to complete setup",
						];
						break;
				}
			}

			console.log(
				`[PingOneMfaService] Generated setup data for ${device.type} device ${device.id}`
			);

			return setupData;
		} catch (error) {
			console.error('[PingOneMfaService] Failed to get device setup data:', error);
			throw new Error(
				`Setup data generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	/**
	 * Enhanced TOTP device creation with automatic QR code generation
	 */
	static async createTotpDeviceWithQRCode(
		credentials: MfaCredentials,
		options?: {
			issuer?: string;
			accountName?: string;
			deviceName?: string;
		}
	): Promise<DeviceSetupData> {
		try {
			// Create the TOTP device first
			const device = await PingOneMfaService.createTotpDevice(credentials);

			// Update device name if provided
			if (options?.deviceName) {
				try {
					await PingOneMfaService.updateDevice(credentials, device.id, {
						deviceName: options.deviceName,
					});
					device.deviceName = options.deviceName;
				} catch (updateError) {
					console.warn('[PingOneMfaService] Failed to update device name:', updateError);
				}
			}

			// Generate comprehensive setup data
			const setupData = await PingOneMfaService.getDeviceSetupData(credentials, device, {
				issuer: options?.issuer,
				accountName: options?.accountName,
				includeBackupCodes: true,
				includeInstructions: true,
			});

			console.log(`[PingOneMfaService] Created TOTP device with QR code: ${device.id}`);

			return setupData;
		} catch (error) {
			console.error('[PingOneMfaService] Failed to create TOTP device with QR code:', error);
			throw new Error(
				`TOTP device creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	/**
	 * Validate TOTP code for device activation
	 */
	static async validateTotpCode(
		device: MfaDevice,
		code: string
	): Promise<{ valid: boolean; error?: string }> {
		try {
			if (device.type !== 'TOTP') {
				return { valid: false, error: 'Device is not a TOTP device' };
			}

			if (!device.secret && !device.pairingKey) {
				return { valid: false, error: 'Device secret not available for validation' };
			}

			const secret = device.secret || device.pairingKey || '';
			const result = QRCodeService.validateTOTPCode(secret, code);

			console.log(`[PingOneMfaService] TOTP validation for device ${device.id}: ${result.valid}`);

			return result;
		} catch (error) {
			console.error('[PingOneMfaService] TOTP validation error:', error);
			return {
				valid: false,
				error: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
			};
		}
	}

	/**
	 * Get QR code capabilities for the current environment
	 */
	static getQRCodeCapabilities(): {
		supported: boolean;
		features: {
			qrCodeGeneration: boolean;
			manualEntry: boolean;
			backupCodes: boolean;
			totpValidation: boolean;
		};
	} {
		const capabilities = QRCodeService.getCapabilities();

		return {
			supported: capabilities.qrCodeGeneration,
			features: capabilities,
		};
	}
}

export default PingOneMfaService;
