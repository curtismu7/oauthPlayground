import { useCallback, useEffect, useRef, useState } from 'react';
import { lazyLoadingManager, lazyLoadingMetrics } from '../utils/codeSplitting';
import { logger } from '../utils/logger';

// Lazy loading state interface
export interface LazyLoadingState {
	isLoading: boolean;
	error: Error | null;
	progress: number;
	component: React.ComponentType<any> | null;
	loadTime: number | null;
}

// Lazy loading configuration
export interface UseLazyLoadingConfig {
	flowType: string;
	preload?: boolean;
	retryOnError?: boolean;
	maxRetries?: number;
	retryDelay?: number;
	onLoadStart?: () => void;
	onLoadComplete?: (component: React.ComponentType<any>) => void;
	onLoadError?: (error: Error) => void;
}

// Default configuration
const defaultConfig: Partial<UseLazyLoadingConfig> = {
	preload: false,
	retryOnError: true,
	maxRetries: 3,
	retryDelay: 1000,
};

// useLazyLoading hook
export const useLazyLoading = (config: UseLazyLoadingConfig) => {
	const [state, setState] = useState<LazyLoadingState>({
		isLoading: false,
		error: null,
		progress: 0,
		component: null,
		loadTime: null,
	});

	const retryCountRef = useRef(0);
	const startTimeRef = useRef<number>(0);
	const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

	// Update progress simulation
	const updateProgress = useCallback(() => {
		setState((prev) => {
			if (prev.isLoading && prev.progress < 90) {
				const increment = Math.random() * 15 + 5; // Random increment between 5-20
				return {
					...prev,
					progress: Math.min(prev.progress + increment, 90),
				};
			}
			return prev;
		});
	}, []);

	// Start progress simulation
	const startProgressSimulation = useCallback(() => {
		if (progressIntervalRef.current) {
			clearInterval(progressIntervalRef.current);
		}

		progressIntervalRef.current = setInterval(updateProgress, 200);
	}, [updateProgress]);

	// Stop progress simulation
	const stopProgressSimulation = useCallback(() => {
		if (progressIntervalRef.current) {
			clearInterval(progressIntervalRef.current);
			progressIntervalRef.current = null;
		}
	}, []);

	// Load component with progress tracking
	const loadComponent = useCallback(async () => {
		const { flowType, onLoadStart, onLoadComplete, onLoadError } = config;

		try {
			setState((prev) => ({
				...prev,
				isLoading: true,
				error: null,
				progress: 0,
			}));

			startTimeRef.current = Date.now();
			startProgressSimulation();

			onLoadStart?.();

			const component = await lazyLoadingManager.loadOAuthFlow(flowType);

			const loadTime = Date.now() - startTimeRef.current;
			lazyLoadingMetrics.recordLoadTime(flowType, loadTime);

			stopProgressSimulation();

			setState((prev) => ({
				...prev,
				isLoading: false,
				progress: 100,
				component,
				loadTime,
			}));

			onLoadComplete?.(component);

			logger.info(`[useLazyLoading] Successfully loaded ${flowType} in ${loadTime}ms`);
		} catch (error) {
			const loadTime = Date.now() - startTimeRef.current;
			lazyLoadingMetrics.recordError(flowType);

			stopProgressSimulation();

			const errorObj = error as Error;

			setState((prev) => ({
				...prev,
				isLoading: false,
				error: errorObj,
				progress: 0,
				loadTime,
			}));

			onLoadError?.(errorObj);

			logger.error(`[useLazyLoading] Failed to load ${flowType}:`, error);
		}
	}, [config, startProgressSimulation, stopProgressSimulation]);

	// Retry loading
	const retry = useCallback(() => {
		const { maxRetries = 3, retryDelay = 1000 } = config;

		if (retryCountRef.current < maxRetries) {
			retryCountRef.current += 1;

			setTimeout(() => {
				loadComponent();
			}, retryDelay);
		} else {
			logger.warn(`[useLazyLoading] Max retries (${maxRetries}) reached for ${config.flowType}`);
		}
	}, [config, loadComponent]);

	// Preload component
	const preload = useCallback(async () => {
		const { flowType } = config;

		try {
			await lazyLoadingManager.loadOAuthFlow(flowType);
			logger.info(`[useLazyLoading] Preloaded ${flowType}`);
		} catch (error) {
			logger.warn(`[useLazyLoading] Preload failed for ${flowType}:`, error);
		}
	}, [config]);

	// Initialize loading
	useEffect(() => {
		const { preload: shouldPreload, retryOnError } = config;

		if (shouldPreload) {
			preload();
		} else {
			loadComponent();
		}

		// Cleanup on unmount
		return () => {
			stopProgressSimulation();
		};
	}, [config.flowType, preload, loadComponent, stopProgressSimulation]);

	// Auto-retry on error
	useEffect(() => {
		if (state.error && config.retryOnError) {
			retry();
		}
	}, [state.error, config.retryOnError, retry]);

	// Reset retry count when flow type changes
	useEffect(() => {
		retryCountRef.current = 0;
	}, [config.flowType]);

	return {
		...state,
		retry,
		preload,
		loadComponent,
	};
};

