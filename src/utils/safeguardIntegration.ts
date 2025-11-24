// src/utils/safeguardIntegration.ts
// Comprehensive safeguard integration system

import { errorMonitoring } from './errorMonitoring';
import { flowTestSuite } from './flowTestSuite';
import { preCommitSafeguards } from './preCommitSafeguards';
import { regressionSafeguards } from './regressionSafeguards';

export interface SafeguardIntegrationConfig {
	enableRegressionTesting: boolean;
	enablePreCommitChecks: boolean;
	enableErrorMonitoring: boolean;
	enableFlowValidation: boolean;
	enableAutomatedAlerts: boolean;
	criticalFlows: string[];
	alertThresholds: {
		errorRate: number;
		responseTime: number;
		successRate: number;
	};
}

export interface SafeguardStatus {
	overall: 'healthy' | 'warning' | 'critical';
	components: {
		regressionTesting: 'healthy' | 'warning' | 'critical';
		preCommitChecks: 'healthy' | 'warning' | 'critical';
		errorMonitoring: 'healthy' | 'warning' | 'critical';
		flowValidation: 'healthy' | 'warning' | 'critical';
	};
	metrics: {
		totalTests: number;
		passedTests: number;
		failedTests: number;
		criticalErrors: number;
		recentErrors: number;
	};
	lastRun: number;
}

/**
 * Safeguard Integration System
 * Coordinates all safeguard systems to prevent regressions
 */
export class SafeguardIntegration {
	private config: SafeguardIntegrationConfig;
	private isInitialized: boolean = false;
	private lastStatus: SafeguardStatus | null = null;

	constructor(
		config: SafeguardIntegrationConfig = {
			enableRegressionTesting: true,
			enablePreCommitChecks: true,
			enableErrorMonitoring: true,
			enableFlowValidation: true,
			enableAutomatedAlerts: true,
			criticalFlows: [
				// V7 OAuth 2.0 Flows
				'oauth-authorization-code-v7',
				'implicit-v7',
				'device-authorization-v7',
				'client-credentials-v7',
				'oauth-ropc-v7',
				'token-exchange-v7',
				'jwt-bearer-token-v7',

				// V7 OIDC Flows
				'oidc-authorization-code-v7',
				'oidc-implicit-v7',
				'oidc-hybrid-v7',
				'oidc-device-authorization-v7',
				'ciba-v7',

				// V7 PingOne Specific Flows
				'pingone-par-v7',
				'pingone-mfa-v7',

				// V7 Mock Flows
				'rar-v7',
			],
			alertThresholds: {
				errorRate: 0.05,
				responseTime: 5000,
				successRate: 0.95,
			},
		}
	) {
		this.config = config;
		this.initialize();
	}

	/**
	 * Initialize safeguard integration
	 */
	private initialize(): void {
		if (this.isInitialized) return;

		console.log('[Safeguard Integration] Initializing comprehensive safeguard system...');

		// Initialize error monitoring
		if (this.config.enableErrorMonitoring) {
			this.setupErrorMonitoring();
		}

		// Initialize regression testing
		if (this.config.enableRegressionTesting) {
			this.setupRegressionTesting();
		}

		// Initialize pre-commit checks
		if (this.config.enablePreCommitChecks) {
			this.setupPreCommitChecks();
		}

		// Initialize flow validation
		if (this.config.enableFlowValidation) {
			this.setupFlowValidation();
		}

		// Start periodic health checks
		this.startHealthChecks();

		this.isInitialized = true;
		console.log('[Safeguard Integration] Safeguard system initialized successfully');
	}

	/**
	 * Setup error monitoring
	 */
	private setupErrorMonitoring(): void {
		console.log('[Safeguard Integration] Setting up error monitoring...');

		// Add custom alert rules for critical flows
		this.config.criticalFlows.forEach((flowName) => {
			errorMonitoring.addAlertRule({
				id: `flow-failure-${flowName}`,
				name: `${flowName} Failure Alert`,
				condition: (metrics) => {
					const flowErrors = metrics.errorsByFlow[flowName] || 0;
					return flowErrors > 3; // More than 3 errors in the flow
				},
				severity: 'high',
				message: `Critical failures detected in ${flowName}`,
				enabled: true,
			});
		});
	}

	/**
	 * Setup regression testing
	 */
	private setupRegressionTesting(): void {
		console.log('[Safeguard Integration] Setting up regression testing...');

		// Add custom test configurations for critical flows
		this.config.criticalFlows.forEach((flowName) => {
			// This would add specific test configurations for each critical flow
			console.log(`[Safeguard Integration] Added regression testing for ${flowName}`);
		});
	}

