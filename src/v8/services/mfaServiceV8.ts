/**
 * @file mfaServiceV8.ts
 * @module v8/services
 * @description PingOne Platform API service for device registration ONLY
 * @version 8.0.0
 * @since 2024-11-19
 *
 * Implements PingOne Platform APIs for device registration ONLY:
 * - Device registration (SMS, Email, TOTP, FIDO2, Voice, WhatsApp, Mobile, Platform, Security Key)
 * - Device activation via Platform APIs
 * - Device management via Platform APIs
 *
 * ⚠️ DEPRECATION NOTICE: Authentication methods are being moved to MfaAuthenticationServiceV8
 * - New code should use MfaAuthenticationServiceV8 for authentication flows
 * - Authentication methods in this class will be removed in future versions
 *
 * Uses WorkerTokenServiceV8 for authentication
 *
 * Platform API Reference: https://apidocs.pingidentity.com/pingone/platform/v1/api/#top
 * MFA v1 API Reference: https://apidocs.pingidentity.com/pingone/mfa/v1/api/
 *
 * @example
 * const result = await MFAServiceV8.registerDevice({
 *   environmentId: 'xxx',
 *   username: 'john.doe',
 *   type: 'SMS',
 *   phone: '+1234567890'
 * });
 */

import { apiCallTrackerService } from '@/services/apiCallTrackerService';
import { pingOneFetch } from '@/utils/pingOneFetch';
import type { DeviceAuthenticationPolicy } from '@/v8/flows/shared/MFATypes';
import { workerTokenServiceV8 } from './workerTokenServiceV8';
import { WorkerTokenStatusServiceV8 } from './workerTokenStatusServiceV8';

const MODULE_TAG = '[📱 MFA-SERVICE-V8]';

export interface MFACredentials {
	environmentId: string;
	username: string;
}

interface PingOneResponse {
	id?: string;
	status?: string;
	message?: string;
	error?: string;
	error_description?: string;
	type?: string;
	phone?: string;
	email?: string;
	access_token?: string;
	expires_in?: number;
	username?: string;
	[key: string]: unknown;
}

interface PingOneErrorDetail {
	code?: string;
	target?: string;
	message?: string;
	innerError?: {
		attemptsRemaining?: number;
		[key: string]: unknown;
	};
	[key: string]: unknown;
}

interface OTPValidationError extends Error {
	status?: number;
	code?: string;
	details?: PingOneErrorDetail[] | unknown;
	attemptsRemaining?: number;
	pingResponse?: unknown;
}

export interface RegisterDeviceParams extends MFACredentials {
	type:
		| 'SMS'
		| 'EMAIL'
		| 'TOTP'
		| 'FIDO2'
		| 'MOBILE'
		| 'OATH_TOKEN'
		| 'VOICE'
		| 'WHATSAPP';
	phone?: string; // Required for SMS, VOICE, WHATSAPP
	email?: string; // Required for EMAIL
	name?: string;
	nickname?: string;
	status?: 'ACTIVE' | 'ACTIVATION_REQUIRED'; // Device status: ACTIVE (pre-paired) or ACTIVATION_REQUIRED (user must activate)
	notification?: {
		// Custom device pairing notification (only applicable when status is ACTIVATION_REQUIRED for SMS, Voice, Email)
		// See: https://apidocs.pingidentity.com/pingone/mfa/v1/api/#enable-users-mfa
		message?: string;
		variant?: string;
	};
	policy?: string | { id: string }; // Device Authentication Policy ID as string or object with id (required for TOTP to get secret and keyUri)
	// See: totp.md section 1.1 and https://apidocs.pingidentity.com/pingone/mfa/v1/api/#post-create-mfa-user-device-fido2
	// FIDO2-specific fields
	rp?: {
		id: string; // Relying Party ID (e.g., "localhost" for localhost:3000, or "example.com" for production)
		name: string; // Relying Party name (e.g., "My App" or "PingOne")
	};
	credentialId?: string;
	publicKey?: string;
	attestationObject?: string;
	clientDataJSON?: string;
}

export interface SendOTPParams extends MFACredentials {
	deviceId: string;
}

export interface ActivateDeviceParams extends MFACredentials {
	deviceId: string;
	otp: string; // OTP code required for device activation (Phase 1 spec)
	deviceActivateUri?: string; // Per rightOTP.md: Use the exact activation URI returned by PingOne if available
}

interface ActivateFIDO2DeviceParams extends SendOTPParams {
	fido2Data?: {
		credentialId?: string;
		clientDataJSON?: string;
		attestationObject?: string;
		attestation?: string; // Full PublicKeyCredential object as JSON string (required by PingOne API)
		[key: string]: unknown;
	};
}

export interface ValidateOTPParams extends MFACredentials {
	deviceId: string;
	otp: string;
}

export interface DeviceRegistrationResult {
	deviceId: string;
	userId: string;
	status: string;
	type: string;
	phone?: string;
	email?: string;
	nickname?: string;
	environmentId?: string;
	createdAt?: string;
	updatedAt?: string;
	message?: string;
	// FIDO2-specific: publicKeyCredentialCreationOptions returned by PingOne (per rightFIDO2.md)
	publicKeyCredentialCreationOptions?: string;
	fido2Result?: {
		credentialId?: string;
		clientDataJSON?: string;
		attestationObject?: string;
		publicKey?: string;
	};
	totpResult?: {
		qrCode?: string;
		secret?: string;
		manualEntryKey?: string;
	};
}

export interface OTPValidationResult {
	status: string;
	message?: string;
	valid: boolean;
}

export interface MFASettings {
	pairing?: {
		maxAllowedDevices?: number;
		pairingKeyFormat?: 'NUMERIC' | 'QR_CODE' | 'ALPHANUMERIC' | string;
		pairingKeyLength?: number;
		pairingKeyDigits?: number;
		pairingTimeoutMinutes?: number;
	};
	lockout?: {
		failureCount?: number;
		durationSeconds?: number;
		progressiveLockoutEnabled?: boolean;
		resetDurationSeconds?: number;
	};
	otp?: {
		otpLength?: number;
		otpValiditySeconds?: number;
		otpExpirySeconds?: number;
		allowBackupCodes?: boolean;
		hashAlgorithm?: 'SHA1' | 'SHA256' | 'SHA512' | string;
	};
	rememberMe?: {
		web?: {
			enabled?: boolean;
			maxAgeSeconds?: number;
			[key: string]: unknown;
		};
		[key: string]: unknown;
	};
	[key: string]: unknown;
}

export interface UserLookupResult {
	id: string;
	username: string;
	email?: string;
	name?: {
		given?: string;
		family?: string;
	};
	account?: {
		locked?: boolean;
		status?: string;
	};
	locked?: boolean;
	status?: string;
	[key: string]: unknown;
}

/**
 * MFAServiceV8
 *
 * Service for PingOne MFA operations using WorkerTokenServiceV8
 *
 * biome-ignore lint: This class is intentionally designed with only static methods for:
 * 1. Clear namespacing and organization
 * 2. Consistent API with other V8 services
 * 3. Future extensibility to instance methods if needed
 * 4. Better IDE support and method discovery
 */
export class MFAServiceV8 {
	/**
	 * Get the appropriate token based on credentials.tokenType
	 * Per rightTOTP.md: Support Worker Token OR User Token (access token from Authorization Code Flow)
	 * @param credentials - MFA credentials that may contain tokenType and userToken
	 * @returns Access token (either worker token or user token)
	 */
	static async getToken(credentials?: { tokenType?: 'worker' | 'user'; userToken?: string }): Promise<string> {
		const tokenType = credentials?.tokenType || 'worker';
		
		if (tokenType === 'user') {
			// Use user token (access token from Authorization Code Flow)
			const userToken = credentials?.userToken?.trim();
			if (!userToken) {
				throw new Error('User token is not available. Please enter an access token from the Authorization Code Flow.');
			}
			console.log(`${MODULE_TAG} Using user token (access token from Authorization Code Flow)`);
			return userToken;
		}
		
		// Default to worker token
		return await MFAServiceV8.getWorkerToken();
	}

	/**
	 * Decode JWT token and extract scopes
	 * @param token - JWT access token
	 * @returns Array of scopes from the token
	 */
	static getTokenScopes(token: string): string[] {
		try {
			const [, rawPayload] = token.split('.');
			if (!rawPayload) {
				return [];
			}
			const normalized = rawPayload.replace(/-/g, '+').replace(/_/g, '/');
			const padded = normalized + '='.repeat((4 - (normalized.length % 4 || 4)) % 4);
			const payload = JSON.parse(atob(padded));
			
			const rawScopes: string[] | string | undefined = payload.scp ?? payload.scope;
			const scopes: string[] = [];
			if (Array.isArray(rawScopes)) {
				scopes.push(...rawScopes);
			} else if (rawScopes) {
				scopes.push(...rawScopes.split(/\s+/).filter(Boolean));
			}
			return scopes;
		} catch (error) {
			console.warn(`${MODULE_TAG} Unable to decode token payload to extract scopes`, error);
			return [];
		}
	}

	/**
	 * Allow MFA bypass for a user
	 * Uses backend proxy: POST /api/pingone/mfa/allow-bypass
	 */
	static async allowMfaBypass(environmentId: string, userId: string): Promise<Record<string, unknown>> {
		const token = await MFAServiceV8.getWorkerToken();
		const requestId = `mfa-allow-bypass-${Date.now()}`;

		try {
			console.log(`${MODULE_TAG} Allowing MFA bypass for user ${userId}`, {
				environmentId,
				requestId,
			});

			const body = {
				environmentId,
				userId,
				workerToken: token.trim(),
			};

			const response = await pingOneFetch('/api/pingone/mfa/allow-bypass', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-Request-ID': requestId,
				},
				body: JSON.stringify(body),
			});

			const data = (await response.json()) as Record<string, unknown>;

			if (!response.ok) {
				const errorMsg = (data as PingOneResponse).message || (data as PingOneResponse).error || 'Failed to allow MFA bypass';
				console.error(`${MODULE_TAG} Error allowing MFA bypass:`, {
					status: response.status,
					error: errorMsg,
					requestId,
				});
				throw new Error(errorMsg);
			}

			console.log(`${MODULE_TAG} Successfully allowed MFA bypass`, {
				userId,
				requestId,
			});

