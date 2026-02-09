/**
 * @file useWorkerTokenConfig.ts
 * @module v8/hooks
 * @description React hook for accessing worker token configuration
 * @version 8.2.0
 * @since 2026-02-01
 *
 * Purpose: Provides React components with reactive access to worker token configuration
 * Automatically updates when configuration changes
 */

import { useEffect, useState } from 'react';
import {
	type WorkerTokenConfig,
	WorkerTokenConfigServiceV8,
} from '@/v8/services/workerTokenConfigServiceV8';

export interface UseWorkerTokenConfigResult extends WorkerTokenConfig {
	isReady: boolean;
}

/**
 * React hook that provides reactive access to worker token configuration
 * Automatically subscribes to configuration changes and updates component
 *
 * @returns Current worker token configuration with loading state
 *
 * @example
 * ```tsx
 * const { silentApiRetrieval, showTokenAtEnd, isReady } = useWorkerTokenConfig();
 *
 * if (!isReady) {
 *   return <div>Loading configuration...</div>;
 * }
 *
 * return (
 *   <div>
 *     Silent API Retrieval: {silentApiRetrieval ? 'ON' : 'OFF'}
 *     Show Token At End: {showTokenAtEnd ? 'ON' : 'OFF'}
 *   </div>
 * );
 * ```
 */
export function useWorkerTokenConfig(): UseWorkerTokenConfigResult {
	const [config, setConfig] = useState<WorkerTokenConfig>(() => {
		// Initialize with current config
		return WorkerTokenConfigServiceV8.getConfigSync();
	});
	const [isReady, setIsReady] = useState(true);

	useEffect(() => {
		// Subscribe to config changes
		const unsubscribe = WorkerTokenConfigServiceV8.subscribe((newConfig) => {
			setConfig(newConfig);
			setIsReady(true);
		});

		// Cleanup subscription on unmount
		return unsubscribe;
	}, []);

	return {
		...config,
		isReady,
	};
}