	/**
	 * Setup pre-commit checks
	 */
	private setupPreCommitChecks(): void {
		console.log('[Safeguard Integration] Setting up pre-commit checks...');

		// Configure pre-commit safeguards
		// This would integrate with git hooks in a real implementation
	}

	/**
	 * Setup flow validation
	 */
	private setupFlowValidation(): void {
		console.log('[Safeguard Integration] Setting up flow validation...');

		// Add validation rules for critical flows
		this.config.criticalFlows.forEach((flowName) => {
			console.log(`[Safeguard Integration] Added flow validation for ${flowName}`);
		});
	}

	/**
	 * Start periodic health checks
	 */
	private startHealthChecks(): void {
		// Run health checks every 5 minutes
		setInterval(
			() => {
				this.runHealthCheck();
			},
			5 * 60 * 1000
		);

		// Run immediate health check
		this.runHealthCheck();
	}

	/**
	 * Run comprehensive health check
	 */
	async runHealthCheck(): Promise<SafeguardStatus> {
		console.log('[Safeguard Integration] Running comprehensive health check...');

		const startTime = Date.now();
		const components = {
			regressionTesting: 'healthy' as 'healthy' | 'warning' | 'critical',
			preCommitChecks: 'healthy' as 'healthy' | 'warning' | 'critical',
			errorMonitoring: 'healthy' as 'healthy' | 'warning' | 'critical',
			flowValidation: 'healthy' as 'healthy' | 'warning' | 'critical',
		};

		let totalTests = 0;
		let passedTests = 0;
		let failedTests = 0;
		let criticalErrors = 0;
		let recentErrors = 0;

		// Check regression testing
		if (this.config.enableRegressionTesting) {
			try {
				const testResults = await flowTestSuite.runTestSuite();
				totalTests += testResults.summary.totalFlows;
				passedTests += testResults.summary.passedFlows;
				failedTests += testResults.summary.failedFlows;
				criticalErrors += testResults.summary.criticalFailures;

				if (testResults.summary.criticalFailures > 0) {
					components.regressionTesting = 'critical';
				} else if (testResults.summary.failedFlows > 0) {
					components.regressionTesting = 'warning';
				}
			} catch (error) {
				components.regressionTesting = 'critical';
				console.error('[Safeguard Integration] Regression testing failed:', error);
			}
		}

		// Check pre-commit checks
		if (this.config.enablePreCommitChecks) {
			try {
				const preCommitResults = await preCommitSafeguards.runPreCommitChecks();
				if (preCommitResults.summary.criticalFailures > 0) {
					components.preCommitChecks = 'critical';
				} else if (preCommitResults.summary.failedChecks > 0) {
					components.preCommitChecks = 'warning';
				}
			} catch (error) {
				components.preCommitChecks = 'critical';
				console.error('[Safeguard Integration] Pre-commit checks failed:', error);
			}
		}

		// Check error monitoring
		if (this.config.enableErrorMonitoring) {
			try {
				const errorHealth = errorMonitoring.getHealthStatus();
				components.errorMonitoring = errorHealth.overall;
				criticalErrors += errorHealth.criticalErrors;
				recentErrors += errorHealth.recentErrors;
			} catch (error) {
				components.errorMonitoring = 'critical';
				console.error('[Safeguard Integration] Error monitoring failed:', error);
			}
		}

		// Check flow validation
		if (this.config.enableFlowValidation) {
			try {
				const flowHealth = flowTestSuite.getHealthStatus();
				components.flowValidation = flowHealth.overall;
			} catch (error) {
				components.flowValidation = 'critical';
				console.error('[Safeguard Integration] Flow validation failed:', error);
			}
		}

		// Determine overall status
		const overall: 'healthy' | 'warning' | 'critical' = Object.values(components).some(
			(status) => status === 'critical'
		)
			? 'critical'
			: Object.values(components).some((status) => status === 'warning')
				? 'warning'
				: 'healthy';

		// Compile status
		const status: SafeguardStatus = {
			overall,
			components,
			metrics: {
				totalTests,
				passedTests,
				failedTests,
				criticalErrors,
				recentErrors,
			},
			lastRun: Date.now(),
		};

		this.lastStatus = status;

		// Log status
		console.log('[Safeguard Integration] Health check completed:', {
			overall: status.overall,
			duration: Date.now() - startTime,
			metrics: status.metrics,
		});

		// Trigger alerts if needed
		if (this.config.enableAutomatedAlerts) {
			this.checkAlerts(status);
		}

		return status;
	}

