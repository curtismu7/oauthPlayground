// src/utils/errorMonitoring.ts
// Comprehensive error monitoring and alerting system

export interface ErrorEvent {
	id: string;
	timestamp: number;
	level: 'info' | 'warning' | 'error' | 'critical';
	category: string;
	message: string;
	context: any;
	stack?: string;
	flowName?: string;
	userId?: string;
	sessionId?: string;
}

export interface ErrorMetrics {
	totalErrors: number;
	errorsByLevel: Record<string, number>;
	errorsByCategory: Record<string, number>;
	errorsByFlow: Record<string, number>;
	averageErrorsPerHour: number;
	criticalErrorRate: number;
	lastErrorTime: number;
}

export interface AlertRule {
	id: string;
	name: string;
	condition: (metrics: ErrorMetrics) => boolean;
	severity: 'low' | 'medium' | 'high' | 'critical';
	message: string;
	enabled: boolean;
}

export interface MonitoringConfig {
	enableRealTimeMonitoring: boolean;
	enableErrorAggregation: boolean;
	enableAlerting: boolean;
	maxErrorHistory: number;
	alertThresholds: {
		criticalErrorRate: number;
		errorSpikeThreshold: number;
		consecutiveFailures: number;
	};
	retentionPeriod: number; // in milliseconds
}

/**
 * Error Monitoring System
 * Comprehensive error tracking and alerting
 */
export class ErrorMonitoring {
	private config: MonitoringConfig;
	private errorHistory: ErrorEvent[] = [];
	private metrics: ErrorMetrics | null = null;
	private alertRules: AlertRule[] = [];
	private isMonitoring: boolean = false;

	constructor(
		config: MonitoringConfig = {
			enableRealTimeMonitoring: true,
			enableErrorAggregation: true,
			enableAlerting: true,
			maxErrorHistory: 1000,
			alertThresholds: {
				criticalErrorRate: 0.1, // 10% critical error rate
				errorSpikeThreshold: 10, // 10 errors in short time
				consecutiveFailures: 3, // 3 consecutive failures
			},
			retentionPeriod: 24 * 60 * 60 * 1000, // 24 hours
		}
	) {
		this.config = config;
		this.initializeAlertRules();
		this.startMonitoring();
	}

	/**
	 * Initialize default alert rules
	 */
	private initializeAlertRules(): void {
		// Critical error rate alert
		this.alertRules.push({
			id: 'critical-error-rate',
			name: 'Critical Error Rate Alert',
			condition: (metrics) =>
				metrics.criticalErrorRate > this.config.alertThresholds.criticalErrorRate,
			severity: 'critical',
			message: 'Critical error rate exceeded threshold',
			enabled: true,
		});

		// Error spike alert
		this.alertRules.push({
			id: 'error-spike',
			name: 'Error Spike Alert',
			condition: (metrics) =>
				metrics.averageErrorsPerHour > this.config.alertThresholds.errorSpikeThreshold,
			severity: 'high',
			message: 'Error spike detected',
			enabled: true,
		});

		// Flow-specific failure alert
		this.alertRules.push({
			id: 'flow-failure',
			name: 'Flow Failure Alert',
			condition: (metrics) => {
				const flowErrors = Object.values(metrics.errorsByFlow);
				return flowErrors.some((count) => count > this.config.alertThresholds.consecutiveFailures);
			},
			severity: 'medium',
			message: 'Multiple failures detected in specific flow',
			enabled: true,
		});
	}

	/**
	 * Start monitoring
	 */
	private startMonitoring(): void {
		if (this.config.enableRealTimeMonitoring && !this.isMonitoring) {
			this.isMonitoring = true;
			this.setupGlobalErrorHandlers();
			this.startMetricsCalculation();
		}
	}

