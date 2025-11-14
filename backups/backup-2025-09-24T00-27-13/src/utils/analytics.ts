import { logger } from './logger';

// Analytics event types
export type AnalyticsEventType =
	| 'page_view'
	| 'flow_start'
	| 'flow_complete'
	| 'flow_error'
	| 'user_action'
	| 'performance_metric'
	| 'security_event'
	| 'error_event'
	| 'custom_event';

// Analytics event interface
export interface AnalyticsEvent {
	id: string;
	type: AnalyticsEventType;
	timestamp: number;
	userId?: string;
	sessionId: string;
	properties: Record<string, any>;
	metadata?: {
		userAgent?: string;
		url?: string;
		referrer?: string;
		screenResolution?: string;
		timezone?: string;
	};
}

// Analytics configuration
export interface AnalyticsConfig {
	enabled: boolean;
	debug: boolean;
	batchSize: number;
	flushInterval: number;
	endpoint: string;
	apiKey?: string;
	userId?: string;
	sessionId: string;
	customProperties?: Record<string, any>;
}

// Performance metrics interface
export interface PerformanceMetrics {
	loadTime: number;
	renderTime: number;
	memoryUsage: number;
	bundleSize: number;
	networkLatency: number;
	errorRate: number;
	userEngagement: number;
}

// User behavior interface
export interface UserBehavior {
	userId: string;
	sessionId: string;
	flowInteractions: FlowInteraction[];
	pageViews: PageView[];
	userActions: UserAction[];
	performanceMetrics: PerformanceMetrics;
	engagementScore: number;
}

// Flow interaction interface
export interface FlowInteraction {
	flowType: string;
	startTime: number;
	endTime?: number;
	steps: FlowStep[];
	success: boolean;
	errorMessage?: string;
	duration?: number;
}

// Flow step interface
export interface FlowStep {
	stepName: string;
	startTime: number;
	endTime?: number;
	success: boolean;
	errorMessage?: string;
	duration?: number;
	properties?: Record<string, any>;
}

// Page view interface
export interface PageView {
	page: string;
	timestamp: number;
	duration?: number;
	referrer?: string;
	properties?: Record<string, any>;
}

// User action interface
export interface UserAction {
	action: string;
	element?: string;
	timestamp: number;
	properties?: Record<string, any>;
}

// Analytics manager class
export class AnalyticsManager {
	private config: AnalyticsConfig;
	private events: AnalyticsEvent[] = [];
	private userBehavior: UserBehavior | null = null;
	private performanceMetrics: PerformanceMetrics | null = null;
	private isInitialized: boolean = false;
	private flushTimer: NodeJS.Timeout | null = null;

	constructor(config: Partial<AnalyticsConfig> = {}) {
		this.config = {
			enabled: true,
			debug: false,
			batchSize: 50,
			flushInterval: 30000, // 30 seconds
			endpoint: '/api/analytics',
			sessionId: this.generateSessionId(),
			...config,
		};

		this.initialize();
	}

	// Initialize analytics
	private initialize(): void {
		if (!this.config.enabled) return;

		try {
			this.setupPerformanceMonitoring();
			this.setupUserBehaviorTracking();
			this.setupErrorTracking();
			this.startFlushTimer();

			this.isInitialized = true;
			logger.info('[AnalyticsManager] Analytics initialized successfully');
		} catch (error) {
			logger.error('[AnalyticsManager] Failed to initialize analytics:', error);
		}
	}

	// Track an event
	public track(eventType: AnalyticsEventType, properties: Record<string, any> = {}): void {
		if (!this.config.enabled || !this.isInitialized) return;

		try {
			const event: AnalyticsEvent = {
				id: this.generateEventId(),
				type: eventType,
				timestamp: Date.now(),
				userId: this.config.userId,
				sessionId: this.config.sessionId,
				properties: {
					...this.config.customProperties,
					...properties,
				},
				metadata: this.getMetadata(),
			};

			this.events.push(event);

			if (this.config.debug) {
				logger.info('[AnalyticsManager] Event tracked:', event);
			}

			// Flush if batch size reached
			if (this.events.length >= this.config.batchSize) {
				this.flush();
			}
		} catch (error) {
			logger.error('[AnalyticsManager] Failed to track event:', error);
		}
	}

	// Track page view
	public trackPageView(page: string, properties: Record<string, any> = {}): void {
		this.track('page_view', {
			page,
			...properties,
		});
	}

	// Track flow start
	public trackFlowStart(flowType: string, properties: Record<string, any> = {}): void {
		this.track('flow_start', {
			flowType,
			...properties,
		});
	}

