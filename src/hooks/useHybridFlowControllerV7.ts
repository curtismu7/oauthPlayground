import {
	HybridFlowController,
	HybridFlowControllerOptions,
	useHybridFlowController,
} from './useHybridFlowController';

/**
 * V7 wrapper around the hybrid flow controller ensuring V7 defaults.
 */
export const useHybridFlowControllerV7 = (
	opts: HybridFlowControllerOptions = {}
): HybridFlowController => {
	const { flowKey = 'hybrid-flow-v7', defaultFlowVariant = 'code-id-token', ...rest } = opts;

	return useHybridFlowController({
		flowKey,
		defaultFlowVariant,
		...rest,
	});
};

export type { HybridFlowController, HybridFlowControllerOptions } from './useHybridFlowController';
