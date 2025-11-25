/**
 * @file MFAFlowV8.tsx
 * @module v8/flows
 * @description PingOne MFA Flow Router - Routes to device-specific flows
 * @version 8.2.0
 * @since 2024-11-19
 *
 * This is a router component that delegates to device-specific flow components:
 * - SMSFlowV8: SMS device registration and OTP validation
 * - EmailFlowV8: Email device registration and OTP validation
 * - TOTPFlowV8: TOTP device registration and validation
 * - FIDO2FlowV8: FIDO2 device registration and WebAuthn validation
 *
 * @example
 * <MFAFlowV8 />
 */

import React, { Suspense, useState } from 'react';
import { CredentialsServiceV8 } from '@/v8/services/credentialsServiceV8';
import type { DeviceType } from './shared/MFATypes';
import { MFAFlowComponentFactory } from './factories/MFAFlowComponentFactory';

const MODULE_TAG = '[📱 MFA-FLOW-V8]';
const FLOW_KEY = 'mfa-flow-v8';

/**
 * Main MFA Flow Router Component
 * Routes to device-specific flow components using Factory pattern
 * 
 * Architecture:
 * - Router: Routes to device-specific components (this file)
 * - Factory: Creates components dynamically (MFAFlowComponentFactory)
 * - Controller: Handles business logic (MFAFlowController)
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

	// Use factory to create the appropriate component
	const FlowComponent = MFAFlowComponentFactory.create(deviceType);

	return (
		<Suspense fallback={<div style={{ padding: '40px', textAlign: 'center' }}>Loading flow...</div>}>
			<FlowComponent />
		</Suspense>
	);
};

export default MFAFlowV8;
