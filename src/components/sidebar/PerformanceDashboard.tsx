/**
 * PerformanceDashboard - Real-time performance monitoring and analytics
 * Phase 4: Developer Experience
 * 
 * Provides:
 * - Real-time performance metrics
 * - Component render tracking
 * - Memory usage monitoring
 * - User interaction analytics
 * - Performance optimization insights
 */

import React, { createContext, useContext, useCallback, useEffect, useState, ReactNode, useRef } from 'react';
import { FiActivity, FiCpu, FiHardDrive, FiTrendingUp, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

// Performance metrics interfaces
export interface PerformanceMetrics {
	// Render performance
	renderTime: number;
	renderCount: number;
	averageRenderTime: number;
	maxRenderTime: number;
	
	// Memory performance
	memoryUsage: number;
	memoryPeak: number;
	memoryTrend: 'increasing' | 'decreasing' | 'stable';
	
	// Interaction performance
	interactionTime: number;
	interactionCount: number;
	averageInteractionTime: number;
	
	// Search performance
	searchTime: number;
	searchCount: number;
	averageSearchTime: number;
	
	// Overall performance
	performanceScore: number;
	healthStatus: 'excellent' | 'good' | 'warning' | 'critical';
}

export interface ComponentMetrics {
	componentName: string;
	renderCount: number;
	averageRenderTime: number;
	maxRenderTime: number;
	lastRenderTime: number;
	memoryUsage: number;
	isOptimized: boolean;
}

export interface InteractionMetrics {
	type: string;
	duration: number;
	timestamp: number;
	component?: string;
	details?: Record<string, any>;
}

export interface PerformanceAlert {
	id: string;
	type: 'warning' | 'error' | 'info';
	message: string;
	timestamp: number;
	component?: string;
	metric?: string;
	value?: number;
	threshold?: number;
}

export interface PerformanceContextType {
	metrics: PerformanceMetrics;
	componentMetrics: Map<string, ComponentMetrics>;
	interactions: InteractionMetrics[];
	alerts: PerformanceAlert[];
	isMonitoring: boolean;
	
	// Monitoring controls
	startMonitoring: () => void;
	stopMonitoring: () => void;
	resetMetrics: () => void;
	
	// Component tracking
	trackRender: (componentName: string, renderTime: number) => void;
	trackInteraction: (type: string, duration: number, details?: Record<string, any>) => void;
	trackSearch: (duration: number, resultCount: number) => void;
	
	// Analytics
	getComponentMetrics: (componentName: string) => ComponentMetrics | undefined;
	getTopSlowComponents: (limit?: number) => ComponentMetrics[];
	getPerformanceReport: () => string;
	
	// Alerts
	addAlert: (alert: Omit<PerformanceAlert, 'id' | 'timestamp'>) => void;
	clearAlerts: () => void;
}

const PerformanceContext = createContext<PerformanceContextType | undefined>(undefined);

// Performance thresholds
const PERFORMANCE_THRESHOLDS = {
	RENDER_TIME_WARNING: 16, // 60fps
	RENDER_TIME_CRITICAL: 33, // 30fps
	MEMORY_USAGE_WARNING: 50 * 1024 * 1024, // 50MB
	MEMORY_USAGE_CRITICAL: 100 * 1024 * 1024, // 100MB
	INTERACTION_TIME_WARNING: 100, // 100ms
	INTERACTION_TIME_CRITICAL: 300, // 300ms
	SEARCH_TIME_WARNING: 50, // 50ms
	SEARCH_TIME_CRITICAL: 200, // 200ms
} as const;

// Performance monitoring utilities
class PerformanceMonitor {
	private static instance: PerformanceMonitor;
	private observers: PerformanceObserver[] = [];
	private callbacks: Record<string, Function[]> = {};

	static getInstance(): PerformanceMonitor {
		if (!PerformanceMonitor.instance) {
			PerformanceMonitor.instance = new PerformanceMonitor();
		}
		return PerformanceMonitor.instance;
	}

	// Start monitoring render performance
	startRenderMonitoring(callback: (entries: PerformanceEntry[]) => void) {
		if ('PerformanceObserver' in window) {
			const observer = new PerformanceObserver((list) => {
				callback(list.getEntries());
			});
			
			try {
				observer.observe({ entryTypes: ['measure', 'navigation', 'paint'] });
				this.observers.push(observer);
			} catch (error) {
				console.warn('Performance observer not supported:', error);
			}
		}
	}

	// Start monitoring user interactions
	startInteractionMonitoring(callback: (entries: PerformanceEntry[]) => void) {
		if ('PerformanceObserver' in window) {
			const observer = new PerformanceObserver((list) => {
				callback(list.getEntries());
			});
			
			try {
				observer.observe({ entryTypes: ['event', 'first-input'] });
				this.observers.push(observer);
			} catch (error) {
				console.warn('Interaction observer not supported:', error);
			}
		}
	}

	// Get memory usage
	getMemoryUsage(): number {
		if ('memory' in performance) {
			return (performance as any).memory.usedJSHeapSize;
		}
		return 0;
	}

	// Measure function execution time
	measure<T>(name: string, fn: () => T): T {
		const startTime = performance.now();
		const result = fn();
		const endTime = performance.now();
		
		performance.mark(`${name}-start`);
		performance.mark(`${name}-end`);
		performance.measure(name, `${name}-start`, `${name}-end`);
		
		return result;
	}

	// Stop all monitoring
	stopMonitoring() {
		this.observers.forEach(observer => observer.disconnect());
		this.observers = [];
	}
}

interface PerformanceProviderProps {
	children: ReactNode;
	enableMonitoring?: boolean;
	thresholds?: Partial<typeof PERFORMANCE_THRESHOLDS>;
}

export const PerformanceProvider: React.FC<PerformanceProviderProps> = ({
	children,
	enableMonitoring = true,
	thresholds = {},
}) => {
	const [isMonitoring, setIsMonitoring] = useState(false);
	const [metrics, setMetrics] = useState<PerformanceMetrics>({
		renderTime: 0,
		renderCount: 0,
		averageRenderTime: 0,
		maxRenderTime: 0,
		memoryUsage: 0,
		memoryPeak: 0,
		memoryTrend: 'stable',
		interactionTime: 0,
		interactionCount: 0,
		averageInteractionTime: 0,
		searchTime: 0,
		searchCount: 0,
		averageSearchTime: 0,
		performanceScore: 100,
		healthStatus: 'excellent',
	});

	const [componentMetrics, setComponentMetrics] = useState<Map<string, ComponentMetrics>>(new Map());
	const [interactions, setInteractions] = useState<InteractionMetrics[]>([]);
	const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);

	const thresholdsRef = useRef({ ...PERFORMANCE_THRESHOLDS, ...thresholds });
	const monitorRef = useRef<PerformanceMonitor | null>(null);

	// Calculate performance score
	const calculatePerformanceScore = useCallback((currentMetrics: PerformanceMetrics): number => {
		let score = 100;
		
		// Render performance (40% weight)
		if (currentMetrics.averageRenderTime > thresholdsRef.current.RENDER_TIME_CRITICAL) {
			score -= 40;
		} else if (currentMetrics.averageRenderTime > thresholdsRef.current.RENDER_TIME_WARNING) {
			score -= 20;
		}
		
		// Memory usage (30% weight)
		if (currentMetrics.memoryUsage > thresholdsRef.current.MEMORY_USAGE_CRITICAL) {
			score -= 30;
		} else if (currentMetrics.memoryUsage > thresholdsRef.current.MEMORY_USAGE_WARNING) {
			score -= 15;
		}
		
		// Interaction performance (20% weight)
		if (currentMetrics.averageInteractionTime > thresholdsRef.current.INTERACTION_TIME_CRITICAL) {
			score -= 20;
		} else if (currentMetrics.averageInteractionTime > thresholdsRef.current.INTERACTION_TIME_WARNING) {
			score -= 10;
		}
		
		// Search performance (10% weight)
		if (currentMetrics.averageSearchTime > thresholdsRef.current.SEARCH_TIME_CRITICAL) {
			score -= 10;
		} else if (currentMetrics.averageSearchTime > thresholdsRef.current.SEARCH_TIME_WARNING) {
			score -= 5;
		}
		
		return Math.max(0, score);
	}, []);

	// Determine health status
	const getHealthStatus = useCallback((score: number): 'excellent' | 'good' | 'warning' | 'critical' => {
		if (score >= 90) return 'excellent';
		if (score >= 70) return 'good';
		if (score >= 50) return 'warning';
		return 'critical';
	}, []);

	// Update metrics
	const updateMetrics = useCallback(() => {
		if (!monitorRef.current) return;

		const memoryUsage = monitorRef.current.getMemoryUsage();
		const currentMetrics = { ...metrics };

		// Update memory metrics
		currentMetrics.memoryUsage = memoryUsage;
		if (memoryUsage > currentMetrics.memoryPeak) {
			currentMetrics.memoryPeak = memoryUsage;
		}

		// Calculate performance score and health
		currentMetrics.performanceScore = calculatePerformanceScore(currentMetrics);
		currentMetrics.healthStatus = getHealthStatus(currentMetrics.performanceScore);

		setMetrics(currentMetrics);
	}, [metrics, calculatePerformanceScore, getHealthStatus]);

	// Track component render
	const trackRender = useCallback((componentName: string, renderTime: number) => {
		if (!isMonitoring) return;

		setComponentMetrics(prev => {
			const existing = prev.get(componentName);
			const updated: ComponentMetrics = {
				componentName,
				renderCount: (existing?.renderCount || 0) + 1,
				averageRenderTime: existing 
					? (existing.averageRenderTime * existing.renderCount + renderTime) / (existing.renderCount + 1)
					: renderTime,
				maxRenderTime: existing 
					? Math.max(existing.maxRenderTime, renderTime)
					: renderTime,
				lastRenderTime: renderTime,
				memoryUsage: monitorRef.current?.getMemoryUsage() || 0,
				isOptimized: renderTime < thresholdsRef.current.RENDER_TIME_WARNING,
			};

			return new Map(prev).set(componentName, updated);
		});

		// Update global metrics
		setMetrics(prev => {
			const newRenderCount = prev.renderCount + 1;
			const newAverageRenderTime = (prev.averageRenderTime * prev.renderCount + renderTime) / newRenderCount;
			const newMaxRenderTime = Math.max(prev.maxRenderTime, renderTime);

			return {
				...prev,
				renderTime,
				renderCount: newRenderCount,
				averageRenderTime: newAverageRenderTime,
				maxRenderTime: newMaxRenderTime,
			};
		});

		// Check for performance alerts
		if (renderTime > thresholdsRef.current.RENDER_TIME_CRITICAL) {
			addAlert({
				type: 'error',
				message: `Critical render time for ${componentName}: ${renderTime.toFixed(2)}ms`,
				component: componentName,
				metric: 'renderTime',
				value: renderTime,
				threshold: thresholdsRef.current.RENDER_TIME_CRITICAL,
			});
		} else if (renderTime > thresholdsRef.current.RENDER_TIME_WARNING) {
			addAlert({
				type: 'warning',
				message: `Slow render time for ${componentName}: ${renderTime.toFixed(2)}ms`,
				component: componentName,
				metric: 'renderTime',
				value: renderTime,
				threshold: thresholdsRef.current.RENDER_TIME_WARNING,
			});
		}
	}, [isMonitoring]);

	// Track user interaction
	const trackInteraction = useCallback((type: string, duration: number, details?: Record<string, any>) => {
		if (!isMonitoring) return;

		const interaction: InteractionMetrics = {
			type,
			duration,
			timestamp: Date.now(),
			component: details?.component,
			details,
		};

		setInteractions(prev => [...prev.slice(-99), interaction]); // Keep last 100 interactions

		// Update global metrics
		setMetrics(prev => {
			const newInteractionCount = prev.interactionCount + 1;
			const newAverageInteractionTime = (prev.averageInteractionTime * prev.interactionCount + duration) / newInteractionCount;

			return {
				...prev,
				interactionTime: duration,
				interactionCount: newInteractionCount,
				averageInteractionTime: newAverageInteractionTime,
			};
		});

		// Check for performance alerts
		if (duration > thresholdsRef.current.INTERACTION_TIME_CRITICAL) {
			addAlert({
				type: 'error',
				message: `Critical interaction time for ${type}: ${duration.toFixed(2)}ms`,
				metric: 'interactionTime',
				value: duration,
				threshold: thresholdsRef.current.INTERACTION_TIME_CRITICAL,
			});
		} else if (duration > thresholdsRef.current.INTERACTION_TIME_WARNING) {
			addAlert({
				type: 'warning',
				message: `Slow interaction time for ${type}: ${duration.toFixed(2)}ms`,
				metric: 'interactionTime',
				value: duration,
				threshold: thresholdsRef.current.INTERACTION_TIME_WARNING,
			});
		}
	}, [isMonitoring]);

	// Track search performance
	const trackSearch = useCallback((duration: number, resultCount: number) => {
		if (!isMonitoring) return;

		// Update global metrics
		setMetrics(prev => {
			const newSearchCount = prev.searchCount + 1;
			const newAverageSearchTime = (prev.averageSearchTime * prev.searchCount + duration) / newSearchCount;

			return {
				...prev,
				searchTime: duration,
				searchCount: newSearchCount,
				averageSearchTime: newAverageSearchTime,
			};
		});

		// Check for performance alerts
		if (duration > thresholdsRef.current.SEARCH_TIME_CRITICAL) {
			addAlert({
				type: 'error',
				message: `Critical search time: ${duration.toFixed(2)}ms for ${resultCount} results`,
				metric: 'searchTime',
				value: duration,
				threshold: thresholdsRef.current.SEARCH_TIME_CRITICAL,
			});
		} else if (duration > thresholdsRef.current.SEARCH_TIME_WARNING) {
			addAlert({
				type: 'warning',
				message: `Slow search time: ${duration.toFixed(2)}ms for ${resultCount} results`,
				metric: 'searchTime',
				value: duration,
				threshold: thresholdsRef.current.SEARCH_TIME_WARNING,
			});
		}
	}, [isMonitoring]);

	// Get component metrics
	const getComponentMetrics = useCallback((componentName: string) => {
		return componentMetrics.get(componentName);
	}, [componentMetrics]);

	// Get top slow components
	const getTopSlowComponents = useCallback((limit = 5) => {
		return Array.from(componentMetrics.values())
			.sort((a, b) => b.averageRenderTime - a.averageRenderTime)
			.slice(0, limit);
	}, [componentMetrics]);

	// Generate performance report
	const getPerformanceReport = useCallback((): string => {
		const report = [
			'# Performance Report',
			`Generated: ${new Date().toISOString()}`,
			'',
			## Overall Metrics,
			`Performance Score: ${metrics.performanceScore}/100 (${metrics.healthStatus})`,
			`Average Render Time: ${metrics.averageRenderTime.toFixed(2)}ms`,
			`Memory Usage: ${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB`,
			`Average Interaction Time: ${metrics.averageInteractionTime.toFixed(2)}ms`,
			`Average Search Time: ${metrics.averageSearchTime.toFixed(2)}ms`,
			'',
			## Component Performance,
			...Array.from(componentMetrics.entries())
				.sort(([, a], [, b]) => b.averageRenderTime - a.averageRenderTime)
				.slice(0, 10)
				.map(([name, metrics]) => 
					`- ${name}: ${metrics.averageRenderTime.toFixed(2)}ms (${metrics.renderCount} renders)`
				),
			'',
			## Recent Alerts,
			...alerts.slice(-5).map(alert => 
				`- [${alert.type.toUpperCase()}] ${alert.message}`
			),
		];

		return report.join('\n');
	}, [metrics, componentMetrics, alerts]);

	// Add alert
	const addAlert = useCallback((alert: Omit<PerformanceAlert, 'id' | 'timestamp'>) => {
		const newAlert: PerformanceAlert = {
			...alert,
			id: Math.random().toString(36).substr(2, 9),
			timestamp: Date.now(),
		};

		setAlerts(prev => [...prev.slice(-49), newAlert]); // Keep last 50 alerts
	}, []);

	// Clear alerts
	const clearAlerts = useCallback(() => {
		setAlerts([]);
	}, []);

	// Start monitoring
	const startMonitoring = useCallback(() => {
		if (isMonitoring) return;

		monitorRef.current = PerformanceMonitor.getInstance();
		
		// Start performance observers
		monitorRef.current.startRenderMonitoring((entries) => {
			entries.forEach(entry => {
				if (entry.entryType === 'measure') {
					trackRender(entry.name, entry.duration);
				}
			});
		});

		monitorRef.current.startInteractionMonitoring((entries) => {
			entries.forEach(entry => {
				if (entry.entryType === 'event') {
					trackInteraction(entry.name, entry.duration);
				}
			});
		});

		setIsMonitoring(true);

		// Update metrics periodically
		const interval = setInterval(updateMetrics, 1000);
		return () => clearInterval(interval);
	}, [isMonitoring, trackRender, trackInteraction, updateMetrics]);

	// Stop monitoring
	const stopMonitoring = useCallback(() => {
		if (!isMonitoring) return;

		monitorRef.current?.stopMonitoring();
		monitorRef.current = null;
		setIsMonitoring(false);
	}, [isMonitoring]);

	// Reset metrics
	const resetMetrics = useCallback(() => {
		setMetrics({
			renderTime: 0,
			renderCount: 0,
			averageRenderTime: 0,
			maxRenderTime: 0,
			memoryUsage: 0,
			memoryPeak: 0,
			memoryTrend: 'stable',
			interactionTime: 0,
			interactionCount: 0,
			averageInteractionTime: 0,
			searchTime: 0,
			searchCount: 0,
			averageSearchTime: 0,
			performanceScore: 100,
			healthStatus: 'excellent',
		});
		setComponentMetrics(new Map());
		setInteractions([]);
		setAlerts([]);
	}, []);

	// Auto-start monitoring if enabled
	useEffect(() => {
		if (enableMonitoring && !isMonitoring) {
			const cleanup = startMonitoring();
			return cleanup;
		}
	}, [enableMonitoring, isMonitoring, startMonitoring]);

	const contextValue: PerformanceContextType = {
		metrics,
		componentMetrics,
		interactions,
		alerts,
		isMonitoring,
		startMonitoring,
		stopMonitoring,
		resetMetrics,
		trackRender,
		trackInteraction,
		trackSearch,
		getComponentMetrics,
		getTopSlowComponents,
		getPerformanceReport,
		addAlert,
		clearAlerts,
	};

	return (
		<PerformanceContext.Provider value={contextValue}>
			{children}
		</PerformanceContext.Provider>
	);
};

