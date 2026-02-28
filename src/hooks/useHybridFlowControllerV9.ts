import {
	HybridFlowController,
	HybridFlowControllerOptions,
	useHybridFlowController,
} from './useHybridFlowController';

/**
 * V9 wrapper around the hybrid flow controller ensuring V9 defaults.
 */
export const useHybridFlowControllerV9 = (
	opts: HybridFlowControllerOptions = {}
): HybridFlowController => {
	const { flowKey = 'hybrid-flow-v9', defaultFlowVariant = 'code-id-token', ...rest } = opts;
	return useHybridFlowController({
		flowKey,
		defaultFlowVariant,
		...rest,
	});
};

export type { HybridFlowController, HybridFlowControllerOptions } from './useHybridFlowController';
