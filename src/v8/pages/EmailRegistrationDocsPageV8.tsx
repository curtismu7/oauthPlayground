/**
 * @file EmailRegistrationDocsPageV8.tsx
 * @module v8/pages
 * @description Email Device Registration API Documentation Page
 * @version 8.0.0
 * 
 * This page displays the complete API documentation for Email device registration,
 * showing all PingOne API calls in the correct order with full request/response details.
 */

import React from 'react';
import { useLocation } from 'react-router-dom';
import { MFADocumentationPageV8 } from '../components/MFADocumentationPageV8';
import { CredentialsServiceV8 } from '../services/credentialsServiceV8';

const FLOW_KEY = 'mfa-flow-v8';

export const EmailRegistrationDocsPageV8: React.FC = () => {
	const location = useLocation();
	
	// Try to get flow-specific data from location.state (when navigating from success page)
	const flowData = location.state as {
		registrationFlowType?: 'admin' | 'user';
		adminDeviceStatus?: 'ACTIVE' | 'ACTIVATION_REQUIRED';
		tokenType?: 'worker' | 'user';
		environmentId?: string;
		userId?: string;
		deviceId?: string;
		policyId?: string;
		deviceStatus?: string;
		username?: string;
		clientId?: string;
		phone?: string;
		email?: string;
		deviceName?: string;
	} | null;
	
	// Fall back to sessionStorage if location.state is not available
	let storedFlowData: typeof flowData = null;
	if (!flowData) {
		try {
			const stored = sessionStorage.getItem('mfa-flow-documentation-data');
			if (stored) {
				storedFlowData = JSON.parse(stored);
			}
		} catch (e) {
			// Ignore parse errors
		}
	}
	
	const actualFlowData = flowData || storedFlowData;
	
	// Load credentials as fallback
	const credentials = CredentialsServiceV8.loadCredentials(FLOW_KEY, {
		flowKey: FLOW_KEY,
		flowType: 'oidc',
		includeClientSecret: false,
		includeRedirectUri: false,
		includeLogoutUri: false,
		includeScopes: false,
	});

	return (
		<MFADocumentationPageV8
			deviceType="EMAIL"
			flowType="registration"
			registrationFlowType={actualFlowData?.registrationFlowType}
			adminDeviceStatus={actualFlowData?.adminDeviceStatus}
			tokenType={actualFlowData?.tokenType}
			flowSpecificData={{
				environmentId: actualFlowData?.environmentId || credentials.environmentId,
				userId: actualFlowData?.userId,
				deviceId: actualFlowData?.deviceId,
				policyId: actualFlowData?.policyId || credentials.deviceAuthenticationPolicyId,
				deviceStatus: actualFlowData?.deviceStatus,
				username: actualFlowData?.username || credentials.username,
				clientId: actualFlowData?.clientId || credentials.clientId,
				phone: actualFlowData?.phone,
				email: actualFlowData?.email,
				deviceName: actualFlowData?.deviceName,
			}}
			credentials={{
				environmentId: credentials.environmentId,
				username: credentials.username,
				deviceAuthenticationPolicyId: credentials.deviceAuthenticationPolicyId,
			}}
		/>
	);
};

