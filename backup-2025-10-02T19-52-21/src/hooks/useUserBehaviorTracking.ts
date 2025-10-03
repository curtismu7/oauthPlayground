import { useCallback, useEffect, useRef, useState } from 'react';
import { logger } from '../utils/logger';
import {
	completeFlow,
	completeFlowStep,
	EngagementMetrics,
	getCurrentSession,
	getEngagementMetrics,
	getUserJourney,
	trackFlowStart,
	trackFlowStep,
	trackPageView,
	trackUserAction,
	UserJourney,
	UserSession,
	userBehaviorTracker,
} from '../utils/userBehaviorTracking';

// User behavior tracking hook configuration
export interface UseUserBehaviorTrackingConfig {
	enabled?: boolean;
	userId?: string;
	trackPageViews?: boolean;
	trackUserActions?: boolean;
	trackFlows?: boolean;
	trackEngagement?: boolean;
	autoStartSession?: boolean;
	debug?: boolean;
}

// User behavior tracking state
export interface UserBehaviorTrackingState {
	isEnabled: boolean;
	currentSession: UserSession | null;
	engagementMetrics: EngagementMetrics;
	userJourney: UserJourney | null;
	isTracking: boolean;
}

// useUserBehaviorTracking hook
export const useUserBehaviorTracking = (config: UseUserBehaviorTrackingConfig = {}) => {
	const {
		enabled = true,
		userId,
		trackPageViews = true,
		trackUserActions = true,
		trackFlows = true,
		trackEngagement = true,
		autoStartSession = true,
		debug = false,
	} = config;

	const [state, setState] = useState<UserBehaviorTrackingState>({
		isEnabled: enabled,
		currentSession: null,
		engagementMetrics: getEngagementMetrics(),
		userJourney: null,
		isTracking: false,
	});

	const configRef = useRef(config);
	const flowTrackingRef = useRef<Map<string, { flowId: string; stepIds: string[] }>>(new Map());

	// Update configuration when it changes
	useEffect(() => {
		configRef.current = config;

		userBehaviorTracker.updateConfig({
			trackClicks: trackUserActions,
			trackScrolls: trackEngagement,
			trackForms: trackUserActions,
			trackFlows: trackFlows,
			trackPageViews: trackPageViews,
			trackEngagement: trackEngagement,
		});

		if (debug) {
			logger.info('[useUserBehaviorTracking] Configuration updated');
		}
	}, [trackPageViews, trackUserActions, trackFlows, trackEngagement, debug, config]);

	// Initialize tracking
	useEffect(() => {
		if (enabled && autoStartSession) {
			userBehaviorTracker.setTrackingEnabled(true);
			if (userId) {
				userBehaviorTracker.startNewSession(userId);
			}

			setState((prev) => ({
				...prev,
				isEnabled: true,
				isTracking: true,
				currentSession: getCurrentSession(),
			}));

			if (debug) {
				logger.info('[useUserBehaviorTracking] User behavior tracking initialized');
			}
		} else if (!enabled) {
			userBehaviorTracker.setTrackingEnabled(false);
			setState((prev) => ({
				...prev,
				isEnabled: false,
				isTracking: false,
			}));
		}
	}, [enabled, autoStartSession, userId, debug]);

	// Update state periodically
	useEffect(() => {
		if (!enabled) return;

		const interval = setInterval(() => {
			setState((prev) => ({
				...prev,
				currentSession: getCurrentSession(),
				engagementMetrics: getEngagementMetrics(),
				userJourney: userId ? getUserJourney(userId) : null,
			}));
		}, 1000); // Update every second

		return () => clearInterval(interval);
	}, [enabled, userId]);

	// Track page view
	const handlePageView = useCallback(
		(page: string, referrer?: string) => {
			if (enabled && trackPageViews) {
				trackPageView(page, referrer);

				if (debug) {
					logger.info('[useUserBehaviorTracking] Page view tracked:', page);
				}
			}
		},
		[enabled, trackPageViews, debug]
	);

	// Track user action
	const handleUserAction = useCallback(
		(action: string, element?: string, properties?: Record<string, any>) => {
			if (enabled && trackUserActions) {
				trackUserAction(action, element, properties);

				if (debug) {
					logger.info('[useUserBehaviorTracking] User action tracked:', {
						action,
						element,
						properties,
					});
				}
			}
		},
		[enabled, trackUserActions, debug]
	);

	// Start flow tracking
	const startFlowTracking = useCallback(
		(flowType: string, properties?: Record<string, any>) => {
			if (!enabled || !trackFlows) return '';

			const flowId = trackFlowStart(flowType, properties);
			flowTrackingRef.current.set(flowType, { flowId, stepIds: [] });

			if (debug) {
				logger.info('[useUserBehaviorTracking] Flow tracking started:', { flowType, flowId });
			}

			return flowId;
		},
		[enabled, trackFlows, debug]
	);

	// Track flow step
	const trackFlowStepTracking = useCallback(
		(flowType: string, stepName: string, properties?: Record<string, any>) => {
			if (!enabled || !trackFlows) return '';

			const flowData = flowTrackingRef.current.get(flowType);
			if (!flowData) {
				logger.warn('[useUserBehaviorTracking] Flow not found for step tracking:', flowType);
				return '';
			}

			const stepId = trackFlowStep(flowData.flowId, stepName, properties);
			flowData.stepIds.push(stepId);

			if (debug) {
				logger.info('[useUserBehaviorTracking] Flow step tracked:', { flowType, stepName, stepId });
			}

			return stepId;
		},
		[enabled, trackFlows, debug]
	);

	// Complete flow step
	const completeFlowStepTracking = useCallback(
		(flowType: string, stepName: string, success: boolean, errorMessage?: string) => {
			if (!enabled || !trackFlows) return;

			const flowData = flowTrackingRef.current.get(flowType);
			if (!flowData) {
				logger.warn('[useUserBehaviorTracking] Flow not found for step completion:', flowType);
				return;
			}

			// Find the step ID for this step name
			const stepId = flowData.stepIds[flowData.stepIds.length - 1]; // Assuming last step
			if (stepId) {
				completeFlowStep(stepId, success, errorMessage);

				if (debug) {
					logger.info('[useUserBehaviorTracking] Flow step completed:', {
						flowType,
						stepName,
						success,
					});
				}
			}
		},
		[enabled, trackFlows, debug]
	);

	// Complete flow
	const completeFlowTracking = useCallback(
		(flowType: string, success: boolean, errorMessage?: string) => {
			if (!enabled || !trackFlows) return;

			const flowData = flowTrackingRef.current.get(flowType);
			if (!flowData) {
				logger.warn('[useUserBehaviorTracking] Flow not found for completion:', flowType);
				return;
			}

			completeFlow(flowData.flowId, success, errorMessage);
			flowTrackingRef.current.delete(flowType);

			if (debug) {
				logger.info('[useUserBehaviorTracking] Flow completed:', { flowType, success });
			}
		},
		[enabled, trackFlows, debug]
	);

	// Get engagement score
	const getEngagementScore = useCallback(() => {
		return state.engagementMetrics;
	}, [state.engagementMetrics]);

	// Get session duration
	const getSessionDuration = useCallback(() => {
		if (!state.currentSession) return 0;

		const endTime = state.currentSession.endTime || Date.now();
		return endTime - state.currentSession.startTime;
	}, [state.currentSession]);

	// Get page views count
	const getPageViewsCount = useCallback(() => {
		return state.currentSession?.pageViews.length || 0;
	}, [state.currentSession]);

	// Get user actions count
	const getUserActionsCount = useCallback(() => {
		return state.currentSession?.userActions.length || 0;
	}, [state.currentSession]);

	// Get flow interactions count
	const getFlowInteractionsCount = useCallback(() => {
		return state.currentSession?.flowInteractions.length || 0;
	}, [state.currentSession]);

	// Get completed flows count
	const getCompletedFlowsCount = useCallback(() => {
		return state.currentSession?.flowInteractions.filter((f) => f.success).length || 0;
	}, [state.currentSession]);

	// Get flow completion rate
	const getFlowCompletionRate = useCallback(() => {
		const totalFlows = state.currentSession?.flowInteractions.length || 0;
		const completedFlows =
			state.currentSession?.flowInteractions.filter((f) => f.success).length || 0;

		return totalFlows > 0 ? (completedFlows / totalFlows) * 100 : 0;
	}, [state.currentSession]);

	// Get most visited pages
	const getMostVisitedPages = useCallback(() => {
		return state.userJourney?.mostVisitedPages || [];
	}, [state.userJourney]);

	// Get favorite flows
	const getFavoriteFlows = useCallback(() => {
		return state.userJourney?.favoriteFlows || [];
	}, [state.userJourney]);

	// Get current flow interactions
	const getCurrentFlowInteractions = useCallback(() => {
		return state.currentSession?.flowInteractions || [];
	}, [state.currentSession]);

	// Get active flows
	const getActiveFlows = useCallback(() => {
		return state.currentSession?.flowInteractions.filter((f) => !f.endTime) || [];
	}, [state.currentSession]);

	// Get completed flows
	const getCompletedFlows = useCallback(() => {
		return state.currentSession?.flowInteractions.filter((f) => f.success) || [];
	}, [state.currentSession]);

	// Get failed flows
	const getFailedFlows = useCallback(() => {
		return state.currentSession?.flowInteractions.filter((f) => f.endTime && !f.success) || [];
	}, [state.currentSession]);

	// Get flow drop-off points
	const getFlowDropOffPoints = useCallback(() => {
		const failedFlows = getFailedFlows();
		const dropOffPoints = new Map<string, number>();

		failedFlows.forEach((flow) => {
			if (flow.dropOffStep) {
				dropOffPoints.set(flow.dropOffStep, (dropOffPoints.get(flow.dropOffStep) || 0) + 1);
			}
		});

		return Array.from(dropOffPoints.entries()).map(([step, count]) => ({ step, count }));
	}, [getFailedFlows]);

	// Get average flow duration
	const getAverageFlowDuration = useCallback(() => {
		const completedFlows = getCompletedFlows();
		if (completedFlows.length === 0) return 0;

		const totalDuration = completedFlows.reduce((sum, flow) => sum + (flow.duration || 0), 0);
		return totalDuration / completedFlows.length;
	}, [getCompletedFlows]);

	// Get average step duration
	const getAverageStepDuration = useCallback(
		(flowType?: string) => {
			const flows = flowType
				? state.currentSession?.flowInteractions.filter((f) => f.flowType === flowType) || []
				: state.currentSession?.flowInteractions || [];

			const allSteps = flows.flatMap((flow) => flow.steps);
			if (allSteps.length === 0) return 0;

			const totalDuration = allSteps.reduce((sum, step) => sum + (step.duration || 0), 0);
			return totalDuration / allSteps.length;
		},
		[state.currentSession]
	);

	// Get bounce rate
	const getBounceRate = useCallback(() => {
		return state.engagementMetrics.bounceRate;
	}, [state.engagementMetrics]);

	// Get return visitor status
	const isReturnVisitor = useCallback(() => {
		return state.engagementMetrics.returnVisitor;
	}, [state.engagementMetrics]);

	// Get scroll depth
	const getScrollDepth = useCallback(() => {
		return state.engagementMetrics.scrollDepth;
	}, [state.engagementMetrics]);

	// Get time on site
	const getTimeOnSite = useCallback(() => {
		return state.engagementMetrics.timeOnSite;
	}, [state.engagementMetrics]);

	// Start new session
	const startNewSession = useCallback(
		(newUserId?: string) => {
			if (enabled) {
				userBehaviorTracker.startNewSession(newUserId || userId);
				setState((prev) => ({
					...prev,
					currentSession: getCurrentSession(),
				}));

				if (debug) {
					logger.info('[useUserBehaviorTracking] New session started');
				}
			}
		},
		[enabled, userId, debug]
	);

	// End current session
	const endCurrentSession = useCallback(() => {
		if (enabled) {
			userBehaviorTracker.endCurrentSession();
			setState((prev) => ({
				...prev,
				currentSession: null,
			}));

			if (debug) {
				logger.info('[useUserBehaviorTracking] Session ended');
			}
		}
	}, [enabled, debug]);

	// Set user ID
	const setUserId = useCallback(
		(newUserId: string) => {
			if (enabled) {
				userBehaviorTracker.startNewSession(newUserId);
				setState((prev) => ({
					...prev,
					userJourney: getUserJourney(newUserId),
				}));

				if (debug) {
					logger.info('[useUserBehaviorTracking] User ID set:', newUserId);
				}
			}
		},
		[enabled, debug]
	);

	// Update tracking configuration
	const updateConfig = useCallback(
		(newConfig: Partial<UseUserBehaviorTrackingConfig>) => {
			userBehaviorTracker.updateConfig({
				trackClicks: newConfig.trackUserActions ?? trackUserActions,
				trackScrolls: newConfig.trackEngagement ?? trackEngagement,
				trackForms: newConfig.trackUserActions ?? trackUserActions,
				trackFlows: newConfig.trackFlows ?? trackFlows,
				trackPageViews: newConfig.trackPageViews ?? trackPageViews,
				trackEngagement: newConfig.trackEngagement ?? trackEngagement,
			});

			if (debug) {
				logger.info('[useUserBehaviorTracking] Configuration updated');
			}
		},
		[trackUserActions, trackEngagement, trackFlows, trackPageViews, debug]
	);

	return {
		// State
		...state,

		// Actions
		trackPageView: handlePageView,
		trackUserAction: handleUserAction,
		startFlowTracking,
		trackFlowStepTracking,
		completeFlowStepTracking,
		completeFlowTracking,

		// Getters
		getEngagementScore,
		getSessionDuration,
		getPageViewsCount,
		getUserActionsCount,
		getFlowInteractionsCount,
		getCompletedFlowsCount,
		getFlowCompletionRate,
		getMostVisitedPages,
		getFavoriteFlows,
		getCurrentFlowInteractions,
		getActiveFlows,
		getCompletedFlows,
		getFailedFlows,
		getFlowDropOffPoints,
		getAverageFlowDuration,
		getAverageStepDuration,
		getBounceRate,
		isReturnVisitor,
		getScrollDepth,
		getTimeOnSite,

		// Session management
		startNewSession,
		endCurrentSession,
		setUserId,
		updateConfig,
	};
};