	// Track flow complete
	public trackFlowComplete(
		flowType: string,
		success: boolean,
		properties: Record<string, any> = {}
	): void {
		this.track('flow_complete', {
			flowType,
			success,
			...properties,
		});
	}

	// Track flow error
	public trackFlowError(
		flowType: string,
		error: string,
		properties: Record<string, any> = {}
	): void {
		this.track('flow_error', {
			flowType,
			error,
			...properties,
		});
	}

	// Track user action
	public trackUserAction(
		action: string,
		element?: string,
		properties: Record<string, any> = {}
	): void {
		this.track('user_action', {
			action,
			element,
			...properties,
		});
	}

	// Track performance metric
	public trackPerformanceMetric(
		metric: string,
		value: number,
		properties: Record<string, any> = {}
	): void {
		this.track('performance_metric', {
			metric,
			value,
			...properties,
		});
	}

	// Track security event
	public trackSecurityEvent(
		event: string,
		severity: 'low' | 'medium' | 'high' | 'critical',
		properties: Record<string, any> = {}
	): void {
		this.track('security_event', {
			event,
			severity,
			...properties,
		});
	}

	// Track error event
	public trackError(error: Error, context?: string, properties: Record<string, any> = {}): void {
		this.track('error_event', {
			error: error.message,
			stack: error.stack,
			context,
			...properties,
		});
	}

	// Track custom event
	public trackCustom(eventName: string, properties: Record<string, any> = {}): void {
		this.track('custom_event', {
			eventName,
			...properties,
		});
	}

	// Set user ID
	public setUserId(userId: string): void {
		this.config.userId = userId;
	}

	// Set custom properties
	public setCustomProperties(properties: Record<string, any>): void {
		this.config.customProperties = {
			...this.config.customProperties,
			...properties,
		};
	}

	// Flush events to server
	public async flush(): Promise<void> {
		if (this.events.length === 0) return;

		try {
			const eventsToFlush = [...this.events];
			this.events = [];

			if (this.config.debug) {
				logger.info('[AnalyticsManager] Flushing events:', eventsToFlush);
			}

			// In a real implementation, this would send to your analytics server
			await this.sendEvents(eventsToFlush);

			logger.info(`[AnalyticsManager] Flushed ${eventsToFlush.length} events`);
		} catch (error) {
			logger.error('[AnalyticsManager] Failed to flush events:', error);
			// Re-add events to queue for retry
			this.events.unshift(...this.events);
		}
	}

	// Send events to server
	private async sendEvents(events: AnalyticsEvent[]): Promise<void> {
		// Mock implementation - replace with actual API call
		if (this.config.debug) {
			console.log('Sending events to analytics server:', events);
		}

		// Simulate network delay
		await new Promise((resolve) => setTimeout(resolve, 100));
	}

	// Setup performance monitoring
	private setupPerformanceMonitoring(): void {
		if (typeof window === 'undefined') return;

		// Monitor page load performance
		window.addEventListener('load', () => {
			const navigation = performance.getEntriesByType(
				'navigation'
			)[0] as PerformanceNavigationTiming;

			this.trackPerformanceMetric(
				'page_load_time',
				navigation.loadEventEnd - navigation.loadEventStart
			);
			this.trackPerformanceMetric(
				'dom_content_loaded',
				navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart
			);
			this.trackPerformanceMetric(
				'first_paint',
				performance.getEntriesByType('paint')[0]?.startTime || 0
			);
		});

		// Monitor memory usage
		if ('memory' in performance) {
			setInterval(() => {
				const memory = (performance as any).memory;
				this.trackPerformanceMetric('memory_used', memory.usedJSHeapSize);
				this.trackPerformanceMetric('memory_total', memory.totalJSHeapSize);
			}, 30000);
		}

		// Monitor network performance
		if ('connection' in navigator) {
			const connection = (navigator as any).connection;
			this.trackPerformanceMetric('network_downlink', connection.downlink);
			this.trackPerformanceMetric('network_rtt', connection.rtt);
		}
	}

