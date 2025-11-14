// src/services/responseModeFlowService.ts
import type { ResponseModeSelectorProps } from '../components/response-modes/ResponseModeSelector';

export type ResponseModeFlowKey = 'authorization_code' | 'implicit' | 'hybrid';

export interface ResponseModeFlowDefaults {
	scope?: string;
	state?: string;
	nonce?: string;
	extraParams?: Record<string, string>;
	defaultMode: ResponseModeSelectorProps['defaultMode'];
	readOnlyFlowContext?: boolean;
}

const RESPONSE_MODE_DEFAULTS: Record<ResponseModeFlowKey, ResponseModeFlowDefaults> = {
	authorization_code: {
		scope: 'openid profile email',
		state: 'random_state_123',
		defaultMode: 'query',
		readOnlyFlowContext: true,
	},
	implicit: {
		scope: 'openid profile email',
		state: 'random_state_123',
		nonce: 'random_nonce_456',
		defaultMode: 'fragment',
		readOnlyFlowContext: true,
	},
	hybrid: {
		scope: 'openid profile email',
		state: 'random_state_123',
		nonce: 'random_nonce_456',
		defaultMode: 'fragment',
		readOnlyFlowContext: true,
	},
};

export const getResponseModeDefaults = (
	flowKey: ResponseModeFlowKey
): ResponseModeFlowDefaults => RESPONSE_MODE_DEFAULTS[flowKey];