// Hook for tracking specific user actions
export const useUserActionTracking = (enabled: boolean = true) => {
	const { trackUserAction } = useUserBehaviorTracking({ enabled, trackUserActions: true });

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

	const trackFocus = useCallback(
		(element: string, properties?: Record<string, any>) => {
			trackUserAction('focus', element, properties);
		},
		[trackUserAction]
	);

	const trackBlur = useCallback(
		(element: string, properties?: Record<string, any>) => {
			trackUserAction('blur', element, properties);
		},
		[trackUserAction]
	);

	const trackHover = useCallback(
		(element: string, properties?: Record<string, any>) => {
			trackUserAction('hover', element, properties);
		},
		[trackUserAction]
	);

	const trackScroll = useCallback(
		(scrollDepth: number, properties?: Record<string, any>) => {
			trackUserAction('scroll', 'window', { scrollDepth, ...properties });
		},
		[trackUserAction]
	);

	return {
		trackClick,
		trackFormSubmit,
		trackButtonClick,
		trackNavigation,
		trackFocus,
		trackBlur,
		trackHover,
		trackScroll,
	};
};

// Hook for tracking OAuth flows
export const useFlowBehaviorTracking = (enabled: boolean = true) => {
	const {
		startFlowTracking,
		trackFlowStepTracking,
		completeFlowStepTracking,
		completeFlowTracking,
		getCurrentFlowInteractions,
		getActiveFlows,
		getCompletedFlows,
		getFailedFlows,
		getFlowCompletionRate,
		getAverageFlowDuration,
		getFlowDropOffPoints,
	} = useUserBehaviorTracking({ enabled, trackFlows: true });

	return {
		startFlowTracking,
		trackFlowStepTracking,
		completeFlowStepTracking,
		completeFlowTracking,
		getCurrentFlowInteractions,
		getActiveFlows,
		getCompletedFlows,
		getFailedFlows,
		getFlowCompletionRate,
		getAverageFlowDuration,
		getFlowDropOffPoints,
	};
};

export default useUserBehaviorTracking;
