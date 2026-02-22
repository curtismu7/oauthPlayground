/**
 * @file useUniversalSilentApi.ts
 * @module hooks
 * @description React hook for Universal Silent API and Show Token functionality
 * @version 1.0.0
 * @since 2026-02-20
 *
 * Purpose: Provide easy integration with UniversalSilentApiService for React components
 * Handles state management, event listeners, and automatic updates
 */

import { useCallback, useEffect, useState } from 'react';
import type {
	SilentApiResult,
	UniversalSilentApiConfig,
	UniversalSilentApiService,
} from '@/services/universalSilentApiService';

const MODULE_TAG = '[🔕 USE-UNIVERSAL-SILENT-API]';

export interface UseUniversalSilentApiOptions {
	appId?: string;
	appName?: string;
	appVersion?: string;
	storageKey?: string;
	autoSync?: boolean;
}

export interface UseUniversalSilentApiReturn {
	// Configuration state
	config: UniversalSilentApiConfig;
	isLoading: boolean;
	error: string | null;

	// Actions
	updateConfig: (updates: Partial<UniversalSilentApiConfig>) => void;
	toggleSilentApi: () => void;
	toggleShowTokenAtEnd: () => void;
	resetConfig: () => void;

	// Silent API execution
	executeSilentApi: () => Promise<SilentApiResult>;
	getWorkerToken: (options?: { forceSilent?: boolean; forceModal?: boolean }) => Promise<{
		token?: string;
		showModal: boolean;
		error?: string;
	}>;

	// Status checks
	isSilentApiEnabled: () => boolean;
	isShowTokenAtEndEnabled: () => boolean;
	getStatus: () => {
		appId: string;
		config: UniversalSilentApiConfig;
		storageKey: string;
		hasStoredConfig: boolean;
	};
}

/**
 * React hook for Universal Silent API functionality
 *
 * @param options - Configuration options for the hook
 * @returns Hook interface with state and actions
 */
export function useUniversalSilentApi(
	options: UseUniversalSilentApiOptions = {}
): UseUniversalSilentApiReturn {
	const { appId = 'universal', autoSync = true } = options;

	// Import service dynamically to avoid SSR issues
	const [service, setService] = useState<UniversalSilentApiService | null>(null);
	const [config, setConfig] = useState<UniversalSilentApiConfig>({
		silentApiRetrieval: false,
		showTokenAtEnd: true,
	});
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Initialize service
	useEffect(() => {
		const initService = async () => {
			try {
				const { UniversalSilentApiService } = await import('@/services/universalSilentApiService');

				const serviceInstance = new UniversalSilentApiService({
					appId,
					appName: options.appName || `App ${appId}`,
					appVersion: options.appVersion || '1.0.0',
					...(options.storageKey && { storageKey: options.storageKey }),
				});

				setService(serviceInstance);
				setConfig(serviceInstance.getConfig());
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : String(err);
				console.error(`${MODULE_TAG} Failed to initialize service:`, err);
				setError(`Failed to initialize service: ${errorMessage}`);
			}
		};

		initService();
	}, [appId, options.appName, options.appVersion, options.storageKey]);

	// Listen for configuration updates
	useEffect(() => {
		if (!service || !autoSync) return;

		const cleanup = service.onConfigUpdate((newConfig) => {
			console.log(`${MODULE_TAG} Configuration updated:`, newConfig);
			setConfig(newConfig);
		});

		return cleanup;
	}, [service, autoSync]);

	// Actions
	const updateConfig = useCallback(
		(updates: Partial<UniversalSilentApiConfig>) => {
			if (!service) {
				console.warn(`${MODULE_TAG} Service not initialized, cannot update config`);
				return;
			}

			try {
				const newConfig = service.updateConfig(updates);
				setConfig(newConfig);
				setError(null);
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : String(err);
				console.error(`${MODULE_TAG} Failed to update config:`, err);
				setError(errorMessage);
			}
		},
		[service]
	);

	const toggleSilentApi = useCallback(() => {
		if (!service) return;

		const newConfig = service.toggleSilentApi();
		setConfig(newConfig);
		setError(null);
	}, [service]);

	const toggleShowTokenAtEnd = useCallback(() => {
		if (!service) return;

		const newConfig = service.toggleShowTokenAtEnd();
		setConfig(newConfig);
		setError(null);
	}, [service]);

	const resetConfig = useCallback(() => {
		if (!service) return;

		const newConfig = service.resetConfig();
		setConfig(newConfig);
		setError(null);
	}, [service]);

	// Silent API execution
	const executeSilentApi = useCallback(async (): Promise<SilentApiResult> => {
		if (!service) {
			const error = 'Service not initialized';
			setError(error);
			return {
				success: false,
				error,
				wasSilent: false,
			};
		}

		setIsLoading(true);
		setError(null);

		try {
			const result = await service.executeSilentApi();
			return result;
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : String(err);
			console.error(`${MODULE_TAG} Silent API execution failed:`, err);
			setError(errorMessage);
			return {
				success: false,
				error: errorMessage,
				wasSilent: false,
			};
		} finally {
			setIsLoading(false);
		}
	}, [service]);

	const getWorkerToken = useCallback(
		async (options?: { forceSilent?: boolean; forceModal?: boolean }) => {
			if (!service) {
				const error = 'Service not initialized';
				setError(error);
				return { showModal: true, error };
			}

			setIsLoading(true);
			setError(null);

			try {
				const result = await service.getWorkerToken(options);
				return result;
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : String(err);
				console.error(`${MODULE_TAG} Get worker token failed:`, err);
				setError(errorMessage);
				return { showModal: true, error: errorMessage };
			} finally {
				setIsLoading(false);
			}
		},
		[service]
	);

	// Status checks
	const isSilentApiEnabled = useCallback(() => {
		return service?.isSilentApiEnabled() ?? false;
	}, [service]);

	const isShowTokenAtEndEnabled = useCallback(() => {
		return service?.isShowTokenAtEndEnabled() ?? false;
	}, [service]);

	const getStatus = useCallback(() => {
		if (!service) {
			return {
				appId,
				config,
				storageKey: options.storageKey || `universal_silent_api_${appId}`,
				hasStoredConfig: false,
			};
		}

		return service.getStatus();
	}, [service, appId, config, options.storageKey]);

	return {
		// Configuration state
		config,
		isLoading,
		error,

		// Actions
		updateConfig,
		toggleSilentApi,
		toggleShowTokenAtEnd,
		resetConfig,

		// Silent API execution
		executeSilentApi,
		getWorkerToken,

		// Status checks
		isSilentApiEnabled,
		isShowTokenAtEndEnabled,
		getStatus,
	};
}

/**
 * Convenience hook for V8 app
 */
export function useV8SilentApi() {
	return useUniversalSilentApi({
		appId: 'v8',
		appName: 'OAuth Playground V8',
		appVersion: '8.0.0',
	});
}

/**
 * Convenience hook for V8U app
 */
export function useV8USilentApi() {
	return useUniversalSilentApi({
		appId: 'v8u',
		appName: 'OAuth Playground V8U',
		appVersion: '8.0.0',
	});
}

/**
 * Convenience hook for V8M app
 */
export function useV8MSilentApi() {
	return useUniversalSilentApi({
		appId: 'v8m',
		appName: 'OAuth Playground V8M',
		appVersion: '8.0.0',
	});
}

export default useUniversalSilentApi;
