// src/services/v9/V9DeviceAuthorizationService.ts
// Device Authorization endpoint simulator for V9 (RFC 8628).
// Issues device codes and user codes for device authorization flows.
//
// Migrated from V7MDeviceAuthorizationService.ts — updated to use V9StateStore.

import { V9DeviceCodeRecord, V9StateStore } from './V9StateStore';

export type V9DeviceAuthorizationRequest = {
	client_id: string;
	scope?: string;
	userEmail?: string;
	userId?: string;
};

export type V9DeviceAuthorizationResponse =
	| {
			device_code: string;
			user_code: string;
			verification_uri: string;
			verification_uri_complete: string;
			expires_in: number;
			interval: number;
	  }
	| { error: string; error_description?: string };

/**
 * Generate device and user codes for device authorization flow (RFC 8628).
 */
export function requestDeviceAuthorization(
	req: V9DeviceAuthorizationRequest,
	nowEpochSeconds: number,
	expiresInSeconds = 1800,
	intervalSeconds = 5
): V9DeviceAuthorizationResponse {
	if (!req.client_id) {
		return { error: 'invalid_request', error_description: 'client_id is required' };
	}

	const seed = `${req.client_id}-${nowEpochSeconds}`;
	const deviceCode = generateCode(seed, 32);
	const userCode =
		generateShortCode(seed, 8).toUpperCase().match(/.{4}/g)?.join('-') || 'XXXX-XXXX';

	const expiresAt = nowEpochSeconds + expiresInSeconds;

	const record: V9DeviceCodeRecord = {
		deviceCode,
		userCode: userCode.replace(/-/g, ''),
		clientId: req.client_id,
		scope: req.scope || '',
		...(req.userEmail ? { userEmail: req.userEmail } : {}),
		...(req.userId ? { userId: req.userId } : {}),
		createdAt: nowEpochSeconds,
		expiresAt,
		approved: false,
		interval: intervalSeconds,
	};

	V9StateStore.saveDeviceCode(record);

	const baseUri = window.location.origin;
	const verificationUri = `${baseUri}/v9/device-verify`;
	const verificationUriComplete = `${verificationUri}?user_code=${userCode}`;

	return {
		device_code: deviceCode,
		user_code: userCode,
		verification_uri: verificationUri,
		verification_uri_complete: verificationUriComplete,
		expires_in: expiresInSeconds,
		interval: intervalSeconds,
	};
}

function generateCode(seed: string, length: number): string {
	let h = 0x811c9dc5;
	for (let i = 0; i < seed.length; i++) {
		h ^= seed.charCodeAt(i);
		h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
	}
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
	let result = '';
	let val = h;
	for (let i = 0; i < length; i++) {
		result += chars[val % chars.length];
		val = (val * 1103515245 + 12345) & 0x7fffffff;
	}
	return result;
}

function generateShortCode(seed: string, length: number): string {
	let h = 0x811c9dc5;
	for (let i = 0; i < seed.length; i++) {
		h ^= seed.charCodeAt(i);
		h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
	}
	const chars = '0123456789';
	let result = '';
	let val = h;
	for (let i = 0; i < length; i++) {
		result += chars[val % chars.length];
		val = (val * 1103515245 + 12345) & 0x7fffffff;
	}
	return result;
}
