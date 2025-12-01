/**
 * @file mfaAuthenticationServiceV8.ts
 * @module v8/services
 * @description PingOne MFA v1 authentication service - handles device authentication flows only
 * @version 8.0.0
 * @since 2024-11-30
 *
 * Implements PingOne MFA v1 API for authentication ONLY:
 * - POST /mfa/v1/environments/{envId}/deviceAuthentications
 * - Follow all _links (otp.check, challenge.poll, device.update, complete)
 * - Handle OTP, Push, WebAuthn, Polling, MFA completion
 *
 * STRICTLY uses MFA v1 APIs - NO Platform APIs
 * API Reference: https://apidocs.pingidentity.com/pingone/mfa/v1/api/
 *
 * @example
 * const result = await MfaAuthenticationServiceV8.initializeDeviceAuthentication({
 *   environmentId: 'xxx',
 *   username: 'john.doe',
 *   deviceAuthenticationPolicyId: 'policy-123'
 * });
 */

import { pingOneFetch } from '@/utils/pingOneFetch';
import { workerTokenServiceV8 } from './workerTokenServiceV8';

const MODULE_TAG = '[🔐 MFA-AUTHENTICATION-SERVICE-V8]';

export interface AuthenticationCredentials {
	environmentId: string;
	username?: string; // Optional - can use userId instead
	userId?: string; // Optional - can use username instead (will be looked up)
	deviceAuthenticationPolicyId: string;
}

export interface DeviceAuthenticationInitParams extends AuthenticationCredentials {
	deviceId?: string; // Optional: target specific device immediately (Phase 1)
}

/**
 * Phase 2: One-time device authentication parameters
 * Used when contact details (email/phone) are stored in our DB, not in PingOne
 */
export interface OneTimeDeviceAuthenticationParams extends AuthenticationCredentials {
	type: 'EMAIL' | 'SMS';
	email?: string; // Required for EMAIL type
	phone?: string; // Required for SMS type
}

export interface DeviceAuthenticationResponse {
	id: string;
	status: string;
	nextStep?: string;
	devices?: Array<{ id: string; type: string; nickname?: string }>;
	challengeId?: string;
	_links?: Record<string, { href: string }>;
	[key: string]: unknown;
}

export interface OTPValidationParams {
	environmentId: string;
	username?: string; // Optional - can use userId instead
	userId?: string; // Optional - can use username instead
	authenticationId: string;
	otp: string;
	otpCheckUrl?: string; // From _links.otp.check.href
}

export interface OTPValidationResult {
	status: string;
	message?: string;
	valid: boolean;
	_links?: Record<string, { href: string }>;
}

export interface DeviceSelectionParams {
	environmentId: string;
	username: string;
	userId?: string; // Optional - will be looked up if not provided
	authenticationId: string;
	deviceId: string;
}

export interface WebAuthnAuthenticationParams {
	environmentId: string;
	username: string;
	authenticationId: string;
	challengeId: string;
}

export interface AuthenticationCompletionResult {
	status: 'COMPLETED' | 'FAILED' | 'PENDING';
	message?: string;
	accessToken?: string;
	tokenType?: string;
	expiresIn?: number;
	[key: string]: unknown;
}

/**
 * PingOne MFA v1 Authentication Service
 * Handles device authentication flows using MFA v1 APIs only
 */
