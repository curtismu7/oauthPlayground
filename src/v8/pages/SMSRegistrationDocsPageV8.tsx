/**
 * @file SMSRegistrationDocsPageV8.tsx
 * @module v8/pages
 * @description SMS Device Registration API Documentation Page
 * @version 8.0.0
 * 
 * This page displays the complete API documentation for SMS device registration,
 * showing all PingOne API calls in the correct order with full request/response details.
 */

import React from 'react';
import { MFADocumentationPageV8 } from '../components/MFADocumentationPageV8';
import { CredentialsServiceV8 } from '../services/credentialsServiceV8';

const FLOW_KEY = 'mfa-flow-v8';

export const SMSRegistrationDocsPageV8: React.FC = () => {
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
			deviceType="SMS"
			flowType="registration"
			credentials={{
				environmentId: credentials.environmentId,
				username: credentials.username,
				deviceAuthenticationPolicyId: credentials.deviceAuthenticationPolicyId,
			}}
		/>
	);
};

