// src/hooks/useFlowWalkthrough.ts
// Custom hook for using FlowWalkthroughService

import { useMemo } from 'react';
import { FlowWalkthroughService, FlowWalkthroughConfig } from '../services/FlowWalkthroughService';

export interface UseFlowWalkthroughReturn {
	config: FlowWalkthroughConfig | null;
	hasWalkthrough: boolean;
	steps: Array<{ title: string; description?: string }>;
	flowType: 'oauth' | 'oidc' | 'pingone' | null;
	flowName: string | null;
	icon: string | null;
}

export const useFlowWalkthrough = (flowId: string): UseFlowWalkthroughReturn => {
	const config = useMemo(() => {
		return FlowWalkthroughService.getWalkthroughConfig(flowId);
	}, [flowId]);

	const hasWalkthrough = useMemo(() => {
		return FlowWalkthroughService.hasWalkthrough(flowId);
	}, [flowId]);

	const steps = useMemo(() => {
		return config?.steps || [];
	}, [config]);

	const flowType = useMemo(() => {
		return config?.flowType || null;
	}, [config]);

	const flowName = useMemo(() => {
		return config?.flowName || null;
	}, [config]);

	const icon = useMemo(() => {
		return config?.icon || null;
	}, [config]);

	return {
		config,
		hasWalkthrough,
		steps,
		flowType,
		flowName,
		icon
	};
};

export default useFlowWalkthrough;
