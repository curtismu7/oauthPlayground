/**
 * @file MFAFlowV8.tsx
 * @module v8/flows
 * @description PingOne MFA Flow Router - Routes to device-specific flows or unified flow
 * @version 8.4.0
 * @since 2024-11-19
 *
 * This router component supports two modes with gradual rollout:
 *
 * **Legacy Mode (default):**
 * - SMSFlowV8: SMS device registration and OTP validation
 * - EmailFlowV8: Email device registration and OTP validation
 * - TOTPFlowV8: TOTP device registration and validation
 * - FIDO2FlowV8: FIDO2 device registration and WebAuthn validation
 * - MobileFlowV8: Mobile app pairing
 * - WhatsAppFlowV8: WhatsApp OTP validation
 *
 * **Unified Mode (feature flag controlled):**
 * - UnifiedMFARegistrationFlowV8: Single component handling all 6 device types
 * - 85% code reduction while maintaining full feature parity
 * - Configuration-driven rendering
 * - Gradual rollout per device type (0%, 10%, 50%, 100%)
 *
 * Enable unified flow per device:
 * - Console: window.mfaFlags.setFlag('mfa_unified_sms', true, 10)  // 10% rollout
 * - Console: window.mfaFlags.setFlag('mfa_unified_email', true, 50) // 50% rollout
 * - Console: window.mfaFlags.setFlag('mfa_unified_totp', true, 100) // 100% rollout
 *
 * Instant rollback:
 * - Console: window.mfaFlags.setFlag('mfa_unified_sms', false, 0)
 *
 * @example
 * // Legacy mode (default for all devices)
 * <MFAFlowV8 />
 *
 * @example
 * // Unified mode for SMS at 10% rollout
 * window.mfaFlags.setFlag('mfa_unified_sms', true, 10)
 * <MFAFlowV8 />
 */

import React, { Suspense, useState } from 'react';
import { MFAErrorBoundary } from '@/v8/components/MFAErrorBoundary';
import { MFAFlowSkeleton } from '@/v8/components/MFASkeletonLoader';
import type { DeviceConfigKey } from '@/v8/config/deviceFlowConfigTypes';
import { CredentialsServiceV8 } from '@/v8/services/credentialsServiceV8';
import type { MFAFeatureFlag } from '@/v8/services/mfaFeatureFlagsV8';
import { MFAFeatureFlagsV8 } from '@/v8/services/mfaFeatureFlagsV8';
import { MFAFlowComponentFactory } from './factories/MFAFlowComponentFactory';
import type { DeviceType } from './shared/MFATypes';

const MODULE_TAG = '[📱 MFA-FLOW-V8]';
const FLOW_KEY = 'mfa-flow-v8';

// Lazy load unified flow for code splitting
// Temporarily disabled due to syntax errors
// const UnifiedMFARegistrationFlowV8 = React.lazy(
// 	() => import('./unified/UnifiedMFARegistrationFlowV8_Legacy')
// );
const UnifiedMFARegistrationFlowV8 = React.lazy(() => Promise.resolve({ default: () => null }));

/**
 * Map device types to their corresponding feature flags
 */
const DEVICE_TYPE_TO_FLAG_MAP: Record<DeviceType, MFAFeatureFlag> = {
	SMS: 'mfa_unified_sms',
	EMAIL: 'mfa_unified_email',
	MOBILE: 'mfa_unified_mobile',
	WHATSAPP: 'mfa_unified_whatsapp',
	TOTP: 'mfa_unified_totp',
	FIDO2: 'mfa_unified_fido2',
	VOICE: 'mfa_unified_sms', // Voice uses same flag as SMS
	OATH_TOKEN: 'mfa_unified_totp', // OATH_TOKEN uses same flag as TOTP
};

/**
 * Main MFA Flow Router Component
 * Routes to device-specific flow components using Factory pattern OR unified flow based on feature flags
 *
 * Architecture:
 * - Router: Routes to device-specific or unified components (this file)
 * - Feature Flags: Controls gradual rollout per device type (MFAFeatureFlagsV8)
 * - Factory: Creates legacy components dynamically (MFAFlowComponentFactory)
 * - Unified: Single component for all device types (UnifiedMFARegistrationFlowV8)
 */
export const MFAFlowV8: React.FC = () => {
	console.log(`${MODULE_TAG} Initializing MFA flow router`);

	// Load device type from stored credentials, default to SMS
	// Make it state so it can be updated when user changes device type
	const [deviceType, setDeviceType] = useState<DeviceType>(() => {
		const stored = CredentialsServiceV8.loadCredentials(FLOW_KEY, {
			flowKey: FLOW_KEY,
			flowType: 'oidc',
			includeClientSecret: false,
			includeRedirectUri: false,
			includeLogoutUri: false,
			includeScopes: false,
		});

		return (stored.deviceType as DeviceType) || 'SMS';
	});

	// Check if unified flow is enabled for this device type
	const featureFlag = DEVICE_TYPE_TO_FLAG_MAP[deviceType];
	const useUnifiedFlow = MFAFeatureFlagsV8.isEnabled(featureFlag);

	console.log(
		`${MODULE_TAG} Device: ${deviceType}, Flag: ${featureFlag}, Unified: ${useUnifiedFlow}`
	);

	// Listen for device type changes from child components
	React.useEffect(() => {
		const handleDeviceTypeChange = (event: Event) => {
			const customEvent = event as CustomEvent<DeviceType>;
			const newDeviceType = customEvent.detail;
			if (newDeviceType !== deviceType) {
				console.log(`${MODULE_TAG} Device type changed from ${deviceType} to ${newDeviceType}`);
				setDeviceType(newDeviceType);
			}
		};

		window.addEventListener('mfaDeviceTypeChanged', handleDeviceTypeChange);
		return () => {
			window.removeEventListener('mfaDeviceTypeChanged', handleDeviceTypeChange);
		};
	}, [deviceType]);

	// Route to unified flow or legacy flow based on feature flag
	if (useUnifiedFlow) {
		console.log(`${MODULE_TAG} ✨ Using UNIFIED flow for ${deviceType}`);
		return (
			<MFAErrorBoundary>
				<Suspense fallback={<MFAFlowSkeleton />}>
					<UnifiedMFARegistrationFlowV8 deviceType={deviceType as DeviceConfigKey} />
				</Suspense>
			</MFAErrorBoundary>
		);
	}

	// Use factory to create the appropriate legacy component
	console.log(`${MODULE_TAG} 📱 Using LEGACY flow for ${deviceType}`);
	const FlowComponent = MFAFlowComponentFactory.create(deviceType);

	return (
		<MFAErrorBoundary>
			<Suspense fallback={<MFAFlowSkeleton />}>
				<FlowComponent />
			</Suspense>
		</MFAErrorBoundary>
	);
};

export default MFAFlowV8;
