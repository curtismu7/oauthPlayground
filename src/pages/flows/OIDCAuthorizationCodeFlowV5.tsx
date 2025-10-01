// src/pages/flows/OIDCAuthorizationCodeFlowV5.tsx
import React from 'react';
import { AuthorizationCodeFlowV5 } from '../../components/AuthorizationCodeFlowV5';

const OIDCAuthorizationCodeFlowV5: React.FC = () => {
	return (
		<AuthorizationCodeFlowV5
			flowType="oidc"
			flowName="OpenID Connect Authorization Code Flow"
			flowVersion="V5"
			completionMessage="Nice work! You successfully completed the OpenID Connect Authorization Code Flow with PKCE using reusable V5 components."
			nextSteps={[
				'Inspect or decode tokens using the Token Management tools.',
				'Repeat the flow with different scopes or redirect URIs.',
				'Explore refresh tokens and introspection flows.',
				'Try the User Information endpoint to get user profile data.',
			]}
		/>
	);
};

export default OIDCAuthorizationCodeFlowV5;

