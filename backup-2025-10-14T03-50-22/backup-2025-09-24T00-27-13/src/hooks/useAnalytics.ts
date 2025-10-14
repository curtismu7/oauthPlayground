import { useEffect, useCallback, useRef } from 'react';
import {
	analyticsManager,
	trackEvent,
	trackPageView,
	trackFlowStart,
	trackFlowComplete,
	trackFlowError,
	trackUserAction,
	trackPerformanceMetric,
	trackSecurityEvent,
	trackError,
	trackCustom,
	setUserId,
	setCustomProperties,
	AnalyticsEventType,
	AnalyticsEvent,
	PerformanceMetrics,
	UserBehavior,
} from '../utils/analytics';
import { logger } from '../utils/logger';

// Analytics hook configuration
export interface UseAnalyticsConfig {
	enabled?: boolean;
	debug?: boolean;
	userId?: string;
	customProperties?: Record<string, any>;
	trackPageViews?: boolean;
	trackUserActions?: boolean;
	trackPerformance?: boolean;
	trackErrors?: boolean;
}

// Analytics hook state
export interface AnalyticsState {
	isEnabled: boolean;
	userId?: string;
	sessionId: string;
	eventCount: number;
	lastEvent?: AnalyticsEvent;
	performanceMetrics?: PerformanceMetrics;
	userBehavior?: UserBehavior;
}

