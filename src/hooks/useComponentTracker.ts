import { useEffect, useRef, useState } from 'react';

// Type declaration for performance memory API
interface PerformanceMemory {
	usedJSHeapSize: number;
	totalJSHeapSize: number;
	jsHeapSizeLimit: number;
}

interface ExtendedPerformance extends Performance {
	memory?: PerformanceMemory;
}

interface ComponentMetrics {
	name: string;
	mountTime: number;
	renderCount: number;
	propCount: number;
	lastRender: number;
	memoryUsage?: number;
	reRenderReason?: string;
}

interface GlobalComponentRegistry {
	components: Map<string, ComponentMetrics>;
	history: Array<{
		timestamp: number;
		componentCount: number;
		totalRenders: number;
		memoryUsage?: number;
	}>;
}

// Global registry for tracking all components
const globalRegistry: GlobalComponentRegistry = {
	components: new Map(),
	history: [],
};

/**
 * Hook to track component usage and performance metrics
 * @param componentName - Name of the component being tracked
 * @returns Current component metrics
 */
export const useComponentTracker = (componentName: string) => {
	const renderCountRef = useRef(0);
	const mountTimeRef = useRef(Date.now());
	const lastPropsRef = useRef<Record<string, unknown>>({});
	const [metrics, setMetrics] = useState<ComponentMetrics>({
		name: componentName,
		mountTime: mountTimeRef.current,
		renderCount: 0,
		propCount: 0,
		lastRender: Date.now(),
	});

	useEffect(() => {
		renderCountRef.current += 1;

		// Get current props (this is a rough approximation)
		const currentProps: Record<string, unknown> = {};
		const propCount = Object.keys(currentProps).length;

		// Detect re-render reason by comparing props
		let reRenderReason = 'mount';
		if (renderCountRef.current > 1) {
			const prevProps = lastPropsRef.current;
			const changedProps = Object.keys(currentProps).filter(
				(key) => prevProps[key] !== currentProps[key]
			);

			if (changedProps.length > 0) {
				reRenderReason = `props changed: ${changedProps.join(', ')}`;
			} else {
				reRenderReason = 'state/parent update';
			}
		}

		lastPropsRef.current = { ...currentProps };

		const memoryUsage = (performance as ExtendedPerformance).memory?.usedJSHeapSize;

		const newMetrics: ComponentMetrics = {
			name: componentName,
			mountTime: mountTimeRef.current,
			renderCount: renderCountRef.current,
			propCount,
			lastRender: Date.now(),
			...(memoryUsage && { memoryUsage }),
			reRenderReason,
		};

		setMetrics(newMetrics);

		// Update global registry
		globalRegistry.components.set(componentName, newMetrics);

		// Add to history (limit to last 50 entries)
		if (
			globalRegistry.history.length === 0 ||
			Date.now() - globalRegistry.history[globalRegistry.history.length - 1].timestamp > 1000
		) {
			const memoryUsage = (performance as ExtendedPerformance).memory?.usedJSHeapSize;

			const historyEntry = {
				timestamp: Date.now(),
				componentCount: globalRegistry.components.size,
				totalRenders: Array.from(globalRegistry.components.values()).reduce(
					(sum, comp) => sum + comp.renderCount,
					0
				),
				...(memoryUsage && { memoryUsage }),
			};

			globalRegistry.history.push(historyEntry);

			if (globalRegistry.history.length > 50) {
				globalRegistry.history.shift();
			}
		}

		// Cleanup on unmount
		return () => {
			globalRegistry.components.delete(componentName);
		};
	}, [componentName]);

	return metrics;
};

/**
 * Get global component metrics
 */
export const getGlobalComponentMetrics = (): ComponentMetrics[] => {
	return Array.from(globalRegistry.components.values());
};

/**
 * Get component history
 */
export const getComponentHistory = () => {
	return globalRegistry.history;
};

/**
 * Generate cleanliness report
 */
export const generateCleanlinessReport = () => {
	const components = Array.from(globalRegistry.components.values());
	const history = globalRegistry.history;

	if (components.length === 0) {
		return {
			totalComponents: 0,
			totalRenders: 0,
			averageRendersPerComponent: 0,
			highestRenderCount: 0,
			memoryUsage: 0,
			recommendations: ['No components tracked yet'],
		};
	}

	const totalRenders = components.reduce((sum, comp) => sum + comp.renderCount, 0);
	const averageRenders = totalRenders / components.length;
	const highestRenderCount = Math.max(...components.map((comp) => comp.renderCount));
	const currentMemoryUsage = performance.memory?.usedJSHeapSize || 0;

	// Generate recommendations
	const recommendations: string[] = [];

	// Check for excessive re-renders
	const highRenderComponents = components.filter((comp) => comp.renderCount > 50);
	if (highRenderComponents.length > 0) {
		recommendations.push(
			`${highRenderComponents.length} components re-rendering excessively (>50 times): ${highRenderComponents.map((c) => c.name).join(', ')}`
		);
	}

	// Check for components with many props
	const complexComponents = components.filter((comp) => comp.propCount > 10);
	if (complexComponents.length > 0) {
		recommendations.push(
			`${complexComponents.length} components have many props (>10): ${complexComponents.map((c) => c.name).join(', ')}`
		);
	}

	// Check memory usage
	if (currentMemoryUsage > 100 * 1024 * 1024) {
		// 100MB
		recommendations.push('High memory usage detected - consider memory optimization');
	}

	// Check for components that mounted recently but already have many renders
	const recentlyMounted = components.filter(
		(comp) => Date.now() - comp.mountTime < 30000 && comp.renderCount > 10
	);
	if (recentlyMounted.length > 0) {
		recommendations.push(
			`${recentlyMounted.length} components re-rendering frequently after mount: ${recentlyMounted.map((c) => c.name).join(', ')}`
		);
	}

	return {
		totalComponents: components.length,
		totalRenders,
		averageRendersPerComponent: Math.round(averageRenders * 100) / 100,
		highestRenderCount,
		memoryUsage: currentMemoryUsage,
		recommendations,
		components: components.sort((a, b) => b.renderCount - a.renderCount).slice(0, 10), // Top 10
		history: history.slice(-20), // Last 20 history entries
	};
};

/**
 * Reset all tracking data
 */
export const resetComponentTracking = () => {
	globalRegistry.components.clear();
	globalRegistry.history = [];
};

// Make global registry available for debugging
if (typeof window !== 'undefined') {
	(window as unknown as { componentTracker: unknown }).componentTracker = {
		getMetrics: getGlobalComponentMetrics,
		getHistory: getComponentHistory,
		generateReport: generateCleanlinessReport,
		reset: resetComponentTracking,
	};
}

// Type declarations for global window object
declare global {
	interface Window {
		componentTracker?: {
			getMetrics: () => ComponentMetrics[];
			getHistory: () => typeof globalRegistry.history;
			generateReport: () => ReturnType<typeof generateCleanlinessReport>;
			reset: () => void;
		};
	}
}
