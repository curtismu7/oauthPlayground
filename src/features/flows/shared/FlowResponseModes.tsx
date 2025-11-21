// src/features/flows/shared/FlowResponseModes.tsx
import React from 'react';
import ResponseModeSelector, {
	type ResponseModeSelectorProps,
} from '../../../components/response-modes/ResponseModeSelector';
import {
	getResponseModeDefaults,
	type ResponseModeFlowKey,
} from '../../../services/responseModeFlowService';

export type FlowResponseModesProps = Omit<ResponseModeSelectorProps, 'flowKey'> & {
	flowKey: ResponseModeFlowKey;
};

const FlowResponseModes: React.FC<FlowResponseModesProps> = ({
	flowKey,
	responseType,
	redirectUri,
	clientId,
	scope,
	state,
	nonce,
	extraParams,
	defaultMode,
	readOnlyFlowContext,
	className,
}) => {
	const defaults = getResponseModeDefaults(flowKey);

	return (
		<ResponseModeSelector
			flowKey={flowKey}
			responseType={responseType}
			redirectUri={redirectUri}
			clientId={clientId}
			scope={scope ?? defaults.scope}
			state={state ?? defaults.state}
			nonce={nonce ?? defaults.nonce}
			extraParams={extraParams ?? defaults.extraParams ?? {}}
			defaultMode={defaultMode ?? defaults.defaultMode}
			readOnlyFlowContext={readOnlyFlowContext ?? defaults.readOnlyFlowContext ?? true}
			className={className}
		/>
	);
};

export default FlowResponseModes;
