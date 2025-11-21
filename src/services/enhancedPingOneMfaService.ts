import { createApiError, handleApiResponse, withRetry } from './apiUtils';
import QRCodeService from './qrCodeService';

export interface MfaDevice {
	id: string;
	type: 'SMS' | 'EMAIL' | 'TOTP' | 'VOICE' | 'FIDO2' | 'MOBILE';
	status: 'ACTIVE' | 'PENDING_ACTIVATION' | 'SUSPENDED' | 'DELETED';
	name?: string;
	phoneNumber?: string;
	emailAddress?: string;
	createdAt: string;
	lastUsedAt?: string;
	_links?: {
		self: { href: string };
		activate?: { href: string };
		challenge?: { href: string };
	};
}

export interface MfaCredentials {
	accessToken: string;
	environmentId: string;
	userId: string;
}

export interface MfaPolicy {
	id: string;
	name: string;
	enabled: boolean;
	deviceSelection?:
		| 'ALWAYS_DISPLAY_DEVICES'
		| 'DEFAULT_TO_FIRST_DEVICE'
		| 'PROMPT_TO_SELECT_DEVICE';
	sms?: {
		enabled: boolean;
		pairingDisabled?: boolean;
	};
	voice?: {
		enabled: boolean;
		pairingDisabled?: boolean;
	};
	email?: {
		enabled: boolean;
		pairingDisabled?: boolean;
	};
	mobile?: {
		enabled: boolean;
		pairingDisabled?: boolean;
	};
	totp?: {
		enabled: boolean;
		pairingDisabled?: boolean;
	};
	fido2?: {
		enabled: boolean;
		pairingDisabled?: boolean;
	};
}

export class EnhancedPingOneMfaService {
	private static readonly DEFAULT_RETRIES = 3;
	private static readonly BASE_URL = 'https://api.pingone.com/v1';
	private static readonly REQUEST_TIMEOUT = 10000; // 10 seconds

	private static getBaseUrl(environmentId: string): string {
		return `${EnhancedPingOneMfaService.BASE_URL}/environments/${environmentId}`;
	}

	private static getDefaultHeaders(accessToken: string) {
		return {
			Authorization: `Bearer ${accessToken}`,
			'Content-Type': 'application/json',
			Accept: 'application/json',
		};
	}

	private static async makeRequest<T>(
		url: string,
		options: RequestInit,
		retries = EnhancedPingOneMfaService.DEFAULT_RETRIES
	): Promise<T> {
		const controller = new AbortController();
		const timeoutId = setTimeout(
			() => controller.abort(),
			EnhancedPingOneMfaService.REQUEST_TIMEOUT
		);

		try {
			const response = await withRetry(async () => {
				const res = await fetch(url, {
					...options,
					signal: controller.signal,
				});
				return handleApiResponse(res);
			}, retries);

			return response as T;
		} catch (error) {
			if ((error as Error).name === 'AbortError') {
				throw createApiError('Request timed out', 408, 'REQUEST_TIMEOUT');
			}
			throw error;
		} finally {
			clearTimeout(timeoutId);
		}
	}

	// Device Management
	static async getDevices(credentials: MfaCredentials): Promise<MfaDevice[]> {
		const url = `${EnhancedPingOneMfaService.getBaseUrl(credentials.environmentId)}/users/${credentials.userId}/mfaDevices`;
		const response = await EnhancedPingOneMfaService.makeRequest<{
			_embedded: { mfaDevices: MfaDevice[] };
		}>(url, {
			method: 'GET',
			headers: EnhancedPingOneMfaService.getDefaultHeaders(credentials.accessToken),
		});
		return response._embedded?.mfaDevices || [];
	}

	static async getDevice(credentials: MfaCredentials, deviceId: string): Promise<MfaDevice> {
		const url = `${EnhancedPingOneMfaService.getBaseUrl(credentials.environmentId)}/users/${credentials.userId}/mfaDevices/${deviceId}`;
		return EnhancedPingOneMfaService.makeRequest<MfaDevice>(url, {
			method: 'GET',
			headers: EnhancedPingOneMfaService.getDefaultHeaders(credentials.accessToken),
		});
	}

	static async createDevice(
		credentials: MfaCredentials,
		deviceType: string,
		deviceData: Partial<MfaDevice>
	): Promise<MfaDevice> {
		const url = `${EnhancedPingOneMfaService.getBaseUrl(credentials.environmentId)}/users/${credentials.userId}/mfaDevices`;
		return EnhancedPingOneMfaService.makeRequest<MfaDevice>(url, {
			method: 'POST',
			headers: EnhancedPingOneMfaService.getDefaultHeaders(credentials.accessToken),
			body: JSON.stringify({
				type: deviceType,
				...deviceData,
			}),
		});
	}

