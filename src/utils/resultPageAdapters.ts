// src/utils/resultPageAdapters.ts
import type { PlaygroundResult } from '../pages/PingOneAuthentication';
import type { FlowResult, FlowStep } from '../services/resultPageService';

export const PINGONE_AUTH_FLOW_RESULT_KEY = 'pingone-authentication';
export const PINGONE_AUTH_FLOW_NAME = 'PingOne Tokens Lounge';

/**
 * Converts a playground result and optional flow steps into the shared FlowResult shape.
 */
export const buildFlowResultFromPlayground = (
	result: PlaygroundResult,
	steps: FlowStep[] = []
): FlowResult => {
	const hasIdToken = Boolean(result.tokens?.id_token);
	return {
		flowType: hasIdToken ? 'oidc' : 'oauth',
		flowName: PINGONE_AUTH_FLOW_NAME,
		timestamp: result.timestamp,
		status: 'success',
		config: result.config,
		tokens: result.tokens,
		steps,
		metadata: {
			responseType: result.responseType,
			mode: result.mode,
			authUrl: result.authUrl,
			context: result.context,
		},
	};
};





