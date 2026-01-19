/**
 * @file useActionButton.ts
 * @module v8/hooks
 * @description Custom hook for managing button state with global flow state integration
 * @version 1.0.0
 */

import { useCallback, useState } from 'react';
import { useFlowState } from '../contexts/FlowStateContext';

export interface UseActionButtonResult {
	isLoading: boolean;
	disabled: boolean;
	executeAction: <T>(actionFn: () => Promise<T>, actionName: string) => Promise<T | null>;
}

/**
 * Hook to manage button state with automatic loading indicators
 * and global flow state tracking
 */
export const useActionButton = (): UseActionButtonResult => {
	const [isLoading, setIsLoading] = useState(false);
	const { isActionInProgress, startAction, endAction } = useFlowState();

	const executeAction = useCallback(
		async <T>(actionFn: () => Promise<T>, actionName: string): Promise<T | null> => {
			if (isActionInProgress) {
				console.warn('[useActionButton] Action blocked - another action in progress');
				return null;
			}

			try {
				setIsLoading(true);
				startAction(actionName);
				const result = await actionFn();
				return result;
			} catch (error) {
				console.error('[useActionButton] Action failed:', actionName, error);
				throw error;
			} finally {
				setIsLoading(false);
				endAction();
			}
		},
		[isActionInProgress, startAction, endAction]
	);

	return {
		isLoading,
		disabled: isActionInProgress && !isLoading,
		executeAction,
	};
};