// useAnalytics hook
export const useAnalytics = (config: UseAnalyticsConfig = {}) => {
	const {
		enabled = true,
		debug = false,
		userId,
		customProperties,
		trackPageViews = true,
		trackUserActions = true,
		trackPerformance = true,
		trackErrors = true,
	} = config;

	const configRef = useRef(config);
	const isInitialized = useRef(false);

	// Update configuration when it changes
	useEffect(() => {
		configRef.current = config;

		if (userId) {
			setUserId(userId);
		}

		if (customProperties) {
			setCustomProperties(customProperties);
		}

		analyticsManager.updateConfig({
			enabled,
			debug,
			userId,
			customProperties,
		});
	}, [enabled, debug, userId, customProperties]);

	// Initialize analytics
	useEffect(() => {
		if (!isInitialized.current) {
			analyticsManager.setEnabled(enabled);
			isInitialized.current = true;

			if (debug) {
				logger.info('[useAnalytics] Analytics initialized');
			}
		}
	}, [enabled, debug]);

	// Track page views
	useEffect(() => {
		if (trackPageViews && enabled) {
			const currentPage = window.location.pathname;
			trackPageView(currentPage);

			if (debug) {
				logger.info('[useAnalytics] Page view tracked:', currentPage);
			}
		}
	}, [trackPageViews, enabled, debug]);

	// Track user actions
	const handleUserAction = useCallback(
		(action: string, element?: string, properties?: Record<string, any>) => {
			if (trackUserActions && enabled) {
				trackUserAction(action, element, properties);

				if (debug) {
					logger.info('[useAnalytics] User action tracked:', { action, element, properties });
				}
			}
		},
		[trackUserActions, enabled, debug]
	);

	// Track performance metrics
	const handlePerformanceMetric = useCallback(
		(metric: string, value: number, properties?: Record<string, any>) => {
			if (trackPerformance && enabled) {
				trackPerformanceMetric(metric, value, properties);

				if (debug) {
					logger.info('[useAnalytics] Performance metric tracked:', { metric, value, properties });
				}
			}
		},
		[trackPerformance, enabled, debug]
	);

	// Track errors
	const handleError = useCallback(
		(error: Error, context?: string, properties?: Record<string, any>) => {
			if (trackErrors && enabled) {
				trackError(error, context, properties);

				if (debug) {
					logger.info('[useAnalytics] Error tracked:', {
						error: error.message,
						context,
						properties,
					});
				}
			}
		},
		[trackErrors, enabled, debug]
	);

	// Track custom events
	const handleCustomEvent = useCallback(
		(eventName: string, properties?: Record<string, any>) => {
			if (enabled) {
				trackCustom(eventName, properties);

				if (debug) {
					logger.info('[useAnalytics] Custom event tracked:', { eventName, properties });
				}
			}
		},
		[enabled, debug]
	);

	// Track flow events
	const trackFlow = useCallback(
		(flowType: string, event: 'start' | 'complete' | 'error', properties?: Record<string, any>) => {
			if (!enabled) return;

			switch (event) {
				case 'start':
					trackFlowStart(flowType, properties);
					break;
				case 'complete':
					trackFlowComplete(flowType, true, properties);
					break;
				case 'error':
					trackFlowError(flowType, properties?.error || 'Unknown error', properties);
					break;
			}

			if (debug) {
				logger.info('[useAnalytics] Flow event tracked:', { flowType, event, properties });
			}
		},
		[enabled, debug]
	);

	// Track security events
	const trackSecurity = useCallback(
		(
			event: string,
			severity: 'low' | 'medium' | 'high' | 'critical',
			properties?: Record<string, any>
		) => {
			if (enabled) {
				trackSecurityEvent(event, severity, properties);

				if (debug) {
					logger.info('[useAnalytics] Security event tracked:', { event, severity, properties });
				}
			}
		},
		[enabled, debug]
	);

	// Get analytics data
	const getAnalyticsData = useCallback(() => {
		return analyticsManager.getAnalyticsData();
	}, []);

	// Flush analytics data
	const flush = useCallback(async () => {
		if (enabled) {
			await analyticsManager.flush();

			if (debug) {
				logger.info('[useAnalytics] Analytics data flushed');
			}
		}
	}, [enabled, debug]);

	// Set user ID
	const updateUserId = useCallback(
		(newUserId: string) => {
			setUserId(newUserId);

			if (debug) {
				logger.info('[useAnalytics] User ID updated:', newUserId);
			}
		},
		[debug]
	);

	// Set custom properties
	const updateCustomProperties = useCallback(
		(properties: Record<string, any>) => {
			setCustomProperties(properties);

			if (debug) {
				logger.info('[useAnalytics] Custom properties updated:', properties);
			}
		},
		[debug]
	);

	// Enable/disable analytics
	const setEnabled = useCallback(
		(newEnabled: boolean) => {
			analyticsManager.setEnabled(newEnabled);

			if (debug) {
				logger.info('[useAnalytics] Analytics enabled:', newEnabled);
			}
		},
		[debug]
	);

	return {
		// State
		isEnabled: enabled,
		userId,
		sessionId: analyticsManager.getAnalyticsData().events[0]?.sessionId || '',

		// Actions
		trackEvent: (eventType: AnalyticsEventType, properties?: Record<string, any>) => {
			if (enabled) {
				trackEvent(eventType, properties);
			}
		},
		trackPageView: (page: string, properties?: Record<string, any>) => {
			if (enabled) {
				trackPageView(page, properties);
			}
		},
		trackUserAction: handleUserAction,
		trackPerformanceMetric: handlePerformanceMetric,
		trackError: handleError,
		trackCustom: handleCustomEvent,
		trackFlow,
		trackSecurity,

		// Utilities
		getAnalyticsData,
		flush,
		updateUserId,
		updateCustomProperties,
		setEnabled,
	};
};

// Hook for tracking specific user actions
export const useUserActionTracking = (enabled: boolean = true) => {
	const { trackUserAction } = useAnalytics({ enabled, trackUserActions: true });

	const trackClick = useCallback(
		(element: string, properties?: Record<string, any>) => {
			trackUserAction('click', element, properties);
		},
		[trackUserAction]
	);

	const trackFormSubmit = useCallback(
		(formName: string, properties?: Record<string, any>) => {
			trackUserAction('form_submit', formName, properties);
		},
		[trackUserAction]
	);

	const trackButtonClick = useCallback(
		(buttonName: string, properties?: Record<string, any>) => {
			trackUserAction('button_click', buttonName, properties);
		},
		[trackUserAction]
	);

	const trackNavigation = useCallback(
		(from: string, to: string, properties?: Record<string, any>) => {
			trackUserAction('navigation', 'route', { from, to, ...properties });
		},
		[trackUserAction]
	);

	return {
		trackClick,
		trackFormSubmit,
		trackButtonClick,
		trackNavigation,
	};
};