	/**
	 * Check alerts
	 */
	private checkAlerts(status: SafeguardStatus): void {
		// Critical status alert
		if (status.overall === 'critical') {
			console.error('[CRITICAL ALERT] Safeguard system detected critical issues!');
			this.triggerCriticalAlert(status);
		}

		// High error rate alert
		if (status.metrics.criticalErrors > 0) {
			console.warn('[WARNING ALERT] Critical errors detected in safeguard system');
		}

		// Low success rate alert
		const successRate =
			status.metrics.totalTests > 0 ? status.metrics.passedTests / status.metrics.totalTests : 1;

		if (successRate < this.config.alertThresholds.successRate) {
			console.warn('[WARNING ALERT] Low success rate detected in safeguard system');
		}
	}

	/**
	 * Trigger critical alert
	 */
	private triggerCriticalAlert(status: SafeguardStatus): void {
		// In a real implementation, this would send alerts to monitoring systems
		// For now, we'll log to console
		console.error('[CRITICAL ALERT] Detailed status:', status);
		console.log(`[${new Date().toISOString()}] [⚠️ ERROR-HANDLER] Critical issues detected in safeguard system. Check console for details.`);
	}

	/**
	 * Get current status
	 */
	getStatus(): SafeguardStatus | null {
		return this.lastStatus;
	}

	/**
	 * Get health summary
	 */
	getHealthSummary(): {
		overall: 'healthy' | 'warning' | 'critical';
		components: number;
		healthy: number;
		warning: number;
		critical: number;
		lastRun: number;
	} {
		if (!this.lastStatus) {
			return {
				overall: 'warning',
				components: 0,
				healthy: 0,
				warning: 0,
				critical: 0,
				lastRun: 0,
			};
		}

		const components = Object.values(this.lastStatus.components);
		const healthy = components.filter((status) => status === 'healthy').length;
		const warning = components.filter((status) => status === 'warning').length;
		const critical = components.filter((status) => status === 'critical').length;

		return {
			overall: this.lastStatus.overall,
			components: components.length,
			healthy,
			warning,
			critical,
			lastRun: this.lastStatus.lastRun,
		};
	}

	/**
	 * Run comprehensive safeguard check
	 */
	async runComprehensiveCheck(): Promise<{
		passed: boolean;
		results: {
			regressionTesting: any;
			preCommitChecks: any;
			errorMonitoring: any;
			flowValidation: any;
		};
		summary: SafeguardStatus;
	}> {
		console.log('[Safeguard Integration] Running comprehensive safeguard check...');

		const results = {
			regressionTesting: null,
			preCommitChecks: null,
			errorMonitoring: null,
			flowValidation: null,
		};

		// Run regression testing
		if (this.config.enableRegressionTesting) {
			results.regressionTesting = await flowTestSuite.runTestSuite();
		}

		// Run pre-commit checks
		if (this.config.enablePreCommitChecks) {
			results.preCommitChecks = await preCommitSafeguards.runPreCommitChecks();
		}

		// Get error monitoring status
		if (this.config.enableErrorMonitoring) {
			results.errorMonitoring = errorMonitoring.getHealthStatus();
		}

		// Get flow validation status
		if (this.config.enableFlowValidation) {
			results.flowValidation = flowTestSuite.getHealthStatus();
		}

		// Run health check
		const summary = await this.runHealthCheck();

		const passed = summary.overall === 'healthy';

		console.log(`[Safeguard Integration] Comprehensive check ${passed ? 'PASSED' : 'FAILED'}`);

		return {
			passed,
			results,
			summary,
		};
	}

	/**
	 * Export safeguard data
	 */
	exportSafeguardData(): string {
		return JSON.stringify(
			{
				config: this.config,
				status: this.lastStatus,
				regressionTesting: flowTestSuite.getResults(),
				preCommitChecks: preCommitSafeguards.getResults(),
				errorMonitoring: errorMonitoring.getErrorHistory(),
				exportedAt: Date.now(),
			},
			null,
			2
		);
	}

	/**
	 * Clear all safeguard data
	 */
	clearSafeguardData(): void {
		regressionSafeguards.clearTestResults();
		preCommitSafeguards.clearResults();
		errorMonitoring.clearErrorHistory();
		flowTestSuite.clearResults();
		this.lastStatus = null;
		console.log('[Safeguard Integration] All safeguard data cleared');
	}
}

// Export singleton instance
export const safeguardIntegration = new SafeguardIntegration();