	static async updateDevice(
		credentials: MfaCredentials,
		deviceId: string,
		updates: Partial<MfaDevice>
	): Promise<MfaDevice> {
		const url = `${EnhancedPingOneMfaService.getBaseUrl(credentials.environmentId)}/users/${credentials.userId}/mfaDevices/${deviceId}`;
		return EnhancedPingOneMfaService.makeRequest<MfaDevice>(url, {
			method: 'PUT',
			headers: EnhancedPingOneMfaService.getDefaultHeaders(credentials.accessToken),
			body: JSON.stringify(updates),
		});
	}

	static async deleteDevice(credentials: MfaCredentials, deviceId: string): Promise<void> {
		const url = `${EnhancedPingOneMfaService.getBaseUrl(credentials.environmentId)}/users/${credentials.userId}/mfaDevices/${deviceId}`;
		await EnhancedPingOneMfaService.makeRequest<void>(
			url,
			{
				method: 'DELETE',
				headers: EnhancedPingOneMfaService.getDefaultHeaders(credentials.accessToken),
			},
			1 // Don't retry delete operations
		);
	}

	// Device Activation
	static async activateDevice(
		credentials: MfaCredentials,
		deviceId: string,
		otp: string
	): Promise<MfaDevice> {
		const url = `${EnhancedPingOneMfaService.getBaseUrl(credentials.environmentId)}/users/${credentials.userId}/mfaDevices/${deviceId}/activate`;
		return EnhancedPingOneMfaService.makeRequest<MfaDevice>(url, {
			method: 'POST',
			headers: EnhancedPingOneMfaService.getDefaultHeaders(credentials.accessToken),
			body: JSON.stringify({ otp }),
		});
	}

	// Challenge Management
	static async sendChallenge(
		credentials: MfaCredentials,
		deviceId: string,
		challengeType: 'SMS' | 'EMAIL' | 'VOICE' = 'SMS'
	): Promise<{ challengeId: string; expiresAt: string }> {
		const url = `${EnhancedPingOneMfaService.getBaseUrl(credentials.environmentId)}/users/${credentials.userId}/mfaDevices/${deviceId}/challenges`;
		return EnhancedPingOneMfaService.makeRequest<{ challengeId: string; expiresAt: string }>(url, {
			method: 'POST',
			headers: EnhancedPingOneMfaService.getDefaultHeaders(credentials.accessToken),
			body: JSON.stringify({
				type: challengeType,
			}),
		});
	}

	static async verifyChallenge(
		credentials: MfaCredentials,
		deviceId: string,
		challengeId: string,
		code: string
	): Promise<{ valid: boolean; expiresAt: string }> {
		const url = `${EnhancedPingOneMfaService.getBaseUrl(credentials.environmentId)}/users/${credentials.userId}/mfaDevices/${deviceId}/challenges/${challengeId}`;
		return EnhancedPingOneMfaService.makeRequest<{ valid: boolean; expiresAt: string }>(url, {
			method: 'POST',
			headers: EnhancedPingOneMfaService.getDefaultHeaders(credentials.accessToken),
			body: JSON.stringify({
				code,
			}),
		});
	}

	// TOTP Device Management
	static async createTotpDevice(
		credentials: MfaCredentials,
		options: {
			name?: string;
			issuer?: string;
			accountName?: string;
		} = {}
	): Promise<{ device: MfaDevice; secret: string; qrCode: string }> {
		const device = await EnhancedPingOneMfaService.createDevice(credentials, 'TOTP', {
			name: options.name || 'Authenticator App',
		});

		// Generate TOTP secret and QR code
		const secret = EnhancedPingOneMfaService.generateTotpSecret();

		// Generate TOTP URI for manual entry
		EnhancedPingOneMfaService.generateTotpUri({
			secret,
			issuer: options.issuer || 'PingOne',
			accountName: options.accountName || credentials.userId,
		});

		// Generate QR code for scanning
		const qrCodeResult = await QRCodeService.generateTOTPQRCode({
			secret,
			issuer: options.issuer || 'PingOne',
			accountName: options.accountName || credentials.userId,
		});

		return {
			device,
			secret,
			qrCode: qrCodeResult.dataUrl, // Return the data URL of the QR code
		};
	}

	private static generateTotpSecret(): string {
		// Generate a random base32 secret (PingOne requires 16-32 characters)
		const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
		let secret = '';
		for (let i = 0; i < 32; i++) {
			secret += chars.charAt(Math.floor(Math.random() * chars.length));
		}
		return secret;
	}