export class MfaAuthenticationServiceV8 {
	/**
	 * Initialize device authentication
	 * POST /mfa/v1/environments/{environmentId}/users/{userId}/deviceAuthentications
	 * API Reference: https://apidocs.pingidentity.com/pingone/mfa/v1/api/#post-initialize-device-authentication
	 */
	static async initializeDeviceAuthentication(
		params: DeviceAuthenticationInitParams
	): Promise<DeviceAuthenticationResponse> {
		console.log(`${MODULE_TAG} Initializing device authentication`, {
			username: params.username,
			policyId: params.deviceAuthenticationPolicyId,
			deviceId: params.deviceId,
		});

		try {
			const cleanToken = await MfaAuthenticationServiceV8.getWorkerTokenWithAutoRenew();

			// Get userId - use provided userId or look up by username
			let userId: string;
			if (params.userId) {
				userId = params.userId;
			} else if (params.username) {
				const { MFAServiceV8 } = await import('./mfaServiceV8');
				const user = await MFAServiceV8.lookupUserByUsername(params.environmentId, params.username);
				userId = user.id as string;
			} else {
				throw new Error('Either username or userId must be provided');
			}

			// Use backend proxy endpoint to avoid CORS violations
			const response = await fetch('/api/pingone/mfa/initialize-device-authentication', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					environmentId: params.environmentId,
					userId,
					deviceId: params.deviceId,
					deviceAuthenticationPolicyId: params.deviceAuthenticationPolicyId,
					workerToken: cleanToken,
				}),
			});

			if (!response.ok) {
				const errorText = await response.text();
				let errorData: unknown = {};
				try {
					errorData = JSON.parse(errorText);
				} catch {
					errorData = { error: errorText };
				}
				console.error(`${MODULE_TAG} Failed to initialize device authentication`, {
					status: response.status,
					statusText: response.statusText,
					errorData,
				});
				throw new Error(
					`Failed to initialize device authentication: ${response.status} ${response.statusText}`
				);
			}

			const data = await response.json();
			console.log(`${MODULE_TAG} Device authentication initialized`, {
				authenticationId: data.id,
				status: data.status,
				nextStep: data.nextStep,
				hasLinks: !!data._links,
			});

			return data;
		} catch (error) {
			console.error(`${MODULE_TAG} Error initializing device authentication`, error);
			throw error;
		}
	}

	/**
	 * Phase 2: Initialize one-time device authentication
	 * POST {{authPath}}/{{ENV_ID}}/deviceAuthentications
	 * Uses selectedDevice.oneTime instead of selectedDevice.id
	 * API Reference: https://apidocs.pingidentity.com/pingone/mfa/v1/api/#post-initialize-device-authentication
	 */
	static async initializeOneTimeDeviceAuthentication(
		params: OneTimeDeviceAuthenticationParams
	): Promise<DeviceAuthenticationResponse> {
		console.log(`${MODULE_TAG} Initializing one-time device authentication (Phase 2)`, {
			username: params.username,
			policyId: params.deviceAuthenticationPolicyId,
			type: params.type,
			hasEmail: !!params.email,
			hasPhone: !!params.phone,
		});

		// Validate required fields based on type
		if (params.type === 'EMAIL' && !params.email) {
			throw new Error('Email is required for EMAIL type one-time device authentication');
		}
		if (params.type === 'SMS' && !params.phone) {
			throw new Error('Phone is required for SMS type one-time device authentication');
		}

		try {
			const cleanToken = await MfaAuthenticationServiceV8.getWorkerTokenWithAutoRenew();

			// Get userId - use provided userId or look up by username
			let userId: string;
			if (params.userId) {
				userId = params.userId;
			} else if (params.username) {
				const { MFAServiceV8 } = await import('./mfaServiceV8');
				const user = await MFAServiceV8.lookupUserByUsername(params.environmentId, params.username);
				userId = user.id as string;
			} else {
				throw new Error('Either username or userId must be provided');
			}

			// Use backend proxy endpoint to avoid CORS violations
			const response = await fetch('/api/pingone/mfa/initialize-device-authentication', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					environmentId: params.environmentId,
					userId,
					deviceAuthenticationPolicyId: params.deviceAuthenticationPolicyId,
					workerToken: cleanToken,
					// Phase 2: one-time device data
					oneTimeDevice: {
						type: params.type,
						email: params.email,
						phone: params.phone,
					},
				}),
			});

			if (!response.ok) {
				const errorText = await response.text();
				let errorData: unknown = {};
				try {
					errorData = JSON.parse(errorText);
				} catch {
					errorData = { error: errorText };
				}
				console.error(`${MODULE_TAG} Failed to initialize one-time device authentication`, {
					status: response.status,
					statusText: response.statusText,
					errorData,
				});
				throw new Error(
					`Failed to initialize one-time device authentication: ${response.status} ${response.statusText}`
				);
			}

			const data = await response.json();
			console.log(`${MODULE_TAG} One-time device authentication initialized`, {
				authenticationId: data.id,
				status: data.status,
				nextStep: data.nextStep,
				hasLinks: !!data._links,
			});

			return data;
		} catch (error) {
			console.error(`${MODULE_TAG} Error initializing one-time device authentication`, error);
			throw error;
		}
	}

	/**
	 * Read device authentication status
	 * GET /mfa/v1/environments/{environmentId}/users/{userId}/deviceAuthentications/{authenticationId}
	 */
	static async readDeviceAuthentication(
		environmentId: string,
		usernameOrUserId: string,
		authenticationId: string,
		options?: { isUserId?: boolean }
	): Promise<DeviceAuthenticationResponse> {
		console.log(`${MODULE_TAG} Reading device authentication status`, { authenticationId, isUserId: options?.isUserId });

		try {
			const cleanToken = await MfaAuthenticationServiceV8.getWorkerTokenWithAutoRenew();

			// If not explicitly marked as userId, check if it looks like a UUID (userId) or treat as username
			let userId: string;
			if (options?.isUserId) {
				userId = usernameOrUserId;
			} else {
				// Check if it's a UUID (userId format) or username
				const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
				if (uuidRegex.test(usernameOrUserId)) {
					userId = usernameOrUserId;
				} else {
					// Look up userId from username
					const { MFAServiceV8 } = await import('./mfaServiceV8');
					const user = await MFAServiceV8.lookupUserByUsername(environmentId, usernameOrUserId);
					userId = user.id as string;
				}
			}

			const response = await pingOneFetch(
				`/mfa/v1/environments/${environmentId}/users/${encodeURIComponent(userId)}/deviceAuthentications/${authenticationId}`,
				{
					method: 'GET',
					headers: {
						Authorization: `Bearer ${cleanToken}`,
					},
					retry: { maxAttempts: 3 },
				}
			);

			if (!response.ok) {
				throw new Error(`Failed to read device authentication: ${response.status} ${response.statusText}`);
			}

			const data = await response.json();
			console.log(`${MODULE_TAG} Device authentication status read`, {
				status: data.status,
				nextStep: data.nextStep,
			});

			return data;
		} catch (error) {
			console.error(`${MODULE_TAG} Error reading device authentication`, error);
			throw error;
		}
	}

	/**
	 * Select device for authentication (when multiple devices available)
	 * POST /mfa/v1/environments/{environmentId}/users/{userId}/deviceAuthentications/{authenticationId}/devices/{deviceId}
	 */
	static async selectDeviceForAuthentication(
		params: DeviceSelectionParams
	): Promise<DeviceAuthenticationResponse> {
		console.log(`${MODULE_TAG} Selecting device for authentication`, {
			authenticationId: params.authenticationId,
			deviceId: params.deviceId,
			username: params.username,
			userId: params.userId,
		});

		try {
			const cleanToken = await MfaAuthenticationServiceV8.getWorkerTokenWithAutoRenew();

			// Lookup userId if not provided (API requires userId, not username in path)
			let userId = params.userId;
			if (!userId && params.username) {
				const { MFAServiceV8 } = await import('./mfaServiceV8');
				const user = await MFAServiceV8.lookupUserByUsername(params.environmentId, params.username);
				userId = user.id as string;
				console.log(`${MODULE_TAG} Looked up userId for username:`, { username: params.username, userId });
			}

			if (!userId) {
				throw new Error('userId is required. Please provide userId or username to lookup.');
			}

			const response = await pingOneFetch(
				'/api/pingone/mfa/select-device',
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						environmentId: params.environmentId,
						deviceAuthId: params.authenticationId,
						deviceId: params.deviceId,
						workerToken: cleanToken,
					}),
					retry: { maxAttempts: 3 },
				}
			);

			if (!response.ok) {
				const errorText = await response.text().catch(() => '');
				throw new Error(`Failed to select device: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ''}`);
			}

			const data = await response.json();
			console.log(`${MODULE_TAG} Device selected for authentication`, {
				status: data.status,
				nextStep: data.nextStep,
			});

			return data;
		} catch (error) {
			console.error(`${MODULE_TAG} Error selecting device for authentication`, error);
			throw error;
		}
	}

	/**
	 * Validate OTP using _links.otp.check or direct endpoint
	 * Follows PingOne MFA v1 API exactly
	 */
	/**
	 * Get worker token with automatic renewal if expired
	 * Checks if token exists, and if not, attempts to renew it using stored credentials
	 */
	private static async getWorkerTokenWithAutoRenew(): Promise<string> {
		let workerToken = await workerTokenServiceV8.getToken();
		
		// If token is missing or expired, try to renew it
		if (!workerToken) {
			console.log(`${MODULE_TAG} Token missing or expired, attempting automatic renewal...`);
			const credentials = await workerTokenServiceV8.loadCredentials();
			
			if (!credentials) {
				throw new Error('Worker token not found. Please generate a worker token first.');
			}
			
			// Attempt to issue a new token using stored credentials
			try {
				const region = credentials.region || 'us';
				const apiBase = 
					region === 'eu' ? 'https://auth.pingone.eu' :
					region === 'ap' ? 'https://auth.pingone.asia' :
					region === 'ca' ? 'https://auth.pingone.ca' :
					'https://auth.pingone.com';
				
				const tokenEndpoint = `${apiBase}/${credentials.environmentId}/as/token`;
				const defaultScopes = ['mfa:device:manage', 'mfa:device:read'];
				const scopeList = credentials.scopes;
				const normalizedScopes: string[] = Array.isArray(scopeList) && scopeList.length > 0
					? scopeList 
					: defaultScopes;
				
				const params = new URLSearchParams({
					grant_type: 'client_credentials',
					client_id: credentials.clientId,
					scope: normalizedScopes.join(' '),
				});
				
				const headers: Record<string, string> = {
					'Content-Type': 'application/x-www-form-urlencoded',
				};
				
				const authMethod = credentials.tokenEndpointAuthMethod || 'client_secret_post';
				if (authMethod === 'client_secret_post') {
					params.set('client_secret', credentials.clientSecret);
				} else if (authMethod === 'client_secret_basic') {
					const basicAuth = btoa(`${credentials.clientId}:${credentials.clientSecret}`);
					headers.Authorization = `Basic ${basicAuth}`;
				}
				
				console.log(`${MODULE_TAG} Renewing worker token...`);
				const response = await fetch(tokenEndpoint, {
					method: 'POST',
					headers,
					body: params.toString(),
				});
				
				if (!response.ok) {
					const errorText = await response.text();
					throw new Error(`Token renewal failed: ${response.status} ${response.statusText} - ${errorText.substring(0, 200)}`);
				}
				
				const data = await response.json();
				const newToken = data.access_token;
				const expiresAt = data.expires_in ? Date.now() + data.expires_in * 1000 : undefined;
				
				await workerTokenServiceV8.saveToken(newToken, expiresAt);
				console.log(`${MODULE_TAG} Worker token renewed successfully`);
				
				// Dispatch event for status update
				window.dispatchEvent(new Event('workerTokenUpdated'));
				
				workerToken = newToken;
			} catch (renewError) {
				console.error(`${MODULE_TAG} Failed to renew token automatically:`, renewError);
				throw new Error(`Worker token expired and automatic renewal failed: ${renewError instanceof Error ? renewError.message : 'Unknown error'}. Please generate a new worker token.`);
			}
		}
		
		if (!workerToken) {
			throw new Error('Worker token not found. Please generate a worker token first.');
		}
		
		return workerToken.trim().replace(/^Bearer\s+/i, '');
	}

	static async validateOTP(params: OTPValidationParams): Promise<OTPValidationResult> {
		console.log(`${MODULE_TAG} Validating OTP`, {
			authenticationId: params.authenticationId,
			hasOtpCheckUrl: !!params.otpCheckUrl,
		});

		try {
			const cleanToken = await MfaAuthenticationServiceV8.getWorkerTokenWithAutoRenew();

			let endpoint: string;
			let contentType: string;

			if (params.otpCheckUrl) {
				// Use the URL from PingOne's _links response
				endpoint = params.otpCheckUrl;
				contentType = 'application/vnd.pingidentity.otp.check+json';
				console.log(`${MODULE_TAG} Using otp.check URL from _links:`, endpoint);
			} else {
				// Get userId - use provided userId or look up by username
				let userId: string;
				if (params.userId) {
					userId = params.userId;
				} else if (params.username) {
					const { MFAServiceV8 } = await import('./mfaServiceV8');
					const user = await MFAServiceV8.lookupUserByUsername(params.environmentId, params.username);
					userId = user.id as string;
				} else {
					throw new Error('Either username or userId must be provided');
				}
				
				// Fallback to direct endpoint
				endpoint = `/mfa/v1/environments/${params.environmentId}/users/${encodeURIComponent(
					userId
				)}/deviceAuthentications/${params.authenticationId}/otp`;
				contentType = 'application/json';
			}

			const response = await pingOneFetch(endpoint, {
				method: 'POST',
				headers: {
					'Content-Type': contentType,
					Authorization: `Bearer ${cleanToken}`,
				},
				body: JSON.stringify({
					otp: params.otp,
				}),
				retry: { maxAttempts: 3 },
			});

			if (!response.ok) {
				const errorText = await response.text();
				console.error(`${MODULE_TAG} OTP validation failed`, {
					status: response.status,
					statusText: response.statusText,
					errorText,
				});

				// Parse error for attempts remaining
				let attemptsRemaining: number | undefined;
				try {
					const errorData = JSON.parse(errorText);
					attemptsRemaining = errorData.details?.[0]?.innerError?.attemptsRemaining;
				} catch {
					// Ignore JSON parse errors
				}

				const otpError = new Error(`OTP validation failed: ${response.status} ${response.statusText}`) as Error & {
					attemptsRemaining?: number;
				};
				if (attemptsRemaining !== undefined) {
					otpError.attemptsRemaining = attemptsRemaining;
				}
				throw otpError;
			}

			const data = await response.json();
			const result: OTPValidationResult = {
				status: data.status || 'UNKNOWN',
				message: data.message,
				valid: data.status === 'COMPLETED',
				_links: data._links,
			};

			console.log(`${MODULE_TAG} OTP validation result`, {
				valid: result.valid,
				status: result.status,
				hasLinks: !!result._links,
			});

			return result;
		} catch (error) {
			console.error(`${MODULE_TAG} Error validating OTP`, error);
			throw error;
		}
	}

	/**
	 * Poll for authentication completion (follow _links.challenge.poll)
	 * Used for Push notifications and WebAuthn challenges
	 */
	static async pollAuthenticationStatus(
		pollUrl: string
	): Promise<DeviceAuthenticationResponse> {
		console.log(`${MODULE_TAG} Polling authentication status`, { pollUrl });

		try {
			const cleanToken = await MfaAuthenticationServiceV8.getWorkerTokenWithAutoRenew();

			const response = await pingOneFetch(pollUrl, {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${cleanToken}`,
				},
				retry: { maxAttempts: 3 },
			});

			if (!response.ok) {
				throw new Error(`Failed to poll authentication status: ${response.status} ${response.statusText}`);
			}

			const data = await response.json();
			console.log(`${MODULE_TAG} Authentication status polled`, {
				status: data.status,
				nextStep: data.nextStep,
			});

			return data;
		} catch (error) {
			console.error(`${MODULE_TAG} Error polling authentication status`, error);
			throw error;
		}
	}

	/**
	 * Complete authentication (follow _links.complete)
	 * Exchange successful authentication for tokens
	 */
	static async completeAuthentication(
		completeUrl: string
	): Promise<AuthenticationCompletionResult> {
		console.log(`${MODULE_TAG} Completing authentication`, { completeUrl });

		try {
			const cleanToken = await MfaAuthenticationServiceV8.getWorkerTokenWithAutoRenew();

			const response = await pingOneFetch(completeUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${cleanToken}`,
				},
				body: JSON.stringify({}),
				retry: { maxAttempts: 3 },
			});

			if (!response.ok) {
				throw new Error(`Failed to complete authentication: ${response.status} ${response.statusText}`);
			}

			const data = await response.json();
			console.log(`${MODULE_TAG} Authentication completed`, {
				hasAccessToken: !!data.access_token,
				tokenType: data.token_type,
				expiresIn: data.expires_in,
			});

			return {
				status: 'COMPLETED',
				accessToken: data.access_token,
				tokenType: data.token_type,
				expiresIn: data.expires_in,
				...data,
			};
		} catch (error) {
			console.error(`${MODULE_TAG} Error completing authentication`, error);
			throw error;
		}
	}

	/**
	 * Cancel device authentication
	 * POST /mfa/v1/environments/{environmentId}/users/{userId}/deviceAuthentications/{authenticationId}/cancel
	 */
	static async cancelDeviceAuthentication(
		environmentId: string,
		username: string,
		authenticationId: string
	): Promise<{ status: string; [key: string]: unknown }> {
		console.log(`${MODULE_TAG} Canceling device authentication`, { authenticationId });

		try {
			const cleanToken = await MfaAuthenticationServiceV8.getWorkerTokenWithAutoRenew();

			const response = await pingOneFetch(
				`/mfa/v1/environments/${environmentId}/users/${encodeURIComponent(
					username
				)}/deviceAuthentications/${authenticationId}/cancel`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${cleanToken}`,
					},
					body: JSON.stringify({}),
					retry: { maxAttempts: 3 },
				}
			);

			if (!response.ok) {
				throw new Error(`Failed to cancel device authentication: ${response.status} ${response.statusText}`);
			}

			const data = await response.json();
			console.log(`${MODULE_TAG} Device authentication canceled`, { status: data.status });

			return data;
		} catch (error) {
			console.error(`${MODULE_TAG} Error canceling device authentication`, error);
			throw error;
		}
	}

	/**
	 * Extract _links from response and return available actions
	 */
	static extractAvailableLinks(response: { _links?: Record<string, { href: string }> }): {
		otpCheck?: string;
		challengePoll?: string;
		deviceUpdate?: string;
		complete?: string;
		cancel?: string;
	} {
		const links = response._links || {};
		
		return {
			otpCheck: links['otp.check']?.href,
			challengePoll: links['challenge.poll']?.href,
			deviceUpdate: links['device.update']?.href,
			complete: links.complete?.href,
			cancel: links.cancel?.href,
		};
	}
}

export default MfaAuthenticationServiceV8;
