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
	loadOAuthFlow: (flowType: string) => Promise<React.ComponentType<unknown>>;
	preloadOAuthFlows: (flowTypes: string[]) => Promise<void>;
	getLoadedComponentCount: () => number;
	getLoadingComponentCount: () => number;
}

// Simple stub implementation
class StubMetrics implements LazyLoadingMetrics {
	recordLoadTime(flowType: string, loadTime: number): void {
		logger.debug(`Load time recorded for ${flowType}: ${loadTime}ms`);
	}

	recordError(flowType: string): void {
		logger.error(`Error recorded for ${flowType}`);
	}

	getAverageLoadTime(): number {
		return 0;
	}

	getTotalErrors(): number {
		return 0;
	}

	clearMetrics(): void {
		// Stub implementation
	}
}

class StubManager implements LazyLoadingManager {
	async loadOAuthFlow(flowType: string): Promise<React.ComponentType<unknown>> {
		logger.debug(`Loading OAuth flow: ${flowType}`);
		// Return a simple stub component
		return () => null;
	}

	async preloadOAuthFlows(flowTypes: string[]): Promise<void> {
		logger.debug(`Preloading OAuth flows: ${flowTypes.join(', ')}`);
	}

	getLoadedComponentCount(): number {
		return 0;
	}

	getLoadingComponentCount(): number {
		return 0;
	}
}

// Export stub instances
export const lazyLoadingMetrics = new StubMetrics();
export const lazyLoadingManager = new StubManager();