// Hook for preloading multiple flows
export const usePreloadFlows = (flowTypes: string[]) => {
	const [preloadedFlows, setPreloadedFlows] = useState<Set<string>>(new Set());
	const [isPreloading, setIsPreloading] = useState(false);
	const [preloadError, setPreloadError] = useState<Error | null>(null);

	const preloadFlows = useCallback(async () => {
		setIsPreloading(true);
		setPreloadError(null);

		try {
			await lazyLoadingManager.preloadOAuthFlows(flowTypes);
			setPreloadedFlows(new Set(flowTypes));
			logger.info(`[usePreloadFlows] Preloaded ${flowTypes.length} flows`);
		} catch (error) {
			setPreloadError(error as Error);
			logger.error('[usePreloadFlows] Preload failed:', error);
		} finally {
			setIsPreloading(false);
		}
	}, [flowTypes]);

	useEffect(() => {
		preloadFlows();
	}, [preloadFlows]);

	return {
		preloadedFlows,
		isPreloading,
		preloadError,
		preloadFlows,
	};
};

// Hook for lazy loading with Suspense
export const useLazyComponent = (flowType: string) => {
	const [component, setComponent] = useState<React.ComponentType<any> | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);

	useEffect(() => {
		let isMounted = true;

		const loadComponent = async () => {
			try {
				setIsLoading(true);
				setError(null);

				const loadedComponent = await lazyLoadingManager.loadOAuthFlow(flowType);

				if (isMounted) {
					setComponent(() => loadedComponent);
					setIsLoading(false);
				}
			} catch (err) {
				if (isMounted) {
					setError(err as Error);
					setIsLoading(false);
				}
			}
		};

		loadComponent();

		return () => {
			isMounted = false;
		};
	}, [flowType]);

	return { component, isLoading, error };
};

// Hook for performance monitoring
export const useLazyLoadingMetrics = () => {
	const [metrics, setMetrics] = useState({
		loadedComponents: 0,
		loadingComponents: 0,
		averageLoadTime: 0,
		totalErrors: 0,
	});

	const updateMetrics = useCallback(() => {
		setMetrics({
			loadedComponents: lazyLoadingManager.getLoadedComponentCount(),
			loadingComponents: lazyLoadingManager.getLoadingComponentCount(),
			averageLoadTime: lazyLoadingMetrics.getAverageLoadTime(),
			totalErrors: lazyLoadingMetrics.getTotalErrors(),
		});
	}, []);

	useEffect(() => {
		updateMetrics();

		const interval = setInterval(updateMetrics, 1000);
		return () => clearInterval(interval);
	}, [updateMetrics]);

	return {
		...metrics,
		updateMetrics,
		clearMetrics: lazyLoadingMetrics.clearMetrics,
	};
};

export default useLazyLoading;
