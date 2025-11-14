// src/features/flows/Hybrid/ResponseModes.tsx
// Thin wrapper for embedding ResponseModeSelector in Hybrid flows

import React from 'react';
import ResponseModeSelector, {
	type ResponseModeSelectorProps,
} from '../../../components/response-modes/ResponseModeSelector';

interface HybridResponseModesProps {
	responseType: 'code id_token' | 'code token' | 'code token id_token';
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

const HybridResponseModes: React.FC<HybridResponseModesProps> = ({
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
			flowKey="hybrid"
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

export default HybridResponseModes;
