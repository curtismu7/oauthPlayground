import React from 'react';

/**
 * @file componentTracker.ts
 * @description Component performance tracking utility for Cleanliness Dashboard
 * @version 1.0.0
 */

interface ComponentMetric {
	name: string;
	renderCount: number;
	propCount: number;
	lastRender: number;
	renderTimes: number[];
	averageRenderTime: number;
}

interface ComponentTracker {
	components: Map<string, ComponentMetric>;
	trackRender: (componentName: string, propCount?: number, renderTime?: number) => void;
	getMetrics: () => ComponentMetric[];
	generateReport: () => {
		totalComponents: number;
		totalRenders: number;
		averageRendersPerComponent: number;
		memoryUsage: number;
	};
	reset: () => void;
}

// Create a simple component tracker implementation
const createComponentTracker = (): ComponentTracker => {
	const components = new Map<string, ComponentMetric>();

	const trackRender = (componentName: string, propCount = 0, renderTime = 0) => {
		const existing = components.get(componentName);
		const now = Date.now();

		if (existing) {
			existing.renderCount++;
			existing.propCount = propCount;
			existing.lastRender = now;
			existing.renderTimes.push(renderTime);

			// Keep only last 10 render times for average calculation
			if (existing.renderTimes.length > 10) {
				existing.renderTimes.shift();
			}

			existing.averageRenderTime =
				existing.renderTimes.reduce((a, b) => a + b, 0) / existing.renderTimes.length;
		} else {
			components.set(componentName, {
				name: componentName,
				renderCount: 1,
				propCount,
				lastRender: now,
				renderTimes: [renderTime],
				averageRenderTime: renderTime,
			});
		}
	};

	const getMetrics = (): ComponentMetric[] => {
		return Array.from(components.values()).sort((a, b) => b.renderCount - a.renderCount);
	};

	const generateReport = () => {
		const metrics = getMetrics();
		const totalRenders = metrics.reduce((sum, comp) => sum + comp.renderCount, 0);
		const averageRenders = metrics.length > 0 ? totalRenders / metrics.length : 0;

		// Use performance.memory when available (Chrome); else fallback estimate
		const perf =
			typeof performance !== 'undefined'
				? (performance as { memory?: { usedJSHeapSize: number } })
				: undefined;
		const memoryUsage = perf?.memory?.usedJSHeapSize ?? metrics.length * 1024 * 1024;

		return {
			totalComponents: metrics.length,
			totalRenders,
			averageRendersPerComponent: averageRenders,
			memoryUsage,
		};
	};

	const reset = () => {
		components.clear();
	};

	return {
		components,
		trackRender,
		getMetrics,
		generateReport,
		reset,
	};
};

// Initialize global tracker
let globalTracker: ComponentTracker | null = null;

export const getComponentTracker = (): ComponentTracker => {
	if (!globalTracker) {
		globalTracker = createComponentTracker();

		// Make it available globally for the dashboard
		if (typeof window !== 'undefined') {
			(window as any).componentTracker = globalTracker;
		}
	}
	return globalTracker;
};

// React hook for tracking component renders
export const useComponentTracker = (componentName: string, propCount?: number) => {
	const tracker = getComponentTracker();

	// Track render on component mount/update
	const startTime = Date.now();

	React.useEffect(() => {
		const renderTime = Date.now() - startTime;
		tracker.trackRender(componentName, propCount, renderTime);
	});
};

// Initialize some mock data for demonstration
export const initializeMockData = () => {
	const tracker = getComponentTracker();

	// Simulate some component renders
	const mockComponents = [
		// V9 Apps & Services
		{ name: 'AuthorizationCodeFlowV9', renders: 15, props: 12 },
		{ name: 'ImplicitFlowV9', renders: 12, props: 10 },
		{ name: 'DeviceAuthorizationFlowV9', renders: 8, props: 8 },
		{ name: 'ClientCredentialsFlowV9', renders: 6, props: 6 },
		{ name: 'HybridFlowV9', renders: 4, props: 9 },
		{ name: 'DPoPAuthorizationCodeV9', renders: 3, props: 7 },
		{ name: 'CIBAFlowV9', renders: 2, props: 11 },
		{ name: 'PARFlowV9', renders: 2, props: 8 },
		{ name: 'RedirectlessFlowV9', renders: 1, props: 5 },
		{ name: 'TokenExchangeV9', renders: 1, props: 6 },

		// V9 Services
		{ name: 'environmentServiceV9', renders: 25, props: 4 },
		{ name: 'apiDisplayServiceV9', renders: 20, props: 6 },
		{ name: 'specVersionServiceV9', renders: 18, props: 3 },
		{ name: 'flowResetServiceV9', renders: 15, props: 5 },
		{ name: 'enhancedCredentialsServiceV9', renders: 12, props: 8 },
		{ name: 'dualStorageServiceV9', renders: 10, props: 4 },
		{ name: 'oauthIntegrationServiceV9', renders: 8, props: 7 },
		{ name: 'unifiedFlowIntegrationV9', renders: 6, props: 9 },
		{ name: 'V8ToV9Adapter', renders: 5, props: 3 },
		{ name: 'MigrationServiceV9', renders: 3, props: 6 },

		// Core Components
		{ name: 'Dashboard', renders: 20, props: 8 },
		{ name: 'OAuthFlow', renders: 18, props: 12 },
		{ name: 'TokenStatusPage', renders: 12, props: 6 },
		{ name: 'MFADeviceManager', renders: 10, props: 10 },
		{ name: 'ProtectPortal', renders: 8, props: 5 },
		{ name: 'ApiStatusPage', renders: 6, props: 4 },
		{ name: 'UserProfile', renders: 4, props: 3 },
		{ name: 'SettingsModal', renders: 3, props: 7 },
	];

	mockComponents.forEach((comp) => {
		for (let i = 0; i < comp.renders; i++) {
			tracker.trackRender(comp.name, comp.props, Math.random() * 50 + 10); // Random render time 10-60ms
		}
	});
};

export default getComponentTracker;
