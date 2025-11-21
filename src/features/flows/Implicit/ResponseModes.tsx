// src/features/flows/Implicit/ResponseModes.tsx
// Thin wrapper for embedding ResponseModeSelector in Implicit flows

import React from 'react';
import ResponseModeSelector from '../../../components/response-modes/ResponseModeSelector';

interface ImplicitResponseModesProps {
	responseType: 'token' | 'id_token' | 'token id_token';
	redirectUri: string;
	clientId: string;
	scope?: string;
	state?: string;
	nonce?: string;
	extraParams?: Record<string, string>;
	defaultMode?: 'query' | 'fragment' | 'form_post' | 'pi.flow';
	readOnlyFlowContext?: boolean;
	className?: string;
}

const ImplicitResponseModes: React.FC<ImplicitResponseModesProps> = ({
	responseType,
	redirectUri,
	clientId,
	scope = 'openid profile email',
	state = 'random_state_123',
	nonce = 'random_nonce_456',
	extraParams = {},
	defaultMode = 'fragment',
	readOnlyFlowContext = true,
	className,
}) => {
	return (
		<ResponseModeSelector
			flowKey="implicit"
			responseType={responseType}
			redirectUri={redirectUri}
			clientId={clientId}
			scope={scope}
			state={state}
			nonce={nonce}
			extraParams={extraParams}
			defaultMode={defaultMode}
			readOnlyFlowContext={readOnlyFlowContext}
			className={className}
		/>
	);
};

export default ImplicitResponseModes;
