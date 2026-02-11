/**
 * @file mfaAuthenticationService.ts
 * @module protect-portal/services
 * @description MFA authentication service using server proxy endpoints
 * @version 9.6.5
 * @since 2026-02-10
 *
 * This service handles MFA device discovery and authentication using the existing
 * server.js proxy endpoints to avoid CORS issues when calling PingOne APIs from localhost.
 */

import type {
	MFADevice,
	MFADeviceType,
	PortalError,
	ServiceResponse,
	TokenSet,
	UserContext,
} from '../types/protectPortal.types';

// ============================================================================
// SERVICE CONFIGURATION
// ============================================================================

const MODULE_TAG = '[🔐 MFA-AUTHENTICATION]';
const PROXY_BASE_URL = '/api/pingone' as const;

// ============================================================================
// INTERFACES
// ============================================================================

export interface MFAServiceCredentials {
	environmentId: string;
	accessToken: string; // User's access token from login
	region: 'us' | 'eu' | 'ap' | 'ca';
}

export interface AuthenticationRequest {
	device: {
		id: string;
		type: MFADeviceType;
	};
	user: {
		id: string;
		name?: string | undefined;
	};
	context: {
		flow: {
			type: 'AUTHENTICATION';
			subtype: string;
		};
		origin?: string;
		timestamp?: string;
	};
}

export interface AuthenticationResponse {
	requiresChallenge: boolean;
	challengeData?: {
		type: string;
		message: string;
		timeout?: number;
	};
	tokens?: TokenSet;
}

export interface DeviceListResponse {
	devices: MFADevice[];
	total: number;
}

// ============================================================================
// MFA AUTHENTICATION SERVICE
// ============================================================================

