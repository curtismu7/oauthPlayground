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
import { useLocation, useNavigate } from 'react-router-dom';
import { MFADocumentationPageV8 } from '../components/MFADocumentationPageV8';
import { CredentialsServiceV8 } from '../services/credentialsServiceV8';

const FLOW_KEY = 'mfa-flow-v8';

export const EmailRegistrationDocsPageV8: React.FC = () => {
	const navigate = useNavigate();
	const location = useLocation();

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
			deviceType="EMAIL"
			flowType="registration"
			credentials={{
				environmentId: credentials.environmentId,
				username: credentials.username,
				deviceAuthenticationPolicyId: credentials.deviceAuthenticationPolicyId,
			}}
		/>
	);
};

