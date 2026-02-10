/**
 * @file useProductionSpinner.ts
 * @module hooks
 * @description Custom hook for Production app spinner management
 * @version 1.0.0
 */

import { useCallback, useEffect, useState } from 'react';
import { CommonSpinnerService } from '@/services/CommonSpinnerService';
import type {
	CommonSpinnerConfig,
	CommonSpinnerState,
	UseProductionSpinnerReturn,
} from '@/types/spinner';

/**
 * Custom hook for managing spinner states in Production applications
 * Provides easy-to-use API for showing/hiding spinners with consistent behavior
 */
export const useProductionSpinner = (
	appId: string,
	defaultConfig?: Partial<CommonSpinnerConfig>
): UseProductionSpinnerReturn => {
	const [spinnerState, setSpinnerState] = useState<CommonSpinnerState>(() => {
		const instance = CommonSpinnerService.getInstance(appId, defaultConfig);
		return { ...instance.state };
	});

	// Listen for spinner state changes
	useEffect(() => {
		const handleSpinnerEvent = (event: CustomEvent) => {
			const { detail } = event;

			if (detail.appId === appId) {
				const instance = CommonSpinnerService.getInstance(appId);
				setSpinnerState({ ...instance.state });
			}
		};

		// Listen for all spinner events
		const events = ['spinner:show', 'spinner:hide', 'spinner:update'];

		events.forEach((eventType) => {
			window.addEventListener(eventType, handleSpinnerEvent as EventListener);
		});

		// Initial state sync
		const instance = CommonSpinnerService.getInstance(appId, defaultConfig);
		setSpinnerState({ ...instance.state });

		return () => {
			events.forEach((eventType) => {
				window.removeEventListener(eventType, handleSpinnerEvent as EventListener);
			});
		};
	}, [appId, defaultConfig]);

	// Show spinner with optional configuration
	const showSpinner = useCallback(
		(message?: string, config?: Partial<CommonSpinnerConfig>) => {
			const finalConfig = { ...defaultConfig, ...config };
			if (message) {
				finalConfig.message = message;
			}

			CommonSpinnerService.showSpinner(appId, finalConfig);
		},
		[appId, defaultConfig]
	);

	// Hide spinner
	const hideSpinner = useCallback(() => {
		CommonSpinnerService.hideSpinner(appId);
	}, [appId]);

	// Update spinner message
	const updateMessage = useCallback(
		(message: string) => {
			CommonSpinnerService.updateMessage(appId, message);
		},
		[appId]
	);

	// Update spinner progress
	const updateProgress = useCallback(
		(progress: number) => {
			CommonSpinnerService.updateProgress(appId, progress);
		},
		[appId]
	);

	// Execute async operation with automatic spinner management
	const withSpinner = useCallback(
		async <T>(
			operation: () => Promise<T>,
			message?: string,
			config?: Partial<CommonSpinnerConfig>
		): Promise<T> => {
			showSpinner(message || 'Processing...', config);

			try {
				const result = await operation();
				return result;
			} finally {
				hideSpinner();
			}
		},
		[showSpinner, hideSpinner]
	);

	return {
		showSpinner,
		hideSpinner,
		updateMessage,
		updateProgress,
		withSpinner,
		spinnerState,
		isLoading: spinnerState.show,
	};
};

/**
 * Hook for managing global spinner state across all Production apps
 */
export const useGlobalSpinner = () => {
	const [globalState, setGlobalState] = useState<Record<string, CommonSpinnerState>>({});

	useEffect(() => {
		const updateGlobalState = () => {
			setGlobalState(CommonSpinnerService.getAllStates());
		};

		// Listen for all spinner events
		const handleSpinnerEvent = () => {
			updateGlobalState();
		};

		const events = ['spinner:show', 'spinner:hide', 'spinner:update'];

		events.forEach((eventType) => {
			window.addEventListener(eventType, handleSpinnerEvent);
		});

		// Initial state
		updateGlobalState();

		return () => {
			events.forEach((eventType) => {
				window.removeEventListener(eventType, handleSpinnerEvent);
			});
		};
	}, []);

	const hideAllSpinners = useCallback(() => {
		CommonSpinnerService.hideAllSpinners();
	}, []);

	const getMetrics = useCallback(() => {
		return CommonSpinnerService.getMetrics();
	}, []);

	return {
		globalState,
		hideAllSpinners,
		getMetrics,
		activeCount: Object.values(globalState).filter((state) => state.show).length,
	};
};

/**
 * Hook for managing spinner with automatic cleanup on unmount
 */
export const useAutoSpinner = (appId: string, defaultConfig?: Partial<CommonSpinnerConfig>) => {
	const spinner = useProductionSpinner(appId, defaultConfig);

	useEffect(() => {
		// Auto-hide spinner when component unmounts
		return () => {
			spinner.hideSpinner();
		};
	}, [spinner]);

	return spinner;
};

export default useProductionSpinner;
