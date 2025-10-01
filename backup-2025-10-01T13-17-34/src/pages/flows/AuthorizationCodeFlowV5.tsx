// src/pages/flows/AuthorizationCodeFlowV5.tsx
import React from 'react';
import { AuthorizationCodeFlowV5 } from '../../components/AuthorizationCodeFlowV5';

const OAuthAuthorizationCodeFlowV5: React.FC = () => {
	return (
		<AuthorizationCodeFlowV5
			flowType="oauth"
			flowName="OAuth 2.0 Authorization Code Flow"
			flowVersion="V5"
			completionMessage="Nice work! You successfully completed the OAuth 2.0 Authorization Code Flow with PKCE using reusable V5 components."
			nextSteps={[
				'Inspect or decode tokens using the Token Management tools.',
				'Repeat the flow with different scopes or redirect URIs.',
				'Explore refresh tokens and introspection flows.',
			]}
		/>
	);
};

export default OAuthAuthorizationCodeFlowV5;