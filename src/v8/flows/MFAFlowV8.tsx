/**
 * @file MFAFlowV8.tsx
 * @module v8/flows
 * @description PingOne MFA Flow Router - Routes to device-specific flows
 * @version 8.1.0
 * @since 2024-11-19
 *
 * This is a router component that delegates to device-specific flow components:
 * - SMSFlowV8: SMS device registration and OTP validation
 * - EmailFlowV8: Email device registration and OTP validation
 * - TOTPFlowV8: TOTP device registration and validation (TODO)
 * - FIDO2FlowV8: FIDO2 device registration and WebAuthn validation (TODO)
 *
 * @example
 * <MFAFlowV8 />
 */

import React, { useState } from 'react';
import { CredentialsServiceV8 } from '@/v8/services/credentialsServiceV8';
import { SMSFlowV8 } from './types/SMSFlowV8';
import { EmailFlowV8 } from './types/EmailFlowV8';
import type { DeviceType } from './shared/MFATypes';

const MODULE_TAG = '[📱 MFA-FLOW-V8]';
const FLOW_KEY = 'mfa-flow-v8';

/**
 * Main MFA Flow Router Component
 * Routes to device-specific flow components based on device type
 */
export const MFAFlowV8: React.FC = () => {
	console.log(`${MODULE_TAG} Initializing MFA flow router`);

	// Load device type from stored credentials, default to SMS
	const [deviceType] = useState<DeviceType>(() => {
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

	// Route to appropriate flow component based on device type
	switch (deviceType) {
		case 'SMS':
			return <SMSFlowV8 />;
		case 'EMAIL':
			return <EmailFlowV8 />;
		case 'TOTP':
			// TODO: Implement TOTPFlowV8
			return (
				<div style={{ padding: '40px', textAlign: 'center' }}>
					<h2>TOTP Flow - Coming Soon</h2>
					<p>TOTP device flow is not yet implemented. Please use SMS flow for now.</p>
				</div>
			);
		case 'FIDO2':
			// TODO: Implement FIDO2FlowV8
			return (
				<div style={{ padding: '40px', textAlign: 'center' }}>
					<h2>FIDO2 Flow - Coming Soon</h2>
					<p>FIDO2 device flow is not yet implemented. Please use SMS flow for now.</p>
				</div>
			);
		default:
			return <SMSFlowV8 />;
	}
};

export default MFAFlowV8;
