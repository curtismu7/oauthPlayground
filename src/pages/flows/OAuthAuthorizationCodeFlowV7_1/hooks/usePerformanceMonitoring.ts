// src/pages/flows/OAuthAuthorizationCodeFlowV7_1/hooks/usePerformanceMonitoring.ts
// V7.1 Performance Monitoring - Performance tracking and optimization

import { useCallback, useEffect, useRef, useState } from 'react';

interface PerformanceMetrics {
	componentName: string;
	mountTime: number;
	renderCount: number;
	lastRenderTime: number;
	averageRenderTime: number;
	slowRenders: number;
	errors: number;
}

interface PerformanceThresholds {
	slowRenderThreshold: number; // ms
	errorThreshold: number;
	renderCountThreshold: number;
}

const DEFAULT_THRESHOLDS: PerformanceThresholds = {
	slowRenderThreshold: 16, // 60fps threshold
	errorThreshold: 5,
	renderCountThreshold: 100,
};

export const usePerformanceMonitoring = (
	componentName: string,
	thresholds: Partial<PerformanceThresholds> = {}
) => {
	const [metrics, setMetrics] = useState<PerformanceMetrics>({
		componentName,
		mountTime: 0,
		renderCount: 0,
		lastRenderTime: 0,
		averageRenderTime: 0,
		slowRenders: 0,
		errors: 0,
	});

	const renderStartTime = useRef<number>(0);
	const mountTime = useRef<number>(0);
	const renderTimes = useRef<number[]>([]);
	const errorCount = useRef<number>(0);
	const renderCount = useRef<number>(0);

	const finalThresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };

	// Start render timing
	const startRender = useCallback(() => {
		renderStartTime.current = performance.now();
	}, []);

	// End render timing
	const endRender = useCallback(() => {
		const renderTime = performance.now() - renderStartTime.current;
		renderTimes.current.push(renderTime);
		renderCount.current += 1;

		// Calculate average render time
		const averageRenderTime =
			renderTimes.current.reduce((sum, time) => sum + time, 0) / renderTimes.current.length;

		// Check for slow renders
		const slowRenders = renderTimes.current.filter(
			(time) => time > finalThresholds.slowRenderThreshold
		).length;

		setMetrics((prev) => ({
			...prev,
			renderCount: renderCount.current,
			lastRenderTime: renderTime,
			averageRenderTime,
			slowRenders,
			errors: errorCount.current,
		}));

		// Log slow renders
		if (renderTime > finalThresholds.slowRenderThreshold) {
			console.warn(`[Performance] ${componentName} slow render: ${renderTime.toFixed(2)}ms`);
		}

		// Log performance warnings
		if (renderCount.current > finalThresholds.renderCountThreshold) {
			console.warn(`[Performance] ${componentName} high render count: ${renderCount.current}`);
		}

		if (errorCount.current > finalThresholds.errorThreshold) {
			console.warn(`[Performance] ${componentName} high error count: ${errorCount.current}`);
		}
	}, [componentName, finalThresholds]);

	// Record error
	const recordError = useCallback(
		(error: Error) => {
			errorCount.current += 1;
			setMetrics((prev) => ({
				...prev,
				errors: errorCount.current,
			}));

			console.error(`[Performance] ${componentName} error recorded:`, error);
		},
		[componentName]
	);

	// Get performance report
	const getPerformanceReport = useCallback(() => {
		const report = {
			...metrics,
			mountTime: mountTime.current,
			renderTimes: renderTimes.current,
			performanceScore: calculatePerformanceScore(metrics, finalThresholds),
			recommendations: getPerformanceRecommendations(metrics, finalThresholds),
		};

		return report;
	}, [metrics, finalThresholds, calculatePerformanceScore, getPerformanceRecommendations]);

	// Calculate performance score (0-100)
	const calculatePerformanceScore = useCallback(
		(metrics: PerformanceMetrics, thresholds: PerformanceThresholds) => {
			let score = 100;

			// Deduct points for slow renders
			const slowRenderPenalty = Math.min(metrics.slowRenders * 5, 30);
			score -= slowRenderPenalty;

			// Deduct points for high render count
			if (metrics.renderCount > thresholds.renderCountThreshold) {
				const renderCountPenalty = Math.min(
					(metrics.renderCount - thresholds.renderCountThreshold) * 0.5,
					20
				);
				score -= renderCountPenalty;
			}

			// Deduct points for errors
			const errorPenalty = Math.min(metrics.errors * 10, 40);
			score -= errorPenalty;

			// Deduct points for high average render time
			if (metrics.averageRenderTime > thresholds.slowRenderThreshold) {
				const renderTimePenalty = Math.min(
					(metrics.averageRenderTime - thresholds.slowRenderThreshold) * 2,
					20
				);
				score -= renderTimePenalty;
			}

			return Math.max(0, Math.round(score));
		},
		[]
	);

	// Get performance recommendations
	const getPerformanceRecommendations = useCallback(
		(metrics: PerformanceMetrics, thresholds: PerformanceThresholds) => {
			const recommendations: string[] = [];

			if (metrics.slowRenders > 0) {
				recommendations.push('Consider optimizing render performance with React.memo or useMemo');
			}

			if (metrics.renderCount > thresholds.renderCountThreshold) {
				recommendations.push('High render count detected - check for unnecessary re-renders');
			}

			if (metrics.errors > thresholds.errorThreshold) {
				recommendations.push('High error count - review error handling and validation');
			}

			if (metrics.averageRenderTime > thresholds.slowRenderThreshold) {
				recommendations.push(
					'Average render time is high - consider code splitting or lazy loading'
				);
			}

			if (recommendations.length === 0) {
				recommendations.push('Performance looks good!');
			}

			return recommendations;
		},
		[]
	);

	// Log performance report
	const logPerformanceReport = useCallback(() => {
		const report = getPerformanceReport();
		console.log(`[Performance] ${componentName} Report:`, report);
		return report;
	}, [componentName, getPerformanceReport]);

	// Reset metrics
	const resetMetrics = useCallback(() => {
		renderTimes.current = [];
		errorCount.current = 0;
		renderCount.current = 0;
		mountTime.current = performance.now();

		setMetrics({
			componentName,
			mountTime: mountTime.current,
			renderCount: 0,
			lastRenderTime: 0,
			averageRenderTime: 0,
			slowRenders: 0,
			errors: 0,
		});
	}, [componentName]);

	// Component mount tracking
	useEffect(() => {
		mountTime.current = performance.now();
		setMetrics((prev) => ({
			...prev,
			mountTime: mountTime.current,
		}));

		console.log(`[Performance] ${componentName} mounted at ${mountTime.current.toFixed(2)}ms`);

		return () => {
			const unmountTime = performance.now();
			const totalTime = unmountTime - mountTime.current;
			console.log(`[Performance] ${componentName} unmounted after ${totalTime.toFixed(2)}ms`);
		};
	}, [componentName]);

	// Auto-log performance report on unmount
	useEffect(() => {
		return () => {
			if (renderCount.current > 0) {
				logPerformanceReport();
			}
		};
	}, [logPerformanceReport]);

	return {
		// Metrics
		metrics,

		// Actions
		startRender,
		endRender,
		recordError,
		resetMetrics,

		// Utilities
		getPerformanceReport,
		logPerformanceReport,
		calculatePerformanceScore,
		getPerformanceRecommendations,
	};
};

