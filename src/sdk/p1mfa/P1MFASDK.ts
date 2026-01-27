/**
 * @file P1MFASDK.ts
 * @module sdk/p1mfa
 * @description PingOne MFA SDK - Main SDK class
 * @version 1.0.0
 *
 * A simplified SDK wrapper for PingOne MFA operations that makes it easy
 * to integrate FIDO2 and SMS MFA into applications.
 *
 * @example
 * const sdk = new P1MFASDK({
 *   environmentId: 'env-123',
 *   clientId: 'client-123',
 *   clientSecret: 'secret-123'
 * });
 *
 * // Register SMS device
 * const device = await sdk.registerSMSDevice({
 *   userId: 'user-123',
 *   phone: '+1234567890'
 * });
 */
import { workerTokenServiceV8 } from '@/v8/services/workerTokenServiceV8';
import { ConfigurationError, P1MFAError } from './errors';
import type {
	AuthenticationCompleteParams,
	AuthenticationInitParams,
	AuthenticationResult,
	Device,
	DeviceActivationParams,
	DeviceActivationResult,
	DeviceRegistrationParams,
	DeviceRegistrationResult,
	P1MFAConfig,
} from './types';

const MODULE_TAG = '[📦 P1MFA-SDK]';

/**
 * PingOne MFA SDK
 * Provides a simplified interface for PingOne MFA operations
 */
export class P1MFASDK {
	private config: P1MFAConfig | null = null;
	private workerToken: string | null = null;

	/**
	 * Initialize the SDK with configuration
	 */
	async initialize(config: P1MFAConfig): Promise<void> {
		console.log(`${MODULE_TAG} Initializing SDK`, { environmentId: config.environmentId });

		// Validate configuration
		if (!config.environmentId?.trim()) {
			throw new ConfigurationError('Environment ID is required');
		}
		if (!config.clientId?.trim()) {
			throw new ConfigurationError('Client ID is required');
		}
		if (!config.clientSecret?.trim()) {
			throw new ConfigurationError('Client Secret is required');
		}

		this.config = config;

		// Save credentials for worker token service
		await workerTokenServiceV8.saveCredentials({
			environmentId: config.environmentId,
			clientId: config.clientId,
			clientSecret: config.clientSecret,
			region: config.region,
			customDomain: config.customDomain,
			tokenEndpointAuthMethod: config.tokenEndpointAuthMethod || 'client_secret_post',
		});

		// Get worker token
		await this.getWorkerToken();
	}

	/**
	 * Get worker token (with caching)
	 * Exposed for helper methods that need it
	 */
	async getWorkerToken(): Promise<string> {
		if (this.workerToken) {
			return this.workerToken;
		}

		if (!this.config) {
			throw new ConfigurationError('SDK not initialized. Call initialize() first.');
		}

		const tokenData = await workerTokenServiceV8.getToken(this.config.environmentId);
		this.workerToken = tokenData.token;
		return this.workerToken;
	}