// Hook for tracking performance metrics
export const usePerformanceTracking = (enabled: boolean = true) => {
	const { trackPerformanceMetric } = useAnalytics({ enabled, trackPerformance: true });

	const trackLoadTime = useCallback(
		(loadTime: number, properties?: Record<string, any>) => {
			trackPerformanceMetric('load_time', loadTime, properties);
		},
		[trackPerformanceMetric]
	);

	const trackRenderTime = useCallback(
		(renderTime: number, properties?: Record<string, any>) => {
			trackPerformanceMetric('render_time', renderTime, properties);
		},
		[trackPerformanceMetric]
	);

	const trackMemoryUsage = useCallback(
		(memoryUsage: number, properties?: Record<string, any>) => {
			trackPerformanceMetric('memory_usage', memoryUsage, properties);
		},
		[trackPerformanceMetric]
	);

	const trackNetworkLatency = useCallback(
		(latency: number, properties?: Record<string, any>) => {
			trackPerformanceMetric('network_latency', latency, properties);
		},
		[trackPerformanceMetric]
	);

	const trackErrorRate = useCallback(
		(errorRate: number, properties?: Record<string, any>) => {
			trackPerformanceMetric('error_rate', errorRate, properties);
		},
		[trackPerformanceMetric]
	);

	return {
		trackLoadTime,
		trackRenderTime,
		trackMemoryUsage,
		trackNetworkLatency,
		trackErrorRate,
	};
};

// Hook for tracking OAuth flows
export const useFlowTracking = (enabled: boolean = true) => {
	const { trackFlow } = useAnalytics({ enabled });

	const startFlow = useCallback(
		(flowType: string, properties?: Record<string, any>) => {
			trackFlow(flowType, 'start', properties);
		},
		[trackFlow]
	);

	const completeFlow = useCallback(
		(flowType: string, success: boolean, properties?: Record<string, any>) => {
			trackFlow(flowType, 'complete', { success, ...properties });
		},
		[trackFlow]
	);

	const errorFlow = useCallback(
		(flowType: string, error: string, properties?: Record<string, any>) => {
			trackFlow(flowType, 'error', { error, ...properties });
		},
		[trackFlow]
	);

	return {
		startFlow,
		completeFlow,
		errorFlow,
	};
};

// Hook for tracking security events
export const useSecurityTracking = (enabled: boolean = true) => {
	const { trackSecurity } = useAnalytics({ enabled });

	const trackSecurityThreat = useCallback(
		(
			threat: string,
			severity: 'low' | 'medium' | 'high' | 'critical',
			properties?: Record<string, any>
		) => {
			trackSecurity(`threat_${threat}`, severity, properties);
		},
		[trackSecurity]
	);

	const trackSecurityViolation = useCallback(
		(
			violation: string,
			severity: 'low' | 'medium' | 'high' | 'critical',
			properties?: Record<string, any>
		) => {
			trackSecurity(`violation_${violation}`, severity, properties);
		},
		[trackSecurity]
	);

	const trackSecurityCompliance = useCallback(
		(compliance: string, status: 'pass' | 'fail', properties?: Record<string, any>) => {
			trackSecurity(`compliance_${compliance}`, status === 'fail' ? 'high' : 'low', {
				status,
				...properties,
			});
		},
		[trackSecurity]
	);

	return {
		trackSecurityThreat,
		trackSecurityViolation,
		trackSecurityCompliance,
	};
};

export default useAnalytics;