	/**
	 * Setup global error handlers
	 */
	private setupGlobalErrorHandlers(): void {
		// Unhandled errors
		window.addEventListener('error', (event) => {
			this.captureError({
				level: 'error',
				category: 'unhandled-error',
				message: event.message,
				context: {
					filename: event.filename,
					lineno: event.lineno,
					colno: event.colno,
					error: event.error,
				},
				stack: event.error?.stack,
			});
		});

		// Unhandled promise rejections
		window.addEventListener('unhandledrejection', (event) => {
			this.captureError({
				level: 'error',
				category: 'unhandled-rejection',
				message: 'Unhandled Promise Rejection',
				context: {
					reason: event.reason,
					promise: event.promise,
				},
			});
		});

		// Console error monitoring
		const originalConsoleError = console.error;
		console.error = (...args) => {
			this.captureError({
				level: 'error',
				category: 'console-error',
				message: args.join(' '),
				context: { args },
			});
			originalConsoleError.apply(console, args);
		};
	}

	/**
	 * Start metrics calculation
	 */
	private startMetricsCalculation(): void {
		// Calculate metrics every 5 minutes
		setInterval(
			() => {
				this.calculateMetrics();
				this.checkAlerts();
			},
			5 * 60 * 1000
		);
	}

	/**
	 * Capture error event
	 */
	captureError(errorData: {
		level: 'info' | 'warning' | 'error' | 'critical';
		category: string;
		message: string;
		context?: any;
		stack?: string;
		flowName?: string;
		userId?: string;
		sessionId?: string;
	}): void {
		const errorEvent: ErrorEvent = {
			id: this.generateErrorId(),
			timestamp: Date.now(),
			...errorData,
		};

		this.errorHistory.push(errorEvent);
		this.cleanupOldErrors();

		// Log error
		console.error(
			`[Error Monitoring] ${errorData.level.toUpperCase()}: ${errorData.message}`,
			errorData.context
		);

		// Check for immediate alerts
		if (errorData.level === 'critical') {
			this.triggerImmediateAlert(errorEvent);
		}
	}