class MFAAuthenticationService {
	/**
	 * Get available MFA devices for a user
	 */
	static async getAvailableDevices(
		userContext: UserContext,
		credentials: MFAServiceCredentials
	): Promise<ServiceResponse<DeviceListResponse>> {
		try {
			console.log(`${MODULE_TAG} Fetching MFA devices for user:`, userContext.id);

			const response = await fetch(`${PROXY_BASE_URL}/user/${userContext.id}/devices`, {
				method: 'GET',
				headers: {
					Accept: 'application/json',
					Authorization: `Bearer ${credentials.accessToken}`,
				},
			});

			if (!response.ok) {
				throw new Error(`Proxy API error: ${response.status} ${response.statusText}`);
			}

			const devices = await response.json();

			console.log(`${MODULE_TAG} Retrieved ${devices.length} MFA devices`);

			return {
				success: true,
				data: {
					devices,
					total: devices.length,
				},
				metadata: {
					timestamp: new Date().toISOString(),
					requestId: `devices-${Date.now()}`,
					processingTime: 0,
				},
			};
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to fetch MFA devices:`, error);

			const portalError: PortalError = {
				code: 'MFA_DEVICES_FETCH_FAILED',
				message: error instanceof Error ? error.message : 'Failed to fetch MFA devices',
				recoverable: true,
				suggestedAction: 'Please try again',
			};

			return {
				success: false,
				error: portalError,
				metadata: {
					timestamp: new Date().toISOString(),
					requestId: `devices-${Date.now()}`,
					processingTime: 0,
				},
			};
		}
	}

	/**
	 * Initiate MFA authentication with a device
	 */
	static async initiateAuthentication(
		userContext: UserContext,
		device: MFADevice,
		credentials: MFAServiceCredentials,
		loginContext: { flowSubtype: string }
	): Promise<ServiceResponse<AuthenticationResponse>> {
		try {
			console.log(`${MODULE_TAG} Initiating MFA authentication for device:`, device.id);

			const authRequest: AuthenticationRequest = {
				device: {
					id: device.id,
					type: device.type,
				},
				user: {
					id: userContext.id,
					name: userContext.name,
				},
				context: {
					flow: {
						type: 'AUTHENTICATION',
						subtype: loginContext.flowSubtype,
					},
					origin: loginContext.origin,
					timestamp: loginContext.timestamp,
				},
			};

			// Call proxy endpoint for MFA authentication initiation
			const response = await fetch(
				`${PROXY_BASE_URL}/user/${userContext.id}/devices/${device.id}/authenticate`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${credentials.accessToken}`,
					},
					body: JSON.stringify(authRequest),
				}
			);

			if (!response.ok) {
				throw new Error(`Proxy API error: ${response.status} ${response.statusText}`);
			}

			const authResponse = await response.json();

			console.log(`${MODULE_TAG} MFA authentication initiated`, {
				requiresChallenge: authResponse.requiresChallenge,
				challengeType: authResponse.challengeData?.type,
			});

			return {
				success: true,
				data: authResponse,
				metadata: {
					timestamp: new Date().toISOString(),
					requestId: `auth-${Date.now()}`,
					processingTime: 0,
				},
			};
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to initiate MFA authentication:`, error);

			const portalError: PortalError = {
				code: 'MFA_INITIATION_FAILED',
				message: error instanceof Error ? error.message : 'Failed to initiate MFA authentication',
				recoverable: true,
				suggestedAction: 'Please try again',
			};

			return {
				success: false,
				error: portalError,
				metadata: {
					timestamp: new Date().toISOString(),
					requestId: `auth-${Date.now()}`,
					processingTime: 0,
				},
			};
		}
	}

	/**
	 * Complete MFA authentication with challenge response
	 */
	static async completeAuthentication(
		userContext: UserContext,
		device: MFADevice,
		challengeResponse: string,
		credentials: MFAServiceCredentials
	): Promise<ServiceResponse<TokenSet>> {
		try {
			console.log(`${MODULE_TAG} Completing MFA authentication for device:`, device.id);

			const completeRequest = {
				device: {
					id: device.id,
					type: device.type,
				},
				challengeResponse: challengeResponse,
			};

			// Call proxy endpoint for MFA authentication completion
			const response = await fetch(
				`${PROXY_BASE_URL}/user/${userContext.id}/devices/${device.id}/complete`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${credentials.accessToken}`,
					},
					body: JSON.stringify(completeRequest),
				}
			);

			if (!response.ok) {
				throw new Error(`Proxy API error: ${response.status} ${response.statusText}`);
			}

			const result = await response.json();

			console.log(`${MODULE_TAG} MFA authentication completed successfully`);

			return {
				success: true,
				data: result.tokens || result,
				metadata: {
					timestamp: new Date().toISOString(),
					requestId: `complete-${Date.now()}`,
					processingTime: 0,
				},
			};
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to complete MFA authentication:`, error);

			const portalError: PortalError = {
				code: 'MFA_COMPLETION_FAILED',
				message: error instanceof Error ? error.message : 'Failed to complete MFA authentication',
				recoverable: true,
				suggestedAction: 'Please try again',
			};

			return {
				success: false,
				error: portalError,
				metadata: {
					timestamp: new Date().toISOString(),
					requestId: `complete-${Date.now()}`,
					processingTime: 0,
				},
			};
		}
	}

	/**
	 * Map API device type to internal device type
	 */
	private static mapDeviceType(apiType: string): MFADeviceType {
		const typeMap: Record<string, MFADeviceType> = {
			otp: 'OTP',
			push: 'PUSH',
			fido2: 'FIDO2',
			voice: 'VOICE',
			sms: 'SMS',
			email: 'EMAIL',
		};

		return typeMap[apiType] || 'UNKNOWN';
	}

	/**
	 * Get error type from error
	 */
	private static getErrorType(error: unknown): string {
		if (error instanceof Error) {
			if (error.message.includes('401')) return 'AUTHENTICATION_ERROR';
			if (error.message.includes('403')) return 'AUTHORIZATION_ERROR';
			if (error.message.includes('404')) return 'NOT_FOUND_ERROR';
			if (error.message.includes('429')) return 'RATE_LIMIT_ERROR';
			if (error.message.includes('500')) return 'SERVICE_ERROR';
			if (error.message.includes('network')) return 'NETWORK_ERROR';
		}
		return 'UNKNOWN_ERROR';
	}
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default MFAAuthenticationService;
