/**
 * @file FIDO2RegistrationDocsPageV8.tsx
 * @module v8/pages
 * @description FIDO2 Device Registration API Documentation Page
 * @version 8.0.0
 * 
 * This page displays the complete API documentation for FIDO2 device registration,
 * showing all PingOne API calls in the correct order with full request/response details.
 */

import React from 'react';
import { MFADocumentationPageV8 } from '../components/MFADocumentationPageV8';
import { CredentialsServiceV8 } from '../services/credentialsServiceV8';

const FLOW_KEY = 'mfa-flow-v8';

export const FIDO2RegistrationDocsPageV8: React.FC = () => {
	// Load credentials from storage to populate documentation with user's actual values
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
			deviceType="FIDO2"
			flowType="registration"
			credentials={{
				environmentId: credentials.environmentId,
				username: credentials.username,
				deviceAuthenticationPolicyId: credentials.deviceAuthenticationPolicyId,
			}}
		/>
	);
};