	// Setup user behavior tracking
	private setupUserBehaviorTracking(): void {
		if (typeof window === 'undefined') return;

		// Track clicks
		document.addEventListener('click', (event) => {
			const target = event.target as HTMLElement;
			this.trackUserAction('click', target.tagName, {
				id: target.id,
				className: target.className,
				text: target.textContent?.slice(0, 100),
			});
		});

		// Track form submissions
		document.addEventListener('submit', (event) => {
			const form = event.target as HTMLFormElement;
			this.trackUserAction('form_submit', form.tagName, {
				formId: form.id,
				formAction: form.action,
			});
		});

		// Track scroll depth
		let maxScrollDepth = 0;
		window.addEventListener('scroll', () => {
			const scrollDepth = Math.round(
				(window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
			);
			if (scrollDepth > maxScrollDepth) {
				maxScrollDepth = scrollDepth;
				this.trackPerformanceMetric('scroll_depth', maxScrollDepth);
			}
		});
	}

	// Setup error tracking
	private setupErrorTracking(): void {
		if (typeof window === 'undefined') return;

		// Track JavaScript errors
		window.addEventListener('error', (event) => {
			this.trackError(new Error(event.message), 'javascript_error', {
				filename: event.filename,
				lineno: event.lineno,
				colno: event.colno,
			});
		});

		// Track unhandled promise rejections
		window.addEventListener('unhandledrejection', (event) => {
			this.trackError(new Error(event.reason), 'unhandled_promise_rejection');
		});
	}

	// Start flush timer
	private startFlushTimer(): void {
		this.flushTimer = setInterval(() => {
			this.flush();
		}, this.config.flushInterval);
	}

	// Stop flush timer
	private stopFlushTimer(): void {
		if (this.flushTimer) {
			clearInterval(this.flushTimer);
			this.flushTimer = null;
		}
	}

	// Get metadata
	private getMetadata(): AnalyticsEvent['metadata'] {
		if (typeof window === 'undefined') return {};

		return {
			userAgent: navigator.userAgent,
			url: window.location.href,
			referrer: document.referrer,
			screenResolution: `${screen.width}x${screen.height}`,
			timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
		};
	}

	// Generate session ID
	private generateSessionId(): string {
		return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	// Generate event ID
	private generateEventId(): string {
		return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	// Get analytics data
	public getAnalyticsData(): {
		events: AnalyticsEvent[];
		userBehavior: UserBehavior | null;
		performanceMetrics: PerformanceMetrics | null;
	} {
		return {
			events: [...this.events],
			userBehavior: this.userBehavior,
			performanceMetrics: this.performanceMetrics,
		};
	}

	// Update configuration
	public updateConfig(newConfig: Partial<AnalyticsConfig>): void {
		this.config = { ...this.config, ...newConfig };
		logger.info('[AnalyticsManager] Configuration updated');
	}

	// Enable/disable analytics
	public setEnabled(enabled: boolean): void {
		this.config.enabled = enabled;
		if (enabled && !this.isInitialized) {
			this.initialize();
		} else if (!enabled) {
			this.stopFlushTimer();
		}
	}

	// Destroy analytics manager
	public destroy(): void {
		this.stopFlushTimer();
		this.flush();
		this.isInitialized = false;
		logger.info('[AnalyticsManager] Analytics manager destroyed');
	}
}

// Create global analytics manager instance
export const analyticsManager = new AnalyticsManager();

// Utility functions
export const trackEvent = (eventType: AnalyticsEventType, properties?: Record<string, any>) => {
	analyticsManager.track(eventType, properties);
};

export const trackPageView = (page: string, properties?: Record<string, any>) => {
	analyticsManager.trackPageView(page, properties);
};

export const trackFlowStart = (flowType: string, properties?: Record<string, any>) => {
	analyticsManager.trackFlowStart(flowType, properties);
};

export const trackFlowComplete = (
	flowType: string,
	success: boolean,
	properties?: Record<string, any>
) => {
	analyticsManager.trackFlowComplete(flowType, success, properties);
};

export const trackFlowError = (
	flowType: string,
	error: string,
	properties?: Record<string, any>
) => {
	analyticsManager.trackFlowError(flowType, error, properties);
};

export const trackUserAction = (
	action: string,
	element?: string,
	properties?: Record<string, any>
) => {
	analyticsManager.trackUserAction(action, element, properties);
};

export const trackPerformanceMetric = (
	metric: string,
	value: number,
	properties?: Record<string, any>
) => {
	analyticsManager.trackPerformanceMetric(metric, value, properties);
};

export const trackSecurityEvent = (
	event: string,
	severity: 'low' | 'medium' | 'high' | 'critical',
	properties?: Record<string, any>
) => {
	analyticsManager.trackSecurityEvent(event, severity, properties);
};

export const trackError = (error: Error, context?: string, properties?: Record<string, any>) => {
	analyticsManager.trackError(error, context, properties);
};

export const trackCustom = (eventName: string, properties?: Record<string, any>) => {
	analyticsManager.trackCustom(eventName, properties);
};

export const setUserId = (userId: string) => {
	analyticsManager.setUserId(userId);
};

export const setCustomProperties = (properties: Record<string, any>) => {
	analyticsManager.setCustomProperties(properties);
};

export default analyticsManager;