	/**
	 * Generate unique error ID
	 */
	private generateErrorId(): string {
		return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	/**
	 * Cleanup old errors
	 */
	private cleanupOldErrors(): void {
		const cutoffTime = Date.now() - this.config.retentionPeriod;
		this.errorHistory = this.errorHistory.filter((error) => error.timestamp > cutoffTime);

		// Limit history size
		if (this.errorHistory.length > this.config.maxErrorHistory) {
			this.errorHistory = this.errorHistory.slice(-this.config.maxErrorHistory);
		}
	}

	/**
	 * Calculate error metrics
	 */
	private calculateMetrics(): void {
		const now = Date.now();
		const oneHourAgo = now - 60 * 60 * 1000;
		const recentErrors = this.errorHistory.filter((error) => error.timestamp > oneHourAgo);

		const errorsByLevel: Record<string, number> = {};
		const errorsByCategory: Record<string, number> = {};
		const errorsByFlow: Record<string, number> = {};

		recentErrors.forEach((error) => {
			errorsByLevel[error.level] = (errorsByLevel[error.level] || 0) + 1;
			errorsByCategory[error.category] = (errorsByCategory[error.category] || 0) + 1;
			if (error.flowName) {
				errorsByFlow[error.flowName] = (errorsByFlow[error.flowName] || 0) + 1;
			}
		});

		const totalErrors = recentErrors.length;
		const criticalErrors = errorsByLevel.critical || 0;
		const criticalErrorRate = totalErrors > 0 ? criticalErrors / totalErrors : 0;
		const averageErrorsPerHour = totalErrors;

		this.metrics = {
			totalErrors,
			errorsByLevel,
			errorsByCategory,
			errorsByFlow,
			averageErrorsPerHour,
			criticalErrorRate,
			lastErrorTime:
				this.errorHistory.length > 0
					? this.errorHistory[this.errorHistory.length - 1].timestamp
					: 0,
		};
	}

	/**
	 * Check alerts
	 */
	private checkAlerts(): void {
		if (!this.metrics || !this.config.enableAlerting) return;

		this.alertRules.forEach((rule) => {
			if (rule.enabled && rule.condition(this.metrics)) {
				this.triggerAlert(rule);
			}
		});
	}

	/**
	 * Trigger immediate alert for critical errors
	 */
	private triggerImmediateAlert(error: ErrorEvent): void {
		console.error(`[CRITICAL ALERT] ${error.message}`, error.context);
		console.log(`[${new Date().toISOString()}] [⚠️ ERROR-HANDLER] Critical error detected: ${error.message}`);

		// In a real implementation, this would send alerts to monitoring systems
		// For now, we'll log to console
	}

	/**
	 * Trigger alert
	 */
	private triggerAlert(rule: AlertRule): void {
		console.warn(`[ALERT] ${rule.name}: ${rule.message}`, this.metrics);

		// In a real implementation, this would send alerts to monitoring systems
		// For now, we'll log to console
	}

	/**
	 * Get error metrics
	 */
	getMetrics(): ErrorMetrics | null {
		return this.metrics;
	}

	/**
	 * Get error history
	 */
	getErrorHistory(): ErrorEvent[] {
		return this.errorHistory;
	}

	/**
	 * Get recent errors
	 */
	getRecentErrors(hours: number = 1): ErrorEvent[] {
		const cutoffTime = Date.now() - hours * 60 * 60 * 1000;
		return this.errorHistory.filter((error) => error.timestamp > cutoffTime);
	}

	/**
	 * Get errors by flow
	 */
	getErrorsByFlow(flowName: string): ErrorEvent[] {
		return this.errorHistory.filter((error) => error.flowName === flowName);
	}

	/**
	 * Get errors by level
	 */
	getErrorsByLevel(level: string): ErrorEvent[] {
		return this.errorHistory.filter((error) => error.level === level);
	}

	/**
	 * Add custom alert rule
	 */
	addAlertRule(rule: AlertRule): void {
		this.alertRules.push(rule);
		console.log(`[Error Monitoring] Added alert rule: ${rule.name}`);
	}

	/**
	 * Remove alert rule
	 */
	removeAlertRule(ruleId: string): void {
		this.alertRules = this.alertRules.filter((rule) => rule.id !== ruleId);
		console.log(`[Error Monitoring] Removed alert rule: ${ruleId}`);
	}

	/**
	 * Get health status
	 */
	getHealthStatus(): {
		overall: 'healthy' | 'warning' | 'critical';
		metrics: ErrorMetrics | null;
		recentErrors: number;
		criticalErrors: number;
	} {
		if (!this.metrics) {
			return {
				overall: 'warning',
				metrics: null,
				recentErrors: 0,
				criticalErrors: 0,
			};
		}

		const recentErrors = this.getRecentErrors(1).length;
		const criticalErrors = this.metrics.errorsByLevel.critical || 0;

		let overall: 'healthy' | 'warning' | 'critical' = 'healthy';
		if (criticalErrors > 0) {
			overall = 'critical';
		} else if (recentErrors > 5) {
			overall = 'warning';
		}

		return {
			overall,
			metrics: this.metrics,
			recentErrors,
			criticalErrors,
		};
	}

	/**
	 * Clear error history
	 */
	clearErrorHistory(): void {
		this.errorHistory = [];
		this.metrics = null;
		console.log('[Error Monitoring] Error history cleared');
	}

	/**
	 * Export error data
	 */
	exportErrorData(): string {
		return JSON.stringify(
			{
				config: this.config,
				metrics: this.metrics,
				errorHistory: this.errorHistory,
				alertRules: this.alertRules,
				exportedAt: Date.now(),
			},
			null,
			2
		);
	}
}

// Export singleton instance
export const errorMonitoring = new ErrorMonitoring();
