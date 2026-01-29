/**
 * @file mfaFeatureFlagHelpers.ts
 * @module v8/utils
 * @description Helper utilities for MFA feature flag management
 * @version 8.0.0
 * @since 2026-01-29
 *
 * Purpose: Provide convenient helpers for managing MFA feature flags
 * - Quick enable/disable functions
 * - Rollout percentage helpers
 * - Status checking utilities
 * - Admin console commands
 *
 * @example
 * // Enable SMS at 10% rollout
 * enableUnifiedFlowForDevice('SMS', 10);
 *
 * @example
 * // Check if any device is using unified flow
 * const status = getUnifiedFlowStatus();
 * console.log(status); // { SMS: '10%', EMAIL: 'disabled', ... }
 */

import type { DeviceType } from '@/v8/flows/shared/MFATypes';
import type { MFAFeatureFlag, RolloutPercentage } from '@/v8/services/mfaFeatureFlagsV8';
import { MFAFeatureFlagsV8 } from '@/v8/services/mfaFeatureFlagsV8';

/**
 * Map device types to their corresponding feature flags
 */
const DEVICE_TO_FLAG: Record<string, MFAFeatureFlag> = {
	SMS: 'mfa_unified_sms',
	EMAIL: 'mfa_unified_email',
	MOBILE: 'mfa_unified_mobile',
	WHATSAPP: 'mfa_unified_whatsapp',
	TOTP: 'mfa_unified_totp',
	FIDO2: 'mfa_unified_fido2',
	VOICE: 'mfa_unified_sms', // Voice uses SMS flag
	OATH_TOKEN: 'mfa_unified_totp', // OATH_TOKEN uses TOTP flag
};

/**
 * Enable unified flow for a specific device type
 *
 * @param deviceType - Device type to enable
 * @param rolloutPercentage - Percentage of users (0, 10, 50, or 100)
 *
 * @example
 * enableUnifiedFlowForDevice('SMS', 10); // 10% rollout
 * enableUnifiedFlowForDevice('EMAIL', 100); // 100% rollout
 */
export function enableUnifiedFlowForDevice(
	deviceType: DeviceType | string,
	rolloutPercentage: RolloutPercentage = 100
): void {
	const flag = DEVICE_TO_FLAG[deviceType.toUpperCase()];
	if (!flag) {
		console.error(`[MFA-FLAGS] Unknown device type: ${deviceType}`);
		return;
	}

	MFAFeatureFlagsV8.setFlag(flag, true, rolloutPercentage);
	console.log(`[MFA-FLAGS] ✅ Enabled unified flow for ${deviceType} at ${rolloutPercentage}%`);
}

/**
 * Disable unified flow for a specific device type (instant rollback)
 *
 * @param deviceType - Device type to disable
 *
 * @example
 * disableUnifiedFlowForDevice('SMS'); // Instant rollback to legacy
 */
export function disableUnifiedFlowForDevice(deviceType: DeviceType | string): void {
	const flag = DEVICE_TO_FLAG[deviceType.toUpperCase()];
	if (!flag) {
		console.error(`[MFA-FLAGS] Unknown device type: ${deviceType}`);
		return;
	}

	MFAFeatureFlagsV8.setFlag(flag, false, 0);
	console.log(`[MFA-FLAGS] ❌ Disabled unified flow for ${deviceType} (rollback to legacy)`);
}

/**
 * Enable unified flow for all device types
 *
 * @param rolloutPercentage - Percentage of users (0, 10, 50, or 100)
 *
 * @example
 * enableUnifiedFlowForAll(10); // 10% rollout for all devices
 */
export function enableUnifiedFlowForAll(rolloutPercentage: RolloutPercentage = 100): void {
	const deviceTypes = ['SMS', 'EMAIL', 'MOBILE', 'WHATSAPP', 'TOTP', 'FIDO2'];
	for (const device of deviceTypes) {
		enableUnifiedFlowForDevice(device, rolloutPercentage);
	}
	console.log(`[MFA-FLAGS] ✅ Enabled unified flow for ALL devices at ${rolloutPercentage}%`);
}

/**
 * Disable unified flow for all device types (instant rollback)
 *
 * @example
 * disableUnifiedFlowForAll(); // Rollback all to legacy
 */
export function disableUnifiedFlowForAll(): void {
	const deviceTypes = ['SMS', 'EMAIL', 'MOBILE', 'WHATSAPP', 'TOTP', 'FIDO2'];
	for (const device of deviceTypes) {
		disableUnifiedFlowForDevice(device);
	}
	console.log(`[MFA-FLAGS] ❌ Disabled unified flow for ALL devices (rollback to legacy)`);
}

/**
 * Get unified flow status for all device types
 *
 * @returns Object with device types and their rollout status
 *
 * @example
 * const status = getUnifiedFlowStatus();
 * // { SMS: '10%', EMAIL: 'disabled', TOTP: '100%', ... }
 */