	private static generateTotpUri(config: {
		secret: string;
		issuer: string;
		accountName: string;
	}): string {
		const params = new URLSearchParams({
			secret: config.secret,
			issuer: config.issuer,
			algorithm: 'SHA1',
			digits: '6',
			period: '30',
		});

		return `otpauth://totp/${encodeURIComponent(config.issuer)}:${encodeURIComponent(config.accountName)}?${params.toString()}`;
	}

	// SMS Device Registration
	static async createSmsDevice(
		credentials: MfaCredentials,
		phoneNumber: string,
		options: {
			name?: string;
		} = {}
	): Promise<MfaDevice> {
		return EnhancedPingOneMfaService.createDevice(credentials, 'SMS', {
			name: options.name || 'SMS Device',
			phone: phoneNumber, // PingOne API expects 'phone' not 'phoneNumber'
		});
	}

	// EMAIL Device Registration
	static async createEmailDevice(
		credentials: MfaCredentials,
		emailAddress: string,
		options: {
			name?: string;
		} = {}
	): Promise<MfaDevice> {
		return EnhancedPingOneMfaService.createDevice(credentials, 'EMAIL', {
			name: options.name || 'Email Device',
			email: emailAddress, // PingOne API expects 'email' not 'emailAddress'
		});
	}

	// FIDO2 Device Registration (WebAuthn)
	static async createFido2Device(
		credentials: MfaCredentials,
		options: {
			name?: string;
		} = {}
	): Promise<{ device: MfaDevice; registrationOptions: any }> {
		const device = await EnhancedPingOneMfaService.createDevice(credentials, 'FIDO2', {
			name: options.name || 'Security Key',
		});

		// Get registration options from PingOne
		const url = `${EnhancedPingOneMfaService.getBaseUrl(credentials.environmentId)}/users/${credentials.userId}/mfaDevices/${device.id}/registrationOptions`;
		const registrationOptions = await EnhancedPingOneMfaService.makeRequest<any>(url, {
			method: 'GET',
			headers: EnhancedPingOneMfaService.getDefaultHeaders(credentials.accessToken),
		});

		return {
			device,
			registrationOptions,
		};
	}

	// MFA Policy Management
	static async getMfaPolicies(environmentId: string, accessToken: string): Promise<MfaPolicy[]> {
		const response = await fetch('/api/pingone/mfa/policies', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				environmentId,
				workerToken: accessToken,
			}),
		});

		if (!response.ok) {
			const errorBody = await response.json().catch(() => ({}));
			throw new Error(
				errorBody?.error_description || errorBody?.message || 'Unable to load PingOne MFA policies'
			);
		}

		const data = await response.json();
		if (Array.isArray(data)) {
			return data;
		}

		return data.mfaSettings || data._embedded?.mfaSettings || [];
	}

	static async getMfaPolicy(
		environmentId: string,
		accessToken: string,
		policyId: string
	): Promise<MfaPolicy> {
		const url = `${EnhancedPingOneMfaService.getBaseUrl(environmentId)}/mfaSettings/${policyId}`;
		return EnhancedPingOneMfaService.makeRequest<MfaPolicy>(url, {
			method: 'GET',
			headers: EnhancedPingOneMfaService.getDefaultHeaders(accessToken),
		});
	}

	// Helper to get enabled device types from policy
	static getEnabledDeviceTypes(
		policy: MfaPolicy
	): Array<'SMS' | 'EMAIL' | 'TOTP' | 'VOICE' | 'FIDO2' | 'MOBILE'> {
		const enabledTypes: Array<'SMS' | 'EMAIL' | 'TOTP' | 'VOICE' | 'FIDO2' | 'MOBILE'> = [];

		if (policy.sms?.enabled && !policy.sms?.pairingDisabled) {
			enabledTypes.push('SMS');
		}
		if (policy.email?.enabled && !policy.email?.pairingDisabled) {
			enabledTypes.push('EMAIL');
		}
		if (policy.totp?.enabled && !policy.totp?.pairingDisabled) {
			enabledTypes.push('TOTP');
		}
		if (policy.voice?.enabled && !policy.voice?.pairingDisabled) {
			enabledTypes.push('VOICE');
		}
		if (policy.fido2?.enabled && !policy.fido2?.pairingDisabled) {
			enabledTypes.push('FIDO2');
		}
		if (policy.mobile?.enabled && !policy.mobile?.pairingDisabled) {
			enabledTypes.push('MOBILE');
		}

		return enabledTypes;
	}
}
