/**
 * @file FlowStateContext.tsx
 * @module v8/contexts
 * @description Global flow state management for action button states and operation tracking
 * @version 1.0.0
 */

import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export interface FlowStateContextType {
	isActionInProgress: boolean;
	currentAction: string | null;
	startAction: (actionName: string) => void;
	endAction: () => void;
}

const FlowStateContext = createContext<FlowStateContextType | undefined>(undefined);

export const FlowStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
	const [isActionInProgress, setIsActionInProgress] = useState(false);
	const [currentAction, setCurrentAction] = useState<string | null>(null);

	const startAction = useCallback((actionName: string) => {
		console.log('[FlowState] Starting action:', actionName);
		setIsActionInProgress(true);
		setCurrentAction(actionName);
	}, []);

	const endAction = useCallback(() => {
		console.log('[FlowState] Ending action:', currentAction);
		setIsActionInProgress(false);
		setCurrentAction(null);
	}, [currentAction]);

	return (
		<FlowStateContext.Provider value={{ isActionInProgress, currentAction, startAction, endAction }}>
			{children}
		</FlowStateContext.Provider>
	);
};

export const useFlowState = (): FlowStateContextType => {
	const context = useContext(FlowStateContext);
	if (!context) {
		throw new Error('useFlowState must be used within FlowStateProvider');
	}
	return context;
};
