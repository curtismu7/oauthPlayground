// src/features/flows/AuthorizationCode/ResponseModes.tsx
// Thin wrapper for embedding ResponseModeSelector in Authorization Code flows

import React from 'react';
import ResponseModeSelector from '../../../components/response-modes/ResponseModeSelector';

interface AuthorizationCodeResponseModesProps {
	responseType: 'code';
	redirectUri: string;
	clientId: string;
	scope?: string;
	state?: string;
	extraParams?: Record<string, string>;
	defaultMode?: 'query' | 'fragment' | 'form_post' | 'pi.flow';
	readOnlyFlowContext?: boolean;
	className?: string;
}

const AuthorizationCodeResponseModes: React.FC<AuthorizationCodeResponseModesProps> = ({
	responseType,
	redirectUri,
	clientId,
	scope = 'openid profile email',
	state = 'random_state_123',
	extraParams = {},
	defaultMode = 'query',
	readOnlyFlowContext = true,
	className,
}) => {
	return (
		<ResponseModeSelector
			flowKey="authorization_code"
			responseType={responseType}
			redirectUri={redirectUri}
			clientId={clientId}
			scope={scope}
			state={state}
			extraParams={extraParams}
			defaultMode={defaultMode}
			readOnlyFlowContext={readOnlyFlowContext}
			className={className}
		/>
	);
};

export default AuthorizationCodeResponseModes;