	/**
	 * Register a device (generic)
	 * Uses backend proxy endpoint for security (worker token handled server-side)
	 */
	async registerDevice(params: DeviceRegistrationParams): Promise<DeviceRegistrationResult> {
		if (!this.config) {
			throw new ConfigurationError('SDK not initialized. Call initialize() first.');
		}

		const token = await this.getWorkerToken();

		console.log(`${MODULE_TAG} Registering device`, {
			userId: params.userId,
			type: params.type,
		});

		const requestBody: Record<string, unknown> = {
			environmentId: this.config.environmentId,
			userId: params.userId,
			type: params.type,
			workerToken: token,
		};

		if (params.phone) {
			requestBody.phone = params.phone;
		}
		if (params.email) {
			requestBody.email = params.email;
		}
		if (params.name) {
			requestBody.name = params.name;
		}
		if (params.nickname) {
			requestBody.nickname = params.nickname;
		}
		if (params.status) {
			requestBody.status = params.status;
		}
		if (params.policy) {
			requestBody.policy =
				typeof params.policy === 'string' ? { id: params.policy } : params.policy;
		}
		if (params.rp) {
			requestBody.rp = params.rp;
		}

		try {
			// Use backend proxy endpoint - worker token sent to backend, not exposed in browser
			const response = await fetch('/api/pingone/mfa/register-device', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(requestBody),
			});

			if (!response.ok) {
				const error = await response.json().catch(() => ({ message: 'Unknown error' }));
				throw new P1MFAError(
					error.message || 'Device registration failed',
					error.code,
					response.status,
					error
				);
			}

			const responseData = (await response.json()) as Device & {
				publicKeyCredentialCreationOptions?: PublicKeyCredentialCreationOptions | string;
			};

			// Backend proxy may wrap response or return directly
			const device = (responseData as { device?: Device }).device || responseData;

			return {
				deviceId: device.id,
				userId: params.userId,
				status: device.status || 'ACTIVATION_REQUIRED',
				type: device.type,
				device,
				publicKeyCredentialCreationOptions:
					typeof device.publicKeyCredentialCreationOptions === 'string'
						? JSON.parse(device.publicKeyCredentialCreationOptions)
						: device.publicKeyCredentialCreationOptions,
			};
		} catch (error) {
			if (error instanceof P1MFAError) {
				throw error;
			}
			throw new P1MFAError(
				`Failed to register device: ${error instanceof Error ? error.message : 'Unknown error'}`,
				undefined,
				undefined,
				error
			);
		}
	}

	/**
	 * Activate a device
	 */
	async activateDevice(params: DeviceActivationParams): Promise<DeviceActivationResult> {
		if (!this.config) {
			throw new ConfigurationError('SDK not initialized. Call initialize() first.');
		}

		const token = await this.getWorkerToken();

		console.log(`${MODULE_TAG} Activating device`, {
			userId: params.userId,
			deviceId: params.deviceId,
		});

		const requestBody: Record<string, unknown> = {};

		if (params.otp) {
			requestBody.otp = params.otp;
		}

		if (params.fido2Credential) {
			// Extract FIDO2 credential data
			const response = params.fido2Credential.response;
			if (response instanceof AuthenticatorAttestationResponse) {
				requestBody.attestation = JSON.stringify({
					id: params.fido2Credential.id,
					rawId: Array.from(new Uint8Array(params.fido2Credential.rawId)),
					response: {
						clientDataJSON: Array.from(new Uint8Array(response.clientDataJSON)),
						attestationObject: Array.from(new Uint8Array(response.attestationObject)),
					},
					type: params.fido2Credential.type,
				});
			}
		}

		try {
			// Use backend proxy endpoint - worker token sent to backend, not exposed in browser
			const response = await fetch('/api/pingone/mfa/activate-device', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					environmentId: this.config.environmentId,
					userId: params.userId,
					deviceId: params.deviceId,
					workerToken: token,
					...requestBody,
				}),
			});

			if (!response.ok) {
				const error = await response.json().catch(() => ({ message: 'Unknown error' }));
				throw new P1MFAError(
					error.message || 'Device activation failed',
					error.code,
					response.status,
					error
				);
			}

			const responseData = (await response.json()) as Device | { device?: Device };

			// Backend proxy may wrap response or return directly
			const result = (responseData as { device?: Device }).device || (responseData as Device);

			return {
				deviceId: result.id,
				status: result.status || 'ACTIVE',
				message: 'Device activated successfully',
			};
		} catch (error) {
			if (error instanceof P1MFAError) {
				throw error;
			}
			throw new P1MFAError(
				`Failed to activate device: ${error instanceof Error ? error.message : 'Unknown error'}`,
				undefined,
				undefined,
				error
			);
		}
	}

	/**
	 * List user's devices
	 */
	async listDevices(userId: string): Promise<Device[]> {
		if (!this.config) {
			throw new ConfigurationError('SDK not initialized. Call initialize() first.');
		}

		const token = await this.getWorkerToken();

		console.log(`${MODULE_TAG} Listing devices`, { userId });

		try {
			// Use backend proxy endpoint - worker token sent to backend, not exposed in browser
			const response = await fetch('/api/pingone/mfa/get-all-devices', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					environmentId: this.config.environmentId,
					userId,
					workerToken: token,
				}),
			});

			if (!response.ok) {
				const error = await response.json().catch(() => ({ message: 'Unknown error' }));
				throw new P1MFAError(
					error.message || 'Failed to list devices',
					error.code,
					response.status,
					error
				);
			}

			const data = (await response.json()) as { _embedded?: { devices?: Device[] } };
			return data._embedded?.devices || [];
		} catch (error) {
			if (error instanceof P1MFAError) {
				throw error;
			}
			throw new P1MFAError(
				`Failed to list devices: ${error instanceof Error ? error.message : 'Unknown error'}`,
				undefined,
				undefined,
				error
			);
		}
	}

	/**
	 * Delete a device
	 */
	async deleteDevice(userId: string, deviceId: string): Promise<void> {
		if (!this.config) {
			throw new ConfigurationError('SDK not initialized. Call initialize() first.');
		}

		const token = await this.getWorkerToken();

		console.log(`${MODULE_TAG} Deleting device`, { userId, deviceId });

		try {
			// Use backend proxy endpoint - worker token sent to backend, not exposed in browser
			const response = await fetch('/api/pingone/mfa/delete-device', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					environmentId: this.config.environmentId,
					userId,
					deviceId,
					workerToken: token,
				}),
			});

			if (!response.ok) {
				const error = await response.json().catch(() => ({ message: 'Unknown error' }));
				throw new P1MFAError(
					error.message || 'Failed to delete device',
					error.code,
					response.status,
					error
				);
			}
		} catch (error) {
			if (error instanceof P1MFAError) {
				throw error;
			}
			throw new P1MFAError(
				`Failed to delete device: ${error instanceof Error ? error.message : 'Unknown error'}`,
				undefined,
				undefined,
				error
			);
		}
	}

	/**
	 * Initialize device authentication (MFA challenge)
	 */
	async initializeAuthentication(params: AuthenticationInitParams): Promise<AuthenticationResult> {
		if (!this.config) {
			throw new ConfigurationError('SDK not initialized. Call initialize() first.');
		}

		const token = await this.getWorkerToken();

		console.log(`${MODULE_TAG} Initializing authentication`, {
			userId: params.userId,
			deviceId: params.deviceId,
		});

		const requestBody: Record<string, unknown> = {
			user: { id: params.userId },
			deviceAuthenticationPolicy: { id: params.deviceAuthenticationPolicyId },
		};

		if (params.deviceId) {
			requestBody.device = { id: params.deviceId };
		}

		try {
			// Use backend proxy endpoint - worker token sent to backend, not exposed in browser
			const response = await fetch('/api/pingone/mfa/initialize-device-authentication', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					environmentId: this.config.environmentId,
					workerToken: token,
					...requestBody,
				}),
			});

			if (!response.ok) {
				const error = await response.json().catch(() => ({ message: 'Unknown error' }));
				throw new P1MFAError(
					error.message || 'Authentication initialization failed',
					error.code,
					response.status,
					error
				);
			}

			const responseData = (await response.json()) as
				| {
						id: string;
						status: string;
						_links?: Record<string, { href: string }>;
						challengeId?: string;
						[key: string]: unknown;
				  }
				| {
						deviceAuthentication?: {
							id: string;
							status: string;
							_links?: Record<string, { href: string }>;
							challengeId?: string;
						};
				  };

			// Backend proxy may wrap response or return directly
			const data =
				(responseData as { deviceAuthentication?: { id: string; status: string } })
					.deviceAuthentication || (responseData as { id: string; status: string });

			return {
				authenticationId: data.id,
				status: data.status,
				message: 'Authentication initialized',
			};
		} catch (error) {
			if (error instanceof P1MFAError) {
				throw error;
			}
			throw new P1MFAError(
				`Failed to initialize authentication: ${error instanceof Error ? error.message : 'Unknown error'}`,
				undefined,
				undefined,
				error
			);
		}
	}

	/**
	 * Complete device authentication
	 */
	async completeAuthentication(
		params: AuthenticationCompleteParams
	): Promise<AuthenticationResult> {
		if (!this.config) {
			throw new ConfigurationError('SDK not initialized. Call initialize() first.');
		}

		const token = await this.getWorkerToken();

		console.log(`${MODULE_TAG} Completing authentication`, {
			authenticationId: params.authenticationId,
		});

		const requestBody: Record<string, unknown> = {};

		if (params.otp) {
			requestBody.otp = params.otp;
		}

		if (params.fido2Assertion) {
			// Extract FIDO2 assertion data
			const response = params.fido2Assertion.response;
			if (response instanceof AuthenticatorAssertionResponse) {
				requestBody.assertion = JSON.stringify({
					id: params.fido2Assertion.id,
					rawId: Array.from(new Uint8Array(params.fido2Assertion.rawId)),
					response: {
						clientDataJSON: Array.from(new Uint8Array(response.clientDataJSON)),
						authenticatorData: Array.from(new Uint8Array(response.authenticatorData)),
						signature: Array.from(new Uint8Array(response.signature)),
						userHandle: response.userHandle
							? Array.from(new Uint8Array(response.userHandle))
							: null,
					},
					type: params.fido2Assertion.type,
				});
			}
		}

		try {
			// Use backend proxy endpoint - worker token sent to backend, not exposed in browser
			const response = await fetch('/api/pingone/mfa/complete', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					environmentId: this.config.environmentId,
					deviceAuthenticationId: params.authenticationId,
					workerToken: token,
					...requestBody,
				}),
			});

			if (!response.ok) {
				const error = await response.json().catch(() => ({ message: 'Unknown error' }));
				throw new P1MFAError(
					error.message || 'Authentication completion failed',
					error.code,
					response.status,
					error
				);
			}

			const data = (await response.json()) as {
				status: string;
				accessToken?: string;
				tokenType?: string;
				expiresIn?: number;
				[key: string]: unknown;
			};

			return {
				authenticationId: params.authenticationId,
				status: data.status,
				accessToken: data.accessToken,
				tokenType: data.tokenType,
				expiresIn: data.expiresIn,
				message: 'Authentication completed successfully',
			};
		} catch (error) {
			if (error instanceof P1MFAError) {
				throw error;
			}
			throw new P1MFAError(
				`Failed to complete authentication: ${error instanceof Error ? error.message : 'Unknown error'}`,
				undefined,
				undefined,
				error
			);
		}
	}
}