// Hook for measuring specific operations
export const useOperationTiming = (operationName: string) => {
	const [timings, setTimings] = useState<number[]>([]);
	const startTime = useRef<number>(0);

	const startOperation = useCallback(() => {
		startTime.current = performance.now();
	}, []);

	const endOperation = useCallback(() => {
		const duration = performance.now() - startTime.current;
		setTimings((prev) => [...prev, duration]);

		if (duration > 100) {
			// Log operations taking more than 100ms
			console.warn(`[Performance] ${operationName} took ${duration.toFixed(2)}ms`);
		}

		return duration;
	}, [operationName]);

	const getAverageTime = useCallback(() => {
		if (timings.length === 0) return 0;
		return timings.reduce((sum, time) => sum + time, 0) / timings.length;
	}, [timings]);

	const getMaxTime = useCallback(() => {
		return timings.length > 0 ? Math.max(...timings) : 0;
	}, [timings]);

	const getMinTime = useCallback(() => {
		return timings.length > 0 ? Math.min(...timings) : 0;
	}, [timings]);

	const resetTimings = useCallback(() => {
		setTimings([]);
	}, []);

	return {
		timings,
		startOperation,
		endOperation,
		getAverageTime,
		getMaxTime,
		getMinTime,
		resetTimings,
	};
};

export default usePerformanceMonitoring;