export const usePerformance = (): PerformanceContextType => {
	const context = useContext(PerformanceContext);
	if (context === undefined) {
		throw new Error('usePerformance must be used within a PerformanceProvider');
	}
	return context;
};

// Hook for performance tracking
export const usePerformanceTracker = (componentName: string) => {
	const { trackRender } = usePerformance();
	const renderStartTime = useRef<number>(0);

	const startRender = useCallback(() => {
		renderStartTime.current = performance.now();
	}, []);

	const endRender = useCallback(() => {
		if (renderStartTime.current > 0) {
			const renderTime = performance.now() - renderStartTime.current;
			trackRender(componentName, renderTime);
			renderStartTime.current = 0;
		}
	}, [componentName, trackRender]);

	return { startRender, endRender };
};

// Performance dashboard component
export const PerformanceDashboard: React.FC = () => {
	const { metrics, alerts, getTopSlowComponents, clearAlerts, isMonitoring, stopMonitoring, startMonitoring } = usePerformance();
	const topSlowComponents = getTopSlowComponents(5);

	const getHealthIcon = (status: string) => {
		switch (status) {
			case 'excellent': return <FiCheckCircle color="#22c55e" />;
			case 'good': return <FiCheckCircle color="#3b82f6" />;
			case 'warning': return <FiAlertCircle color="#f59e0b" />;
			case 'critical': return <FiAlertCircle color="#ef4444" />;
			default: return <FiActivity color="#6b7280" />;
		}
	};

	const formatBytes = (bytes: number) => {
		return (bytes / 1024 / 1024).toFixed(2) + ' MB';
	};

	return (
		<div style={{ padding: '1rem', fontFamily: 'monospace', fontSize: '0.875rem' }}>
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
				<h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
					<FiActivity />
					Performance Dashboard
				</h3>
				<div style={{ display: 'flex', gap: '0.5rem' }}>
					<button
						onClick={isMonitoring ? stopMonitoring : startMonitoring}
						style={{
							padding: '0.25rem 0.5rem',
							border: '1px solid #d1d5db',
							borderRadius: '0.25rem',
							background: isMonitoring ? '#ef4444' : '#22c55e',
							color: 'white',
							cursor: 'pointer',
						}}
					>
						{isMonitoring ? 'Stop' : 'Start'} Monitoring
					</button>
					<button
						onClick={clearAlerts}
						style={{
							padding: '0.25rem 0.5rem',
							border: '1px solid #d1d5db',
							borderRadius: '0.25rem',
							background: '#f3f4f6',
							cursor: 'pointer',
						}}
					>
						Clear Alerts
					</button>
				</div>
			</div>

			<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
				<div style={{ padding: '0.75rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}>
					<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
						{getHealthIcon(metrics.healthStatus)}
						<span>Health Status</span>
					</div>
					<div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
						{metrics.performanceScore}/100
					</div>
					<div style={{ color: '#6b7280', fontSize: '0.75rem' }}>
						{metrics.healthStatus}
					</div>
				</div>

				<div style={{ padding: '0.75rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}>
					<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
						<FiCpu />
						<span>Render Performance</span>
					</div>
					<div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
						{metrics.averageRenderTime.toFixed(1)}ms
					</div>
					<div style={{ color: '#6b7280', fontSize: '0.75rem' }}>
						Avg • {metrics.renderCount} renders
					</div>
				</div>

				<div style={{ padding: '0.75rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}>
					<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
						<FiHardDrive />
						<span>Memory Usage</span>
					</div>
					<div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
						{formatBytes(metrics.memoryUsage)}
					</div>
					<div style={{ color: '#6b7280', fontSize: '0.75rem' }}>
						Peak: {formatBytes(metrics.memoryPeak)}
					</div>
				</div>

				<div style={{ padding: '0.75rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}>
					<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
						<FiTrendingUp />
						<span>Interactions</span>
					</div>
					<div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
						{metrics.averageInteractionTime.toFixed(1)}ms
					</div>
					<div style={{ color: '#6b7280', fontSize: '0.75rem' }}>
						Avg • {metrics.interactionCount} total
					</div>
				</div>
			</div>

			{topSlowComponents.length > 0 && (
				<div style={{ marginBottom: '1rem' }}>
					<h4 style={{ margin: '0 0 0.5rem 0' }}>Top Slow Components</h4>
					<div style={{ border: '1px solid #e5e7eb', borderRadius: '0.5rem', overflow: 'hidden' }}>
						{topSlowComponents.map((component, index) => (
							<div
								key={component.componentName}
								style={{
									padding: '0.5rem',
									borderBottom: index < topSlowComponents.length - 1 ? '1px solid #f3f4f6' : 'none',
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'center',
								}}
							>
								<span>{component.componentName}</span>
								<span style={{ 
									color: component.isOptimized ? '#22c55e' : '#ef4444',
									fontWeight: 'bold'
								}}>
									{component.averageRenderTime.toFixed(2)}ms
								</span>
							</div>
						))}
					</div>
				</div>
			)}

			{alerts.length > 0 && (
				<div>
					<h4 style={{ margin: '0 0 0.5rem 0' }}>Recent Alerts</h4>
					<div style={{ border: '1px solid #e5e7eb', borderRadius: '0.5rem', overflow: 'hidden' }}>
						{alerts.slice(-10).reverse().map((alert) => (
							<div
								key={alert.id}
								style={{
									padding: '0.5rem',
									borderBottom: '1px solid #f3f4f6',
									display: 'flex',
									alignItems: 'flex-start',
									gap: '0.5rem',
								}}
							>
								<div style={{ 
									width: '8px',
									height: '8px',
									borderRadius: '50%',
									background: alert.type === 'error' ? '#ef4444' : 
													alert.type === 'warning' ? '#f59e0b' : '#3b82f6',
									marginTop: '0.25rem'
								}} />
								<div style={{ flex: 1 }}>
									<div>{alert.message}</div>
									<div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
										{new Date(alert.timestamp).toLocaleTimeString()}
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
};

export default PerformanceProvider;
