/**
 * @file FIDO2FlowController.ts
 * @module v8/flows/controllers
 * @description FIDO2-specific MFA flow controller
 * @version 8.2.0
 */

import { WorkerTokenStatusServiceV8 } from '@/v8/services/workerTokenStatusServiceV8';
import type { useStepNavigationV8 } from '@/v8/hooks/useStepNavigationV8';
import type { MFACredentials } from '../shared/MFATypes';
import { MFAFlowController, type FlowControllerCallbacks } from './MFAFlowController';
import type { RegisterDeviceParams } from '@/v8/services/mfaServiceV8';
import { MFAServiceV8 } from '@/v8/services/mfaServiceV8';
// Note: FIDO2Service is not used here - we use PingOne's publicKeyCredentialCreationOptions instead
import { toastV8 } from '@/v8/utils/toastNotificationsV8';

const MODULE_TAG = '[🔑 FIDO2-CONTROLLER]';

/**
 * FIDO2 Flow Controller
 * Handles FIDO2-specific MFA operations with WebAuthn integration
 */
export class FIDO2FlowController extends MFAFlowController {
	constructor(callbacks: FlowControllerCallbacks = {}) {
		super('FIDO2', callbacks);
	}

	protected filterDevicesByType(devices: Array<Record<string, unknown>>): Array<Record<string, unknown>> {
		return devices.filter((d: Record<string, unknown>) => d.type === 'FIDO2');
	}

	validateCredentials(
		credentials: MFACredentials,
		tokenStatus: ReturnType<typeof WorkerTokenStatusServiceV8.checkWorkerTokenStatus>,
		nav: ReturnType<typeof useStepNavigationV8>
	): boolean {
		const errors: string[] = [];

		if (!credentials.environmentId?.trim()) {
			errors.push('Environment ID is required');
		}

		if (!credentials.username?.trim()) {
			errors.push('Username is required');
		}

		if (!credentials.deviceAuthenticationPolicyId?.trim()) {
			errors.push('Device Authentication Policy ID is required');
		}

		// Per rightTOTP.md: Check token validity based on token type (worker or user)
		const tokenType = credentials.tokenType || 'worker';
		const isTokenValid = tokenType === 'worker' 
			? tokenStatus.isValid 
			: !!credentials.userToken?.trim();
		if (!isTokenValid) {
			errors.push(`${tokenType === 'worker' ? 'Worker' : 'User'} token is required - please add a token first`);
		}

		// Check WebAuthn support
		if (!('credentials' in navigator && 'create' in navigator.credentials)) {
			errors.push('WebAuthn is not supported in this browser. Please use a modern browser that supports WebAuthn.');
		}

		nav.setValidationErrors(errors);
		return errors.length === 0;
	}

	getDeviceRegistrationParams(credentials: MFACredentials, _status: 'ACTIVE' | 'ACTIVATION_REQUIRED' = 'ACTIVATION_REQUIRED'): Partial<RegisterDeviceParams> {
		// For FIDO2, we only send type, rp, and policy.
		// Name, nickname, and status are NOT included in the FIDO2 device creation payload.
		// See: https://apidocs.pingidentity.com/pingone/mfa/v1/api/#post-create-mfa-user-device-fido2
		const params: Partial<RegisterDeviceParams> = {};

		// Include policy if deviceAuthenticationPolicyId is provided
		// According to API docs: policy should be an object with id property
		// Format: { "policy": { "id": "policy-id-string" } }
		// See: https://apidocs.pingidentity.com/pingone/mfa/v1/api/#post-create-mfa-user-device-fido2
		if (credentials.deviceAuthenticationPolicyId?.trim()) {
			params.policy = { id: credentials.deviceAuthenticationPolicyId.trim() };
		}

		// Include RP (Relying Party) information for FIDO2
		// Per PingOne API docs: https://apidocs.pingidentity.com/pingone/mfa/v1/api/#post-create-mfa-user-device-fido2
		// The RP ID should match the application's domain (per fido2.md)
		// For localhost: use "localhost", for production: use your domain (e.g., "example.com")
		// The RP name should match the RP ID (no spaces, per user request)
		if (typeof window !== 'undefined') {
			const origin = window.location.origin || 
				`${window.location.protocol}//${window.location.hostname}${window.location.port ? `:${window.location.port}` : ''}`;
			const originHost = new URL(origin).hostname;
			
			// Derive RP ID from origin hostname
			// For localhost: use "localhost"
			// For production: use the hostname or parent domain
			let rpId = originHost;
			if (originHost === 'localhost' || originHost.startsWith('localhost:')) {
				rpId = 'localhost';
			} else if (originHost.includes('.')) {
				// For production, use the parent domain (e.g., "example.com" from "auth.example.com")
				const parts = originHost.split('.');
				if (parts.length >= 2) {
					rpId = parts.slice(-2).join('.'); // Get last two parts (e.g., "example.com")
				}
			}
			
			params.rp = {
				id: rpId,
				name: rpId, // Name matches ID (no spaces)
			};
		}

		return params;
	}