export function getUnifiedFlowStatus(): Record<string, string> {
	const status: Record<string, string> = {};
	const deviceTypes = ['SMS', 'EMAIL', 'MOBILE', 'WHATSAPP', 'TOTP', 'FIDO2'];

	deviceTypes.forEach((device) => {
		const flag = DEVICE_TO_FLAG[device];
		if (flag) {
			const state = MFAFeatureFlagsV8.getFlagState(flag);
			if (!state.enabled) {
				status[device] = 'disabled';
			} else {
				status[device] = `${state.rolloutPercentage}%`;
			}
		}
	});

	return status;
}

/**
 * Check if unified flow is enabled for a specific device type
 *
 * @param deviceType - Device type to check
 * @returns True if unified flow is enabled for this user
 *
 * @example
 * if (isUnifiedFlowEnabled('SMS')) {
 *   // User will see unified flow
 * }
 */
export function isUnifiedFlowEnabled(deviceType: DeviceType | string): boolean {
	const flag = DEVICE_TO_FLAG[deviceType.toUpperCase()];
	if (!flag) {
		console.error(`[MFA-FLAGS] Unknown device type: ${deviceType}`);
		return false;
	}

	return MFAFeatureFlagsV8.isEnabled(flag);
}

/**
 * Get detailed status for a specific device type
 *
 * @param deviceType - Device type to check
 * @returns Detailed status information
 *
 * @example
 * const status = getDeviceStatus('SMS');
 * // { enabled: true, rolloutPercentage: 10, appliesTo: 'THIS USER' }
 */
export function getDeviceStatus(deviceType: DeviceType | string): {
	enabled: boolean;
	rolloutPercentage: RolloutPercentage;
	appliesTo: string;
} | null {
	const flag = DEVICE_TO_FLAG[deviceType.toUpperCase()];
	if (!flag) {
		console.error(`[MFA-FLAGS] Unknown device type: ${deviceType}`);
		return null;
	}

	const state = MFAFeatureFlagsV8.getFlagState(flag);
	const appliesTo = MFAFeatureFlagsV8.isEnabled(flag) ? 'THIS USER' : 'not this user';

	return {
		enabled: state.enabled,
		rolloutPercentage: state.rolloutPercentage,
		appliesTo,
	};
}

/**
 * Print unified flow status to console (formatted)
 *
 * @example
 * printUnifiedFlowStatus();
 * // Outputs formatted table to console
 */
export function printUnifiedFlowStatus(): void {
	console.log('\n📊 MFA Unified Flow Status\n');
	console.log('Device Type | Status    | Applies To');
	console.log('------------|-----------|------------');

	const deviceTypes = ['SMS', 'EMAIL', 'MOBILE', 'WHATSAPP', 'TOTP', 'FIDO2'];
	deviceTypes.forEach((device) => {
		const status = getDeviceStatus(device);
		if (status) {
			const statusStr = status.enabled ? `${status.rolloutPercentage}%`.padEnd(9) : 'disabled ';
			console.log(`${device.padEnd(11)} | ${statusStr} | ${status.appliesTo}`);
		}
	});

	console.log('\n💡 Commands:');
	console.log('  window.mfaHelpers.enable("SMS", 10)   - Enable SMS at 10%');
	console.log('  window.mfaHelpers.disable("SMS")      - Disable SMS (rollback)');
	console.log('  window.mfaHelpers.enableAll(50)       - Enable all at 50%');
	console.log('  window.mfaHelpers.disableAll()        - Disable all (rollback)');
	console.log('  window.mfaHelpers.status()            - Show this status\n');
}

/**
 * Expose helpers to window for admin console access
 */
if (typeof window !== 'undefined') {
	interface MFAHelpers {
		enable: typeof enableUnifiedFlowForDevice;
		disable: typeof disableUnifiedFlowForDevice;
		enableAll: typeof enableUnifiedFlowForAll;
		disableAll: typeof disableUnifiedFlowForAll;
		status: typeof printUnifiedFlowStatus;
		getStatus: typeof getUnifiedFlowStatus;
		isEnabled: typeof isUnifiedFlowEnabled;
		getDeviceStatus: typeof getDeviceStatus;
	}

	(window as unknown as Window & { mfaHelpers: MFAHelpers }).mfaHelpers = {
		enable: enableUnifiedFlowForDevice,
		disable: disableUnifiedFlowForDevice,
		enableAll: enableUnifiedFlowForAll,
		disableAll: disableUnifiedFlowForAll,
		status: printUnifiedFlowStatus,
		getStatus: getUnifiedFlowStatus,
		isEnabled: isUnifiedFlowEnabled,
		getDeviceStatus,
	};

	console.log(
		'[MFA-FLAGS] 🛠️  Admin helpers available at window.mfaHelpers\n' +
			'Run window.mfaHelpers.status() to see current status'
	);
}