			return data;
		} catch (error) {
			console.error(`${MODULE_TAG} Exception in allowMfaBypass:`, {
				error: error instanceof Error ? error.message : 'Unknown error',
				requestId,
			});
			throw error;
		}
	}

	/**
	 * Check MFA bypass status for a user
	 * Uses backend proxy: POST /api/pingone/mfa/check-bypass
	 */
	static async checkMfaBypassStatus(environmentId: string, userId: string): Promise<Record<string, unknown>> {
		const token = await MFAServiceV8.getWorkerToken();
		const requestId = `mfa-check-bypass-${Date.now()}`;

		try {
			console.log(`${MODULE_TAG} Checking MFA bypass status for user ${userId}`, {
				environmentId,
				requestId,
			});

			const body = {
				environmentId,
				userId,
				workerToken: token.trim(),
			};

			const response = await pingOneFetch('/api/pingone/mfa/check-bypass', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-Request-ID': requestId,
				},
				body: JSON.stringify(body),
			});

			const data = (await response.json()) as Record<string, unknown>;

			if (!response.ok) {
				const errorMsg = (data as PingOneResponse).message || (data as PingOneResponse).error || 'Failed to check MFA bypass status';
				console.error(`${MODULE_TAG} Error checking MFA bypass:`, {
					status: response.status,
					error: errorMsg,
					requestId,
				});
				throw new Error(errorMsg);
			}

			console.log(`${MODULE_TAG} Successfully checked MFA bypass status`, {
				userId,
				requestId,
			});

			return data;
		} catch (error) {
			console.error(`${MODULE_TAG} Exception in checkMfaBypassStatus:`, {
				error: error instanceof Error ? error.message : 'Unknown error',
				requestId,
			});
			throw error;
		}
	}

	/**
	 * Get worker token from WorkerTokenServiceV8
	 * @returns Access token
	 */
	static async getWorkerToken(): Promise<string> {
		console.log(`${MODULE_TAG} Getting worker token from WorkerTokenServiceV8`);

		try {
			const token = await workerTokenServiceV8.getToken();
			if (!token) {
				throw new Error('Worker token is not available');
			}
			const decodePayload = () => {
				try {
					const [, rawPayload] = token.split('.');
					if (!rawPayload) {
						return null;
					}
					const normalized = rawPayload.replace(/-/g, '+').replace(/_/g, '/');
					const padded = normalized + '='.repeat((4 - (normalized.length % 4 || 4)) % 4);
					return JSON.parse(atob(padded));
				} catch (error) {
					console.warn(`${MODULE_TAG} Unable to decode worker token payload`, error);
					return null;
				}
			};

			const payload = decodePayload();

			if (payload?.exp) {
				const expiresAt = payload.exp * 1000;
				if (Date.now() >= expiresAt) {
					throw new Error(
						'Worker token has expired. Please generate a new token from the Manage Token dialog.'
					);
				}
			}

			if (payload) {
				const rawScopes: string[] | string | undefined = payload.scp ?? payload.scope;
				const scopes: string[] = [];
				if (Array.isArray(rawScopes)) {
					scopes.push(...rawScopes);
				} else if (rawScopes) {
					scopes.push(...rawScopes.split(/\s+/).filter(Boolean));
				}

				if (scopes.length === 0) {
					try {
						const credentials = await workerTokenServiceV8.loadCredentials();
						if (credentials?.scopes?.length) {
							scopes.push(...credentials.scopes);
						}
					} catch (credError) {
						console.warn(
							`${MODULE_TAG} Unable to inspect worker token credentials scopes`,
							credError
						);
					}
				}

				// NOTE: MFA scope requirements removed - worker token provides necessary permissions
			}

			console.log(`${MODULE_TAG} Using worker token from WorkerTokenServiceV8`, {
				tokenLength: token.length,
				tokenPrefix: token.substring(0, 20),
			});
			return token;
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to get worker token from WorkerTokenServiceV8`, error);
			throw error instanceof Error ? error : new Error(String(error));
		}
	}

	/**
	 * Look up user by username
	 * @param environmentId - PingOne environment ID
	 * @param username - Username to search for
	 * @returns User details including ID
	 */
	static async lookupUserByUsername(
		environmentId: string,
		username: string
	): Promise<UserLookupResult> {
		console.log(`${MODULE_TAG} Looking up user by username`, { username });

		try {
			const accessToken = await MFAServiceV8.getWorkerToken();

			// Use backend proxy to avoid CORS
			const requestBody = {
				environmentId,
				username,
				workerToken: accessToken,
			};

			const startTime = Date.now();
			const callId = apiCallTrackerService.trackApiCall({
				method: 'POST',
				url: '/api/pingone/mfa/lookup-user',
				headers: {
					'Content-Type': 'application/json',
				},
				body: requestBody, // Show actual worker token for educational visibility
				step: 'mfa-User Lookup',
				flowType: 'mfa',
			});

			const response = await pingOneFetch('/api/pingone/mfa/lookup-user', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(requestBody),
				retry: { maxAttempts: 3 },
			});

			const responseClone = response.clone();
			let user: unknown;
			try {
				user = await responseClone.json();
			} catch {
				user = { error: 'Failed to parse response' };
			}

			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: response.status,
					statusText: response.statusText,
					headers: (() => {
						const headers: Record<string, string> = {};
						response.headers.forEach((value, key) => {
							headers[key] = value;
						});
						return headers;
					})(),
					data: user,
				},
				Date.now() - startTime
			);

			if (!response.ok) {
				const errorData = user as PingOneResponse;
				throw new Error(
					`User lookup failed: ${errorData.message || errorData.error || response.statusText}`
				);
			}

			const userData = user as PingOneResponse;

			console.log(`${MODULE_TAG} User found`, {
				userId: userData.id,
				username: userData.username,
			});

			return userData as unknown as UserLookupResult;
		} catch (error) {
			console.error(`${MODULE_TAG} User lookup error`, error);
			throw error;
		}
	}

	/**
	 * Register MFA device for user
	 * @param params - Device registration parameters
	 * @returns Device registration result
	 */
	static async registerDevice(params: RegisterDeviceParams): Promise<DeviceRegistrationResult> {
		console.log(`${MODULE_TAG} Registering ${params.type} device`, {
			username: params.username,
			type: params.type,
		});

		try {
			// Look up user by username
			const user = await MFAServiceV8.lookupUserByUsername(params.environmentId, params.username);

		// Get appropriate token (worker or user) based on credentials
		const paramsWithToken = params as RegisterDeviceParams & { tokenType?: 'worker' | 'user'; userToken?: string };
		const tokenType = paramsWithToken.tokenType;
		const userToken = paramsWithToken.userToken;
		const tokenParams: { tokenType?: 'worker' | 'user'; userToken?: string } = {};
		if (tokenType) tokenParams.tokenType = tokenType;
		if (userToken) tokenParams.userToken = userToken;
		
		console.log(`${MODULE_TAG} 🔍 REGISTER STEP 1: Getting token:`, {
			tokenType,
			hasUserToken: !!userToken,
			tokenParams,
		});
		
		const accessToken = await MFAServiceV8.getToken(Object.keys(tokenParams).length > 0 ? tokenParams : undefined);
		
		console.log(`${MODULE_TAG} 🔍 REGISTER STEP 2: Token retrieved:`, {
			hasToken: !!accessToken,
			tokenType: typeof accessToken,
			tokenLength: accessToken ? String(accessToken).length : 0,
			tokenPreview: accessToken ? `${String(accessToken).substring(0, 30)}...${String(accessToken).substring(Math.max(0, String(accessToken).length - 30))}` : 'MISSING',
			hasWhitespace: accessToken ? /\s/.test(String(accessToken)) : false,
			hasNewlines: accessToken ? /[\r\n]/.test(String(accessToken)) : false,
			hasBearerPrefix: accessToken ? /^Bearer\s+/i.test(String(accessToken)) : false,
		});

		// Validate user token has required scope for device registration
		if (paramsWithToken.tokenType === 'user' && paramsWithToken.userToken) {
			const tokenScopes = MFAServiceV8.getTokenScopes(paramsWithToken.userToken);
			if (!tokenScopes.includes('p1:create:device')) {
				const errorMessage = `User token is missing required scope "p1:create:device". ` +
					`Token scopes: ${tokenScopes.join(', ') || 'none'}. ` +
					`\n\nTo fix this:\n` +
					`1. Go to PingOne Admin Console → Applications → Your OAuth Application\n` +
					`2. Navigate to the "Scopes" or "Resource Access" section\n` +
					`3. Ensure "p1:create:device" scope is enabled/added to the application\n` +
					`4. Verify the user has permission to use this scope\n` +
					`5. Log in again using the User Login modal (the scope is already requested: "openid profile email p1:create:device")\n\n` +
					`Note: The scope is being requested in the authorization URL, but PingOne is only granting "openid". ` +
					`This indicates the OAuth application configuration needs to be updated.`;
				console.error(`${MODULE_TAG} ${errorMessage}`);
				throw new Error(errorMessage);
			}
			console.log(`${MODULE_TAG} ✅ User token validated - has required p1:create:device scope`);
		}

		// Registration uses Platform APIs only - NO MFA v1 APIs
		// Build device registration payload
			const devicePayload: Record<string, unknown> = {
				type: params.type,
			};

			// Add phone for SMS, VOICE, and WHATSAPP devices
			if (
				(params.type === 'SMS' || params.type === 'VOICE' || params.type === 'WHATSAPP') &&
				params.phone
			) {
				devicePayload.phone = params.phone;
			} else if (params.type === 'EMAIL' && params.email) {
				devicePayload.email = params.email;
			}

			// Add device nickname if provided (PingOne API uses 'nickname' field)
			// Support both 'name' and 'nickname' for compatibility
			const deviceNickname = params.nickname || params.name;
			if (deviceNickname?.trim()) {
				devicePayload.nickname = deviceNickname.trim();
			}

			// Always set device status explicitly (ACTIVE or ACTIVATION_REQUIRED)
			// ACTIVE: Device is pre-paired (Worker App can set this, user doesn't need to activate)
			// ACTIVATION_REQUIRED: User must activate device before first use
			// IMPORTANT: Always set status explicitly for educational purposes
			// For Admin Flow (worker token): default to ACTIVE if not provided (PingOne's default)
			// For User Flow (user token): default to ACTIVATION_REQUIRED (enforced by PingOne)
			// PingOne's default is ACTIVE if status is not provided, but we always send it explicitly
			if (params.status) {
				devicePayload.status = params.status;
			} else {
				const tokenType = 'tokenType' in params ? (params as { tokenType?: 'worker' | 'user' }).tokenType : undefined;
				if (tokenType === 'worker') {
					// Admin Flow: default to ACTIVE (PingOne's default, but we send it explicitly for education)
					devicePayload.status = 'ACTIVE';
				} else {
					// User Flow: default to ACTIVATION_REQUIRED (enforced by PingOne)
					devicePayload.status = 'ACTIVATION_REQUIRED';
				}
			}

			// Add notification property if provided (only applicable when status is ACTIVATION_REQUIRED for SMS, Voice, Email)
			// See: https://apidocs.pingidentity.com/pingone/mfa/v1/api/#enable-users-mfa
			if (params.notification && params.status === 'ACTIVATION_REQUIRED') {
				devicePayload.notification = params.notification;
			}

			// Register device via backend proxy
			console.log(`${MODULE_TAG} Calling device registration endpoint`, {
				type: params.type,
				userId: user.id,
				nickname: devicePayload.nickname || params.nickname || params.name,
			});

			const trimmedToken = accessToken.trim();
			console.log(`${MODULE_TAG} 🔍 REGISTER STEP 3: Token trimmed:`, {
				originalLength: accessToken.length,
				trimmedLength: trimmedToken.length,
				tokenPreview: `${trimmedToken.substring(0, 30)}...${trimmedToken.substring(Math.max(0, trimmedToken.length - 30))}`,
			});
			
			const requestBody: Record<string, unknown> = {
				environmentId: params.environmentId,
				userId: user.id,
				type: params.type,
				workerToken: trimmedToken, // Note: This field name is misleading - it can be either worker or user token
				tokenType: ('tokenType' in params ? (params as { tokenType?: 'worker' | 'user' }).tokenType : undefined) || 'worker', // Explicitly send token type for server logging
			};
			
			console.log(`${MODULE_TAG} 🔍 REGISTER STEP 4: Request body with token:`, {
				hasWorkerToken: !!requestBody.workerToken,
				workerTokenType: typeof requestBody.workerToken,
				workerTokenLength: requestBody.workerToken ? String(requestBody.workerToken).length : 0,
				workerTokenPreview: requestBody.workerToken ? `${String(requestBody.workerToken).substring(0, 30)}...${String(requestBody.workerToken).substring(Math.max(0, String(requestBody.workerToken).length - 30))}` : 'MISSING',
			});

			// Include phone for SMS, VOICE, and WHATSAPP devices
			if (
				(params.type === 'SMS' || params.type === 'VOICE' || params.type === 'WHATSAPP') &&
				devicePayload.phone
			) {
				requestBody.phone = devicePayload.phone;
			}

			// Only include email for EMAIL devices
			if (params.type === 'EMAIL' && devicePayload.email) {
				requestBody.email = devicePayload.email;
			}

			// FIDO2-specific: Only include type, rp, and policy (per API docs)
			// Valid format: { "type": "FIDO2", "rp": { "id": "...", "name": "..." }, "policy": { "id": "..." } }
			// See: https://apidocs.pingidentity.com/pingone/mfa/v1/api/#post-create-mfa-user-device-fido2
			// Do NOT include status, name, nickname, or notification for FIDO2
			if (params.type === 'FIDO2') {
				// Include RP (Relying Party) information if provided
				if (params.rp) {
					requestBody.rp = params.rp;
				}
				
				// Include policy if provided
				if (params.policy) {
					// If policy is already an object, use it; otherwise wrap string in object
					if (typeof params.policy === 'object' && 'id' in params.policy) {
						requestBody.policy = params.policy;
					} else {
						// Convert string policy ID to object format
						requestBody.policy = { id: String(params.policy) };
					}
				}
			} else {
			// For non-FIDO2 devices, include standard fields
			// Include both name and nickname in request body so server can use either for nickname update
			// The server will use nickname || name to get the device name
			const deviceNickname = devicePayload.nickname || devicePayload.name;
			if (deviceNickname) {
				requestBody.nickname = deviceNickname;
				requestBody.name = deviceNickname; // Also send as name for compatibility
			}

				// Always include status explicitly (ACTIVE or ACTIVATION_REQUIRED)
				// This ensures PingOne receives the status we want, not its default
				requestBody.status = devicePayload.status;

				// Include notification if provided (only applicable when status is ACTIVATION_REQUIRED for SMS, Voice, Email)
				if (devicePayload.notification) {
					requestBody.notification = devicePayload.notification;
				}

				// Include policy if provided (required for TOTP to get secret and keyUri)
				// According to API docs: policy should be an object with id property
				// Format: { "policy": { "id": "policy-id-string" } }
				if (params.policy) {
					// If policy is already an object, use it; otherwise wrap string in object
					if (typeof params.policy === 'object' && 'id' in params.policy) {
						requestBody.policy = params.policy;
					} else {
						// Convert string policy ID to object format
						requestBody.policy = { id: String(params.policy) };
					}
				}
			}

			console.log(`${MODULE_TAG} 📊 REGISTRATION PAYLOAD DEBUG:`, {
				type: requestBody.type,
				status: requestBody.status || 'NOT SET',
				'Status Type': typeof requestBody.status,
				'Status Value': requestBody.status,
				hasPhone: !!requestBody.phone,
				hasEmail: !!requestBody.email,
				nickname: requestBody.nickname,
				userId: requestBody.userId,
				environmentId: requestBody.environmentId,
				hasPolicy: !!requestBody.policy,
				policyId: requestBody.policy && typeof requestBody.policy === 'object' && 'id' in requestBody.policy 
					? requestBody.policy.id 
					: (requestBody.policy || 'NOT SET'),
				'Full Payload': JSON.stringify(requestBody, null, 2),
			});
			// Detailed status logging for debugging
			console.log(`${MODULE_TAG} 📊 REGISTRATION PAYLOAD DEBUG:`, {
				'Status in Payload': requestBody.status || 'MISSING',
				'Status from params': params.status || 'NOT PROVIDED',
				'Device Payload Status': devicePayload.status || 'NOT SET',
				'Full Request Body': requestBody,
			});

			const startTime = Date.now();
			const callId = apiCallTrackerService.trackApiCall({
				method: 'POST',
				url: '/api/pingone/mfa/register-device',
				headers: {
					'Content-Type': 'application/json',
				},
				body: requestBody,
				step: 'mfa-Register Device',
				flowType: 'mfa',
			});

			let response: Response;
			try {
				response = await pingOneFetch('/api/pingone/mfa/register-device', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(requestBody),
				});
			} catch (error) {
				apiCallTrackerService.updateApiCallResponse(
					callId,
					{
						status: 0,
						statusText: 'Network Error',
						error: error instanceof Error ? error.message : String(error),
					},
					Date.now() - startTime
				);
				throw error;
			}

			const responseClone = response.clone();
			let deviceData: unknown;
			try {
				deviceData = await responseClone.json();
			} catch {
				deviceData = { error: 'Failed to parse response' };
			}

			// Extract metadata if backend included actual PingOne API call details
			const deviceDataWithMetadata = deviceData as {
				_metadata?: {
					actualPingOneUrl?: string;
					actualPingOneMethod?: string;
					actualPingOnePayload?: Record<string, unknown>;
					actualPingOneHeaders?: Record<string, string>;
					actualPingOneResponse?: {
						status: number;
						statusText: string;
						data: unknown;
					};
				};
				[key: string]: unknown;
			};

			// Track the actual PingOne API call if metadata is available
			if (deviceDataWithMetadata._metadata?.actualPingOneUrl) {
				const actualCallId = apiCallTrackerService.trackApiCall({
					method: (deviceDataWithMetadata._metadata.actualPingOneMethod || 'POST') as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
					url: deviceDataWithMetadata._metadata.actualPingOneUrl,
					actualPingOneUrl: deviceDataWithMetadata._metadata.actualPingOneUrl,
					headers: deviceDataWithMetadata._metadata.actualPingOneHeaders || {},
					body: deviceDataWithMetadata._metadata.actualPingOnePayload || null,
					step: 'mfa-Register Device (PingOne API)',
					flowType: 'mfa',
					isProxy: false,
					source: 'backend',
				});

				if (deviceDataWithMetadata._metadata.actualPingOneResponse) {
					apiCallTrackerService.updateApiCallResponse(
						actualCallId,
						deviceDataWithMetadata._metadata.actualPingOneResponse,
						Date.now() - startTime
					);
				}
			}

			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: response.status,
					statusText: response.statusText,
					headers: (() => {
						const headers: Record<string, string> = {};
						response.headers.forEach((value, key) => {
							headers[key] = value;
						});
						return headers;
					})(),
					data: deviceData,
				},
				Date.now() - startTime
			);

			if (!response.ok) {
				const errorData = deviceData as PingOneResponse & { debug?: { tokenType?: string; tokenExpired?: boolean } };
				const errorMessage = errorData.message || errorData.error || response.statusText;
				const debugInfo = errorData.debug;
				
				// Enhanced error message with token details for 403 errors
				if (response.status === 403) {
					const paramsWithToken = params as RegisterDeviceParams & { tokenType?: 'worker' | 'user'; userToken?: string };
					const tokenType = paramsWithToken.tokenType || debugInfo?.tokenType || 'unknown';
					const tokenExpired = debugInfo?.tokenExpired;
					const tokenInfo = tokenType === 'user' 
						? `User token (access token from Authorization Code Flow)`
						: `Worker token`;
					
					console.error(`${MODULE_TAG} Device registration failed with 403 Forbidden:`, {
						error: errorMessage,
						tokenType,
						tokenInfo,
						tokenExpired,
						hasUserToken: !!paramsWithToken.userToken,
						userTokenLength: paramsWithToken.userToken?.length,
						environmentId: params.environmentId,
						userId: user.id,
						deviceType: params.type,
						debugInfo,
					});
					
					let enhancedMessage = `Device registration failed: ${errorMessage}`;
					if (tokenExpired) {
						enhancedMessage += ` (Token has expired)`;
					} else if (tokenType === 'user') {
						enhancedMessage += `\n\n🔍 Troubleshooting for User Flow:\n`;
						enhancedMessage += `• Your access token is missing the required "p1:create:device" scope.\n`;
						enhancedMessage += `• When logging in, ensure you request: "openid profile email p1:create:device"\n`;
						enhancedMessage += `• The token exchange response should include "p1:create:device" in the scope field\n`;
						enhancedMessage += `• If the scope is missing, PingOne didn't grant it - verify your OAuth application has the "p1:create:device" scope available`;
					} else {
						enhancedMessage += ` (Using ${tokenInfo} - check worker token permissions and environment licensing)`;
					}
					
					throw new Error(enhancedMessage);
				}
				
				throw new Error(
					`Device registration failed: ${errorMessage}`
				);
			}

			// Remove metadata from device data before processing
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { _metadata, ...deviceDataWithoutMetadata } = deviceDataWithMetadata;
			
			// Debug: Log raw response to see what we received
			// Check for publicKeyCredentialCreationOptions in multiple ways
			const rawPublicKeyOptions = (deviceDataWithoutMetadata as Record<string, unknown>).publicKeyCredentialCreationOptions as string | undefined;
			const hasPublicKeyInRaw = 'publicKeyCredentialCreationOptions' in deviceDataWithoutMetadata;
			
			console.log(`${MODULE_TAG} Raw device data (before type assertion):`, {
				hasPublicKeyCredentialCreationOptions: hasPublicKeyInRaw,
				publicKeyCredentialCreationOptionsValue: rawPublicKeyOptions?.substring(0, 100) || 'NOT FOUND',
				publicKeyCredentialCreationOptionsType: typeof rawPublicKeyOptions,
				publicKeyCredentialCreationOptionsLength: rawPublicKeyOptions?.length || 0,
				allKeys: Object.keys(deviceDataWithoutMetadata),
				deviceType: (deviceDataWithoutMetadata as { type?: string }).type,
				// Log full response structure for debugging
				fullResponsePreview: JSON.stringify(deviceDataWithoutMetadata, null, 2).substring(0, 500),
			});
			
			const dd = deviceDataWithoutMetadata as PingOneResponse & {
				environment?: { id?: string };
				user?: { id?: string };
				nickname?: string;
				createdAt?: string;
				updatedAt?: string;
				properties?: {
					secret?: string;
					keyUri?: string;
				};
				_links?: {
					'device.activate'?: { href: string };
					[key: string]: { href: string } | undefined;
				};
				// FIDO2-specific: publicKeyCredentialCreationOptions returned by PingOne (per fido2-2.md)
				publicKeyCredentialCreationOptions?: string;
				// FIDO2-specific: RP information
				rp?: {
					id?: string;
					name?: string;
				};
			};

			// Extract device.activate URI per rightOTP.md
			// If device.activate URI exists, device requires activation
			// If missing, device is ACTIVE (double-check with status)
			const deviceActivateUri = dd._links?.['device.activate']?.href;

			// FIDO2-specific: Log publicKeyCredentialCreationOptions for debugging
			const publicKeyOptionsLength = dd.publicKeyCredentialCreationOptions?.length || 0;
			
			console.log(`${MODULE_TAG} Device registered successfully`, {
				deviceId: dd.id,
				userId: user.id,
				status: dd.status,
				nickname: dd.nickname,
				environmentId: dd.environment?.id,
				deviceType: dd.type,
				isFIDO2: params.type === 'FIDO2',
				isTOTP: params.type === 'TOTP',
				isSMS: params.type === 'SMS',
				isEMAIL: params.type === 'EMAIL',
				expectedStatus: params.status || 'ACTIVE',
				statusMatch: dd.status === (params.status || 'ACTIVE'),
				hasSecret: !!dd.properties?.secret,
				hasKeyUri: !!dd.properties?.keyUri,
				hasDeviceActivateUri: !!deviceActivateUri,
				// Per rightOTP.md: If device.activate URI is missing, device is ACTIVE
				deviceIsActive: !deviceActivateUri || dd.status === 'ACTIVE',
				// FIDO2-specific debugging
				hasPublicKeyCredentialCreationOptions: !!dd.publicKeyCredentialCreationOptions,
				publicKeyCredentialCreationOptionsLength: publicKeyOptionsLength,
				publicKeyCredentialCreationOptionsPreview: dd.publicKeyCredentialCreationOptions?.substring(0, 100) || 'N/A',
				rpId: dd.rp?.id,
				rpName: dd.rp?.name,
			});

			// FIDO2-specific: Extract publicKeyCredentialCreationOptions from device response
			// Per fido2-2.md: PingOne returns this as a JSON string in the device creation response
			// This is required for WebAuthn registration ceremony
			// Always include it if present (not just for FIDO2 type check, in case type is wrong)
			const publicKeyOptions = dd.publicKeyCredentialCreationOptions;
			const hasPublicKeyOptionsValue = publicKeyOptions !== undefined && publicKeyOptions !== null && publicKeyOptions !== '';
			
			if (hasPublicKeyOptionsValue && publicKeyOptions) {
				console.log(`${MODULE_TAG} ✅ Found publicKeyCredentialCreationOptions in response:`, {
					length: publicKeyOptions.length,
					preview: publicKeyOptions.substring(0, 150),
					deviceType: dd.type,
					deviceId: dd.id,
					type: typeof publicKeyOptions,
				});
			} else {
				console.warn(`${MODULE_TAG} ⚠️ publicKeyCredentialCreationOptions NOT found in response:`, {
					deviceType: dd.type,
					deviceId: dd.id,
					status: dd.status,
					availableKeys: Object.keys(dd),
					hasRp: !!dd.rp,
					rpId: dd.rp?.id,
					publicKeyOptionsValue: publicKeyOptions,
					publicKeyOptionsType: typeof publicKeyOptions,
				});
			}

			// Build return object - include publicKeyCredentialCreationOptions in initial construction
			// This ensures it's properly included in the returned object
			const result: DeviceRegistrationResult = {
				deviceId: dd.id || '',
				userId: user.id,
				status: dd.status || 'ACTIVE',
				type: dd.type || '',
				...(dd.phone ? { phone: dd.phone } : {}),
				...(dd.email ? { email: dd.email } : {}),
				...(dd.nickname ? { nickname: dd.nickname } : {}),
				...(dd.environment?.id ? { environmentId: dd.environment.id } : {}),
				...(dd.createdAt ? { createdAt: dd.createdAt } : {}),
				...(dd.updatedAt ? { updatedAt: dd.updatedAt } : {}),
				// Per rightOTP.md: Extract device.activate URI from _links
				// This URI must be used for OTP activation (SMS/EMAIL)
				...(deviceActivateUri ? { deviceActivateUri } : {}),
				// TOTP-specific: Extract secret and keyUri from properties
				// According to totp.md: properties.secret and properties.keyUri are returned when status is ACTIVATION_REQUIRED
				...(dd.properties?.secret ? { secret: dd.properties.secret } : {}),
				...(dd.properties?.keyUri ? { keyUri: dd.properties.keyUri } : {}),
				// FIDO2-specific: Include publicKeyCredentialCreationOptions if present
				// Include it in the initial object construction to ensure it's not lost
				...(hasPublicKeyOptionsValue && publicKeyOptions ? { publicKeyCredentialCreationOptions: publicKeyOptions } : {}),
			};

			// Log confirmation that it's included
			if (hasPublicKeyOptionsValue && publicKeyOptions) {
				console.log(`${MODULE_TAG} ✅ Including publicKeyCredentialCreationOptions in return object:`, {
					length: publicKeyOptions.length,
					hasInResult: 'publicKeyCredentialCreationOptions' in result,
					resultKeys: Object.keys(result),
					resultValue: result.publicKeyCredentialCreationOptions?.substring(0, 50) || 'NOT FOUND',
					// Log the actual value to verify it's there
					actualValue: result.publicKeyCredentialCreationOptions,
					actualValueType: typeof result.publicKeyCredentialCreationOptions,
				});
			}

			// Final verification before returning - EXPAND THIS TO SEE FULL OBJECT
			const finalCheck = {
				hasPublicKeyCredentialCreationOptions: 'publicKeyCredentialCreationOptions' in result,
				publicKeyCredentialCreationOptionsValue: result.publicKeyCredentialCreationOptions || 'UNDEFINED',
				publicKeyCredentialCreationOptionsType: typeof result.publicKeyCredentialCreationOptions,
				allKeys: Object.keys(result),
				// Stringify the entire result to see if field is actually there
				resultStringified: JSON.stringify(result),
				// Also log the raw result object
				resultObject: result,
			};
			console.log(`${MODULE_TAG} 🔍 FINAL RESULT CHECK before return:`, finalCheck);
			console.log(`${MODULE_TAG} 🔍 FULL RESULT OBJECT:`, result);
			console.log(`${MODULE_TAG} 🔍 RESULT.publicKeyCredentialCreationOptions:`, result.publicKeyCredentialCreationOptions);

			return result;
		} catch (error) {
			console.error(`${MODULE_TAG} Device registration error`, error);
			throw error;
		}
	}

	/**
	 * Validate OTP for device authentication
	 * Uses the deviceAuthId from the initialization step
	 * @param params - Validation parameters
	 */
	static async validateOTP(params: {
		environmentId: string;
		deviceAuthId: string;
		otp: string;
		workerToken: string;
		otpCheckUrl?: string; // Optional: URL from _links.otp.check.href
	}): Promise<{ valid: boolean; status: string; message?: string }> {
		console.log(`${MODULE_TAG} Validating OTP for device authentication`);

		try {
			// Validate worker token format
			if (typeof params.workerToken !== 'string') {
				throw new Error('Worker token must be a string');
			}

			// Normalize and validate worker token
			let cleanToken = String(params.workerToken);
			// Remove any existing "Bearer " prefix if accidentally included
			cleanToken = cleanToken.replace(/^Bearer\s+/i, '');
			// Remove all whitespace, newlines, carriage returns, and tabs
			cleanToken = cleanToken.replace(/\s+/g, '').trim();

			if (cleanToken.length === 0) {
				throw new Error('Worker token is empty');
			}

			// Basic JWT format check (should have 3 parts separated by dots)
			const tokenParts = cleanToken.split('.');
			if (tokenParts.length !== 3) {
				throw new Error('Invalid worker token format');
			}

			// Validate token parts are not empty
			if (tokenParts.some((part) => part.length === 0)) {
				throw new Error('Invalid worker token format');
			}

			// Prefer the otp.check URL from _links if provided (per Phase 1 spec)
			let endpoint: string;
			let requestBody: Record<string, unknown>;
			let contentType: string;

			if (params.otpCheckUrl) {
				// Use the URL from PingOne's _links response
				endpoint = params.otpCheckUrl;
				requestBody = { otp: params.otp };
				contentType = 'application/vnd.pingidentity.otp.check+json';
				console.log(`${MODULE_TAG} Using otp.check URL from _links:`, endpoint);
			} else {
				// Fallback to our proxy endpoint
				endpoint = '/api/pingone/mfa/validate-otp-for-device';
				requestBody = {
					environmentId: params.environmentId,
					authenticationId: params.deviceAuthId,
					otp: params.otp,
					workerToken: cleanToken,
				};
				contentType = 'application/json';
				console.log(`${MODULE_TAG} Using fallback validate-otp-for-device endpoint`);
			}

			console.log(`${MODULE_TAG} Validating OTP`, {
				deviceAuthId: params.deviceAuthId,
				otpLength: params.otp.length,
				tokenLength: cleanToken.length,
				usingLinks: !!params.otpCheckUrl,
			});

			const startTime = Date.now();
			const callId = apiCallTrackerService.trackApiCall({
				method: 'POST',
				url: endpoint,
				headers: {
					'Content-Type': contentType,
					...(params.otpCheckUrl
						? { Authorization: `Bearer ${cleanToken.substring(0, 20)}...` }
						: {}),
				},
				body: requestBody,
				step: 'mfa-Validate OTP',
				flowType: 'mfa',
			});

			let response: Response;
			try {
				response = await pingOneFetch(endpoint, {
					method: 'POST',
					headers: {
						'Content-Type': contentType,
						...(params.otpCheckUrl ? { Authorization: `Bearer ${cleanToken}` } : {}),
					},
					body: JSON.stringify(requestBody),
					retry: { maxAttempts: 3 },
				});
			} catch (error) {
				apiCallTrackerService.updateApiCallResponse(
					callId,
					{
						status: 0,
						statusText: 'Network Error',
						error: error instanceof Error ? error.message : String(error),
					},
					Date.now() - startTime
				);
				throw error;
			}

			const responseClone = response.clone();
			let responseData: unknown;
			try {
				responseData = await responseClone.json();
			} catch {
				responseData = { error: 'Failed to parse response' };
			}

			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: response.status,
					statusText: response.statusText,
					headers: (() => {
						const headers: Record<string, string> = {};
						response.headers.forEach((value, key) => {
							headers[key] = value;
						});
						return headers;
					})(),
					data: responseData,
				},
				Date.now() - startTime
			);

			if (!response.ok) {
				const errorData = responseData as { status?: string; error?: string; message?: string };
				return {
					valid: false,
					status: errorData.status || 'FAILED',
					message: errorData.error || errorData.message || 'OTP validation failed',
				};
			}

			const result = responseData as { status: string; message?: string };
			console.log(`${MODULE_TAG} OTP validation result`, {
				status: result.status,
				valid: result.status === 'COMPLETED',
			});

			return {
				valid: result.status === 'COMPLETED',
				status: result.status,
				message:
					result.message ||
					(result.status === 'COMPLETED' ? 'OTP validated successfully' : 'Invalid OTP code'),
			};
		} catch (error) {
			console.error(`${MODULE_TAG} Error validating OTP:`, error);
			throw error;
		}
	}

	/**
	 * Get device details
	 * @param params - Device lookup parameters
	 * @returns Device details
	 */
	static async getDevice(params: SendOTPParams): Promise<Record<string, unknown>> {
		console.log(`${MODULE_TAG} Getting device details`, {
			username: params.username,
			deviceId: params.deviceId,
		});

		try {
			// Look up user by username
			const user = await MFAServiceV8.lookupUserByUsername(params.environmentId, params.username);

			// Get appropriate token (worker or user) based on credentials
			const tokenType = 'tokenType' in params ? (params as { tokenType?: 'worker' | 'user' }).tokenType : undefined;
			const userToken = 'userToken' in params ? (params as { userToken?: string }).userToken : undefined;
			const tokenParams: { tokenType?: 'worker' | 'user'; userToken?: string } = {};
			if (tokenType) tokenParams.tokenType = tokenType;
			if (userToken) tokenParams.userToken = userToken;
			const accessToken = await MFAServiceV8.getToken(Object.keys(tokenParams).length > 0 ? tokenParams : undefined);

			// Get device via proxy endpoint to avoid CORS
			const proxyEndpoint = '/api/pingone/mfa/get-device';
			const deviceEndpoint = `https://api.pingone.com/v1/environments/${params.environmentId}/users/${user.id}/devices/${params.deviceId}`;

			const startTime = Date.now();
			const callId = apiCallTrackerService.trackApiCall({
				method: 'GET',
				url: deviceEndpoint,
				actualPingOneUrl: deviceEndpoint,
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
				step: 'mfa-Get Device Details',
				flowType: 'mfa',
			});

			const response = await fetch(proxyEndpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					environmentId: params.environmentId,
					userId: user.id,
					deviceId: params.deviceId,
					workerToken: accessToken.trim(),
				}),
			});

			const responseClone = response.clone();
			let deviceData: unknown;
			try {
				deviceData = await responseClone.json();
			} catch {
				deviceData = { error: 'Failed to parse response' };
			}

			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: response.status,
					statusText: response.statusText,
					headers: (() => {
						const headers: Record<string, string> = {};
						response.headers.forEach((value, key) => {
							headers[key] = value;
						});
						return headers;
					})(),
					data: deviceData,
				},
				Date.now() - startTime
			);

			if (!response.ok) {
				const errorData = deviceData as PingOneResponse;
				throw new Error(
					`Failed to get device: ${errorData.message || errorData.error || response.statusText}`
				);
			}

			// const deviceData = await response.json(); // Already parsed

			console.log(`${MODULE_TAG} Device details retrieved`, {
				deviceId: (deviceData as PingOneResponse).id,
				type: (deviceData as PingOneResponse).type,
				status: (deviceData as PingOneResponse).status,
			});

			return deviceData as Record<string, unknown>;
		} catch (error) {
			console.error(`${MODULE_TAG} Get device error`, error);
			throw error;
		}
	}

	/**
	 * Get MFA settings (Environment-level)
	 * @deprecated This endpoint returns environment-level MFA settings, not Device Authentication Policy settings.
	 * Pairing and lockout settings are configured at the policy level, not environment level.
	 * Use Device Authentication Policy APIs for policy-level settings.
	 * @param environmentId - PingOne environment ID
	 */
	static async getMFASettings(environmentId: string): Promise<MFASettings> {
		console.log(`${MODULE_TAG} Getting MFA settings`);

		try {
			const accessToken = await MFAServiceV8.getWorkerToken();

			const startTime = Date.now();
			const callId = apiCallTrackerService.trackApiCall({
				method: 'POST',
				url: '/api/pingone/mfa/get-mfa-settings',
				headers: {
					'Content-Type': 'application/json',
				},
				body: { environmentId, workerToken: accessToken },
				step: 'mfa-Get MFA Settings',
				flowType: 'mfa',
			});

			const response = await pingOneFetch('/api/pingone/mfa/get-mfa-settings', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					environmentId,
					workerToken: accessToken,
				}),
				retry: { maxAttempts: 3 },
			});

			const responseClone = response.clone();
			let settingsData: unknown;
			try {
				settingsData = await responseClone.json();
			} catch {
				settingsData = { error: 'Failed to parse response' };
			}

			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: response.status,
					statusText: response.statusText,
					headers: (() => {
						const headers: Record<string, string> = {};
						response.headers.forEach((value, key) => {
							headers[key] = value;
						});
						return headers;
					})(),
					data: settingsData,
				},
				Date.now() - startTime
			);

			if (!response.ok) {
				const errorData = settingsData as PingOneResponse;
				throw new Error(
					`Failed to get MFA settings: ${errorData.message || errorData.error || response.statusText}`
				);
			}

			console.log(`${MODULE_TAG} MFA settings retrieved`);
			return settingsData as MFASettings;
		} catch (error) {
			console.error(`${MODULE_TAG} Get MFA settings error`, error);
			throw error;
		}
	}

	/**
	 * Update MFA settings (Environment-level)
	 * @deprecated This endpoint updates environment-level MFA settings, not Device Authentication Policy settings.
	 * Pairing and lockout settings are configured at the policy level, not environment level.
	 * Use Device Authentication Policy APIs for policy-level settings.
	 * @param environmentId - PingOne environment ID
	 * @param settings - Settings to update
	 */
	static async updateMFASettings(
		environmentId: string,
		settings: MFASettings
	): Promise<MFASettings> {
		console.log(`${MODULE_TAG} Updating MFA settings`);

		try {
			const accessToken = await MFAServiceV8.getWorkerToken();

			const startTime = Date.now();
			const callId = apiCallTrackerService.trackApiCall({
				method: 'POST',
				url: '/api/pingone/mfa/update-mfa-settings',
				headers: {
					'Content-Type': 'application/json',
				},
				body: { environmentId, settings, workerToken: accessToken },
				step: 'mfa-Update MFA Settings',
				flowType: 'mfa',
			});

			const response = await pingOneFetch('/api/pingone/mfa/update-mfa-settings', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					environmentId,
					settings,
					workerToken: accessToken,
				}),
				retry: { maxAttempts: 3 },
			});

			const responseClone = response.clone();
			let settingsData: unknown;
			try {
				settingsData = await responseClone.json();
			} catch {
				settingsData = { error: 'Failed to parse response' };
			}

			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: response.status,
					statusText: response.statusText,
					headers: (() => {
						const headers: Record<string, string> = {};
						response.headers.forEach((value, key) => {
							headers[key] = value;
						});
						return headers;
					})(),
					data: settingsData,
				},
				Date.now() - startTime
			);

			if (!response.ok) {
				const errorData = settingsData as PingOneResponse;
				throw new Error(
					`Failed to update MFA settings: ${errorData.message || errorData.error || response.statusText}`
				);
			}

		console.log(`${MODULE_TAG} MFA settings updated`);
		return settingsData as MFASettings;
	} catch (error) {
		console.error(`${MODULE_TAG} Update MFA settings error`, error);
		throw error;
	}
}

	/**
	 * Reset MFA settings to defaults (Environment-level)
	 * DELETE /v1/environments/{envID}/mfaSettings
	 * API Reference: https://apidocs.pingidentity.com/pingone/mfa/v1/api/#reset-mfa-settings
	 * @param environmentId - PingOne environment ID
	 */
	static async resetMFASettings(environmentId: string): Promise<void> {
		console.log(`${MODULE_TAG} Resetting MFA settings to defaults`);

		try {
			const accessToken = await MFAServiceV8.getWorkerToken();

			const startTime = Date.now();
			const callId = apiCallTrackerService.trackApiCall({
				method: 'POST',
				url: '/api/pingone/mfa/reset-mfa-settings',
				headers: {
					'Content-Type': 'application/json',
				},
				body: { environmentId, workerToken: accessToken },
				step: 'mfa-Reset MFA Settings',
				flowType: 'mfa',
			});

			const response = await pingOneFetch('/api/pingone/mfa/reset-mfa-settings', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					environmentId,
					workerToken: accessToken,
				}),
				retry: { maxAttempts: 3 },
			});

			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: response.status,
					statusText: response.statusText,
					headers: (() => {
						const headers: Record<string, string> = {};
						response.headers.forEach((value, key) => {
							headers[key] = value;
						});
						return headers;
					})(),
					data: response.status === 204 ? null : await response.json().catch(() => null),
				},
				Date.now() - startTime
			);

			if (!response.ok && response.status !== 204) {
				const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
				throw new Error(
					`Failed to reset MFA settings: ${errorData.message || errorData.error || response.statusText}`
				);
			}

			console.log(`${MODULE_TAG} MFA settings reset to defaults`);
		} catch (error) {
			console.error(`${MODULE_TAG} Reset MFA settings error`, error);
			throw error;
		}
	}

	/**
	 * Delete device
	 * @param params - Device deletion parameters
	 */
	static async deleteDevice(params: SendOTPParams): Promise<void> {
		console.log(`${MODULE_TAG} Deleting device`, {
			username: params.username,
			deviceId: params.deviceId,
		});

		try {
			// Look up user by username
			const user = await MFAServiceV8.lookupUserByUsername(params.environmentId, params.username);

			// Get appropriate token (worker or user) based on credentials
			const tokenType = 'tokenType' in params ? (params as { tokenType?: 'worker' | 'user' }).tokenType : undefined;
			const userToken = 'userToken' in params ? (params as { userToken?: string }).userToken : undefined;
			const tokenParams: { tokenType?: 'worker' | 'user'; userToken?: string } = {};
			if (tokenType) tokenParams.tokenType = tokenType;
			if (userToken) tokenParams.userToken = userToken;
			const accessToken = await MFAServiceV8.getToken(Object.keys(tokenParams).length > 0 ? tokenParams : undefined);

			// Delete device via proxy endpoint to avoid CORS
			const proxyEndpoint = '/api/pingone/mfa/delete-device';
			const deviceEndpoint = `https://api.pingone.com/v1/environments/${params.environmentId}/users/${user.id}/devices/${params.deviceId}`;

			const startTime = Date.now();
			const callId = apiCallTrackerService.trackApiCall({
				method: 'DELETE',
				url: deviceEndpoint,
				actualPingOneUrl: deviceEndpoint,
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
				step: 'mfa-Delete Device',
				flowType: 'mfa',
			});

			const response = await fetch(proxyEndpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					environmentId: params.environmentId,
					userId: user.id,
					deviceId: params.deviceId,
					workerToken: accessToken.trim(),
				}),
			});

			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: response.status,
					statusText: response.statusText,
					headers: (() => {
						const headers: Record<string, string> = {};
						response.headers.forEach((value, key) => {
							headers[key] = value;
						});
						return headers;
					})(),
					data: null,
				},
				Date.now() - startTime
			);

			if (!response.ok && response.status !== 204) {
				let errorData: unknown;
				try {
					errorData = await response.json();
				} catch {
					errorData = {};
				}
				const err = errorData as PingOneResponse;
				throw new Error(
					`Failed to delete device: ${err.message || err.error || response.statusText}`
				);
			}

			console.log(`${MODULE_TAG} Device deleted successfully`);
		} catch (error) {
			console.error(`${MODULE_TAG} Delete device error`, error);
			throw error;
		}
	}

	/**
	 * Get all devices for a user
	 * @param params - User lookup parameters
	 * @param filter - Optional SCIM filter (e.g., 'type eq "SMS"', 'status eq "ACTIVE"')
	 * @returns List of devices
	 */
	static async getAllDevices(
		params: MFACredentials,
		filter?: string
	): Promise<Array<Record<string, unknown>>> {
		console.log(`${MODULE_TAG} Getting all devices for user`, {
			username: params.username,
			environmentId: params.environmentId,
			filter,
		});

		try {
			// Look up user by username
			const user = await MFAServiceV8.lookupUserByUsername(params.environmentId, params.username);
			console.log(`${MODULE_TAG} User lookup successful, userId:`, user.id);

			// Get appropriate token (worker or user) based on credentials
			const tokenType = 'tokenType' in params ? (params as { tokenType?: 'worker' | 'user' }).tokenType : undefined;
			const userToken = 'userToken' in params ? (params as { userToken?: string }).userToken : undefined;
			const tokenParams: { tokenType?: 'worker' | 'user'; userToken?: string } = {};
			if (tokenType) tokenParams.tokenType = tokenType;
			if (userToken) tokenParams.userToken = userToken;
			const accessToken = await MFAServiceV8.getToken(Object.keys(tokenParams).length > 0 ? tokenParams : undefined);

			// Use backend proxy to avoid CORS issues
			const proxyEndpoint = '/api/pingone/mfa/get-all-devices';
			// Build the actual PingOne API URL (without timestamp for logging)
			let actualPingOneUrl = `https://api.pingone.com/v1/environments/${params.environmentId}/users/${user.id}/devices`;
			if (filter) {
				actualPingOneUrl += `?filter=${encodeURIComponent(filter)}`;
			}

			const startTime = Date.now();
			console.log(`${MODULE_TAG} Tracking API call:`, {
				proxyEndpoint,
				actualPingOneUrl,
				userId: user.id,
				username: params.username,
			});
			const callId = apiCallTrackerService.trackApiCall({
				method: 'GET',
				url: proxyEndpoint, // Proxy endpoint for display
				actualPingOneUrl: actualPingOneUrl, // Actual PingOne API URL (without timestamp)
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
				body: {
					environmentId: params.environmentId,
					userId: user.id,
					username: params.username,
					filter: filter || undefined,
				},
				step: 'mfa-Get All Devices',
				flowType: 'mfa',
			});
			console.log(`${MODULE_TAG} API call tracked with ID:`, callId);

			const response = await pingOneFetch(`${proxyEndpoint}?_t=${Date.now()}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Cache-Control': 'no-cache, no-store, must-revalidate',
					Pragma: 'no-cache',
				},
				cache: 'no-store', // Prevent browser caching
				body: JSON.stringify({
					environmentId: params.environmentId,
					userId: user.id,
					username: params.username, // Include username for logging
					workerToken: accessToken.trim(),
					filter: filter || undefined, // Include filter if provided
					_timestamp: Date.now(), // Additional cache-busting in body
				}),
				retry: { maxAttempts: 3 },
			});

			const responseClone = response.clone();
			let devicesData: unknown;
			try {
				devicesData = await responseClone.json();
			} catch {
				devicesData = { error: 'Failed to parse response' };
			}

			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: response.status,
					statusText: response.statusText,
					headers: (() => {
						const headers: Record<string, string> = {};
						response.headers.forEach((value, key) => {
							headers[key] = value;
						});
						return headers;
					})(),
					data: devicesData,
				},
				Date.now() - startTime
			);

			if (!response.ok) {
				const errorData = devicesData as PingOneResponse;
				throw new Error(
					`Failed to get devices: ${errorData.message || errorData.error || response.statusText}`
				);
			}

			// Backend proxy returns { _embedded: { devices: [...] } }
			const devices =
				(devicesData as { _embedded?: { devices?: Array<Record<string, unknown>> } })._embedded
					?.devices || [];

			// Log all devices with user information to verify they belong to the correct user
			console.log(`${MODULE_TAG} 📋 All devices retrieved from PingOne API:`, {
				username: params.username,
				userId: user.id,
				deviceCount: devices.length,
				devices: devices.map((d: Record<string, unknown>) => {
					const userObj = d.user as Record<string, unknown> | undefined;
					const envObj = d.environment as Record<string, unknown> | undefined;
					return {
						id: d.id,
						type: d.type,
						nickname: d.nickname || d.name,
						status: d.status,
						userId: userObj?.id || 'N/A',
						userUsername: userObj?.username || 'N/A',
						userName: userObj?.name || 'N/A',
						environmentId: envObj?.id || 'N/A',
						allKeys: Object.keys(d),
					};
				}),
			});

			// Filter devices to ensure they belong to the correct user
			// PingOne API should already filter by userId in the endpoint, but we'll double-check
			const userDevices = devices.filter((d: Record<string, unknown>) => {
				const userObj = d.user as Record<string, unknown> | undefined;
				const deviceUserId = userObj?.id || (d.userId as string | undefined);
				const matches = !deviceUserId || deviceUserId === user.id;
				if (!matches) {
					console.warn(`${MODULE_TAG} ⚠️ Device belongs to different user, filtering out:`, {
						deviceId: d.id,
						deviceType: d.type,
						deviceUserId,
						expectedUserId: user.id,
						expectedUsername: params.username,
					});
				}
				return matches;
			});

			console.log(`${MODULE_TAG} ✅ Filtered devices for user "${params.username}":`, {
				originalCount: devices.length,
				filteredCount: userDevices.length,
				removedCount: devices.length - userDevices.length,
				devices: userDevices.map((d: Record<string, unknown>) => ({
					id: d.id,
					type: d.type,
					nickname: d.nickname || d.name,
				})),
			});

			// Log device structure to debug "Unnamed Device" issue
			if (userDevices.length > 0) {
				const firstDevice = userDevices[0];
				console.log(`${MODULE_TAG} Sample device structure (first device):`, {
					id: firstDevice.id,
					type: firstDevice.type,
					status: firstDevice.status,
					active: firstDevice.active,
					enabled: firstDevice.enabled,
					allKeys: Object.keys(firstDevice),
					nickname: firstDevice.nickname,
					name: firstDevice.name,
				});
			}

			return userDevices;
		} catch (error) {
			console.error(`${MODULE_TAG} Get all devices error`, error);
			throw error;
		}
	}

	/**
	 * Update device nickname
	 * Per PingOne API: PUT /environments/{envID}/users/{userID}/devices/{deviceID}/nickname
	 * Content-Type: application/json
	 * @param params - Device update parameters
	 * @param nickname - New nickname
	 */
	static async updateDeviceNickname(
		params: SendOTPParams,
		nickname: string
	): Promise<Record<string, unknown>> {
		console.log(`${MODULE_TAG} Updating device nickname`, {
			username: params.username,
			deviceId: params.deviceId,
			nickname,
		});

		try {
			// Look up user by username
			const user = await MFAServiceV8.lookupUserByUsername(params.environmentId, params.username);

			// Get appropriate token (worker or user) based on credentials
			const tokenType = 'tokenType' in params ? (params as { tokenType?: 'worker' | 'user' }).tokenType : undefined;
			const userToken = 'userToken' in params ? (params as { userToken?: string }).userToken : undefined;
			const tokenParams: { tokenType?: 'worker' | 'user'; userToken?: string } = {};
			if (tokenType) tokenParams.tokenType = tokenType;
			if (userToken) tokenParams.userToken = userToken;
			const accessToken = await MFAServiceV8.getToken(Object.keys(tokenParams).length > 0 ? tokenParams : undefined);

			// Update device nickname via backend proxy to avoid CORS
			const proxyEndpoint = '/api/pingone/mfa/update-device-nickname';
			const deviceEndpoint = `https://api.pingone.com/v1/environments/${params.environmentId}/users/${user.id}/devices/${params.deviceId}/nickname`;

			const startTime = Date.now();
			const callId = apiCallTrackerService.trackApiCall({
				method: 'PUT',
				url: proxyEndpoint, // Show proxy endpoint in display
				actualPingOneUrl: deviceEndpoint, // Show actual PingOne URL
				isProxy: true,
				source: 'frontend',
				headers: {
					Authorization: `Bearer ${accessToken.substring(0, 20)}...`,
					'Content-Type': 'application/json',
				},
				body: { nickname },
				step: 'mfa-Update Device Nickname',
				flowType: 'mfa',
			});

			const response = await fetch(proxyEndpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					environmentId: params.environmentId,
					userId: user.id,
					deviceId: params.deviceId,
					nickname,
					workerToken: accessToken.trim(),
				}),
			});

			const responseClone = response.clone();
			let deviceData: unknown;
			try {
				const responseText = await responseClone.text();
				if (responseText) {
					try {
						deviceData = JSON.parse(responseText);
					} catch {
						deviceData = { raw: responseText };
					}
				} else {
					deviceData = null;
				}
			} catch {
				deviceData = { error: 'Failed to parse response' };
			}

			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: response.status,
					statusText: response.statusText,
					headers: (() => {
						const headers: Record<string, string> = {};
						response.headers.forEach((value, key) => {
							headers[key] = value;
						});
						return headers;
					})(),
					data: deviceData,
				},
				Date.now() - startTime
			);

			if (!response.ok) {
				const errorData = deviceData as PingOneResponse;
				throw new Error(
					`Failed to update device nickname: ${errorData.message || errorData.error || response.statusText}`
				);
			}

			console.log(`${MODULE_TAG} Device nickname updated successfully`);
			return deviceData as Record<string, unknown>;
		} catch (error) {
			console.error(`${MODULE_TAG} Update device nickname error`, error);
			throw error;
		}
	}

	/**
	 * Update device (rename, etc.) - DEPRECATED: Use updateDeviceNickname instead
	 * @param params - Device update parameters
	 * @param updates - Fields to update
	 */
	static async updateDevice(
		params: SendOTPParams,
		updates: { name?: string; [key: string]: unknown }
	): Promise<Record<string, unknown>> {
		// If updating nickname, use the dedicated endpoint
		if (updates.name) {
			return MFAServiceV8.updateDeviceNickname(params, updates.name);
		}
		
		console.log(`${MODULE_TAG} Updating device`, {
			username: params.username,
			deviceId: params.deviceId,
			updates,
		});

		try {
			// Look up user by username
			const user = await MFAServiceV8.lookupUserByUsername(params.environmentId, params.username);

			// Get appropriate token (worker or user) based on credentials
			const tokenType = 'tokenType' in params ? (params as { tokenType?: 'worker' | 'user' }).tokenType : undefined;
			const userToken = 'userToken' in params ? (params as { userToken?: string }).userToken : undefined;
			const tokenParams: { tokenType?: 'worker' | 'user'; userToken?: string } = {};
			if (tokenType) tokenParams.tokenType = tokenType;
			if (userToken) tokenParams.userToken = userToken;
			const accessToken = await MFAServiceV8.getToken(Object.keys(tokenParams).length > 0 ? tokenParams : undefined);

			// Update device via backend proxy to avoid CORS
			const proxyEndpoint = '/api/pingone/mfa/update-device';

			const startTime = Date.now();
			const callId = apiCallTrackerService.trackApiCall({
				method: 'PATCH',
				url: proxyEndpoint,
				headers: {
					'Content-Type': 'application/json',
				},
				body: {
					environmentId: params.environmentId,
					userId: user.id,
					deviceId: params.deviceId,
					updates,
					workerToken: accessToken.trim(),
				},
				step: 'mfa-Update Device',
				flowType: 'mfa',
			});

			let response: Response;
			try {
				response = await fetch(proxyEndpoint, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						environmentId: params.environmentId,
						userId: user.id,
						deviceId: params.deviceId,
						updates,
						workerToken: accessToken.trim(),
					}),
				});
			} catch (error) {
				apiCallTrackerService.updateApiCallResponse(
					callId,
					{
						status: 0,
						statusText: 'Network Error',
						error: error instanceof Error ? error.message : String(error),
					},
					Date.now() - startTime
				);
				throw error;
			}

			const responseClone = response.clone();
			let deviceData: unknown;
			try {
				deviceData = await responseClone.json();
			} catch {
				deviceData = { error: 'Failed to parse response' };
			}

			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: response.status,
					statusText: response.statusText,
					headers: (() => {
						const headers: Record<string, string> = {};
						response.headers.forEach((value, key) => {
							headers[key] = value;
						});
						return headers;
					})(),
					data: deviceData,
				},
				Date.now() - startTime
			);

			if (!response.ok) {
				const errorData = deviceData as PingOneResponse;
				throw new Error(
					`Failed to update device: ${errorData.message || errorData.error || response.statusText}`
				);
			}

			console.log(`${MODULE_TAG} Device updated successfully`);
			return deviceData as Record<string, unknown>;
		} catch (error) {
			console.error(`${MODULE_TAG} Update device error`, error);
			throw error;
		}
	}

	/**
	 * Block device
	 * Per PingOne API: POST /environments/{envID}/users/{userID}/devices/{deviceID}
	 * Content-Type: application/vnd.pingidentity.device.block+json
	 * @param params - Device parameters
	 */
	static async blockDevice(params: SendOTPParams): Promise<void> {
		console.log(`${MODULE_TAG} Blocking device`, {
			username: params.username,
			deviceId: params.deviceId,
		});

		try {
			// Look up user by username
			const user = await MFAServiceV8.lookupUserByUsername(params.environmentId, params.username);

			// Get appropriate token (worker or user) based on credentials
			const tokenType = 'tokenType' in params ? (params as { tokenType?: 'worker' | 'user' }).tokenType : undefined;
			const userToken = 'userToken' in params ? (params as { userToken?: string }).userToken : undefined;
			const tokenParams: { tokenType?: 'worker' | 'user'; userToken?: string } = {};
			if (tokenType) tokenParams.tokenType = tokenType;
			if (userToken) tokenParams.userToken = userToken;
			const accessToken = await MFAServiceV8.getToken(Object.keys(tokenParams).length > 0 ? tokenParams : undefined);

			// Block device via proxy endpoint to avoid CORS
			const proxyEndpoint = '/api/pingone/mfa/block-device';
			const deviceEndpoint = `https://api.pingone.com/v1/environments/${params.environmentId}/users/${user.id}/devices/${params.deviceId}`;

			const startTime = Date.now();
			const callId = apiCallTrackerService.trackApiCall({
				method: 'POST',
				url: deviceEndpoint,
				actualPingOneUrl: deviceEndpoint,
				headers: {
					Authorization: `Bearer ${accessToken}`,
					'Content-Type': 'application/vnd.pingidentity.device.block+json',
				},
				step: 'mfa-Block Device',
				flowType: 'mfa',
			});

			const response = await fetch(proxyEndpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					environmentId: params.environmentId,
					userId: user.id,
					deviceId: params.deviceId,
					workerToken: accessToken.trim(),
				}),
			});

			const responseClone = response.clone();
			let responseData: unknown;
			try {
				const responseText = await responseClone.text();
				if (responseText) {
					try {
						responseData = JSON.parse(responseText);
					} catch {
						responseData = { raw: responseText };
					}
				} else {
					responseData = null;
				}
			} catch {
				responseData = { error: 'Failed to parse response' };
			}

			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: response.status,
					statusText: response.statusText,
					headers: (() => {
						const headers: Record<string, string> = {};
						response.headers.forEach((value, key) => {
							headers[key] = value;
						});
						return headers;
					})(),
					data: responseData,
				},
				Date.now() - startTime
			);

			if (!response.ok && response.status !== 204) {
				const errorData = responseData as PingOneResponse;
				throw new Error(
					`Failed to block device: ${errorData.message || errorData.error || response.statusText}`
				);
			}

			console.log(`${MODULE_TAG} Device blocked successfully`);
		} catch (error) {
			console.error(`${MODULE_TAG} Block device error`, error);
			throw error;
		}
	}

	/**
	 * Unblock device
	 * Per PingOne API: POST /environments/{envID}/users/{userID}/devices/{deviceID}
	 * Content-Type: application/vnd.pingidentity.device.unblock+json
	 * @param params - Device parameters
	 */
	static async unblockDevice(params: SendOTPParams): Promise<void> {
		console.log(`${MODULE_TAG} Unblocking device`, {
			username: params.username,
			deviceId: params.deviceId,
		});

		try {
			// Look up user by username
			const user = await MFAServiceV8.lookupUserByUsername(params.environmentId, params.username);

			// Get appropriate token (worker or user) based on credentials
			const tokenType = 'tokenType' in params ? (params as { tokenType?: 'worker' | 'user' }).tokenType : undefined;
			const userToken = 'userToken' in params ? (params as { userToken?: string }).userToken : undefined;
			const tokenParams: { tokenType?: 'worker' | 'user'; userToken?: string } = {};
			if (tokenType) tokenParams.tokenType = tokenType;
			if (userToken) tokenParams.userToken = userToken;
			const accessToken = await MFAServiceV8.getToken(Object.keys(tokenParams).length > 0 ? tokenParams : undefined);

			// Unblock device via proxy endpoint to avoid CORS
			const proxyEndpoint = '/api/pingone/mfa/unblock-device';
			const deviceEndpoint = `https://api.pingone.com/v1/environments/${params.environmentId}/users/${user.id}/devices/${params.deviceId}`;

			const startTime = Date.now();
			const callId = apiCallTrackerService.trackApiCall({
				method: 'POST',
				url: deviceEndpoint,
				actualPingOneUrl: deviceEndpoint,
				headers: {
					Authorization: `Bearer ${accessToken}`,
					'Content-Type': 'application/vnd.pingidentity.device.unblock+json',
				},
				step: 'mfa-Unblock Device',
				flowType: 'mfa',
			});

			const response = await fetch(proxyEndpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					environmentId: params.environmentId,
					userId: user.id,
					deviceId: params.deviceId,
					workerToken: accessToken.trim(),
				}),
			});

			const responseClone = response.clone();
			let responseData: unknown;
			try {
				const responseText = await responseClone.text();
				if (responseText) {
					try {
						responseData = JSON.parse(responseText);
					} catch {
						responseData = { raw: responseText };
					}
				} else {
					responseData = null;
				}
			} catch {
				responseData = { error: 'Failed to parse response' };
			}

			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: response.status,
					statusText: response.statusText,
					headers: (() => {
						const headers: Record<string, string> = {};
						response.headers.forEach((value, key) => {
							headers[key] = value;
						});
						return headers;
					})(),
					data: responseData,
				},
				Date.now() - startTime
			);

			if (!response.ok && response.status !== 204) {
				const errorData = responseData as PingOneResponse;
				throw new Error(
					`Failed to unblock device: ${errorData.message || errorData.error || response.statusText}`
				);
			}

			console.log(`${MODULE_TAG} Device unblocked successfully`);
		} catch (error) {
			console.error(`${MODULE_TAG} Unblock device error`, error);
			throw error;
		}
	}

	/**
	 * Unlock device
	 * Per PingOne API: POST /environments/{envID}/users/{userID}/devices/{deviceID}
	 * Content-Type: application/vnd.pingidentity.device.unlock+json
	 * @param params - Device parameters
	 */
	static async unlockDevice(
		environmentId: string,
		userId: string,
		deviceId: string,
		credentials?: { tokenType?: 'worker' | 'user'; userToken?: string }
	): Promise<void> {
		console.log(`${MODULE_TAG} Unlocking device`, {
			userId,
			deviceId,
		});

		try {
			// Get appropriate token (worker or user) based on credentials
			const accessToken = await MFAServiceV8.getToken(credentials);

			// Unlock device via proxy endpoint to avoid CORS
			const proxyEndpoint = '/api/pingone/mfa/unlock-device';
			const deviceEndpoint = `https://api.pingone.com/v1/environments/${environmentId}/users/${userId}/devices/${deviceId}`;

			const startTime = Date.now();
			const callId = apiCallTrackerService.trackApiCall({
				method: 'POST',
				url: deviceEndpoint,
				actualPingOneUrl: deviceEndpoint,
				headers: {
					Authorization: `Bearer ${accessToken}`,
					'Content-Type': 'application/vnd.pingidentity.device.unlock+json',
				},
				step: 'mfa-Unlock Device',
				flowType: 'mfa',
			});

			const response = await fetch(proxyEndpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					environmentId,
					userId,
					deviceId,
					workerToken: accessToken.trim(),
				}),
			});

			const responseClone = response.clone();
			let responseData: unknown;
			try {
				const responseText = await responseClone.text();
				if (responseText) {
					try {
						responseData = JSON.parse(responseText);
					} catch {
						responseData = { raw: responseText };
					}
				} else {
					responseData = null;
				}
			} catch {
				responseData = { error: 'Failed to parse response' };
			}

			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: response.status,
					statusText: response.statusText,
					headers: (() => {
						const headers: Record<string, string> = {};
						response.headers.forEach((value, key) => {
							headers[key] = value;
						});
						return headers;
					})(),
					data: responseData,
				},
				Date.now() - startTime
			);

			if (!response.ok && response.status !== 204) {
				const errorData = responseData as PingOneResponse;
				throw new Error(
					`Failed to unlock device: ${errorData.message || errorData.error || response.statusText}`
				);
			}

			console.log(`${MODULE_TAG} Device unlocked successfully`);
		} catch (error) {
			console.error(`${MODULE_TAG} Unlock device error`, error);
			throw error;
		}
	}

	/**
	 * Activate TOTP device (OATH token)
	 * According to totp.md section 1.4:
	 * POST {{apiPath}}/environments/{{envID}}/users/{{userID}}/devices/{{deviceID}}
	 * Content-Type: application/vnd.pingidentity.device.activate+json
	 * Body: { "otp": "123456" }
	 * @param params - Device activation parameters (must include otp)
	 */
	static async activateTOTPDevice(params: SendOTPParams & { otp: string }): Promise<Record<string, unknown>> {
		console.log(`${MODULE_TAG} Activating TOTP device`, {
			username: params.username,
			deviceId: params.deviceId,
			hasOtp: !!params.otp,
		});

		try {
			// Look up user by username
			const user = await MFAServiceV8.lookupUserByUsername(params.environmentId, params.username);

			// Get appropriate token (worker or user) based on credentials
			const tokenType = 'tokenType' in params ? (params as { tokenType?: 'worker' | 'user' }).tokenType : undefined;
			const userToken = 'userToken' in params ? (params as { userToken?: string }).userToken : undefined;
			const tokenParams: { tokenType?: 'worker' | 'user'; userToken?: string } = {};
			if (tokenType) tokenParams.tokenType = tokenType;
			if (userToken) tokenParams.userToken = userToken;
			const accessToken = await MFAServiceV8.getToken(Object.keys(tokenParams).length > 0 ? tokenParams : undefined);

			// According to totp.md: Use POST /devices/{deviceID} with Content-Type: application/vnd.pingidentity.device.activate+json
			const deviceEndpoint = `https://api.pingone.com/v1/environments/${params.environmentId}/users/${user.id}/devices/${params.deviceId}`;

			const startTime = Date.now();
			const callId = apiCallTrackerService.trackApiCall({
				method: 'POST',
				url: deviceEndpoint,
				actualPingOneUrl: deviceEndpoint,
				headers: {
					Authorization: `Bearer ${accessToken}`,
					'Content-Type': 'application/vnd.pingidentity.device.activate+json',
				},
				body: { otp: params.otp },
				step: 'mfa-Activate TOTP Device',
				flowType: 'mfa',
			});

			let response: Response;
			try {
				response = await pingOneFetch('/api/pingone/mfa/activate-totp-device', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						environmentId: params.environmentId,
						userId: user.id,
						deviceId: params.deviceId,
						otp: params.otp,
						workerToken: accessToken.trim(),
					}),
					retry: { maxAttempts: 3 },
				});
			} catch (error) {
				apiCallTrackerService.updateApiCallResponse(
					callId,
					{
						status: 0,
						statusText: 'Network Error',
						error: error instanceof Error ? error.message : String(error),
					},
					Date.now() - startTime
				);
				throw error;
			}

			const responseClone = response.clone();
			let deviceData: unknown;
			try {
				deviceData = await responseClone.json();
			} catch {
				deviceData = { error: 'Failed to parse response' };
			}

			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: response.status,
					statusText: response.statusText,
					headers: (() => {
						const headers: Record<string, string> = {};
						response.headers.forEach((value, key) => {
							headers[key] = value;
						});
						return headers;
					})(),
					data: deviceData,
				},
				Date.now() - startTime
			);

			if (!response.ok) {
				const errorData = deviceData as PingOneResponse;
				throw new Error(
					`Failed to activate TOTP device: ${errorData.message || errorData.error || response.statusText}`
				);
			}

			console.log(`${MODULE_TAG} TOTP device activated successfully`);
			return deviceData as Record<string, unknown>;
		} catch (error) {
			console.error(`${MODULE_TAG} Activate TOTP device error`, error);
			throw error;
		}
	}

	/**
	 * Initialize one-time device authentication (Phase 2)
	 * Uses selectedDevice.oneTime instead of registered device ID
	 * @param params - One-time device parameters
	 */
	/**
	 * @deprecated Use MfaAuthenticationServiceV8.initializeDeviceAuthentication() instead
	 * This method will be removed in the next major version
	 */
	static async initializeOneTimeDeviceAuthentication(params: {
		environmentId: string;
		username: string;
		type: 'EMAIL' | 'SMS';
		email?: string; // Required for EMAIL type
		phone?: string; // Required for SMS type
		workerToken?: string;
		deviceAuthenticationPolicyId?: string;
		region?: string;
	}): Promise<{
		id: string;
		status: string;
		_links?: Record<string, { href: string }>;
		[key: string]: unknown;
	}> {
		console.warn(`${MODULE_TAG} DEPRECATION WARNING: initializeOneTimeDeviceAuthentication() is deprecated. Use MfaAuthenticationServiceV8.initializeDeviceAuthentication() instead.`);
		console.log(`${MODULE_TAG} Initializing one-time device authentication`, {
			type: params.type,
			environmentId: params.environmentId,
			username: params.username,
		});

		try {
			// Look up user by username
			const user = await MFAServiceV8.lookupUserByUsername(params.environmentId, params.username);

			// Get worker token
			const accessToken = params.workerToken || (await MFAServiceV8.getWorkerToken());

			// Validate token before sending
			if (!accessToken || typeof accessToken !== 'string' || accessToken.trim().length === 0) {
				console.error(`${MODULE_TAG} Worker token validation failed`, {
					hasToken: !!accessToken,
					tokenType: typeof accessToken,
					tokenLength: accessToken?.length || 0,
				});
				throw new Error('Worker token is missing or invalid. Please generate a new worker token.');
			}

			// Remove any Bearer prefix if present and trim whitespace
			const cleanToken = accessToken.trim().replace(/^Bearer\s+/i, '');

			// Validate JWT format (should have 3 parts separated by dots)
			const tokenParts = cleanToken.split('.');
			if (tokenParts.length !== 3 || tokenParts.some((part) => part.length === 0)) {
				console.error(`${MODULE_TAG} Worker token is not a valid JWT`, {
					tokenLength: cleanToken.length,
					partsCount: tokenParts.length,
					partsLength: tokenParts.map((p) => p.length),
					tokenStart: cleanToken.substring(0, 30),
				});
				throw new Error(
					'Worker token is not in valid JWT format. Please generate a new worker token.'
				);
			}

			console.log(`${MODULE_TAG} Worker token validated`, {
				tokenLength: cleanToken.length,
				partsCount: tokenParts.length,
				hasBearerPrefix: accessToken.trim().startsWith('Bearer '),
			});

			// Build request body for one-time device authentication
			const requestBody = {
				environmentId: params.environmentId,
				userId: user.id,
				type: params.type,
				[params.type.toLowerCase()]: params.type === 'EMAIL' ? params.email : params.phone,
				workerToken: cleanToken,
				deviceAuthenticationPolicyId: params.deviceAuthenticationPolicyId,
				region: params.region,
			};

			console.log(`${MODULE_TAG} Sending one-time device authentication request`, {
				environmentId: params.environmentId,
				userId: user.id,
				type: params.type,
				hasContact: !!(params.email || params.phone),
			});

			const response = await pingOneFetch(
				'/api/pingone/mfa/initialize-one-time-device-authentication',
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(requestBody),
				}
			);

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
				throw new Error(
					errorData.error ||
						errorData.message ||
						'Failed to initialize one-time device authentication'
				);
			}

			const authData = await response.json();
			const deviceAuthId = authData.id;

			// Extract otp.check URL from _links per Phase 2 spec
			let otpCheckUrl: string | undefined;
			if (authData._links?.['otp.check']?.href) {
				otpCheckUrl = authData._links['otp.check'].href;
				console.log(`${MODULE_TAG} Extracted otp.check URL from _links:`, otpCheckUrl);
			} else {
				console.warn(`${MODULE_TAG} No otp.check URL found in _links, will use fallback endpoint`);
			}

			console.log(`${MODULE_TAG} One-time device authentication initialized`, {
				deviceAuthId,
				status: authData.status,
				hasOtpCheckLink: !!otpCheckUrl,
			});

			return {
				id: deviceAuthId,
				status: authData.status,
				_links: authData._links,
				...authData,
			};
		} catch (error) {
			console.error(`${MODULE_TAG} Error in one-time device authentication:`, error);
			throw error;
		}
	}

	/**
	 * Initialize device authentication with deviceId (OTP is automatically sent)
	 * According to PingOne MFA API docs, when you initialize device authentication with a deviceId,
	 * the OTP is automatically sent for SMS/EMAIL devices. There is NO separate send-otp-to-device endpoint.
	 *
	 * This method:
	 * 1. Initializes device authentication with the provided deviceId
	 * 2. Returns deviceAuthId and otpCheckUrl (if available in _links)
	 *
	 * The OTP is sent automatically during initialization if status/nextStep is OTP_REQUIRED.
	 * For resending OTP, use resendPairingCode() instead.
	 *
	 * @param params - Device parameters
	 * @returns Device authentication ID and optional OTP check URL
	 */
	/**
	 * @deprecated Use MfaAuthenticationServiceV8.initializeDeviceAuthentication() instead
	 * This method will be removed in the next major version
	 */
	static async sendOTP(
		params: SendOTPParams
	): Promise<{ deviceAuthId: string; otpCheckUrl?: string }> {
		console.warn(`${MODULE_TAG} DEPRECATION WARNING: sendOTP() is deprecated. Use MfaAuthenticationServiceV8.initializeDeviceAuthentication() instead.`);
		console.log(
			`${MODULE_TAG} Initializing device authentication (OTP will be sent automatically if deviceId provided)`
		);

		try {
			// Look up user by username
			const user = await MFAServiceV8.lookupUserByUsername(params.environmentId, params.username);

			// Get appropriate token (worker or user) based on credentials
			const tokenType = 'tokenType' in params ? (params as { tokenType?: 'worker' | 'user' }).tokenType : undefined;
			const userToken = 'userToken' in params ? (params as { userToken?: string }).userToken : undefined;
			const tokenParams: { tokenType?: 'worker' | 'user'; userToken?: string } = {};
			if (tokenType) tokenParams.tokenType = tokenType;
			if (userToken) tokenParams.userToken = userToken;
			const accessToken = await MFAServiceV8.getToken(Object.keys(tokenParams).length > 0 ? tokenParams : undefined);

			// Validate token before sending
			if (!accessToken || typeof accessToken !== 'string' || accessToken.trim().length === 0) {
				console.error(`${MODULE_TAG} Worker token validation failed`, {
					hasToken: !!accessToken,
					tokenType: typeof accessToken,
					tokenLength: accessToken?.length || 0,
				});
				throw new Error('Worker token is missing or invalid. Please generate a new worker token.');
			}

			// Remove any Bearer prefix if present and trim whitespace
			const cleanToken = accessToken.trim().replace(/^Bearer\s+/i, '');

			// Validate JWT format (should have 3 parts separated by dots)
			const tokenParts = cleanToken.split('.');
			if (tokenParts.length !== 3 || tokenParts.some((part) => part.length === 0)) {
				console.error(`${MODULE_TAG} Worker token is not a valid JWT`, {
					tokenLength: cleanToken.length,
					partsCount: tokenParts.length,
					partsLength: tokenParts.map((p) => p.length),
					tokenStart: cleanToken.substring(0, 30),
				});
				throw new Error(
					'Worker token is not in valid JWT format. Please generate a new worker token.'
				);
			}

			console.log(`${MODULE_TAG} Worker token validated`, {
				tokenLength: cleanToken.length,
				partsCount: tokenParts.length,
				hasBearerPrefix: accessToken.trim().startsWith('Bearer '),
			});

			// Step 1: Initialize device authentication
			const initRequestBody = {
				environmentId: params.environmentId,
				userId: user.id,
				deviceId: params.deviceId,
				workerToken: cleanToken,
			};

			console.log(`${MODULE_TAG} Initializing device authentication`, {
				environmentId: params.environmentId,
				userId: user.id,
				deviceId: params.deviceId,
			});

			const initResponse = await pingOneFetch('/api/pingone/mfa/initialize-device-authentication', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(initRequestBody),
			});

			if (!initResponse.ok) {
				const errorData = await initResponse.json().catch(() => ({ error: 'Unknown error' }));
				throw new Error(
					errorData.error || errorData.message || 'Failed to initialize device authentication'
				);
			}

			const authData = await initResponse.json();
			const deviceAuthId = authData.id;

			// Extract otp.check URL from _links per Phase 1 spec
			let otpCheckUrl: string | undefined;
			if (authData._links?.['otp.check']?.href) {
				otpCheckUrl = authData._links['otp.check'].href;
				console.log(`${MODULE_TAG} Extracted otp.check URL from _links:`, otpCheckUrl);
			} else {
				console.warn(`${MODULE_TAG} No otp.check URL found in _links, will use fallback endpoint`);
			}

			console.log(`${MODULE_TAG} Device authentication initialized`, {
				deviceAuthId,
				status: authData.status,
				nextStep: authData.nextStep,
				hasOtpCheckLink: !!otpCheckUrl,
			});

			// According to PingOne MFA API docs, when you initialize device authentication with a deviceId,
			// the OTP is automatically sent for SMS/EMAIL devices. There is NO separate send-otp-to-device endpoint.
			// The endpoint auth.pingone.com/{envId}/deviceAuthentications/{id}/otp does not exist.
			//
			// If status is OTP_REQUIRED or nextStep is OTP_REQUIRED, the OTP has already been sent.
			// For resending OTP, use the resend-pairing-code endpoint instead (api.pingone.com).

			if (authData.status === 'OTP_REQUIRED' || authData.nextStep === 'OTP_REQUIRED') {
				console.log(`${MODULE_TAG} OTP automatically sent during initialization`, {
					deviceAuthId,
					hasOtpCheckUrl: !!otpCheckUrl,
				});
			} else {
				console.log(`${MODULE_TAG} Device authentication initialized, status: ${authData.status}`, {
					deviceAuthId,
				});
			}

			return {
				deviceAuthId,
				...(otpCheckUrl ? { otpCheckUrl } : {}),
			};
		} catch (error) {
			console.error(`${MODULE_TAG} Error in OTP flow:`, error);
			throw error;
		}
	}

	/**
	 * Resend pairing code (for SMS/EMAIL devices)
	 * POST /environments/{environmentId}/users/{userId}/devices/{deviceId}
	 * API Reference: https://apidocs.pingidentity.com/pingone/mfa/v1/api/#post-resend-pairing-code
	 *
	 * Note: This endpoint is used to resend activation codes for devices that are in ACTIVATION_REQUIRED state.
	 * For devices that are already activated, you cannot resend pairing codes. Instead, use the device
	 * authentication flow to send OTP codes.
	 *
	 * @param params - Device parameters
	 */
	static async resendPairingCode(params: SendOTPParams): Promise<void> {
		console.log(`${MODULE_TAG} [RESEND] Resending pairing code`, {
			username: params.username,
			deviceId: params.deviceId,
			environmentId: params.environmentId,
		});

		try {
			// Look up user by username
			const user = await MFAServiceV8.lookupUserByUsername(params.environmentId, params.username);

			// Get appropriate token (worker or user) based on credentials
			const tokenType = 'tokenType' in params ? (params as { tokenType?: 'worker' | 'user' }).tokenType : undefined;
			const userToken = 'userToken' in params ? (params as { userToken?: string }).userToken : undefined;
			const tokenParams: { tokenType?: 'worker' | 'user'; userToken?: string } = {};
			if (tokenType) tokenParams.tokenType = tokenType;
			if (userToken) tokenParams.userToken = userToken;
			const accessToken = await MFAServiceV8.getToken(Object.keys(tokenParams).length > 0 ? tokenParams : undefined);

			// Validate token before sending
			if (!accessToken || typeof accessToken !== 'string' || accessToken.trim().length === 0) {
				throw new Error('Worker token is missing or invalid. Please generate a new worker token.');
			}

			const trimmedToken = accessToken.trim();

			// Check if token is a valid JWT (should have 3 parts separated by dots)
			const tokenParts = trimmedToken.split('.');
			if (tokenParts.length !== 3) {
				console.error(`${MODULE_TAG} Invalid JWT token format`, {
					tokenParts: tokenParts.length,
					tokenLength: trimmedToken.length,
					tokenStart: trimmedToken.substring(0, 30),
					tokenEnd: trimmedToken.substring(trimmedToken.length - 10),
					fullToken: trimmedToken,
				});
				throw new Error('Worker token is not a valid JWT. Please generate a new worker token.');
			}

			console.log(`${MODULE_TAG} Token validation before resend:`, {
				tokenLength: trimmedToken.length,
				tokenStart: trimmedToken.substring(0, 30),
				tokenEnd: trimmedToken.substring(trimmedToken.length - 10),
				hasEquals: trimmedToken.includes('='),
				partsCount: trimmedToken.split('.').length,
				tokenParts: tokenParts.map((part, index) => ({
					part: index + 1,
					length: part.length,
					start: part.substring(0, 10),
				})),
			});

			// Optional: Check device status before resending
			// The resend-pairing-code endpoint only works for devices in ACTIVATION_REQUIRED state
			// If device is already ACTIVE, we should use the device authentication flow instead
			let deviceStatus: string | undefined;
			try {
				const device = await MFAServiceV8.getDevice({
					environmentId: params.environmentId,
					username: params.username,
					deviceId: params.deviceId,
				});
				deviceStatus = (device.status as string) || 'UNKNOWN';
				console.log(`${MODULE_TAG} [RESEND] Device status check:`, {
					deviceId: params.deviceId,
					status: deviceStatus,
					canResend: deviceStatus === 'ACTIVATION_REQUIRED',
				});

				if (deviceStatus === 'ACTIVE') {
					console.warn(
						`${MODULE_TAG} [RESEND] Device is already ACTIVE. Resend pairing code may fail. Consider using device authentication flow instead.`
					);
				}
			} catch (deviceError) {
				console.warn(
					`${MODULE_TAG} [RESEND] Could not check device status, proceeding anyway:`,
					deviceError
				);
				// Continue even if we can't check status - let PingOne API handle validation
			}

			// Resend pairing code via backend proxy
			// Note: This endpoint requires the device to be in ACTIVATION_REQUIRED state
			// If the device is already activated, this will fail with a validation error
			const requestBody = {
				environmentId: params.environmentId,
				userId: user.id,
				deviceId: params.deviceId,
				workerToken: trimmedToken,
			};

			console.log(`${MODULE_TAG} [RESEND] Request details:`, {
				environmentId: params.environmentId,
				userId: user.id,
				deviceId: params.deviceId,
				username: params.username,
				deviceStatus,
				tokenValidated: true,
			});

			const startTime = Date.now();
			const callId = apiCallTrackerService.trackApiCall({
				method: 'POST',
				url: '/api/pingone/mfa/resend-pairing-code',
				headers: {
					'Content-Type': 'application/json',
				},
				body: requestBody,
				step: 'mfa-Resend Pairing Code',
				flowType: 'mfa',
			});

			let response: Response;
			try {
				response = await pingOneFetch('/api/pingone/mfa/resend-pairing-code', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(requestBody),
					retry: { maxAttempts: 3 },
				});
			} catch (error) {
				apiCallTrackerService.updateApiCallResponse(
					callId,
					{
						status: 0,
						statusText: 'Network Error',
						error: error instanceof Error ? error.message : String(error),
					},
					Date.now() - startTime
				);
				throw error;
			}

			const responseClone = response.clone();
			let responseData: unknown;
			try {
				responseData = await responseClone.json();
			} catch {
				responseData = { error: 'Failed to parse response' };
			}

			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: response.status,
					statusText: response.statusText,
					headers: (() => {
						const headers: Record<string, string> = {};
						response.headers.forEach((value, key) => {
							headers[key] = value;
						});
						return headers;
					})(),
					data: responseData,
				},
				Date.now() - startTime
			);

			if (!response.ok) {
				const errorData = responseData as PingOneResponse & {
					details?: unknown;
					pingOneError?: unknown;
				};
				const errorMessage = errorData.message || errorData.error || response.statusText;
				const details = errorData.details || errorData.pingOneError;

				console.error(`${MODULE_TAG} [RESEND] Failed to resend pairing code:`, {
					status: response.status,
					statusText: response.statusText,
					errorMessage,
					details,
					fullError: errorData,
					requestBody: {
						environmentId: params.environmentId,
						userId: user.id,
						deviceId: params.deviceId,
					},
				});

				// Provide more helpful error message
				if (response.status === 400) {
					const validationMessage = details
						? `Validation error: ${JSON.stringify(details)}`
						: errorMessage;
					throw new Error(`Failed to resend pairing code: ${validationMessage}`);
				}

				throw new Error(`Failed to resend pairing code: ${errorMessage}`);
			}

			console.log(`${MODULE_TAG} Pairing code resent successfully`);
		} catch (error) {
			console.error(`${MODULE_TAG} Resend pairing code error`, error);
			throw error;
		}
	}

	/**
	 * Set the order of MFA devices for a user
	 * POST /mfa/v1/environments/{envId}/users/{userId}/devices/order
	 * API Reference: https://apidocs.pingidentity.com/pingone/mfa/v1/api/#post-set-device-order
	 * @param environmentId - PingOne environment ID
	 * @param userId - User ID
	 * @param orderedDeviceIds - Array of device IDs in the desired order
	 * @returns Result of the operation
	 */
	static async setUserMfaDeviceOrder(
		environmentId: string,
		userId: string,
		orderedDeviceIds: string[]
	): Promise<Record<string, unknown>> {
		const token = await MFAServiceV8.getWorkerToken();
		const requestId = `mfa-set-device-order-${Date.now()}`;
		const startTime = Date.now();
		const actualPingOneUrl = `https://api.pingone.com/v1/environments/${environmentId}/users/${userId}/devices/order`;

		try {
			console.log(`${MODULE_TAG} Setting device order for user ${userId}`, {
				environmentId,
				deviceCount: orderedDeviceIds.length,
				requestId,
			});

			// Track API call
			const callId = apiCallTrackerService.trackApiCall({
				method: 'POST',
				url: '/api/pingone/mfa/set-device-order',
				actualPingOneUrl,
				isProxy: true,
				source: 'frontend',
				headers: {
					'Content-Type': 'application/json',
					'X-Request-ID': requestId,
				},
				body: {
					environmentId,
					userId,
					deviceIds: orderedDeviceIds,
				},
				step: 'Set Device Order',
				flowType: 'mfa',
			});

			// Use backend proxy to avoid CORS issues
			const response = await pingOneFetch('/api/pingone/mfa/set-device-order', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-Request-ID': requestId,
				},
				body: JSON.stringify({
					environmentId,
					userId,
					deviceIds: orderedDeviceIds, // Backend expects deviceIds array
					workerToken: token.trim(),
				}),
			});

			const duration = Date.now() - startTime;
			const data = await response.json();

			// Update API call with response
			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: response.status,
					statusText: response.statusText,
					headers: Object.fromEntries(response.headers.entries()),
					data: response.ok ? data : { error: data.message || data.error },
				},
				duration
			);

			if (!response.ok) {
				const errorMsg = data.message || data.error || 'Failed to update device order';
				console.error(`${MODULE_TAG} Error setting device order:`, {
					status: response.status,
					error: errorMsg,
					requestId,
				});
				throw new Error(errorMsg);
			}

			console.log(`${MODULE_TAG} Successfully updated device order`, {
				userId,
				deviceCount: orderedDeviceIds.length,
				requestId,
			});

			return data;
		} catch (error) {
			console.error(`${MODULE_TAG} Exception in setUserMfaDeviceOrder:`, {
				error: error instanceof Error ? error.message : 'Unknown error',
				requestId,
				stack: error instanceof Error ? error.stack : undefined,
			});
			throw error;
		}
	}

	/**
	 * Remove MFA device order for a user
	 * Uses backend proxy: POST /api/pingone/mfa/remove-device-order
	 */
	static async removeUserMfaDeviceOrder(
		environmentId: string,
		userId: string
	): Promise<Record<string, unknown>> {
		const token = await MFAServiceV8.getWorkerToken();
		const requestId = `mfa-remove-device-order-${Date.now()}`;
		const startTime = Date.now();
		// According to PingOne API docs: POST /environments/{envID}/users/{userID}/devices
		// with Content-Type: application/vnd.pingidentity.devices.order.remove+json
		// No body is sent - the Content-Type header indicates the operation
		const actualPingOneUrl = `https://api.pingone.com/v1/environments/${environmentId}/users/${userId}/devices`;

		try {
			console.log(`${MODULE_TAG} Removing MFA device order for user ${userId}`, {
				environmentId,
				requestId,
			});

			// Track API call
			const callId = apiCallTrackerService.trackApiCall({
				method: 'POST',
				url: '/api/pingone/mfa/remove-device-order',
				actualPingOneUrl,
				isProxy: true,
				source: 'frontend',
				headers: {
					'Content-Type': 'application/json',
					'X-Request-ID': requestId,
				},
				body: {
					environmentId,
					userId,
				},
				step: 'Remove Device Order',
				flowType: 'mfa',
			});

			const response = await pingOneFetch('/api/pingone/mfa/remove-device-order', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-Request-ID': requestId,
				},
				body: JSON.stringify({
					environmentId,
					userId,
					workerToken: token.trim(),
				}),
			});

			const duration = Date.now() - startTime;
			const data = await response.json();

			// Update API call with response
			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: response.status,
					statusText: response.statusText,
					headers: Object.fromEntries(response.headers.entries()),
					data: response.ok ? data : { error: data.message || data.error },
				},
				duration
			);

			if (!response.ok) {
				const errorMsg = data.message || data.error || 'Failed to remove MFA device order';
				console.error(`${MODULE_TAG} Error removing device order:`, {
					status: response.status,
					error: errorMsg,
					requestId,
				});
				throw new Error(errorMsg);
			}

			console.log(`${MODULE_TAG} Successfully removed MFA device order`, {
				userId,
				requestId,
			});

			return data;
		} catch (error) {
			console.error(`${MODULE_TAG} Exception in removeUserMfaDeviceOrder:`, {
				error: error instanceof Error ? error.message : 'Unknown error',
				requestId,
			});
			throw error;
		}
	}

	/**
	 * Activate FIDO2 device using WebAuthn attestation data
	 * POST /mfa/v1/environments/{environmentId}/users/{userId}/devices/{deviceId}/fido2/activate
	 */
	static async activateFIDO2Device(
		params: ActivateFIDO2DeviceParams
	): Promise<Record<string, unknown>> {
		console.log(`${MODULE_TAG} Activating FIDO2 device`, {
			username: params.username,
			deviceId: params.deviceId,
		});

		try {
			const user = await MFAServiceV8.lookupUserByUsername(params.environmentId, params.username);
			
			// Check token status before attempting activation
			const tokenStatus = WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
			console.log(`${MODULE_TAG} 🔍 STEP 1: Token status check:`, {
				isValid: tokenStatus.isValid,
				status: tokenStatus.status,
				message: tokenStatus.message,
			});
			
			if (!tokenStatus.isValid || tokenStatus.status === 'expired') {
				const errorMessage = tokenStatus.status === 'expired' 
					? 'Worker token has expired. Please generate a new worker token to continue.'
					: 'Worker token is missing or invalid. Please generate a new worker token to continue.';
				
				const helpMessage = '\n\n🔑 To fix this:\n1. Go to the MFA Hub page\n2. Click "Manage Token" or "Add Token"\n3. Generate a new worker token\n4. Try registering your FIDO2 device again';
				
				console.error(`${MODULE_TAG} ❌ Token validation failed before FIDO2 activation:`, {
					tokenStatus: tokenStatus.status,
					message: tokenStatus.message,
					isValid: tokenStatus.isValid,
				});
				
				throw new Error(errorMessage + helpMessage);
			}
			
			console.log(`${MODULE_TAG} 🔍 STEP 2: Getting worker token from storage...`);
			const accessToken = await MFAServiceV8.getWorkerToken();
			
			console.log(`${MODULE_TAG} 🔍 STEP 3: Token retrieved from storage:`, {
				hasToken: !!accessToken,
				tokenType: typeof accessToken,
				tokenLength: accessToken ? String(accessToken).length : 0,
				tokenPreview: accessToken ? `${String(accessToken).substring(0, 30)}...${String(accessToken).substring(Math.max(0, String(accessToken).length - 30))}` : 'MISSING',
				hasWhitespace: accessToken ? /\s/.test(String(accessToken)) : false,
				hasNewlines: accessToken ? /[\r\n]/.test(String(accessToken)) : false,
				hasBearerPrefix: accessToken ? /^Bearer\s+/i.test(String(accessToken)) : false,
			});

			// Validate token before sending
			if (!accessToken || typeof accessToken !== 'string' || accessToken.trim().length === 0) {
				console.error(`${MODULE_TAG} ❌ Token validation failed: token is empty or invalid type`);
				throw new Error('Worker token is missing or invalid. Please generate a new worker token.');
			}

			// Validate token format (should be a JWT with 3 parts separated by dots)
			const tokenParts = accessToken.trim().split('.');
			console.log(`${MODULE_TAG} 🔍 STEP 4: Token format validation:`, {
				tokenLength: accessToken.length,
				tokenPreview: `${accessToken.substring(0, 30)}...${accessToken.substring(Math.max(0, accessToken.length - 30))}`,
				partsCount: tokenParts.length,
				partsLengths: tokenParts.map((p, i) => ({ part: i, length: p.length })),
				allPartsValid: tokenParts.length === 3 && tokenParts.every((part) => part.length > 0),
			});
			
			if (tokenParts.length !== 3 || tokenParts.some((part) => part.length === 0)) {
				console.error(`${MODULE_TAG} ❌ Invalid token format`, {
					tokenLength: accessToken.length,
					tokenPreview: accessToken.substring(0, 50),
					partsCount: tokenParts.length,
					partsLengths: tokenParts.map((p, i) => ({ part: i, length: p.length })),
				});
				throw new Error('Worker token format is invalid. Please generate a new worker token.');
			}

			const cleanToken = accessToken.trim();
			console.log(`${MODULE_TAG} 🔍 STEP 5: Token after trim:`, {
				originalLength: accessToken.length,
				cleanedLength: cleanToken.length,
				tokenPreview: `${cleanToken.substring(0, 30)}...${cleanToken.substring(Math.max(0, cleanToken.length - 30))}`,
				hasWhitespace: /\s/.test(cleanToken),
				hasNewlines: /[\r\n]/.test(cleanToken),
			});

			// Build fido2Data according to rightFIDO2.md
			// Frontend should send: { origin: string, attestation: JSON.stringify(attestationObj) }
			const fido2Data = params.fido2Data || {};
			
			const requestBody = {
				environmentId: params.environmentId,
				userId: user.id,
				deviceId: params.deviceId,
				workerToken: cleanToken,
				fido2Data: {
					origin: fido2Data.origin,
					// attestation should be a JSON string per rightFIDO2.md
					attestation: fido2Data.attestation || (fido2Data.attestationObject ? JSON.stringify({
						id: fido2Data.credentialId || '',
						type: 'public-key',
						rawId: fido2Data.rawId || fido2Data.credentialId || '',
						response: {
							clientDataJSON: fido2Data.clientDataJSON || '',
							attestationObject: fido2Data.attestationObject || '',
						},
						clientExtensionResults: {},
					}) : undefined),
				},
			};

			console.log(`${MODULE_TAG} 🔍 STEP 6: Request body constructed:`, {
				hasWorkerToken: !!requestBody.workerToken,
				workerTokenType: typeof requestBody.workerToken,
				workerTokenLength: requestBody.workerToken ? String(requestBody.workerToken).length : 0,
				workerTokenPreview: requestBody.workerToken ? `${String(requestBody.workerToken).substring(0, 30)}...${String(requestBody.workerToken).substring(Math.max(0, String(requestBody.workerToken).length - 30))}` : 'MISSING',
				workerTokenInBody: JSON.stringify(requestBody).includes('workerToken'),
				requestBodyKeys: Object.keys(requestBody),
				requestBodyStringified: JSON.stringify(requestBody).substring(0, 500),
			});

			console.log(`${MODULE_TAG} ✅ Token validation passed - ready to send to backend`, {
				tokenLength: cleanToken.length,
				tokenPreview: `${cleanToken.substring(0, 20)}...${cleanToken.substring(cleanToken.length - 20)}`,
				partsCount: tokenParts.length,
			});

			const startTime = Date.now();
			const callId = apiCallTrackerService.trackApiCall({
				method: 'POST',
				url: '/api/pingone/mfa/activate-fido2-device',
				headers: {
					'Content-Type': 'application/json',
				},
				body: requestBody,
				step: 'mfa-Activate FIDO2 Device',
				flowType: 'mfa',
			});

			console.log(`${MODULE_TAG} 🔍 STEP 7: Sending request to backend proxy...`);
			const requestBodyString = JSON.stringify(requestBody);
			console.log(`${MODULE_TAG} 🔍 STEP 7a: Request body stringified:`, {
				bodyLength: requestBodyString.length,
				bodyPreview: requestBodyString.substring(0, 500),
				hasWorkerToken: requestBodyString.includes('workerToken'),
				workerTokenPosition: requestBodyString.indexOf('workerToken'),
				workerTokenValuePreview: requestBodyString.substring(
					requestBodyString.indexOf('"workerToken":"') + 15,
					requestBodyString.indexOf('"workerToken":"') + 65
				),
			});
			
			let response: Response;
			try {
				response = await pingOneFetch('/api/pingone/mfa/activate-fido2-device', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: requestBodyString,
					retry: { maxAttempts: 3 },
				});
				console.log(`${MODULE_TAG} 🔍 STEP 8: Backend response received:`, {
					status: response.status,
					statusText: response.statusText,
					hasBody: !!response.body,
				});
			} catch (error) {
				apiCallTrackerService.updateApiCallResponse(
					callId,
					{
						status: 0,
						statusText: 'Network Error',
						error: error instanceof Error ? error.message : String(error),
					},
					Date.now() - startTime
				);
				throw error;
			}

			const responseClone = response.clone();
			let deviceData: unknown;
			try {
				deviceData = await responseClone.json();
			} catch {
				deviceData = { error: 'Failed to parse response' };
			}

			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: response.status,
					statusText: response.statusText,
					headers: (() => {
						const headers: Record<string, string> = {};
						response.headers.forEach((value, key) => {
							headers[key] = value;
						});
						return headers;
					})(),
					data: deviceData,
				},
				Date.now() - startTime
			);

			if (!response.ok) {
				const errorData = deviceData as PingOneResponse & { 
					debugInfo?: { origin?: string; originIsLocalhost?: boolean; hint?: string };
					debug?: { tokenType?: string; tokenExpired?: boolean };
				};
				const errorMessage = errorData.message || errorData.error || response.statusText;
				const tokenDebugInfo = errorData.debug as { tokenType?: string; tokenExpired?: boolean } | undefined;
				const originDebugInfo = errorData.debugInfo as { origin?: string; originIsLocalhost?: boolean; hint?: string } | undefined;
				
				// Check if this is a token expiration issue (403 Forbidden)
				if (response.status === 403) {
					const tokenExpired = tokenDebugInfo?.tokenExpired;
					const errorLower = errorMessage.toLowerCase();
					
					// Check if error suggests token issue (expired, invalid, or malformed)
					const mightBeTokenIssue = tokenExpired || 
						errorLower.includes('invalid') && (errorLower.includes('token') || errorLower.includes('authorization') || errorLower.includes('header')) ||
						errorLower.includes('expired') ||
						errorLower.includes('unauthorized');
					
					if (mightBeTokenIssue) {
						// Check token status before providing error
						let tokenStatusMessage = '';
						try {
							const tokenStatus = WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
							if (tokenStatus.status === 'expired' || !tokenStatus.isValid) {
								tokenStatusMessage = '\n\n🔑 Your worker token has expired or is invalid.';
								tokenStatusMessage += '\n\nTo fix this:';
								tokenStatusMessage += '\n1. Go to the MFA Hub page';
								tokenStatusMessage += '\n2. Click "Manage Token" or "Add Token"';
								tokenStatusMessage += '\n3. Generate a new worker token';
								tokenStatusMessage += '\n4. Try registering your FIDO2 device again';
							}
						} catch (tokenCheckError) {
							console.warn(`${MODULE_TAG} Could not check token status:`, tokenCheckError);
						}
						
						console.error(`${MODULE_TAG} FIDO2 activation failed with 403 (likely token issue):`, {
							status: response.status,
							error: errorMessage,
							tokenExpired,
							mightBeTokenIssue,
							tokenStatusMessage: tokenStatusMessage || 'none',
						});
						
						throw new Error(
							`Failed to activate FIDO2 device: ${errorMessage}${tokenStatusMessage}`
						);
					}
				}
				
				// Log detailed error info for debugging origin/RPID issues
				console.error(`${MODULE_TAG} FIDO2 activation failed:`, {
					status: response.status,
					error: errorMessage,
					debugInfo: originDebugInfo,
					// Check if error mentions origin/RPID
					mightBeOriginIssue: errorMessage.toLowerCase().includes('origin') || 
						errorMessage.toLowerCase().includes('rpid') || 
						errorMessage.toLowerCase().includes('relying party') ||
						errorMessage.toLowerCase().includes('invalid') && errorMessage.toLowerCase().includes('header'),
				});
				
				throw new Error(
					`Failed to activate FIDO2 device: ${errorMessage}${originDebugInfo?.hint ? ` (${originDebugInfo.hint})` : ''}`
				);
			}

			console.log(`${MODULE_TAG} FIDO2 device activated successfully`);
			return deviceData as Record<string, unknown>;
		} catch (error) {
			console.error(`${MODULE_TAG} activateFIDO2Device error`, error);
			throw error;
		}
	}

	/**
	 * Get FIDO2 device registration options from PingOne
	 * GET /mfa/v1/environments/{environmentId}/users/{userId}/devices/{deviceId}/registrationOptions
	 * This endpoint returns WebAuthn registration options (challenge, rp, user, etc.) for FIDO2 device registration
	 * @param params - Device parameters
	 * @returns WebAuthn registration options (PublicKeyCredentialCreationOptions)
	 */
	static async getFIDO2RegistrationOptions(
		params: SendOTPParams
	): Promise<Record<string, unknown>> {
		console.log(`${MODULE_TAG} Getting FIDO2 registration options`, {
			username: params.username,
			deviceId: params.deviceId,
		});

		try {
			const user = await MFAServiceV8.lookupUserByUsername(params.environmentId, params.username);
			const accessToken = await MFAServiceV8.getWorkerToken();

			const requestBody = {
				environmentId: params.environmentId,
				userId: user.id,
				deviceId: params.deviceId,
				workerToken: accessToken.trim(),
			};

			const startTime = Date.now();
			const callId = apiCallTrackerService.trackApiCall({
				method: 'GET',
				url: '/api/pingone/mfa/fido2-registration-options',
				headers: {
					'Content-Type': 'application/json',
				},
				body: requestBody,
				step: 'mfa-Get FIDO2 Registration Options',
				flowType: 'mfa',
			});

			let response: Response;
			try {
				response = await pingOneFetch('/api/pingone/mfa/fido2-registration-options', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(requestBody),
					retry: { maxAttempts: 3 },
				});
			} catch (error) {
				apiCallTrackerService.updateApiCallResponse(
					callId,
					{
						status: 0,
						statusText: 'Network Error',
						error: error instanceof Error ? error.message : String(error),
					},
					Date.now() - startTime
				);
				throw error;
			}

			const responseClone = response.clone();
			let optionsData: unknown;
			try {
				optionsData = await responseClone.json();
			} catch {
				optionsData = { error: 'Failed to parse response' };
			}

			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: response.status,
					statusText: response.statusText,
					headers: (() => {
						const headers: Record<string, string> = {};
						response.headers.forEach((value, key) => {
							headers[key] = value;
						});
						return headers;
					})(),
					data: optionsData,
				},
				Date.now() - startTime
			);

			if (!response.ok) {
				const errorData = optionsData as PingOneResponse;
				throw new Error(
					`Failed to get FIDO2 registration options: ${errorData.message || errorData.error || response.statusText}`
				);
			}

			console.log(`${MODULE_TAG} FIDO2 registration options retrieved successfully`);
			return optionsData as Record<string, unknown>;
		} catch (error) {
			console.error(`${MODULE_TAG} getFIDO2RegistrationOptions error`, error);
			throw error;
		}
	}

	/**
	 * Activate MFA user device with OTP
	 * POST /v1/environments/{environmentId}/users/{userId}/devices/{deviceId}/operations/activate
	 * API Reference: https://apidocs.pingidentity.com/pingone/platform/v1/api/#devices
	 * Phase 1 Spec: Device activation uses Platform APIs (not MFA v1 APIs)
	 * @param params - Device activation parameters (includes OTP)
	 * @returns Activated device data
	 */
	static async activateDevice(params: ActivateDeviceParams): Promise<Record<string, unknown>> {
		console.log(`${MODULE_TAG} Activating device with OTP`, {
			username: params.username,
			deviceId: params.deviceId,
			hasOtp: !!params.otp,
			hasDeviceActivateUri: !!params.deviceActivateUri,
		});

		try {
			// Look up user by username
			const user = await MFAServiceV8.lookupUserByUsername(params.environmentId, params.username);

			// Get appropriate token (worker or user) based on credentials
			const tokenType = 'tokenType' in params ? (params as { tokenType?: 'worker' | 'user' }).tokenType : undefined;
			const userToken = 'userToken' in params ? (params as { userToken?: string }).userToken : undefined;
			const tokenParams: { tokenType?: 'worker' | 'user'; userToken?: string } = {};
			if (tokenType) tokenParams.tokenType = tokenType;
			if (userToken) tokenParams.userToken = userToken;
			const accessToken = await MFAServiceV8.getToken(Object.keys(tokenParams).length > 0 ? tokenParams : undefined);

			// Activate device via backend proxy
			// Per rightOTP.md: POST /v1/environments/{ENV_ID}/users/{USER_ID}/devices/{DEVICE_ID}
			// Content-Type: application/vnd.pingidentity.device.activate+json
			// Body: { "otp": "<userEnteredCode>" }
			// Same pattern as TOTP activation
			const requestBody = {
				environmentId: params.environmentId,
				userId: user.id,
				deviceId: params.deviceId,
				otp: params.otp,
				workerToken: accessToken.trim(),
			};

			const startTime = Date.now();
			const callId = apiCallTrackerService.trackApiCall({
				method: 'POST',
				url: '/api/pingone/mfa/activate-device',
				headers: {
					'Content-Type': 'application/json',
				},
				body: requestBody,
				step: 'mfa-Activate Device',
				flowType: 'mfa',
			});

			let response: Response;
			try {
				response = await pingOneFetch('/api/pingone/mfa/activate-device', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(requestBody),
					retry: { maxAttempts: 3 },
				});
			} catch (error) {
				apiCallTrackerService.updateApiCallResponse(
					callId,
					{
						status: 0,
						statusText: 'Network Error',
						error: error instanceof Error ? error.message : String(error),
					},
					Date.now() - startTime
				);
				throw error;
			}

			const responseClone = response.clone();
			let deviceData: unknown;
			try {
				deviceData = await responseClone.json();
			} catch {
				deviceData = { error: 'Failed to parse response' };
			}

			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: response.status,
					statusText: response.statusText,
					headers: (() => {
						const headers: Record<string, string> = {};
						response.headers.forEach((value, key) => {
							headers[key] = value;
						});
						return headers;
					})(),
					data: deviceData,
				},
				Date.now() - startTime
			);

			if (!response.ok) {
				const errorData = deviceData as PingOneResponse;
				throw new Error(
					`Failed to activate device: ${errorData.message || errorData.error || response.statusText}`
				);
			}

			console.log(`${MODULE_TAG} Device activated successfully`);
			return deviceData as Record<string, unknown>;
		} catch (error) {
			console.error(`${MODULE_TAG} Activate device error`, error);
			throw error;
		}
	}

	/**
	 * Get user MFA enabled status
	 * GET /environments/{environmentId}/users/{userId}/mfaEnabled
	 * API Reference: https://apidocs.pingidentity.com/pingone/mfa/v1/api/#read-user-mfa-enabled
	 * @param params - User parameters
	 * @returns MFA enabled status
	 */
	static async getUserMFAEnabled(
		params: MFACredentials & { userId: string }
	): Promise<{ mfaEnabled: boolean }> {
		console.log(`${MODULE_TAG} Getting user MFA enabled status`, {
			username: params.username,
			userId: params.userId,
		});

		try {
			// Get worker token
			const accessToken = await MFAServiceV8.getWorkerToken();

			// Get user MFA enabled status via backend proxy
			const requestBody = {
				environmentId: params.environmentId,
				userId: params.userId,
				workerToken: accessToken.trim(),
			};

			const startTime = Date.now();
			const callId = apiCallTrackerService.trackApiCall({
				method: 'GET',
				url: '/api/pingone/mfa/get-user-mfa-enabled',
				headers: {
					'Content-Type': 'application/json',
				},
				body: requestBody,
				step: 'mfa-Get User MFA Enabled',
				flowType: 'mfa',
			});

			let response: Response;
			try {
				response = await pingOneFetch('/api/pingone/mfa/get-user-mfa-enabled', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(requestBody),
					retry: { maxAttempts: 3 },
				});
			} catch (error) {
				apiCallTrackerService.updateApiCallResponse(
					callId,
					{
						status: 0,
						statusText: 'Network Error',
						error: error instanceof Error ? error.message : String(error),
					},
					Date.now() - startTime
				);
				throw error;
			}

			const responseClone = response.clone();
			let responseData: unknown;
			try {
				responseData = await responseClone.json();
			} catch {
				responseData = { error: 'Failed to parse response' };
			}

			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: response.status,
					statusText: response.statusText,
					headers: (() => {
						const headers: Record<string, string> = {};
						response.headers.forEach((value, key) => {
							headers[key] = value;
						});
						return headers;
					})(),
					data: responseData,
				},
				Date.now() - startTime
			);

			if (!response.ok) {
				const errorData = responseData as PingOneResponse;
				throw new Error(
					`Failed to get user MFA enabled status: ${errorData.message || errorData.error || response.statusText}`
				);
			}

			const mfaData = responseData as { mfaEnabled: boolean };
			console.log(`${MODULE_TAG} User MFA enabled status:`, mfaData);
			return mfaData;
		} catch (error) {
			console.error(`${MODULE_TAG} Get user MFA enabled error`, error);
			throw error;
		}
	}

	/**
	 * Enable or disable MFA for a user
	 * PUT /environments/{environmentId}/users/{userId}/mfaEnabled
	 * API Reference: https://apidocs.pingidentity.com/pingone/mfa/v1/api/#update-user-mfa-enabled
	 * @param params - User parameters with MFA enabled status
	 * @returns Updated MFA enabled status
	 */
	static async updateUserMFAEnabled(
		params: MFACredentials & { userId: string; mfaEnabled: boolean }
	): Promise<{ mfaEnabled: boolean }> {
		console.log(`${MODULE_TAG} Updating user MFA enabled status`, {
			username: params.username,
			userId: params.userId,
			mfaEnabled: params.mfaEnabled,
		});

		try {
			// Get worker token
			const accessToken = await MFAServiceV8.getWorkerToken();

			// Update user MFA enabled status via backend proxy
			const requestBody = {
				environmentId: params.environmentId,
				userId: params.userId,
				mfaEnabled: params.mfaEnabled,
				workerToken: accessToken.trim(),
			};

			const startTime = Date.now();
			const callId = apiCallTrackerService.trackApiCall({
				method: 'PUT',
				url: '/api/pingone/mfa/update-user-mfa-enabled',
				headers: {
					'Content-Type': 'application/json',
				},
				body: requestBody,
				step: `mfa-${params.mfaEnabled ? 'Enable' : 'Disable'} User MFA`,
			});

			let response: Response;
			try {
				response = await pingOneFetch('/api/pingone/mfa/update-user-mfa-enabled', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(requestBody),
					retry: { maxAttempts: 3 },
				});
			} catch (error) {
				apiCallTrackerService.updateApiCallResponse(
					callId,
					{
						status: 0,
						statusText: 'Network Error',
						error: error instanceof Error ? error.message : String(error),
					},
					Date.now() - startTime
				);
				throw error;
			}

			const responseClone = response.clone();
			let responseData: unknown;
			try {
				responseData = await responseClone.json();
			} catch {
				responseData = { error: 'Failed to parse response' };
			}

			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: response.status,
					statusText: response.statusText,
					headers: (() => {
						const headers: Record<string, string> = {};
						response.headers.forEach((value, key) => {
							headers[key] = value;
						});
						return headers;
					})(),
					data: responseData,
				},
				Date.now() - startTime
			);

			if (!response.ok) {
				const errorData = responseData as PingOneResponse;
				throw new Error(
					`Failed to update user MFA enabled status: ${errorData.message || errorData.error || response.statusText}`
				);
			}

			const mfaData = responseData as { mfaEnabled: boolean };
			console.log(`${MODULE_TAG} User MFA enabled status updated:`, mfaData);
			return mfaData;
		} catch (error) {
			console.error(`${MODULE_TAG} Update user MFA enabled error`, error);
			throw error;
		}
	}

	/**
	 * Initialize device authentication using the PingOne MFA API
	 * POST /mfa/v1/environments/{environmentId}/users/{userId}/deviceAuthentications
	 * API Reference: https://apidocs.pingidentity.com/pingone/mfa/v1/api/#post-initialize-device-authentication
	 * @param params - Device authentication parameters (deviceId optional, policy recommended)
	 * @returns Authentication data including authenticationId (deviceAuthID)
	 */
	/**
	 * @deprecated Use MfaAuthenticationServiceV8.initializeDeviceAuthentication() instead
	 * This method will be removed in the next major version
	 */
	static async initializeDeviceAuthentication(
		params: MFACredentials & {
			deviceId?: string;
			deviceAuthenticationPolicyId?: string;
			region?: string;
		}
	): Promise<{
		id: string; // authenticationId (deviceAuthID)
		status: string;
		nextStep?: string; // OTP_REQUIRED, ASSERTION_REQUIRED, SELECTION_REQUIRED, etc.
		devices?: Array<{ id: string; type: string; nickname?: string }>;
		challengeId?: string;
		otpCheckUrl?: string; // URL from _links['otp.check'].href when OTP_REQUIRED
		[key: string]: unknown;
	}> {
		console.warn(`${MODULE_TAG} DEPRECATION WARNING: initializeDeviceAuthentication() is deprecated. Use MfaAuthenticationServiceV8.initializeDeviceAuthentication() instead.`);
		console.log(`${MODULE_TAG} Initializing device authentication via PingOne MFA API`, {
			username: params.username,
			deviceId: params.deviceId,
			policyId: params.deviceAuthenticationPolicyId,
		});

		try {
			// Read policy to check deviceSelection setting if policyId is provided
			let policy: DeviceAuthenticationPolicy | null = null;
			if (params.deviceAuthenticationPolicyId) {
				try {
					policy = await MFAServiceV8.readDeviceAuthenticationPolicy(
						params.environmentId,
						params.deviceAuthenticationPolicyId
					);
					console.log(`${MODULE_TAG} [DEVICE_SELECTION] Policy loaded successfully:`, {
						policyId: params.deviceAuthenticationPolicyId,
						policyName: policy.name,
						authentication: policy.authentication,
						deviceSelection: policy.authentication && 'deviceSelection' in policy.authentication ? policy.authentication.deviceSelection : undefined,
						fullPolicy: JSON.stringify(policy, null, 2),
					});
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : String(error);
					console.warn(
						`${MODULE_TAG} [DEVICE_SELECTION] Failed to read policy, continuing without policy check:`,
						{
							policyId: params.deviceAuthenticationPolicyId,
							error: errorMessage,
							errorDetails: error instanceof Error ? error.stack : undefined,
						}
					);
					// Continue without policy - don't fail initialization
					// The policy might not be available via API yet, so we'll proceed without it
				}
			} else {
				console.log(
					`${MODULE_TAG} [DEVICE_SELECTION] No policy ID provided, skipping policy check`
				);
			}

			// Lookup user by username to obtain the PingOne user ID required by the MFA API
			const user = await MFAServiceV8.lookupUserByUsername(params.environmentId, params.username);

			// Check user lock status if policy requires it (skipUserLockVerification is false or undefined)
			// If skipUserLockVerification is true, skip the check
			if (policy?.skipUserLockVerification !== true) {
				// Check if user is locked (check multiple possible fields)
				const isLocked = user?.locked === true || 
					user?.account?.locked === true || 
					user?.status === 'LOCKED' ||
					user?.account?.status === 'LOCKED';

				if (isLocked) {
					const errorMessage = 'User account is locked. Please contact your administrator to unlock your account.';
					console.error(`${MODULE_TAG} User is locked, blocking authentication:`, {
						userId: user.id,
						username: params.username,
						userStatus: user?.status,
						accountStatus: user?.account?.status,
						userLocked: user?.locked,
						accountLocked: user?.account?.locked,
					});
					throw new Error(errorMessage);
				}
			} else {
				console.log(`${MODULE_TAG} Skipping user lock verification (skipUserLockVerification=true)`);
			}

			// Retrieve and trim the worker token
			const accessToken = await MFAServiceV8.getWorkerToken();
			const trimmedToken = accessToken.trim();

			const requestBody: {
				environmentId: string;
				userId: string;
				workerToken: string;
				deviceId?: string;
				policyId?: string;
				region?: string;
			} = {
				environmentId: params.environmentId,
				userId: user.id,
				workerToken: trimmedToken,
			};

			if (params.deviceId) {
				requestBody.deviceId = params.deviceId;
			}

			if (params.deviceAuthenticationPolicyId) {
				requestBody.policyId = params.deviceAuthenticationPolicyId;
			}

			if (params.region) {
				requestBody.region = params.region;
			}

			console.log(`${MODULE_TAG} Calling backend initialize-device-authentication endpoint`, {
				url: '/api/pingone/mfa/initialize-device-authentication',
				body: requestBody,
			});

			const startTime = Date.now();
			const callId = apiCallTrackerService.trackApiCall({
				method: 'POST',
				url: '/api/pingone/mfa/initialize-device-authentication',
				headers: {
					'Content-Type': 'application/json',
				},
				body: requestBody,
				step: 'mfa-Initialize Device Authentication',
				flowType: 'mfa',
			});

			let response: Response;
			try {
				response = await pingOneFetch('/api/pingone/mfa/initialize-device-authentication', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(requestBody),
					retry: { maxAttempts: 3 },
				});
			} catch (error) {
				apiCallTrackerService.updateApiCallResponse(
					callId,
					{
						status: 0,
						statusText: 'Network Error',
						error: error instanceof Error ? error.message : String(error),
					},
					Date.now() - startTime
				);
				throw error;
			}

			const responseClone = response.clone();
			let responseData: unknown;
			try {
				responseData = await responseClone.json();
			} catch {
				responseData = { error: 'Failed to parse response' };
			}

			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: response.status,
					statusText: response.statusText,
					headers: Object.fromEntries(response.headers.entries()),
					data: responseData,
				},
				Date.now() - startTime
			);

			if (!response.ok) {
				const errorData = responseData as PingOneResponse;
				const errorMessage = errorData.message || errorData.error || response.statusText;

				console.error(`${MODULE_TAG} Initialize device authentication (PingOne MFA API) failed`, {
					status: response.status,
					statusText: response.statusText,
					errorData,
					environmentId: params.environmentId,
					userId: user.id,
					tokenLength: trimmedToken.length,
				});

				if (response.status === 403) {
					throw new Error(
						`Failed to initialize device authentication: ${errorMessage}. ` +
							`Verify the worker token has the necessary permissions for MFA operations.`
					);
				}

				throw new Error(`Failed to initialize device authentication: ${errorMessage}`);
			}

			const authData = responseData as {
				id: string;
				status: string;
				nextStep?: string;
				devices?: Array<{ id: string; type: string; nickname?: string }>;
				challengeId?: string;
				_links?: {
					'otp.check'?: { href: string };
					[key: string]: unknown;
				};
				[key: string]: unknown;
			};

			// Extract otp.check URL from _links when status is OTP_REQUIRED
			// The otp.check link is only present when OTP validation is required
			let otpCheckUrl: string | undefined;
			if (authData.status === 'OTP_REQUIRED' || authData.nextStep === 'OTP_REQUIRED') {
				if (authData._links?.['otp.check']?.href) {
					otpCheckUrl = authData._links['otp.check'].href;
					console.log(`${MODULE_TAG} Extracted otp.check URL from _links:`, otpCheckUrl);
				} else {
					console.warn(
						`${MODULE_TAG} Status is OTP_REQUIRED but no otp.check URL found in _links`,
						{
							status: authData.status,
							nextStep: authData.nextStep,
							hasLinks: !!authData._links,
							linksKeys: authData._links ? Object.keys(authData._links) : [],
						}
					);
				}
			}

			// Honor deviceSelection policy setting
			// Three possible values:
			// 1. DEFAULT_TO_FIRST / DEFAULT_TO_FIRST_DEVICE: Always auto-select first device
			// 2. PROMPT_TO_SELECT_DEVICE: If 1 device, auto-select; if >1, show selection list
			// 3. ALWAYS_DISPLAY_DEVICES: Always show selection list (no auto-selection)
			const deviceSelection = policy?.authentication && 'deviceSelection' in policy.authentication ? policy.authentication.deviceSelection : undefined;
			const needsDeviceSelection =
				authData.status === 'DEVICE_SELECTION_REQUIRED' ||
				authData.nextStep === 'SELECTION_REQUIRED' ||
				(authData.devices && authData.devices.length > 0);

			console.log(`${MODULE_TAG} [DEVICE_SELECTION] Evaluating device selection logic:`, {
				hasPolicy: !!policy,
				deviceSelection,
				deviceSelectionType: typeof deviceSelection,
				needsDeviceSelection,
				authStatus: authData.status,
				nextStep: authData.nextStep,
				deviceCount: authData.devices?.length || 0,
				hasPreSelectedDevice: !!params.deviceId,
				preSelectedDeviceId: params.deviceId,
				devices: authData.devices,
				policyAuthentication: policy?.authentication,
				fullAuthData: JSON.stringify(authData, null, 2),
			});

			// Only auto-select if no device was pre-selected and devices are available
			if (
				!params.deviceId && // No device was pre-selected
				needsDeviceSelection &&
				authData.devices &&
				authData.devices.length > 0
			) {
				let shouldAutoSelect = false;

				if (
					deviceSelection === 'DEFAULT_TO_FIRST' ||
					deviceSelection === 'DEFAULT_TO_FIRST_DEVICE'
				) {
					// Always auto-select first device
					shouldAutoSelect = true;
				} else if (deviceSelection === 'PROMPT_TO_SELECT_DEVICE') {
					// Auto-select only if there's exactly 1 device
					shouldAutoSelect = authData.devices.length === 1;
				}
				// ALWAYS_DISPLAY_DEVICES: shouldAutoSelect remains false, UI will show selection list

				if (shouldAutoSelect) {
					const firstDevice = authData.devices[0];
					console.log(
						`${MODULE_TAG} Policy requires auto-selection, automatically selecting first device:`,
						{
							deviceId: firstDevice.id,
							deviceType: firstDevice.type,
							deviceSelection,
							deviceCount: authData.devices.length,
						}
					);

					// Automatically select the first device
					try {
						const selectResult = await MFAServiceV8.selectDeviceForAuthentication({
							environmentId: params.environmentId,
							username: params.username,
							authenticationId: authData.id,
							deviceId: firstDevice.id,
						});

						console.log(`${MODULE_TAG} Automatically selected first device per policy`, {
							deviceId: firstDevice.id,
							newStatus: selectResult.status,
							newNextStep: selectResult.nextStep,
						});

						// Return the result of device selection instead of initial response
						// Ensure we include the authenticationId from the original response
						const result: {
							id: string;
							status: string;
							nextStep?: string;
							devices?: Array<{ id: string; type: string; nickname?: string }>;
							challengeId?: string;
							otpCheckUrl?: string;
							[key: string]: unknown;
						} = {
							id: authData.id, // Keep the original authenticationId
							...selectResult,
						};

						// Ensure status is set
						if (selectResult.status) {
							result.status = selectResult.status;
						}

						// Only add otpCheckUrl if it exists and is a string
						if (selectResult.otpCheckUrl && typeof selectResult.otpCheckUrl === 'string') {
							result.otpCheckUrl = selectResult.otpCheckUrl;
						}

						return result;
					} catch (selectError) {
						console.error(
							`${MODULE_TAG} Failed to auto-select first device, returning initial response:`,
							selectError
						);
						// If auto-selection fails, return the original response so UI can handle it
					}
				} else {
					console.log(`${MODULE_TAG} [DEVICE_SELECTION] Policy requires device selection UI:`, {
						deviceSelection,
						deviceSelectionValue: String(deviceSelection),
						deviceCount: authData.devices.length,
						reason:
							deviceSelection === 'ALWAYS_DISPLAY_DEVICES'
								? 'Policy requires always showing device list'
								: deviceSelection === 'PROMPT_TO_SELECT_DEVICE'
									? 'Multiple devices require user selection'
									: 'No auto-selection policy',
						shouldAutoSelect,
						hasPolicy: !!policy,
						policyId: params.deviceAuthenticationPolicyId,
					});
				}
			} else {
				console.log(`${MODULE_TAG} [DEVICE_SELECTION] Skipping auto-selection:`, {
					hasPreSelectedDevice: !!params.deviceId,
					needsDeviceSelection,
					hasDevices: !!(authData.devices && authData.devices.length > 0),
					deviceCount: authData.devices?.length || 0,
				});
			}

			console.log(
				`${MODULE_TAG} [DEVICE_SELECTION] Device authentication initialized via PingOne API`,
				{
					id: authData.id,
					status: authData.status,
					nextStep: authData.nextStep,
					hasDevices: !!authData.devices,
					hasOtpCheckLink: !!otpCheckUrl,
					deviceSelection,
					deviceSelectionValue: String(deviceSelection),
					autoSelectedDevice:
						deviceSelection === 'DEFAULT_TO_FIRST' || deviceSelection === 'DEFAULT_TO_FIRST_DEVICE',
					policyId: params.deviceAuthenticationPolicyId,
					hasPolicy: !!policy,
					fullResponse: JSON.stringify(authData, null, 2),
				}
			);

			return {
				...authData,
				...(otpCheckUrl ? { otpCheckUrl } : {}),
			};
		} catch (error) {
			console.error(`${MODULE_TAG} Initialize device authentication error`, error);
			throw error;
		}
	}

	/**
	 * @deprecated Use initializeDeviceAuthentication instead.
	 * Retained for backwards compatibility with earlier flows that referenced the
	 * auth.pingone.com endpoint directly.
	 */
	static async initializeDeviceAuthenticationAuth(
		params: MFACredentials & {
			deviceId?: string;
			deviceAuthenticationPolicyId?: string;
			region?: string;
		}
	): Promise<{
		id: string;
		status: string;
		nextStep?: string;
		devices?: Array<{ id: string; type: string; nickname?: string }>;
		challengeId?: string;
		[key: string]: unknown;
	}> {
		console.warn(
			`${MODULE_TAG} initializeDeviceAuthenticationAuth is deprecated. Forwarding to initializeDeviceAuthentication().`,
			{ hasPolicy: !!params.deviceAuthenticationPolicyId }
		);

		return MFAServiceV8.initializeDeviceAuthentication(params);
	}

	/**
	 * Read device authentication details from PingOne MFA API
	 * GET /mfa/v1/environments/{environmentId}/deviceAuthentications/{deviceAuthenticationId}
	 * @param params - Environment & authentication identifiers
	 * @returns Device authentication record
	 */
	/**
	 * @deprecated Use MfaAuthenticationServiceV8.readDeviceAuthentication() instead
	 * This method will be removed in the next major version
	 */
	static async readDeviceAuthentication(params: {
		environmentId: string;
		authenticationId: string;
		region?: string;
	}): Promise<Record<string, unknown>> {
		console.log(`${MODULE_TAG} Reading device authentication record`, {
			environmentId: params.environmentId,
			authenticationId: params.authenticationId,
			region: params.region || 'na',
		});

		try {
			const accessToken = await MFAServiceV8.getWorkerToken();
			const trimmedToken = accessToken.trim();

			const requestBody = {
				environmentId: params.environmentId,
				authenticationId: params.authenticationId,
				workerToken: trimmedToken,
				...(params.region ? { region: params.region } : {}),
			};

			// Build the actual PingOne endpoint URL for display
			const normalizedRegion = params.region || 'na';
			const tld = normalizedRegion === 'eu' ? 'eu' : normalizedRegion === 'asia' ? 'asia' : 'com';
			const authPath = `https://auth.pingone.${tld}`;
			const actualPingOneUrl = `${authPath}/${params.environmentId}/deviceAuthentications/${params.authenticationId}`;

			const startTime = Date.now();
			const callId = apiCallTrackerService.trackApiCall({
				method: 'GET',
				url: '/api/pingone/mfa/read-device-authentication',
				actualPingOneUrl: actualPingOneUrl,
				headers: {
					'Content-Type': 'application/json',
				},
				body: requestBody,
				step: 'mfa-Read Device Authentication',
				flowType: 'mfa',
			});

			let response: Response;
			try {
				response = await pingOneFetch('/api/pingone/mfa/read-device-authentication', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(requestBody),
					retry: { maxAttempts: 3 },
				});
			} catch (error) {
				apiCallTrackerService.updateApiCallResponse(
					callId,
					{
						status: 0,
						statusText: 'Network Error',
						error: error instanceof Error ? error.message : String(error),
					},
					Date.now() - startTime
				);
				throw error;
			}

			const responseClone = response.clone();
			let responseData: unknown;
			try {
				responseData = await responseClone.json();
			} catch {
				responseData = { error: 'Failed to parse response' };
			}

			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: response.status,
					statusText: response.statusText,
					headers: Object.fromEntries(response.headers.entries()),
					data: responseData,
				},
				Date.now() - startTime
			);

			if (!response.ok) {
				const errorData = responseData as PingOneResponse;
				throw new Error(
					`Failed to read device authentication: ${errorData.message || errorData.error || response.statusText}`
				);
			}

			return responseData as Record<string, unknown>;
		} catch (error) {
			console.error(`${MODULE_TAG} Read device authentication error`, error);
			throw error instanceof Error ? error : new Error(String(error));
		}
	}

	/**
	 * Validate OTP for Device Authentication (Auth Server endpoint)
	 * POST https://auth.pingone.com/{ENV_ID}/deviceAuthentications/{DEVICE_AUTHENTICATION_ID}/passcode
	 * Per master-sms.md: Use /passcode endpoint, NOT /otp
	 * Request body: { otp, deviceAuthenticationId }
	 * API Reference: https://apidocs.pingidentity.com/pingone/mfa/v1/api/#post-validate-otp-for-device
	 * @param params - Authentication parameters with OTP
	 * @returns Validation result
	 */
	static async validateOTPForDevice(
		params: MFACredentials & { authenticationId: string; otp: string }
	): Promise<{ status: string; [key: string]: unknown }> {
		console.log(`${MODULE_TAG} Validating OTP for device authentication`, {
			username: params.username,
			authenticationId: params.authenticationId,
		});

		try {
			// Lookup user by username
			const user = await MFAServiceV8.lookupUserByUsername(params.environmentId, params.username);

			// Get worker token
			const accessToken = await MFAServiceV8.getWorkerToken();

			// Validate OTP via backend proxy
			const requestBody = {
				environmentId: params.environmentId,
				userId: user.id,
				authenticationId: params.authenticationId,
				otp: params.otp,
				workerToken: accessToken.trim(),
			};

			const startTime = Date.now();
			const callId = apiCallTrackerService.trackApiCall({
				method: 'POST',
				url: '/api/pingone/mfa/validate-otp-for-device',
				headers: {
					'Content-Type': 'application/json',
				},
				body: requestBody,
				step: 'mfa-Validate OTP for Device',
				flowType: 'mfa',
			});

			let response: Response;
			try {
				response = await pingOneFetch('/api/pingone/mfa/validate-otp-for-device', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(requestBody),
					retry: { maxAttempts: 3 },
				});
			} catch (error) {
				apiCallTrackerService.updateApiCallResponse(
					callId,
					{
						status: 0,
						statusText: 'Network Error',
						error: error instanceof Error ? error.message : String(error),
					},
					Date.now() - startTime
				);
				throw error;
			}

			const responseClone = response.clone();
			let responseData: unknown;
			try {
				responseData = await responseClone.json();
			} catch {
				responseData = { error: 'Failed to parse response' };
			}

			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: response.status,
					statusText: response.statusText,
					headers: (() => {
						const headers: Record<string, string> = {};
						response.headers.forEach((value, key) => {
							headers[key] = value;
						});
						return headers;
					})(),
					data: responseData,
				},
				Date.now() - startTime
			);

			if (!response.ok) {
				const errorData = responseData as PingOneResponse & {
					code?: string;
					details?: PingOneErrorDetail[];
				};

				const attemptsRemaining = Array.isArray(errorData.details)
					? errorData.details
							.map((detail) => detail?.innerError?.attemptsRemaining)
							.find((attempts) => typeof attempts === 'number')
					: undefined;

				const pingError = new Error(
					`Failed to validate OTP: ${errorData.message || errorData.error || response.statusText}`
				) as OTPValidationError;

				pingError.status = response.status;
				if (typeof errorData.code === 'string') {
					pingError.code = errorData.code;
				}
				if (typeof errorData.details !== 'undefined') {
					pingError.details = errorData.details;
				}
				pingError.pingResponse = errorData;

				if (typeof attemptsRemaining === 'number') {
					pingError.attemptsRemaining = attemptsRemaining;
					console.warn(`${MODULE_TAG} OTP validation attempts remaining:`, attemptsRemaining);
				}

				throw pingError;
			}

			const validationData = responseData as { status: string; [key: string]: unknown };
			console.log(`${MODULE_TAG} OTP validated:`, validationData);
			return validationData;
		} catch (error) {
			console.error(`${MODULE_TAG} Validate OTP for device error`, error);
			throw error;
		}
	}

	/**
	 * Cancel Device Authentication (Auth Server endpoint)
	 * POST https://auth.pingone.com/{ENV_ID}/deviceAuthentications/{DEVICE_AUTHENTICATION_ID}/cancel
	 * API Reference: https://apidocs.pingidentity.com/pingone/mfa/v1/api/#post-cancel-device-authentication
	 * @param params - Authentication parameters with authenticationId (and optional reason)
	 * @returns Cancel result
	 */
	/**
	 * @deprecated Use MfaAuthenticationServiceV8.cancelDeviceAuthentication() instead
	 * This method will be removed in the next major version
	 */
	static async cancelDeviceAuthentication(
		params: MFACredentials & {
			authenticationId: string;
			reason?: 'SIGNOUT' | 'CHANGE_DEVICE' | 'ADD_DEVICE' | 'USER_CANCELLED';
		}
	): Promise<{ status: string; [key: string]: unknown }> {
		const cancelReason = params.reason || 'USER_CANCELLED';
		console.log(`${MODULE_TAG} Canceling device authentication`, {
			username: params.username,
			authenticationId: params.authenticationId,
			reason: cancelReason,
		});

		try {
			// Lookup user by username
			const user = await MFAServiceV8.lookupUserByUsername(params.environmentId, params.username);

			// Get worker token
			const accessToken = await MFAServiceV8.getWorkerToken();

			// Cancel device authentication via backend proxy
			console.log(`${MODULE_TAG} [CANCEL] Debug: Worker token before sending to backend`, {
				tokenLength: accessToken.length,
				tokenStart: accessToken.substring(0, 50),
				tokenEnd: accessToken.substring(accessToken.length - 20),
				tokenParts: accessToken.split('.').length,
				isJWT: accessToken.includes('.') && accessToken.split('.').length === 3,
				fullToken: accessToken,
			});

			const requestBody = {
				environmentId: params.environmentId,
				userId: user.id,
				authenticationId: params.authenticationId,
				workerToken: accessToken.trim(),
				reason: cancelReason,
			};

			const startTime = Date.now();
			const callId = apiCallTrackerService.trackApiCall({
				method: 'POST',
				url: '/api/pingone/mfa/cancel-device-authentication',
				headers: {
					'Content-Type': 'application/json',
				},
				body: requestBody,
				step: 'mfa-Cancel Device Authentication',
				flowType: 'mfa',
			});

			let response: Response;
			try {
				response = await pingOneFetch('/api/pingone/mfa/cancel-device-authentication', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(requestBody),
					retry: { maxAttempts: 3 },
				});
			} catch (error) {
				apiCallTrackerService.updateApiCallResponse(
					callId,
					{
						status: 0,
						statusText: 'Network Error',
						error: error instanceof Error ? error.message : String(error),
					},
					Date.now() - startTime
				);
				throw error;
			}

			const responseClone = response.clone();
			let responseData: unknown;
			try {
				responseData = await responseClone.json();
			} catch {
				responseData = { error: 'Failed to parse response' };
			}

			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: response.status,
					statusText: response.statusText,
					headers: (() => {
						const headers: Record<string, string> = {};
						response.headers.forEach((value, key) => {
							headers[key] = value;
						});
						return headers;
					})(),
					data: responseData,
				},
				Date.now() - startTime
			);

			if (!response.ok) {
				const errorData = responseData as PingOneResponse;
				throw new Error(
					`Failed to cancel device authentication: ${errorData.message || errorData.error || response.statusText}`
				);
			}

			const cancelData = responseData as { status: string; [key: string]: unknown };
			console.log(`${MODULE_TAG} Device authentication canceled:`, cancelData);
			return cancelData;
		} catch (error) {
			console.error(`${MODULE_TAG} Cancel device authentication error`, error);
			throw error;
		}
	}

	/**
	 * Select Device for Authentication (Auth Server endpoint)
	 * POST https://auth.pingone.com/{ENV_ID}/deviceAuthentications/{DEVICE_AUTHENTICATION_ID}/selection
	 * Per master-sms.md: Use /selection endpoint
	 * Request body: { device: { id: DEVICE_ID } }
	 * API Reference: https://apidocs.pingidentity.com/pingone/mfa/v1/api/#select-device-for-authentication
	 * @param params - Authentication parameters with selected device ID
	 * @returns Updated authentication response
	 */
	/**
	 * @deprecated Use MfaAuthenticationServiceV8.selectDeviceForAuthentication() instead
	 * This method will be removed in the next major version
	 */
	static async selectDeviceForAuthentication(
		params: MFACredentials & { authenticationId: string; deviceId: string }
	): Promise<{ status: string; nextStep?: string; [key: string]: unknown }> {
		console.log(`${MODULE_TAG} Selecting device for authentication`, {
			username: params.username,
			authenticationId: params.authenticationId,
			deviceId: params.deviceId,
		});

		try {
			// Lookup user by username
			const user = await MFAServiceV8.lookupUserByUsername(params.environmentId, params.username);

			// Get worker token
			const accessToken = await MFAServiceV8.getWorkerToken();

			// Select device via backend proxy
			const requestBody = {
				environmentId: params.environmentId,
				deviceAuthId: params.authenticationId, // Server expects deviceAuthId
				deviceId: params.deviceId,
				workerToken: accessToken.trim(),
			};

			console.log(`${MODULE_TAG} [DEBUG] Request body being sent:`, {
				...requestBody,
				workerToken: `[REDACTED_${accessToken.length}_chars]`,
			});

			const startTime = Date.now();
			const callId = apiCallTrackerService.trackApiCall({
				method: 'POST',
				url: '/api/pingone/mfa/select-device',
				headers: {
					'Content-Type': 'application/json',
				},
				body: requestBody,
				step: 'mfa-Select Device for Authentication',
				flowType: 'mfa',
			});

			let response: Response;
			try {
				response = await pingOneFetch('/api/pingone/mfa/select-device', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(requestBody),
					retry: { maxAttempts: 3 },
				});
			} catch (error) {
				apiCallTrackerService.updateApiCallResponse(
					callId,
					{
						status: 0,
						statusText: 'Network Error',
						error: error instanceof Error ? error.message : String(error),
					},
					Date.now() - startTime
				);
				throw error;
			}

			const responseClone = response.clone();
			let responseData: unknown;
			try {
				responseData = await responseClone.json();
			} catch {
				responseData = { error: 'Failed to parse response' };
			}

			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: response.status,
					statusText: response.statusText,
					headers: (() => {
						const headers: Record<string, string> = {};
						response.headers.forEach((value, key) => {
							headers[key] = value;
						});
						return headers;
					})(),
					data: responseData,
				},
				Date.now() - startTime
			);

			if (!response.ok) {
				const errorData = responseData as PingOneResponse;
				console.error(`${MODULE_TAG} [DEBUG] Server error response:`, {
					status: response.status,
					statusText: response.statusText,
					errorData: JSON.stringify(errorData, null, 2), // Stringify for full visibility
					errorDataKeys: Object.keys(errorData),
					errorDataMessage: errorData.message,
					errorDataError: errorData.error,
					errorDataDetails: errorData.details,
					requestBody: {
						environmentId: params.environmentId,
						userId: user.id,
						authenticationId: params.authenticationId,
						deviceId: params.deviceId,
					},
				});
				throw new Error(
					`Failed to select device: ${errorData.message || errorData.error || response.statusText}`
				);
			}

			const selectData = responseData as {
				status: string;
				nextStep?: string;
				[key: string]: unknown;
			};
			console.log(`${MODULE_TAG} Device selected:`, selectData);
			return selectData;
		} catch (error) {
			console.error(`${MODULE_TAG} Select device for authentication error`, error);
			throw error;
		}
	}

	static async listDeviceAuthenticationPolicies(
		environmentId: string
	): Promise<DeviceAuthenticationPolicy[]> {
		console.log(`${MODULE_TAG} Listing device authentication policies`, { environmentId });

		try {
			const accessToken = await MFAServiceV8.getWorkerToken();

			const actualPingOneUrl = `https://api.pingone.com/v1/environments/${environmentId}/deviceAuthenticationPolicies`;
			const startTime = Date.now();
			const callId = apiCallTrackerService.trackApiCall({
				method: 'GET',
				url: actualPingOneUrl,
				actualPingOneUrl,
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ***REDACTED***`,
				},
				body: null,
				step: 'mfa-List Device Authentication Policies',
				flowType: 'mfa',
			});

			let response: Response;
			try {
				// Use fetch directly for backend proxy calls (not pingOneFetch)
				response = await fetch('/api/pingone/mfa/device-authentication-policies', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						environmentId,
						workerToken: accessToken.trim(),
					}),
				});
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : String(error);
				console.error(`${MODULE_TAG} Network error fetching device authentication policies:`, {
					error: errorMessage,
					environmentId,
					endpoint: '/api/pingone/mfa/device-authentication-policies',
				});
				
				apiCallTrackerService.updateApiCallResponse(
					callId,
					{
						status: 0,
						statusText: 'Network Error',
						error: errorMessage,
					},
					Date.now() - startTime
				);
				
				throw new Error(
					`Failed to connect to backend server. Please ensure the server is running and accessible. ${errorMessage}`
				);
			}

			const responseClone = response.clone();
			let responseData: unknown;
			let rawResponseText = '';
			try {
				rawResponseText = await responseClone.text();
				console.log(`${MODULE_TAG} Raw response text length:`, rawResponseText.length);
				console.log(
					`${MODULE_TAG} Raw response text (first 500 chars):`,
					rawResponseText.substring(0, 500)
				);

				if (!rawResponseText || !rawResponseText.trim()) {
					console.warn(`${MODULE_TAG} Empty response body from backend`);
					responseData = {
						error: 'Empty response',
						message: 'Backend returned an empty response body',
						status: response.status,
						statusText: response.statusText,
					};
				} else {
					try {
						responseData = JSON.parse(rawResponseText);
					} catch (parseError) {
						console.error(`${MODULE_TAG} Failed to parse response as JSON:`, {
							status: response.status,
							statusText: response.statusText,
							contentType: response.headers.get('content-type'),
							responseLength: rawResponseText.length,
							responsePreview: rawResponseText.substring(0, 500),
							parseError: parseError instanceof Error ? parseError.message : String(parseError),
						});
						responseData = {
							error: 'Failed to parse response',
							message: 'The response from backend was not valid JSON',
							status: response.status,
							statusText: response.statusText,
							contentType: response.headers.get('content-type'),
							rawResponse: rawResponseText.substring(0, 1000),
						};
					}
				}
			} catch (textError) {
				console.error(`${MODULE_TAG} Failed to read response text:`, textError);
				responseData = {
					error: 'Failed to read response',
					message: textError instanceof Error ? textError.message : String(textError),
					status: response.status,
					statusText: response.statusText,
				};
			}

			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: response.status,
					statusText: response.statusText,
					headers: (() => {
						const headers: Record<string, string> = {};
						response.headers.forEach((value, key) => {
							headers[key] = value;
						});
						return headers;
					})(),
					data: responseData,
				},
				Date.now() - startTime
			);

			if (!response.ok) {
				const errorData = responseData as PingOneResponse & {
					errorType?: string;
					details?: unknown;
					rawResponse?: string;
					htmlPreview?: string;
					contentType?: string;
				};
				const errorMessage =
					errorData.message || errorData.error || response.statusText || 'Unknown error';

				console.error(`${MODULE_TAG} Backend returned error:`, {
					status: response.status,
					statusText: response.statusText,
					errorData: errorData,
					rawResponseText: rawResponseText.substring(0, 500),
					responseHeaders: Object.fromEntries(response.headers.entries()),
				});

				const fullError = new Error(
					`Failed to list device authentication policies: ${errorMessage}`
				);
				// Attach additional error details for debugging
				(fullError as Error & { errorData: unknown }).errorData = errorData;
				(fullError as Error & { rawResponseText: string }).rawResponseText = rawResponseText;
				if (errorData.details) {
					(fullError as Error & { details: unknown }).details = errorData.details;
				}
				if (errorData.rawResponse) {
					(fullError as Error & { rawResponse: string }).rawResponse = errorData.rawResponse;
				}
				if (errorData.htmlPreview) {
					(fullError as Error & { htmlPreview: string }).htmlPreview = errorData.htmlPreview;
				}
				throw fullError;
			}

			const policiesResponse = responseData as {
				_embedded?: { deviceAuthenticationPolicies?: DeviceAuthenticationPolicy[] };
				items?: DeviceAuthenticationPolicy[];
				deviceAuthenticationPolicies?: DeviceAuthenticationPolicy[];
			};

			const policies = Array.isArray(policiesResponse?._embedded?.deviceAuthenticationPolicies)
				? (policiesResponse._embedded?.deviceAuthenticationPolicies ?? [])
				: Array.isArray(policiesResponse?.items)
					? (policiesResponse.items ?? [])
					: Array.isArray(policiesResponse?.deviceAuthenticationPolicies)
						? (policiesResponse.deviceAuthenticationPolicies ?? [])
						: [];

			console.log(`${MODULE_TAG} Retrieved ${policies.length} device authentication policies`);
			return policies;
		} catch (error) {
			console.error(`${MODULE_TAG} List device authentication policies error`, error);
			throw error;
		}
	}

	/**
	 * Read a single device authentication policy
	 * GET /v1/environments/{environmentId}/deviceAuthenticationPolicies/{policyId}
	 * Note: If the single policy endpoint is not available (404), falls back to listing all policies and finding the one by ID
	 * @param environmentId - Environment ID
	 * @param policyId - Policy ID
	 * @returns Device authentication policy with full details including authentication.deviceSelection
	 */
	static async readDeviceAuthenticationPolicy(
		environmentId: string,
		policyId: string
	): Promise<DeviceAuthenticationPolicy> {
		console.log(`${MODULE_TAG} [DEVICE_SELECTION] Reading device authentication policy`, {
			environmentId,
			policyId,
		});

		try {
			const accessToken = await MFAServiceV8.getWorkerToken();

			const queryParams = new URLSearchParams({
				environmentId,
				workerToken: accessToken.trim(),
			});

			const startTime = Date.now();
			const callId = apiCallTrackerService.trackApiCall({
				method: 'GET',
				url: `/api/pingone/mfa/device-authentication-policies/${policyId}?${queryParams.toString()}`,
				headers: {
					'Content-Type': 'application/json',
				},
				step: 'mfa-Read Device Authentication Policy',
				flowType: 'mfa',
			});

			let response: Response;
			try {
				response = await pingOneFetch(
					`/api/pingone/mfa/device-authentication-policies/${policyId}?${queryParams.toString()}`,
					{
						method: 'GET',
						headers: {
							'Content-Type': 'application/json',
						},
						retry: { maxAttempts: 3 },
					}
				);
			} catch (error) {
				apiCallTrackerService.updateApiCallResponse(
					callId,
					{
						status: 0,
						statusText: 'Network Error',
						error: error instanceof Error ? error.message : String(error),
					},
					Date.now() - startTime
				);
				throw error;
			}

			const responseClone = response.clone();
			let responseData: unknown;
			try {
				responseData = await responseClone.json();
			} catch {
				responseData = { error: 'Failed to parse response' };
			}

			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: response.status,
					statusText: response.statusText,
					headers: (() => {
						const headers: Record<string, string> = {};
						response.headers.forEach((value, key) => {
							headers[key] = value;
						});
						return headers;
					})(),
					data: responseData,
				},
				Date.now() - startTime
			);

			// If endpoint returns 404 (not available yet), fall back to listing policies
			if (response.status === 404) {
				console.warn(
					`${MODULE_TAG} [DEVICE_SELECTION] Single policy endpoint not available (404), falling back to list endpoint`
				);
				const allPolicies = await MFAServiceV8.listDeviceAuthenticationPolicies(environmentId);
				const foundPolicy = allPolicies.find((p) => p.id === policyId);

				if (foundPolicy) {
					console.log(`${MODULE_TAG} [DEVICE_SELECTION] Found policy via list endpoint:`, {
						id: foundPolicy.id,
						name: foundPolicy.name,
						authentication: foundPolicy.authentication,
						deviceSelection: foundPolicy.authentication && 'deviceSelection' in foundPolicy.authentication ? foundPolicy.authentication.deviceSelection : undefined,
						fullPolicy: JSON.stringify(foundPolicy, null, 2),
					});
					return foundPolicy;
				} else {
					throw new Error(`Policy ${policyId} not found in list of available policies`);
				}
			}

			if (!response.ok) {
				const errorData = responseData as PingOneResponse;
				console.error(`${MODULE_TAG} [DEVICE_SELECTION] Failed to read policy:`, {
					status: response.status,
					error: errorData,
					policyId,
				});
				throw new Error(
					`Failed to read device authentication policy: ${errorData.message || errorData.error || response.statusText}`
				);
			}

			const policy = responseData as DeviceAuthenticationPolicy;
			console.log(`${MODULE_TAG} [DEVICE_SELECTION] Retrieved device authentication policy:`, {
				id: policy.id,
				name: policy.name,
				authentication: policy.authentication,
				deviceSelection: policy.authentication && 'deviceSelection' in policy.authentication ? policy.authentication.deviceSelection : undefined,
				fullPolicy: JSON.stringify(policy, null, 2),
			});
			return policy;
		} catch (error) {
			console.error(`${MODULE_TAG} [DEVICE_SELECTION] Read device authentication policy error:`, {
				error: error instanceof Error ? error.message : String(error),
				errorDetails: error instanceof Error ? error.stack : undefined,
				policyId,
				environmentId,
			});
			throw error;
		}
	}
}

export default MFAServiceV8;