	/**
	 * Register FIDO2 device with WebAuthn
	 * This follows fido2-2.md specification:
	 * 1. Create device in PingOne (returns publicKeyCredentialCreationOptions)
	 * 2. Parse and convert PingOne's registration options
	 * 3. Use WebAuthn API to create credential (navigator.credentials.create)
	 * 4. Activate device with attestation via FIDO2 activation endpoint
	 * 
	 * Per fido2-2.md:
	 * - FIDO2 activation is WebAuthn-based, NOT OTP-based
	 * - You do NOT need to manually set ACTIVATION_CREATED status
	 * - Flow: Pre-activation → FIDO2 activation API → ACTIVE
	 */
	async registerFIDO2Device(
		credentials: MFACredentials,
		deviceId: string,
		publicKeyCredentialCreationOptions?: string,
		fido2Config?: {
			preferredAuthenticatorType?: 'platform' | 'cross-platform' | 'both';
			userVerification?: 'discouraged' | 'preferred' | 'required';
			discoverableCredentials?: 'discouraged' | 'preferred' | 'required';
			publicKeyCredentialHints?: Array<'security-key' | 'client-device' | 'hybrid'>;
			attestationRequest?: 'none' | 'direct' | 'enterprise';
		}
	): Promise<{ deviceId: string; status: string; credentialId?: string }> {
		// Check WebAuthn support
		if (!('credentials' in navigator && 'create' in navigator.credentials)) {
			throw new Error('WebAuthn is not supported in this browser');
		}

		// If publicKeyCredentialCreationOptions not provided, we need to get it from the device
		// This should have been returned from registerDevice, but if not, we'll need to fetch it
		if (!publicKeyCredentialCreationOptions) {
			console.warn(`${MODULE_TAG} publicKeyCredentialCreationOptions not provided, device may have been created without it`);
			throw new Error('publicKeyCredentialCreationOptions is required for FIDO2 registration. Please ensure the device was created correctly.');
		}

		// Step 1: Parse the options string from PingOne
		// Per fido2-2.md: Get WebAuthn options (challenge, RP ID, etc.) from PingOne
		let creationOptions: PublicKeyCredentialCreationOptions;
		try {
			creationOptions = JSON.parse(publicKeyCredentialCreationOptions);
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to parse publicKeyCredentialCreationOptions:`, error);
			throw new Error('Invalid publicKeyCredentialCreationOptions format from PingOne');
		}

		// Step 2: Convert byte arrays to Uint8Array
		// WebAuthn API requires ArrayBuffer/Uint8Array for challenge, user.id, excludeCredentials[].id
		// WebAuthn API requires ArrayBuffer/Uint8Array for challenge, user.id, excludeCredentials[].id
		const toUint8Array = (arr: number[]): Uint8Array => {
			return new Uint8Array(arr);
		};

		if (Array.isArray(creationOptions.challenge)) {
			creationOptions.challenge = toUint8Array(creationOptions.challenge) as BufferSource;
		}

		if (creationOptions.user && Array.isArray(creationOptions.user.id)) {
			creationOptions.user.id = toUint8Array(creationOptions.user.id) as BufferSource;
		}

		if (Array.isArray(creationOptions.excludeCredentials)) {
			creationOptions.excludeCredentials = creationOptions.excludeCredentials.map((cred: PublicKeyCredentialDescriptor) => ({
				...cred,
				id: Array.isArray(cred.id) ? (toUint8Array(cred.id) as BufferSource) : cred.id,
			})) as PublicKeyCredentialDescriptor[];
		}

		// Validate RP ID and Origin according to fido2.md
		// RP ID must be equal to or a suffix of the host in the origin
		// Origin format: <scheme>://<host>[:port]
		const currentOrigin = window.location.origin || 
			`${window.location.protocol}//${window.location.hostname}${window.location.port ? `:${window.location.port}` : ''}`;
		const rpId = creationOptions.rp?.id;
		const originHost = new URL(currentOrigin).hostname;
		
		// Validate RP ID matches origin hostname (per fido2.md section 1)
		// RP ID must be equal to or a suffix of the host in the origin
		const rpIdMatchesOrigin = rpId && (
			rpId === originHost || 
			originHost.endsWith(`.${rpId}`)
		);
		
		if (rpId && !rpIdMatchesOrigin) {
			console.warn(`${MODULE_TAG} RP ID validation warning:`, {
				rpId,
				originHost,
				origin: currentOrigin,
				message: 'RP ID should be equal to or a suffix of the origin hostname. This may cause WebAuthn validation to fail.',
				hint: 'Ensure your PingOne FIDO2 policy RP ID matches your application origin hostname (e.g., "localhost" for localhost:3000)',
			});
		}

		// Check for session cookies and prefer platform authenticators (TouchID/FaceID) when appropriate
		// Per PingOne MFA API: If session cookie exists, prefer FIDO2 platform device even if not default
		const { getAuthenticatorSelectionPreferences } = await import('@/v8/services/fido2SessionCookieServiceV8');
		const authenticatorPrefs = getAuthenticatorSelectionPreferences();
		
		// Merge PingOne's authenticatorSelection with our preferences
		// Our preferences take precedence to ensure TouchID/FaceID is used when available
		if (!creationOptions.authenticatorSelection) {
			creationOptions.authenticatorSelection = {};
		}
		
		// Prefer platform authenticators (TouchID/FaceID/Windows Hello) when session cookies exist
		if (authenticatorPrefs.authenticatorAttachment) {
			creationOptions.authenticatorSelection.authenticatorAttachment = authenticatorPrefs.authenticatorAttachment;
			console.log(`${MODULE_TAG} ✅ Preferring platform authenticator (TouchID/FaceID):`, authenticatorPrefs);
		}
		
		// Set userVerification preference (from session cookies or config)
		if (authenticatorPrefs.userVerification) {
			creationOptions.authenticatorSelection.userVerification = authenticatorPrefs.userVerification;
		} else if (fido2Config?.userVerification) {
			creationOptions.authenticatorSelection.userVerification = fido2Config.userVerification;
		}
		
		// Set authenticator attachment from config if provided
		if (fido2Config?.preferredAuthenticatorType) {
			if (fido2Config.preferredAuthenticatorType === 'platform') {
				creationOptions.authenticatorSelection.authenticatorAttachment = 'platform';
			} else if (fido2Config.preferredAuthenticatorType === 'cross-platform') {
				creationOptions.authenticatorSelection.authenticatorAttachment = 'cross-platform';
			}
			// 'both' means we don't set it, letting the user choose
		}
		
		// Set discoverable credentials (residentKey) from config
		if (fido2Config?.discoverableCredentials) {
			if (fido2Config.discoverableCredentials === 'required') {
				creationOptions.authenticatorSelection.residentKey = 'required';
				creationOptions.authenticatorSelection.requireResidentKey = true;
			} else if (fido2Config.discoverableCredentials === 'preferred') {
				creationOptions.authenticatorSelection.residentKey = 'preferred';
				creationOptions.authenticatorSelection.requireResidentKey = false;
			} else if (fido2Config.discoverableCredentials === 'discouraged') {
				creationOptions.authenticatorSelection.residentKey = 'discouraged';
				creationOptions.authenticatorSelection.requireResidentKey = false;
			}
		} else {
			// Default: Ensure residentKey is set for passkeys (platform authenticators typically require this)
			if (!creationOptions.authenticatorSelection.residentKey) {
				creationOptions.authenticatorSelection.residentKey = 'preferred';
			}
			
			// If requireResidentKey is not set and we're using platform authenticators, set it
			if (creationOptions.authenticatorSelection.authenticatorAttachment === 'platform' && 
			    creationOptions.authenticatorSelection.requireResidentKey === undefined) {
				creationOptions.authenticatorSelection.requireResidentKey = true;
			}
		}
		
		// Set public key credential hints from config
		if (fido2Config?.publicKeyCredentialHints && fido2Config.publicKeyCredentialHints.length > 0) {
			creationOptions.hints = fido2Config.publicKeyCredentialHints;
		}
		
		// Set attestation from config
		if (fido2Config?.attestationRequest) {
			creationOptions.attestation = fido2Config.attestationRequest;
		}

		console.log(`${MODULE_TAG} Using PingOne's publicKeyCredentialCreationOptions:`, {
			rpId: creationOptions.rp?.id,
			rpName: creationOptions.rp?.name,
			origin: currentOrigin,
			originHost,
			rpIdMatchesOrigin: rpIdMatchesOrigin || 'N/A',
			hasChallenge: !!creationOptions.challenge,
			challengeType: creationOptions.challenge instanceof Uint8Array ? 'Uint8Array' : typeof creationOptions.challenge,
			hasUser: !!creationOptions.user,
			excludeCredentialsCount: creationOptions.excludeCredentials?.length || 0,
			authenticatorSelection: creationOptions.authenticatorSelection,
			preferringPlatform: authenticatorPrefs.authenticatorAttachment === 'platform',
		});

		// Step 3: Run WebAuthn registration in browser (per fido2-2.md section 4)
		// Call navigator.credentials.create with PingOne's options (modified to prefer platform authenticators)
		let credential: PublicKeyCredential | null;
		try {
			console.log(`${MODULE_TAG} 🔐 Calling navigator.credentials.create() - TouchID/FaceID should prompt now...`);
			credential = (await navigator.credentials.create({
				publicKey: creationOptions,
			})) as PublicKeyCredential | null;
		} catch (error) {
			console.error(`${MODULE_TAG} WebAuthn credential creation failed:`, error);
			if (error instanceof Error) {
				if (error.name === 'NotAllowedError') {
					throw new Error('WebAuthn registration was cancelled or not allowed by the user');
				} else if (error.name === 'NotSupportedError') {
					throw new Error('This authenticator is not supported');
				} else if (error.name === 'SecurityError') {
					throw new Error('Security error during WebAuthn registration. Please check your browser settings.');
				}
			}
			throw error;
		}

		if (!credential) {
			throw new Error('User did not complete WebAuthn credential creation');
		}

		// Step 4: Serialize credential to JSON-safe object
		// Send WebAuthn result to backend (per fido2-2.md section 4)
		// Convert binary pieces to base64url for JSON serialization
		const bufferToBase64Url = (buf: ArrayBuffer): string => {
			const bytes = new Uint8Array(buf);
			let str = '';
			for (const b of bytes) {
				str += String.fromCharCode(b);
			}
			return btoa(str)
				.replace(/\+/g, '-')
				.replace(/\//g, '_')
				.replace(/=+$/g, '');
		};

		const response = credential.response as AuthenticatorAttestationResponse;
		const attestationObj = {
			id: credential.id,
			type: credential.type,
			rawId: bufferToBase64Url(credential.rawId),
			response: {
				clientDataJSON: bufferToBase64Url(response.clientDataJSON),
				attestationObject: bufferToBase64Url(response.attestationObject),
			},
			clientExtensionResults: credential.getClientExtensionResults(),
		};

		// Step 5: Backend calls FIDO2 activation endpoint (per fido2-2.md section 4)
		// Per fido2.md: Origin is the full origin of the page where WebAuthn runs
		// Format: <scheme>://<host>[:port]
		// Examples: https://localhost:3000, https://auth.example.com
		const origin = window.location.origin || 
			`${window.location.protocol}//${window.location.hostname}${window.location.port ? `:${window.location.port}` : ''}`;
		
		// Validate origin format (per fido2.md section 1)
		if (!origin.match(/^https?:\/\/[^\/]+/)) {
			console.warn(`${MODULE_TAG} Origin format validation:`, {
				origin,
				message: 'Origin should match format: <scheme>://<host>[:port]',
			});
		}
		
		console.log(`${MODULE_TAG} Activating FIDO2 device with attestation:`, {
			origin,
			originHost: new URL(origin).hostname,
			rpId: creationOptions.rp?.id,
			hasAttestation: !!attestationObj,
			attestationId: `${attestationObj.id.substring(0, 20)}...`,
			note: 'PingOne will validate that origin is in the allowed origins list for the RP ID',
		});
		
		const activationResult = await MFAServiceV8.activateFIDO2Device({
			environmentId: credentials.environmentId,
			username: credentials.username,
			deviceId,
			fido2Data: {
				// Per fido2-2.md: Send WebAuthn result (attestation) to backend
				// Backend will call FIDO2 activation endpoint with this data
				attestation: JSON.stringify(attestationObj),
				origin: origin,
			},
		});

		toastV8.success('FIDO2 device registered and activated successfully!');

		// Per fido2-2.md: PingOne marks device ACTIVE after successful WebAuthn validation
		// You do NOT need to manually set ACTIVATION_CREATED status
		const deviceStatus = (activationResult as { status?: string })?.status || 'ACTIVE';

		return {
			deviceId,
			status: deviceStatus,
			credentialId: credential.id,
		};
	}

	/**
	 * Check WebAuthn capabilities
	 */
	static getWebAuthnCapabilities() {
		return {
			supported: 'credentials' in navigator && 'create' in navigator.credentials,
			platformAuthenticator: 'credentials' in navigator && 'create' in navigator.credentials,
		};
	}
}

