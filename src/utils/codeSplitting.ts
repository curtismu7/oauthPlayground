// src/utils/codeSplitting.ts
// Code splitting utilities for lazy loading OAuth flows

import { logger } from './logger';

// Lazy loading metrics interface
export interface LazyLoadingMetrics {
	recordLoadTime: (flowType: string, loadTime: number) => void;
	recordError: (flowType: string) => void;
	getAverageLoadTime: () => number;
	getTotalErrors: () => number;
	clearMetrics: () => void;
}

// Lazy loading manager interface
export interface LazyLoadingManager {
	loadOAuthFlow: (flowType: string) => Promise<React.ComponentType<any>>;
	preloadOAuthFlows: (flowTypes: string[]) => Promise<void>;
	getLoadedComponentCount: () => number;
	getLoadingComponentCount: () => number;
}

// Metrics storage
class MetricsStorage {
	private loadTimes: Map<string, number[]> = new Map();
	private errors: Map<string, number> = new Map();
	private totalErrors = 0;

	recordLoadTime(flowType: string, loadTime: number): void {
		if (!this.loadTimes.has(flowType)) {
			this.loadTimes.set(flowType, []);
		}
		this.loadTimes.get(flowType)!.push(loadTime);
		this.totalLoads++;
	}

	recordError(flowType: string): void {
		const currentErrors = this.errors.get(flowType) || 0;
		this.errors.set(flowType, currentErrors + 1);
		this.totalErrors++;
	}

	getAverageLoadTime(): number {
		const allLoadTimes: number[] = [];
		this.loadTimes.forEach((times) => {
			allLoadTimes.push(...times);
		});

		if (allLoadTimes.length === 0) return 0;

		const sum = allLoadTimes.reduce((acc, time) => acc + time, 0);
		return sum / allLoadTimes.length;
	}

	getTotalErrors(): number {
		return this.totalErrors;
	}

	clearMetrics(): void {
		this.loadTimes.clear();
		this.errors.clear();
		this.totalLoads = 0;
		this.totalErrors = 0;
	}
}

// Lazy loading manager implementation
class LazyLoadingManagerImpl implements LazyLoadingManager {
	private loadedComponents = new Map<string, React.ComponentType<any>>();
	private loadingComponents = new Set<string>();

	async loadOAuthFlow(flowType: string): Promise<React.ComponentType<any>> {
		// Check if already loaded
		if (this.loadedComponents.has(flowType)) {
			return this.loadedComponents.get(flowType)!;
		}

		// Check if currently loading
		if (this.loadingComponents.has(flowType)) {
			// Wait for loading to complete
			return new Promise((resolve, reject) => {
				const checkLoaded = () => {
					if (this.loadedComponents.has(flowType)) {
						resolve(this.loadedComponents.get(flowType)!);
					} else if (!this.loadingComponents.has(flowType)) {
						reject(new Error(`Failed to load ${flowType}`));
					} else {
						setTimeout(checkLoaded, 100);
					}
				};
				checkLoaded();
			});
		}

		this.loadingComponents.add(flowType);

		try {
			logger.info(`[LazyLoadingManager] Loading OAuth flow: ${flowType}`);

			// Dynamic import based on flow type
			let component: React.ComponentType<any>;

			switch (flowType) {
				case 'device-authorization': {
					const { default: DeviceAuthFlow } = await import(
						'../pages/flows/DeviceAuthorizationFlowV7'
					);
					component = DeviceAuthFlow;
					break;
				}
				case 'authorization-code': {
					const { default: AuthCodeFlow } = await import(
						'../pages/flows/OAuthAuthorizationCodeFlowV7'
					);
					component = AuthCodeFlow;
					break;
				}
				case 'implicit': {
					const { default: ImplicitFlow } = await import('../pages/flows/ImplicitFlowV7');
					component = ImplicitFlow;
					break;
				}
				case 'client-credentials': {
					const { default: ClientCredentialsFlow } = await import(
						'../pages/flows/ClientCredentialsFlowV7'
					);
					component = ClientCredentialsFlow;
					break;
				}
				case 'ropc': {
					const { default: ROPCFlow } = await import('../pages/flows/OAuthROPCFlowV7');
					component = ROPCFlow;
					break;
				}
				case 'hybrid': {
					const { default: HybridFlow } = await import('../pages/flows/OIDCHybridFlowV7');
					component = HybridFlow;
					break;
				}
				default:
					throw new Error(`Unknown flow type: ${flowType}`);
			}

			this.loadedComponents.set(flowType, component);
			this.loadingComponents.delete(flowType);

			logger.info(`[LazyLoadingManager] Successfully loaded ${flowType}`);
			return component;
		} catch (error) {
			this.loadingComponents.delete(flowType);
			logger.error(`[LazyLoadingManager] Failed to load ${flowType}:`, error);
			throw error;
		}
	}

	async preloadOAuthFlows(flowTypes: string[]): Promise<void> {
		const loadPromises = flowTypes.map((flowType) =>
			this.loadOAuthFlow(flowType).catch((error) => {
				logger.warn(`[LazyLoadingManager] Preload failed for ${flowType}:`, error);
				return null;
			})
		);

		await Promise.all(loadPromises);
		logger.info(`[LazyLoadingManager] Preloaded ${flowTypes.length} flows`);
	}

	getLoadedComponentCount(): number {
		return this.loadedComponents.size;
	}

	getLoadingComponentCount(): number {
		return this.loadingComponents.size;
	}
}

// Create instances
const metricsStorage = new MetricsStorage();
const lazyLoadingManager = new LazyLoadingManagerImpl();

// Export the metrics interface
export const lazyLoadingMetrics: LazyLoadingMetrics = {
	recordLoadTime: (flowType: string, loadTime: number) => {
		metricsStorage.recordLoadTime(flowType, loadTime);
	},
	recordError: (flowType: string) => {
		metricsStorage.recordError(flowType);
	},
	getAverageLoadTime: () => {
		return metricsStorage.getAverageLoadTime();
	},
	getTotalErrors: () => {
		return metricsStorage.getTotalErrors();
	},
	clearMetrics: () => {
		metricsStorage.clearMetrics();
	},
};

// Export the manager
export { lazyLoadingManager };

// Export default
export default {
	lazyLoadingManager,
	lazyLoadingMetrics,
};
